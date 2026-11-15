const { migrateCatalog } = require('./catalogMigration');
const { migrateResourceDetails } = require('./resourceDetailsMigration');
const fs = require('fs');
const path = require('path');

const { migrateEmail } = require('./emailMigration');
const { migrateGaps } = require('./gapMigration');
const {migrateNotificationReads}=require('./notificationMigration');

const VERSION = '20261018_01_consistent_runtime';
async function runMigrations(connection) {
  const [[lock]] = await connection.query("SELECT GET_LOCK('faculty_reservation_schema', 30) AS acquired");
  if (Number(lock.acquired) !== 1) throw new Error('Another schema migration is running');
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    const [[applied]] = await connection.query('SELECT version FROM schema_migrations WHERE version = ?', [VERSION]);
    if (applied) { await migrateEmail(connection); await migrateResourceDetails(connection); await migrateCatalog(connection); await migrateGaps(connection); await migrateNotificationReads(connection); return; }
    const schema = fs.readFileSync(path.join(__dirname, '../../../database/schema.sql'), 'utf8');
    const tables = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\) ENGINE[\s\S]*?;/g)];
    for (const table of tables) await connection.query(table[0]);
    // I add missing columns from the schema without deleting existing records.
    // I check what already exists so a failed migration can run again.
    for (const table of tables) {
      const [columns] = await connection.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [table[1]]);
      const existing = new Set(columns.map(c => c.COLUMN_NAME));
      for (const line of table[2].split('\n')) {
        const match = /^\s*(\w+)\s+((?:INT|VARCHAR|TEXT|LONGTEXT|ENUM|BOOLEAN|TIMESTAMP|DATETIME|TIME|DATE|JSON)\b.*)/i.exec(line);
        if (!match || existing.has(match[1])) continue;
        const definition = match[2].replace(/,\s*$/, '').trim();
        await connection.query(`ALTER TABLE \`${table[1]}\` ADD COLUMN \`${match[1]}\` ${definition}`);
      }
    }
    await connection.query('ALTER TABLE help_requests MODIFY user_id INT NULL');
    const indexes = [
      ['reservations','idx_reservations_resource_time','resource_id, start_time, end_time'],
      ['reservations','idx_reservations_user_status','user_id, status'],
      ['notifications','idx_notifications_user_read','user_id, is_read'],
      ['password_reset_tokens','idx_reset_token','token']
    ];
    for (const [table, name, fields] of indexes) {
      const [[exists]] = await connection.query('SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1', [table,name]);
      if (!exists) await connection.query(`CREATE INDEX \`${name}\` ON \`${table}\` (${fields})`);
    }
    // I use the same notification triggers for new and existing databases.
    for (const trigger of schema.matchAll(/CREATE TRIGGER (\w+)([\s\S]*?)END\s*\/\//g)) {
      await connection.query(`DROP TRIGGER IF EXISTS \`${trigger[1]}\``);
      await connection.query(`CREATE TRIGGER ${trigger[1]}${trigger[2]}END`);
    }
    await migrateEmail(connection);
    await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [VERSION]);
    await migrateResourceDetails(connection); await migrateCatalog(connection); await migrateGaps(connection); await migrateNotificationReads(connection);
  } finally {
    await connection.query("SELECT RELEASE_LOCK('faculty_reservation_schema')");
  }
}
module.exports = { runMigrations, VERSION };

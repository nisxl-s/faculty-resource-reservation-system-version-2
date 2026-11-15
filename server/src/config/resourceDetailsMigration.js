const VERSION = '20261018_02_resource_details';
async function migrateResourceDetails(connection) {
  const [[applied]] = await connection.query('SELECT version FROM schema_migrations WHERE version = ?', [VERSION]);
  if (applied) return;
  for (const [table, column, definition] of [['resources','details','JSON DEFAULT NULL'],['reservations','attendees','INT DEFAULT NULL']]) {
    const [[exists]] = await connection.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table,column]);
    if (!exists) await connection.query('ALTER TABLE ?? ADD COLUMN ?? ' + definition, [table,column]);
  }
  await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [VERSION]);
}
module.exports = { migrateResourceDetails };

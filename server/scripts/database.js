const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { runMigrations } = require('../src/config/migrations');
async function main() {
  const database = process.env.DB_NAME || 'faculty_reservation';
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('DB_NAME may contain letters, numbers and underscores only');
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', timezone: '+05:30' });
  try {
    if (process.argv.includes('--create-database')) await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${database}\``);
    await runMigrations(connection);
    console.log('Database migrations are up to date');
  } finally { await connection.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

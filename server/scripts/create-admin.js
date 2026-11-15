const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool, initializeTables } = require('../src/config/database');
const bcrypt = require('bcryptjs');
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Set ADMIN_EMAIL to the intended administrator email');
  await initializeTables();
  const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    if (!process.argv.includes('--promote')) throw new Error('Account exists. Use --promote explicitly to grant administrator access');
    await pool.query("UPDATE users SET role = 'admin', token_version = token_version + 1 WHERE id = ?", [existing.id]);
  } else {
    if (!password || password.length < 8 || !/\d/.test(password)) throw new Error('Set ADMIN_PASSWORD to at least 8 characters including a number');
    const hash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'admin')", [process.env.ADMIN_NAME || 'Administrator',email,hash]);
  }
  console.log('Administrator provisioned. Sign in to obtain a fresh session.');
}
main().catch(error => { console.error(error.message); process.exitCode=1; }).finally(()=>pool.end());

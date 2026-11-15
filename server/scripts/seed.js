const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool, initializeTables } = require('../src/config/database');
const bcrypt = require('bcryptjs');
async function main() {
  if (process.env.NODE_ENV !== 'development') throw new Error('Demo seed is restricted to development');
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8 || !/\d/.test(password)) throw new Error('Set SEED_PASSWORD to at least 8 characters including a number');
  await initializeTables();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const role of ['student','faculty']) {
      await connection.query('INSERT INTO users (full_name,email,password,role) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)',
        [`Demo ${role}`,`${role}@demo.example`,await bcrypt.hash(password,10),role,`${role}@demo.example`]);
    }
    await connection.commit();
    console.log('Development demo records created; existing accounts/passwords were not overwritten.');
  } catch(error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>pool.end());

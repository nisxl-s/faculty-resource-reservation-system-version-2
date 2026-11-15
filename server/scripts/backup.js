const fs=require('fs/promises'),path=require('path'),zlib=require('zlib');
async function capture(connection) {
  const snapshot={format:'faculty-reservation-backup-v1',created_at:new Date().toISOString(),tables:[],triggers:[]};
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
  try {
    const [tables]=await connection.query("SHOW FULL TABLES WHERE Table_type='BASE TABLE'");
    for(const row of tables) {const name=Object.values(row)[0];const [[definition]]=await connection.query('SHOW CREATE TABLE ??',[name]);const [rows]=await connection.query('SELECT * FROM ??',[name]);snapshot.tables.push({name,create:definition['Create Table'],rows});}
    const [triggers]=await connection.query('SHOW TRIGGERS');
    snapshot.triggers=triggers.map(t=>'CREATE TRIGGER '+connection.escapeId(t.Trigger)+' '+t.Timing+' '+t.Event+' ON '+connection.escapeId(t.Table)+' FOR EACH ROW '+t.Statement);
    await connection.commit();return snapshot;
  } catch(error){await connection.rollback();throw error;}
}
async function restoreEmpty(connection,snapshot) {
  if(snapshot.format!=='faculty-reservation-backup-v1'||!Array.isArray(snapshot.tables))throw Error('Unsupported backup');
  const [existing]=await connection.query('SHOW TABLES');if(existing.length)throw Error('Restore requires a completely empty database');
  await connection.query('SET FOREIGN_KEY_CHECKS=0');
  try {
    for(const table of snapshot.tables) await connection.query(table.create);
    for(const table of snapshot.tables) for(const row of table.rows) {
      const columns=Object.keys(row);const values=Object.values(row).map(value=>value?.type==='Buffer'&&Array.isArray(value.data)?Buffer.from(value.data):value&&typeof value==='object'?JSON.stringify(value):value);
      await connection.query('INSERT INTO ?? ('+columns.map(()=> '??').join(',')+') VALUES ('+values.map(()=>'?').join(',')+')',[table.name,...columns,...values]);
    }
    for(const trigger of snapshot.triggers||[])await connection.query(trigger);
  }finally{await connection.query('SET FOREIGN_KEY_CHECKS=1');}
}
async function main(){
  require('dotenv').config({path:path.join(__dirname,'../.env')});const mysql=require('mysql2/promise');
  const target=process.argv[2]==='--restore'?process.argv[4]:process.env.DB_NAME||'faculty_reservation';
  if(!target||!/^\w+$/.test(target))throw Error('Provide a valid database name');
  const connection=await mysql.createConnection({host:process.env.DB_HOST||'localhost',user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:target,dateStrings:true,timezone:'+05:30'});
  try {await connection.query("SET time_zone='+05:30'");
    if(process.argv[2]==='--restore'){const snapshot=JSON.parse(zlib.gunzipSync(await fs.readFile(path.resolve(process.argv[3]))).toString('utf8'));await restoreEmpty(connection,snapshot);console.log('Backup restored into empty database '+target);}
    else {const snapshot=await capture(connection);const directory=path.resolve(__dirname,'../../.runtime/backups');await fs.mkdir(directory,{recursive:true});const filename=path.join(directory,'reservation-'+Date.now()+'.json.gz');await fs.writeFile(filename,zlib.gzipSync(JSON.stringify(snapshot)),{flag:'wx',mode:0o600});console.log('Backup saved: '+filename);}
  }finally{await connection.end();}
}
if(require.main===module)main().catch(error=>{console.error('Backup operation failed:',error.code||error.message);process.exitCode=1;});
module.exports={capture,restoreEmpty};

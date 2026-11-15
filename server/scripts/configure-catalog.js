const path=require('path'),fs=require('fs');
require('dotenv').config({path:path.join(__dirname,'../.env')});
const {pool,initializeTables}=require('../src/config/database');
const {catalogSeed}=require('../src/config/catalogSeed');
const VERSION='20261018_04_usj_catalog';
async function main(){
 await initializeTables();const db=await pool.getConnection();
 try{
  await db.query("SELECT GET_LOCK('faculty_catalog_seed',30) AS acquired").then(([rows])=>{if(Number(rows[0].acquired)!==1)throw Error('Catalogue is busy');});
  const [[done]]=await db.query('SELECT version FROM schema_migrations WHERE version=?',[VERSION]);if(done){console.log('USJ catalogue already configured.');return;}
  const [resources]=await db.query('SELECT * FROM resources');
  const [reservations]=await db.query('SELECT * FROM reservations');
  const backup=path.join(__dirname,'../../.runtime/catalog-backup-'+Date.now()+'.json');fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,JSON.stringify({resources,reservations},null,2),{flag:'wx'});
  await db.beginTransaction();
  await db.query("UPDATE resources SET is_archived=1,status='unavailable'");
  const ids=new Map();
  for(const row of catalogSeed()){
   const {parent_asset_code,...data}=row;data.details=JSON.stringify(data.details);if(parent_asset_code)data.parent_resource_id=ids.get(parent_asset_code);
   const [result]=await db.query('INSERT INTO resources SET ?',data);ids.set(data.asset_code,result.insertId);
  }
  await db.query('INSERT INTO schema_migrations (version) VALUES (?)',[VERSION]);await db.commit();
  console.log('Configured '+ids.size+' resources in 11 faculties. Old catalogue archived; reservation history preserved. Backup: '+backup);
 }catch(e){await db.rollback();throw e;}finally{await db.query("SELECT RELEASE_LOCK('faculty_catalog_seed')");db.release();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>pool.end());

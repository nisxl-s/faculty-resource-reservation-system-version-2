const faculties = require('./faculties.json');
const VERSION = '20261018_03_faculty_catalog';
async function migrateCatalog(connection) {
 const [[applied]]=await connection.query('SELECT version FROM schema_migrations WHERE version=?',[VERSION]);
 if(applied) return;
 await connection.query(`CREATE TABLE IF NOT EXISTS faculties (code VARCHAR(12) PRIMARY KEY, name VARCHAR(160) UNIQUE NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
 for(const f of faculties) await connection.query('INSERT INTO faculties (code,name) VALUES (?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)',[f.code,f.name]);
 const columns={faculty_code:'VARCHAR(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL',asset_code:'VARCHAR(80) NULL',floor:'VARCHAR(40) NULL',sharing_scope:"ENUM('faculty','campus') NOT NULL DEFAULT 'faculty'",parent_resource_id:'INT NULL',computer_count:'INT NULL',is_sample:'BOOLEAN NOT NULL DEFAULT FALSE',is_archived:'BOOLEAN NOT NULL DEFAULT FALSE'};
 for(const [column,definition] of Object.entries(columns)) {
  const [[exists]]=await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='resources' AND COLUMN_NAME=?",[column]);
  if(!exists) await connection.query('ALTER TABLE resources ADD COLUMN ?? '+definition,[column]);
 }
 const indexes=[['uq_resource_asset_code','UNIQUE INDEX uq_resource_asset_code (asset_code)'],['idx_resource_faculty','INDEX idx_resource_faculty (faculty_code,is_archived)']];
 for(const [name,ddl] of indexes) {
  const [[exists]]=await connection.query("SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='resources' AND INDEX_NAME=?",[name]);
  if(!exists) await connection.query('ALTER TABLE resources ADD '+ddl);
 }
 for(const [name,ddl] of [['fk_resource_faculty','FOREIGN KEY (faculty_code) REFERENCES faculties(code)'],['fk_resource_parent','FOREIGN KEY (parent_resource_id) REFERENCES resources(id) ON DELETE RESTRICT']]) {
  const [[exists]]=await connection.query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='resources' AND CONSTRAINT_NAME=?",[name]);
  if(!exists) { if(name==='fk_resource_faculty') await connection.query('ALTER TABLE resources MODIFY faculty_code VARCHAR(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL'); await connection.query('ALTER TABLE resources ADD CONSTRAINT '+name+' '+ddl); }
 }
 await connection.query('INSERT INTO schema_migrations (version) VALUES (?)',[VERSION]);
}
module.exports={migrateCatalog};



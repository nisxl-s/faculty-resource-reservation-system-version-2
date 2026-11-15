const {test}=require('node:test');const assert=require('node:assert/strict');
const {catalogSeed}=require('../src/config/catalogSeed');const {normalizeCatalog,validateParent}=require('../src/utils/catalog');
test('USJ catalogue has eleven faculties and exact Computing capacity and floor assignments',()=>{
 const rows=catalogSeed();assert.equal(new Set(rows.map(r=>r.faculty_code)).size,11);assert.equal(rows.length,88);assert.equal(new Set(rows.map(r=>r.asset_code)).size,rows.length);
 for(let n=1;n<=9;n++){const r=rows.find(r=>r.asset_code==='FOC-ISH-'+String(n).padStart(2,'0'));assert.equal(r.capacity,[7,9].includes(n)?50:20);assert.equal(r.floor,n<=2?'Ground floor':'Second floor');assert.equal(rows.filter(p=>p.parent_asset_code===r.asset_code).length,1);}
 assert.equal(rows.find(r=>r.asset_code==='FOC-LAB-01').computer_count,100);assert.equal(rows.find(r=>r.asset_code==='FOC-RAAP').capacity,200);assert.equal(rows.find(r=>r.asset_code==='FOC-RAAP').floor,'Outside second floor');
 for(const code of new Set(rows.map(r=>r.faculty_code)))if(code!=='FOC'){const halls=rows.filter(r=>r.faculty_code===code&&r.type==='classroom');assert.equal(halls.length,2);assert.ok(halls.every(r=>r.is_sample));}
 for(const r of rows)assert.doesNotThrow(()=>normalizeCatalog(r));
});
test('catalogue rejects invalid ownership, location, counts and equipment assignments',async()=>{
 const row=catalogSeed()[0];for(const changes of [{faculty_code:'BAD'},{asset_code:'bad code'},{floor:'Unknown'},{sharing_scope:'campus'},{computer_count:-1},{computer_count:20},{parent_resource_id:1},{capacity:0},{building:''}])assert.throws(()=>normalizeCatalog({...row,...changes}));
 const db={query:async()=>[[{...row,id:1,is_archived:0}]]};
 await assert.rejects(()=>validateParent(db,{...row,type:'equipment',faculty_code:'FAS',parent_resource_id:1}));
 await assert.rejects(()=>validateParent(db,{...row,type:'equipment',floor:'Second floor',parent_resource_id:1}));
 await assert.doesNotReject(()=>validateParent(db,{...row,type:'equipment',parent_resource_id:1}));
});

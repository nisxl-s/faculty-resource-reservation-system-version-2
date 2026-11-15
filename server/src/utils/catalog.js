const faculties=require('../config/faculties.json');
const {httpError}=require('./httpError');
const floors=['Ground floor','First floor','Second floor','Outside second floor','Other'];
function normalizeCatalog(data) {
 const text=(key,max)=>{const value=data[key];if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw httpError(400,key+' is required (maximum '+max+' characters)');return value.trim();};
 const faculty_code=text('faculty_code',12);
 if(!faculties.some(f=>f.code===faculty_code)) throw httpError(400,'Select a valid faculty');
 const asset_code=text('asset_code',80).toUpperCase();
 if(!/^[A-Z0-9][A-Z0-9_-]*$/.test(asset_code)) throw httpError(400,'Asset code must use letters, digits, underscores or hyphens');
 const floor=text('floor',40);if(!floors.includes(floor)) throw httpError(400,'Select a valid floor');
 const sharing_scope=data.sharing_scope||'faculty';
 if(!['faculty','campus'].includes(sharing_scope)||data.type!=='equipment'&&sharing_scope!=='faculty') throw httpError(400,'Only equipment can be shared across campus');
 const integer=(key)=>{const v=data[key];if(v===null||v===undefined||v==='')return null;if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<1||Number(v)>2147483647)throw httpError(400,key+' must be a positive whole number');return Number(v);};
 const parent_resource_id=integer('parent_resource_id'),computer_count=integer('computer_count');
 if(parent_resource_id&&data.type!=='equipment')throw httpError(400,'Only equipment can be assigned to a venue');
 if(computer_count&&data.type!=='lab')throw httpError(400,'Computer count only applies to laboratories');
 if(data.type!=='equipment'&&(!Number.isInteger(Number(data.capacity))||Number(data.capacity)<1))throw httpError(400,'Venue seating capacity is required');
 return {faculty_code,asset_code,floor,sharing_scope,parent_resource_id,computer_count,is_sample:data.is_sample===true||data.is_sample===1,building:text('building',100),location:text('location',255)};
}
async function validateParent(db,data,id=null) {
 if(!data.parent_resource_id)return;
 if(Number(id)===data.parent_resource_id)throw httpError(400,'An asset cannot contain itself');
 const [[parent]]=await db.query('SELECT * FROM resources WHERE id=? AND is_archived=0',[data.parent_resource_id]);
 if(!parent||parent.type==='equipment'||parent.faculty_code!==data.faculty_code)throw httpError(400,'Assigned venue must belong to the same faculty');
 if(parent.building!==data.building||parent.floor!==data.floor||parent.location!==data.location)throw httpError(400,'Assigned equipment must use its venue building, floor and location');
}
module.exports={normalizeCatalog,validateParent,floors};

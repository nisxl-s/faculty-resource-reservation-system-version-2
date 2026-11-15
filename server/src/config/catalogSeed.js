const faculties=require('./faculties.json');
function catalogSeed(){
 const rows=[];
 const add=(f,code,name,type,floor,capacity,sample=false,extra={})=>{const r={faculty_code:f.code,asset_code:code,name,type,building:f.code==='FOC'?'Computing Building':f.code+' Sample Building',floor,location:name,capacity,sharing_scope:'faculty',is_sample:sample,description:sample?'Sample resource.':'Faculty of Computing campus resource.',details:{},...extra};rows.push(r);return r;};
 for(const f of faculties){
  const venues=[];
  if(f.code==='FOC'){
   for(let n=1;n<=9;n++){const name='ISH '+String(n).padStart(2,'0');venues.push(add(f,'FOC-ISH-'+String(n).padStart(2,'0'),name,'classroom',n<=2?'Ground floor':'Second floor',[7,9].includes(n)?50:20));}
   add(f,'FOC-LAB-01','Computing Computer Lab','lab','Ground floor',100,false,{computer_count:100,details:{layout:'fixed_workstations',facilities:'100 computers',usage_notes:'100 workstation places; seating capacity assumed to match computer count.'}});
   venues.push(add(f,'FOC-RAAP','RAAP Auditorium','hall','Outside second floor',200));
  }else for(let n=1;n<=2;n++)venues.push(add(f,f.code+'-LH-0'+n,f.code+' Sample Lecture Hall 0'+n,'classroom',n===1?'Ground floor':'Second floor',30,true));
  for(const venue of venues)add(f,venue.asset_code+'-PROJ',venue.name+' Projector','equipment',venue.floor,null,venue.is_sample,{parent_asset_code:venue.asset_code,location:venue.location,details:{booking_mode:'on_site',asset_tag:venue.asset_code+'-PROJ',condition:'good',usage_notes:'Reserve this projector separately. A room booking does not reserve the projector.'}});
  for(let n=1;n<=2;n++)add(f,f.code+'-RESERVE-PROJ-0'+n,f.code+' Reserve Projector 0'+n,'equipment','Ground floor',null,f.code!=='FOC',{location:f.code+' Equipment Collection Point',details:{booking_mode:'collection',asset_tag:f.code+'-RESERVE-PROJ-0'+n,condition:'good'}});
 }
 for(const [code,name] of [['LAPTOP','Shared Laptop'],['SPEAKER','Portable Speaker'],['MIC','Wireless Microphone Kit'],['CAMERA','Shared Camera'],['SCREEN','Portable Projection Screen']])add(faculties.find(f=>f.code==='FOC'),'CAMPUS-'+code+'-01',name,'equipment','Ground floor',null,true,{sharing_scope:'campus',location:'Computing Equipment Collection Point',details:{booking_mode:'collection',asset_tag:'CAMPUS-'+code+'-01',condition:'good',usage_notes:'Sample inventory available to all faculties. Confirm collection and return with the owning faculty.'}});
 return rows;
}
module.exports={catalogSeed};

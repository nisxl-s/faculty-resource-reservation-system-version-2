const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('availability validates inputs before querying and uses fresh campus-time results',async()=>{
  let calls=[];
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/controllers/resourceController.js'),'utf8'),{
    module,exports:module.exports,console:{error(){}},Number,require(name){
      if(name==='../models/resource')return {findAvailableForTimeSlot:async(...args)=>{calls.push(args);return [{id:2}];}};
      if(name==='express-validator')return {};
      if(name==='../config/cache')return {};
      return require(path.join(__dirname,'../src/controllers',name));
    }
  });
  async function request(query){let status=200,body,headers={};await module.exports.getAvailableForTimeSlot({query},{status(code){status=code;return this;},setHeader(k,v){headers[k]=v;},json(value){body=value;}});return {status,body,headers};}
  const start='2099-11-15T10:00:00',end='2099-11-15T11:00:00';
  for(const attendees of ['0','-1','1.5','abc','9007199254740992']) assert.equal((await request({start_time:start,end_time:end,attendees})).status,400);
  for(const query of [{},{start_time:start},{start_time:start,end_time:start},{start_time:end,end_time:start},{start_time:'2020-01-01T10:00',end_time:'2020-01-01T11:00'}])assert.equal((await request(query)).status,400);
  assert.equal(calls.length,0);
  const result=await request({start_time:start,end_time:end,attendees:'45',type:'hall'});
  assert.equal(result.status,200);assert.equal(result.headers['Cache-Control'],'no-store');
  assert.deepEqual(calls[0],['2099-11-15 10:00:00','2099-11-15 11:00:00','hall',45]);
  assert.equal(result.body.data.resources[0].id,2);
});

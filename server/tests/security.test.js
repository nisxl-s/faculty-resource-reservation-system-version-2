const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { interval } = require('../src/utils/bookingTime');
const { pagination } = require('../src/utils/pagination');

function authModule(user, env = {JWT_SECRET:'unit-test-secret'}) {
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/middleware/auth.js'),'utf8'), {
    module, process:{env}, require(name) {
      if(name==='jsonwebtoken')return jwt;
      if(name==='crypto')return crypto;
      if(name==='dotenv')return {config(){}};
      if(name==='../config/database')return {pool:{query:async()=>[[user]]}};
      throw Error(name);
    }
  });
  return module.exports;
}
test('authentication denies stale, inactive, deleted and changed-role identities',async()=>{
  const claims={id:1,role:'faculty',version:2};
  const token=jwt.sign(claims,'unit-test-secret');
  async function verify(user, bearer=token) {
    const result={};
    const res={status(code){result.status=code;return this;},json(body){result.body=body;return this;}};
    const req={header:()=> 'Bearer '+bearer};
    await authModule(user).verifyToken(req,res,error=>{result.next=error||true;});
    return result;
  }
  const current={id:1,role:'faculty',is_active:1,token_version:2,email:'updated@example.test'};
  assert.equal((await verify(current)).next,true);
  for(const user of [undefined,{...current,is_active:0},{...current,token_version:3},{...current,role:'student'}])assert.equal((await verify(user)).status,401);
  assert.equal((await verify(current,jwt.sign({id:1,role:'faculty'},'unit-test-secret'))).status,401);
  assert.equal((await verify(current,jwt.sign(claims,'wrong-secret'))).status,401);
});
test('production cannot boot with a missing or example JWT secret',()=>{
  for(const value of [undefined,'short','your-super-secret-jwt-key-change-this-in-production'])assert.throws(()=>authModule(null,{NODE_ENV:'production',JWT_SECRET:value}),/Production requires/);
  assert.ok(authModule(null,{NODE_ENV:'production',JWT_SECRET:crypto.randomBytes(48).toString('hex')}).JWT_SECRET);
});
test('campus intervals normalize offsets and reject invalid, reversed and past dates',()=>{
  const result=interval('2035-01-01T10:00:00','2035-01-01T11:00:00');
  assert.equal(result.start_time,'2035-01-01 10:00:00');
  assert.equal(interval('2035-01-01T04:30:00Z','2035-01-01T05:30:00Z').start_time,result.start_time);
  assert.throws(()=>interval('2035-02-30T10:00:00','2035-03-01T10:00:00'),/Invalid booking date/);
  assert.throws(()=>interval('2035-02-30T10:00:00Z','2035-03-01T10:00:00Z'),/Invalid booking date/);
  assert.throws(()=>interval('2035-01-01T11:00:00','2035-01-01T10:00:00'),/End time/);
  assert.throws(()=>interval('2000-01-01T10:00:00','2000-01-01T11:00:00',{future:true}),/future/);
});
test('pagination rejects malformed or excessive work requests',()=>{
  assert.deepEqual(pagination({limit:'20',offset:'40'}),{limit:20,offset:40});
  for(const value of ['-1','0','201','1.5','10x',[],{}])assert.throws(()=>pagination({limit:value}));
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {monthWindow,occupiedIntervals}=require('../src/utils/resourceCalendar');
function load(file,overrides){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),{module,exports:module.exports,console:{error(){}},require(name){if(name in overrides)return overrides[name];return require(path.join(__dirname,'../src',path.dirname(file),name));}});return module.exports;}

test('resource calendar accepts exactly one valid month and handles year/leap boundaries',()=>{
 assert.deepEqual(monthWindow('2026-12'),{start:'2026-12-01 00:00:00',end:'2027-01-01 00:00:00'});
 assert.deepEqual(monthWindow('2028-02'),{start:'2028-02-01 00:00:00',end:'2028-03-01 00:00:00'});
 for(const month of [undefined,[],{},'2026','2026-1','2026-00','2026-13','0000-01','9999-12','2026-01 OR 1=1'])assert.throws(()=>monthWindow(month),error=>error.status===400);
});

test('occupied intervals expose only times and merge continuous blocks',()=>{
 const rows=[{start_time:'2026-11-15T09:00:00',end_time:'2026-11-15T10:00:00',user_id:42,purpose:'Private meeting'},{start_time:'2026-11-15T09:30:00',end_time:'2026-11-15T09:45:00'},{start_time:'2026-11-15T10:00:00',end_time:'2026-11-15T11:00:00'},{start_time:'2026-11-15T14:00:00',end_time:'2026-11-15T15:00:00'}];
 assert.deepEqual(occupiedIntervals(rows),[{start_time:'2026-11-15T09:00:00',end_time:'2026-11-15T11:00:00'},{start_time:'2026-11-15T14:00:00',end_time:'2026-11-15T15:00:00'}]);
 assert.equal(rows[0].end_time,'2026-11-15T10:00:00');
});

test('calendar SQL binds resource/month, clips crossings, and selects active booking times only',async()=>{
 const calls=[];const pool={query:async(sql,params)=>{calls.push({sql,params});return calls.length===1?[[{id:7,status:'available'}]]:[[]];}};
 const Resource=load('models/resource.js',{'../config/database':{pool}});
 await Resource.getCalendar(7,'2026-11-01 00:00:00','2026-12-01 00:00:00');
 assert.deepEqual(Array.from(calls[1].params),[ '2026-11-01 00:00:00','2026-12-01 00:00:00',7,'2026-12-01 00:00:00','2026-11-01 00:00:00']);
 assert.match(calls[1].sql,/status IN \('pending', 'approved'\)/);assert.match(calls[1].sql,/start_time < \? AND end_time > \?/);
 assert.match(calls[1].sql,/GREATEST\(start_time, \?\)/);assert.match(calls[1].sql,/LEAST\(end_time, \?\)/);
 assert.doesNotMatch(calls[1].sql,/SELECT\s+\*|user_id|purpose|notes|attendees|JOIN users/i);
});

test('calendar response is private and uncached; validation, missing resources and failures are handled',async()=>{
 let calls=0,kind='ready';
 const controller=load('controllers/resourceController.js',{'express-validator':{},'../config/cache':{},'../models/resource':{getCalendar:async()=>{calls++;if(kind==='missing')return null;if(kind==='failure')throw new Error('Private database credentials');return {status:'available',bookings:[{start_time:'2026-11-15T09:00:00',end_time:'2026-11-15T10:00:00',id:33,user_email:'private@example.com',purpose:'Sensitive'}]};}}});
 async function request(month){let status=200,body,headers={};await controller.getCalendar({params:{id:7},query:{month}},{setHeader(k,v){headers[k]=v;},status(code){status=code;return this;},json(value){body=value;}});return {status,body:JSON.parse(JSON.stringify(body)),headers};}
 assert.equal((await request('2026-13')).status,400);assert.equal(calls,0);
 const response=await request('2026-11');assert.equal(response.headers['Cache-Control'],'no-store');assert.deepEqual(response.body.data,{month:'2026-11',time_zone:'Asia/Colombo',resource_status:'available',bookings:[{start_time:'2026-11-15T09:00:00',end_time:'2026-11-15T10:00:00'}]});
 kind='missing';assert.equal((await request('2026-11')).status,404);
 kind='failure';const failed=await request('2026-11');assert.equal(failed.status,500);assert.doesNotMatch(JSON.stringify(failed.body),/credentials|Sensitive|private@example/);
 const routes=fs.readFileSync(path.join(__dirname,'../src/routes/resourceRoutes.js'),'utf8');assert.match(routes,/router\.get\('\/:id\/calendar', verifyToken, resourceController\.getCalendar\)/);
});

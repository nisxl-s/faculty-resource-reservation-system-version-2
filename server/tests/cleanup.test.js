const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { filteredCacheKey } = require('../src/utils/cacheKey');

// I test these modules without connecting to real accounts or services.
function load(file, dependencies, extras = {}) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    module, exports: module.exports, console: { log() {}, warn() {} },
    process: { env: {} }, Date, ...extras,
    require(name) {
      if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name);
      return dependencies[name];
    }
  }, { filename: file });
  return module.exports;
}
function cacheModule(extras) {
  return load('config/cache.js', { '@upstash/redis': {}, dotenv: { config() {} } }, extras);
}

test('filtered list responses never share cached bodies; writes invalidate every variant', async () => {
  const cache = cacheModule();
  const { cacheMiddleware } = load('middleware/cache.js', { '../config/cache': cache });
  const middleware = cacheMiddleware(filteredCacheKey('resources:list', ['type', 'status', 'building']));
  async function request(query) {
    const headers = {};
    let body;
    const req = { method: 'GET', query };
    const res = { statusCode: 200, setHeader(k,v) { headers[k]=v; }, json(v) { body=v; } };
    await middleware(req, res, () => res.json({ success: true, type: query.type || 'all' }));
    return { headers, body };
  }
  assert.equal((await request({ type: 'lab' })).body.type, 'lab');
  const hall = await request({ type: 'hall' });
  assert.equal(hall.body.type, 'hall');
  assert.equal(hall.headers['X-Cache'], 'MISS');
  assert.equal((await request({ type: 'lab' })).headers['X-Cache'], 'HIT');
  await cache.cacheDeletePattern('resources:*');
  assert.equal((await request({ type: 'lab' })).headers['X-Cache'], 'MISS');
  const key = filteredCacheKey('reservations:all', ['user_id', 'resource_id', 'status', 'date']);
  assert.notEqual(key({query:{user_id:'1'}}), key({query:{user_id:'2'}}));
  assert.equal(key({query:{status:'pending',user_id:'1'}}), key({query:{user_id:'1',status:'pending'}}));
});

test('in-memory cache expires entries and caps cardinality at 500', async () => {
  let now=1000;
  const cache=cacheModule({Date:{now:()=>now}});
  await cache.cacheSet('expired', 1, 1);
  now+=1001;
  assert.equal(await cache.cacheGet('expired'), null);
  for(let i=0;i<501;i++) await cache.cacheSet('entry:'+i, i, 100);
  assert.equal(await cache.cacheGet('entry:0'), null);
  assert.equal(await cache.cacheGet('entry:500'), 500);
  await cache.cacheDeletePattern('entry:*');
  assert.equal(await cache.cacheGet('entry:500'), null);
});

test('overlap queries use strict interval boundaries and bind parameters in the correct order', async () => {
  const calls=[];
  const pool={query:async(sql,params)=>{calls.push({sql,params});return [[{count:0}]];}};
  const Reservation=load('models/Reservation.js',{'../config/database':{pool}});
  const Resource=load('models/resource.js',{'../config/database':{pool},'../utils/resourceDetails':require('../src/utils/resourceDetails'),'../utils/catalog':require('../src/utils/catalog'),'../utils/httpError':require('../src/utils/httpError')});
  await Reservation.checkConflict(3,'start','end',9);
  await Reservation.getConflictingReservations(3,'start','end',9);
  await Resource.checkAvailability(3,'start','end',9);
  await Resource.findAvailableForTimeSlot('start','end','lab');
  for (const call of calls) {
    assert.match(call.sql, /start_time < \? AND (?:r\.)?end_time > \?/);
    assert.equal((call.sql.match(/\?/g)||[]).length,call.params.length);
  }
  for(const call of calls.slice(0,3)) assert.equal(JSON.stringify(call.params),JSON.stringify([3,'end','start',9]));
  assert.equal(JSON.stringify(calls[3].params),JSON.stringify(['end','start','lab']));
  // Adjacent intervals are allowed; partial overlap and containment are blocked.
  const overlaps=(a,b,c,d)=>a<d&&b>c;
  assert.equal(overlaps(10,20,20,30),false);
  assert.equal(overlaps(20,30,10,20),false);
  assert.equal(overlaps(10,20,15,25),true);
  assert.equal(overlaps(10,30,15,20),true);
  assert.equal(overlaps(15,20,10,30),true);
});

test('help submission verifies a supplied token while allowing guests', async () => {
  const routes=[];
  const router={param(){},use(){},post:(...args)=>routes.push(args),get(){},put(){},patch(){}};
  let verified=0;
  const controller=new Proxy({}, {get:()=>()=>{}});
  load('routes/help.js', {
    express:{Router:()=>router}, '../controllers/helpController':controller,
    '../middleware/auth':{verifyToken(req,res,next){verified++;req.user={id:7};next();},isFacultyOrAdmin(){}}
  });
  const submit=routes[0][1];
  let continued=0;
  submit({header:()=>undefined},{},()=>continued++);
  assert.equal(verified,0);
  const req={header:()=> 'Bearer valid'};
  submit(req,{},()=>continued++);
  assert.equal(verified,1);
  assert.equal(req.user.id,7);
  assert.equal(continued,2);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { runMigrations } = require('../src/config/migrations');

test('database migrations, concurrent booking integrity, authorization and support flows', { timeout: 90000 }, async () => {
  const name = 'frr_verify_' + crypto.randomBytes(5).toString('hex');
  const databases = [name, name+'_legacy'];
  const settings = { host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', timezone: '+05:30' };
  const operator = await mysql.createConnection(settings);
  let connection, child;
  let logs = '';
  try {
    for(const database of databases) await operator.query(`CREATE DATABASE \`${database}\``);
    connection = await mysql.createConnection({ ...settings, database: name });
    await runMigrations(connection); await runMigrations(connection);
    const legacy = await mysql.createConnection({...settings,database:databases[1]});
    try {
      const sql=fs.readFileSync(path.join(__dirname,'fixtures/legacy.sql'),'utf8');
      for(const statement of sql.split(';').filter(s=>s.trim())) await legacy.query(statement);
      await legacy.query("INSERT INTO users(full_name,email,password,role) VALUES ('Preserved','preserved@example.test','not-used','student')");
      await runMigrations(legacy); await runMigrations(legacy);
      const [[preserved]]=await legacy.query("SELECT token_version,full_name FROM users WHERE email='preserved@example.test'");
      assert.equal(preserved.full_name,'Preserved'); assert.equal(preserved.token_version,0);
      const [triggers]=await legacy.query('SHOW TRIGGERS'); assert.equal(triggers.length,2);
    } finally {await legacy.end();}
    const hash=await bcrypt.hash('TestPassword123',10);
    const users={};
    for(const role of ['admin','student','faculty']) {
      const [result]=await connection.query('INSERT INTO users(full_name,email,password,role) VALUES (?,?,?,?)',[role,role+'@example.test',hash,role]);
      users[role]=result.insertId;
    }
    const [resource]=await connection.query("INSERT INTO resources(name,type,status) VALUES ('Test room','classroom','available')");
    const listener = require('node:net').createServer();
    await new Promise(resolve => listener.listen(0,'127.0.0.1',resolve));
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    const env={...process.env,DB_NAME:name,PORT:String(port),NODE_ENV:'test',JWT_SECRET:crypto.randomBytes(48).toString('hex'),CACHE_ENABLED:'false',SMTP_HOST:'',SMTP_USER:'',SMTP_PASS:'',ALLOW_DEV_RESET_LOG:'false'};
    child=spawn(process.execPath,['src/server.js'],{cwd:path.join(__dirname,'..'),env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',chunk=>{logs+=chunk;});child.stderr.on('data',chunk=>{logs+=chunk;});
    const base='http://127.0.0.1:'+port+'/api';
    let started=false;
    for(let i=0;i<80;i++){
      try {const response=await fetch(base+'/ready',{signal:AbortSignal.timeout(500)});if(response.ok){started=true;break;}}catch(_){}
      if(child.exitCode!==null)throw Error('Test server exited: '+logs.replace(/token=\w+/g,'token=[redacted]'));
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert.equal(started,true,'disposable API starts');
    async function request(route,token,method='GET',body){
      const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
      return {status:response.status,body:await response.json()};
    }
    async function login(role,password='TestPassword123') {
      const result=await request('/auth/login',null,'POST',{email:role+'@example.test',password});
      assert.equal(result.status,200,JSON.stringify(result.body));return result.body.data.token;
    }
    const admin=await login('admin'),student=await login('student'),faculty=await login('faculty');
    // I check that email punctuation survives saving, sign-in and account edits.
    const dottedEmail='sam.student+project@gmail.com';
    const emailPassword='EmailTestPassword123';
    for(const role of ['faculty','admin'])assert.equal((await request('/auth/register',null,'POST',{full_name:'Privilege test',email:role+'-public@example.test',password:emailPassword,role})).status,400,'public cannot grant '+role);
    const registered=await request('/auth/register',null,'POST',{full_name:'Email punctuation test',email:' '+dottedEmail+' ',password:emailPassword,role:'student',registration_id:'ICT/2026/001'});
    assert.equal(registered.status,201,JSON.stringify(registered.body));assert.equal(registered.body.data.user.email,dottedEmail);
    const emailUserId=registered.body.data.user.id;
    const signedIn=await request('/auth/login',null,'POST',{email:dottedEmail,password:emailPassword});assert.equal(signedIn.status,200);
    const emailToken=signedIn.body.data.token;
    assert.equal((await request('/auth/users',admin)).body.data.users.find(u=>u.id===emailUserId).email,dottedEmail,'User Management receives the entered email');
    const [[savedEmail]]=await connection.query('SELECT email FROM users WHERE id=?',[emailUserId]);assert.equal(savedEmail.email,dottedEmail);
    const [[identity]]=await connection.query('SELECT registration_id,phone FROM users WHERE id=?',[emailUserId]);assert.equal(identity.registration_id,'ICT/2026/001');assert.equal(identity.phone,null,'registration ID is not stored as phone');
    const changedEmail='sam.student+updated@gmail.com';
    const changed=await request('/auth/profile',emailToken,'PUT',{full_name:'Email punctuation test',email:changedEmail});assert.equal(changed.status,200,JSON.stringify(changed.body));
    assert.equal((await request('/auth/profile',emailToken)).body.data.user.email,changedEmail);
    assert.equal((await request('/auth/forgot-password',null,'POST',{email:changedEmail})).status,200);
    const [[resetForEmail]]=await connection.query('SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id=?',[emailUserId]);assert.equal(resetForEmail.count,1,'Recovery finds the preserved email');
    const adminEmail='sam.student-project@yahoo.com';
    const added=await request('/auth/users',admin,'POST',{full_name:'Admin email test',email:adminEmail,password:emailPassword,role:'student'});assert.equal(added.status,201,JSON.stringify(added.body));assert.equal(added.body.data.user.email,adminEmail);
    const adminEditedEmail='sam.student+admin@outlook.com';
    const updated=await request('/auth/users/'+added.body.data.user.id,admin,'PUT',{full_name:'Admin email test',email:adminEditedEmail,role:'student'});assert.equal(updated.status,200);assert.equal(updated.body.data.user.email,adminEditedEmail);
    assert.equal((await request('/auth/login',null,'POST',{email:adminEditedEmail,password:emailPassword})).status,200);
    assert.equal((await request('/auth/register',null,'POST',{full_name:'Duplicate email',email:changedEmail,password:emailPassword})).status,400);
    assert.equal((await request('/auth/register',null,'POST',{full_name:'Invalid email',email:'not-an-email',password:emailPassword})).status,400);
    const catalogFields={faculty_code:'FOC',asset_code:'TEST-HALL',building:'Test building',location:'Test room',floor:'Ground floor',sharing_scope:'faculty'};
    const hallData={...catalogFields,name:'Details test hall',type:'hall',capacity:2,status:'available',details:{layout:'theatre',facilities:'Projector',accessibility:'Step-free entrance'}};
    const hallResult=await request('/resources',admin,'POST',hallData);assert.equal(hallResult.status,201,JSON.stringify(hallResult.body));
    const hallId=hallResult.body.data.resource.id;
    assert.equal(hallResult.body.data.resource.details.layout,'theatre');
    assert.equal((await request('/resources/'+hallId,student)).body.data.resource.details.accessibility,'Step-free entrance');
    assert.equal((await request('/resources',admin,'POST',{...hallData,details:{asset_tag:'wrong-type'}})).status,400);
    const equipmentResult=await request('/resources',admin,'POST',{...catalogFields,asset_code:'TEST-PROJECTOR',parent_resource_id:hallId,name:'Details test projector',type:'equipment',capacity:null,status:'available',details:{brand_model:'Test model',condition:'good',accessories:'Cable',collection_point:'Resource desk',return_instructions:'Return to desk'}});
    assert.equal(equipmentResult.status,201,JSON.stringify(equipmentResult.body));
    const equipmentId=equipmentResult.body.data.resource.id;
    assert.equal(equipmentResult.body.data.resource.details.brand_model,'Test model');
    const duplicate=await request('/resources',admin,'POST',hallData);assert.equal(duplicate.status,409,JSON.stringify(duplicate.body));
    assert.equal((await request('/resources',admin,'POST',{...hallData,asset_code:'BAD-FACULTY',faculty_code:'INVALID'})).status,400);
    assert.equal((await request('/resources',admin,'POST',{...hallData,asset_code:'BAD-SCOPE',sharing_scope:'campus'})).status,400);
    assert.equal((await request('/resources',admin,'POST',{...catalogFields,asset_code:'BAD-PARENT',type:'equipment',name:'Invalid parent',faculty_code:'FAS',parent_resource_id:hallId})).status,400);
    assert.equal((await request('/resources/'+hallId,admin,'PUT',{...hallData,floor:'Second floor'})).status,400,'venue move cannot strand its projector');
    assert.equal((await request('/resources/'+hallId,admin,'DELETE')).status,409,'venue with equipment cannot be deleted');
    assert.equal((await request('/resources/faculties',student)).body.data.faculties.length,11);
    const scoped=await request('/resources?faculty_code=FOC',student);assert.ok(scoped.body.data.resources.every(r=>r.faculty_code==='FOC'));
    const other=await request('/resources?faculty_code=FAS',student);assert.equal(other.body.data.resources.length,0,'faculty cache is isolated');
    const future={start_time:new Date(Date.now()+172800000).toISOString(),end_time:new Date(Date.now()+176400000).toISOString(),purpose:'Typed resource integration'};
    assert.equal((await request('/reservations',student,'POST',{...future,resource_id:hallId,attendees:3})).status,400);
    const spaceBooking=await request('/reservations',student,'POST',{...future,resource_id:hallId,attendees:2});assert.equal(spaceBooking.status,201);
    assert.equal(spaceBooking.body.data.reservation.attendees,2);
    assert.equal((await request('/reservations/'+spaceBooking.body.data.reservation.id,student,'PUT',{attendees:3})).status,400);
    const itemBooking=await request('/reservations',student,'POST',{...future,resource_id:equipmentId,attendees:100});assert.equal(itemBooking.status,201);
    assert.equal(itemBooking.body.data.reservation.attendees,null);
    const preservedDetails=await request('/resources/'+equipmentId,admin,'PUT',{...catalogFields,asset_code:'TEST-PROJECTOR',parent_resource_id:hallId,name:'Updated projector',type:'equipment',capacity:null,status:'available'});assert.equal(preservedDetails.status,200);assert.equal(preservedDetails.body.data.resource.details.collection_point,'Resource desk');
    assert.equal((await request('/resources/'+equipmentId,admin,'DELETE')).status,409,'booking history prevents destructive resource deletion');
    const start=new Date(Date.now()+24*60*60*1000),end=new Date(start.getTime()+60*60*1000);
    const booking={resource_id:resource.insertId,start_time:start.toISOString(),end_time:end.toISOString(),purpose:'Integration test'};
    await connection.query("UPDATE resources SET status='maintenance' WHERE id=?",[resource.insertId]);
    const unavailable=await request('/resources/'+resource.insertId+'/availability?'+new URLSearchParams({start_time:booking.start_time,end_time:booking.end_time}),student);
    assert.equal(unavailable.status,200);assert.equal(unavailable.body.data.is_available ?? unavailable.body.data.available,false,'maintenance resource is not available');
    assert.equal((await request('/reservations',student,'POST',booking)).status,409);
    await connection.query("UPDATE resources SET status='available' WHERE id=?",[resource.insertId]);
    const parallel=await Promise.all(Array.from({length:8},()=>request('/reservations',student,'POST',booking)));
    assert.equal(parallel.filter(r=>r.status===201).length,1,'exactly one concurrent request is persisted');
    assert.equal(parallel.filter(r=>r.status===409).length,7,'all other concurrent requests conflict');
    const id=parallel.find(r=>r.status===201).body.data.reservation.id;
    assert.equal((await request('/reservations/'+id,student,'PUT',{status:'approved'})).status,400,'owners cannot self-approve via edit');
    assert.equal((await request('/reservations/'+id+'/status',student,'PUT',{status:'approved'})).status,403);
    assert.equal((await request('/reservations/'+id,student,'PUT',{end_time:new Date(start.getTime()-1000).toISOString()})).status,400,'partial edits validate the effective interval');
    assert.equal((await request('/reservations/'+id+'/status',faculty,'PUT',{status:'approved'})).status,200);
    assert.equal((await request('/reservations/'+id+'/cancel',admin,'POST',{})).status,200,'admin can cancel another owner');
    const replacement=await request('/reservations',student,'POST',booking);assert.equal(replacement.status,201);
    assert.equal((await request('/reservations/'+id+'/status',admin,'PUT',{status:'approved'})).status,409,'reactivation rechecks conflicts');
    const adjacent={...booking,start_time:end.toISOString(),end_time:new Date(end.getTime()+3600000).toISOString()};
    assert.equal((await request('/reservations',student,'POST',adjacent)).status,201,'adjacent bookings allowed');
    assert.equal((await request('/reservations',student,'POST',{...booking,start_time:'2000-01-01T10:00:00',end_time:'2000-01-01T11:00:00'})).status,400);
    const own=await request('/reservations',faculty,'POST',{...booking,start_time:new Date(end.getTime()+7200000).toISOString(),end_time:new Date(end.getTime()+10800000).toISOString()});
    assert.equal(own.status,201);
    assert.equal((await request('/reservations/'+own.body.data.reservation.id+'/status',faculty,'PUT',{status:'approved'})).status,403,'faculty cannot approve their own request');
    const ownId=own.body.data.reservation.id;
    assert.equal((await request('/reservations/'+ownId+'/status',admin,'PUT',{status:'rejected'})).status,400,'rejection requires explanation');
    assert.equal((await request('/reservations/'+ownId+'/status',admin,'PUT',{status:'rejected',reason:'Resource reserved for maintenance'})).status,200);
    const reviewed=await request('/reservations/'+ownId,faculty);assert.equal(reviewed.body.data.reservation.rejection_reason,'Resource reserved for maintenance');assert.ok(reviewed.body.data.history.some(e=>e.actor_id===users.admin&&e.status==='rejected'&&e.reason==='Resource reserved for maintenance'));
    assert.equal((await request('/reservations/'+ownId,student)).status,403,'other members cannot read decision history');
    const publicDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).format(start);
    const occupied=await request('/reservations/by-date?date='+publicDay,student);assert.equal(occupied.status,200);
    assert.ok(occupied.body.data.reservations.length>0);
    for(const row of occupied.body.data.reservations)for(const field of ['user_id','user_name','user_email','purpose','notes'])assert.equal(row[field],undefined,'schedule data is private');
    assert.equal((await request('/resources?limit=-1',student)).status,400);
    assert.equal((await request('/reservations?limit=1',faculty)).body.data.reservations.length,1);
    const notifications=await request('/notifications',student);assert.equal(notifications.status,200);
    assert.equal(notifications.body.data.notifications.filter(n=>n.related_id===id).length,3,'one notification per insert or status change');
    await require('./notification-check')({request,connection,admin,student,faculty,users});
    const guest=await request('/help',null,'POST',{topic:'Guest test',question:'Help please',guest_email:'guest@example.test'});assert.equal(guest.status,201);
    assert.match(guest.body.data.tracking_token,/^[a-f0-9]{64}$/);
    const guestBody={id:guest.body.data.requestId,token:guest.body.data.tracking_token};
    assert.equal((await request('/help/guest-status',null,'POST',guestBody)).status,200);
    assert.equal((await request('/help/guest-status',null,'POST',{...guestBody,token:'0'.repeat(64)})).status,404);
    assert.equal((await request('/help/admin/'+guestBody.id+'/respond',faculty,'PUT',{admin_response:'Guest reply',status:'resolved'})).status,200);
    assert.equal((await request('/help/guest-status',null,'POST',guestBody)).body.data.request.admin_response,'Guest reply');
    assert.equal((await request('/help','invalid','POST',{topic:'Invalid',question:'Help',guest_email:'guest@example.test'})).status,401);
    assert.equal((await request('/help',student,'POST',{topic:'Member test',question:'Help please'})).status,201);
    assert.equal((await request('/help/my-requests',student)).body.data.requests.length,1);
    assert.equal((await request('/help/admin/all',faculty)).body.data.requests.length,2);
    assert.equal((await request('/feedback',student,'POST',{subject:'Invalid rating',message:'Test',rating:0})).status,400);
    assert.equal((await request('/feedback',student,'POST',{category:'general',subject:'Test',message:'Test feedback',rating:5})).status,201);
    const feedback=await request('/feedback/admin/all',admin);assert.equal(feedback.status,200);
    assert.equal((await request('/feedback/admin/'+feedback.body.data.feedback[0].id+'/respond',admin,'PUT',{admin_response:'Resolved',status:'resolved'})).status,200);
    if(process.env.BOOKING_BROWSER_TESTS === 'true') await require('./booking-error-browser-check')({base,token:student,userId:users.student,resourceId:hallId,booking:future});
    if(process.env.CATALOG_BROWSER_TESTS === 'true') await require('./catalog-browser-check')({base,tokens:{admin,student,faculty},users});
    if(process.env.BROWSER_TESTS === 'true') await require('./browser-check')({base,tokens:{admin,student,faculty},users});
    if(process.env.BROWSER_TESTS === 'true') await require('./gaps-browser-check')({base,tokens:{admin,student,faculty},users,resourceId:resource.insertId});
    if(process.env.BROWSER_TESTS === 'true' || process.env.NOTIFICATION_BROWSER_TESTS === 'true') await require('./notification-browser-check')({base,tokens:{admin,student,faculty},users});
    // A queue failure must roll back the account and booking, not silently lose notification events.
    await connection.query('RENAME TABLE email_outbox TO email_outbox_unavailable');
    try {
      const broken=await request('/auth/register',null,'POST',{full_name:'Rollback account',email:'rollback@example.test',password:emailPassword});assert.equal(broken.status,500);
      const [[account]]=await connection.query("SELECT COUNT(*) AS count FROM users WHERE email='rollback@example.test'");assert.equal(account.count,0,'account and welcome mail are atomic');
      const [before]=await connection.query('SELECT id FROM reservations');
      const attempt=await request('/reservations',student,'POST',{...booking,start_time:new Date(end.getTime()+172800000).toISOString(),end_time:new Date(end.getTime()+176400000).toISOString()});assert.equal(attempt.status,500);
      const [after]=await connection.query('SELECT id FROM reservations');assert.equal(after.length,before.length,'booking rolls back if outbox insert fails');
    } finally {await connection.query('RENAME TABLE email_outbox_unavailable TO email_outbox');}
    const [[welcomeQueued]]=await connection.query("SELECT COUNT(*) AS count FROM email_outbox WHERE subject='Welcome to Faculty Resource Reservation'");
    assert.ok(welcomeQueued.count>0,'registration queues welcome email for non-university addresses');
    const [[reservationQueued]]=await connection.query("SELECT COUNT(*) AS count FROM email_outbox WHERE subject LIKE 'Reservation %'");
    assert.ok(reservationQueued.count>0,'reservation actions queue transactional email');
    const missing=await request('/auth/forgot-password',null,'POST',{email:'missing@example.test'});
    const known=await request('/auth/forgot-password',null,'POST',{email:'student@example.test'});
    assert.equal(known.status,missing.status);assert.deepEqual(known.body,missing.body,'recovery responses do not enumerate users');
    assert.ok(!logs.includes('Reset URL:')&&!logs.includes('reset-password?token='),'test/nondevelopment logs omit reset secrets');
    const raw=crypto.randomBytes(32).toString('hex'),tokenHash=crypto.createHash('sha256').update(raw).digest('hex');
    await connection.query('INSERT INTO password_reset_tokens(user_id,token,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))',[users.student,tokenHash]);
    const [[queuedReset]]=await connection.query("SELECT COUNT(*) AS count FROM email_outbox WHERE dedupe_key LIKE 'reset:%'");
    assert.ok(queuedReset.count>0,'password recovery queues an email');
    const resets=await Promise.all([1,2].map(()=>request('/auth/reset-password',null,'POST',{token:raw,newPassword:'NewPassword123'})));
    assert.equal(resets.filter(r=>r.status===200).length,1,'reset token succeeds exactly once');
    assert.equal(resets.filter(r=>r.status===400).length,1);
    assert.equal((await request('/auth/profile',student)).status,401,'old token revoked after reset');
    const fresh=await login('student','NewPassword123');assert.equal((await request('/auth/profile',fresh)).status,200);
    assert.equal((await request('/auth/users/'+users.faculty,admin,'PUT',{full_name:'faculty',email:'faculty@example.test',role:'student'})).status,200);
    assert.equal((await request('/auth/profile',faculty)).status,401,'old faculty token invalid after demotion');
    await connection.query('UPDATE users SET is_active=FALSE WHERE id=?',[users.student]);
    assert.equal((await request('/auth/profile',fresh)).status,401,'inactive account loses access immediately');
    assert.equal((await request('/auth/login',null,'POST',{email:'student@example.test',password:'NewPassword123'})).status,401);
    const durations = [];
    const {performance} = require('node:perf_hooks');
    await Promise.all(Array.from({length:20}, async()=>{
      const before = performance.now();
      const result = await request('/resources?limit=20',admin);
      assert.equal(result.status,200); durations.push(performance.now()-before);
    }));
    durations.sort((a,b)=>a-b);
    console.log('Local 20-request catalogue smoke test p95: '+durations[Math.ceil(durations.length*.95)-1].toFixed(1)+' ms (small fixture; not a capacity certification)');
    const backupConnection=await mysql.createConnection({...settings,database:name,dateStrings:true});
    const {capture,restoreEmpty}=require('../scripts/backup');
    const snapshot=await capture(backupConnection);await backupConnection.end();
    const restoreName=name+'_restore';await operator.query('CREATE DATABASE '+operator.escapeId(restoreName));databases.push(restoreName);
    const restored=await mysql.createConnection({...settings,database:restoreName,dateStrings:true});
    try{await restoreEmpty(restored,JSON.parse(JSON.stringify(snapshot)));for(const table of snapshot.tables){const [[count]]=await restored.query('SELECT COUNT(*) AS count FROM ??',[table.name]);assert.equal(count.count,table.rows.length,'backup restores '+table.name);}assert.equal((await restored.query('SHOW TRIGGERS'))[0].length,2);await assert.rejects(()=>restoreEmpty(restored,snapshot),/empty database/);}finally{await restored.end();}
    console.log('Verified: fresh/legacy migrations twice, 8 concurrent bookings, cancellation/reactivation, privacy, notifications, support, one-use resets and revoked sessions.');
  } catch(error) { console.error('Integration failure:',error);throw error; } finally {
    if(child){child.kill();await Promise.race([new Promise(resolve=>child.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,2000))]);}
    if(connection)await connection.end();
    for(const database of databases){if(!/^frr_verify_[a-f0-9]+(?:_legacy|_restore)?$/.test(database))throw Error('Unsafe test cleanup target');await operator.query(`DROP DATABASE IF EXISTS \`${database}\``).catch(e=>{if(e.code!=='ER_DB_DROP_RMDIR')throw e;console.warn('MySQL left an empty test schema directory: '+database);});}
    await operator.end();
  }
});


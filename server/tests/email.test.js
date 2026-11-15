const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function load(file,env,dependencies) {
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),{module,URL,Date,console:{error(){},warn(){}},process:{env},setInterval,require(name){if(name==='dotenv')return {config(){}};if(dependencies[name])return dependencies[name];throw Error(name);}});
  return module.exports;
}
test('SMTP requires configuration; configured transport escapes HTML and reports rejected recipients',async()=>{
  const empty=load('config/email.js',{}, {nodemailer:{}});
  assert.equal((await empty.sendEmail({})).code,'SMTP_NOT_CONFIGURED');
  let options,message;
  const mail=load('config/email.js',{SMTP_HOST:'smtp.gmail.com',SMTP_USER:'sender@example.com',SMTP_PASS:'private',SMTP_PORT:'587'}, {nodemailer:{createTransport(o){options=o;return {async sendMail(m){message=m;return {accepted:['user@example.com'],messageId:'ok'};},async verify(){}};}}});
  assert.equal(options.requireTLS,true);assert.equal(options.secure,false);
  assert.equal((await mail.sendEmail({to:'user@example.com',subject:'Test',text:'<script> & \"test\"'})).success,true);
  assert.ok(message.html.includes('&lt;script&gt;'));assert.ok(!message.html.includes('<script>'));
  assert.equal(message.from,'sender@example.com');await mail.verifyEmailConnection();
  const rejected=load('config/email.js',{SMTP_HOST:'smtp.gmail.com',SMTP_USER:'sender@example.com',SMTP_PASS:'private'}, {nodemailer:{createTransport(){return {async sendMail(){return {accepted:[]};}};}}});
  assert.equal((await rejected.sendEmail({})).code,'RECIPIENT_REJECTED');
});
function worker(sendResult, key='test') {
  const queries=[];let released=false,sent=0;
  const connection={async query(sql,args){queries.push([sql,args]);if(sql.includes('GET_LOCK'))return [[{acquired:1}]];if(sql.startsWith('SELECT * FROM email_outbox'))return [[{id:9,dedupe_key:key,recipient:'test@example.com',subject:'Test',body:'Secret',attempts:2}]];if(sql.startsWith('SELECT id FROM password_reset_tokens'))return [[]];return [[]];},release(){released=true;}};
  const service=load('services/emailService.js',{CLIENT_URL:'http://localhost:3000'}, {'crypto':require('crypto'),'../config/database':{pool:{getConnection:async()=>connection}},'../config/email':{isSmtpConfigured:true,async sendEmail(){sent++;return sendResult;}}});
  return {service,queries,released:()=>released,sent:()=>sent};
}
test('successful delivery clears secret body; failed delivery persists bounded retry',async()=>{
  const ok=worker({success:true});await ok.service.deliverPending();assert.equal(ok.sent(),1);assert.ok(ok.queries.some(([s])=>s.includes("sent_at=NOW(),body=''")));assert.equal(ok.released(),true);
  const fail=worker({success:false,code:'EAUTH'});await fail.service.deliverPending();const retry=fail.queries.find(([s])=>s.includes('attempts=attempts+1'));assert.deepEqual(Array.from(retry[1]),['EAUTH',120,9]);assert.equal(fail.released(),true);
});
test('superseded reset messages are discarded without sending; production reset URL requires HTTPS',async()=>{
  const stale=worker({success:true},'reset:old-hash');await stale.service.deliverPending();assert.equal(stale.sent(),0);assert.ok(stale.queries.some(([s])=>s.includes('expires_at=NOW()')));
  const prod=load('services/emailService.js',{CLIENT_URL:'http://example.com',NODE_ENV:'production'},{crypto:require('crypto'),'../config/database':{pool:{}},'../config/email':{}});
  assert.throws(()=>prod.clientUrl(),/HTTPS/);
});

const crypto = require('crypto');
const {pool} = require('../config/database');
const {sendEmail, isSmtpConfigured} = require('../config/email');
function clientUrl() {
  const url = new URL(process.env.CLIENT_URL || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(url.protocol) || (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) throw new Error('CLIENT_URL must be a valid website URL (HTTPS in production)');
  return url.origin;
}
async function queueEmail({to, subject, text, key=crypto.randomUUID(), expiresAt=new Date(Date.now()+86400000)}, database=pool) {
  try {
    await database.query('INSERT IGNORE INTO email_outbox (dedupe_key,recipient,subject,body,expires_at) VALUES (?,?,?,?,?)',[key,to,subject,text,expiresAt]);
  } catch (error) {
    // Driver errors can contain the full SQL statement, including private reset links.
    const failure=new Error('Unable to queue notification');
    failure.code=error.code || 'EMAIL_QUEUE_UNAVAILABLE';
    throw failure;
  }
}
const welcome = (user,database=pool) => queueEmail({to:user.email,subject:'Welcome to Faculty Resource Reservation',text:'Hello '+user.full_name+',\nYour account is ready. You can now request campus resources.\n'+clientUrl()},database);
const passwordChanged = (user,database=pool) => queueEmail({to:user.email,subject:'Your password was changed',text:'Your Faculty Resource Reservation password was changed. If this was not you, contact the system administrator immediately.'},database);
async function reservationEmail(reservation, event='updated', database=pool) {
  if (!reservation) return;
  const format = value => new Date(value).toLocaleString('en-GB',{timeZone:'Asia/Colombo'});
  await queueEmail({to:reservation.user_email,subject:'Reservation '+event+' (#'+reservation.id+')',text:'Hello '+reservation.user_name+',\nReservation #'+reservation.id+' for '+reservation.resource_name+' was '+event+'.\nStatus: '+reservation.status+'\nFrom: '+format(reservation.start_time)+'\nTo: '+format(reservation.end_time)+' (Sri Lanka time)\nView your reservations: '+clientUrl()+(reservation.rejection_reason?'\nReason: '+reservation.rejection_reason:'')},database);
}
async function queueReminders() {
  const [rows] = await pool.query(`SELECT r.id,r.start_time,r.end_time,u.email,res.name FROM reservations r JOIN users u ON u.id=r.user_id JOIN resources res ON res.id=r.resource_id WHERE r.status='approved' AND u.is_active=TRUE AND r.start_time>NOW() AND r.start_time<=DATE_ADD(NOW(),INTERVAL 24 HOUR)`);
  for (const r of rows) await queueEmail({to:r.email,subject:'Upcoming reservation (#'+r.id+')',text:'Reminder: your approved reservation for '+r.name+' starts at '+new Date(r.start_time).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})+' (Sri Lanka time).\n'+clientUrl(),key:'reminder:'+r.id+':'+new Date(r.start_time).getTime()+':'+new Date(r.end_time).getTime(),expiresAt:new Date(r.start_time)});
}
async function deliverPending() {
  // A connection-owned lock prevents two server processes delivering the same batch.
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [[lock]]=await connection.query("SELECT GET_LOCK('faculty_email_delivery',0) AS acquired");
    if (Number(lock.acquired)!==1) return;
    locked=true;
    // Remove sensitive reset URLs promptly and retain sent metadata for seven days.
    await connection.query("UPDATE email_outbox SET body='' WHERE expires_at<=NOW() AND body<>''");
    await connection.query('DELETE FROM email_outbox WHERE expires_at<DATE_SUB(NOW(),INTERVAL 7 DAY)');
    if (!isSmtpConfigured) return;
    const [messages]=await connection.query("SELECT * FROM email_outbox WHERE sent_at IS NULL AND expires_at>NOW() AND next_attempt_at<=NOW() AND attempts<8 ORDER BY (dedupe_key LIKE 'reset:%') DESC, id LIMIT 10");
    for (const m of messages) {
      if (m.dedupe_key.startsWith('reset:')) {
        const [[token]]=await connection.query('SELECT id FROM password_reset_tokens WHERE token=? AND used=FALSE AND expires_at>NOW()',[m.dedupe_key.slice(6)]);
        if (!token) {
          await connection.query("UPDATE email_outbox SET expires_at=NOW(),body='' WHERE id=?",[m.id]);
          continue;
        }
      }
      if (m.dedupe_key.startsWith('reminder:')) {
        const [,id,start,end]=m.dedupe_key.split(':');
        const [[r]]=await connection.query("SELECT start_time,end_time,status FROM reservations WHERE id=?",[id]);
        if (!r || r.status!=='approved' || new Date(r.start_time).getTime()!==Number(start) || new Date(r.end_time).getTime()!==Number(end)) {
          await connection.query('UPDATE email_outbox SET expires_at=NOW(),body=\'\' WHERE id=?',[m.id]);
          continue;
        }
      }
      const result=await sendEmail({to:m.recipient,subject:m.subject,text:m.body});
      if(result.success) await connection.query("UPDATE email_outbox SET sent_at=NOW(),body='',last_error=NULL WHERE id=?",[m.id]);
      else {
        const delay=Math.min(3600,30*2**m.attempts);
        await connection.query('UPDATE email_outbox SET attempts=attempts+1,last_error=?,next_attempt_at=DATE_ADD(NOW(),INTERVAL ? SECOND) WHERE id=?',[result.code,delay,m.id]);
        console.error('Email delivery deferred; outbox id='+m.id+' code='+result.code);
      }
    }
  } finally {
    try { if(locked) await connection.query("SELECT RELEASE_LOCK('faculty_email_delivery')"); }
    finally { connection.release(); }
  }
}
const workerState={lastCompletedAt:null,lastErrorAt:null};
function startEmailWorker({keepAlive=false}={}) {
  clientUrl();
  if(!isSmtpConfigured) console.warn('Email delivery pending: configure Gmail SMTP credentials. Messages remain queued until expiry.');
  let busy=false;
  async function tick() {
    if(busy)return;
    busy=true;
    try { await queueReminders(); await deliverPending(); workerState.lastCompletedAt=new Date().toISOString(); }
    catch (_) { workerState.lastErrorAt=new Date().toISOString(); console.error('Email worker failed; check database and SMTP configuration.'); }
    finally { busy=false; }
  }
  void tick();
  const timer=setInterval(tick,30000); if(!keepAlive)timer.unref();
  return ()=>clearInterval(timer);
}
module.exports={workerState,queueEmail,welcome,passwordChanged,reservationEmail,clientUrl,startEmailWorker,deliverPending};

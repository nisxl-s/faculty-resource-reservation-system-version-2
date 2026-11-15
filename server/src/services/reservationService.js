const { attendeeCount } = require('../utils/resourceDetails');
const { pool } = require('../config/database');
const { interval } = require('../utils/bookingTime');
const { httpError } = require('../utils/httpError');
const {enforcePolicy}=require('../utils/bookingPolicy');
async function recordEvent(connection,id,user,action,previous,status,reason=null) {
  await connection.query('INSERT INTO reservation_events(reservation_id,actor_id,action,previous_status,status,reason) VALUES (?,?,?,?,?,?)',[id,user.id,action,previous,status,reason]);
  const [[reservation]]=await connection.query('SELECT r.*,u.email AS user_email,u.full_name AS user_name,res.name AS resource_name FROM reservations r JOIN users u ON u.id=r.user_id JOIN resources res ON res.id=r.resource_id WHERE r.id=?',[id]);
  await require('./emailService').reservationEmail(reservation,action==='created'?'requested':action==='edited'?'updated':status,connection);
}

const reviewer = user => ['faculty', 'admin'].includes(user.role);
const ownerOrAdmin = (user, reservation) => user.role === 'admin' || Number(reservation.user_id) === Number(user.id);
const ACTIVE = ['pending', 'approved'];
const STATES = ['pending', 'approved', 'rejected', 'cancelled'];

// I lock the resource before its booking so requests for the same resource
// are checked one at a time.
async function transaction(resourceId, action) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[resource]] = await connection.query('SELECT id, name, status, type, capacity FROM resources WHERE id = ? FOR UPDATE', [resourceId]);
    if (!resource) throw httpError(404, 'Resource not found');
    const result = await action(connection, resource);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function conflict(connection, resourceId, times, exclude = 0) {
  const [[row]] = await connection.query(
    `SELECT id FROM reservations WHERE resource_id = ? AND status IN ('pending', 'approved')
     AND start_time < ? AND end_time > ? AND id <> ? LIMIT 1 FOR UPDATE`,
    [resourceId, times.end_time, times.start_time, exclude]
  );
  if (row) throw httpError(409, 'Resource is already booked for this time slot');
}
function available(resource) {
  if (resource.status !== 'available') throw httpError(409, 'Resource is not currently available');
}
function text(value, name) {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 5000)) throw httpError(400, `${name} must be text of at most 5000 characters`);
  return value ?? null;
}
async function create(data, user) {
  if (!Number.isInteger(Number(data.resource_id)) || Number(data.resource_id) < 1) throw httpError(400, 'Valid resource ID is required');
  if (data.status !== undefined) throw httpError(400, 'New reservations start as pending');
  const times = interval(data.start_time, data.end_time, { future: true });
  enforcePolicy(times);
  return transaction(data.resource_id, async (connection, resource) => {
    available(resource);
    await conflict(connection, resource.id, times);
    const [result] = await connection.query(
      `INSERT INTO reservations (user_id, resource_id, start_time, end_time, purpose, notes, attendees, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [user.id, resource.id, times.start_time, times.end_time, text(data.purpose,'Purpose'), text(data.notes,'Notes'), attendeeCount(resource, data.attendees)]
    );
    await recordEvent(connection,result.insertId,user,'created',null,'pending');
    return result.insertId;
  });
}
async function mutate(id, user, mode, data = {}) {
  if (!Number.isInteger(Number(id)) || Number(id) < 1) throw httpError(400, 'Invalid reservation ID');
  const [[lookup]] = await pool.query('SELECT resource_id FROM reservations WHERE id = ?', [id]);
  if (!lookup) throw httpError(404, 'Reservation not found');
  return transaction(lookup.resource_id, async (connection, resource) => {
    const [[existing]] = await connection.query('SELECT * FROM reservations WHERE id = ? FOR UPDATE', [id]);
    if (!existing) throw httpError(404, 'Reservation not found');
    if (mode === 'delete') {
      if (user.role !== 'admin') throw httpError(403, 'Administrator access required');
      await connection.query('DELETE FROM reservations WHERE id = ?', [id]);
      return;
    }
    if (mode === 'edit') {
      if (!ownerOrAdmin(user, existing)) throw httpError(403, 'Access denied');
      if (data.status !== undefined || data.resource_id !== undefined || data.user_id !== undefined) throw httpError(400, 'Use the review or cancellation action to change status; ownership and resource cannot be edited');
      if (!ACTIVE.includes(existing.status)) throw httpError(409, 'Closed reservations cannot be edited');
      const changesTime = data.start_time !== undefined || data.end_time !== undefined;
      const times = interval(data.start_time ?? existing.start_time, data.end_time ?? existing.end_time, { future: changesTime });
      if (changesTime) enforcePolicy(times);
      available(resource);
      await conflict(connection, resource.id, times, id);
      // Changed approved requests must be reviewed again.
      const status = changesTime ? 'pending' : existing.status;
      await connection.query('UPDATE reservations SET start_time = ?, end_time = ?, purpose = ?, notes = ?, attendees = ?, status = ? WHERE id = ?',
        [times.start_time, times.end_time, text(data.purpose === undefined ? existing.purpose : data.purpose,'Purpose'), text(data.notes === undefined ? existing.notes : data.notes,'Notes'), attendeeCount(resource, data.attendees === undefined ? existing.attendees : data.attendees), status, id]);
      if(changesTime) await connection.query('UPDATE reservations SET approved_by=NULL,approved_at=NULL,reviewed_by=NULL,reviewed_at=NULL,rejection_reason=NULL WHERE id=?',[id]);
      await recordEvent(connection,id,user,'edited',existing.status,status);
      return;
    }
    const status = mode === 'cancel' ? 'cancelled' : data.status;
    if (!STATES.includes(status)) throw httpError(400, 'Invalid reservation status');
    if (mode === 'cancel') {
      if (!ownerOrAdmin(user, existing)) throw httpError(403, 'Access denied');
    } else {
      if (!reviewer(user)) throw httpError(403, 'Reviewer access required');
      if (Number(user.id) === Number(existing.user_id) && status === 'approved') throw httpError(403, 'You cannot approve your own reservation');
    }
    if (status === existing.status) return;
    const reason = text(data.reason,'Reason');
    if(status==='rejected' && (!reason || !reason.trim())) throw httpError(400,'A rejection reason is required');
    // I allow closed requests to be reopened after checking the resource,
    // booking time and any conflicting reservations.
    if (ACTIVE.includes(status)) {
      available(resource);
      const times = interval(existing.start_time, existing.end_time, { future: true });
      enforcePolicy(times);
      await conflict(connection, resource.id, times, id);
    }
    await connection.query('UPDATE reservations SET status=?,rejection_reason=?,reviewed_by=?,reviewed_at=NOW(),approved_by=?,approved_at=IF(? IS NULL,NULL,NOW()),cancelled_reason=? WHERE id=?',[status,status==='rejected'?reason.trim():null,user.id,status==='approved'?user.id:null,status==='approved'?user.id:null,status==='cancelled'?reason:null,id]);
    await recordEvent(connection,id,user,mode,existing.status,status,reason?.trim()||null);
  });
}
module.exports = { create, mutate };

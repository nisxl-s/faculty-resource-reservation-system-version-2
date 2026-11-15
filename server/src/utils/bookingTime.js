const { httpError } = require('./httpError');
// DATETIME values are campus wall times. Normalize offsets to Asia/Colombo.
const CAMPUS_TIME_ZONE = 'Asia/Colombo';
function wallTime(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const get = name => parts.find(p => p.type === name).value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}
function parseTime(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return { date: value, sql: wallTime(value) };
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) {
    throw httpError(400, 'Use an ISO date and time for the booking interval');
  }
  const fields = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  const [year,month,day,hour,minute,second] = fields.slice(1).map(v => Number(v || 0));
  const calendar = new Date(Date.UTC(year,month-1,day));
  if (year < 1000 || calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month-1 || calendar.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) throw httpError(400, 'Invalid booking date');
  const normalized = value.replace(' ', 'T');
  const withZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : normalized + '+05:30';
  const date = new Date(withZone);
  if (!Number.isFinite(date.getTime())) throw httpError(400, 'Invalid booking time');
  return { date, sql: wallTime(date) };
}
function interval(start, end, { future = false } = {}) {
  const a = parseTime(start), b = parseTime(end);
  if (b.date <= a.date) throw httpError(400, 'End time must be after start time');
  if (future && a.date <= new Date()) throw httpError(400, 'Start time must be in the future');
  return { start_time: a.sql, end_time: b.sql };
}
module.exports = { CAMPUS_TIME_ZONE, parseTime, interval };

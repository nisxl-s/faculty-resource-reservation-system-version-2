const { httpError } = require('./httpError');

function monthWindow(month) {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw httpError(400, 'Use a calendar month in YYYY-MM format');
  const [year, number] = month.split('-').map(Number);
  if (year < 1000 || year > 9998) throw httpError(400, 'Calendar year is outside the supported range');
  const next = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`;
  return { start: `${month}-01 00:00:00`, end: `${next}-01 00:00:00` };
}

// Publish occupied intervals only. Adjacent/overlapping bookings form one block.
function occupiedIntervals(rows) {
  const result = [];
  for (const row of rows) {
    const slot = { start_time: row.start_time, end_time: row.end_time };
    const previous = result.at(-1);
    if (previous && slot.start_time <= previous.end_time) {
      if (slot.end_time > previous.end_time) previous.end_time = slot.end_time;
    } else result.push(slot);
  }
  return result;
}
module.exports = { monthWindow, occupiedIntervals };

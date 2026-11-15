const {httpError}=require('./httpError');
function readPolicy(env=process.env) {
  function number(name) {if(!env[name])return null;const n=Number(env[name]);if(!Number.isFinite(n)||n<=0)throw Error(name+' must be a positive number');return n;}
  function clock(name) {if(!env[name])return null;if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(env[name]))throw Error(name+' must use HH:MM');return env[name];}
  const p={minMinutes:number('BOOKING_MIN_MINUTES'),maxMinutes:number('BOOKING_MAX_MINUTES'),advanceDays:number('BOOKING_ADVANCE_DAYS'),opens:clock('BOOKING_OPEN_TIME'),closes:clock('BOOKING_CLOSE_TIME')};
  if(p.minMinutes&&p.maxMinutes&&p.minMinutes>p.maxMinutes)throw Error('Booking minimum exceeds maximum');
  if(Boolean(p.opens)!==Boolean(p.closes)||p.opens&&p.opens>=p.closes)throw Error('Set both booking hours with opening before closing');
  return p;
}
function enforcePolicy(times,p=readPolicy(),now=new Date()) {
  const start=new Date(times.start_time.replace(' ','T')+'+05:30'),end=new Date(times.end_time.replace(' ','T')+'+05:30');
  const minutes=(end-start)/60000;
  if(p.minMinutes&&minutes<p.minMinutes)throw httpError(400,'Booking must last at least '+p.minMinutes+' minutes');
  if(p.maxMinutes&&minutes>p.maxMinutes)throw httpError(400,'Booking cannot exceed '+p.maxMinutes+' minutes');
  if(p.advanceDays&&start-now>p.advanceDays*86400000)throw httpError(400,'Booking exceeds the advance-booking window');
  if(p.opens&&(times.start_time.slice(0,10)!==times.end_time.slice(0,10)||times.start_time.slice(11,19)<p.opens+':00'||times.end_time.slice(11,19)>p.closes+':00'))throw httpError(400,'Booking must fit within operating hours '+p.opens+'–'+p.closes+' (Sri Lanka time)');
}
module.exports={readPolicy,enforcePolicy};

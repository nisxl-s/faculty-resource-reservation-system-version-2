import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Lock } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import { campusToday } from '../config/resourceDetails';
import './ResourceAvailabilityCalendar.css';

const dateLabel = date => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));
const nextDay = date => new Date(new Date(date + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10);
function changeMonth(month, delta) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
}
const timePart = time => time.slice(11, 19).replace(/:00$/, '');
function dayBookings(bookings) {
  const result = {};
  for (const booking of bookings) {
    const first = booking.start_time.slice(0, 10), last = booking.end_time.slice(0, 10);
    for (let day = first; day < last || (day === last && booking.end_time.slice(11, 19) > '00:00:00'); day = nextDay(day)) {
      const period = { start: day === first ? timePart(booking.start_time) : '00:00', end: day === last ? timePart(booking.end_time) : '24:00' };
      (result[day] ||= []).push(period);
    }
  }
  return result;
}

export default function ResourceAvailabilityCalendar({ resource, selectedDate, onSelectDate }) {
  const today = campusToday();
  const [month, setMonth] = useState(() => (selectedDate || today).slice(0, 7));
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: '', phase: 'loading' });
  const key = `${resource.id}|${month}|${revision}`;
  useEffect(() => { if (selectedDate) setMonth(selectedDate.slice(0, 7)); }, [selectedDate]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, phase: 'loading' });
    async function load() {
      try {
        const response = await fetch(`${API_ENDPOINTS.RESOURCE_BY_ID(resource.id)}/calendar?month=${month}`, { headers: getAuthHeaders(), cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data?.bookings)) throw new Error(result.message || 'Could not load booked times.');
        if (!controller.signal.aborted) setState({ key, phase: 'ready', ...result.data });
      } catch (error) {
        if (!controller.signal.aborted) setState({ key, phase: 'error', message: error.message || 'Could not load booked times.' });
      }
    }
    load();
    return () => controller.abort();
  }, [key, month, resource.id]);

  const ready = state.key === key && state.phase === 'ready';
  const failed = state.key === key && state.phase === 'error';
  const periods = useMemo(() => ready ? dayBookings(state.bookings) : {}, [ready, state.bookings]);
  const selected = selectedDate?.startsWith(month + '-') ? selectedDate : '';
  const selectable = ready && state.resource_status === 'available';
  const [year, number] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const cells = Math.ceil((offset + days) / 7) * 7;
  const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T00:00:00Z'));

  return <section id="resource-availability-calendar" className="resource-calendar" aria-label={'Availability calendar for ' + resource.name}>
    <div className="resource-calendar-top"><div><h4>{resource.name}</h4><p>Booked periods only · Sri Lanka time · 24-hour clock</p></div><button type="button" className="resource-calendar-refresh" aria-label="Refresh resource calendar" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} /></button></div>
    <div className="resource-calendar-navigation"><button type="button" aria-label="Previous calendar month" disabled={month === '1000-01'} onClick={() => setMonth(changeMonth(month, -1))}><ChevronLeft size={18} /></button><h5 aria-live="polite">{monthLabel}</h5><button type="button" aria-label="Next calendar month" disabled={month === '9998-12'} onClick={() => setMonth(changeMonth(month, 1))}><ChevronRight size={18} /></button></div>
    <p className="resource-calendar-note">Select a date to see its booked times and fill both dates in your reservation form. Partly booked days can still have free hours.</p>
    <div className="resource-calendar-status" role="status" aria-live="polite">{failed ? state.message : !ready ? 'Loading booked times…' : !selectable ? 'This resource is currently unavailable for reservation.' : 'Calendar updated. Availability is rechecked when you submit.'}</div>
    {failed && <button type="button" className="resource-calendar-retry" onClick={() => setRevision(value => value + 1)}>Retry calendar</button>}
    <div className="resource-calendar-weekdays" aria-hidden="true">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div>
    <div className="resource-calendar-grid" aria-busy={!ready && !failed}>
      {Array.from({ length: cells }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1 || day > days) return <div key={index} className="resource-calendar-blank" aria-hidden="true" />;
        const date = `${month}-${String(day).padStart(2, '0')}`;
        const booked = periods[date] || [];
        const past = date < today;
        return <button type="button" key={date} className={'resource-calendar-day' + (booked.length ? ' has-bookings' : '') + (selected === date ? ' is-selected' : '') + (past ? ' is-past' : '')} disabled={past || !selectable} aria-label={`Choose ${dateLabel(date)}${ready ? booked.length ? ', booked periods present' : ', no booked periods' : ', availability not loaded'}`} aria-pressed={selected === date} aria-current={date === today ? 'date' : undefined} onClick={() => onSelectDate(date)}>
          <span className="resource-calendar-date">{day}</span>
          {ready && booked.length > 0 && <><span className="resource-calendar-mobile-count"><i />Booked</span><span className="resource-calendar-events">{booked.slice(0, 2).map((period, i) => <span className="resource-calendar-event" key={i}><strong>Booked</strong><span>{period.start}–{period.end}</span></span>)}{booked.length > 2 && <span className="resource-calendar-more">+{booked.length - 2} more</span>}</span></>}
        </button>;
      })}
    </div>
    <div className="resource-calendar-agenda" aria-live="polite" aria-label="Selected day booked times">
      <h5>{selected ? dateLabel(selected) : 'Choose a day'}</h5>
      {!ready ? <p>{failed ? 'Booked times could not be checked. Retry to continue.' : 'Checking booked times…'}</p> : !selected ? <p>Tap a date to view all its booked periods and fill the reservation dates.</p> : periods[selected]?.length ? <ul>{periods[selected].map((period, i) => <li key={i}><span className="resource-calendar-booked-label">Booked</span><time>{period.start}–{period.end}</time></li>)}</ul> : <p>No booked periods on this date. Choose your preferred times in the form.</p>}
    </div>
    <p className="resource-calendar-privacy"><Lock size={13} aria-hidden="true" />Booking names and details are private. Only occupied periods are shown.</p>
  </section>;
}

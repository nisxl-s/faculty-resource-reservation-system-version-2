import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock, MapPin, Search, ShieldCheck, Users } from 'lucide-react';
import ResourceThumbnail from './ResourceThumbnail';
import './HowItWorksCards.css';

const steps = [
  { title: 'Discover.', label: 'Find your space', icon: Search, summary: 'The right room, lab, or equipment for your next idea.', text: 'Explore your faculty’s Resource Directory and find a facility that fits your plans.', points: ['Filter by type and availability', 'Compare location and capacity'], cta: 'Browse faculty resources' },
  { title: 'Reserve.', label: 'Make your request', icon: CalendarDays, summary: 'Turn a free slot into your next campus session.', text: 'Choose your resource, enter your dates and times, and share the purpose of your booking.', points: ['Add attendees and booking details', 'Submit for administrator review'], cta: 'Make a reservation' },
  { title: 'Review.', label: 'A clear decision', icon: ShieldCheck, summary: 'A shared workspace for responsible resource use.', text: 'Administrators review requests in the Reservation Ledger and decide which bookings to approve.', points: ['Review the booking schedule', 'Approve or reject requests'], cta: 'Explore the admin workspace' },
  { title: 'You’re set.', label: 'Keep plans in view', icon: CheckCircle2, summary: 'Follow your booking. Arrive ready to make it happen.', text: 'Keep every request in My Reservations and check its status before your session.', points: ['Track pending and approved requests', 'See your upcoming reservations'], cta: 'View your reservations' },
];

function CardPreview({ index }) {
  if (index === 0) return <div className="hw-ui hw-directory"><div className="hw-ui-heading"><Search size={15}/><strong>Resource Directory</strong><span>12 facilities</span></div><div className="hw-search"><Search size={13}/><span>Find your next space</span></div><div className="hw-filter-row"><b>All Facilities</b><span>Classrooms</span><span>Labs</span></div><ResourceThumbnail type="classroom" name="Lecture Hall A" size="md" showBadge={false}/><div className="hw-resource-body"><div><span className="hw-type">CLASSROOM</span><span className="hw-status">Available</span></div><h4>Lecture Hall A</h4><p><MapPin size={11}/> Faculty Building <Users size={11}/> 120 seats</p><div className="hw-yellow-action">Reserve Now <ArrowRight size={13}/></div></div></div>;
  if (index === 1) return <div className="hw-ui hw-book"><div className="hw-ui-heading"><CalendarDays size={15}/><strong>Book a Resource</strong></div><div className="hw-book-resource"><span><CalendarDays size={20}/></span><div><strong>Lecture Hall A</strong><small>Faculty Building · Classroom</small></div><CheckCircle2 size={14}/></div><div className="hw-form-section">DATE & TIME</div><div className="hw-form-grid">{[['Start Date','21 Oct 2026'],['Start Time','10:00 AM'],['End Date','21 Oct 2026'],['End Time','11:30 AM']].map(([l,v])=><div key={l}><small>{l}</small><span>{v}</span></div>)}</div><div className="hw-duration"><Clock size={12}/> Duration: 1h 30m</div><div className="hw-form-section">PURPOSE OF BOOKING</div><div className="hw-purpose">Group project discussion<span/></div><div className="hw-yellow-action">Submit Reservation <ArrowRight size={13}/></div><div className="hw-submitted"><Check size={12}/> Request submitted</div></div>;
  if (index === 2) return <div className="hw-ui hw-review"><div className="hw-ui-heading"><ShieldCheck size={15}/><strong>Reservation Ledger</strong><span>Admin</span></div><div className="hw-ledger-tabs"><b>All Bookings</b><span>Pending Queue <i>2</i></span></div><div className="hw-ledger-labels"><span>RESOURCE</span><span>STATUS</span></div><div className="hw-review-request"><div><strong>Lecture Hall A</strong><small>21 Oct · 10:00–11:30</small></div><span className="hw-status hw-pending hw-was-pending">Pending</span><span className="hw-status hw-now-approved">Approved</span></div><div className="hw-request-info"><Users size={12}/><span>30 attendees</span><CalendarDays size={12}/><span>1h 30m</span></div><p className="hw-review-purpose">Group project discussion</p><div className="hw-decision"><span>View details</span><b><Check size={13}/> Approve</b></div><div className="hw-mini-row"><span>Computer Laboratory<small>22 Oct · 09:00–11:00</small></span><span className="hw-status">Approved</span></div><div className="hw-review-confirm"><CheckCircle2 size={14}/> Reservation approved</div></div>;
  return <div className="hw-ui hw-reservations"><div className="hw-ui-heading"><CalendarDays size={15}/><strong>My Reservations</strong></div><div className="hw-stats"><div><strong>08</strong><small>Total Requests</small></div><div><strong>02</strong><small>Pending Approval</small></div><div><strong>04</strong><small>Approved & Active</small></div></div><div className="hw-form-section">MY RESERVATION LEDGER</div><div className="hw-upcoming"><div className="hw-date"><small>OCT</small><b>21</b></div><div><strong>Lecture Hall A</strong><small>10:00 AM – 11:30 AM</small><span className="hw-status">Approved</span></div></div><div className="hw-mini-row"><span>Computer Laboratory<small>22 Oct · 09:00–11:00</small></span><span className="hw-status hw-pending">Pending</span></div><div className="hw-ready"><CheckCircle2 size={15}/> Your next session, organised.</div></div>;
}

export default function HowItWorksCards({ reduced, paused }) {
  const [active, setActive] = useState(0);
  const buttons = useRef([]);
  const onKey = (event, index) => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % steps.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + steps.length - 1) % steps.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = steps.length - 1;
    if (next !== undefined) { event.preventDefault(); setActive(next); buttons.current[next]?.focus(); }
  };
  return <section className={`fr-section hw-section ${reduced ? 'hw-reduced' : ''} ${paused ? 'hw-paused' : ''}`} id="fr-how" aria-labelledby="hw-heading">
    <div className="hw-heading"><div><span className="fr-eyebrow">FROM YOUR FIRST IDEA TO YOUR NEXT SESSION</span><h2 id="hw-heading">Good ideas deserve<br/>a place to <em>happen.</em></h2></div><div><p>Find it. Request it. Make it happen.<br/>Every part of your campus booking, connected.</p><span className="hw-explore-hint"><span className="hw-hint-desktop">Hover over a step to explore</span><span className="hw-hint-touch">Tap a step to explore</span><ArrowRight size={15}/></span></div></div>
    <div className="hw-cards" aria-label="How faculty reservations work">{steps.map((step, index)=>{
      const open = active === index;
      return <article key={step.title} className={`hw-card hw-card-${index} ${open ? 'is-open' : ''}`} onPointerEnter={e=>{if(e.pointerType === 'mouse' && window.matchMedia('(min-width: 851px) and (hover: hover)').matches) setActive(index);}} onFocusCapture={e=>{if(e.target.matches(':focus-visible')) setActive(index);}}>
        <div className="hw-card-glow" aria-hidden="true"/><div className="hw-card-top"><span className="hw-step-icon"><step.icon size={21}/></span><span className="hw-step-number">0{index+1}</span></div>
        <h3><button type="button" ref={el=>{buttons.current[index]=el;}} id={`hw-button-${index}`} aria-expanded={open} aria-controls={`hw-content-${index}`} onClick={()=>setActive(index)} onKeyDown={e=>onKey(e,index)}><span>{step.title}</span><ArrowUpRight size={21}/></button></h3>
        <p className="hw-summary">{step.summary}</p>
        <div id={`hw-content-${index}`} className="hw-details" role="region" aria-labelledby={`hw-button-${index}`} aria-hidden={!open} inert={!open ? '' : undefined}><div><p>{step.text}</p><ul>{step.points.map(point=><li key={point}><Check size={14}/>{point}</li>)}</ul><Link to="/login">{step.cta}<ArrowUpRight size={14}/></Link></div></div>
        <div className="hw-art" aria-hidden="true"><div className="hw-orbit"/><div className="hw-preview"><CardPreview index={index}/></div><span className="hw-preview-caption">{step.label} · Sample data</span></div>
        <div className="hw-card-bottom"><span>{step.label}</span><span>{open?'−':'+'}</span></div>
      </article>;
    })}</div>
  </section>;
}

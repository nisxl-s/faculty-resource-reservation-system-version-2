import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, Pause, Play, Search, ShieldCheck } from 'lucide-react';
import SiteSectionPreview from './SiteSectionPreview';
import './WhyChooseUs.css';

const features = [
  { icon: Search, title: 'The right resource, easier to find.', text: 'Search your Resource Directory by name or location. Filter classrooms, laboratories, halls, and equipment by type and availability.', points: ['Compare capacity and location', 'Explore resource details in one place'], caption: 'Your resource directory', screen: 'Browse Resources' },
  { icon: CalendarDays, title: 'A clearer way to make your request.', text: 'Choose your dates and times, add attendees, and describe your plans. Review your Booking Summary before submitting your request.', points: ['Start and end times, clearly defined', 'Your purpose and requirements, together'], caption: 'From an idea to a booking request', screen: 'Book a Resource' },
  { icon: Bell, title: 'Every reservation, accounted for.', text: 'Keep pending requests, approved bookings, and reservation history together in My Reservations. Know where your plans stand before your next session.', points: ['Follow each reservation’s status', 'Keep upcoming sessions in view'], caption: 'Your plans, all in one place', screen: 'My Reservations' },
  { icon: ShieldCheck, title: 'A connected faculty workspace.', text: 'Dedicated student and administrator experiences bring requests and decisions together. Administrators review bookings and keep shared resources organised.', points: ['Review requests in the Reservation Ledger', 'Manage faculty resources responsibly'], caption: 'Clear decisions. Shared possibilities.', screen: 'Booking History' },
];

export default function WhyChooseUs({ reduced, paused, onTogglePause }) {
  const track = useRef(null);
  const stage = useRef(null);
  const buttons = useRef([]);
  const manual = useRef(null);
  const [position, setPosition] = useState(0);
  const active = Math.round(position);

  useEffect(() => {
    let frame;
    const update = () => {
      if (!track.current || !stage.current || reduced || window.innerWidth <= 900 || window.innerHeight < 760 || manual.current !== null) return;
      const top = track.current.getBoundingClientRect().top;
      const distance = Math.max(1, track.current.offsetHeight - stage.current.offsetHeight);
      const progress = Math.max(0, Math.min(1, (112 - top) / distance));
      setPosition(progress * (features.length - 1));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const resume = () => { manual.current = null; };
    const onKey = e => { if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' '].includes(e.key) && !e.target.closest('.wf-options')) resume(); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('wheel', resume, { passive: true });
    window.addEventListener('touchmove', resume, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); window.removeEventListener('wheel', resume); window.removeEventListener('touchmove', resume); window.removeEventListener('keydown', onKey); };
  }, [reduced]);

  const select = index => { manual.current = index; setPosition(index); };
  const keySelect = (event, index) => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % features.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + features.length - 1) % features.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = features.length - 1;
    if (next !== undefined) { event.preventDefault(); select(next); buttons.current[next]?.focus(); }
  };

  return <section id="fr-features" ref={track} className={`wf-track ${reduced ? 'wf-reduced' : ''} ${paused ? 'wf-paused' : ''}`} aria-labelledby="wf-heading">
    <div className="wf-stage" ref={stage}>
      <div className="wf-copy"><span className="fr-eyebrow"><ShieldCheck size={15}/> WHY CHOOSE US</span><h2 id="wf-heading">A better way to<br/>make campus<br/>{' '}<em>plans happen.</em></h2>
        <div className="wf-options" aria-label="Faculty reservation benefits">{features.map((feature, index)=>{
          const open = index === active;
          return <div className={`wf-option ${open ? 'is-active' : ''}`} key={feature.title}>
            <h3><button type="button" ref={el=>{buttons.current[index]=el;}} id={`wf-option-${index}`} aria-expanded={open} aria-controls={`wf-description-${index}`} onClick={()=>select(index)} onKeyDown={e=>keySelect(e,index)}><feature.icon size={18}/><span>{feature.title}</span><span className="wf-option-symbol" aria-hidden="true">{open?'−':'+'}</span></button></h3>
            <div id={`wf-description-${index}`} className="wf-option-content" role="region" aria-labelledby={`wf-option-${index}`} aria-hidden={!open} inert={!open ? '' : undefined}><div><p>{feature.text}</p><Link to="/login">Explore your workspace <ArrowUpRight size={13}/></Link></div></div>
            <span className="wf-option-progress" aria-hidden="true" style={{transform:`scaleX(${Math.max(0,Math.min(1,position-index+0.5))})`}}/>
          </div>;
        })}</div>
      </div>
      <div className={`wf-visual wf-theme-${active}`}>
        <div className="wf-glow" aria-hidden="true"/><div className="wf-rings" aria-hidden="true"><i/><i/><i/></div>
        <div className="wf-card-top"><span><span className="wf-status-light"/> YOUR FACULTY, CONNECTED</span><span>0{active+1} / 04</span></div>
        <div className="wf-scene-stack" role="region" aria-label={`${features[active].screen} feature preview`}>{features.map((feature,index)=>{
          const offset = index-position;
          const weight = Math.max(0,1-Math.abs(offset));
          return <div className={`wf-scene ${index===active?'is-current':''}`} key={feature.title} aria-hidden={index!==active} inert={index!==active ? '' : undefined} style={{opacity:weight,transform:`translate3d(0,${offset*35}px,0) scale(${1-Math.min(1,Math.abs(offset))*.035})`,pointerEvents:index===active?'auto':'none',zIndex:index===active?2:1}}><SiteSectionPreview chapter={index}/></div>;
        })}</div>
        <div className="wf-outcome"><span className="wf-outcome-icon"><Check size={16}/></span><div><strong>{features[active].caption}</strong><span>{features[active].points[0]}</span></div></div>
        <div className="wf-card-bottom"><span><ChevronDown size={13}/><span className="wf-scroll-label">Scroll to explore the benefits</span><span className="wf-tap-label">Choose a benefit to explore</span></span><button type="button" onClick={onTogglePause} disabled={reduced} aria-label={paused?'Play benefit animations':'Pause benefit animations'}>{paused||reduced?<Play size={13}/>:<Pause size={13}/>}</button></div>
      </div>
    </div>
  </section>;
}

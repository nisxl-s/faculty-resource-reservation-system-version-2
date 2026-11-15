import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CalendarDays, Bell, ShieldCheck, ArrowUpRight, Check, Pause, Play, ChevronDown } from 'lucide-react';
import './ResourceShowcase.css';
import SiteSectionPreview from './SiteSectionPreview';

const chapters = [
  { name: 'Discover', icon: Search, label: 'YOUR CAMPUS, AT YOUR FINGERTIPS', title: 'The right resource.\nA world of possibility.', text: 'Find classrooms, laboratories, halls, and equipment. Filter by type and availability, then explore the details before you decide.', points: ['Search by name or location', 'Compare capacity and availability'], action: 'Explore faculty resources' },
  { name: 'Reserve', icon: CalendarDays, label: 'FROM AN IDEA TO A PLAN', title: 'Pick your time.\nMake it yours.', text: 'Check the schedule, choose your start and end time, and tell us what you have planned. Your next session starts with one request.', points: ['See the resource schedule', 'Add your purpose and submit a request'], action: 'Plan your next session' },
  { name: 'Stay updated', icon: Bell, label: 'EVERY REQUEST, IN VIEW', title: 'Less wondering.\nMore getting ready.', text: 'Keep upcoming sessions and reservation history together. Follow each request from pending to approved in your personal dashboard.', points: ['Track pending and approved bookings', 'Keep your upcoming reservations organised'], action: 'See your reservations' },
  { name: 'Manage', icon: ShieldCheck, label: 'A CLEARER VIEW FOR ADMINISTRATORS', title: 'Shared resources.\nSeamlessly managed.', text: 'Give your faculty the space to do more. Review booking requests, maintain the resource catalogue, and keep availability up to date.', points: ['Review and approve reservation requests', 'Manage resources and maintenance status'], action: 'Explore the faculty workspace' },
];
export default function ResourceShowcase({ reduced, paused, onTogglePause }) {
  const track = useRef(null);
  const buttons = useRef([]);
  const [active, setActive] = useState(0);
  const manual = useRef(null);
  useEffect(() => {
    let frame;
    const update = () => {
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const desktop = window.innerWidth > 760 && window.innerHeight >= 760;
      const clamp = value => Math.max(0, Math.min(1, value));
      // Grow into the viewport before handing the scroll over to the chapters.
      // Measure the untransformed track so scaling never feeds back into progress.
      const expansionDistance = desktop ? window.innerHeight * 0.4 : 0;
      const start = window.innerHeight * 0.85;
      const end = desktop ? 112 : window.innerHeight * 0.15;
      const expansion = reduced || paused ? 1 : clamp((start - rect.top) / (start - end + expansionDistance));
      const eased = expansion * expansion * (3 - 2 * expansion);
      const initialScale = desktop ? 0.76 : 0.94;
      el.style.setProperty('--rs-expand-scale', initialScale + (1 - initialScale) * eased);
      el.style.setProperty('--rs-expand-radius', `${54 - 24 * eased}px`);
      if (!desktop || reduced) return;
      const distance = Math.max(1, el.offsetHeight - window.innerHeight);
      const progress = clamp((112 - rect.top - expansionDistance) / Math.max(1, distance - expansionDistance));
      const next = Math.min(3, Math.floor(progress * 4));
      if (manual.current === null) setActive(next);
      el.style.setProperty('--rs-progress', progress);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const resumeScroll = () => { manual.current = null; };
    const onScrollKey = e => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) resumeScroll(); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', resumeScroll, { passive: true });
    window.addEventListener('touchmove', resumeScroll, { passive: true });
    window.addEventListener('keydown', onScrollKey);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); window.removeEventListener('wheel', resumeScroll); window.removeEventListener('touchmove', resumeScroll); window.removeEventListener('keydown', onScrollKey); };
  }, [reduced, paused]);
  const choose = i => { manual.current = i; setActive(i); };
  const onKey = (e, i) => {
    let next;
    if (e.key === 'ArrowRight') next = (i+1)%4;
    if (e.key === 'ArrowLeft') next = (i+3)%4;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 3;
    if (next !== undefined) { e.preventDefault(); choose(next); buttons.current[next].focus(); }
  };
  const chapter = chapters[active];
  return <section id="fr-resources" ref={track} className={`rs-track ${reduced ? 'rs-reduced' : ''} ${paused ? 'rs-paused' : ''}`} aria-label="Explore the faculty reservation experience">
    <div className={`rs-sticky rs-theme-${active}`}>
      <div className="rs-gradient" aria-hidden="true"><i/><i/><i/></div>
      <div className="rs-intro"><span>ONE CAMPUS. ENDLESS POSSIBILITIES.</span><p>Everything you need to make it happen.</p></div>
      <div className="rs-tabs" role="tablist" aria-label="Faculty capabilities">{chapters.map((c,i)=><button type="button" key={c.name} ref={el=>{buttons.current[i]=el;}} id={`rs-tab-${i}`} role="tab" aria-selected={active===i} aria-controls="rs-panel" tabIndex={active===i?0:-1} className={active===i?'is-active':''} onClick={()=>choose(i)} onKeyDown={e=>onKey(e,i)}><c.icon size={19}/><span>{c.name}</span><small>0{i+1}</small></button>)}</div>
      <div className="rs-panel" id="rs-panel" role="tabpanel" aria-labelledby={`rs-tab-${active}`} tabIndex={0}>
        <div className="rs-copy" key={`copy-${active}`}><span className="rs-chapter-label"><chapter.icon size={16}/>{chapter.name}</span><small>{chapter.label}</small><h2>{chapter.title.split('\n').map((line,i)=><React.Fragment key={line}>{i>0&&<br/>}{line}</React.Fragment>)}</h2><p>{chapter.text}</p><ul>{chapter.points.map(point=><li key={point}><Check size={15}/>{point}</li>)}</ul><Link to="/login">{chapter.action}<ArrowUpRight size={17}/></Link></div>
        <div className="rs-visual" key={`visual-${active}`}><SiteSectionPreview chapter={active}/><span className="rs-preview-label">Your faculty workspace · Animated with sample data</span></div>
      </div>
      <div className="rs-bottom"><span><b>0{active+1}</b> / 04</span><div className="rs-chapter-progress" aria-hidden="true">{chapters.map((c,i)=><i key={c.name} className={i<=active?'is-filled':''}/>)}</div><span className="rs-scroll-hint">Scroll to explore <ChevronDown size={14}/></span><button type="button" onClick={onTogglePause} disabled={reduced} aria-label={paused?'Play feature animations':'Pause feature animations'}>{paused||reduced?<Play size={14}/>:<Pause size={14}/>}</button></div>
    </div>
  </section>;
}

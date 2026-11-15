import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, Compass, FileText, GraduationCap, Layers, MapPin, Monitor, MousePointer2, Plus, Search, Users, X } from 'lucide-react';
import ResourceThumbnail from './ResourceThumbnail';
import uniLogo from '../assets/images/uni_logo.png';
import '../assets/css/browse_resources.css';
import '../assets/css/bookinghistory.css';
import './SiteSectionPreview.css';

const samples = [
  { name: 'Lecture Hall A', type: 'classroom', capacity: 120, location: 'Faculty Building · Ground floor' },
  { name: 'Computer Laboratory', type: 'lab', capacity: 40, location: 'Technology Building · First floor' },
  { name: 'Multimedia Projector', type: 'equipment', capacity: 1, location: 'Faculty Resource Centre' },
];

function Stats({ browse = false }) {
  const stats = browse ? [['12','Total Facilities',Layers],['09','Available Now',CheckCircle2],['06','Classrooms & Halls',GraduationCap],['06','Labs & AV Gear',Monitor]] : [['08','Total Requests',CalendarDays],['02','Pending Approval',Clock],['04','Approved & Active',CheckCircle2],['02','Completed',Clock]];
  return <div className={browse ? 'br-stats-grid' : 'bh-stats-grid'}>{stats.map(([n,label,Icon],i)=><div key={label} className={`${browse?'br':'bh'}-stat-card ${browse?['br-stat-card--total','br-stat-card--available','br-stat-card--classrooms','br-stat-card--labs'][i]:['bh-stat-card--total','bh-stat-card--pending','bh-stat-card--approved','bh-stat-card--completed'][i]}`}><div className={`${browse?'br':'bh'}-stat-icon`}><Icon size={22}/></div><div><div className={`${browse?'br':'bh'}-stat-value`}>{n}</div><div className={`${browse?'br':'bh'}-stat-label`}>{label}</div></div></div>)}</div>;
}

function Directory() {
  return <><div className="sp-page-hero"><div className="br-hero__icon"><Compass size={30}/></div><div><h3>Browse Resources</h3><p>Discover and reserve campus facilities for your academic needs.</p></div><span className="sp-outline-action"><CalendarDays size={16}/> My Reservations</span></div><Stats browse/>
    <div className="br-catalog-card"><div className="br-catalog-card__header"><div className="br-header-main"><div className="br-header-icon"><Compass size={22}/></div><div><h4 className="br-header-title">Resource Directory</h4><p className="br-header-sub">Filter and search facilities available for faculty & student reservation</p></div></div><span className="br-header-badge"><CheckCircle2 size={14}/> 12 Facilities Found</span></div>
    <div className="br-tabs-row">{['All Facilities','Classrooms','Laboratories','Conference Halls','Equipment'].map((t,i)=><span key={t} className={`br-tab-chip ${i===0?'br-tab-chip--active':''}`}><span>{t}</span><span className="br-tab-chip-count">{[12,4,3,2,3][i]}</span></span>)}</div>
    <div className="sp-search-row"><div><Search size={18}/><span className="sp-typing">Search by facility name, building, room location, or keywords…</span></div><span>All Availability <ChevronDown size={15}/></span><span>Name (A → Z) <ChevronDown size={15}/></span></div>
    <div className="sp-catalog-count">Showing <strong>12</strong> of <strong>12</strong> catalog facilities</div>
    <div className="sp-catalog-grid">{samples.map((r,i)=><div key={r.name} className="br-card sp-resource" style={{'--order':i}}><div className="br-card-media"><ResourceThumbnail type={r.type} name={r.name} showBadge size="md"/></div><div className="br-card-body"><div className="br-card-badges-row"><span className={`br-type-pill br-type-pill--${r.type}`}>{['Classroom','Laboratory','Equipment'][i]}</span><span className="br-status-pill br-status-pill--available"><span className="br-status-dot"/>Available</span></div><h4 className="br-card-title">{r.name}</h4><p className="br-card-desc">{['A spacious teaching environment for lectures and collaborative sessions.','Equipped workstations for practical sessions and academic research.','Portable presentation equipment for your next faculty session.'][i]}</p><div className="br-card-meta"><span className="br-meta-item"><MapPin size={13}/>{r.location}</span><span className="br-meta-item"><Users size={13}/>Capacity: {r.capacity}</span></div></div><div className="br-card-footer"><span className="sp-reserve-action">Reserve Now <ArrowRight size={15}/></span></div></div>)}</div></div></>;
}

function Booking() {
  return <><div className="sp-page-hero"><div><h3><em>Book</em> a Resource</h3><p>Reserve a resource for your academic or extracurricular activities</p></div></div><div className="sp-book-layout"><div className="sp-book-form"><h4><FileText size={20}/>Resource Information</h4><div className="sp-resource-banner"><CheckCircle2 size={17}/>Booking for selected resource</div><div className="sp-book-resource"><ResourceThumbnail type="classroom" name="Lecture Hall A" size="md" showBadge={false}/><div><h4>Lecture Hall A</h4><small>classroom</small><p>A spacious teaching environment for academic activities.</p><span><MapPin size={14}/>Faculty Building <Users size={14}/>Capacity: 120</span></div></div><h4><CalendarDays size={20}/>Date & Time</h4><div className="sp-form-grid">{[['Start Date','21/10/2026',CalendarDays],['Start Time','10:00 AM',Clock],['End Date','21/10/2026',CalendarDays],['End Time','11:30 AM',Clock]].map(([label,value,Icon])=><div key={label}><span className="sp-field-label">{label} <em>*</em></span><div className="sp-field">{value}<Icon size={17}/></div></div>)}</div><div className="sp-duration"><Clock size={17}/> Duration: <b>1h 30m</b></div><h4><Users size={20}/>Booking Details</h4><div className="sp-form-grid"><div><span className="sp-field-label">Number of Attendees <em>*</em></span><div className="sp-field">30</div></div><div><span className="sp-field-label">Purpose of Booking <em>*</em></span><div className="sp-field"><span className="sp-purpose">Group project discussion</span></div></div></div><div className="sp-form-actions"><span>Cancel</span><b>Submit Reservation <ArrowRight size={16}/></b></div></div><div className="sp-book-summary"><h4>Booking Summary</h4><ResourceThumbnail type="classroom" name="Lecture Hall A" size="md" showBadge={false}/><h4>Lecture Hall A</h4>{[['Type','Classroom'],['Location','Faculty Building'],['Capacity','120 people'],['Date','21 October 2026'],['Time','10:00 AM – 11:30 AM'],['Duration','1h 30m']].map(([label,value])=><div key={label}><span>{label}</span><b>{value}</b></div>)}<p><Bell size={17}/>Your reservation will be reviewed by an administrator.</p></div></div></>;
}

function Ledger({ admin }) {
  return <><div className="sp-page-hero"><div className="br-hero__icon"><CalendarDays size={30}/></div><div><h3>{admin?'Booking History':'My Reservations'}</h3><p>{admin?'Review, verify, and decide upon institutional resource bookings in real time.':'Track, monitor, and manage your institutional resource bookings in real time.'}</p></div>{!admin&&<span className="sp-outline-action"><Plus size={17}/>New Reservation</span>}</div><Stats/>
    <div className="bh-card"><div className="bh-card__header"><div className="bh-header-main"><div className="bh-card__header-icon"><CalendarDays size={22}/></div><div><h4 className="bh-card__title">{admin?'Reservation Ledger':'My Reservation Ledger'}</h4><p className="bh-card__sub">3 bookings listed</p></div></div></div><div className="sp-ledger-controls"><div>{(admin?['All Bookings','Pending Queue']:['All Requests','Pending','Approved','Completed']).map((t,i)=><span className={i===0?'sp-selected':''} key={t}>{t}{i===0&&<b>8</b>}</span>)}</div><span><Search size={16}/>{admin?'Search by user, resource, ID…':'Search by resource, location, ID…'}</span><span>All Statuses<ChevronDown size={14}/></span></div>
    <table className="sp-ledger"><thead><tr>{['BOOKING ID',...(admin?['USER']:[]),'RESOURCE','SCHEDULE','STATUS','ACTIONS'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{samples.map((r,i)=><tr className="sp-ledger-row" style={{'--order':i}} key={r.name}><td><b>#RSV-00{i+1}</b><small>21 Oct 2026</small></td>{admin&&<td><strong>Demo Student</strong><small>Student</small></td>}<td><div className="sp-table-resource"><ResourceThumbnail type={r.type} name={r.name} size="sm" showBadge={false}/><div><strong>{r.name}</strong><small>{r.location}</small></div></div></td><td><strong>{['21 Oct 2026','22 Oct 2026','23 Oct 2026'][i]}</strong><small>{['10:00 AM – 11:30 AM','09:00 AM – 11:00 AM','01:00 PM – 02:00 PM'][i]}</small></td><td><span className={`sp-badge ${i===1?'sp-badge-pending':''} ${admin&&i===1?'sp-status-before':''}`}>{i===1?'Pending':'Approved'}</span>{admin&&i===1&&<span className="sp-badge sp-status-after">Approved</span>}</td><td>{admin&&i===1?<div className="sp-decision"><b><Check size={15}/>Approve</b><span><X size={15}/>Reject</span></div>:<span className="sp-row-action">{admin?'View Details':'View Booking'}</span>}</td></tr>)}</tbody></table><div className="sp-table-footer">Showing 1–3 of 8 reservations <span>‹ &nbsp; 1 &nbsp; 2 &nbsp; 3 &nbsp; ›</span></div></div>
    <div className="sp-info-banner"><Bell size={18}/>{admin?'A clear view of every request, from submission to approval.':'Keep track of your upcoming bookings and reservation status in one place.'}</div></>;
}

export default function SiteSectionPreview({ chapter }) {
  const viewport = useRef(null);
  const [scale, setScale] = useState(.5);
  useEffect(()=>{
    const observer = new ResizeObserver(([entry])=>setScale(entry.contentRect.width/1100));
    observer.observe(viewport.current);
    return ()=>observer.disconnect();
  },[]);
  return <div className={`sp-preview sp-chapter-${chapter}`} ref={viewport} aria-label={`Animated preview of ${['Browse Resources','Book a Resource','My Reservations','Booking History'][chapter]}`}>
    <div className="sp-canvas" style={{transform:`scale(${scale})`}}>
      <div className="sp-site-nav"><div><img src={uniLogo} alt=""/><span><strong>Faculty Resources Reservation System</strong><small>University of Sri Jayewardenepura</small></span></div><div className="sp-nav-pills">{(chapter===3?['Dashboard','Users','Resources','Bookings']:['Dashboard','Browse Resources','My Reservations']).map((n,i)=><span className={(chapter===0&&i===1)||(chapter===2&&i===2)||(chapter===3&&i===3)?'sp-nav-active':''} key={n}>{n}</span>)}</div><Bell size={19}/><span className="sp-nav-user">{chapter===3?'Admin':'Student'}</span></div>
      <div className="sp-page">{chapter===0?<Directory/>:chapter===1?<Booking/>:<Ledger admin={chapter===3}/>}</div>
    </div>
    <div className="sp-action-toast"><CheckCircle2 size={19}/><span>{['Find the resource that fits','Reservation submitted','Your booking is approved','Reservation approved'][chapter]}<small>{['Search your faculty’s resource directory','Pending administrator review','Status updated in My Reservations','Updated in the Reservation Ledger'][chapter]}</small></span></div>
    <MousePointer2 className="sp-demo-pointer" size={24} fill="#0a1429" aria-hidden="true"/>
  </div>;
}

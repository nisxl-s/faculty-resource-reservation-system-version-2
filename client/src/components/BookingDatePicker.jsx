import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { campusToday } from '../config/resourceDetails';
export default function BookingDatePicker({ id, name, label, value, min = campusToday(), onChange, invalid }) {
 const [open,setOpen]=useState(false);
 const [month,setMonth]=useState((value || min).slice(0,7));
 const root=useRef(null), trigger=useRef(null);
 useEffect(()=>{const close=event=>{if(!root.current?.contains(event.target))setOpen(false);};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[]);
 const [year,mo]=month.split('-').map(Number);
 const days=new Date(year,mo,0).getDate(), offset=(new Date(year,mo-1,1).getDay()+6)%7;
 const changeMonth=delta=>{const date=new Date(year,mo-1+delta,1);setMonth(date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0'));};
 const choose=date=>{onChange({target:{name,value:date}});setOpen(false);trigger.current?.focus();};
 return <div ref={root} className="booking-date-picker" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
  <button ref={trigger} id={id} type="button" aria-label={label} aria-invalid={invalid || undefined} aria-haspopup="dialog" aria-expanded={open} className="booking-date-trigger" onClick={()=>{setMonth((value || min).slice(0,7));setOpen(!open);}}><Calendar size={17}/><span>{value ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00')) : 'Choose a date'}</span></button>
  {open && <div className="booking-calendar" role="dialog" aria-label={label + ' calendar'}>
   <div className="booking-calendar-heading"><button type="button" aria-label="Previous month" onClick={()=>changeMonth(-1)} disabled={month <= min.slice(0,7)}><ChevronLeft size={16}/></button><strong>{new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(new Date(year,mo-1,1))}</strong><button type="button" aria-label="Next month" onClick={()=>changeMonth(1)}><ChevronRight size={16}/></button></div>
   <div className="booking-calendar-grid">{['Mo','Tu','We','Th','Fr','Sa','Su'].map(day=><span key={day} className="booking-calendar-weekday">{day}</span>)}{Array.from({length:offset},(_,i)=><span key={'empty'+i}/>)}{Array.from({length:days},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0');return <button type="button" key={date} disabled={date<min} aria-label={date} aria-pressed={date===value} className={date===campusToday()?'is-today':''} onClick={()=>choose(date)}>{i+1}</button>;})}</div>
   <button type="button" className="booking-calendar-today" disabled={campusToday()<min} onClick={()=>choose(campusToday())}>Today</button>
  </div>}
 </div>;
}

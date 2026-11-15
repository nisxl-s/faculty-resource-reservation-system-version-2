import React, { useEffect, useRef } from 'react';
import { X, ArrowUpRight, MapPin, Cpu, Building2 } from 'lucide-react';
import ResourceSpecs from './ResourceSpecs';
import ResourceThumbnail from './ResourceThumbnail';
export default function ResourceDetailsModal({ resource, onClose, onBook }) {
 const root=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement, overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const siblings=[...root.current.parentElement.children].filter(el=>el!==root.current && !el.classList.contains('resource-detail-overlay'));
  const before=siblings.map(el=>el.inert); siblings.forEach(el=>{el.inert=true;});
  root.current.querySelector('button')?.focus();
  const keys=event=>{
   if(event.key==='Escape')onClose();
   if(event.key==='Tab') { const buttons=[...root.current.querySelectorAll('button:not(:disabled),a[href]')]; const first=buttons[0],last=buttons[buttons.length-1]; if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();} }
  };
  document.addEventListener('keydown',keys);
  return ()=>{document.body.style.overflow=overflow;siblings.forEach((el,i)=>{el.inert=before[i];});document.removeEventListener('keydown',keys);previous?.focus();};
 },[onClose]);
 const equipment=resource.type==='equipment';
 return <><div className="resource-detail-overlay" onClick={onClose}/><section className="resource-detail-dialog" ref={root} role="dialog" aria-modal="true" aria-labelledby="resource-detail-title">
  <header className="resource-detail-header"><span className="resource-detail-symbol">{equipment?<Cpu size={24}/>:<Building2 size={24}/>}</span><div><span className="resource-detail-eyebrow">{equipment?'EQUIPMENT':'CAMPUS SPACE'}</span><h2 id="resource-detail-title">{resource.name}</h2></div><button type="button" className="resource-icon-button" onClick={onClose} aria-label="Close resource details"><X size={20}/></button></header>
  <div className="resource-detail-body"><ResourceThumbnail images={resource.images} type={resource.type} name={resource.name} size="md"/>
   <p className="resource-detail-location"><MapPin size={16}/>{[resource.building,resource.location].filter(Boolean).join(' · ') || 'Location not specified'}</p>
   <p>{resource.description || (equipment?'Review the item specifications and collection instructions before reserving.':'Review seating capacity, facilities and access information before reserving.')}</p>
   <ResourceSpecs resource={resource}/>
  </div>
  <footer className="resource-detail-actions"><span>{resource.status==='available'?'Available to request':'Currently '+resource.status}</span><button type="button" onClick={()=>onBook(resource.id || resource.resource_id)} disabled={resource.status!=='available'}>{equipment?'Reserve equipment':'Reserve space'}<ArrowUpRight size={16}/></button></footer>
 </section></>;
}

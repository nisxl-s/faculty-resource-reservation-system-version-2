import faculties from '../config/faculties.json';
import React from 'react';
import { detailFields, detailLabel, resourceDetails } from '../config/resourceDetails';
import '../assets/css/resource_details.css';
export default function ResourceSpecs({ resource, compact = false }) {
 const details=resourceDetails(resource);
 const fields=detailFields(resource.type,details);
 return <section className="resource-specs" aria-label={resource.type === 'equipment' ? 'Equipment details' : 'Space details'}>
  <h3>{resource.type === 'equipment' ? 'Equipment & access' : 'Space & facilities'}</h3>
  <dl className="resource-specs-grid">
   <div><dt>Owning faculty</dt><dd>{faculties.find(f=>f.code===resource.faculty_code)?.name || 'Legacy resource'}</dd></div>
   <div><dt>Asset code</dt><dd>{resource.asset_code || 'Not assigned'}</dd></div>
   <div><dt>Floor</dt><dd>{resource.floor || 'Not specified'}</dd></div>
   <div><dt>Catalogue scope</dt><dd>{resource.sharing_scope==='campus'?'Shared across all faculties':'Faculty inventory'}</dd></div>
   {Boolean(resource.is_sample)&&<div><dt>Data status</dt><dd>Sample - confirm details with faculty</dd></div>}
   {Boolean(resource.computer_count)&&<div><dt>Computers</dt><dd>{resource.computer_count}</dd></div>}
   {Boolean(resource.parent_resource_id)&&<div><dt>Assigned venue</dt><dd>{resource.location} - reserve this equipment separately from its venue.</dd></div>}
   {resource.type !== 'equipment' && <div><dt>Seating capacity</dt><dd>{resource.capacity ? resource.capacity + ' people' : 'Not specified'}</dd></div>}
   {resource.type === 'equipment' && <div><dt>Reservation</dt><dd>One listed asset / kit per booking</dd></div>}
   {fields.filter(field=>!compact || details[field.key]).map(field=><div key={field.key} className={field.multiline?'resource-spec-wide':''}><dt>{field.label}</dt><dd>{detailLabel(field,details[field.key]) || 'Not specified'}</dd></div>)}
  </dl>
 </section>;
}

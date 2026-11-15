export const LAYOUTS = [{value:'theatre',label:'Theatre seating'},{value:'classroom',label:'Classroom seating'},{value:'boardroom',label:'Boardroom'},{value:'u_shape',label:'U-shaped'},{value:'flexible',label:'Flexible layout'},{value:'fixed_workstations',label:'Fixed workstations'},{value:'other',label:'Other'}];
export const CONDITIONS = [{value:'new',label:'New'},{value:'good',label:'Good'},{value:'fair',label:'Fair'},{value:'needs_inspection',label:'Needs inspection'}];
export const venueFields = [
 {key:'layout',label:'Seating / room layout',options:LAYOUTS},
 {key:'floor_area',label:'Floor area',placeholder:'e.g. 120 m²',max:100},
 {key:'facilities',label:'Facilities and installed equipment',placeholder:'e.g. Projector, sound system, whiteboards, air conditioning',max:1500,multiline:true},
 {key:'accessibility',label:'Accessibility',placeholder:'e.g. Step-free entrance, lift access, accessible seating',max:1000,multiline:true},
 {key:'usage_notes',label:'Access and usage instructions',placeholder:'e.g. Key collection, setup or room rules',max:2000,multiline:true}
];
export const equipmentFields = [
 {key:'booking_mode',label:'Usage arrangement',options:[{value:'on_site',label:'Use at its location'},{value:'collection',label:'Collect and return'}]},
 {key:'brand_model',label:'Brand and model',placeholder:'e.g. Epson EB-X49',max:200},
 {key:'asset_tag',label:'Asset reference',placeholder:'e.g. AV-PROJ-012',max:100},
 {key:'condition',label:'Condition',options:CONDITIONS},
 {key:'specifications',label:'Technical specifications',placeholder:'e.g. Connections, power requirements, dimensions',max:2000,multiline:true},
 {key:'accessories',label:'Included accessories',placeholder:'e.g. Carry case, remote, HDMI cable',max:1500,multiline:true},
 {key:'collection_point',label:'Collection point',placeholder:'e.g. Faculty resource desk',max:300},
 {key:'return_instructions',label:'Return instructions',placeholder:'Where and how to return the item',max:2000,multiline:true},
 {key:'usage_notes',label:'Handling and usage instructions',placeholder:'Safety, training or handling requirements',max:2000,multiline:true}
];
export const detailFields = (type,details = {}) => type === 'equipment' ? equipmentFields.filter(field => details.booking_mode !== 'on_site' || !['collection_point','return_instructions'].includes(field.key)) : venueFields;
export function resourceDetails(resource) {
 try { const value = typeof resource.details === 'string' ? JSON.parse(resource.details) : resource.details; return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
export function detailLabel(field,value) { return field.options?.find(option=>option.value===value)?.label || value; }
export const campusToday = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

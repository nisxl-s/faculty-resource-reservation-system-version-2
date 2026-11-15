import React, {useRef,useState} from 'react';
import {ArrowRight,ChevronDown,Clock3,History,MessageSquare,RefreshCw,UserRound} from 'lucide-react';
import {API_ENDPOINTS,apiFetch,apiResponseError,getAuthHeaders} from '../config/api';
import './ReservationHistory.css';

const statuses={pending:'Pending',approved:'Approved',rejected:'Rejected',cancelled:'Cancelled'};
const title=row=>row.action==='created'?'Request submitted':row.action==='edited'?'Reservation updated':({approved:'Reservation approved',rejected:'Reservation rejected',cancelled:'Reservation cancelled',pending:'Returned for review'}[row.status]||'Reservation updated');
const dateLabel=value=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));

export default function ReservationHistory({reservationId}) {
  const [rows,setRows]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const pending=useRef(false);
  async function load(){
    if(pending.current)return;
    pending.current=true;setLoading(true);setError('');
    try{const response=await apiFetch(API_ENDPOINTS.RESERVATIONS+'/'+reservationId,{headers:getAuthHeaders()});if(!response.ok)throw await apiResponseError(response,'Unable to load decision history.');const data=await response.json();setRows(Array.isArray(data.data?.history)?data.data.history:[]);}
    catch(e){setError(e.message);}finally{pending.current=false;setLoading(false);}
  }
  return <details className="decision-history" onToggle={event=>{if(event.currentTarget.open&&rows===null)void load();}}>
    <summary className="decision-history__trigger"><History size={15} aria-hidden="true"/><span>Decision history</span>{rows?.length>0&&<b>{rows.length}</b>}<ChevronDown size={14} className="decision-history__chevron" aria-hidden="true"/></summary>
    <div className="decision-history__panel">
      <div className="decision-history__heading"><span>RESERVATION TIMELINE</span><span>#{reservationId}</span></div>
      {loading?<p className="decision-history__loading" role="status">Fetching history…</p>:error?<div className="decision-history__empty"><p role="alert">{error}</p><button type="button" onClick={load}><RefreshCw size={13} aria-hidden="true"/>Try again</button></div>:rows?.length?<ol className="decision-history__timeline">{rows.map(row=><li key={row.id} className="decision-history__event" data-state={Object.hasOwn(statuses,row.status)?row.status:'pending'}>
        <span className="decision-history__dot" aria-hidden="true"/><h4>{title(row)}</h4>
        <div className="decision-history__transition">{row.previous_status&&<><span>{statuses[row.previous_status]||row.previous_status}</span><ArrowRight size={11} aria-hidden="true"/></>}<span className="decision-history__status">{statuses[row.status]||row.status}</span></div>
        <div className="decision-history__meta"><UserRound size={11} aria-hidden="true"/><span>{row.actor_name||'Former user'}</span></div>
        <div className="decision-history__meta"><Clock3 size={11} aria-hidden="true"/><time dateTime={row.created_at}>{dateLabel(row.created_at)}</time></div>
        {row.reason&&<div className="decision-history__note"><span><MessageSquare size={11} aria-hidden="true"/>Decision note</span><p>{row.reason}</p></div>}
      </li>)}</ol>:<div className="decision-history__empty"><span className="decision-history__empty-icon"><Clock3 size={22} aria-hidden="true"/></span><h4>No history available</h4><p>New decisions and reservation changes will appear here.</p></div>}
    </div>
  </details>;
}

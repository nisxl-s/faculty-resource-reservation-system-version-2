import React, {useEffect,useRef,useState} from 'react';
export default function RejectReservationDialog({reservationId,onClose,onSubmit,busy}) {
  const dialog=useRef(null); const [reason,setReason]=useState('');
  useEffect(()=>{const el=dialog.current;const previous=document.activeElement;el.showModal();return ()=>{el.close();previous?.focus();};},[]);
  return <dialog ref={dialog} onCancel={event=>{event.preventDefault();if(!busy)onClose();}} aria-labelledby="reject-title" style={{maxWidth:520,width:'90%',background:'#111827',color:'#e2e8f0',border:'1px solid #475569',borderRadius:16,padding:28}}>
    <form onSubmit={event=>{event.preventDefault();onSubmit(reason.trim());}}><h2 id="reject-title">Reject reservation #{reservationId}</h2><p>The requester will see this explanation.</p><label htmlFor="rejection-reason">Reason for rejection</label><textarea id="rejection-reason" autoFocus required maxLength={5000} value={reason} onChange={event=>setReason(event.target.value)} rows={5} style={{width:'100%'}}/><div><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" disabled={busy||!reason.trim()}>{busy?'Saving…':'Reject reservation'}</button></div></form>
  </dialog>;
}

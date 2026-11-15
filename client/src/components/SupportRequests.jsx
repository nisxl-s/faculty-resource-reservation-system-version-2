import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import '../assets/css/review.css';
import SupportSelect from './SupportSelect';

export default function SupportRequests({ review = false }) {
  const user = getCurrentUser();
  const allowed = !!user && (!review || ['admin','faculty'].includes(user.role));
  const [statuses, setStatuses] = useState({});
  const [kind, setKind] = useState('help');
  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState({});
  const [busy, setBusy] = useState(null);
  const effectiveKind = review && user?.role === 'faculty' ? 'help' : kind;
  async function load(signal) {
    setError(''); setLoading(true);
    const base = effectiveKind === 'help' ? API_ENDPOINTS.HELP : API_ENDPOINTS.FEEDBACK;
    const suffix = review ? '/admin/all' : effectiveKind === 'help' ? '/my-requests' : '/my-feedback';
    try {
      const response = await fetch(`${base}${suffix}?limit=20&offset=${offset}`, { headers: getAuthHeaders(), signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load support items');
      setRows(data.data.requests || data.data.feedback || []);
    } catch (e) { if (e.name !== 'AbortError') setError(e.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController(); load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, effectiveKind, offset, review]);
  async function respond(event, row) {
    event.preventDefault(); setBusy(row.id); setError('');
    const form = new FormData(event.currentTarget);
    const base = effectiveKind === 'help' ? API_ENDPOINTS.HELP : API_ENDPOINTS.FEEDBACK;
    try {
      const response = await fetch(`${base}/admin/${row.id}/respond`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ admin_response: form.get('response'), status: form.get('status') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save response');
      setResponses(prev => ({...prev,[row.id]:''})); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }
  if (!allowed) return <p>Sign in to view your requests and replies.</p>;
  return <>
    <section className="review-page support-inbox">
      <h3>{review ? 'Support review' : 'My support requests'}</h3>
      <p>{review ? 'Review help requests and respond to users.' : 'Track your help requests, feedback and staff responses.'}</p>
      {(!review || user.role === 'admin') && <div><label htmlFor="support-kind">Type</label><SupportSelect id="support-kind" label="Support type" value={kind} onChange={value => { setKind(value); setOffset(0); setRows([]); }} options={[{value:'help',label:'Help requests'},{value:'feedback',label:'Feedback'}]} /></div>}
      {error && <p className="review-error" role="alert">{error}</p>}
      <div aria-live="polite" aria-busy={loading}>
        {loading ? <p>Loading support items…</p> : rows.length === 0 ? <p>No items on this page.</p> : rows.map(row => <article className="review-card" key={`${effectiveKind}-${row.id}`}>
          <h2>{row.topic || row.subject}</h2>
          {review && <p>{row.user_name || 'Guest'}{row.user_email ? ` · ${row.user_email}` : ''}</p>}
          <p>{row.question || row.message}</p>
          <p>Status: {row.status}{row.priority ? ` · Priority: ${row.priority}` : ''}</p>
          {row.admin_response && <p><strong>Response:</strong> {row.admin_response}</p>}
          {review && <form onSubmit={e => respond(e,row)}>
            <label htmlFor={`response-${row.id}`}>Response</label>
            <textarea id={`response-${row.id}`} name="response" required maxLength={5000} value={responses[row.id] || ''} onChange={e => setResponses(prev => ({...prev,[row.id]:e.target.value}))} />
            <label htmlFor={`status-${row.id}`}>Set status</label>
            <SupportSelect id={`status-${row.id}`} name="status" label="Set status" value={statuses[`${effectiveKind}-${row.id}`] || 'in_progress'} onChange={value => setStatuses(previous => ({...previous,[`${effectiveKind}-${row.id}`]:value}))} options={(effectiveKind === 'help' ? ['open','in_progress','resolved','closed'] : ['new','in_progress','resolved','closed']).map(value => ({value,label:value.replaceAll('_',' ')}))} />
            <button disabled={busy !== null} type="submit">{busy === row.id ? 'Saving…' : 'Send response'}</button>
          </form>}
        </article>)}
      </div>
      <nav aria-label="Support pages" className="review-actions">
        <button disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0,offset-20))}>Previous</button><span>Page {offset/20+1}</span><button disabled={rows.length < 20 || loading} onClick={() => setOffset(offset+20)}>Next</button>
      </nav>
    </section>
  </>;
}

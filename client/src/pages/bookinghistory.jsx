import ReservationHistory from '../components/ReservationHistory';
import { useEventCallback } from '../hooks/useEventCallback';
import { fetchList } from '../config/api';
import RejectReservationDialog from '../components/RejectReservationDialog';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import StudentHeader from '../components/StudentHeader';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { useSectionEnter } from '../hooks/effects';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/bookinghistory.css';

// ── Status Filter Options for CustomSelect ──────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'approved',  label: 'Approved' },
  { value: 'active',    label: 'Active (Ongoing)' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected',  label: 'Rejected' },
];

// ── Custom Select (Matching other sections) ──────────────────────────────────
function CustomSelect({ value, onChange, placeholder = 'Filter by status…', options = [], icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  function pick(opt) {
    onChange(opt.value);
    setOpen(false);
  }

  return (
    <div className={`rg-select${open ? ' rg-select--open' : ''}`} ref={ref}>
      <button
        type="button"
        className={`rg-select__trigger${!selected ? ' rg-select__trigger--placeholder' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ padding: '8px 14px 8px 38px' }}
      >
        <span className="rg-field-icon" style={{ left: '12px' }}>{icon}</span>
        <span className="rg-select__label">{selected ? selected.label : placeholder}</span>
        <span className={`rg-select__chevron${open ? ' rg-select__chevron--up' : ''}`} style={{ right: '10px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <ul className="rg-select__menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`rg-select__option${opt.value === value ? ' rg-select__option--active' : ''}`}
              onClick={() => pick(opt)}
            >
              <span className="rg-select__option-dot" />
              {opt.label}
              {opt.value === value && (
                <span className="rg-select__check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function ReservationStatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',   cls: 'bh-badge bh-badge--pending' },
    approved:  { label: 'Approved',  cls: 'bh-badge bh-badge--approved' },
    active:    { label: 'Active',    cls: 'bh-badge bh-badge--active' },
    completed: { label: 'Completed', cls: 'bh-badge bh-badge--completed' },
    rejected:  { label: 'Rejected',  cls: 'bh-badge bh-badge--rejected' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bh-badge' };
  return <span className={cls}>{label}</span>;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  HeaderCalendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
};

export default function BookingHistory() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Fetch reservations, users, and resources
  const fetchData = useEventCallback(async () => {
    try {
      setLoading(true);
      
      const user = getCurrentUser();
      if (!user || !['admin','faculty'].includes(user.role)) {
        navigate('/login');
        return;
      }

      // Fetch users
      const usersRes = user.role === 'admin' ? await fetchList(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      }) : null;
      const usersData = usersRes ? await usersRes.json() : {};
      
      let usersList = [];
      if (usersData.data && usersData.data.users && Array.isArray(usersData.data.users)) {
        usersList = usersData.data.users;
      } else if (usersData.data && Array.isArray(usersData.data)) {
        usersList = usersData.data;
      } else if (Array.isArray(usersData)) {
        usersList = usersData;
      }
      setUsers(usersList);

      // Fetch reservations
      const bookingsRes = await fetchList(API_ENDPOINTS.RESERVATIONS, {
        headers: getAuthHeaders(),
      });
      const bookingsData = await bookingsRes.json();
      
      let reservationsList = [];
      if (bookingsData.data && bookingsData.data.reservations && Array.isArray(bookingsData.data.reservations)) {
        reservationsList = bookingsData.data.reservations;
      } else if (bookingsData.data && Array.isArray(bookingsData.data)) {
        reservationsList = bookingsData.data;
      } else if (Array.isArray(bookingsData)) {
        reservationsList = bookingsData;
      }
      setReservations(reservationsList);

      // Fetch resources
      const resourcesRes = await fetchList(API_ENDPOINTS.RESOURCES, {
        headers: getAuthHeaders(),
      });
      const resourcesData = await resourcesRes.json();
      
      let resourcesList = [];
      if (resourcesData.data && resourcesData.data.resources && Array.isArray(resourcesData.data.resources)) {
        resourcesList = resourcesData.data.resources;
      } else if (resourcesData.data && Array.isArray(resourcesData.data)) {
        resourcesList = resourcesData.data;
      } else if (Array.isArray(resourcesData)) {
        resourcesList = resourcesData;
      }
      setResources(resourcesList);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reservation data:', err);
      setUsers([]);
      setReservations([]);
      setResources([]);
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle approve
  const handleApprove = async (reservationId) => {
    try {
      setProcessingId(reservationId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_ENDPOINTS.RESERVATIONS}/${reservationId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'approved' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to approve reservation');
      }

      setSuccess('Reservation approved successfully!');
      setTimeout(() => setSuccess(null), 3500);
      await fetchData();
    } catch (err) {
      console.error('Error approving reservation:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3500);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const [rejectId,setRejectId] = useState(null);
  const handleReject = async (reservationId, reason) => {
    try {
      setProcessingId(reservationId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_ENDPOINTS.RESERVATIONS}/${reservationId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'rejected', reason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reject reservation');
      }

      setRejectId(null);
      setSuccess('Reservation rejected.');
      setTimeout(() => setSuccess(null), 3500);
      await fetchData();
    } catch (err) {
      console.error('Error rejecting reservation:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3500);
    } finally {
      setProcessingId(null);
    }
  };

  // Calculate dynamic statuses & metrics
  const parsedReservations = reservations.map((r) => {
    const startDate = r.start_time ? new Date(r.start_time) : null;
    const endDate = r.end_time ? new Date(r.end_time) : null;
    const now = new Date();
    let currentStatus = (r.status || 'pending').toLowerCase();
    
    if (startDate && endDate) {
      if (currentStatus === 'approved') {
        if (now > endDate) {
          currentStatus = 'completed';
        } else if (now >= startDate && now <= endDate) {
          currentStatus = 'active';
        }
      }
    }
    return {
      ...r,
      computedStatus: currentStatus,
      startDate,
      endDate,
    };
  });

  const pendingCount = parsedReservations.filter((r) => r.computedStatus === 'pending').length;
  const approvedCount = parsedReservations.filter((r) => r.computedStatus === 'approved').length;
  const activeCount = parsedReservations.filter((r) => r.computedStatus === 'active').length;
  const completedCount = parsedReservations.filter((r) => r.computedStatus === 'completed').length;

  // Filter reservations based on activeTab, statusFilter, and searchQuery
  const filteredReservations = parsedReservations.filter((r) => {
    // Tab constraint
    if (activeTab === 'pending' && r.computedStatus !== 'pending') return false;

    // Status dropdown constraint
    if (statusFilter !== 'all' && r.computedStatus !== statusFilter) return false;

    // Search query constraint
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const user = Array.isArray(users) ? users.find((u) => u.id === r.user_id || u.user_id === r.user_id) : null;
      const resource = Array.isArray(resources) ? resources.find((res) => res.id === r.resource_id || res.resource_id === r.resource_id) : null;
      
      const userName = (user?.full_name || r.user_name || '').toLowerCase();
      const resourceName = (resource?.name || r.resource_name || '').toLowerCase();
      const resourceType = (resource?.type || r.resource_type || '').toLowerCase();
      const idStr = String(r.id || r.reservation_id || '');

      return userName.includes(q) || resourceName.includes(q) || resourceType.includes(q) || idStr.includes(q);
    }

    return true;
  });

  useSectionEnter();

  return (
    <>
      {getCurrentUser()?.role === 'admin' ? <AdminHeader /> : <StudentHeader />}
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="bh-page" data-section-content>

          {/* ── Page Hero ── */}
          <div className="bh-hero">
            <div className="bh-hero__icon">
              <Icons.Calendar />
            </div>
            <div>
              <h1 className="bh-hero__title">Reservation Management</h1>
              <p className="bh-hero__sub">Review, verify, and decide upon institutional resource bookings in real time.</p>
            </div>
          </div>

          {/* ── Feedback Banners ── */}
          {error && (
            <div className="bh-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="bh-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {/* ── Quick Stats Grid ── */}
          <div className="bh-stats-grid">
            <div className="bh-stat-card bh-stat-card--total">
              <div className="bh-stat-icon">
                <Icons.HeaderCalendar />
              </div>
              <div>
                <div className="bh-stat-value">{reservations.length}</div>
                <div className="bh-stat-label">Total Requests</div>
              </div>
            </div>

            <div className="bh-stat-card bh-stat-card--pending">
              <div className="bh-stat-icon">
                <Icons.Clock />
              </div>
              <div>
                <div className="bh-stat-value">{pendingCount}</div>
                <div className="bh-stat-label">Pending Approval</div>
              </div>
            </div>

            <div className="bh-stat-card bh-stat-card--approved">
              <div className="bh-stat-icon" style={{ color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
                <Icons.Check />
              </div>
              <div>
                <div className="bh-stat-value">{approvedCount + activeCount}</div>
                <div className="bh-stat-label">Approved & Active</div>
              </div>
            </div>

            <div className="bh-stat-card bh-stat-card--completed">
              <div className="bh-stat-icon" style={{ color: '#94a3b8' }}>
                <Icons.Clock />
              </div>
              <div>
                <div className="bh-stat-value">{completedCount}</div>
                <div className="bh-stat-label">Completed</div>
              </div>
            </div>
          </div>

          {/* ── Main Reservations Table Card ── */}
          <div className="bh-card">
            <div className="bh-card__header">
              <div className="bh-header-main">
                <div className="bh-card__header-icon">
                  <Icons.HeaderCalendar />
                </div>
                <div>
                  <h2 className="bh-card__title">
                    {activeTab === 'pending' ? 'Pending Approval Queue' : 'Reservation Ledger'}
                  </h2>
                  <p className="bh-card__sub">
                    {filteredReservations.length} booking{filteredReservations.length !== 1 ? 's' : ''} listed
                  </p>
                </div>
              </div>

              {/* Controls: Tabs, Search & Filter */}
              <div className="bh-controls-row">
                <div className="bh-tabs">
                  <button
                    type="button"
                    className={`bh-tab-btn${activeTab === 'all' ? ' bh-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Bookings
                    <span className="bh-tab-badge">{reservations.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`bh-tab-btn${activeTab === 'pending' ? ' bh-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending Queue
                    {pendingCount > 0 && <span className="bh-tab-badge">{pendingCount}</span>}
                  </button>
                </div>

                <div className="bh-search-wrap">
                  <span className="bh-search-icon">
                    <Icons.Search />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by user, resource, ID…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bh-search-input"
                  />
                </div>

                <div className="bh-filter-select-wrap">
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={STATUS_OPTIONS}
                    icon={<Icons.Filter />}
                  />
                </div>
              </div>
            </div>

            {filteredReservations.length === 0 && !loading ? (
              <div className="bh-empty">
                <Icons.Calendar />
                <p>
                  {activeTab === 'pending'
                    ? 'No reservations currently waiting for approval.'
                    : 'No reservations match your filters.'}
                </p>
              </div>
            ) : (
              <div className="bh-table-wrap">
                <table className="bh-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Requester</th>
                      <th>Resource Details</th>
                      <th>Date & Slot</th>
                      <th>Status</th>
                      <th>Decisions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r) => {
                      const resId = r.id || r.reservation_id;
                      const user = Array.isArray(users)
                        ? users.find((u) => u.id === r.user_id || u.user_id === r.user_id)
                        : null;
                      const resource = Array.isArray(resources)
                        ? resources.find((res) => res.id === r.resource_id || res.resource_id === r.resource_id)
                        : null;

                      const userName = user?.full_name || r.user_name || 'Faculty Member';
                      const initial = userName.charAt(0).toUpperCase();
                      const resourceName = resource?.name || r.resource_name || 'Unassigned Room';
                      const resourceType = resource?.type || r.resource_type || 'Room';

                      const dateString = r.startDate ? r.startDate.toLocaleDateString(undefined, {
                        timeZone: 'Asia/Colombo',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Flexible Date';

                      const timeString = r.startDate && r.endDate ? `${r.startDate.toLocaleTimeString([], { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit' })} – ${r.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Standard Hours';

                      const isPending = r.computedStatus === 'pending';
                      const isProcessing = processingId === resId;

                      return (
                        <tr key={resId}>
                          <td className="bh-td-id">#{resId}</td>
                          <td>
                            <div className="bh-user-cell">
                              <div className="bh-avatar">{initial}</div>
                              <span className="bh-user-name">{userName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="bh-resource-cell">
                              <span className="bh-resource-name">{resourceName}</span>
                              <span className="bh-type-tag">{resourceType}</span>
                            </div>
                          </td>
                          <td>
                            <div className="bh-time-cell">
                              <span className="bh-date">{dateString}</span>
                              <span className="bh-time-range">
                                <Icons.Clock /> {timeString}
                              </span>
                            </div>
                          </td>
                          <td>
                            <ReservationStatusBadge status={r.computedStatus} />
                            <ReservationHistory reservationId={resId} />
                            {r.rejection_reason && <p><strong>Reason:</strong> {r.rejection_reason}</p>}
                            {r.reviewed_at && <small>Reviewed {new Date(r.reviewed_at).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})}</small>}
                          </td>
                          <td>
                            {isPending ? (
                              <div className="bh-actions">
                                <button
                                  type="button"
                                  className="bh-btn-approve"
                                  onClick={() => handleApprove(resId)}
                                  disabled={isProcessing || r.user_id === getCurrentUser()?.id}
                                  title={r.user_id === getCurrentUser()?.id ? "You cannot approve your own reservation" : "Approve booking"}
                                >
                                  <Icons.Check />
                                  {isProcessing ? 'Processing…' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  className="bh-btn-reject"
                                  onClick={() => setRejectId(resId)}
                                  disabled={isProcessing}
                                  title="Reject booking"
                                >
                                  <Icons.X />
                                  {isProcessing ? 'Processing…' : 'Reject'}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'rgba(148, 163, 184, 0.5)' }}>
                                Finalized
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </section>
      </main>
      {rejectId !== null && <RejectReservationDialog reservationId={rejectId} onClose={()=>setRejectId(null)} onSubmit={reason=>handleReject(rejectId,reason)} busy={processingId===rejectId} />}
      
    </>
  );
}

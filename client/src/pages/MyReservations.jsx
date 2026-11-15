import ReservationHistory from '../components/ReservationHistory';
import { fetchList } from '../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';

import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, Search, Filter, Plus, ChevronDown, ChevronUp, Check, Circle } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import { sectionCache } from '../utils/sectionCache';
import { useSectionEnter } from '../hooks/effects';
import { useConfirm } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
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
  { value: 'cancelled', label: 'Cancelled' },
];

// ── Custom Select (Matching Admin Sections) ─────────────────────────────────
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
          <ChevronDown size={14} />
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
                  <Check size={14} />
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
function ReservationStatusBadge({ status, isActiveNow }) {
  const map = {
    pending:   { label: 'Pending',   cls: 'bh-badge bh-badge--pending' },
    approved:  { label: 'Approved',  cls: 'bh-badge bh-badge--approved' },
    active:    { label: 'Active',    cls: 'bh-badge bh-badge--active' },
    completed: { label: 'Completed', cls: 'bh-badge bh-badge--completed' },
    rejected:  { label: 'Rejected',  cls: 'bh-badge bh-badge--rejected' },
    cancelled: { label: 'Cancelled', cls: 'bh-badge bh-badge--cancelled' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bh-badge' };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span className={cls}>{label}</span>
      {isActiveNow && (
        <span className="bh-active-pill" title="Ongoing session right now">
          <Circle size={8} fill="currentColor" aria-hidden="true"/> Live
        </span>
      )}
    </div>
  );
}

const MyReservations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState(sectionCache.reservations || []);
  const [loading, setLoading] = useState(!sectionCache.reservations);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved', 'completed'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useSectionEnter();

  useEffect(() => {
    fetchReservations(!sectionCache.reservations);
    
    // I check whether to open the feedback form after a booking.
    if (location.state?.showFeedback) {
      setShowFeedbackModal(true);
      if (location.state?.message) {
        setSuccess(location.state.message);
        setTimeout(() => setSuccess(''), 5000);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state?.showFeedback, location.state?.message, navigate]);

  const fetchReservations = async (isInitial = true) => {
    try {
      if (isInitial && !sectionCache.reservations) setLoading(true);
      const response = await fetchList(API_ENDPOINTS.MY_RESERVATIONS, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const result = await response.json();
      
      let userReservations = [];
      if (result.data && result.data.reservations) {
        userReservations = result.data.reservations;
      } else if (Array.isArray(result.data)) {
        userReservations = result.data;
      } else if (Array.isArray(result)) {
        userReservations = result;
      }

      // Sort by creation date or start date (newest first)
      userReservations.sort((a, b) => new Date(b.created_at || b.start_date || b.start_time) - new Date(a.created_at || a.start_date || a.start_time));

      sectionCache.reservations = userReservations;
      setReservations(userReservations);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      if (!sectionCache.reservations) {
        setError('Failed to load reservations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const isConfirmed = await confirm({
      title: 'Cancel Reservation',
      message: 'Are you sure you want to cancel this reservation? The slot will be released back to other students and faculty.',
      confirmText: 'Yes, Cancel Reservation',
      cancelText: 'Keep Reservation',
      variant: 'danger',
      iconType: 'alert'
    });
    if (!isConfirmed) return;

    setCancellingId(reservationId);
    setError('');
    setSuccess('');

    try {
      const cancelUrl = `${API_ENDPOINTS.RESERVATIONS}/${reservationId}/cancel`;
      
      const response = await fetch(cancelUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel reservation');
      }

      showToast('Reservation cancelled successfully', 'success');
      setSuccess('Reservation cancelled successfully');
      
      // Update local state
      setReservations((prev) =>
        prev.map((r) =>
          (r.reservation_id === reservationId || r.id === reservationId)
            ? { ...r, status: 'cancelled' }
            : r
        )
      );

      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error('Cancel reservation failed:', err);
      setError(err.message || 'Failed to cancel reservation. Please try again.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCancellingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeSlot = (startStr, endStr) => {
    if (!startStr) return 'Standard Slot';
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    const startFmt = !isNaN(start.getTime()) 
      ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';
    const endFmt = end && !isNaN(end.getTime()) 
      ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';
    return endFmt ? `${startFmt} – ${endFmt}` : startFmt;
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours === 0) return `${diffMinutes}m`;
    if (diffMinutes === 0) return `${diffHours}h`;
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Compute dynamic statuses
  const parsedReservations = reservations.map((r) => {
    const startDate = r.start_date || r.start_time ? new Date(r.start_date || r.start_time) : null;
    const endDate = r.end_date || r.end_time ? new Date(r.end_date || r.end_time) : null;
    const now = new Date();
    let computedStatus = (r.status || 'pending').toLowerCase();
    
    let isLiveNow = false;
    if (startDate && endDate) {
      if (computedStatus === 'approved') {
        if (now > endDate) {
          computedStatus = 'completed';
        } else if (now >= startDate && now <= endDate) {
          computedStatus = 'active';
          isLiveNow = true;
        }
      }
    }

    return {
      ...r,
      computedStatus,
      startDate,
      endDate,
      isLiveNow,
    };
  });

  const totalCount = parsedReservations.length;
  const pendingCount = parsedReservations.filter((r) => r.computedStatus === 'pending').length;
  const approvedActiveCount = parsedReservations.filter((r) => r.computedStatus === 'approved' || r.computedStatus === 'active').length;
  const completedCount = parsedReservations.filter((r) => r.computedStatus === 'completed').length;

  // Filter reservations
  const filteredReservations = parsedReservations.filter((r) => {
    // Tab constraint
    if (activeTab === 'pending' && r.computedStatus !== 'pending') return false;
    if (activeTab === 'approved' && (r.computedStatus !== 'approved' && r.computedStatus !== 'active')) return false;
    if (activeTab === 'completed' && r.computedStatus !== 'completed') return false;

    // Status dropdown constraint
    if (statusFilter !== 'all' && r.computedStatus !== statusFilter) return false;

    // Search query constraint
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const resourceName = (r.resource_name || '').toLowerCase();
      const resourceType = (r.resource_type || '').toLowerCase();
      const locationName = (r.location || '').toLowerCase();
      const purposeText = (r.purpose || '').toLowerCase();
      const idStr = String(r.id || r.reservation_id || '');

      return (
        resourceName.includes(q) ||
        resourceType.includes(q) ||
        locationName.includes(q) ||
        purposeText.includes(q) ||
        idStr.includes(q)
      );
    }

    return true;
  });

  return (
    <>
      <StudentHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="bh-page" data-section-content>

          {/* ── Page Hero ── */}
          <div className="bh-hero">
            <div className="bh-hero__icon">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="bh-hero__title">My Reservations</h1>
              <p className="bh-hero__sub">
                Track, monitor, and manage your institutional resource bookings in real time.
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                className="bh-btn-new-res"
                onClick={() => navigate('/browse-resources')}
              >
                <Plus size={16} /> New Reservation
              </button>
            </div>
          </div>

          {/* ── Feedback Banners ── */}
          {error && (
            <div className="bh-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bh-success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* ── Quick Stats Grid with Frosted Glassmorphism & Blur ── */}
          <div className="bh-stats-grid">
            <div className="bh-stat-card bh-stat-card--total">
              <div className="bh-stat-icon">
                <Calendar size={20} />
              </div>
              <div>
                <div className="bh-stat-value">{totalCount}</div>
                <div className="bh-stat-label">Total Requests</div>
              </div>
            </div>

            <div className="bh-stat-card bh-stat-card--pending">
              <div className="bh-stat-icon">
                <Clock size={20} />
              </div>
              <div>
                <div className="bh-stat-value">{pendingCount}</div>
                <div className="bh-stat-label">Pending Approval</div>
              </div>
            </div>

            <div className="bh-stat-card bh-stat-card--approved">
              <div className="bh-stat-icon" style={{ color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="bh-stat-value">{approvedActiveCount}</div>
                <div className="bh-stat-label">Approved & Active</div>
              </div>
            </div>

            <div className="bh-stat-card bh-stat-card--completed">
              <div className="bh-stat-icon" style={{ color: '#94a3b8' }}>
                <Clock size={20} />
              </div>
              <div>
                <div className="bh-stat-value">{completedCount}</div>
                <div className="bh-stat-label">Completed</div>
              </div>
            </div>
          </div>

          {/* ── Main Reservations Ledger Card ── */}
          <div className="bh-card">
            <div className="bh-card__header">
              <div className="bh-header-main">
                <div className="bh-card__header-icon">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="bh-card__title">
                    {activeTab === 'pending'
                      ? 'Pending Approval Queue'
                      : activeTab === 'approved'
                      ? 'Approved & Ongoing Bookings'
                      : activeTab === 'completed'
                      ? 'Completed Reservations'
                      : 'My Reservation Ledger'}
                  </h2>
                  <p className="bh-card__sub">
                    {filteredReservations.length} booking{filteredReservations.length !== 1 ? 's' : ''} listed
                  </p>
                </div>
              </div>

              {/* Controls: Tabs, Search & Status Dropdown */}
              <div className="bh-controls-row">
                <div className="bh-tabs">
                  <button
                    type="button"
                    className={`bh-tab-btn${activeTab === 'all' ? ' bh-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All
                    <span className="bh-tab-badge">{totalCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`bh-tab-btn${activeTab === 'pending' ? ' bh-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending
                    {pendingCount > 0 && <span className="bh-tab-badge">{pendingCount}</span>}
                  </button>
                  <button
                    type="button"
                    className={`bh-tab-btn${activeTab === 'approved' ? ' bh-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    className={`bh-tab-btn${activeTab === 'completed' ? ' bh-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                  >
                    Completed
                  </button>
                </div>

                <div className="bh-search-wrap">
                  <span className="bh-search-icon">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search resource, location, ID…"
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
                    icon={<Filter size={14} />}
                  />
                </div>
              </div>
            </div>

            {filteredReservations.length === 0 && !loading ? (
              <div className="bh-empty">
                <Calendar size={48} />
                <p>
                  {activeTab === 'pending'
                    ? 'You have no bookings currently awaiting approval.'
                    : searchQuery || statusFilter !== 'all'
                    ? 'No reservations match your search or filter criteria.'
                    : "You haven't made any resource reservations yet."}
                </p>
                <button
                  type="button"
                  className="bh-btn-new-res"
                  style={{ marginTop: '12px' }}
                  onClick={() => navigate('/browse-resources')}
                >
                  <Plus size={16} /> Browse & Reserve Resources
                </button>
              </div>
            ) : (
              <div className="bh-table-wrap">
                <table className="bh-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Resource Details</th>
                      <th>Scheduled Slot</th>
                      <th>Location & Attendees</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions & Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r) => {
                      const resId = r.id || r.reservation_id;
                      const isExpanded = expandedIds.has(resId);
                      const isPending = r.computedStatus === 'pending';
                      const isCancelling = cancellingId === resId;

                      const duration = calculateDuration(r.start_date || r.start_time, r.end_date || r.end_time);

                      return (
                        <React.Fragment key={resId}>
                          <tr>
                            <td className="bh-td-id">#{resId}</td>
                            <td>
                              <div className="bh-resource-cell">
                                <span className="bh-resource-name">
                                  {r.resource_name || 'Academic Facility'}
                                </span>
                                <span className="bh-type-tag">
                                  {r.resource_type || 'Resource'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="bh-time-cell">
                                <span className="bh-date">
                                  {formatDate(r.start_date || r.start_time)}
                                </span>
                                <span className="bh-time-range">
                                  <Clock size={13} />
                                  {formatTimeSlot(r.start_date || r.start_time, r.end_date || r.end_time)}
                                  {duration && (
                                    <span style={{ color: '#faea09', marginLeft: '4px' }}>
                                      ({duration})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="bh-time-cell">
                                <span style={{ color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <MapPin size={13} style={{ color: '#faea09' }} />
                                  {r.location || 'Campus Center'}
                                </span>
                                <span style={{ color: 'rgba(148, 163, 184, 0.8)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Users size={13} />
                                  {r.attendees ? `${r.attendees} Attendees` : '1 Attendee'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <ReservationStatusBadge 
                                status={r.computedStatus} 
                                isActiveNow={r.isLiveNow} 
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                {(isPending || r.status === 'approved') && (
                                  <button
                                    type="button"
                                    className="bh-btn-cancel-res"
                                    onClick={() => handleCancelReservation(resId)}
                                    disabled={isCancelling}
                                    title="Cancel this reservation"
                                  >
                                    <XCircle size={14} />
                                    {isCancelling ? 'Cancelling…' : 'Cancel'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="bh-btn-detail-toggle"
                                  onClick={() => toggleExpand(resId)}
                                  aria-expanded={isExpanded}
                                  title={isExpanded ? 'Collapse details' : 'Expand full details'}
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Close</span>
                                      <ChevronUp size={14} />
                                    </>
                                  ) : (
                                    <>
                                      <span>Details</span>
                                      <ChevronDown size={14} />
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* ── Expandable Detail Row ── */}
                          {isExpanded && (
                            <tr className="bh-detail-row">
                              <td colSpan="6">
                                <div className="bh-detail-content">
                                  <div className="bh-detail-grid">
                                    <div className="bh-detail-cell">
                                      <MapPin size={16} />
                                      <div className="bh-detail-cell-info">
                                        <span className="bh-detail-cell-label">Location / Room</span>
                                        <span className="bh-detail-cell-val">{r.location || 'On-Campus Facility'}</span>
                                      </div>
                                    </div>
                                    <div className="bh-detail-cell">
                                      <Users size={16} />
                                      <div className="bh-detail-cell-info">
                                        <span className="bh-detail-cell-label">Expected Attendees</span>
                                        <span className="bh-detail-cell-val">{r.attendees || 1} participant{r.attendees !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                    <div className="bh-detail-cell">
                                      <Clock size={16} />
                                      <div className="bh-detail-cell-info">
                                        <span className="bh-detail-cell-label">Full Scheduled Range</span>
                                        <span className="bh-detail-cell-val">
                                          {formatDateTime(r.start_date || r.start_time)} → {formatDateTime(r.end_date || r.end_time)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <ReservationHistory reservationId={resId} />
                                  {r.rejection_reason && <div className="bh-purpose-box"><strong>Rejection reason:</strong> {r.rejection_reason}</div>}
                                  {r.reviewed_at && <p>Reviewed: {new Date(r.reviewed_at).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})}</p>}
                                  {r.purpose && (
                                    <div className="bh-purpose-box">
                                      <strong>Purpose:</strong> {r.purpose}
                                    </div>
                                  )}

                                  {r.requirements && (
                                    <div className="bh-req-box">
                                      <strong>Special Equipment & Requirements:</strong> {r.requirements}
                                    </div>
                                  )}

                                  {r.computedStatus === 'rejected' && r.rejection_reason && (
                                    <div className="bh-rejection-box">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <AlertCircle size={16} />
                                        <strong>Rejection Feedback from Administration:</strong>
                                      </div>
                                      <p style={{ margin: 0 }}>{r.rejection_reason}</p>
                                    </div>
                                  )}

                                  <div className="bh-detail-actions">
                                    <span className="bh-booked-stamp">
                                      Booked On: {formatDateTime(r.created_at)}
                                    </span>
                                    {isPending && (
                                      <button
                                        type="button"
                                        className="bh-btn-cancel-res"
                                        onClick={() => handleCancelReservation(resId)}
                                        disabled={isCancelling}
                                      >
                                        <XCircle size={14} />
                                        {isCancelling ? 'Cancelling Reservation…' : 'Cancel Reservation'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </section>
      </main>
      
      <FloatingFeedbackButton 
        autoOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />

    </>
  );
};

export default MyReservations;

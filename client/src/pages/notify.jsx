import {apiFetch,apiResponseError,readRequestsPaused} from '../config/api';
import {usePageLoading} from '../components/LoadingState';
import { useEventCallback } from '../hooks/useEventCallback';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import StudentHeader from '../components/StudentHeader';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { useSectionEnter } from '../hooks/effects';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/notify.css';

// ── Notification Filter Options ─────────────────────────────────────────────
const NOTIFY_FILTER_OPTIONS = [
  { value: 'all',          label: 'All Notifications' },
  { value: 'unread',       label: 'Unread Only' },
  { value: 'approved',     label: 'Approved' },
  { value: 'rejected',     label: 'Rejected' },
  { value: 'pending',      label: 'Pending' },
  { value: 'registration', label: 'Registrations / System' },
];

// ── Custom Select (Matching other sections) ──────────────────────────────────
function CustomSelect({ value, onChange, placeholder = 'Filter…', options = [], icon }) {
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
        style={{ padding: '10px 14px 10px 40px' }}
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

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  HeaderBell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  CheckCheck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M3 21h18M9 21V7l6-4v18M9 12h6"/>
    </svg>
  ),
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  usePageLoading(loading && notifications.length === 0);
  const [error, setError] = useState(null);
  const [markingAll,setMarkingAll]=useState(false);
  const fetchVersion=useRef(0);
  const notificationRequestBusy=useRef(false);

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const mapNotificationType = (dbType) => {
    const typeMap = {
      'success': 'approved',
      'error': 'rejected',
      'warning': 'pending',
      'info': 'registration',
      'reservation_approved': 'approved',
      'reservation_rejected': 'rejected',
      'reservation_pending': 'pending',
      'reservation_cancelled': 'rejected',
      'user_registered': 'registration',
      'system': 'registration',
    };
    return typeMap[dbType] || 'registration';
  };

  const fetchNotifications = useEventCallback(async () => {
    if(notificationRequestBusy.current)return;
    notificationRequestBusy.current=true;
    const version=++fetchVersion.current;
    try {
      setLoading(true);
      setError(null);

      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const endpoint = user.role === 'admin'
        ? API_ENDPOINTS.NOTIFICATIONS_ALL
        : API_ENDPOINTS.NOTIFICATIONS;

      const response = await apiFetch(endpoint, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await apiResponseError(response,'Unable to load notifications.');
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.notifications) {
        throw new Error('Invalid response format from server');
      }

      const transformed = data.data.notifications.map((n) => ({
        id: n.notification_id,
        type: mapNotificationType(n.type),
        title: n.title,
        message: n.message,
        time: formatRelativeTime(n.created_at),
        timestamp: new Date(n.created_at),
        read: n.is_read === true || Number(n.is_read) === 1,
        user_name: n.user_name,
        resource_name: n.resource_name,
        reservation_id: n.reservation_id,
      }));

      if(version===fetchVersion.current)setNotifications(transformed);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if(version===fetchVersion.current)setError(err.message);
    } finally {
      notificationRequestBusy.current=false;
      if(version===fetchVersion.current)setLoading(false);
    }
  });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(()=>{if(!document.hidden&&!readRequestsPaused())fetchNotifications();}, 120000);
    return () => clearInterval(interval);
  }, [navigate, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_READ(id), {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if(markingAll)return;
    setMarkingAll(true);setError(null);++fetchVersion.current;
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_READ_ALL, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      const data=await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to mark all notifications as read');
      ++fetchVersion.current;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err.message || 'Unable to mark notifications as read. Please try again.');
    } finally {setMarkingAll(false);}
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATION_DELETE(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.read) return false;
    if (filter !== 'all' && filter !== 'unread' && n.type !== filter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchMessage = (n.message || '').toLowerCase().includes(q);
      const matchUser = (n.user_name || '').toLowerCase().includes(q);
      const matchResource = (n.resource_name || '').toLowerCase().includes(q);
      return matchTitle || matchMessage || matchUser || matchResource;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const user = getCurrentUser();

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'approved':
        return (
          <div className="nt-item__type-icon nt-item__type-icon--approved">
            <Icons.Check />
          </div>
        );
      case 'rejected':
        return (
          <div className="nt-item__type-icon nt-item__type-icon--rejected">
            <Icons.X />
          </div>
        );
      case 'pending':
        return (
          <div className="nt-item__type-icon nt-item__type-icon--pending">
            <Icons.Clock />
          </div>
        );
      default:
        return (
          <div className="nt-item__type-icon nt-item__type-icon--registration">
            <Icons.Info />
          </div>
        );
    }
  };

  useSectionEnter();

  return (
    <>
      {user?.role === 'admin' ? <AdminHeader /> : <StudentHeader />}
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
{error && <p role="alert">{error}</p>}
        <section className="nt-page" data-section-content>

          {/* ── Page Hero ── */}
          <div className="nt-hero">
            <div className="nt-hero-left">
              <div className="nt-hero__icon">
                <Icons.Bell />
              </div>
              <div>
                <h1 className="nt-hero__title">Notification Center</h1>
                <p className="nt-hero__sub">
                  Stay updated on reservation milestones, requests, and campus alerts.
                </p>
              </div>
            </div>

            <div className="nt-hero-actions">
              {unreadCount > 0 && (
                <span className="nt-unread-badge">
                  {unreadCount} unread
                </span>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="nt-btn-mark-all"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  aria-busy={markingAll}
                >
                  <Icons.CheckCheck /> {markingAll ? 'Marking as read…' : 'Mark all as read'}
                </button>
              )}
            </div>
          </div>

          {/* ── Filter & Search Control Band ── */}
          <div className="nt-controls-card">
            <div className="nt-search-wrap">
              <span className="nt-search-icon">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search by title, message, requester, room…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="nt-search-input"
              />
            </div>

            <div className="nt-filter-select-wrap">
              <CustomSelect
                value={filter}
                onChange={(val) => setFilter(val)}
                options={NOTIFY_FILTER_OPTIONS}
                icon={<Icons.Filter />}
              />
            </div>
          </div>

          {/* ── Notifications List Card ── */}
          <div className="nt-card">
            <div className="nt-card__header">
              <div className="nt-card__header-left">
                <div className="nt-card__header-icon">
                  <Icons.HeaderBell />
                </div>
                <div>
                  <h2 className="nt-card__title">Activity Feed</h2>
                  <p className="nt-card__sub">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="nt-empty">
                <Icons.Bell />
                <p>
                  {notifications.length === 0
                    ? 'No notifications yet. You are all caught up!'
                    : 'No notifications match your search and filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="nt-list">
                {filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`nt-item${!item.read ? ' nt-item--unread' : ''}`}
                  >
                    {renderTypeIcon(item.type)}

                    <div className="nt-item__content">
                      <div className="nt-item__top">
                        <h3 className="nt-item__title">
                          {!item.read && <span className="nt-dot-unread" title="Unread" />}
                          {item.title}
                        </h3>
                        <span className="nt-item__time">{item.time}</span>
                      </div>

                      <p className="nt-item__message">{item.message}</p>

                      <div className="nt-item__tags">
                        {item.user_name && (
                          <span className="nt-tag">
                            <Icons.User /> {item.user_name}
                          </span>
                        )}
                        {item.resource_name && (
                          <span className="nt-tag">
                            <Icons.Building /> {item.resource_name}
                          </span>
                        )}
                        {item.reservation_id && (
                          <span className="nt-tag">
                            Ref #{item.reservation_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="nt-item__actions">
                      {!item.read && (
                        <button
                          type="button"
                          className="nt-btn-action"
                          onClick={() => markAsRead(item.id)}
                          title="Mark as read"
                        >
                          <Icons.Check /> Read
                        </button>
                      )}
                      <button
                        type="button"
                        className="nt-btn-action nt-btn-action--delete"
                        onClick={() => deleteNotification(item.id)}
                        title="Delete notification"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      </main>
      
    </>
  );
};

export default NotificationsPage;
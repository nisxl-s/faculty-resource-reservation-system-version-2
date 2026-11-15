import {usePageLoading} from '../components/LoadingState';
import { fetchList } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';

import { Calendar, Clock, CheckCircle, BookOpen, TrendingUp, RefreshCw, Plus, ChevronRight, Activity, Compass, User, HelpCircle, LayoutDashboard } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { sectionCache } from '../utils/sectionCache';
import { useSectionEnter } from '../hooks/effects';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/bookinghistory.css';
import '../assets/css/student.css';

// ── Status Badge Helper ───────────────────────────────────────────────────────
function ReservationStatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',   cls: 'bh-badge bh-badge--pending' },
    approved:  { label: 'Approved',  cls: 'bh-badge bh-badge--approved' },
    active:    { label: 'Active',    cls: 'bh-badge bh-badge--active' },
    completed: { label: 'Completed', cls: 'bh-badge bh-badge--completed' },
    rejected:  { label: 'Rejected',  cls: 'bh-badge bh-badge--rejected' },
    cancelled: { label: 'Cancelled', cls: 'bh-badge bh-badge--cancelled' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bh-badge' };
  return <span className={cls}>{label}</span>;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!sectionCache.studentDashboard);
  usePageLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(
    sectionCache.studentDashboard || {
      activeReservations: 0,
      pendingRequests: 0,
      totalBookings: 0,
      upcomingReservations: 0,
    }
  );
  const [recentActivity, setRecentActivity] = useState(sectionCache.studentActivity || []);
  const [user, setUser] = useState(() => getCurrentUser());

  useSectionEnter();

  useEffect(() => {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'faculty')) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Fetch dashboard data: silent background refresh if cached
    fetchDashboardData(!sectionCache.studentDashboard);
  }, [navigate]);

  const fetchDashboardData = async (initialLoad = false) => {
    try {
      if (initialLoad) setLoading(true);
      else setRefreshing(true);

      const reservationsResponse = await fetchList(API_ENDPOINTS.MY_RESERVATIONS, {
        headers: getAuthHeaders(),
      });

      if (!reservationsResponse.ok) {
        throw new Error('Failed to fetch dashboard reservations');
      }

      const reservationsData = await reservationsResponse.json();

      let userReservations = [];
      if (Array.isArray(reservationsData)) {
        userReservations = reservationsData;
      } else if (reservationsData.data && reservationsData.data.reservations) {
        userReservations = reservationsData.data.reservations;
      } else if (reservationsData.data && Array.isArray(reservationsData.data)) {
        userReservations = reservationsData.data;
      }

      const now = new Date();

      // Compute status counts
      const activeCount = userReservations.filter((r) => {
        const startDate = new Date(r.start_date || r.start_time);
        const endDate = new Date(r.end_date || r.end_time);
        return r.status === 'approved' && now >= startDate && now <= endDate;
      }).length;

      const pendingCount = userReservations.filter((r) => r.status === 'pending').length;
      const totalCount = userReservations.length;

      const upcomingCount = userReservations.filter((r) => {
        const startDate = new Date(r.start_date || r.start_time);
        return r.status === 'approved' && startDate > now;
      }).length;

      const computedStats = {
        activeReservations: activeCount,
        pendingRequests: pendingCount,
        totalBookings: totalCount,
        upcomingReservations: upcomingCount,
      };

      setDashboardData(computedStats);
      sectionCache.studentDashboard = computedStats;
      sectionCache.reservations = userReservations;

      // Recent 5 activities
      const sorted = [...userReservations]
        .sort((a, b) => new Date(b.created_at || b.start_date || b.start_time) - new Date(a.created_at || a.start_date || a.start_time))
        .slice(0, 5)
        .map((r) => {
          const startDate = r.start_date || r.start_time ? new Date(r.start_date || r.start_time) : null;
          const endDate = r.end_date || r.end_time ? new Date(r.end_date || r.end_time) : null;
          let computed = (r.status || 'pending').toLowerCase();
          if (startDate && endDate && computed === 'approved') {
            if (now > endDate) computed = 'completed';
            else if (now >= startDate && now <= endDate) computed = 'active';
          }
          return {
            id: r.id || r.reservation_id,
            resource: r.resource_name || 'Academic Facility',
            type: r.resource_type || 'Facility',
            location: r.location || 'Campus Center',
            date: startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible',
            time: startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: computed,
          };
        });

      setRecentActivity(sorted);
      sectionCache.studentActivity = sorted;
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <StudentHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="sd-page" data-section-content>

          {/* ── Page Hero Header ── */}
          <div className="sd-hero">
            <div className="sd-hero-left">
              <div className="sd-hero__icon">
                <LayoutDashboard size={30} />
              </div>
              <div>
                <h1 className="sd-hero__title">Student Dashboard</h1>
                <p className="sd-hero__sub">
                  Welcome back, {user?.full_name || 'Student'}! Here is your real-time campus reservation overview.
                </p>
              </div>
            </div>

            <div className="sd-hero-controls">
              <div className="sd-date-badge">
                <Calendar size={15} />
                <span>{currentDateFormatted}</span>
              </div>
              <button
                type="button"
                className="sd-refresh-btn"
                onClick={() => fetchDashboardData(false)}
                disabled={refreshing}
                title="Refresh dashboard metrics"
              >
                <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
                <span>{refreshing ? 'Updating…' : 'Refresh Data'}</span>
              </button>
              <button
                type="button"
                className="bh-btn-new-res"
                onClick={() => navigate('/browse-resources')}
              >
                <Plus size={16} /> New Reservation
              </button>
            </div>
          </div>

          {/* ── Active Session Live Alert Banner ── */}
          {dashboardData.activeReservations > 0 && (
            <div className="sd-live-banner">
              <div className="sd-live-banner-left">
                <div className="sd-live-dot" />
                <div>
                  <strong style={{ color: '#4ade80', fontSize: '0.98rem' }}>
                    Active Session in Progress
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                    You currently have {dashboardData.activeReservations} active resource booking{dashboardData.activeReservations > 1 ? 's' : ''} ongoing on campus right now.
                  </p>
                </div>
              </div>
              <Link to="/my-reservations" className="sd-live-link">
                View in My Reservations →
              </Link>
            </div>
          )}

          {/* ── 4 Vivid Frosted-Glass Stat Tiles with Blur ── */}
          <div className="bh-stats-grid">
            {/* Tile 1: Active Now */}
            <div className="bh-stat-card bh-stat-card--approved">
              <div className="bh-stat-icon" style={{ color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="bh-stat-value">{dashboardData.activeReservations}</div>
                <div className="bh-stat-label">Active Right Now</div>
              </div>
            </div>

            {/* Tile 2: Pending Approval */}
            <div className="bh-stat-card bh-stat-card--pending">
              <div className="bh-stat-icon">
                <Clock size={22} />
              </div>
              <div>
                <div className="bh-stat-value">{dashboardData.pendingRequests}</div>
                <div className="bh-stat-label">Pending Approval</div>
              </div>
            </div>

            {/* Tile 3: Total Bookings */}
            <div className="bh-stat-card bh-stat-card--total">
              <div className="bh-stat-icon">
                <CheckCircle size={22} />
              </div>
              <div>
                <div className="bh-stat-value">{dashboardData.totalBookings}</div>
                <div className="bh-stat-label">Total Bookings</div>
              </div>
            </div>

            {/* Tile 4: Upcoming Sessions */}
            <div className="bh-stat-card bh-stat-card--completed">
              <div className="bh-stat-icon" style={{ color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}>
                <Calendar size={22} />
              </div>
              <div>
                <div className="bh-stat-value">{dashboardData.upcomingReservations}</div>
                <div className="bh-stat-label">Upcoming Sessions</div>
              </div>
            </div>
          </div>

          {/* ── Main Two-Column Content Grid ── */}
          <div className="sd-content-grid">

            {/* Column 1: Quick Actions & Navigation Card */}
            <div className="sd-card">
              <div className="sd-card__header">
                <div className="sd-card__header-left">
                  <div className="sd-card__header-icon">
                    <Compass size={22} />
                  </div>
                  <div>
                    <h2 className="sd-card__title">Student Services & Actions</h2>
                    <p className="sd-card__sub">Direct access to campus facilities and booking management</p>
                  </div>
                </div>
              </div>

              <div className="sd-card-body">
                {/* Action 1: Browse Resources */}
                <Link to="/browse-resources" className="sd-action-tile">
                  <div className="sd-action-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa' }}>
                    <BookOpen size={22} />
                  </div>
                  <div className="sd-action-content">
                    <h3 className="sd-action-title">Browse & Reserve Resources</h3>
                    <p className="sd-action-sub">Explore classrooms, computer labs, conference rooms, and equipment.</p>
                  </div>
                  <ChevronRight size={18} className="sd-action-arrow" />
                </Link>

                {/* Action 2: My Reservations Ledger */}
                <Link to="/my-reservations" className="sd-action-tile">
                  <div className="sd-action-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80' }}>
                    <Calendar size={22} />
                  </div>
                  <div className="sd-action-content">
                    <h3 className="sd-action-title">My Reservations Ledger</h3>
                    <p className="sd-action-sub">View booking timelines, scheduled slots, or cancel pending requests.</p>
                  </div>
                  <ChevronRight size={18} className="sd-action-arrow" />
                </Link>

                {/* Action 3: Student Profile */}
                <Link to="/student-profile" className="sd-action-tile">
                  <div className="sd-action-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc' }}>
                    <User size={22} />
                  </div>
                  <div className="sd-action-content">
                    <h3 className="sd-action-title">Account Profile & Credentials</h3>
                    <p className="sd-action-sub">Manage your department, student ID, and contact details.</p>
                  </div>
                  <ChevronRight size={18} className="sd-action-arrow" />
                </Link>

                {/* Action 4: Help & FAQ */}
                <Link to="/help" className="sd-action-tile">
                  <div className="sd-action-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
                    <HelpCircle size={22} />
                  </div>
                  <div className="sd-action-content">
                    <h3 className="sd-action-title">Reservation Rules & FAQ</h3>
                    <p className="sd-action-sub">Review facility operating hours, policies, and guidelines.</p>
                  </div>
                  <ChevronRight size={18} className="sd-action-arrow" />
                </Link>
              </div>
            </div>

            {/* Column 2: Recent Activity Card */}
            <div className="sd-card">
              <div className="sd-card__header">
                <div className="sd-card__header-left">
                  <div className="sd-card__header-icon">
                    <Activity size={22} />
                  </div>
                  <div>
                    <h2 className="sd-card__title">Recent Reservation Activity</h2>
                    <p className="sd-card__sub">Latest booking submissions and status updates</p>
                  </div>
                </div>
                <Link to="/my-reservations" className="sd-header-link">
                  View Ledger ({dashboardData.totalBookings}) →
                </Link>
              </div>

              <div className="sd-card-body">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <Link
                      key={activity.id}
                      to="/my-reservations"
                      className="sd-activity-item"
                    >
                      <div className="sd-activity-left">
                        <div className="sd-activity-avatar">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h4 className="sd-activity-title">{activity.resource}</h4>
                          <div className="sd-activity-meta">
                            <span className="bh-type-tag" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                              {activity.type}
                            </span>
                            <span>•</span>
                            <span>{activity.date}</span>
                            {activity.time && (
                              <>
                                <span>•</span>
                                <span>{activity.time}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ReservationStatusBadge status={activity.status} />
                    </Link>
                  ))
                ) : (
                  <div className="bh-empty" style={{ padding: '40px 16px' }}>
                    <Calendar size={44} />
                    <p style={{ margin: 0, color: 'rgba(148, 163, 184, 0.7)' }}>
                      You have not made any resource reservations yet.
                    </p>
                    <button
                      type="button"
                      className="bh-btn-new-res"
                      style={{ marginTop: '12px' }}
                      onClick={() => navigate('/browse-resources')}
                    >
                      <Plus size={16} /> Reserve a Facility
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </section>
      </main>
      
      <FloatingFeedbackButton />

    </>
  );
};

export default StudentDashboard;

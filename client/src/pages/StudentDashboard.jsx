import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertTriangle, BookOpen, Search, TrendingUp } from 'lucide-react';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer/Footer';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import FloatingHelpButton from '../components/FloatingHelpButton';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import '../assets/css/student.css';
import '../assets/css/global.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    activeReservations: 0,
    pendingRequests: 0,
    totalBookings: 0,
    upcomingReservations: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'faculty')) {
      alert('Access denied. Students and Faculty only.');
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Fetch dashboard data
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch reservations (use my-reservations for students)
      const reservationsResponse = await fetch(API_ENDPOINTS.MY_RESERVATIONS, {
        headers: getAuthHeaders(),
      });
      const reservationsData = await reservationsResponse.json();

      // Parse reservations (already filtered by backend to current user)
      let userReservations = [];
      if (Array.isArray(reservationsData)) {
        userReservations = reservationsData;
      } else if (reservationsData.data && reservationsData.data.reservations) {
        userReservations = reservationsData.data.reservations;
      } else if (reservationsData.data && Array.isArray(reservationsData.data)) {
        userReservations = reservationsData.data;
      }

      console.log('API Response:', reservationsData);
      console.log('User Reservations from API:', userReservations);

      // Calculate stats
      const now = new Date();
      const activeCount = userReservations.filter(r => {
        const startDate = new Date(r.start_time);
        const endDate = new Date(r.end_time);
        return r.status === 'approved' && now >= startDate && now <= endDate;
      }).length;

      const pendingCount = userReservations.filter(r => r.status === 'pending').length;
      const totalCount = userReservations.length;

      const upcomingCount = userReservations.filter(r => {
        const startDate = new Date(r.start_time);
        return r.status === 'approved' && startDate > now;
      }).length;

      console.log('User Reservations:', userReservations);
      console.log('Dashboard Stats:', {
        activeReservations: activeCount,
        pendingRequests: pendingCount,
        totalBookings: totalCount,
        upcomingReservations: upcomingCount
      });

      setDashboardData({
        activeReservations: activeCount,
        pendingRequests: pendingCount,
        totalBookings: totalCount,
        upcomingReservations: upcomingCount
      });

      // Set recent activity (last 5 reservations)
      const sortedReservations = userReservations
        .sort((a, b) => new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time))
        .slice(0, 5)
        .map(r => ({
          id: r.id || r.reservation_id,
          resource: r.resource_name || 'Resource',
          date: new Date(r.start_time).toLocaleDateString(),
          status: r.status,
          time: new Date(r.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));

      setRecentActivity(sortedReservations);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, value, label, color, gradient }) => (
    <div className={`student-stat-card stat-${color}`} style={{
      background: gradient || `linear-gradient(135deg, ${color === 'blue' ? '#3b82f6, #8b5cf6' : color === 'green' ? '#10b981, #06b6d4' : color === 'orange' ? '#f59e0b, #ef4444' : '#6366f1, #8b5cf6'})`
    }}>
      <div className="stat-icon-wrapper">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon, title, description, to, color }) => (
    <Link to={to} className="quick-action-card" style={{
      borderLeft: `4px solid ${color}`
    }}>
      <div className="action-icon" style={{ color }}>{icon}</div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </Link>
  );

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      active: '#3b82f6',
      completed: '#6b7280'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: `${statusColors[status] || '#6b7280'}20`,
        color: statusColors[status] || '#6b7280',
        border: `1px solid ${statusColors[status] || '#6b7280'}40`
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <StudentHeader />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff'
        }}>
          <h3>✨ Loading your dashboard...</h3>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard">
        <div className="student-container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div>
              <h1 className="welcome-title">
                Welcome back, <span className="highlight-text">{user?.full_name || 'Student'}!</span>
              </h1>
              <p className="welcome-subtitle">Here's what's happening with your reservations today</p>
            </div>
            <div className="welcome-date">
              <Calendar size={20} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <StatCard
              icon={<TrendingUp size={32} />}
              value={dashboardData.activeReservations}
              label="Active Reservations"
              color="blue"
            />
            <StatCard
              icon={<Clock size={32} />}
              value={dashboardData.pendingRequests}
              label="Pending Requests"
              color="orange"
            />
            <StatCard
              icon={<CheckCircle size={32} />}
              value={dashboardData.totalBookings}
              label="Total Bookings"
              color="green"
            />
            <StatCard
              icon={<Calendar size={32} />}
              value={dashboardData.upcomingReservations}
              label="Upcoming Reservations"
              color="purple"
            />
          </div>

          {/* Main Content Grid */}
          <div className="content-grid">
            {/* Quick Actions */}
            <div className="dashboard-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions-grid">
                <QuickActionCard
                  icon={<BookOpen size={24} />}
                  title="Book New Resource"
                  description="Reserve classrooms, labs, or equipment"
                  to="/browse-resources"
                  color="#3b82f6"
                />
                <QuickActionCard
                  icon={<Calendar size={24} />}
                  title="My Reservations"
                  description="View and manage your bookings"
                  to="/my-reservations"
                  color="#10b981"
                />
                <QuickActionCard
                  icon={<Search size={24} />}
                  title="Browse Resources"
                  description="Explore all available resources"
                  to="/browse-resources"
                  color="#8b5cf6"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-section">
              <h2 className="section-title">Recent Activity</h2>
              <div className="activity-list">
                {recentActivity.length > 0 ? (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-info">
                        <h4 className="activity-resource">{activity.resource}</h4>
                        <p className="activity-details">
                          {activity.date} at {activity.time}
                        </p>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <AlertTriangle size={48} color="#6b7280" />
                    <p>No recent activity</p>
                    <Link to="/browse-resources" className="empty-action-btn">
                      Book Your First Resource
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingFeedbackButton />
      <FloatingHelpButton />
    </>
  );
};

export default StudentDashboard;

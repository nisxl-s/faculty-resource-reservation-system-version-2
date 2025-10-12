import "../assets/css/admin.css";
import "../assets/css/global.css";
import "../assets/css/navbar.css";
import React, { useState, useEffect } from "react";
import { Users, Calendar, Building2, AlertTriangle, BarChart3, RefreshCw, Activity } from "lucide-react";
import Footer from "../components/footer/Footer";
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import AdminHeader from '../components/AdminHeader';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeReservations: 0,
    availableResources: 0,
    pendingApprovals: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Define fetchDashboardData with useCallback to prevent recreation on every render
  // Define fetchDashboardData before useEffect
  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      console.log('Fetching dashboard data...');
      
      // Fetch users count
      const usersResponse = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });
      const usersData = await usersResponse.json();
      console.log('Users response:', usersData);
      
      // Fetch reservations
      const reservationsResponse = await fetch(API_ENDPOINTS.RESERVATIONS, {
        headers: getAuthHeaders(),
      });
      const reservationsData = await reservationsResponse.json();
      console.log('Reservations response:', reservationsData);
      
      // Fetch resources
      const resourcesResponse = await fetch(API_ENDPOINTS.RESOURCES, {
        headers: getAuthHeaders(),
      });
      const resourcesData = await resourcesResponse.json();
      console.log('Resources response:', resourcesData);

      // Handle multiple response formats
      let users = [];
      let reservations = [];
      let resources = [];

      // Parse users - check for nested data.users structure
      if (Array.isArray(usersData)) {
        users = usersData;
      } else if (usersData.data && usersData.data.users && Array.isArray(usersData.data.users)) {
        users = usersData.data.users;
      } else if (usersData.data && Array.isArray(usersData.data)) {
        users = usersData.data;
      } else if (usersData.users && Array.isArray(usersData.users)) {
        users = usersData.users;
      }

      // Parse reservations - check for nested data.reservations structure
      if (Array.isArray(reservationsData)) {
        reservations = reservationsData;
      } else if (reservationsData.data && reservationsData.data.reservations && Array.isArray(reservationsData.data.reservations)) {
        reservations = reservationsData.data.reservations;
      } else if (reservationsData.data && Array.isArray(reservationsData.data)) {
        reservations = reservationsData.data;
      } else if (reservationsData.reservations && Array.isArray(reservationsData.reservations)) {
        reservations = reservationsData.reservations;
      }

      // Parse resources - check for nested data.resources structure
      if (Array.isArray(resourcesData)) {
        resources = resourcesData;
      } else if (resourcesData.data && resourcesData.data.resources && Array.isArray(resourcesData.data.resources)) {
        resources = resourcesData.data.resources;
      } else if (resourcesData.data && Array.isArray(resourcesData.data)) {
        resources = resourcesData.data;
      } else if (resourcesData.resources && Array.isArray(resourcesData.resources)) {
        resources = resourcesData.resources;
      }

      console.log('Parsed data:', { users: users.length, reservations: reservations.length, resources: resources.length });

      // Update dashboard data with real-time counts
      setDashboardData({
        totalUsers: users.length,
        activeReservations: reservations.filter(r => r.status === 'approved').length,
        availableResources: resources.filter(r => r.status === 'available' || r.is_available).length,
        pendingApprovals: reservations.filter(r => r.status === 'pending').length,
      });

      // Set recent activities from reservations (last 5)
      if (reservations.length > 0) {
        const sortedReservations = reservations.sort((a, b) => 
          new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time)
        );
        const activities = sortedReservations.slice(0, 5).map(reservation => ({
          id: reservation.id || reservation.reservation_id,
          time: new Date(reservation.created_at || reservation.start_time).toLocaleString(),
          text: `${reservation.purpose || 'Reservation'} - ${reservation.resource_name || 'Resource'}`,
          type: reservation.status,
        }));
        setRecentActivities(activities);
      }

      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Failed to fetch dashboard data. Please check if the backend server is running on port 5000.');
      // Use fallback data if API fails
      setDashboardData({
        totalUsers: 0,
        activeReservations: 0,
        availableResources: 0,
        pendingApprovals: 0,
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // useEffect for authentication check and initial data fetch
  useEffect(() => {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Access denied. Admin only.');
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Fetch dashboard data from backend (initial load)
    fetchDashboardData(true);

    // Set up auto-refresh every 30 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchDashboardData(false); // Don't show loading spinner for background updates
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]); // fetchDashboardData is now stable

  return (
    <>
      <AdminHeader />
      <div className="admin-dashboard">
        <main className="main-content">
          {loading ? (
            <div className="loading-spinner">
              <h3>✨ Loading dashboard...</h3>
            </div>
          ) : (
            <DashboardContent
              dashboardData={dashboardData}
              recentActivities={recentActivities}
              onRefresh={() => fetchDashboardData(true)}
              lastUpdated={lastUpdated}
            />
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

// Dashboard Content
const DashboardContent = ({ dashboardData, recentActivities, onRefresh, lastUpdated }) => (
  <div className="dashboard-page" style={{paddingTop: '35px'}}>
    <div className="page-header">
      <h2 style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
        <BarChart3 size={36} /> Dashboard Overview
      </h2>
      <p>Real-time monitoring of your university resource management system</p>
      <div className="dashboard-controls">
        <button onClick={onRefresh} className="refresh-btn">
          <RefreshCw size={18} /> Refresh Data
        </button>
        {lastUpdated && (
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>

    <div className="stats-grid">
      <StatCard icon={<Users size={36} />} value={dashboardData.totalUsers} label="Total Users" color="blue" />
      <StatCard icon={<Calendar size={36} />} value={dashboardData.activeReservations} label="Active Reservations" color="green" />
      <StatCard icon={<Building2 size={36} />} value={dashboardData.availableResources} label="Available Resources" color="purple" />
      <Link to="/booking-history" style={{ textDecoration: 'none' }}>
        <StatCard icon={<AlertTriangle size={36} />} value={dashboardData.pendingApprovals} label="Pending Approvals" color="orange" clickable={true} />
      </Link>
    </div>

    <div className="dashboard-section">
      <div className="section-header">
        <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Activity size={24} /> Recent Activity
        </h3>
        <button className="notification-btn">
          <Link to="/notify" className="notify">
           <span>View All Notifications</span>
         </Link>
        </button>
      </div>

      <div className="activity-list">
        {recentActivities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  </div>
);

// Stat card
const StatCard = ({ icon, value, label, color, clickable }) => (
  <div className={`stat-card stat-card-${color}`} style={{ cursor: clickable ? 'pointer' : 'default', transition: 'all 0.3s ease' }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

// Activity Item
const ActivityItem = ({ activity }) => {
  const getStatusClass = (type) => {
    switch (type) {
      case "approved":
        return "activity-approved";
      case "pending":
        return "activity-pending";
      case "rejected":
        return "activity-rejected";
      default:
        return "";
    }
  };

  return (
    <div className={`activity-item ${getStatusClass(activity.type)}`}>
      <span className="activity-time">{activity.time}</span>
      <span className="activity-text">{activity.text}</span>
    </div>
  );
};

// Placeholder Components
const UsersContent = () => (
  <div className="content-page">
    <h2>User Management</h2>
    <p>This section will manage system users.</p>
  </div>
);

const ReservationsContent = () => (
  <div className="content-page">
    <h2>Booking Management</h2>
    <p>This section will manage reservations and bookings.</p>
  </div>
);

const ProfileContent = () => (
  <div className="content-page">
    <h2>Administrator Profile</h2>
    <p>This section will manage profile settings.</p>
  </div>
);

export default AdminDashboard;




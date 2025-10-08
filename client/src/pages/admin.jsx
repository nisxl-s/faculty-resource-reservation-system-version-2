import "../css/admin.css";
import React, { useState, useEffect } from "react";
import { Users, Calendar, Building2, AlertTriangle } from "lucide-react";
import Navbar from "../components/header/AdminNavbar";
import Footer from "../components/footer/Footer";
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 1245,
    activeReservations: 89,
    availableResources: 156,
    pendingApprovals: 12,
  });

  const [recentActivities] = useState([
    {
      id: 1,
      time: "5 minutes ago",
      text: "Reservation for Library SR 3 on 2025-06-11 has been approved.",
      type: "approved",
    },
    {
      id: 2,
      time: "2 hours ago",
      text: "Request for Lab Room 203 on 2025-06-14 is pending admin approval.",
      type: "pending",
    },
    {
      id: 3,
      time: "1 day ago",
      text: "Reservation for Conference Hall on 2025-06-12 has been rejected.",
      type: "rejected",
    },
  ]);

  useEffect(() => {
    // Simulated API call
    setTimeout(() => {
      setDashboardData({
        totalUsers: 1245,
        activeReservations: 89,
        availableResources: 156,
        pendingApprovals: 12,
      });
    }, 1000);
  }, []);

  return (
    <div className="admin-dashboard">
      <Navbar activeSection={activeSection} onNavigate={setActiveSection} />

      <main className="main-content">
        {activeSection === "dashboard" && (
          <DashboardContent
            dashboardData={dashboardData}
            recentActivities={recentActivities}
          />
        )}
        {activeSection === "users" && <UsersContent />}
        {activeSection === "reservations" && <ReservationsContent />}
        {activeSection === "profile" && <ProfileContent />}
      </main>

      <Footer />
    </div>
  );
};

// Dashboard Content
const DashboardContent = ({ dashboardData, recentActivities }) => (
  <div className="dashboard-page">
    <div className="page-header">
      <h2>Dashboard Overview</h2>
      <p>Welcome to the University Resource Management System</p>
    </div>

    <div className="stats-grid">
      <StatCard icon={<Users size={32} />} value={dashboardData.totalUsers} label="Total Users" />
      <StatCard icon={<Calendar size={32} />} value={dashboardData.activeReservations} label="Active Reservations" />
      <StatCard icon={<Building2 size={32} />} value={dashboardData.availableResources} label="Available Resources" />
      <StatCard icon={<AlertTriangle size={32} />} value={dashboardData.pendingApprovals} label="Pending Approvals" />
    </div>

    <div className="dashboard-section">
      <div className="section-header">
        <h3>Recent Activity</h3>
        <button className="notification-btn">
          <Link to="/notify" className="notify">
           <span>More notifications</span>
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
const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
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




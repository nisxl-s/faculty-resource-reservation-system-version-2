import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../config/api';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import uniLogo from '../assets/images/uni_logo.png';
import '../assets/css/navbar.css';

const AdminHeader = () => {
  const location = useLocation();
  const user = getCurrentUser();
  
  useNavbarEffects();
  useMobileNav();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header>
      <nav className="navbar" id="navbar">
        <img src={uniLogo} alt="Website Logo" width="90" height="90" />
        <div className="logo" style={{gap: '0', lineHeight: '1.2'}}>
          <h3 style={{marginBottom: '0', lineHeight: '1.2', fontSize: '1.85rem'}}>Faculty Resources Reservation</h3>
          <span style={{color: '#faea09', marginTop: '0.1rem', display: 'block', fontSize: '1.05rem'}}>
            Welcome, {user?.full_name || 'Administrator'}
          </span>
        </div>
        <ul className="nav-links" id="nav-links">
          <li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Dashboard</Link></li>
          <li><Link to="/user-management" className={location.pathname === '/user-management' ? 'active' : ''}>Users</Link></li>
          <li><Link to="/booking-history" className={location.pathname === '/booking-history' ? 'active' : ''}>Reservations</Link></li>
          <li><Link to="/notify" className={location.pathname === '/notify' ? 'active' : ''}>Notifications</Link></li>
          <li><Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>Profile</Link></li>
          <li>
            <button onClick={handleLogout} className="login-btn" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <LogOut size={18} />
              Logout
            </button>
          </li>
        </ul>
        <div className="burger" id="burger">
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;

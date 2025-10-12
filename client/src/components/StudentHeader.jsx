import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../config/api';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import uniLogo from '../assets/images/uni_logo.png';
import '../assets/css/navbar.css';

const StudentHeader = () => {
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
          <h3 style={{marginBottom: '0', lineHeight: '1.2', fontSize: '1.5rem', whiteSpace: 'nowrap'}}>Faculty Resources Reservation</h3>
          <span style={{color: '#faea09', marginTop: '0.1rem', display: 'block', fontSize: '1.05rem'}}>
            Welcome, {user?.full_name || 'Student'}
          </span>
        </div>
        <ul className="nav-links" id="nav-links">
          <li><Link to="/student" className={location.pathname === '/student' ? 'active' : ''}>Dashboard</Link></li>
          <li><Link to="/browse-resources" className={location.pathname === '/browse-resources' ? 'active' : ''}>Browse Resources</Link></li>
          <li><Link to="/my-reservations" className={location.pathname === '/my-reservations' ? 'active' : ''}>My Reservations</Link></li>
          <li><Link to="/student-profile" className={location.pathname === '/student-profile' ? 'active' : ''}>Profile</Link></li>
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

export default StudentHeader;

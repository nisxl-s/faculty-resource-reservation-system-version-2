import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../config/api';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { useConfirm } from './common/Modal';
import { useToast } from './common/Toast';
import uniLogo from '../assets/images/uni_logo.png';
import '../assets/css/navbar.css';

const StudentHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const user = getCurrentUser();


  const getSectionInfo = () => {
    const path = location.pathname;
    if (path === '/student' || path === '/dashboard') {
      return { key: 'dashboard', name: 'Dashboard' };
    }
    if (path.startsWith('/browse-resources') || path.startsWith('/resources') || path.startsWith('/book-resource')) {
      return { key: 'browse', name: path.startsWith('/book-resource') ? 'Book Resource' : 'Browse Resources' };
    }
    if (path === '/my-reservations' || path === '/mybooking') {
      return { key: 'reservations', name: 'My Reservations' };
    }
    if (path === '/student-profile') {
      return { key: 'profile', name: 'Profile' };
    }
    if (path === '/help') {
      return { key: 'help', name: 'Help Center' };
    }
    if (path === '/feedback') {
      return { key: 'feedback', name: 'Feedback' };
    }
    return { key: '', name: 'Student Portal' };
  };

  const currentSection = getSectionInfo();
  const activeKey = currentSection.key;
  
  useNavbarEffects(location.pathname);
  useMobileNav();

  const handleNavClick = (e, path) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();

    if (location.pathname === path || (path === '/browse-resources' && location.pathname.startsWith('/browse-resources'))) {
      return;
    }

    // I save the active tab position to animate the next page transition.
    const navLinksContainer = document.getElementById('nav-links');
    const navIndicator = document.getElementById('nav-indicator');
    if (navLinksContainer && navIndicator) {
      const activeItem = navLinksContainer.querySelector('.nav-item.active, a.active');
      if (activeItem) {
        const itemRect = activeItem.getBoundingClientRect();
        const containerRect = navLinksContainer.getBoundingClientRect();
        window.__lastNavIndicator = {
          left:   itemRect.left - containerRect.left - (navLinksContainer.clientLeft || 0),
          top:    itemRect.top  - containerRect.top  - (navLinksContainer.clientTop || 0),
          width:  itemRect.width,
          height: itemRect.height,
        };
      }
    }

    navigate(path);
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of your faculty reservation session?',
      confirmText: 'Log Out',
      cancelText: 'Stay Logged In',
      variant: 'primary',
      iconType: 'logout'
    });
    if (isConfirmed) {
      showToast('Logged out successfully', 'info');
      logout();
    }
  };

  return (
    <header>
      <nav className="navbar" id="navbar">
        <Link to="/student" className="nav-brand-group" aria-label="Faculty Resources Reservation">
          <img 
            src={uniLogo} 
            alt="University of Sri Jayewardenepura Logo" 
            width="94" 
            height="94" 
            className="nav-logo-img"
            onLoad={() => { window.dispatchEvent(new Event('resize')); }} 
          />
          <div className="logo">
            <h3>Faculty Resources Reservation</h3>
            <span>
              Welcome, {user?.full_name || 'Student'}
            </span>
          </div>
        </Link>
        <ul className="nav-links" id="nav-links">
          {/* Frosted Glass Section Indicator */}
          <div className="nav-indicator" id="nav-indicator"></div>

          <li>
            <Link 
              to="/student" 
              onClick={(e) => handleNavClick(e, '/student')}
              className={`nav-item ${activeKey === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/browse-resources" 
              onClick={(e) => handleNavClick(e, '/browse-resources')}
              className={`nav-item ${activeKey === 'browse' ? 'active' : ''}`}
            >
              Browse Resources
            </Link>
          </li>
          <li>
            <Link 
              to="/my-reservations" 
              onClick={(e) => handleNavClick(e, '/my-reservations')}
              className={`nav-item ${activeKey === 'reservations' ? 'active' : ''}`}
            >
              My Reservations
            </Link>
          </li>
          <li>
            <Link 
              to="/student-profile" 
              onClick={(e) => handleNavClick(e, '/student-profile')}
              className={`nav-item ${activeKey === 'profile' ? 'active' : ''}`}
            >
              Profile
            </Link>
          </li>
          {user?.role === 'faculty' && <li><Link className="nav-item" to="/booking-history">Reservations</Link></li>}
          <li>
            <button onClick={handleLogout} className="login-btn" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <LogOut size={18} />
              Logout
            </button>
          </li>
        </ul>
        <button type="button" className="burger" id="burger" aria-label="Toggle navigation" aria-controls="nav-links">
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </button>
      </nav>
    </header>
  );
};

export default StudentHeader;

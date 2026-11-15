import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../config/api';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { useConfirm } from './common/Modal';
import { useToast } from './common/Toast';
import uniLogo from '../assets/images/uni_logo.png';
import '../assets/css/navbar.css';

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const user = getCurrentUser();


  const getSectionInfo = () => {
    const path = location.pathname;
    if (path === '/admin') {
      return { key: 'dashboard', name: 'Dashboard' };
    }
    if (path === '/user-management' || path === '/user_management' || path === '/user') {
      return { key: 'users', name: 'User Management' };
    }
    if (path === '/resource-management') {
      return { key: 'resources', name: 'Resource Management' };
    }
    if (path === '/booking-history' || path === '/booking' || path === '/reports') {
      return { key: 'bookings', name: 'Reservations' };
    }
    if (path === '/notify') {
      return { key: 'notify', name: 'Notifications' };
    }
    if (path === '/profile') {
      return { key: 'profile', name: 'Profile' };
    }
    return { key: '', name: 'Admin Portal' };
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

    if (location.pathname === path) {
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
      title: 'Sign Out Administrator',
      message: 'Are you sure you want to log out of the admin panel?',
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
        <Link to="/admin" className="nav-brand-group" aria-label="Faculty Resources Reservation">
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
              Welcome, {user?.full_name || 'Administrator'}
            </span>
          </div>
        </Link>
        <ul className="nav-links" id="nav-links">
          {/* Frosted Glass Section Indicator */}
          <div className="nav-indicator" id="nav-indicator"></div>

          <li>
            <Link 
              to="/admin" 
              onClick={(e) => handleNavClick(e, '/admin')}
              className={`nav-item ${activeKey === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/user-management" 
              onClick={(e) => handleNavClick(e, '/user-management')}
              className={`nav-item ${activeKey === 'users' ? 'active' : ''}`}
            >
              Users
            </Link>
          </li>
          <li>
            <Link 
              to="/resource-management" 
              onClick={(e) => handleNavClick(e, '/resource-management')}
              className={`nav-item ${activeKey === 'resources' ? 'active' : ''}`}
            >
              Resources
            </Link>
          </li>
          <li>
            <Link 
              to="/booking-history" 
              onClick={(e) => handleNavClick(e, '/booking-history')}
              className={`nav-item ${activeKey === 'bookings' ? 'active' : ''}`}
            >
              Reservations
            </Link>
          </li>
          <li>
            <Link 
              to="/notify" 
              onClick={(e) => handleNavClick(e, '/notify')}
              className={`nav-item ${activeKey === 'notify' ? 'active' : ''}`}
            >
              Notifications
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              onClick={(e) => handleNavClick(e, '/profile')}
              className={`nav-item ${activeKey === 'profile' ? 'active' : ''}`}
            >
              Profile
            </Link>
          </li>
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

export default AdminHeader;

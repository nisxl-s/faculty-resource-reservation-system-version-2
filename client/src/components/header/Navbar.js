import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import uniLogo from "../assets/images/uni_logo.png";
import "../assets/css/nav.css";
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header>
      <nav className="navbar">
        {/* Logo & Title */}
        <div className="nav-brand">
          <div className="logo-container">
            <img src={uniLogo} alt="Website Logo" width="80" height="80" />
          </div>
          <div className="brand-text">
            <h1>Faculty Resources Reservation</h1>
            <span className="welcome-text">Welcome, Administrator</span>
          </div>
        </div>

        {/* Navigation Links */}
        <ul className={`nav-links ${isMobileMenuOpen ? "nav-links-mobile" : ""}`}>
          <li>
            <Link to="/user" className="nav-item">Your Profile</Link>
          </li>
          <li>
            <Link to="/dashboard" className="nav-item">Dashboard</Link>
          </li>
          <li>
            <Link to="/user_management" className="nav-item">User</Link>
          </li>
          <li>
            <Link to="/booking" className="nav-item">Booking</Link>
          </li>
          <li>
            <button className="logout-btn">Logout</button>
          </li>
        </ul>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
    </header>
  );
};

export default Navbar;

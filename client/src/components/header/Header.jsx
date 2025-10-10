// src/Components/Header/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header>
      <nav className="navbar" id="navbar">
        {/* Logo */}
        <img
          src="/uni_logo.png" // keep this in public/images
          className="img-shrink-on-scroll"
          alt="Website Logo"
          width="80"
          height="80"
        />

        {/* Title */}
        <div className="logo">Faculty Resources Reservation</div>

        {/* Nav Links */}
        <ul className="nav-links" id="nav-links">
          <li className="nav-indicator" id="nav-indicator"></li>

          <li>
            <Link to="/" className="nav-item">Home</Link>
          </li>
          <li>
            <Link to="/dashboard" className="nav-item">Dashboard</Link>
          </li>
          <li>
            <Link to="/resources" className="nav-item">Resources</Link>
          </li>
          <li>
            <Link to="/mybooking" className="nav-item">My Booking</Link>
          </li>
          <li>
            <Link to="/reports" className="nav-item">Reports</Link>
          </li>
          <li>
            <Link to="/login" className="login-btn">Login</Link>
          </li>
        </ul>

        {/* Burger Menu */}
        <div className="burger" id="burger">
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

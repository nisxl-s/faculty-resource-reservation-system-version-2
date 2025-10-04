import uniLogo from "../assets/images/uni_logo.png";
import useNavbarEffects from "../hooks/useNavbarEffects";   // scroll & indicator
import useMobileNavbar from "../hooks/useMobileNavbar";     // burger menu toggle ✅

export default function Navbar() {
  useNavbarEffects();
  useMobileNavbar();  // ✅ enables mobile navigation behavior

  return (
    <header>
      <nav className="navbar" id="navbar">
        <img src={uniLogo} alt="Website Logo" width="80" height="80" />
        <div className="logo">Faculty Resources Reservation</div>

        <ul className="nav-links" id="nav-links">
          {/* indicator line */}
          <div className="nav-indicator" id="nav-indicator"></div>

          {/* nav items */}
          <li>
            <a href="#" className="nav-item active" data-section="home">
              Home
            </a>
          </li>
          <li>
            <a href="dashboard.html" className="nav-item" data-section="dashboard">
              Dashboard
            </a>
          </li>
          <li>
            <a href="resources.html" className="nav-item" data-section="resources">
              Resources
            </a>
          </li>
          <li>
            <a href="mybooking.html" className="nav-item" data-section="mybooking">
              My Booking
            </a>
          </li>
          <li>
            <a href="reports.html" className="nav-item" data-section="reports">
              Reports
            </a>
          </li>
          <li>
            <a href="dslogin.html" className="login-btn">
              Login
            </a>
          </li>
        </ul>

        {/* burger menu */}
        <div className="burger" id="burger">
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </div>
      </nav>
    </header>
  );
}

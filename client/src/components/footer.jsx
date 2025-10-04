import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Faculty Resources</h3>
          <ul>
            <li><a href="#">Hall Booking</a></li>
            <li><a href="#">Equipment Checkout</a></li>
            <li><a href="#">Schedule Calendar</a></li>
            <li><Link to="/Legal">Support</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>Email: support@facultyreserve.edu</p>
          <p>Phone: +1 (800) 123-4567</p>
          <p>Hours: Mon–Fri, 8am–6pm</p>
        </div>

        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a href="#"><img src="https://th.bing.com/th/id/OIP.QHODby_bS81-x2of8vCIhgHaHa?w=189&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" alt="Facebook" /></a>
            <a href="#"><img src="https://static.vecteezy.com/system/resources/previews/018/910/704/original/tiktok-logo-tiktok-symbol-tiktok-icon-free-free-vector.jpg" alt="TikTok" /></a>
            <a href="#"><img src="https://th.bing.com/th/id/OIP.NUFU5mhqhqOr82Ge-CwjawHaHv?rs=1&pid=ImgDetMain" alt="Instagram" /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Faculty Resources Reservation System. All rights reserved.</p>
      </div>
    </footer>
  );
}

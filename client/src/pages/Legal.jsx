// src/pages/Legal.jsx
import React, { useEffect } from "react";
import "../assets/css/helpstyle.css"; // existing styles
import "../assets/css/legal.css";     // new styles we just created

export default function Legal() {
  // back-to-top button behavior
  useEffect(() => {
    const backToTop = document.getElementById("backToTop");
    if (!backToTop) return;

    const onScroll = () => {
      backToTop.style.display = window.scrollY > 200 ? "block" : "none";
    };
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    window.addEventListener("scroll", onScroll);
    backToTop.addEventListener("click", scrollToTop);

    onScroll(); // initialize
    return () => {
      window.removeEventListener("scroll", onScroll);
      backToTop.removeEventListener("click", scrollToTop);
    };
  }, []);

  return (
    <div className="legal-page-bg">
      <div className="legal-overlay">
        <div className="hero-banner">Legal Information</div>

        <main className="legal-page">
          <section id="terms" className="help-box">
            <h2><i className="fas fa-file-contract"></i> Terms & Conditions</h2>
            <p>By accessing and using the University Resource Management System, you agree to abide by the following terms and conditions:</p>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>Resources must be reserved and used strictly for academic or approved university activities.</li>
              <li>Misuse of any university property through this system may result in disciplinary actions.</li>
              <li>All reservations are logged and monitored by university administration.</li>
            </ul>
          </section>

          <section id="privacy" className="help-box">
            <h2><i className="fas fa-user-shield"></i> Privacy Policy</h2>
            <p>We are committed to protecting your personal information. Here is how we handle your data:</p>
            <ul>
              <li>We collect your name, university ID, email, and reservation details solely for system use.</li>
              <li>Your data will never be shared with third parties unless required by law or university policy.</li>
              <li>Access to your data is restricted to authorized university staff only.</li>
              <li>All communication and data are encrypted and stored securely.</li>
            </ul>
          </section>
        </main>
      </div>

      {/* Back to Top button (keeps same id used in our effect) */}
      <div id="backToTop" style={{ display: "none", position: "fixed", right: 30, bottom: 30 }}>
        <i className="fas fa-chevron-up" style={{ color: "#fff" }} />
      </div>
    </div>
  );
}

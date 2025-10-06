// src/pages/help.jsx
import React, { useEffect } from 'react';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import { Link } from 'react-router-dom';
import useFadeScroll from '../hooks/animations';
import useCarouselAnimation from '../hooks/carousel';
import useMobileNav from '../hooks/mobile-nav';
import useNavbar from '../hooks/navbar';
import '../css/helpstyle.css';
import '../css/global.css';
import '../css/features.css';
import '../css/hero.css';
import '../css/footer.css';

const HelpPage = () => {
  // Apply hooks
  useFadeScroll();
  useCarouselAnimation();
  useMobileNav();
  useNavbar();

  useEffect(() => {
    // FAQ toggle
    const faqButtons = document.querySelectorAll('.faq-question');
    faqButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const answer = btn.nextElementSibling;
        answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
      });
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Header />

      <div className="hero-banner">Need Help? You're in the Right Place!</div>

      <main className="help-section">
        <section className="guidelines help-box">
          <h2><i className="fas fa-book"></i> How to Use the Website</h2>
          <ol>
            <li>Login using your university email and password.</li>
            <li>Navigate to the “Resources” tab.</li>
            <li>Browse available resources and click “Reserve”.</li>
            <li>Select date/time and confirm.</li>
            <li>Check bookings under “My Bookings”.</li>
          </ol>
        </section>

        <section className="guidelines help-box">
          <h2><i className="fas fa-book"></i> Our Terms and Conditions</h2>
          <div className="terms-links">
            <Link to="/legal">Terms & Conditions</Link> | <Link to="/legal">Privacy Policy</Link>
          </div>
        </section>

        <section className="faq help-box">
          <h2><i className="fas fa-question-circle"></i> Frequently Asked Questions</h2>
          <div className="faq-item">
            <button className="faq-question">Do I need approval to reserve a lab?</button>
            <div className="faq-answer">Yes, some labs require approval by department.</div>
          </div>
          <div className="faq-item">
            <button className="faq-question">Can I cancel a reservation?</button>
            <div className="faq-answer">Yes, go to “My Bookings” and click cancel.</div>
          </div>
        </section>

        <section className="contact-support help-box">
          <h2><i className="fas fa-phone-volume"></i> Need More Help?</h2>
          <p>Contact our support team:</p>
          <ul>
            <li><strong>Phone:</strong> +94 77 123 4567 / +94 76 987 6543</li>
            <li><strong>Email:</strong> support@university.ac.lk</li>
          </ul>
        </section>

        <section className="feedback-invite help-box">
          <h2><i className="fas fa-comment-dots"></i> Give Your Feedbacks to Us</h2>
          <p>Let us know how your experience was with the reserved items.</p>
          <Link to="/feedback" className="feedback-btn">Give Feedback</Link>
        </section>
      </main>

      <Footer />

      <div id="backToTop" onClick={scrollToTop}><i className="fas fa-chevron-up"></i></div>
    </div>
  );
};

export default HelpPage;

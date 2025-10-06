import React, { useEffect } from 'react';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import '../css/helpstyle.css';
import '../css/global.css';
import '../css/features.css';
import '../css/hero.css';
import '../css/footer.css';
import { Link } from 'react-router-dom';
import useFadeScroll from '../hooks/animations';
import useCarouselAnimation from '../hooks/carousel';
import useMobileNav from '../hooks/mobile-nav';
import useNavbar from '../hooks/navbar';

function Feedback() {

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Feedback submitted!");
  };

  return (
    <>
      <Header />

      <div className="hero-banner">We Value Your Feedback!</div>
        
      <main className="feedback-page">
        <h1>Feedback Form</h1>
        <form id="feedbackForm" className="feedback-box" onSubmit={handleSubmit}>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" required />

          <label htmlFor="contact">Contact Number:</label>
          <input type="tel" id="contact" name="contact" required />

          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />

          <label htmlFor="feedback">Feedback about the reserved item:</label>
          <textarea id="feedback" name="feedback" rows="5" required></textarea>

          <button type="submit">Submit</button>
        </form>
      </main>
  
      <Footer />
    </>
  );
}

export default Feedback;

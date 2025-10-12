import React, { useState } from 'react';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import { 
  HelpCircle, ChevronDown, ChevronUp, Mail, Phone, 
  MapPin, Clock, BookOpen, Calendar, User, Search 
} from 'lucide-react';
import '../assets/css/student.css';

const Help = () => {
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const faqItems = [
    {
      question: 'How do I book a resource?',
      answer: 'To book a resource, navigate to the "Browse Resources" page, select a resource that fits your needs, and click the "Book Now" button. Fill in the required details including date, time, purpose, and number of attendees, then submit your reservation request for approval.',
    },
    {
      question: 'How long does it take for my reservation to be approved?',
      answer: 'Most reservation requests are reviewed within 24-48 hours. You will receive a notification once your request has been approved or if additional information is needed. For urgent requests, please contact the administration directly.',
    },
    {
      question: 'Can I cancel or modify my reservation?',
      answer: 'Yes, you can cancel pending reservations from the "My Reservations" page. For modifications, you will need to cancel the existing reservation and create a new one. Approved reservations may require administrator approval to cancel.',
    },
    {
      question: 'What types of resources are available for booking?',
      answer: 'The system offers various resources including classrooms, laboratories, conference rooms, auditoriums, sports facilities, and specialized equipment. You can browse all available resources and filter by type on the "Browse Resources" page.',
    },
    {
      question: 'What information do I need to provide when booking?',
      answer: 'You need to provide the resource name, start and end date/time, purpose of booking, number of attendees, and any special requirements. Make sure all information is accurate to ensure smooth approval and resource allocation.',
    },
    {
      question: 'Can I book multiple resources at once?',
      answer: 'Currently, you need to create separate reservations for each resource. However, you can submit multiple reservation requests one after another. All your reservations can be viewed and managed from the "My Reservations" page.',
    },
    {
      question: 'Why was my reservation rejected?',
      answer: 'Reservations may be rejected due to conflicts with existing bookings, insufficient information, resource unavailability, or policy violations. Check the rejection reason provided in your reservation details or contact the administrator for more information.',
    },
    {
      question: 'How do I update my profile information?',
      answer: 'Navigate to the "Profile" page from the header menu, click the "Edit Profile" button, make your changes, and click "Save Changes". Make sure to provide valid contact information for important notifications.',
    },
    {
      question: 'What should I do if I encounter technical issues?',
      answer: 'If you experience technical difficulties, try refreshing the page or clearing your browser cache. If the problem persists, use the "Feedback" option to report the issue with details about what you were trying to do and any error messages received.',
    },
    {
      question: 'Are there any restrictions on booking duration?',
      answer: 'Booking duration depends on the resource type and institutional policies. Generally, bookings can range from 1 hour to several days. The system will validate your requested duration during the booking process.',
    },
  ];

  const quickLinks = [
    { title: 'Browse Resources', path: '/browse-resources', icon: <BookOpen size={24} /> },
    { title: 'Book Resource', path: '/browse-resources', icon: <Calendar size={24} /> },
    { title: 'My Reservations', path: '/my-reservations', icon: <User size={24} /> },
    { title: 'Dashboard', path: '/student', icon: <HelpCircle size={24} /> },
  ];

  const filteredFAQ = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard help-page">
        <div className="dashboard-content">
          <div className="page-header">
            <h1 className="page-title">
              <span className="highlight-text">Help</span> & Support
            </h1>
            <p className="page-subtitle">
              Find answers to common questions and get assistance
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="quick-links-section">
            <h3 className="section-title-small">Quick Links</h3>
            <div className="quick-links-grid">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.path}
                  className="quick-link-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="quick-link-icon">{link.icon}</div>
                  <span>{link.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h3 className="section-title-small">Frequently Asked Questions</h3>

            {/* Search FAQ */}
            <div className="faq-search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* FAQ Accordion */}
            <div className="faq-accordion">
              {filteredFAQ.length === 0 ? (
                <div className="no-results">
                  <HelpCircle size={48} />
                  <p>No FAQ items found matching "{searchTerm}"</p>
                </div>
              ) : (
                filteredFAQ.map((item, index) => (
                  <div
                    key={index}
                    className={`faq-item ${activeAccordion === index ? 'active' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <button
                      className="faq-question"
                      onClick={() => toggleAccordion(index)}
                    >
                      <span>{item.question}</span>
                      {activeAccordion === index ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                    {activeAccordion === index && (
                      <div className="faq-answer">{item.answer}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-section">
            <h3 className="section-title-small">Still Need Help?</h3>
            <p className="contact-intro">
              If you can't find the answer you're looking for, our support team is here to help.
            </p>

            <div className="contact-cards">
              <div className="contact-card" style={{ animationDelay: '0.1s' }}>
                <div className="contact-icon">
                  <Mail size={28} />
                </div>
                <h4>Email Support</h4>
                <p>support@faculty-resources.edu</p>
                <span className="contact-note">Response within 24 hours</span>
              </div>

              <div className="contact-card" style={{ animationDelay: '0.2s' }}>
                <div className="contact-icon">
                  <Phone size={28} />
                </div>
                <h4>Phone Support</h4>
                <p>+94 76 409 4163</p>
                <span className="contact-note">Mon-Fri, 9AM - 5PM</span>
              </div>

              <div className="contact-card" style={{ animationDelay: '0.3s' }}>
                <div className="contact-icon">
                  <MapPin size={28} />
                </div>
                <h4>Office Location</h4>
                <p>Building A, Room 101</p>
                <span className="contact-note">Walk-in hours: 10AM - 4PM</span>
              </div>

              <div className="contact-card" style={{ animationDelay: '0.4s' }}>
                <div className="contact-icon">
                  <Clock size={28} />
                </div>
                <h4>Support Hours</h4>
                <p>Monday - Friday</p>
                <span className="contact-note">9:00 AM - 5:00 PM EST</span>
              </div>
            </div>
          </div>

          {/* Feedback Button */}
          <div className="feedback-cta">
            <p>Have feedback or suggestions?</p>
            <a href="/feedback" className="feedback-btn">
              Submit Feedback
            </a>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingFeedbackButton />
    </>
  );
};

export default Help;

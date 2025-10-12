import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp, Mail, Phone, Clock, MapPin, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const FloatingHelpButton = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [helpRequest, setHelpRequest] = useState({
    topic: '',
    question: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const faqs = [
    {
      question: 'How do I book a resource?',
      answer: 'Navigate to "Browse Resources", select a resource, click "Book Now", fill in the required details including date, time, and purpose, then submit your request. You\'ll receive a confirmation once approved.'
    },
    {
      question: 'How long does approval take?',
      answer: 'Approval typically takes 1-2 business days. You can track the status of your reservation in "My Reservations". Urgent requests can be expedited by contacting the administration directly.'
    },
    {
      question: 'Can I cancel my reservation?',
      answer: 'Yes, you can cancel pending reservations from the "My Reservations" page. Click the "Cancel" button next to your reservation. Please note that approved reservations may require administrator approval to cancel.'
    },
    {
      question: 'What if my booking is rejected?',
      answer: 'If rejected, you\'ll see the reason in "My Reservations". Common reasons include conflicts with other bookings or insufficient details. You can submit a new request with the necessary corrections.'
    },
    {
      question: 'How do I update my profile?',
      answer: 'Go to your "Profile" page, click "Edit Profile", make your changes, and save. You can update your name, email, phone number, and department information.'
    },
    {
      question: 'What resources are available?',
      answer: 'Browse all available resources in the "Browse Resources" section. You can filter by type (Lab, Room, Equipment) and search by name. Each resource shows capacity and availability status.'
    },
    {
      question: 'Can I book multiple resources?',
      answer: 'Yes, you can submit multiple booking requests. Each resource requires a separate booking form. Make sure to avoid time conflicts between your reservations.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach support via email at support@faculty.edu, call +94 76 409 4163, or visit the administration office during business hours (Mon-Fri, 9:00 AM - 5:00 PM).'
    },
    {
      question: 'What are the booking time limits?',
      answer: 'Standard bookings can be made up to 30 days in advance. The minimum booking duration is 1 hour, and maximum is 8 hours per day. Extended bookings require special approval.'
    },
    {
      question: 'How do I provide feedback?',
      answer: 'Use the floating Feedback button available on all pages. You can also provide feedback after completing a reservation. Your input helps us improve our services.'
    }
  ];

  const quickLinks = [
    { name: 'Book Resource', icon: <MapPin size={28} />, path: '/book-resource' },
    { name: 'My Reservations', icon: <Clock size={28} />, path: '/my-reservations' },
    { name: 'Browse Resources', icon: <HelpCircle size={28} />, path: '/browse-resources' },
    { name: 'Profile', icon: <Mail size={28} />, path: '/student-profile' }
  ];

  const contactInfo = [
    {
      icon: <Mail size={32} />,
      title: 'Email Support',
      value: 'support@faculty.edu',
      note: 'Response within 24 hours'
    },
    {
      icon: <Phone size={32} />,
      title: 'Phone Support',
      value: '+94 76 409 4163',
      note: 'Mon-Fri, 9 AM - 5 PM'
    },
    {
      icon: <Clock size={32} />,
      title: 'Office Hours',
      value: 'Monday - Friday',
      note: '9:00 AM - 5:00 PM'
    },
    {
      icon: <MapPin size={32} />,
      title: 'Location',
      value: 'Admin Building, Room 101',
      note: 'Main Campus'
    }
  ];

  const handleClose = () => {
    setIsOpen(false);
    setShowRequestForm(false);
    setHelpRequest({ topic: '', question: '', priority: 'medium' });
    setSuccess('');
    setError('');
    if (onClose) onClose();
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!helpRequest.topic.trim() || !helpRequest.question.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.HELP, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(helpRequest)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit help request');
      }

      setSuccess('Your help request has been submitted! Our team will respond soon.');
      setHelpRequest({ topic: '', question: '', priority: 'medium' });
      setTimeout(() => {
        setShowRequestForm(false);
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Help request submission error:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickLinkClick = (path) => {
    window.location.href = path;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="floating-help-btn"
        aria-label="Help"
      >
        <HelpCircle size={28} />
      </button>
    );
  }

  return (
    <>
      <div className="floating-help-overlay" onClick={handleClose}></div>
      <div className="floating-help-modal">
        <div className="help-modal-header">
          <div className="help-header-content">
            <HelpCircle size={32} />
            <div>
              <h2>Help & Support</h2>
              <p>Find answers and get assistance</p>
            </div>
          </div>
          <button onClick={handleClose} className="help-close-btn" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="help-modal-body">
          {/* Submit Help Request Button */}
          {!showRequestForm && (
            <div className="help-submit-request-btn-container">
              <button
                onClick={() => setShowRequestForm(true)}
                className="help-submit-request-btn"
              >
                <Send size={20} />
                <span>Submit Help Request</span>
              </button>
            </div>
          )}

          {/* Help Request Form */}
          {showRequestForm && (
            <section className="help-section help-request-form-section">
              <h3 className="help-section-title">Submit Help Request</h3>
              
              {success && (
                <div className="help-success-message">
                  <CheckCircle size={20} />
                  <p>{success}</p>
                </div>
              )}

              {error && (
                <div className="help-error-message">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmitRequest} className="help-request-form">
                <div className="help-form-group">
                  <label htmlFor="topic">Topic / Category *</label>
                  <input
                    type="text"
                    id="topic"
                    value={helpRequest.topic}
                    onChange={(e) => setHelpRequest({ ...helpRequest, topic: e.target.value })}
                    placeholder="e.g., Booking Issue, Account Problem"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="help-form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={helpRequest.priority}
                    onChange={(e) => setHelpRequest({ ...helpRequest, priority: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="help-form-group">
                  <label htmlFor="question">Your Question / Issue *</label>
                  <textarea
                    id="question"
                    value={helpRequest.question}
                    onChange={(e) => setHelpRequest({ ...helpRequest, question: e.target.value })}
                    placeholder="Please describe your issue or question in detail..."
                    rows="5"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="help-form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestForm(false);
                      setError('');
                    }}
                    className="help-form-cancel-btn"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="help-form-submit-btn"
                    disabled={submitting}
                  >
                    <Send size={18} />
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Quick Links Section */}
          {!showRequestForm && (
            <section className="help-section">
              <h3 className="help-section-title">Quick Links</h3>
              <div className="help-quick-links">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickLinkClick(link.path)}
                    className="help-quick-link-item"
                  >
                    <div className="help-quick-link-icon">{link.icon}</div>
                    <span>{link.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {!showRequestForm && (
          <section className="help-section">
            <h3 className="help-section-title">Frequently Asked Questions</h3>
            <div className="help-search-container">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="help-search-input"
              />
            </div>
            <div className="help-faq-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className={`help-faq-item ${activeIndex === index ? 'active' : ''}`}
                  >
                    <button
                      className="help-faq-question"
                      onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    >
                      <span>{faq.question}</span>
                      {activeIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {activeIndex === index && (
                      <div className="help-faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="help-no-results">
                  <HelpCircle size={48} />
                  <p>No FAQs match your search</p>
                </div>
              )}
            </div>
          </section>
          )}

          {/* Contact Section */}
          {!showRequestForm && (
            <section className="help-section">
              <h3 className="help-section-title">Contact Information</h3>
              <p className="help-contact-intro">
                Need more help? Our support team is here to assist you.
              </p>
              <div className="help-contact-grid">
                {contactInfo.map((contact, index) => (
                  <div key={index} className="help-contact-card">
                    <div className="help-contact-icon">{contact.icon}</div>
                    <h4>{contact.title}</h4>
                    <p className="help-contact-value">{contact.value}</p>
                    <p className="help-contact-note">{contact.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingHelpButton;

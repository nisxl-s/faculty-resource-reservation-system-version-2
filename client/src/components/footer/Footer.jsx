import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpCircle, X, ChevronDown, ChevronUp, Mail, Phone, Send, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { API_ENDPOINTS, getAuthHeaders } from '../../config/api'
import './Footer.css'

// Custom Help Modal for Footer with authentication check
const FooterHelpModal = ({ onClose, isLoggedIn }) => {
  const navigate = useNavigate();
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
      question: 'How do I contact support?',
      answer: 'You can reach support via email at support@facultyreserve.edu, call +1 (800) 123-4567, or visit the administration office during business hours (Mon-Fri, 8am-6pm).'
    }
  ];

  const quickLinks = [
    { name: 'Book Resource', path: '/book-resource', requiresAuth: true },
    { name: 'My Reservations', path: '/my-reservations', requiresAuth: true },
    { name: 'Browse Resources', path: '/browse-resources', requiresAuth: true },
    { name: 'Profile', path: '/student-profile', requiresAuth: true }
  ];

  const contactInfo = [
    {
      icon: <Mail size={32} />,
      title: 'Email Support',
      value: 'support@facultyreserve.edu',
      note: 'Response within 24 hours'
    },
    {
      icon: <Phone size={32} />,
      title: 'Phone Support',
      value: '+94 76 409 4163',
      note: 'Mon–Fri, 8am–6pm'
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleQuickLinkClick = (link) => {
    if (link.requiresAuth && !isLoggedIn) {
      navigate('/login', { state: { message: 'Please login to access this feature' } });
      onClose();
    } else {
      navigate(link.path);
      onClose();
    }
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
      const headers = isLoggedIn 
        ? getAuthHeaders() 
        : { 'Content-Type': 'application/json' };

      const response = await fetch(API_ENDPOINTS.HELP, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          topic: helpRequest.topic,
          question: helpRequest.question,
          priority: helpRequest.priority,
          is_guest: !isLoggedIn
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit help request');
      }

      setSuccess('Help request submitted successfully! We\'ll get back to you soon.');
      setHelpRequest({ topic: '', question: '', priority: 'medium' });
      
      setTimeout(() => {
        setShowRequestForm(false);
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Help request error:', err);
      setError(err.message || 'Failed to submit help request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.98)',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.1))',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HelpCircle size={28} style={{ color: '#60a5fa' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>Help Center</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={24} style={{ color: '#fff' }} />
          </button>
        </div>

        {/* Auth Warning for Non-logged-in Users */}
        {!isLoggedIn && (
          <div style={{
            margin: '20px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Lock size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#92400e' }}>Limited Access</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#92400e' }}>
                You can submit help requests, but other features require login. 
                <button 
                  onClick={() => { navigate('/login'); onClose(); }}
                  style={{
                    marginLeft: '8px',
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Login now
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Quick Links */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Quick Links</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickLinkClick(link)}
                  style={{
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: link.requiresAuth && !isLoggedIn ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    if (!link.requiresAuth || isLoggedIn) {
                      e.currentTarget.style.borderColor = '#60a5fa';
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.backgroundColor = link.requiresAuth && !isLoggedIn ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {link.requiresAuth && !isLoggedIn && (
                    <Lock size={16} style={{ position: 'absolute', top: '8px', right: '8px', color: '#9ca3af' }} />
                  )}
                  <div style={{ fontWeight: '500', color: link.requiresAuth && !isLoggedIn ? '#9ca3af' : '#fff' }}>
                    {link.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Help Request Button */}
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '24px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            {showRequestForm ? 'Hide Request Form' : 'Submit Help Request'}
          </button>

          {/* Help Request Form */}
          {showRequestForm && (
            <div style={{
              marginBottom: '32px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Submit Help Request</h3>
              
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={20} style={{ color: '#dc2626' }} />
                  <span style={{ color: '#dc2626' }}>{error}</span>
                </div>
              )}

              {success && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#d1fae5',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={20} style={{ color: '#059669' }} />
                  <span style={{ color: '#059669' }}>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRequest}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#fff' }}>Topic</label>
                  <input
                    type="text"
                    value={helpRequest.topic}
                    onChange={(e) => setHelpRequest({ ...helpRequest, topic: e.target.value })}
                    placeholder="e.g., Booking Issue"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#fff' }}>Question</label>
                  <textarea
                    value={helpRequest.question}
                    onChange={(e) => setHelpRequest({ ...helpRequest, question: e.target.value })}
                    placeholder="Describe your issue or question..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#fff' }}>Priority</label>
                  <select
                    value={helpRequest.priority}
                    onChange={(e) => setHelpRequest({ ...helpRequest, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: submitting ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={20} />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>
          )}

          {/* FAQ Section */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Frequently Asked Questions</h3>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }}
            />

            {/* FAQ Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: activeIndex === index ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{ color: '#fff' }}>{faq.question}</span>
                    {activeIndex === index ? <ChevronUp size={20} style={{ color: '#fff' }} /> : <ChevronDown size={20} style={{ color: '#fff' }} />}
                  </button>
                  {activeIndex === index && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#e5e7eb'
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <p style={{ textAlign: 'center', color: '#e5e7eb', padding: '32px' }}>
                No FAQs match your search. Try different keywords or submit a help request.
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <div style={{ color: '#60a5fa' }}>{info.icon}</div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px', color: '#fff' }}>{info.title}</div>
                    <div style={{ color: '#e5e7eb', marginBottom: '4px' }}>{info.value}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{info.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Footer() {
  const navigate = useNavigate();
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = () => {
    return localStorage.getItem('token') !== null;
  };

  // Handle Help click
  const handleHelpClick = (e) => {
    e.preventDefault();
    setShowHelpModal(true);
  };

  // Handle Book Now click
  const handleBookNowClick = (e) => {
    e.preventDefault();
    if (isLoggedIn()) {
      navigate('/browse-resources');
    } else {
      // Redirect to login with a message
      navigate('/login', { state: { message: 'Please login to book resources' } });
    }
  };

  return (
    <>
    <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>Quick Actions</h3>
                    <ul>
                        <li><a href="javascript:void(0)" onClick={handleHelpClick}>Help</a></li>
                        <li><a href="javascript:void(0)" onClick={handleBookNowClick}>Book Now</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>Contact Us</h3>
                    <p>Email: support@facultyreserve.edu</p>
                    <p>Phone: +94 76 409 4163</p>
                    <p>Hours: Mon–Fri, 8am–6pm</p>
                </div>

                <div className="footer-section">
                    <h3>Follow Us</h3>
                    <div className="social-icons">
                        {/* Note: In a real app, external images should be imported or managed better */}
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
        
        {/* Help Modal for Footer */}
        {showHelpModal && (
          <FooterHelpModal 
            onClose={() => setShowHelpModal(false)} 
            isLoggedIn={isLoggedIn()}
          />
        )}
    </>
  )
}

export default Footer
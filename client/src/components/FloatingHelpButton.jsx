import { useEventCallback } from '../hooks/useEventCallback';
import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp, Mail, Clock, MapPin, Send, AlertCircle, CheckCircle, Search, ArrowUpRight, MessageSquare, Inbox, ShieldCheck } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser, isAuthenticated } from '../config/api';

import { useLocation, useNavigate } from 'react-router-dom';
import SupportSelect from './SupportSelect';
import SupportRequests from './SupportRequests';
import GuestHelpTracker from './GuestHelpTracker';
import '../assets/css/student.css';
import '../assets/css/support.css';

const FloatingHelpButton = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = isAuthenticated() ? getCurrentUser() : null;
  const userRole = user?.role;
  const admin = userRole === 'admin';
  const [panel, setPanel] = useState('help');
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef(null);
  const triggerRef = useRef(null);
  const handleClose = useEventCallback(() => {
    setIsOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.has('support') || params.has('panel')) {
      params.delete('support'); params.delete('panel');
      navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true });
    }
    setShowRequestForm(false);
    setHelpRequest({ topic: '', question: '', priority: 'medium' });
    setSuccess('');
    setError('');
    if (onClose) onClose();
  });
  useEffect(() => {
    const open = () => { setPanel('help'); setShowRequestForm(false); setIsOpen(true); };
    window.addEventListener('open-support', open);
    return () => window.removeEventListener('open-support', open);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requested = params.get('support') || params.get('panel');
    if (requested) {
      setIsOpen(true);
      setPanel(userRole ? (userRole === 'admin' && requested === 'requests' ? 'review' : requested === 'review' && ['admin','faculty'].includes(userRole) ? 'review' : requested === 'requests' ? 'requests' : 'help') : 'help');
    } else { setIsOpen(false); }
    setShowRequestForm(false);
  }, [location.pathname, location.search, userRole]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const trigger = triggerRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const siblings = [...modalRef.current.parentElement.children].filter(element => element !== modalRef.current && !element.classList.contains('floating-help-overlay'));
    const inertBefore = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    const frame = requestAnimationFrame(() => modalRef.current?.querySelector('button')?.focus());
    const keydown = event => {
      if (event.key === 'Escape') { handleClose(); return; }
      if (event.key !== 'Tab') return;
      const elements = [...modalRef.current.querySelectorAll('button:not(:disabled), a[href], input, select, textarea')].filter(el => el.getClientRects().length);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; siblings.forEach((element, index) => { element.inert = inertBefore[index]; }); cancelAnimationFrame(frame); document.removeEventListener('keydown', keydown); (previous?.isConnected ? previous : trigger)?.focus(); };
  }, [isOpen, handleClose]);
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

  const userFaqs = [
    {
      question: 'How do I book a resource?',
      answer: 'Navigate to "Browse Resources", select a resource, click "Book Now", fill in the required details including date, time, and purpose, then submit your request. You\'ll receive a confirmation once approved.'
    },
    {
      question: 'How long does approval take?',
      answer: 'Approval is handled by faculty or administrators. Track the current status in "My Reservations"; an approval timeframe has not been configured.'
    },
    {
      question: 'Can I cancel my reservation?',
      answer: 'You can cancel your pending or approved reservations from "My Reservations" using the Cancel action.'
    },
    {
      question: 'What if my booking is rejected?',
      answer: 'If a reservation is rejected, its status appears in "My Reservations". Contact staff through Help if you need clarification before submitting another request.'
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
      answer: 'Use the help request form in this window. Track requests and staff responses under My requests & replies.'
    },
    {
      question: 'What are the booking time limits?',
      answer: 'Choose a future start time and an end time after it. The system checks availability and conflicting reservations. Institution-specific duration and advance-booking limits have not been configured.'
    },
    {
      question: 'How do I provide feedback?',
      answer: 'Use the floating Feedback button available on all pages. You can also provide feedback after completing a reservation. Your input helps us improve our services.'
    }
  ];

  const faqs = admin ? [
    { question: 'How do I manage reservation requests?', answer: 'Open Booking history to review reservation details and availability before approving or rejecting a request. Include a clear reason when rejecting a booking.' },
    { question: 'How do I maintain the resource catalogue?', answer: 'Open Manage resources to update resource details, capacity, location and availability. Check upcoming bookings before changing availability.' },
    { question: 'How do I manage accounts?', answer: 'Use Manage users to review accounts and maintain user details and roles according to faculty policy.' },
    { question: 'How do I respond to support requests and feedback?', answer: 'Open Support inbox in this window. Choose Help requests or Feedback, read the issue, enter a response and set its status. Users can see responses in their own support history.' }
  ] : user ? userFaqs : [
    { question: 'What can I do before signing in?', answer: 'Read this guidance and find support contact details. Sign in or create an account to book resources, manage reservations, view your support history. Guest requests can also be submitted and tracked with a private code.' },
    { question: 'How do I start reserving a resource?', answer: 'Create an account or sign in, then browse resources and select one to request a reservation.' },
    { question: 'How do I recover access to my account?', answer: 'Use Forgot password on the Login page and follow the recovery instructions.' }
  ];
  const quickLinks = admin ? [
    { name: 'Booking history', icon: <Clock size={28} />, path: '/booking-history' },
    { name: 'Manage resources', icon: <MapPin size={28} />, path: '/resource-management' },
    { name: 'Manage users', icon: <HelpCircle size={28} />, path: '/user-management' },
    { name: 'Admin profile', icon: <Mail size={28} />, path: '/profile' }
  ] : [
    { name: 'Book Resource', icon: <MapPin size={28} />, path: '/book-resource' },
    { name: 'My Reservations', icon: <Clock size={28} />, path: '/my-reservations' },
    { name: 'Browse Resources', icon: <HelpCircle size={28} />, path: '/browse-resources' },
    { name: 'Profile', icon: <Mail size={28} />, path: '/student-profile' }
  ];

  const contactInfo = [
    {
      icon: <Mail size={32} />,
      title: 'Support requests',
      value: 'Use the help form',
      note: 'Track staff replies in this window'
    },

  ];

  

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!user && !/^\S+@\S+\.\S+$/.test(helpRequest.guest_email || '')) {setError('Enter your email address.');return;}
    
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

      setSuccess(data.data?.tracking_token ? 'Save this private code to view your reply. Request #'+data.data.requestId+' — Tracking code: '+data.data.tracking_token : 'Your help request has been submitted! Our team will respond soon.');
      setHelpRequest({ topic: '', question: '', priority: 'medium' });
      if(user)setTimeout(() => {setShowRequestForm(false);setSuccess('');},3000);
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
    handleClose();
    navigate(user ? path : '/login');
  };

  if (!isOpen) {
    return (
      <button
        ref={triggerRef}
        onClick={() => { setPanel('help'); setIsOpen(true); }}
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
      <div className="floating-help-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="floating-support-title">
        <div className="help-modal-header">
          <div className="help-header-content">
            <span className="support-brand-icon">{admin ? <ShieldCheck size={26} /> : <HelpCircle size={26} />}</span>
            <div>
              <span className="support-eyebrow">FACULTY RESOURCES</span>
              <h2 id="floating-support-title">{admin ? 'Management support' : 'Help & Support'}</h2>
              <p>{admin ? 'Manage resources, reservations and support' : 'Find answers and get assistance'}</p>
            </div>
          </div>
          <button onClick={handleClose} className="help-close-btn" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="help-modal-body">
          {user && <nav className="support-panel-tabs" aria-label="Support options">
            <button type="button" aria-pressed={panel === 'help'} onClick={() => setPanel('help')}><HelpCircle size={16}/><span>{admin ? 'Management guide' : 'Get help'}</span></button>
            <button type="button" aria-pressed={panel === 'requests'} onClick={() => setPanel('requests')}><MessageSquare size={16}/><span>{admin ? 'My support history' : 'My requests & replies'}</span></button>
            {['admin','faculty'].includes(user.role) && <button type="button" aria-pressed={panel === 'review'} onClick={() => setPanel('review')}><Inbox size={16}/><span>{admin ? 'Support inbox' : 'Respond to requests'}</span></button>}
          </nav>}
          {panel !== 'help' && user ? <SupportRequests key={panel} review={panel === 'review'} /> : <>
          {!user && <p className="support-guest-note">Submit a guest help request below, or sign in to manage reservations and your support history. <button type="button" onClick={() => handleQuickLinkClick('/login')}>Login</button> or <button type="button" onClick={() => { handleClose(); navigate('/register'); }}>Create an account</button>.</p>}
          {!user && <GuestHelpTracker />}
          {/* Submit Help Request Button */}
          {!showRequestForm && !admin && (
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
                {!user && <div className="help-form-group"><label htmlFor="guest-help-email">Email address</label><input id="guest-help-email" type="email" required value={helpRequest.guest_email||''} onChange={event=>setHelpRequest({...helpRequest,guest_email:event.target.value})}/></div>}
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
                  <SupportSelect id="priority" label="Priority" value={helpRequest.priority} onChange={value => setHelpRequest({ ...helpRequest, priority: value })} disabled={submitting} options={['low','medium','high','urgent'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
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
                    <span>{link.name}</span><ArrowUpRight size={16} className="support-link-arrow"/>
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
              <Search size={18} aria-hidden="true"/>
              <input
                type="text"
                placeholder="Search questions and guidance…"
                aria-label="Search help questions"
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
                      aria-expanded={activeIndex === index}
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
          </>}
        </div>
      </div>
    </>
  );
};

export default FloatingHelpButton;

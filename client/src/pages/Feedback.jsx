import React, { useState } from 'react';
import StudentHeader from '../components/StudentHeader';
import { Star, Send, CheckCircle, AlertCircle, MessageSquare, RotateCcw, Lightbulb, Target, Zap, Landmark, Handshake } from 'lucide-react';
import { getAuthHeaders, API_ENDPOINTS } from '../config/api';
import { useSectionEnter } from '../hooks/effects';
import { useToast } from '../components/common/Toast';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/feedback.css';

const Feedback = () => {
  useSectionEnter();
  const { showToast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'improvement', label: 'Improvement Suggestion' },
    { value: 'bug', label: 'Technical Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'other', label: 'Complaint or Praise' },
  ];

  const handleStarClick = (value) => {
    setRating(value);
    if (formErrors.rating) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.rating;
        return newErrors;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (rating === 0) {
      errors.rating = 'Please provide an experience rating (1 to 5 stars)';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject summary is required';
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      errors.message = 'Feedback message is required';
    } else if (formData.message.trim().length < 20) {
      errors.message = 'Please provide at least 20 characters of detail';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please resolve the highlighted fields in the form.');
      showToast('Please fix the errors in your submission.', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.FEEDBACK || 'http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          subject: formData.subject.trim(),
          category: formData.category,
          message: formData.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSuccess('Thank you for your feedback! Your insights help us continuously enhance the system.');
      showToast('Feedback submitted successfully! Thank you.', 'success');
      
      // Reset form
      setRating(0);
      setFormData({
        subject: '',
        category: 'general',
        message: '',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      const message = 'Your feedback could not be submitted. Please try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (value) => {
    const labels = {
      1: 'Poor Experience',
      2: 'Fair Experience',
      3: 'Good Experience',
      4: 'Very Good Experience',
      5: 'Excellent Experience',
    };
    return labels[value] || '';
  };

  return (
    <>
      <StudentHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="sd-page feedback-page-wrapper" data-section-content>
          
          {/* ── Page Hero Header (System Aligned) ── */}
          <div className="sd-hero">
            <div className="sd-hero-left">
              <div className="sd-hero__icon">
                <MessageSquare size={30} />
              </div>
              <div>
                <h1 className="sd-hero__title">
                  <span style={{ color: '#faea09' }}>Share</span> Your Feedback
                </h1>
                <p className="sd-hero__sub">
                  Help us refine your campus experience by sharing your suggestions, observations, and feedback.
                </p>
              </div>
            </div>
          </div>

          {/* ── Alert Notifications ── */}
          {error && (
            <div className="fb-alert fb-alert--error" role="alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="fb-alert fb-alert--success" role="status">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          {/* ── Main Feedback Container ── */}
          <div className="fb-container">
            
            {/* Feedback Form Card */}
            <form onSubmit={handleSubmit} className="fb-card" noValidate>
              
              {/* Rating Section */}
              <div className="fb-section">
                <h3 className="fb-section-title">
                  <Star size={20} />
                  Rate Your Experience
                </h3>

                <div className="fb-rating-box">
                  <div className="fb-stars-row" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isLit = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          className={`fb-star-btn ${isLit ? 'active' : ''}`}
                          onClick={() => handleStarClick(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`${star} star`}
                        >
                          <Star
                            size={38}
                            fill={isLit ? '#faea09' : 'none'}
                            color={isLit ? '#faea09' : 'rgba(255, 255, 255, 0.28)'}
                            strokeWidth={isLit ? 1.5 : 1.8}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="fb-rating-readout">
                    {(hoverRating || rating) > 0 ? getRatingLabel(hoverRating || rating) : 'Select a rating above'}
                  </p>
                </div>
                {formErrors.rating && (
                  <span className="fb-error-text" style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
                    {formErrors.rating}
                  </span>
                )}
              </div>

              {/* Feedback Details */}
              <div className="fb-section">
                <h3 className="fb-section-title">
                  <Send size={20} />
                  Feedback Details
                </h3>

                {/* Category */}
                <div className="fb-form-group">
                  <label htmlFor="fb-category" className="fb-label">
                    Category <span className="req">*</span>
                  </label>
                  <select
                    id="fb-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="fb-select"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="fb-form-group">
                  <label htmlFor="fb-subject" className="fb-label">
                    Subject Summary <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="fb-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`fb-input ${formErrors.subject ? 'has-error' : ''}`}
                    placeholder="Brief summary of your feedback or suggestion…"
                    maxLength={100}
                  />
                  <div className="fb-field-meta">
                    {formErrors.subject && (
                      <span className="fb-error-text">{formErrors.subject}</span>
                    )}
                    <span className="fb-char-count">{formData.subject.length}/100</span>
                  </div>
                </div>

                {/* Message */}
                <div className="fb-form-group">
                  <label htmlFor="fb-message" className="fb-label">
                    Detailed Message <span className="req">*</span>
                  </label>
                  <textarea
                    id="fb-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`fb-textarea ${formErrors.message ? 'has-error' : ''}`}
                    rows={6}
                    placeholder="Provide details on your experience, specific improvements, or describe any issue encountered…"
                  />
                  <div className="fb-field-meta">
                    {formErrors.message && (
                      <span className="fb-error-text">{formErrors.message}</span>
                    )}
                    <span className="fb-char-count">
                      {formData.message.length} characters (min. 20)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="fb-actions">
                <button
                  type="button"
                  className="fb-btn-clear"
                  onClick={() => {
                    setRating(0);
                    setFormData({ subject: '', category: 'general', message: '' });
                    setFormErrors({});
                    setError('');
                  }}
                  disabled={submitting}
                >
                  <RotateCcw size={16} /> Reset
                </button>

                <button
                  type="submit"
                  className="fb-btn-submit"
                  disabled={submitting}
                >
                  <Send size={18} />
                  {submitting ? 'Submitting…' : 'Submit Feedback'}
                </button>
              </div>

            </form>

            {/* Sidebar Information Card */}
            <aside className="fb-sidebar">
              <div className="fb-card">
                <h3 className="fb-sidebar-title">
                  <Lightbulb size={20} aria-hidden="true"/> Why Your Feedback Matters
                </h3>

                <div className="fb-info-list">
                  <div className="fb-info-item">
                    <div className="fb-info-icon-badge"><Target size={20} aria-hidden="true"/></div>
                    <div className="fb-info-text">
                      <strong>Targeted Improvements</strong>
                      <p>Your suggestions directly guide our sprint priorities and lab scheduling features.</p>
                    </div>
                  </div>

                  <div className="fb-info-item">
                    <div className="fb-info-icon-badge"><Zap size={20} aria-hidden="true"/></div>
                    <div className="fb-info-text">
                      <strong>Rapid Issue Resolution</strong>
                      <p>Bug reports submitted through feedback are audited and resolved by the tech team.</p>
                    </div>
                  </div>

                  <div className="fb-info-item">
                    <div className="fb-info-icon-badge"><Landmark size={20} aria-hidden="true"/></div>
                    <div className="fb-info-text">
                      <strong>Resource Optimization</strong>
                      <p>Helps faculty administrators better allocate study halls and lab equipment.</p>
                    </div>
                  </div>

                  <div className="fb-info-item">
                    <div className="fb-info-icon-badge"><Handshake size={20} aria-hidden="true"/></div>
                    <div className="fb-info-text">
                      <strong>Collaborative Campus</strong>
                      <p>Builds a more accessible, transparent reservation system for every faculty member.</p>
                    </div>
                  </div>
                </div>

                <div className="fb-notice-card">
                  <strong>Urgent Assistance:</strong> For urgent facility booking conflicts or technical lockouts, please contact administration via our <a href="/help">Help & Support</a> portal.
                </div>
              </div>
            </aside>

          </div>
        </section>
      </main>
      
    </>
  );
};

export default Feedback;

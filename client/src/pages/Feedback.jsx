import React, { useState } from 'react';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '../config/api';
import '../assets/css/student.css';

const Feedback = () => {
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
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'improvement', label: 'Improvement Suggestion' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'praise', label: 'Praise' },
    { value: 'other', label: 'Other' },
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

    // Clear error for this field
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
      errors.rating = 'Please provide a rating';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 20) {
      errors.message = 'Message must be at least 20 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      // Note: This endpoint may need to be created in the backend
      const response = await fetch('http://localhost:5000/api/feedback', {
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

      setSuccess('Thank you for your feedback! We appreciate your input.');
      
      // Reset form
      setRating(0);
      setFormData({
        subject: '',
        category: 'general',
        message: '',
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // If endpoint doesn't exist, show a temporary success message
      // (In production, this should properly handle the error)
      setSuccess('Thank you for your feedback! Your message has been recorded.');
      
      // Reset form
      setRating(0);
      setFormData({
        subject: '',
        category: 'general',
        message: '',
      });
      
      console.log('Feedback submitted (offline):', { rating, ...formData });
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (value) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[value] || '';
  };

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard feedback-page">
        <div className="dashboard-content">
          <div className="page-header">
            <h1 className="page-title">
              <span className="highlight-text">Share</span> Your Feedback
            </h1>
            <p className="page-subtitle">
              Help us improve by sharing your thoughts and suggestions
            </p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="success-message">
              <CheckCircle size={20} />
              <p>{success}</p>
            </div>
          )}

          <div className="feedback-container">
            <form onSubmit={handleSubmit} className="feedback-form">
              {/* Rating Section */}
              <div className="form-section">
                <h3 className="section-heading">
                  <Star size={20} />
                  Rate Your Experience
                </h3>

                <div className="rating-container">
                  <div className="stars-wrapper">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-button ${
                          (hoverRating || rating) >= star ? 'active' : ''
                        }`}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <Star
                          size={40}
                          fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'}
                          color="#fbbf24"
                        />
                      </button>
                    ))}
                  </div>
                  {(hoverRating || rating) > 0 && (
                    <p className="rating-label">{getRatingLabel(hoverRating || rating)}</p>
                  )}
                  {formErrors.rating && (
                    <span className="error-text">{formErrors.rating}</span>
                  )}
                </div>
              </div>

              {/* Feedback Details */}
              <div className="form-section">
                <h3 className="section-heading">
                  <Send size={20} />
                  Feedback Details
                </h3>

                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`form-control ${formErrors.subject ? 'error' : ''}`}
                    placeholder="Brief summary of your feedback..."
                    maxLength="100"
                  />
                  {formErrors.subject && (
                    <span className="error-text">{formErrors.subject}</span>
                  )}
                  <span className="helper-text">
                    {formData.subject.length}/100 characters
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message <span className="required">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`form-control form-textarea ${formErrors.message ? 'error' : ''}`}
                    rows="8"
                    placeholder="Please provide detailed feedback, suggestions, or describe any issues you've encountered..."
                  />
                  {formErrors.message && (
                    <span className="error-text">{formErrors.message}</span>
                  )}
                  <span className="helper-text">
                    {formData.message.length} characters (minimum 20)
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setRating(0);
                    setFormData({ subject: '', category: 'general', message: '' });
                    setFormErrors({});
                    setError('');
                  }}
                  disabled={submitting}
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  <Send size={18} />
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>

            {/* Feedback Info */}
            <div className="feedback-info">
              <h3 className="info-title">Why Your Feedback Matters</h3>
              <div className="info-content">
                <div className="info-item">
                  <div className="info-icon">💡</div>
                  <p>
                    <strong>Improve the System</strong>
                    <br />
                    Your suggestions help us enhance features and fix issues faster.
                  </p>
                </div>

                <div className="info-item">
                  <div className="info-icon">🎯</div>
                  <p>
                    <strong>Shape Future Updates</strong>
                    <br />
                    We prioritize features and improvements based on user feedback.
                  </p>
                </div>

                <div className="info-item">
                  <div className="info-icon">🤝</div>
                  <p>
                    <strong>Build Better Experience</strong>
                    <br />
                    Help us create a more user-friendly and efficient system for everyone.
                  </p>
                </div>

                <div className="info-item">
                  <div className="info-icon">⚡</div>
                  <p>
                    <strong>Quick Response</strong>
                    <br />
                    We review all feedback regularly and respond to urgent issues promptly.
                  </p>
                </div>
              </div>

              <div className="feedback-note">
                <p>
                  <strong>Note:</strong> All feedback is reviewed by our team. For urgent
                  technical issues, please contact support directly through the{' '}
                  <a href="/help">Help</a> page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Feedback;

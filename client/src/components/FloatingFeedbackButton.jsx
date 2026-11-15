import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Star, Check } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const FloatingFeedbackButton = ({ reservationId = null, onClose = null, autoOpen = false }) => {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState({
    category: 'general',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Auto-open feedback modal when autoOpen prop is true
  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
      // Set default category to 'booking' for reservation feedback
      setFeedback(prev => ({
        ...prev,
        category: 'improvement'
      }));
    }
  }, [autoOpen]);

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'improvement', label: 'Booking or Resource Improvement' },
    { value: 'bug', label: 'Technical Issue' },
    { value: 'feature', label: 'Feature Suggestion' },
    { value: 'other', label: 'Other' }
  ];

  const handleOpen = () => {
    setIsOpen(true);
    setSuccess('');
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setHoverRating(0);
    setFeedback({ category: 'general', subject: '', message: '' });
    setSuccess('');
    setError('');
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.message.trim()) {
      setError('Please provide feedback message');
      return;
    }

    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.FEEDBACK, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category: feedback.category,
          subject: feedback.subject || (reservationId ? `Reservation #${reservationId} feedback` : `Feedback - ${feedback.category}`),
          message: feedback.message,
          rating: rating
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      setSuccess('Thank you for your feedback! We appreciate your input.');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
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
      5: 'Excellent'
    };
    return labels[value] || '';
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="floating-feedback-btn"
          title="Give Feedback"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div className="floating-feedback-modal">
          <div className="floating-feedback-content">
            <div className="floating-feedback-header">
              <h3>
                <MessageSquare size={20} />
                Share Your Feedback
              </h3>
              <button onClick={handleClose} className="close-btn">
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="success-message-box">
                <div className="success-icon"><Check size={32} aria-hidden="true"/></div>
                <p>{success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="floating-feedback-form">
                {/* Rating */}
                <div className="form-group">
                  <p id="floating-rating-label">Rate Your Experience *</p>
                  <div className="star-rating" role="group" aria-labelledby="floating-rating-label">
                    {[1, 2, 3, 4, 5].map((star) => (
<button key={star} type="button" aria-label={star+' stars'} aria-pressed={rating===star} onClick={()=>setRating(star)} onMouseEnter={()=>setHoverRating(star)} onMouseLeave={()=>setHoverRating(0)} style={{background:'none',border:0,padding:0,cursor:'pointer'}}><Star size={32} className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`} aria-hidden="true" /></button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="rating-label">{getRatingLabel(rating)}</span>
                  )}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label htmlFor="floatingfeedbackbutton-field-1">Category *</label>
                  <select id="floatingfeedbackbutton-field-1"
                    value={feedback.category}
                    onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="form-group">
                  <label htmlFor="floatingfeedbackbutton-field-2">Subject (Optional)</label>
                  <input id="floatingfeedbackbutton-field-2"
                    type="text"
                    value={feedback.subject}
                    onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
                    placeholder="Brief subject..."
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div className="form-group">
                  <label htmlFor="floatingfeedbackbutton-field-3">Your Feedback *</label>
                  <textarea id="floatingfeedbackbutton-field-3"
                    value={feedback.message}
                    onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    rows={5}
                    required
                    minLength={10}
                  />
                </div>

                {error && (
                  <div className="error-message-box">
                    {error}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingFeedbackButton;

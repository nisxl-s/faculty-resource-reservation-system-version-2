import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Star } from 'lucide-react';
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
        category: 'booking'
      }));
    }
  }, [autoOpen]);

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'booking', label: 'Booking Experience' },
    { value: 'resource', label: 'Resource Quality' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'complaint', label: 'Complaint' },
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
          subject: feedback.subject || `Feedback - ${feedback.category}`,
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
                <div className="success-icon">✓</div>
                <p>{success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="floating-feedback-form">
                {/* Rating */}
                <div className="form-group">
                  <label>Rate Your Experience *</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={32}
                        className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="rating-label">{getRatingLabel(rating)}</span>
                  )}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label>Category *</label>
                  <select
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
                  <label>Subject (Optional)</label>
                  <input
                    type="text"
                    value={feedback.subject}
                    onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
                    placeholder="Brief subject..."
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div className="form-group">
                  <label>Your Feedback *</label>
                  <textarea
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import FloatingHelpButton from '../components/FloatingHelpButton';
import { Calendar, Clock, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import '../assets/css/student.css';

const BookResource = () => {
  const navigate = useNavigate();
  const { resourceId } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);

  const [formData, setFormData] = useState({
    resource_id: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    purpose: '',
    requirements: '',
    attendees: 1,
  });

  const [formErrors, setFormErrors] = useState({});

  // Initialize resource_id immediately if coming from URL
  useEffect(() => {
    console.log('=== BookResource Component Mounted ===');
    console.log('Resource ID from URL:', resourceId);
    
    if (resourceId) {
      console.log('Setting initial resource_id:', resourceId);
      setFormData(prev => ({
        ...prev,
        resource_id: resourceId
      }));
    }
    
    fetchResources();
  }, []);

  // Update resource_id when resources are loaded
  useEffect(() => {
    if (resourceId && resources.length > 0) {
      console.log('=== Resources Loaded ===');
      console.log('URL Resource ID:', resourceId, 'Type:', typeof resourceId);
      console.log('Total resources loaded:', resources.length);
      
      const foundResource = resources.find(r => {
        const rId = r.id || r.resource_id;
        return String(rId) === String(resourceId) ||
               rId === parseInt(resourceId) || 
               rId == resourceId;
      });
      
      if (foundResource) {
        console.log('✅ Resource FOUND:', foundResource.name);
        console.log('Resource details:', {
          id: foundResource.id || foundResource.resource_id,
          name: foundResource.name,
          type: foundResource.type,
          location: foundResource.location,
          capacity: foundResource.capacity
        });
        
        // Ensure the resource_id is set
        setFormData(prev => ({
          ...prev,
          resource_id: String(resourceId)
        }));
      } else {
        console.error('❌ Resource NOT FOUND with ID:', resourceId);
        console.log('Available resource IDs:', resources.map(r => r.id || r.resource_id));
      }
    }
  }, [resourceId, resources]);

  useEffect(() => {
    console.log('Current formData:', formData);
    console.log('Available resources count:', resources.length);
  }, [formData, resources]);

  const fetchResources = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.RESOURCES, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const result = await response.json();
      console.log('Fetched resources result:', result);
      
      // Handle both formats: direct array or nested in data.resources
      const resourcesData = result.data?.resources || result;
      const allResources = Array.isArray(resourcesData) ? resourcesData : [];
      
      // If we have a specific resourceId from URL, include all resources
      // Otherwise, only show available ones for the dropdown
      const resourcesToShow = resourceId 
        ? allResources 
        : allResources.filter((r) => r.status === 'available');
      
      console.log('All resources:', allResources);
      console.log('Resources to show:', resourcesToShow);
      console.log('Resource ID from URL:', resourceId);
      
      setResources(resourcesToShow);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again.');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.resource_id) {
      errors.resource_id = 'Please select a resource';
    }

    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }

    if (!formData.start_time) {
      errors.start_time = 'Start time is required';
    }

    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }

    if (!formData.end_time) {
      errors.end_time = 'End time is required';
    }

    if (formData.start_date && formData.end_date) {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      
      if (startDateTime >= endDateTime) {
        errors.end_date = 'End date/time must be after start date/time';
      }

      const now = new Date();
      if (startDateTime < now) {
        errors.start_date = 'Start date/time cannot be in the past';
      }
    }

    if (!formData.purpose.trim()) {
      errors.purpose = 'Purpose is required';
    } else if (formData.purpose.trim().length < 10) {
      errors.purpose = 'Purpose must be at least 10 characters';
    }

    if (formData.attendees < 1) {
      errors.attendees = 'Number of attendees must be at least 1';
    }

    const selectedResource = resources.find((r) => r.resource_id === parseInt(formData.resource_id));
    if (selectedResource && formData.attendees > selectedResource.capacity) {
      errors.attendees = `Attendees cannot exceed capacity (${selectedResource.capacity})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed - ${name}:`, value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('Form submitted with data:', formData);
    console.log('Validating form...');
    
    const isValid = validateForm();
    
    // Wait a tick for state to update
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (!isValid) {
      console.error('Validation failed');
      setError('Please fix the errors in the form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    console.log('Validation passed! Submitting reservation...');
    setSubmitting(true);

    try {
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

      const reservationData = {
        resource_id: parseInt(formData.resource_id),
        start_time: startDateTime,
        end_time: endDateTime,
        purpose: formData.purpose.trim(),
        notes: formData.requirements.trim() || null,
        attendees: parseInt(formData.attendees),
      };

      console.log('Sending reservation data:', reservationData);

      const response = await fetch(API_ENDPOINTS.RESERVATIONS, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Reservation error response:', errorData);
        console.error('Response status:', response.status);
        
        // Handle time conflict (409)
        if (response.status === 409) {
          throw new Error(errorData.message || 'This resource is already reserved for the selected time. Please choose a different time slot.');
        }
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(err => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.message || 'Failed to create reservation');
      }

      const data = await response.json();
      console.log('Reservation created successfully:', data);
      setSuccess('Reservation created successfully! Redirecting to your reservations...');
      
      // Navigate to My Reservations page immediately
      navigate('/my-reservations', { 
        state: { 
          showFeedback: true,
          message: 'Reservation created successfully! Please share your feedback about your booking experience.' 
        } 
      });
    } catch (err) {
      setError(err.message || 'Failed to create reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedResource = resources.find((r) => {
    if (!formData.resource_id) return false;
    
    // Database uses 'id' column, so check both 'id' and 'resource_id'
    const formResourceId = String(formData.resource_id);
    const resourceId = String(r.id || r.resource_id);
    const formResourceIdNum = parseInt(formData.resource_id);
    const resourceIdNum = parseInt(r.id || r.resource_id);
    
    return formResourceId === resourceId || 
           formResourceIdNum === resourceIdNum ||
           formResourceIdNum === (r.id || r.resource_id) ||
           (r.id || r.resource_id) == formData.resource_id;
  });
  
  useEffect(() => {
    console.log('=== Checking Selected Resource ===');
    console.log('Form resource_id:', formData.resource_id, 'Type:', typeof formData.resource_id);
    console.log('Resources count:', resources.length);
    
    if (resources.length > 0) {
      console.log('Available resources:', resources.map(r => ({ 
        id: r.id || r.resource_id,
        type: typeof (r.id || r.resource_id), 
        name: r.name 
      })));
    }
    
    if (selectedResource) {
      console.log('✅ SELECTED RESOURCE:', {
        id: selectedResource.id || selectedResource.resource_id,
        name: selectedResource.name,
        type: selectedResource.type,
        location: selectedResource.location,
        capacity: selectedResource.capacity
      });
    } else if (formData.resource_id) {
      console.log('❌ NO MATCH FOUND for resource_id:', formData.resource_id);
    } else {
      console.log('ℹ️ No resource_id in form data yet');
    }
  }, [selectedResource, formData.resource_id, resources]);

  const calculateDuration = () => {
    if (formData.start_date && formData.start_time && formData.end_date && formData.end_time) {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      const diffMs = endDateTime - startDateTime;
      
      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours}h ${diffMinutes}m`;
      }
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <>
        <StudentHeader />
        <div className="student-dashboard">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading booking form...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard booking-page">
        <div className="dashboard-content">
          <div className="page-header">
            <h1 className="page-title">
              <span className="highlight-text">Book</span> a Resource
            </h1>
            <p className="page-subtitle">
              Reserve a resource for your academic or extracurricular activities
            </p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <div>
                <p style={{ margin: '0 0 0.5rem 0' }}>{error}</p>
                {Object.keys(formErrors).length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {Object.entries(formErrors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="success-message">
              <CheckCircle size={20} />
              <p>{success}</p>
            </div>
          )}

          <div className="booking-container">
            <form onSubmit={handleSubmit} className="booking-form">
              {/* Resource Selection */}
              <div className="form-section">
                <h3 className="section-heading">
                  <FileText size={20} />
                  Resource Information
                </h3>

                {!resourceId && (
                  <div className="form-group">
                    <label htmlFor="resource_id" className="form-label">
                      Select Resource <span className="required">*</span>
                    </label>
                    {resources.length === 0 ? (
                      <p style={{ color: '#fbbf24', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                        No resources available. Please contact the administrator.
                      </p>
                    ) : (
                      <select
                        id="resource_id"
                        name="resource_id"
                        value={formData.resource_id}
                        onChange={handleChange}
                        className={`form-control ${formErrors.resource_id ? 'error' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">-- Select a Resource --</option>
                        {resources.map((resource) => {
                          const resId = resource.id || resource.resource_id;
                          return (
                            <option key={resId} value={resId}>
                              {resource.name} - {resource.type} (Capacity: {resource.capacity})
                            </option>
                          );
                        })}
                      </select>
                    )}
                    {formErrors.resource_id && (
                      <span className="error-text">{formErrors.resource_id}</span>
                    )}
                  </div>
                )}

                {selectedResource && (
                  <div className="resource-info-box">
                    {resourceId && (
                      <div style={{ 
                        padding: '0.75rem 1rem', 
                        background: 'rgba(59, 130, 246, 0.2)', 
                        borderRadius: '8px', 
                        marginBottom: '1rem',
                        border: '1px solid rgba(59, 130, 246, 0.4)'
                      }}>
                        <p style={{ color: '#60a5fa', margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                          ✓ Booking for selected resource
                        </p>
                      </div>
                    )}
                    <h4>{selectedResource.name}</h4>
                    <p className="resource-info-type">{selectedResource.type}</p>
                    <p className="resource-info-desc">{selectedResource.description}</p>
                    <div className="resource-info-details">
                      <span>📍 {selectedResource.location}</span>
                      <span>👥 Capacity: {selectedResource.capacity}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time Selection */}
              <div className="form-section">
                <h3 className="section-heading">
                  <Calendar size={20} />
                  Date & Time
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date" className="form-label">
                      Start Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className={`form-control ${formErrors.start_date ? 'error' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {formErrors.start_date && (
                      <span className="error-text">{formErrors.start_date}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="start_time" className="form-label">
                      Start Time <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      className={`form-control ${formErrors.start_time ? 'error' : ''}`}
                    />
                    {formErrors.start_time && (
                      <span className="error-text">{formErrors.start_time}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="end_date" className="form-label">
                      End Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className={`form-control ${formErrors.end_date ? 'error' : ''}`}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                    />
                    {formErrors.end_date && (
                      <span className="error-text">{formErrors.end_date}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_time" className="form-label">
                      End Time <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      className={`form-control ${formErrors.end_time ? 'error' : ''}`}
                    />
                    {formErrors.end_time && (
                      <span className="error-text">{formErrors.end_time}</span>
                    )}
                  </div>
                </div>

                <div className="duration-display">
                  <Clock size={18} />
                  <span>Duration: <strong>{calculateDuration()}</strong></span>
                </div>
              </div>

              {/* Booking Details */}
              <div className="form-section">
                <h3 className="section-heading">
                  <Users size={20} />
                  Booking Details
                </h3>

                <div className="form-group">
                  <label htmlFor="attendees" className="form-label">
                    Number of Attendees <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="attendees"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleChange}
                    className={`form-control ${formErrors.attendees ? 'error' : ''}`}
                    min="1"
                    max={selectedResource ? selectedResource.capacity : 100}
                  />
                  {formErrors.attendees && (
                    <span className="error-text">{formErrors.attendees}</span>
                  )}
                  {selectedResource && (
                    <span className="helper-text">
                      Maximum capacity: {selectedResource.capacity}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="purpose" className="form-label">
                    Purpose of Booking <span className="required">*</span>
                  </label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    className={`form-control form-textarea ${formErrors.purpose ? 'error' : ''}`}
                    rows="4"
                    placeholder="Describe the purpose of your reservation (minimum 10 characters)..."
                  />
                  {formErrors.purpose && (
                    <span className="error-text">{formErrors.purpose}</span>
                  )}
                  <span className="helper-text">
                    {formData.purpose.length} characters
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="requirements" className="form-label">
                    Special Requirements (Optional)
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    className="form-control form-textarea"
                    rows="3"
                    placeholder="Any special requirements or equipment needed..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/browse-resources')}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Reservation'}
                </button>
              </div>
            </form>

            {/* Booking Summary */}
            <div className="booking-summary">
              <h3 className="summary-title">Booking Summary</h3>
              
              {loading ? (
                <div className="summary-item">
                  <span className="summary-value" style={{ color: '#60a5fa' }}>
                    Loading resource information...
                  </span>
                </div>
              ) : selectedResource ? (
                <>
                  <div className="summary-item">
                    <span className="summary-label">Resource:</span>
                    <span className="summary-value">{selectedResource.name}</span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Type:</span>
                    <span className="summary-value">{selectedResource.type}</span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Location:</span>
                    <span className="summary-value">{selectedResource.location}</span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Capacity:</span>
                    <span className="summary-value">{selectedResource.capacity} people</span>
                  </div>

                  <div className="summary-divider"></div>
                </>
              ) : (
                <div className="summary-item">
                  <span className="summary-value" style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                    {resourceId 
                      ? `Loading resource #${resourceId}...` 
                      : 'Please select a resource from the dropdown below'}
                  </span>
                  {resourceId && resources.length > 0 && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                      ⚠️ Resource not found. It may have been removed or is unavailable.
                    </span>
                  )}
                </div>
              )}

              <div className="summary-item">
                <span className="summary-label">Start:</span>
                <span className="summary-value">
                  {formData.start_date && formData.start_time
                    ? `${formData.start_date} at ${formData.start_time}`
                    : 'Not set'}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">End:</span>
                <span className="summary-value">
                  {formData.end_date && formData.end_time
                    ? `${formData.end_date} at ${formData.end_time}`
                    : 'Not set'}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Duration:</span>
                <span className="summary-value">{calculateDuration()}</span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Attendees:</span>
                <span className="summary-value">{formData.attendees}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-note">
                <AlertCircle size={18} />
                <p>
                  Your reservation will be submitted for approval. You will be notified once it's reviewed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {showFeedbackPrompt && <FloatingFeedbackButton onClose={() => setShowFeedbackPrompt(false)} />}
      {!showFeedbackPrompt && <FloatingFeedbackButton />}
      <FloatingHelpButton />
    </>
  );
};

export default BookResource;

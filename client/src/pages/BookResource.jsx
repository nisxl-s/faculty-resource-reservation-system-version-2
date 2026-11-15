import {usePageLoading} from '../components/LoadingState';
import { useEventCallback } from '../hooks/useEventCallback';
import { fetchList } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';

import BookingDatePicker from '../components/BookingDatePicker';
import BookingTimePicker from '../components/BookingTimePicker';
import ResourceAvailabilityCalendar from '../components/ResourceAvailabilityCalendar';
import SupportSelect from '../components/SupportSelect';
import ResourceSpecs from '../components/ResourceSpecs';
import { campusToday, resourceDetails } from '../config/resourceDetails';
import '../assets/css/resource_details.css';
import ResourceThumbnail from '../components/ResourceThumbnail';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import { Calendar, Clock, Users, FileText, AlertCircle, CheckCircle, MapPin, ArrowLeft, Send, LoaderCircle } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import '../assets/css/student.css';

const BookResource = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const search = state?.availabilitySearch || {};
  const { resourceId } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], name: '', type: '' });


  const [formData, setFormData] = useState({
    resource_id: '',
    start_date: search.start_date || '',
    start_time: search.start_time || '',
    end_date: search.end_date || '',
    end_time: search.end_time || '',
    purpose: '',
    requirements: '',
    attendees: search.attendees || 1,
  });

  const [formErrors, setFormErrors] = useState({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  const chooseCalendarDate = date => {
    setFormData(previous => ({ ...previous, start_date: date, end_date: date }));
    setFormErrors(previous => {
      const next = { ...previous };
      delete next.start_date; delete next.end_date;
      return next;
    });
  };

  // Initialize resource_id immediately if coming from URL
  const fetchResources = useEventCallback(async () => {
    try {
      const response = await fetchList(API_ENDPOINTS.RESOURCES, {
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
      
      // I include all resources when the URL contains a resource ID.
      // Otherwise, I only show available resources in the dropdown.
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
  });
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
  }, [resourceId, fetchResources]);

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
        console.log('Resource FOUND:', foundResource.name);
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
        console.error('Resource NOT FOUND with ID:', resourceId);
        console.log('Available resource IDs:', resources.map(r => r.id || r.resource_id));
      }
    }
  }, [resourceId, resources]);

  useEffect(() => {
    console.log('Current formData:', formData);
    console.log('Available resources count:', resources.length);
  }, [formData, resources]);

  

  const validateForm = () => {
    const errors = {};
    const selectedResource = resources.find(r => String(r.id || r.resource_id) === String(formData.resource_id));

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

    if (selectedResource?.type !== 'equipment' && (!Number.isInteger(Number(formData.attendees)) || formData.attendees < 1)) {
      errors.attendees = 'Number of attendees must be at least 1';
    }

    if (selectedResource?.type !== 'equipment' && selectedResource?.capacity && formData.attendees > selectedResource.capacity) {
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
        attendees: selectedResource?.type === 'equipment' ? null : parseInt(formData.attendees),
      };

      console.log('Sending reservation data:', reservationData);

      const response = await fetchList(API_ENDPOINTS.RESERVATIONS, {
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
      console.log('SELECTED RESOURCE:', {
        id: selectedResource.id || selectedResource.resource_id,
        name: selectedResource.name,
        type: selectedResource.type,
        location: selectedResource.location,
        capacity: selectedResource.capacity
      });
    } else if (formData.resource_id) {
      console.log('NO MATCH FOUND for resource_id:', formData.resource_id);
    } else {
      console.log('No resource_id in form data yet');
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
            <p className="booking-timezone-note"><Clock size={14} aria-hidden="true"/>Booking times use Sri Lanka time (Asia/Colombo).</p>
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
            <form onSubmit={handleSubmit} className="booking-form resource-controls">
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
                      <SupportSelect id="resource_id" label="Select resource" value={formData.resource_id} onChange={value => handleChange({target:{name:'resource_id',value}})} options={[{value:'',label:'Choose a resource'},...resources.map(resource=>({value:String(resource.id || resource.resource_id),label:resource.name,disabled:resource.status!=='available'}))]} />
                    )}
                    {formErrors.resource_id && (
                      <span className="error-text">{formErrors.resource_id}</span>
                    )}
                  </div>
                )}

                {selectedResource && (
                  <div className="resource-info-box">
                    {resourceId && (
                      <div className="booking-selected-notice">
                        <p>
                          <CheckCircle size={15} aria-hidden="true"/> Booking for selected resource
                        </p>
                      </div>
                    )}

                    {/* Visual Thumbnail & Photo Gallery Banner */}
                    <div style={{ marginBottom: '16px', borderRadius: '14px', overflow: 'hidden' }}>
                      <ResourceThumbnail
                        images={selectedResource.images}
                        type={selectedResource.type}
                        name={selectedResource.name}
                        size="md"
                        showBadge={true}
                        onClick={() => {
                          const imgs = Array.isArray(selectedResource.images)
                            ? selectedResource.images
                            : typeof selectedResource.images === 'string' && selectedResource.images.trim()
                            ? (() => { try { return JSON.parse(selectedResource.images); } catch { return [selectedResource.images]; } })()
                            : [];
                          if (imgs.length > 0) {
                            setGalleryModal({
                              isOpen: true,
                              images: imgs,
                              name: selectedResource.name,
                              type: selectedResource.type,
                            });
                          }
                        }}
                      />
                    </div>

                    <h4>{selectedResource.name}</h4>
                    <p className="resource-info-type">{selectedResource.type}</p>
                    <p className="resource-info-desc">{selectedResource.description}</p>
                    <div className="resource-info-details">
                      <span><MapPin size={15} aria-hidden="true"/> {selectedResource.location}</span>
                      {selectedResource.type !== 'equipment' && <span>Seating: {selectedResource.capacity || 'Not specified'}{selectedResource.capacity ? ' people' : ''}</span>}
                    </div>
                    <ResourceSpecs resource={selectedResource} compact/>
                  </div>
                )}

              </div>

              {/* Date & Time Selection */}
              <div className="form-section">
                <h3 className="section-heading">
                  <Calendar size={20} />
                  {selectedResource?.type === 'equipment' ? (resourceDetails(selectedResource).booking_mode === 'collection' ? 'Collection & return period' : 'Equipment reservation period') : 'Reservation date & time'}
                </h3>

                {selectedResource && <>
                  <button type="button" className="resource-calendar-toggle" aria-expanded={calendarOpen} aria-controls={calendarOpen ? 'resource-availability-calendar' : undefined} onClick={() => setCalendarOpen(value => !value)}><Calendar size={17} aria-hidden="true" />{calendarOpen ? 'Hide availability calendar' : 'View availability calendar'}</button>
                  {calendarOpen && <ResourceAvailabilityCalendar key={selectedResource.id} resource={selectedResource} selectedDate={formData.start_date} onSelectDate={chooseCalendarDate} />}
                </>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date" className="form-label">
                      Start Date <span className="required">*</span>
                    </label>
                    <BookingDatePicker id="start_date" name="start_date" label="start date" value={formData.start_date} onChange={handleChange} invalid={Boolean(formErrors.start_date)} min={campusToday()}/>
                    {formErrors.start_date && (
                      <span className="error-text">{formErrors.start_date}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="start_time" className="form-label">
                      Start Time <span className="required">*</span>
                    </label>
                    <BookingTimePicker id="start_time" name="start_time" label="start time" value={formData.start_time} onChange={handleChange}/>
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
                    <BookingDatePicker id="end_date" name="end_date" label="end date" value={formData.end_date} onChange={handleChange} invalid={Boolean(formErrors.end_date)} min={formData.start_date > campusToday() ? formData.start_date : campusToday()}/>
                    {formErrors.end_date && (
                      <span className="error-text">{formErrors.end_date}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_time" className="form-label">
                      End Time <span className="required">*</span>
                    </label>
                    <BookingTimePicker id="end_time" name="end_time" label="end time" value={formData.end_time} onChange={handleChange}/>
                    {formErrors.end_time && (
                      <span className="error-text">{formErrors.end_time}</span>
                    )}
                  </div>
                </div>

                <p className="resource-field-note">All dates and times use campus time (Asia/Colombo). Choose the hour, minute and AM/PM using the clock.</p>
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

                {selectedResource?.type !== 'equipment' && <>
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
                    max={selectedResource?.capacity || undefined}
                  />
                  {formErrors.attendees && (
                    <span className="error-text">{formErrors.attendees}</span>
                  )}
                  {selectedResource && (
                    <span className="helper-text">
                      {selectedResource.capacity ? 'Maximum seating: ' + selectedResource.capacity : 'Seating limit not specified'}
                    </span>
                  )}
                </div>

                </>}
                {selectedResource?.type === 'equipment' && <p className="resource-field-note">This booking reserves the listed item or kit for the selected period. Review the usage arrangement, accessories and handling instructions above. One booking reserves the whole listing.</p>}
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
              <div className="form-actions booking-submit-row">
                <div className="booking-submit-feedback">
                  {error && <div id="booking-submit-error" className="booking-submit-error" role="alert" aria-atomic="true">
                    <AlertCircle size={20} aria-hidden="true"/>
                    <div><strong>Reservation not submitted</strong><p>{error}</p></div>
                  </div>}
                </div>
                <div className="booking-submit-buttons">
                <button
                  type="button"
                  className="booking-action booking-action-secondary"
                  onClick={() => navigate('/browse-resources')}
                  disabled={submitting}
                >
                  <ArrowLeft size={17} aria-hidden="true"/> Cancel
                </button>
                <button
                  type="submit"
                  className="booking-action booking-action-primary"
                  disabled={submitting || !selectedResource || selectedResource.status !== 'available'}
                  aria-busy={submitting}
                  aria-describedby={error ? 'booking-submit-error' : undefined}
                >
                  {submitting ? <LoaderCircle size={17} className="booking-submit-spinner" aria-hidden="true"/> : <Send size={17} aria-hidden="true"/>}
                  {submitting ? 'Submitting…' : 'Submit Reservation'}
                </button>
                </div>
              </div>
            </form>

            {/* Booking Summary */}
            <div className="booking-summary">
              <h3 className="summary-title">Booking Summary</h3>
              
              {selectedResource ? (
                <>
                  <div style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                    <ResourceThumbnail
                      images={selectedResource.images}
                      type={selectedResource.type}
                      name={selectedResource.name}
                      size="sm"
                      style={{ width: '100%', height: '80px', borderRadius: '10px' }}
                      showBadge={true}
                      onClick={() => {
                        const imgs = Array.isArray(selectedResource.images)
                          ? selectedResource.images
                          : typeof selectedResource.images === 'string' && selectedResource.images.trim()
                          ? (() => { try { return JSON.parse(selectedResource.images); } catch { return [selectedResource.images]; } })()
                          : [];
                        if (imgs.length > 0) {
                          setGalleryModal({
                            isOpen: true,
                            images: imgs,
                            name: selectedResource.name,
                            type: selectedResource.type,
                          });
                        }
                      }}
                    />
                  </div>

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

                  <div className="summary-item"><span className="summary-label">{selectedResource.type === 'equipment' ? 'Booking unit:' : 'Seating:'}</span><span className="summary-value">{selectedResource.type === 'equipment' ? 'One listed asset / kit' : selectedResource.capacity ? selectedResource.capacity + ' people' : 'Not specified'}</span></div>

                  <div className="summary-divider"></div>
                </>
              ) : (
                <div className="summary-item">
                  <span className="summary-value" style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                    {resourceId 
                      ? `Resource #${resourceId}` 
                      : 'Please select a resource from the dropdown below'}
                  </span>
                  {resourceId && resources.length > 0 && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                      <AlertCircle size={15} aria-hidden="true"/> Resource not found. It may have been removed or is unavailable.
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

              {selectedResource?.type !== 'equipment' && <div className="summary-item"><span className="summary-label">Attendees:</span><span className="summary-value">{formData.attendees}</span></div>}

              <div className="summary-divider"></div>

              <div className="summary-note">
                <AlertCircle size={18} />
                <p>
                  Your reservation will be submitted for approval. You will be notified once it is reviewed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={galleryModal.isOpen}
        onClose={() => setGalleryModal({ isOpen: false, images: [], name: '', type: '' })}
        images={galleryModal.images}
        resourceName={galleryModal.name}
        resourceType={galleryModal.type}
      />

      
      {showFeedbackPrompt && <FloatingFeedbackButton onClose={() => setShowFeedbackPrompt(false)} />}
      {!showFeedbackPrompt && <FloatingFeedbackButton />}

    </>
  );
};

export default BookResource;

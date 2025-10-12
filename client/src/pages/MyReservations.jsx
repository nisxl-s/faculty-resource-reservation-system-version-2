import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import FloatingHelpButton from '../components/FloatingHelpButton';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import '../assets/css/student.css';

const MyReservations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchReservations();
    
    // Check if we should auto-open feedback modal
    if (location.state?.showFeedback) {
      setShowFeedbackModal(true);
      if (location.state?.message) {
        setSuccess(location.state.message);
        // Clear message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      }
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, statusFilter]);

  const fetchReservations = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MY_RESERVATIONS, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const result = await response.json();
      console.log('My Reservations API Response:', result);
      
      // Handle the response format: { success: true, data: { reservations: [...] } }
      let userReservations = [];
      if (result.data && result.data.reservations) {
        userReservations = result.data.reservations;
      } else if (Array.isArray(result.data)) {
        userReservations = result.data;
      } else if (Array.isArray(result)) {
        userReservations = result;
      }

      // Log first reservation to check field names
      if (userReservations.length > 0) {
        console.log('Sample reservation fields:', {
          id: userReservations[0].id,
          reservation_id: userReservations[0].reservation_id,
          resource_id: userReservations[0].resource_id,
          status: userReservations[0].status
        });
      }

      // Sort by creation date (newest first)
      userReservations.sort((a, b) => new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time));

      setReservations(userReservations);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Please try again.');
      setLoading(false);
    }
  };

  const filterReservations = () => {
    if (statusFilter === 'all') {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(
        reservations.filter((reservation) => reservation.status === statusFilter)
      );
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    console.log('Attempting to cancel reservation ID:', reservationId);
    setCancellingId(reservationId);
    setError('');
    setSuccess('');

    try {
      const cancelUrl = `${API_ENDPOINTS.RESERVATIONS}/${reservationId}/cancel`;
      console.log('Cancel URL:', cancelUrl);
      
      const response = await fetch(cancelUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cancel reservation error:', errorData);
        throw new Error(errorData.message || 'Failed to cancel reservation');
      }

      const result = await response.json();
      console.log('Reservation cancelled successfully:', result);
      setSuccess('Reservation cancelled successfully');
      
      // Update local state
      setReservations((prev) =>
        prev.map((reservation) =>
          (reservation.reservation_id === reservationId || reservation.id === reservationId)
            ? { ...reservation, status: 'cancelled' }
            : reservation
        )
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Cancel reservation failed:', err);
      setError(err.message || 'Failed to cancel reservation. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'orange', icon: <Clock size={16} />, label: 'Pending' },
      approved: { color: 'green', icon: <CheckCircle size={16} />, label: 'Approved' },
      rejected: { color: 'red', icon: <XCircle size={16} />, label: 'Rejected' },
      cancelled: { color: 'gray', icon: <XCircle size={16} />, label: 'Cancelled' },
      completed: { color: 'blue', icon: <CheckCircle size={16} />, label: 'Completed' },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`reservation-status-badge status-${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const isActive = (reservation) => {
    const now = new Date();
    const startDate = new Date(reservation.start_date);
    const endDate = new Date(reservation.end_date);
    return (
      reservation.status === 'approved' &&
      now >= startDate &&
      now <= endDate
    );
  };

  if (loading) {
    return (
      <>
        <StudentHeader />
        <div className="student-dashboard">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your reservations...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard my-reservations-page">
        <div className="dashboard-content">
          <div className="page-header">
            <h1 className="page-title">
              <span className="highlight-text">My</span> Reservations
            </h1>
            <p className="page-subtitle">
              View and manage all your resource reservations
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

          {/* Filter Section */}
          <div className="reservations-filter">
            <div className="filter-group">
              <Filter className="filter-icon" />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Reservations ({reservations.length})</option>
                <option value="pending">
                  Pending ({reservations.filter((r) => r.status === 'pending').length})
                </option>
                <option value="approved">
                  Approved ({reservations.filter((r) => r.status === 'approved').length})
                </option>
                <option value="rejected">
                  Rejected ({reservations.filter((r) => r.status === 'rejected').length})
                </option>
                <option value="cancelled">
                  Cancelled ({reservations.filter((r) => r.status === 'cancelled').length})
                </option>
                <option value="completed">
                  Completed ({reservations.filter((r) => r.status === 'completed').length})
                </option>
              </select>
            </div>

            <button
              className="new-booking-btn"
              onClick={() => navigate('/browse-resources')}
            >
              + New Reservation
            </button>
          </div>

          {/* Reservations List */}
          {filteredReservations.length === 0 ? (
            <div className="empty-reservations">
              <Calendar size={64} className="empty-icon" />
              <h3>No Reservations Found</h3>
              <p>
                {statusFilter === 'all'
                  ? "You haven't made any reservations yet."
                  : `You don't have any ${statusFilter} reservations.`}
              </p>
              <button
                className="empty-action-btn"
                onClick={() => navigate('/browse-resources')}
              >
                Browse Resources
              </button>
            </div>
          ) : (
            <div className="reservations-list">
              {filteredReservations.map((reservation, index) => (
                <div
                  key={reservation.reservation_id}
                  className={`reservation-card ${isActive(reservation) ? 'active-reservation' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="reservation-header">
                    <div className="reservation-title-section">
                      <h3 className="reservation-resource-name">
                        {reservation.resource_name}
                      </h3>
                      <p className="reservation-resource-type">
                        {reservation.resource_type}
                      </p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>

                  {isActive(reservation) && (
                    <div className="active-indicator">
                      🔴 Active Now
                    </div>
                  )}

                  <div className="reservation-details-grid">
                    <div className="detail-item">
                      <Calendar size={18} />
                      <div>
                        <span className="detail-label">Start</span>
                        <span className="detail-value">
                          {formatDateTime(reservation.start_date)}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <Calendar size={18} />
                      <div>
                        <span className="detail-label">End</span>
                        <span className="detail-value">
                          {formatDateTime(reservation.end_date)}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <Clock size={18} />
                      <div>
                        <span className="detail-label">Duration</span>
                        <span className="detail-value">
                          {calculateDuration(reservation.start_date, reservation.end_date)}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <MapPin size={18} />
                      <div>
                        <span className="detail-label">Location</span>
                        <span className="detail-value">{reservation.location}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <Users size={18} />
                      <div>
                        <span className="detail-label">Attendees</span>
                        <span className="detail-value">{reservation.attendees}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <Calendar size={18} />
                      <div>
                        <span className="detail-label">Booked On</span>
                        <span className="detail-value">
                          {formatDateTime(reservation.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="reservation-purpose">
                    <strong>Purpose:</strong> {reservation.purpose}
                  </div>

                  {reservation.requirements && (
                    <div className="reservation-requirements">
                      <strong>Requirements:</strong> {reservation.requirements}
                    </div>
                  )}

                  {reservation.status === 'pending' && (
                    <div className="reservation-actions">
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelReservation(reservation.id || reservation.reservation_id)}
                        disabled={cancellingId === (reservation.id || reservation.reservation_id)}
                      >
                        {cancellingId === (reservation.id || reservation.reservation_id)
                          ? 'Cancelling...'
                          : 'Cancel Reservation'}
                      </button>
                    </div>
                  )}

                  {reservation.status === 'rejected' && reservation.rejection_reason && (
                    <div className="rejection-reason">
                      <AlertCircle size={18} />
                      <div>
                        <strong>Rejection Reason:</strong>
                        <p>{reservation.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <FloatingFeedbackButton 
        autoOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
      <FloatingHelpButton />
    </>
  );
};

export default MyReservations;

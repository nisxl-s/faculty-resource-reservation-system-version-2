import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import useFadeScroll from "../hooks/useFadeScroll";
import "../assets/css/user_management.css";
import "../assets/css/global.css";
import "../assets/css/navbar.css";
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/footer/Footer';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';

export default function BookingHistory() {
  useFadeScroll();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
  const [processingId, setProcessingId] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Fetch reservations data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const user = getCurrentUser();
      if (!user || user.role !== 'admin') {
        alert('Access denied. Admin only.');
        navigate('/login');
        return;
      }

      // Fetch users
      const usersRes = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });
      const usersData = await usersRes.json();
      console.log('Users data:', usersData);
      
      let usersList = [];
      if (usersData.data && usersData.data.users && Array.isArray(usersData.data.users)) {
        usersList = usersData.data.users;
      } else if (usersData.data && Array.isArray(usersData.data)) {
        usersList = usersData.data;
      } else if (Array.isArray(usersData)) {
        usersList = usersData;
      }
      setUsers(usersList);

      // Fetch reservations
      const bookingsRes = await fetch(API_ENDPOINTS.RESERVATIONS, {
        headers: getAuthHeaders(),
      });
      const bookingsData = await bookingsRes.json();
      console.log('Reservations data:', bookingsData);
      
      let reservationsList = [];
      if (bookingsData.data && bookingsData.data.reservations && Array.isArray(bookingsData.data.reservations)) {
        reservationsList = bookingsData.data.reservations;
      } else if (bookingsData.data && Array.isArray(bookingsData.data)) {
        reservationsList = bookingsData.data;
      } else if (Array.isArray(bookingsData)) {
        reservationsList = bookingsData;
      }
      setReservations(reservationsList);

      // Fetch resources
      const resourcesRes = await fetch(API_ENDPOINTS.RESOURCES, {
        headers: getAuthHeaders(),
      });
      const resourcesData = await resourcesRes.json();
      console.log('Resources data:', resourcesData);
      
      let resourcesList = [];
      if (resourcesData.data && resourcesData.data.resources && Array.isArray(resourcesData.data.resources)) {
        resourcesList = resourcesData.data.resources;
      } else if (resourcesData.data && Array.isArray(resourcesData.data)) {
        resourcesList = resourcesData.data;
      } else if (Array.isArray(resourcesData)) {
        resourcesList = resourcesData;
      }
      setResources(resourcesList);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setUsers([]);
      setReservations([]);
      setResources([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle approve
  const handleApprove = async (reservationId) => {
    try {
      setProcessingId(reservationId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_ENDPOINTS.RESERVATIONS}/${reservationId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'approved' })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to approve reservation');
      }

      setSuccess('Reservation approved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the list
      await fetchData();
    } catch (err) {
      console.error('Error approving reservation:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = async (reservationId) => {
    try {
      setProcessingId(reservationId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_ENDPOINTS.RESERVATIONS}/${reservationId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'rejected' })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reject reservation');
      }

      setSuccess('Reservation rejected successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the list
      await fetchData();
    } catch (err) {
      console.error('Error rejecting reservation:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter reservations based on active tab
  const filteredReservations = activeTab === 'pending' 
    ? reservations.filter(r => r.status === 'pending')
    : reservations;

  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  return (
    <>
      <AdminHeader />
      <div className="user-management-page" style={{paddingTop: '165px'}}>
        <div className="main-content" style={{paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '2rem'}}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '10px'
          }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))' 
                  : 'transparent',
                border: activeTab === 'all' 
                  ? '1px solid rgba(59, 130, 246, 0.5)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '10px 10px 0 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              All Reservations ({reservations.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                background: activeTab === 'pending' 
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3))' 
                  : 'transparent',
                border: activeTab === 'pending' 
                  ? '1px solid rgba(251, 191, 36, 0.5)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '10px 10px 0 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Clock size={16} />
              Pending Approvals ({pendingCount})
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#22c55e',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {success}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{textAlign: 'center', padding: '3rem', color: '#ffffff'}}>
              <h3>Loading reservations...</h3>
            </div>
          ) : (
            <div className="reservations-table">
              <h2>
                {activeTab === 'all' 
                  ? `All Reservations (${reservations.length})` 
                  : `Pending Approvals (${pendingCount})`}
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    {activeTab === 'pending' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredReservations) && filteredReservations.length > 0 ? (
                    filteredReservations.map(r => {
                      const user = Array.isArray(users) ? users.find(u => (u.id === r.user_id || u.user_id === r.user_id)) : null;
                      const resource = Array.isArray(resources) ? resources.find(res => (res.id === r.resource_id || res.resource_id === r.resource_id)) : null;
                      
                      const startDate = r.start_time ? new Date(r.start_time) : null;
                      const endDate = r.end_time ? new Date(r.end_time) : null;
                      
                      const now = new Date();
                      let status = r.status || 'pending';
                      if (startDate && endDate) {
                        if (now > endDate) {
                          status = 'completed';
                        } else if (now >= startDate && now <= endDate) {
                          status = 'active';
                        }
                      }
                      
                      return (
                        <tr key={r.id || r.reservation_id}>
                          <td>#{r.id || r.reservation_id}</td>
                          <td>{user ? user.full_name : r.user_name || 'Unknown'}</td>
                          <td>{resource ? resource.name : r.resource_name || 'N/A'}</td>
                          <td>{resource ? resource.type : r.resource_type || 'N/A'}</td>
                          <td>{startDate ? startDate.toLocaleDateString() : 'N/A'}</td>
                          <td>
                            {startDate && endDate 
                              ? `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` 
                              : 'N/A'}
                          </td>
                          <td>
                            <span className={`status-badge status-${status.toLowerCase()}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          {activeTab === 'pending' && (
                            <td>
                              <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                                <button
                                  onClick={() => handleApprove(r.id || r.reservation_id)}
                                  disabled={processingId === (r.id || r.reservation_id)}
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#22c55e',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: processingId === (r.id || r.reservation_id) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: processingId === (r.id || r.reservation_id) ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (processingId !== (r.id || r.reservation_id)) {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
                                  }}
                                >
                                  <CheckCircle size={14} />
                                  {processingId === (r.id || r.reservation_id) ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleReject(r.id || r.reservation_id)}
                                  disabled={processingId === (r.id || r.reservation_id)}
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: processingId === (r.id || r.reservation_id) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: processingId === (r.id || r.reservation_id) ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (processingId !== (r.id || r.reservation_id)) {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))';
                                  }}
                                >
                                  <XCircle size={14} />
                                  {processingId === (r.id || r.reservation_id) ? 'Processing...' : 'Reject'}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={activeTab === 'pending' ? "8" : "7"} style={{textAlign: 'center'}}>
                        {activeTab === 'pending' 
                          ? 'No pending approvals' 
                          : 'No reservations found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Briefcase, Phone, Save, X, Edit2 } from 'lucide-react';
import "../assets/css/user_management.css";
import "../assets/css/global.css";
import "../assets/css/navbar.css";
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/footer/Footer';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    role: '',
    department: '',
    phone: ''
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: ''
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const user = getCurrentUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        const response = await fetch(API_ENDPOINTS.PROFILE, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Profile data:', data);

        if (data.success && data.data && data.data.user) {
          const userData = data.data.user;
          setProfile(userData);
          setEditForm({
            full_name: userData.full_name || '',
            email: userData.email || '',
            department: userData.department || '',
            phone: userData.phone || ''
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfile(prev => ({
        ...prev,
        ...editForm
      }));
      
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      department: profile.department || '',
      phone: profile.phone || ''
    });
    setEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="user-management-page" style={{paddingTop: '190px', paddingBottom: '40px'}}>
          <div style={{textAlign: 'center', padding: '3rem', color: '#ffffff'}}>
            <h3>Loading profile...</h3>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="user-management-page" style={{paddingTop: '190px', paddingBottom: '40px'}}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          {/* Profile Header */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(59, 130, 246, 0.5)'
                }}>
                  <User size={32} color="#3b82f6" />
                </div>
                <div>
                  <h1 style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    My Profile
                  </h1>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    textTransform: 'capitalize'
                  }}>
                    {profile.role}
                  </span>
                </div>
              </div>
              
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              )}
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
                marginTop: '12px'
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
                marginTop: '12px'
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px'
            }}>
              Personal Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Name */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  <User size={16} />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}>
                    {profile.full_name}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  <Mail size={16} />
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}>
                    {profile.email}
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  <Briefcase size={16} />
                  Department
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="department"
                    value={editForm.department}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}>
                    {profile.department || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  <Phone size={16} />
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}>
                    {profile.phone || 'Not specified'}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleCancel}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

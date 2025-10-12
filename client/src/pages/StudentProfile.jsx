import React, { useState, useEffect } from 'react';
import StudentHeader from '../components/StudentHeader';
import Footer from '../components/footer';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';
import FloatingHelpButton from '../components/FloatingHelpButton';
import { User, Mail, Briefcase, Phone, Edit2, Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';
import '../assets/css/student.css';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();
      // Handle both formats: direct object or nested in data.user
      const profileData = result.data?.user || result;
      setProfile(profileData);
      setEditedProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        department: profileData.department || '',
        phone: profileData.phone || '',
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!editedProfile.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (editedProfile.full_name.trim().length < 3) {
      errors.full_name = 'Full name must be at least 3 characters';
    }

    if (!editedProfile.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      errors.email = 'Invalid email format';
    }

    if (editedProfile.phone && !/^[\d\s\-+()]+$/.test(editedProfile.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      full_name: profile.full_name || '',
      email: profile.email || '',
      department: profile.department || '',
      phone: profile.phone || '',
    });
    setValidationErrors({});
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      // Handle both formats: direct object or nested in data.user
      const updatedUserData = result.data?.user || result.user || result;
      
      setProfile(updatedUserData);
      setEditedProfile({
        full_name: updatedUserData.full_name || '',
        email: updatedUserData.email || '',
        department: updatedUserData.department || '',
        phone: updatedUserData.phone || '',
      });
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUserData }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <StudentHeader />
        <div className="student-dashboard">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <StudentHeader />
        <div className="student-dashboard">
          <div className="error-message">
            <AlertCircle size={20} />
            <p>Failed to load profile</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <StudentHeader />
      <div className="student-dashboard student-profile-page">
        <div className="dashboard-content">
          <div className="page-header">
            <h1 className="page-title">
              <span className="highlight-text">My</span> Profile
            </h1>
            <p className="page-subtitle">
              View and manage your personal information
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

          <div className="profile-container">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <User size={48} />
                </div>
                <h2 className="profile-name">{profile.full_name}</h2>
                <p className="profile-role">{profile.role.toUpperCase()}</p>
              </div>

              {!isEditing && (
                <button className="edit-profile-btn" onClick={handleEditClick}>
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Profile Details */}
            <div className="profile-details-card">
              <h3 className="details-title">Personal Information</h3>

              <div className="profile-fields">
                {/* Full Name */}
                <div className="profile-field">
                  <div className="field-icon">
                    <User size={20} />
                  </div>
                  <div className="field-content">
                    <label className="field-label">Full Name</label>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          name="full_name"
                          value={editedProfile.full_name}
                          onChange={handleInputChange}
                          className={`field-input ${validationErrors.full_name ? 'error' : ''}`}
                          placeholder="Enter your full name"
                        />
                        {validationErrors.full_name && (
                          <span className="error-text">{validationErrors.full_name}</span>
                        )}
                      </>
                    ) : (
                      <div className="field-value">{profile.full_name}</div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="profile-field">
                  <div className="field-icon">
                    <Mail size={20} />
                  </div>
                  <div className="field-content">
                    <label className="field-label">Email</label>
                    {isEditing ? (
                      <>
                        <input
                          type="email"
                          name="email"
                          value={editedProfile.email}
                          onChange={handleInputChange}
                          className={`field-input ${validationErrors.email ? 'error' : ''}`}
                          placeholder="Enter your email"
                        />
                        {validationErrors.email && (
                          <span className="error-text">{validationErrors.email}</span>
                        )}
                      </>
                    ) : (
                      <div className="field-value">{profile.email}</div>
                    )}
                  </div>
                </div>

                {/* Department */}
                <div className="profile-field">
                  <div className="field-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="field-content">
                    <label className="field-label">Department</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="department"
                        value={editedProfile.department}
                        onChange={handleInputChange}
                        className="field-input"
                        placeholder="Enter your department"
                      />
                    ) : (
                      <div className="field-value">
                        {profile.department || 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="profile-field">
                  <div className="field-icon">
                    <Phone size={20} />
                  </div>
                  <div className="field-content">
                    <label className="field-label">Phone</label>
                    {isEditing ? (
                      <>
                        <input
                          type="tel"
                          name="phone"
                          value={editedProfile.phone}
                          onChange={handleInputChange}
                          className={`field-input ${validationErrors.phone ? 'error' : ''}`}
                          placeholder="Enter your phone number"
                        />
                        {validationErrors.phone && (
                          <span className="error-text">{validationErrors.phone}</span>
                        )}
                      </>
                    ) : (
                      <div className="field-value">
                        {profile.phone || 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="profile-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Check size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="account-info-card">
            <h3 className="details-title">Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">User ID:</span>
                <span className="info-value">{profile.user_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role:</span>
                <span className="info-value">{profile.role}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Status:</span>
                <span className="info-value status-active">Active</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingFeedbackButton />
      <FloatingHelpButton />
    </>
  );
};

export default StudentProfile;

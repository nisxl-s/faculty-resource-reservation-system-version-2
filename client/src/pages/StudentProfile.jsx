import React, { useState, useEffect } from 'react';
import StudentHeader from '../components/StudentHeader';
import FloatingFeedbackButton from '../components/FloatingFeedbackButton';

import { 
  User, 
  Mail, 
  Briefcase, 
  Phone, 
  Edit2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Shield, 
  GraduationCap,
  Hash
} from 'lucide-react';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { sectionCache } from '../utils/sectionCache';
import { useSectionEnter } from '../hooks/effects';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/profile.css';

const StudentProfile = () => {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState(() => sectionCache.studentProfile || currentUser || null);
  const [loading, setLoading] = useState(() => !sectionCache.studentProfile && !currentUser);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useSectionEnter();

  const [editedProfile, setEditedProfile] = useState({
    full_name: sectionCache.studentProfile?.full_name || currentUser?.full_name || '',
    email: sectionCache.studentProfile?.email || currentUser?.email || '',
    department: sectionCache.studentProfile?.department || currentUser?.department || '',
    phone: sectionCache.studentProfile?.phone || currentUser?.phone || '',
        registration_id: sectionCache.studentProfile?.registration_id || currentUser?.registration_id || '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchProfile(!sectionCache.studentProfile);
  }, []);

  const fetchProfile = async (isInitial = true) => {
    try {
      if (isInitial && !sectionCache.studentProfile) setLoading(true);
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve profile credentials');
      }

      const result = await response.json();
      // Handle both formats: direct object or nested in data.user
      const profileData = result.data?.user || result.user || result;
      sectionCache.studentProfile = profileData;
      setProfile(profileData);
      setEditedProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        department: profileData.department || '',
        phone: profileData.phone || '',
        registration_id: profileData.registration_id || '',
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      if (!sectionCache.studentProfile) {
        setError('Failed to load profile. Please refresh or try again later.');
      }
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
      errors.email = 'Institutional email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      errors.email = 'Please provide a valid email format';
    }

    if (editedProfile.phone && !/^[\d\s\-+()]+$/.test(editedProfile.phone)) {
      errors.phone = 'Please enter a valid phone number format';
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
    if (profile) {
      setEditedProfile({
        full_name: profile.full_name || '',
        email: profile.email || '',
        department: profile.department || '',
        phone: profile.phone || '',
        registration_id: profile.registration_id || '',
      });
    }
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

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setError('Please review and resolve the errors in the form.');
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

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update student profile');
      }

      const updatedUserData = result.data?.user || result.user || result;
      
      setProfile((prev) => ({ ...prev, ...updatedUserData }));
      setEditedProfile({
        full_name: updatedUserData.full_name || editedProfile.full_name,
        email: updatedUserData.email || editedProfile.email,
        department: updatedUserData.department || editedProfile.department,
        phone: updatedUserData.phone || editedProfile.phone,
        registration_id: updatedUserData.registration_id || editedProfile.registration_id,
      });
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Update user in localStorage
      try {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUserData }));
      } catch (err) {
        console.warn('Could not update localStorage user cache', err);
      }

      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile && !loading) {
    return (
      <>
        <StudentHeader />
        <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
          <section className="pf-page" data-section-content>
            <div className="pf-error">
              <AlertCircle size={20} />
              <span>Failed to load profile. Please refresh or try again later.</span>
            </div>
          </section>
        </main>
        
      </>
    );
  }

  const initial = (profile.full_name || getCurrentUser()?.full_name || 'S').charAt(0).toUpperCase();

  return (
    <>
      <StudentHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="pf-page" data-section-content>
          {/* ── Page Hero ── */}
          <div className="pf-hero">
            <div className="pf-hero-left">
              <div className="pf-hero__icon">
                <GraduationCap size={32} />
              </div>
              <div>
                <h1 className="pf-hero__title">Student Profile</h1>
                <p className="pf-hero__sub">
                  View and manage your academic credentials, departmental affiliation, and contact details.
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                className="pf-btn-edit"
                onClick={handleEditClick}
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>

          {/* ── Feedback Banners ── */}
          {error && (
            <div className="pf-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="pf-success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* ── Two-Column Layout ── */}
          <div className="pf-layout-grid">
            {/* Left Column: Identity Glass Card */}
            <div className="pf-identity-card">
              <div className="pf-avatar-wrapper">
                <div className="pf-avatar-circle">{initial}</div>
                <div className="pf-status-indicator" title="Active Account" />
              </div>

              <h2 className="pf-name">{profile.full_name || 'Student Member'}</h2>
              <p className="pf-email-sub">{profile.email}</p>

              <span className="um-badge um-badge--student">Student</span>

              <div className="pf-identity-divider" />

              <div className="pf-meta-list">
                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Hash size={15} /> Student ID
                  </span>
                  <span className="pf-meta-val">
                    #{profile.user_id || '-'}
                  </span>
                </div>

                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Shield size={15} /> Access Level
                  </span>
                  <span className="pf-meta-val" style={{ textTransform: 'capitalize' }}>
                    {profile.role || 'Student'}
                  </span>
                </div>

                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Briefcase size={15} /> Department
                  </span>
                  <span className="pf-meta-val">
                    {profile.department || 'General Studies'}
                  </span>
                </div>

                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Check size={15} /> Account Status
                  </span>
                  <span className="pf-meta-val" style={{ color: '#4ade80' }}>
                    Verified Active
                  </span>
                </div>

                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Calendar size={15} /> Member Since
                  </span>
                  <span className="pf-meta-val">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Recent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Profile Information / Edit Form Card */}
            <div className="pf-card">
              <div className="pf-card__header">
                <div className="pf-card__header-left">
                  <div className="pf-card__header-icon">
                    <User size={22} />
                  </div>
                  <div>
                    <h2 className="pf-card__title">
                      {isEditing ? 'Update Student Credentials' : 'Student Specifications'}
                    </h2>
                    <p className="pf-card__sub">
                      {isEditing
                        ? 'Modify your identity details and institutional contacts below.'
                        : 'Official university contact details registered with the reservation system.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pf-card-body">
                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="pf-edit-form">
                    <div className="rg-section-divider">
                      <span>Personal Information</span>
                    </div>

                    <div className="pf-form-grid">
                      <div className="rg-form-group">
                        <label htmlFor="pf-student-name">Full Legal Name</label>
                        <div className="rg-field">
                          <span className="rg-field-icon"><User size={16} /></span>
                          <input
                            id="pf-student-name"
                            name="full_name"
                            type="text"
                            placeholder="Enter your full name"
                            value={editedProfile.full_name}
                            onChange={handleInputChange}
                            className={`rg-field-input ${validationErrors.full_name ? 'error' : ''}`}
                            autoComplete="off"
                            required
                          />
                        </div>
                        {validationErrors.full_name && (
                          <span className="error-text">{validationErrors.full_name}</span>
                        )}
                      </div>

                      <div className="rg-form-group">
                        <label htmlFor="pf-student-email">Email Address</label>
                        <div className="rg-field">
                          <span className="rg-field-icon"><Mail size={16} /></span>
                          <input
                            id="pf-student-email"
                            name="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={editedProfile.email}
                            onChange={handleInputChange}
                            className={`rg-field-input ${validationErrors.email ? 'error' : ''}`}
                            autoComplete="off"
                            required
                          />
                        </div>
                        {validationErrors.email && (
                          <span className="error-text">{validationErrors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="rg-section-divider">
                      <span>Academic & Contact</span>
                    </div>

                    <div className="pf-form-grid">
                      <div className="rg-form-group">
                        <label htmlFor="pf-student-dept">Department / Division</label>
                        <div className="rg-field">
                          <span className="rg-field-icon"><Briefcase size={16} /></span>
                          <input
                            id="pf-student-dept"
                            name="department"
                            type="text"
                            placeholder="e.g. Computer Science & Engineering"
                            value={editedProfile.department}
                            onChange={handleInputChange}
                            className="rg-field-input"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div className="rg-form-group"><label htmlFor="profile-registration-id">Registration ID</label><input id="profile-registration-id" name="registration_id" className="rg-field-input" maxLength={80} value={editedProfile.registration_id || ''} onChange={handleInputChange} /></div>
<div className="rg-form-group">
                        <label htmlFor="pf-student-phone">Contact Phone</label>
                        <div className="rg-field">
                          <span className="rg-field-icon"><Phone size={16} /></span>
                          <input
                            id="pf-student-phone"
                            name="phone"
                            type="tel"
                            placeholder="e.g. +1 (555) 234-5678"
                            value={editedProfile.phone}
                            onChange={handleInputChange}
                            className={`rg-field-input ${validationErrors.phone ? 'error' : ''}`}
                            autoComplete="off"
                          />
                        </div>
                        {validationErrors.phone && (
                          <span className="error-text">{validationErrors.phone}</span>
                        )}
                      </div>
                    </div>

                    <div className="pf-form-actions">
                      <button
                        type="submit"
                        className="rg-btn-submit pf-btn-save"
                        disabled={saving}
                      >
                        <Check size={16} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                      </button>
                      <button
                        type="button"
                        className="pf-btn-cancel"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="pf-view-grid">
                    <div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <User size={15} /> Full Legal Name
                      </span>
                      <span className="pf-tile-value">{profile.full_name || '-'}</span>
                    </div>

                    <div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Mail size={15} /> Email Address
                      </span>
                      <span className="pf-tile-value">{profile.email || '-'}</span>
                    </div>

                    <div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Briefcase size={15} /> Academic Department
                      </span>
                      <span className="pf-tile-value">{profile.department || 'Not Specified'}</span>
                    </div>

                    <div className="pf-info-tile"><span className="pf-tile-label">Registration ID</span><span className="pf-tile-value">{profile.registration_id || 'Not provided'}</span></div>
<div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Phone size={15} /> Primary Contact Phone
                      </span>
                      <span className="pf-tile-value">{profile.phone || 'Not Specified'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <FloatingFeedbackButton />

    </>
  );
};

export default StudentProfile;

import {apiFetch,apiResponseError} from '../config/api';
import {usePageLoading} from '../components/LoadingState';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import StudentHeader from '../components/StudentHeader';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { useSectionEnter } from '../hooks/effects';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/profile.css';

// ── Role badge helper ────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    student: { label: 'Student',       cls: 'um-badge um-badge--student' },
    faculty: { label: 'Faculty',       cls: 'um-badge um-badge--faculty' },
    admin:   { label: 'Administrator', cls: 'um-badge um-badge--admin' },
  };
  const { label, cls } = map[role] || { label: role || 'Unknown', cls: 'um-badge' };
  return <span className={cls}>{label}</span>;
}

// ── Icon Input ───────────────────────────────────────────────────────────────
function IconInput({
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  required,
  readOnly,
}) {
  return (
    <div className="rg-field">
      <span className="rg-field-icon">{icon}</span>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        className="rg-field-input"
        autoComplete="off"
        style={readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
      />
    </div>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Profile: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  HeaderUser: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M3 21h18M9 21V7l6-4v18M9 12h6"/>
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    role: '',
    department: '',
    phone: '',
        registration_id: '',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: '',
        registration_id: '',
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const response = await apiFetch(API_ENDPOINTS.PROFILE, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw await apiResponseError(response,'Unable to load your profile.');
        }

        const data = await response.json();

        if (data.success && data.data && data.data.user) {
          const userData = data.data.user;
          setProfile(userData);
          setEditForm({
            full_name: userData.full_name || '',
            email: userData.email || '',
            department: userData.department || '',
            phone: userData.phone || '',
        registration_id: userData.registration_id || '',
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
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile information');
      }

      setProfile((prev) => ({
        ...prev,
        ...editForm,
      }));
      
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3500);
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
      phone: profile.phone || '',
        registration_id: profile.registration_id || '',
    });
    setEditing(false);
    setError(null);
  };

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin' || profile.role === 'admin';
  const initial = (profile.full_name || currentUser?.full_name || 'U').charAt(0).toUpperCase();

  useSectionEnter();

  return (
    <>
      {isAdmin ? <AdminHeader /> : <StudentHeader />}
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="pf-page" data-section-content>

          {/* ── Page Hero ── */}
          <div className="pf-hero">
            <div className="pf-hero-left">
              <div className="pf-hero__icon">
                <Icons.Profile />
              </div>
              <div>
                <h1 className="pf-hero__title">Account Profile</h1>
                <p className="pf-hero__sub">
                  Manage your personal credentials, departmental affiliation, and security settings.
                </p>
              </div>
            </div>

            {!editing && (
              <button
                type="button"
                className="pf-btn-edit"
                onClick={() => setEditing(true)}
              >
                <Icons.Edit /> Edit Profile
              </button>
            )}
          </div>

          {/* ── Feedback Banners ── */}
          {error && (
            <div className="pf-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="pf-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
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

              <h2 className="pf-name">{profile.full_name || 'Institutional User'}</h2>
              <p className="pf-email-sub">{profile.email}</p>

              <RoleBadge role={profile.role} />

              <div className="pf-identity-divider" />

              <div className="pf-meta-list">
                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Icons.Shield /> Access Level
                  </span>
                  <span className="pf-meta-val" style={{ textTransform: 'capitalize' }}>
                    {profile.role || 'Member'}
                  </span>
                </div>

                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Icons.Building /> Department
                  </span>
                  <span className="pf-meta-val">
                    {profile.department || 'General Faculty'}
                  </span>
                </div>

                <div className="pf-meta-item">
                  <span className="pf-meta-label">
                    <Icons.Check /> Account Status
                  </span>
                  <span className="pf-meta-val" style={{ color: '#4ade80' }}>
                    Verified Active
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Profile Information / Edit Form Card */}
            <div className="pf-card">
              <div className="pf-card__header">
                <div className="pf-card__header-left">
                  <div className="pf-card__header-icon">
                    <Icons.HeaderUser />
                  </div>
                  <div>
                    <h2 className="pf-card__title">
                      {editing ? 'Update Account Credentials' : 'Profile Specifications'}
                    </h2>
                    <p className="pf-card__sub">
                      {editing
                        ? 'Modify your identity details and departmental contacts below.'
                        : 'Official university contact details registered with the system.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pf-card-body">
                {editing ? (
                  <form onSubmit={handleSave} className="pf-edit-form">
                    <div className="rg-section-divider">
                      <span>Personal Information</span>
                    </div>

                    <div className="pf-form-grid">
                      <div className="rg-form-group">
                        <label htmlFor="pf-name">Full Name</label>
                        <IconInput
                          id="pf-name"
                          name="full_name"
                          value={editForm.full_name}
                          onChange={handleInputChange}
                          icon={<Icons.User />}
                          required
                        />
                      </div>

                      <div className="rg-form-group">
                        <label htmlFor="pf-email">Email Address</label>
                        <IconInput
                          id="pf-email"
                          name="email"
                          type="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          icon={<Icons.Mail />}
                          required
                        />
                      </div>
                    </div>

                    <div className="rg-section-divider">
                      <span>Affiliation & Contact</span>
                    </div>

                    <div className="pf-form-grid">
                      <div className="rg-form-group">
                        <label htmlFor="pf-dept">Department / Division</label>
                        <IconInput
                          id="pf-dept"
                          name="department"
                          placeholder="e.g. Computer Science & Engineering"
                          value={editForm.department}
                          onChange={handleInputChange}
                          icon={<Icons.Building />}
                        />
                      </div>

                      <div className="rg-form-group"><label htmlFor="profile-registration-id">Registration ID</label><input id="profile-registration-id" name="registration_id" className="rg-field-input" maxLength={80} value={editForm.registration_id || ''} onChange={handleInputChange} /></div>
<div className="rg-form-group">
                        <label htmlFor="pf-phone">Phone Number</label>
                        <IconInput
                          id="pf-phone"
                          name="phone"
                          type="tel"
                          placeholder="e.g. +1 (555) 234-5678"
                          value={editForm.phone}
                          onChange={handleInputChange}
                          icon={<Icons.Phone />}
                        />
                      </div>
                    </div>

                    <div className="pf-form-actions">
                      <button type="submit" className="rg-btn-submit pf-btn-save">
                        <Icons.Save /> Save Profile Changes
                      </button>
                      <button type="button" className="pf-btn-cancel" onClick={handleCancel}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="pf-view-grid">
                    <div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Icons.User /> Full Legal Name
                      </span>
                      <span className="pf-tile-value">{profile.full_name || '-'}</span>
                    </div>

                    <div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Icons.Mail /> Email Address
                      </span>
                      <span className="pf-tile-value">{profile.email || '-'}</span>
                    </div>

                    <div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Icons.Building /> Academic Department
                      </span>
                      <span className="pf-tile-value">{profile.department || 'Not Assigned'}</span>
                    </div>

                    <div className="pf-info-tile"><span className="pf-tile-label">Registration ID</span><span className="pf-tile-value">{profile.registration_id || 'Not provided'}</span></div>
<div className="pf-info-tile">
                      <span className="pf-tile-label">
                        <Icons.Phone /> Primary Contact Phone
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
      
    </>
  );
}

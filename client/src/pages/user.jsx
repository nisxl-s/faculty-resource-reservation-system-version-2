import React, { useState, useRef } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Edit3, Save, X, Camera } from 'lucide-react';
import "../css/user.css";

// Main User Profile Component
const UserProfile = () => {
  // State for managing view mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  // User profile data
  const [profileData, setProfileData] = useState({
    name: 'Mr. Sanjaya Fernando',
    email: 'sanjaya@gmail.com',
    id: 'LEC-2024-062',
    status: 'Lecturer',
    faculty: 'Computing',
    department: 'Computer Science',
    year: 'Assistant Professor',
    phone: '077-9312234'
  });

  // Edit form data
  const [editData, setEditData] = useState({...profileData});
  const fileInputRef = useRef(null);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes
  const handleSave = () => {
    // Basic validation
    if (!editData.name || !editData.email || !editData.id || !editData.status || !editData.faculty || !editData.department) {
      alert('Please fill in all required fields');
      return;
    }
    
    setProfileData({...editData});
    setIsEditMode(false);
    alert('Profile updated successfully!');
  };

  // Cancel editing
  const handleCancel = () => {
    setEditData({...profileData});
    setIsEditMode(false);
  };

  return (
    <div className="background">
    <div className="user-profile">
      {!isEditMode ? (
        // Profile View
        <div className="profile-view">
          <div className="profile-header">
            <div className="profile-photo-container">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-placeholder">
                  <User size={48} />
                </div>
              )}
            </div>
            <h1 className="profile-name">{profileData.name}</h1>
            <span className="profile-status">{profileData.status}</span>
          </div>

          <div className="profile-content">
            <div className="info-grid">
              <div className="info-item">
                <Mail className="info-icon" size={20} />
                <div>
                  <div className="info-label">Email Address</div>
                  <div className="info-value">{profileData.email}</div>
                </div>
              </div>
              
              <div className="info-item">
                <User className="info-icon" size={20} />
                <div>
                  <div className="info-label">Student/Staff ID</div>
                  <div className="info-value">{profileData.id}</div>
                </div>
              </div>
              
              <div className="info-item">
                <Building className="info-icon" size={20} />
                <div>
                  <div className="info-label">Faculty</div>
                  <div className="info-value">{profileData.faculty}</div>
                </div>
              </div>
              
              <div className="info-item">
                <GraduationCap className="info-icon" size={20} />
                <div>
                  <div className="info-label">Department</div>
                  <div className="info-value">{profileData.department}</div>
                </div>
              </div>
              
              <div className="info-item">
                <GraduationCap className="info-icon" size={20} />
                <div>
                  <div className="info-label">Academic Year</div>
                  <div className="info-value">{profileData.year}</div>
                </div>
              </div>
              
              <div className="info-item">
                <Phone className="info-icon" size={20} />
                <div>
                  <div className="info-label">Phone Number</div>
                  <div className="info-value">{profileData.phone}</div>
                </div>
              </div>
            </div>
            
            <button 
              className="edit-btn"
              onClick={() => setIsEditMode(true)}
            >
              <Edit3 size={20} />
              Edit Profile
            </button>
          </div>
        </div>
      
      ) : (
        // Edit Profile View
        <div className="edit-profile">
          <div className="edit-header">
            <h1>Edit Profile</h1>
            <p>Update your profile information below</p>
          </div>

          <div className="edit-form">
            {/* Photo Upload */}
            <div className="photo-upload-section">
              <div className="current-photo">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" />
                ) : (
                  <div className="photo-placeholder">
                    <User size={40} />
                  </div>
                )}
              </div>
              
              <div className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                <Camera size={20} />
                <div>
                  <div className="upload-title">Upload Photo</div>
                  <div className="upload-subtitle">Click to select image</div>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Form Fields */}
            <div className="form-grid">
              <div className="form-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-field">
                <label>Student/Staff ID *</label>
                <input
                  type="text"
                  value={editData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-field">
                <label>Status *</label>
                <select
                  value={editData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Student">Student</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Professor">Professor</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Researcher">Researcher</option>
                </select>
              </div>
              
              <div className="form-field">
                <label>Faculty *</label>
                <select
                  value={editData.faculty}
                  onChange={(e) => handleInputChange('faculty', e.target.value)}
                  required
                >
                  <option value="">Select Faculty</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Arts & Sciences">Arts & Sciences</option>
                  <option value="Computing">Computing</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Law">Law</option>
                  <option value="Education">Education</option>
                  <option value="Agriculture">Agriculture</option>
                </select>
              </div>
              
              <div className="form-field">
                <label>Department *</label>
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-field">
                <label>Academic Year/Position</label>
                <select
                  value={editData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                >
                  <option value="">Select Year/Position</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="PhD">PhD</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                </select>
              </div>
              
              <div className="form-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                <X size={20} />
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
              >
                <Save size={20} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default UserProfile;
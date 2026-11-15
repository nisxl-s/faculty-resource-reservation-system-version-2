import {usePageLoading} from '../components/LoadingState';
import { useEventCallback } from '../hooks/useEventCallback';
import { fetchList } from '../config/api';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';
import { useSectionEnter } from '../hooks/effects';
import { useConfirm } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import '../assets/css/admin.css';
import '../assets/css/global.css';
import '../assets/css/user_management.css';

// ── Role option data ─────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'admin',   label: 'Administrator' },
];

// ── Role privileges descriptions ─────────────────────────────────────────────
const ROLE_PRIVILEGES = {
  student: {
    title: 'Student Privileges',
    badgeClass: 'um-badge um-badge--student',
    label: 'Student',
    items: [
      'Browse faculty resource inventory',
      'Check room schedules & availability',
      'Submit booking requests for study spaces & kits',
      'Track reservation request statuses',
    ],
  },
  faculty: {
    title: 'Faculty Privileges',
    badgeClass: 'um-badge um-badge--faculty',
    label: 'Faculty',
    items: [
      'Priority scheduling for lectures & seminars',
      'Reserve specialized laboratories & conference halls',
      'Multi-slot & recurring reservation capabilities',
      'Automated reservation verification',
    ],
  },
  admin: {
    title: 'Administrator Privileges',
    badgeClass: 'um-badge um-badge--admin',
    label: 'Administrator',
    items: [
      'Complete administrative governance',
      'Create, edit, and revoke user credentials',
      'Resource catalog management & maintenance logs',
      'Review and decide on reservation requests',
    ],
  },
};

// ── Custom Select (Matching RegisterPage & ResourceManagement) ───────────────
function CustomSelect({ id, value, onChange, placeholder = 'Select…', options = [], icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  function pick(opt) {
    onChange(opt.value);
    setOpen(false);
  }

  return (
    <div className={`rg-select${open ? ' rg-select--open' : ''}`} ref={ref}>
      <button id={id}
        type="button"
        className={`rg-select__trigger${!selected ? ' rg-select__trigger--placeholder' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="rg-field-icon">{icon}</span>
        <span className="rg-select__label">{selected ? selected.label : placeholder}</span>
        <span className={`rg-select__chevron${open ? ' rg-select__chevron--up' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <ul className="rg-select__menu" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`rg-select__option${opt.value === value ? ' rg-select__option--active' : ''}`}
              onClick={() => pick(opt)}
            >
              <span className="rg-select__option-dot" />
              {opt.label}
              {opt.value === value && (
                <span className="rg-select__check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
  rightAction,
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
        value={value}
        onChange={onChange}
        className="rg-field-input"
        autoComplete="off"
      />
      {rightAction && (
        <div className="rg-field-btn">
          {rightAction}
        </div>
      )}
    </div>
  );
}

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

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Add: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Delete: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

const UserManagement = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);

  // Fetch users from backend
  const fetchData = useEventCallback(async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate('/login');
        return;
      }

      const usersRes = await fetchList(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });
      const usersData = await usersRes.json();
      
      let usersList = [];
      if (usersData.data && usersData.data.users && Array.isArray(usersData.data.users)) {
        usersList = usersData.data.users;
      } else if (usersData.data && Array.isArray(usersData.data)) {
        usersList = usersData.data;
      } else if (Array.isArray(usersData)) {
        usersList = usersData;
      }
      setUsers(usersList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('student');
    setEditingId(null);
    setFormError('');
  };

  const addUser = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name || !email) {
      setFormError('Please provide both full name and email address.');
      return;
    }

    if (!editingId && !password) {
      setFormError('Please enter a password for the new user account.');
      return;
    }
    
    if (password && password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      const response = await fetch(
        editingId ? API_ENDPOINTS.USER_BY_ID(editingId) : API_ENDPOINTS.USER_CREATE,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ 
            full_name: name, 
            email, 
            role,
            ...(password ? { password } : {})
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to save user');
      }
      
      const successText = editingId ? 'User account updated successfully!' : 'New user created successfully!';
      setFormSuccess(successText);
      setTimeout(() => setFormSuccess(''), 4000);

      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save user');
    }
  };

  const editUser = (user) => {
    const id = user.id || user.user_id;
    setEditingId(id);
    setName(user.full_name || '');
    setEmail(user.email || '');
    setRole(user.role || 'student');
    setPassword('');
    setFormError('');
    setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    resetForm();
  };

  const deleteUser = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete User Account',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      variant: 'danger',
      iconType: 'trash'
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(id), { 
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to delete user');
      }
      
      showToast('User deleted successfully.', 'success');
      setFormSuccess('User deleted successfully.');
      setTimeout(() => setFormSuccess(''), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user: ' + err.message, 'error');
      setFormError('Failed to delete user: ' + err.message);
    }
  };

  // Filtered users for real-time table search
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = (u.full_name || '').toLowerCase();
    const userEmail = (u.email || '').toLowerCase();
    const userRole = (u.role || '').toLowerCase();
    return fullName.includes(q) || userEmail.includes(q) || userRole.includes(q);
  });

  const activePrivileges = ROLE_PRIVILEGES[role] || ROLE_PRIVILEGES.student;

  useSectionEnter();

  return (
    <>
      <AdminHeader />
      <main className="admin-dashboard" style={{ paddingTop: '130px' }}>
        <section className="um-page" data-section-content>

          {/* ── Page Hero ── */}
          <div className="um-hero">
            <div className="um-hero__icon">
              <Icons.Users />
            </div>
            <div>
              <h1 className="um-hero__title">User Management</h1>
              <p className="um-hero__sub">Create, update, and manage student, faculty, and administrator accounts.</p>
            </div>
          </div>

          {/* ── Feedback Banners ── */}
          {formError && (
            <div className="um-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="um-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {formSuccess}
            </div>
          )}

          {/* ── Form Card ── */}
          <div className="um-card">
            <div className="um-card__header">
              <div className="um-card__header-icon">
                {editingId ? <Icons.Save /> : <Icons.Add />}
              </div>
              <div>
                <h2 className="um-card__title">{editingId ? 'Edit User Account' : 'Add New User'}</h2>
                <p className="um-card__sub">
                  {editingId ? 'Update user credentials and role permissions below.' : 'Register a new institutional user with designated permissions.'}
                </p>
              </div>
            </div>

            <form onSubmit={addUser} id="umForm">
              <div className="um-form-grid">

                {/* Section 1: Identity & Contact */}
                <div className="um-form-section">
                  <div className="rg-section-divider"><span>Identity & Contact</span></div>
                  <div className="rg-form-group">
                    <label htmlFor="user-name">Full Name</label>
                    <IconInput
                      id="user-name"
                      name="name"
                      placeholder="e.g. Dr. Eleanor Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      icon={<Icons.User />}
                      required
                    />
                  </div>
                  <div className="rg-form-group">
                    <label htmlFor="user-email">Email Address</label>
                    <IconInput
                      id="user-email"
                      name="email"
                      type="email"
                      placeholder="e.g. user@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={<Icons.Mail />}
                      required
                    />
                  </div>
                </div>

                {/* Section 2: Credentials & Access */}
                <div className="um-form-section">
                  <div className="rg-section-divider"><span>Credentials & Access</span></div>
                  <div className="rg-form-group">
                    <label htmlFor="user-password">
                      Password {editingId ? '(Leave blank to keep)' : ''}
                    </label>
                    <IconInput
                      id="user-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingId ? 'Enter new password to change' : 'Min. 6 characters'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Icons.Lock />}
                      required={!editingId}
                      rightAction={
                        <span 
                          onClick={() => setShowPassword(!showPassword)} 
                          title={showPassword ? 'Hide password' : 'Show password'}
                          style={{ cursor: 'pointer' }}
                        >
                          {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                        </span>
                      }
                    />
                  </div>
                  <div className="rg-form-group">
                    <label htmlFor="user_management-field-1">Account Role</label>
                    <CustomSelect id="user_management-field-1"
                      value={role}
                      onChange={(val) => setRole(val)}
                      placeholder="Select user role"
                      options={ROLE_OPTIONS}
                      icon={<Icons.Shield />}
                    />
                  </div>
                </div>

                {/* Section 3: Role Privileges Preview */}
                <div className="um-form-section">
                  <div className="rg-section-divider"><span>Role Privileges</span></div>
                  <div className="um-role-info-card">
                    <div>
                      <div className="um-role-info-header">
                        <span className="um-role-info-label">{activePrivileges.title}</span>
                        <span className={activePrivileges.badgeClass}>{activePrivileges.label}</span>
                      </div>
                      <ul className="um-role-info-list">
                        {activePrivileges.items.map((item, idx) => (
                          <li key={idx} className="um-role-info-item">
                            <Icons.Check />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Action Buttons */}
              <div className="um-form-actions um-full-width">
                <button type="submit" className="rg-btn-submit um-btn-save">
                  {editingId ? <Icons.Save /> : <Icons.Add />}
                  {editingId ? 'Save Changes' : 'Create User'}
                </button>
                {editingId && (
                  <button type="button" className="um-btn-cancel" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── Users Table Card ── */}
          <div className="um-card um-table-card">
            <div className="um-card__header">
              <div className="um-card__header-icon">
                <Icons.Users />
              </div>
              <div>
                <h2 className="um-card__title">Institutional Directory</h2>
                <p className="um-card__sub">
                  {users.length} registered user{users.length !== 1 ? 's' : ''} in the system
                </p>
              </div>

              {/* Search filter in header */}
              <div className="um-table-header-controls">
                <div className="um-search-wrap">
                  <span className="um-search-icon">
                    <Icons.Search />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name, email, or role…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="um-search-input"
                  />
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="um-empty">
                <Icons.Users />
                <p>
                  {users.length === 0
                    ? 'No registered users found. Create the first user above.'
                    : 'No users match your search criteria.'}
                </p>
              </div>
            ) : (
              <div className="um-table-wrap">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email Address</th>
                      <th>Assigned Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const userId = u.id || u.user_id;
                      const initial = (u.full_name || 'U').charAt(0).toUpperCase();

                      return (
                        <tr key={userId}>
                          <td>
                            <div className="um-user-cell">
                              <div className="um-avatar">{initial}</div>
                              <span className="um-td-name">{u.full_name || 'Unnamed User'}</span>
                            </div>
                          </td>
                          <td className="um-td-email">{u.email}</td>
                          <td>
                            <RoleBadge role={u.role} />
                          </td>
                          <td>
                            <div className="um-actions">
                              <button
                                type="button"
                                className="um-btn-edit"
                                onClick={() => editUser(u)}
                                title="Edit user"
                              >
                                <Icons.Edit /> Edit
                              </button>
                              <button
                                type="button"
                                className="um-btn-delete"
                                onClick={() => deleteUser(userId)}
                                title="Delete user"
                              >
                                <Icons.Delete /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </section>
      </main>
      
    </>
  );
};

export default UserManagement;

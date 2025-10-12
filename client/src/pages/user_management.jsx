import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/user_management.css';
import '../assets/css/global.css';
import '../assets/css/navbar.css';
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/footer/Footer';
import { API_ENDPOINTS, getAuthHeaders, getCurrentUser } from '../config/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch users and bookings from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const user = getCurrentUser();
      if (!user || user.role !== 'admin') {
        navigate('/login');
        return;
      }

      const usersRes = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });
      const usersData = await usersRes.json();
      console.log('Users data:', usersData);
      
      // Handle nested response structure
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
      console.error('Error fetching data:', err);
      setUsers([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addUser = async () => {
    if (!name || !email || !password) {
      setFormError('Please enter name, email, and password.');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          full_name: name, 
          email, 
          password,
          role 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }
      
      setName('');
      setEmail('');
      setPassword('');
      setFormError('');
      alert('User added successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to add user');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(id), { 
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      alert('User deleted successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="um-container" style={{paddingTop: '80px'}}>
        <h1>User Management</h1>

        {loading ? (
          <div className="loading-spinner">
            <h3>Loading users...</h3>
          </div>
        ) : (
          <>
            <div className="add-user-box">
              <h2>Add New User</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="user-name">Full Name</label>
                  <input 
                    id="user-name"
                    type="text" 
                    placeholder="Enter full name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-email">Email Address</label>
                  <input 
                    id="user-email"
                    type="email" 
                    placeholder="Enter email address" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-password">Password</label>
                  <input 
                    id="user-password"
                    type="password" 
                    placeholder="Min. 6 characters" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-role">User Role</label>
                  <div className="custom-select-wrapper">
                    <div 
                      className="custom-select-trigger" 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>{role === 'user' ? 'Regular User' : 'Administrator'}</span>
                      <span className="custom-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                    </div>
                    {isDropdownOpen && (
                      <div className="custom-select-options">
                        <div 
                          className={`custom-option ${role === 'user' ? 'selected' : ''} option-user`}
                          onClick={() => {
                            setRole('user');
                            setIsDropdownOpen(false);
                          }}
                        >
                          Regular User
                        </div>
                        <div 
                          className={`custom-option ${role === 'admin' ? 'selected' : ''} option-admin`}
                          onClick={() => {
                            setRole('admin');
                            setIsDropdownOpen(false);
                          }}
                        >
                          Administrator
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group button-group">
                  <button onClick={addUser} className="add-user-btn">
                    Add User
                  </button>
                </div>
              </div>
              {formError && <div className="form-error">{formError}</div>}
            </div>

            <div className="users-table">
              <h2>Users ({users.length})</h2>
              <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.length > 0 ? (
                users.map(u => (
                  <tr key={u.id || u.user_id}>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td><button className="delete-btn" onClick={() => deleteUser(u.id || u.user_id)}>Delete</button></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center'}}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default UserManagement;


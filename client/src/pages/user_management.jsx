import React, { useEffect, useState } from 'react';
import '../css/user_management.css';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [formError, setFormError] = useState('');

  // Fetch users and bookings from backend
  const fetchData = async () => {
    try {
      const usersRes = await fetch('http://localhost:5000/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData);

      const bookingsRes = await fetch('http://localhost:5000/api/bookings');
      const bookingsData = await bookingsRes.json();
      setReservations(bookingsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addUser = async () => {
    if (!name || !email) {
      setFormError('Please enter name and email.');
      return;
    }
    try {
      await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, role }),
      });
      setName('');
      setEmail('');
      setFormError('');
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError('Failed to add user');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="um-container">
        <h1>User Management</h1>

        <div className="add-user-box">
          <h2>Add New User</h2>
          <div className="form-row">
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={addUser}>Add User</button>
          </div>
          {formError && <div className="form-error">{formError}</div>}
        </div>

        <div className="users-table">
          <h2>Users</h2>
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
              {users.map(u => (
                <tr key={u.user_id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><button className="delete-btn" onClick={() => deleteUser(u.user_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="reservations-table">
          <h2>Reservations</h2>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Resource</th>
                <th>Faculty</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => {
                const user = users.find(u => u.email === r.email);
                if (!user) return null;
                return (
                  <tr key={r.id}>
                    <td>{user.full_name}</td>
                    <td>{r.resource}</td>
                    <td>{r.faculty}</td>
                    <td>{r.date}</td>
                    <td>{r.start_time} - {r.end_time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserManagement;


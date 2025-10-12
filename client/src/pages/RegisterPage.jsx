import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { API_ENDPOINTS } from '../config/api';
import uniLogo from '../assets/images/uni_logo.png';

// CSS (adjust paths to match your project)

import '../assets/css/navbar.css';
import '../assets/css/reg_styles.css';

export default function RegisterPage() {
	useNavbarEffects();
	useMobileNav();

	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [facultyId, setFacultyId] = useState('');
	const [department, setDepartment] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const navigate = useNavigate();

	async function onSubmit(e) {
		e.preventDefault();

		if (!fullName || !email || !facultyId || !department || !password || !confirmPassword) {
			alert('Please fill in all fields');
			return;
		}
		if (password !== confirmPassword) {
			alert('Passwords do not match');
			return;
		}
		if (password.length < 6) {
			alert('Password must be at least 6 characters long');
			return;
		}
		
		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			alert('Please enter a valid email address');
			return;
		}

		try {
			console.log('Attempting registration with:', {
				full_name: fullName,
				email: email,
				role: 'student',
				department: department,
				phone: facultyId
			});

			// Call the backend API
			const response = await fetch(API_ENDPOINTS.REGISTER, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					full_name: fullName,  // Changed from 'name' to 'full_name'
					email: email,
					password: password,
					role: 'student',  // Default to student for registration
					department: department,
					phone: facultyId  // Using phone field instead of faculty_id
				}),
			});

			const data = await response.json();
			console.log('Registration response:', data);

			if (response.ok && data.success) {
				alert('Registration successful! You can now login.');
				navigate('/login');
			} else {
				// Show detailed error message
				if (data.errors && Array.isArray(data.errors)) {
					const errorMessages = data.errors.map(err => err.msg).join('\n');
					alert('Registration failed:\n' + errorMessages);
				} else {
					alert(data.message || 'Registration failed. Please try again.');
				}
			}
		} catch (error) {
			console.error('Registration error:', error);
			alert('An error occurred during registration. Please try again.');
		}
	}

	return (
		<div>
			<header>
				<nav className="navbar" id="navbar">
					<img src={uniLogo} alt="Website Logo" width="90" height="90" />
					<div className="logo"><h3>Faculty Resources Reservation</h3></div>
					<ul className="nav-links" id="nav-links">
						<div className="nav-indicator" id="nav-indicator"></div>
						<li>
							<Link to="/" data-section="home" className="login-btn">Home</Link>
						</li>
					</ul>
					<div className="burger" id="burger">
						<div className="line1"></div>
						<div className="line2"></div>
						<div className="line3"></div>
					</div>
				</nav>
			</header>

			<main className="auth-container">
				<div className="auth-formRegister">
					<h1>Create an Account</h1>
					<div className="title-accent"></div>
					<form id="registerForm" onSubmit={onSubmit}>
						<div className="form-group">
							<label htmlFor="fullName">Full Name</label>
							<input type="text" id="fullName" name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
						</div>
						<div className="form-group">
							<label htmlFor="email">Email</label>
							<input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
						</div>
						<div className="form-group">
							<label htmlFor="facultyId">Registration No</label>
							<input type="text" id="facultyId" name="facultyId" required value={facultyId} onChange={(e) => setFacultyId(e.target.value)} />
						</div>
						<div className="form-group">
							<label htmlFor="department">Department</label>
							<select id="department" name="department" required value={department} onChange={(e) => setDepartment(e.target.value)}>
								<option value="">Select Department</option>
								<option value="computer_science">Computer Science</option>
								<option value="mathematics">Software Engineering</option>
								<option value="physics">Information Systems</option>
								<option value="chemistry">Other</option>
							</select>
						</div>
						<div className="form-group">
							<label htmlFor="password">Password</label>
							<input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
						<div className="form-group">
							<label htmlFor="confirmPassword">Confirm Password</label>
							<input type="password" id="confirmPassword" name="confirmPassword" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
						</div>
						<button type="submit" className="btn-primary">Register</button>
					</form>
					<div className="auth-footer">
						<p>Already have an account? <Link to="/login">Login here</Link></p>
					</div>
				</div>
			</main>

			<footer>
				<p>&copy; 2023 Faculty Resources Reservation System. All rights reserved.</p>
			</footer>
		</div>
	);
}
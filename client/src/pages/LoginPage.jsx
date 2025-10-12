import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { API_ENDPOINTS } from '../config/api';
import uniLogo from '../assets/images/uni_logo.png';

// CSS (adjust paths to match your project)
import '../assets/css/login_styles.css';
import '../assets/css/navbar.css';
import '../assets/css/global.css';
import '../assets/css/features.css';

export default function LoginPage() {
	useNavbarEffects();
	useMobileNav();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [remember, setRemember] = useState(false);
	const navigate = useNavigate();

	async function onSubmit(e) {
		e.preventDefault();
		if (!email || !password) {
			alert('Please fill in all fields');
			return;
		}

		try {
			// Call the backend API
			const response = await fetch(API_ENDPOINTS.LOGIN, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();
			
			console.log('Login response:', data); // Debug log

			if (response.ok && data.success) {
				// Backend returns data in data.data object
				const { token, user } = data.data;
				
				// Store token and user info
				localStorage.setItem('token', token);
				localStorage.setItem('user', JSON.stringify(user));

				alert('Login successful! Redirecting...');

				// Redirect based on user role
				if (user.role === 'admin') {
					navigate('/admin');
				} else if (user.role === 'faculty' || user.role === 'student') {
					navigate('/student');
				} else {
					navigate('/student');
				}
			} else {
				alert(data.message || 'Login failed. Please check your credentials.');
			}
		} catch (error) {
			console.error('Login error:', error);
			alert('An error occurred during login. Please try again.');
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
				<div className="auth-form">
					<h1>Login to Your Account</h1>
                    <div className="title-accent"></div>
					<form id="loginForm" onSubmit={onSubmit}>
						<div className="form-group">
							<label htmlFor="email">Email</label>
							<input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
						</div>
						<div className="form-group">
							<label htmlFor="password">Password</label>
							<input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
						<div className="form-options">
							<div className="remember-me">
								<input type="checkbox" id="remember" name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
								<label htmlFor="remember">Remember me</label>
							</div>
							<a href="ds.fogotpassword.html" className="forgot-password">Forgot password?</a>
						</div>
						<button type="submit" className="btn-primary">Login</button>
					</form>
					<div className="auth-footer">
						<p>Don't have an account? <Link to="/register">Register here</Link></p>
					</div>
				</div>
			</main>

			<footer>
				<p>&copy; 2025 Faculty Resources Reservation System. All rights reserved.</p>
			</footer>
		</div>
	);
}
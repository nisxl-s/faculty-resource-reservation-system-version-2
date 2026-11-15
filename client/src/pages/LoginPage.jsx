import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { API_ENDPOINTS } from '../config/api';
import { useToast } from '../components/common/Toast';
import AuthTransitionOverlay from '../components/common/AuthTransitionOverlay';
import PasswordInput from '../components/common/PasswordInput';
import uniLogo from '../assets/images/uni_logo.png';

// CSS
import '../assets/css/navbar.css';
import '../assets/css/global.css';
import '../assets/css/features.css';
import '../assets/css/login_styles.css';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconMail = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
	</svg>
);

const IconLock = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
	</svg>
);

const IconKey = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="7.5" cy="15.5" r="5.5"/>
		<path d="m21 2-9.6 9.6M15.5 7.5l3 3M17.5 5.5l2 2"/>
	</svg>
);

const IconAlertCircle = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
	</svg>
);

export default function LoginPage() {
	useNavbarEffects();
	useMobileNav();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [remember, setRemember] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showAccessGranted, setShowAccessGranted] = useState(false);
	const [transitionUser, setTransitionUser] = useState(null);
	const navigate = useNavigate();
	const { showToast } = useToast();

	const handleAccessGrantedComplete = () => {
		if (transitionUser?.role === 'admin') {
			navigate('/admin');
		} else {
			navigate('/student');
		}
	};

	async function onSubmit(e) {
		e.preventDefault();
		setErrorMessage('');

		if (!email || !password) {
			setErrorMessage('Please fill in all required fields.');
			return;
		}

		setLoading(true);

		try {
			// Call the backend API
			const response = await fetch(API_ENDPOINTS.LOGIN, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			let data;
			try {
				data = await response.json();
			} catch {
				data = {};
			}

			if (response.ok && data.success) {
				const { token, user } = data.data;
				
				localStorage.setItem('token', token);
				localStorage.setItem('user', JSON.stringify(user));

				showToast(`Welcome back, ${user.full_name || 'User'}!`, 'success');
				setTransitionUser(user);
				setShowAccessGranted(true);
			} else {
				setErrorMessage(data.message || (response.status ? `Server error (${response.status}). Please check credentials or try again.` : 'Login failed. Please check your credentials.'));
			}
		} catch (error) {
			console.error('Login error:', error);
			const isNetworkError = !error.message || error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('networkerror');
			setErrorMessage(
				isNetworkError
					? 'Cannot connect to backend server. Please make sure the backend is running on port 5000.'
					: error.message
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-page-root">
			{showAccessGranted ? (
				<AuthTransitionOverlay
					type="access_granted"
					userName={transitionUser?.full_name}
					role={transitionUser?.role}
					duration={2200}
					onComplete={handleAccessGrantedComplete}
				/>
			) : (
				<>
					<header>
						<nav className="navbar" id="navbar">
							<Link to="/" className="nav-brand-group" aria-label="Faculty Resources Reservation System home">
								<img src={uniLogo} alt="University of Sri Jayewardenepura Logo" width="94" height="94" className="nav-logo-img" />
								<div className="logo">
									<h3>Faculty Resources Reservation</h3>
									<span>University of Sri Jayewardenepura</span>
								</div>
							</Link>
							<ul className="nav-links" id="nav-links">
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
						<div className="auth-formLogin">
							{/* Header */}
							<div className="lg-header">
								<div className="lg-header-icon">
									<IconKey />
								</div>
								<h1>Welcome Back</h1>
								<p className="lg-subtitle">Sign in to access your reservation dashboard</p>
							</div>

							{/* Error Banner */}
							{errorMessage && (
								<div className="lg-error-banner" role="alert">
									<IconAlertCircle />
									<span>{errorMessage}</span>
								</div>
							)}

							{/* Form */}
							<form id="loginForm" onSubmit={onSubmit} noValidate>
								{/* Email */}
								<div className="lg-form-group">
									<label htmlFor="email">Email Address</label>
									<div className="lg-field">
										<span className="lg-field-icon"><IconMail /></span>
										<input
											type="email"
											id="email"
											name="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="you@example.com"
											className="lg-field-input"
											autoComplete="email"
										/>
									</div>
								</div>

								{/* Password */}
								<div className="lg-form-group">
									<label htmlFor="password">Password</label>
									<div className="lg-field">
										<span className="lg-field-icon"><IconLock /></span>
										<PasswordInput
											id="password"
											name="password"
											required
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="••••••••••••"
											className="lg-field-input"
											autoComplete="current-password"
										/>
									</div>
								</div>

								{/* Options: Remember & Forgot */}
								<div className="lg-form-options">
									<label className="lg-remember-me">
										<input
											type="checkbox"
											id="remember"
											name="remember"
											checked={remember}
											onChange={(e) => setRemember(e.target.checked)}
										/>
										<span className="lg-checkbox-custom" />
										<span className="lg-remember-text">Remember me</span>
									</label>
									<Link to="/forgot-password" className="lg-forgot-password">
										Forgot password?
									</Link>
								</div>

								{/* Submit button */}
								<button
									type="submit"
									className="lg-btn-submit"
									disabled={loading}
									id="loginSubmitBtn"
								>
									{loading ? (
										<span>Signing In…</span>
									) : (
										<span>Sign In</span>
									)}
								</button>
							</form>

							{/* Footer link */}
							<div className="auth-footer">
								<p>
									Do not have an account?{' '}
									<Link to="/register">Create an account</Link>
								</p>
							</div>
						</div>
					</main>

					
				</>
			)}
		</div>
	);
}

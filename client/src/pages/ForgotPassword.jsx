import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { API_ENDPOINTS } from '../config/api';
import { useToast } from '../components/common/Toast';
import uniLogo from '../assets/images/uni_logo.png';

// CSS
import '../assets/css/navbar.css';
import '../assets/css/global.css';
import '../assets/css/features.css';
import '../assets/css/login_styles.css';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconMail = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
		<polyline points="22,6 12,13 2,6" />
	</svg>
);

const IconKeyRound = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
		<circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
	</svg>
);

const IconAlertCircle = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
	</svg>
);

const IconCheckCircle = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
		<polyline points="22 4 12 14.01 9 11.01" />
	</svg>
);

export default function ForgotPassword() {
	useNavbarEffects();
	useMobileNav();

	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const { showToast } = useToast();

	async function onSubmit(e) {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');

		if (!email.trim()) {
			setErrorMessage('Please enter your email address.');
			showToast('Please enter your email address.', 'warning');
			return;
		}

		setLoading(true);

		try {
			const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: email.trim() }),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				const successText = data.message || 'Password reset link has been dispatched to your email.';
				setSuccessMessage(successText);
				showToast(successText, 'success');
				setEmail('');
			} else {
				const errorText = data.message || 'Failed to request password reset. Please try again.';
				setErrorMessage(errorText);
				showToast(errorText, 'error');
			}
		} catch (error) {
			console.error('Forgot password error:', error);
			const connError = 'A connection error occurred. Please check your network and try again.';
			setErrorMessage(connError);
			showToast(connError, 'error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-page-root">
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
							<IconKeyRound />
						</div>
						<h1>Reset Password</h1>
						<p className="lg-subtitle">
							Enter your registered email address to receive a password reset link
						</p>
					</div>

					{/* Error Banner */}
					{errorMessage && (
						<div className="lg-error-banner" role="alert">
							<IconAlertCircle />
							<span>{errorMessage}</span>
						</div>
					)}

					{/* Success Banner */}
					{successMessage && (
						<div className="lg-success-banner" role="status">
							<IconCheckCircle />
							<span>{successMessage}</span>
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
									disabled={loading}
								/>
							</div>
						</div>

						{/* Submit button */}
						<button
							type="submit"
							className="lg-btn-submit"
							disabled={loading}
							id="forgotSubmitBtn"
							style={{ marginTop: '8px' }}
						>
							{loading ? (
								<span>Sending Reset Link…</span>
							) : (
								<span>Send Reset Link</span>
							)}
						</button>
					</form>

					{/* Footer link */}
					<div className="auth-footer">
						<p>
							Remember your password?{' '}
							<Link to="/login">Sign In</Link>
						</p>
					</div>
				</div>
			</main>


		</div>
	);
}

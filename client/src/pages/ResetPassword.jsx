import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
const IconLock = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
		<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
	</svg>
);

const IconCheckCircle = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
		<polyline points="22 4 12 14.01 9 11.01"/>
	</svg>
);

const IconAlertCircle = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
	</svg>
);

const IconShieldCheck = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
		<path d="m9 12 2 2 4-4"/>
	</svg>
);

const IconEye = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
		<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
		<circle cx="12" cy="12" r="3"/>
	</svg>
);

const IconEyeOff = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
		<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
		<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
		<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
		<line x1="2" y1="2" x2="22" y2="22"/>
	</svg>
);

export default function ResetPassword() {
	useNavbarEffects();
	useMobileNav();

	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') || '';
	const navigate = useNavigate();

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [redirectCountdown, setRedirectCountdown] = useState(3);
	const { showToast } = useToast();

	useEffect(() => {
		if (!token) {
			setErrorMessage('Password reset link is missing a valid token. Please request a new link.');
		}
	}, [token]);

	useEffect(() => {
		let timer;
		if (successMessage && redirectCountdown > 0) {
			timer = setTimeout(() => {
				setRedirectCountdown((prev) => prev - 1);
			}, 1000);
		} else if (successMessage && redirectCountdown === 0) {
			navigate('/login');
		}
		return () => clearTimeout(timer);
	}, [successMessage, redirectCountdown, navigate]);

	async function onSubmit(e) {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');

		if (!token) {
			setErrorMessage('Invalid reset link. Please request a new reset token.');
			showToast('Invalid reset link. Please request a new reset token.', 'error');
			return;
		}

		if (!newPassword || !confirmPassword) {
			setErrorMessage('Please fill in both password fields.');
			showToast('Please fill in both password fields.', 'warning');
			return;
		}

		if (newPassword.length < 6) {
			setErrorMessage('New password must be at least 6 characters long.');
			showToast('New password must be at least 6 characters long.', 'warning');
			return;
		}

		if (newPassword !== confirmPassword) {
			setErrorMessage('Passwords do not match. Please re-enter them carefully.');
			showToast('Passwords do not match. Please re-enter them carefully.', 'error');
			return;
		}

		setLoading(true);

		try {
			const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token,
					newPassword,
				}),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				const successMsg = data.message || 'Password has been reset successfully!';
				setSuccessMessage(successMsg);
				showToast(successMsg, 'success');
			} else {
				const errMsg = data.message || 'Failed to reset password. The link may have expired.';
				setErrorMessage(errMsg);
				showToast(errMsg, 'error');
			}
		} catch (error) {
			console.error('Reset password error:', error);
			const errNetwork = 'A connection error occurred. Please try again.';
			setErrorMessage(errNetwork);
			showToast(errNetwork, 'error');
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
							<IconShieldCheck />
						</div>
						<h1>Set New Password</h1>
						<p className="lg-subtitle">
							Create a strong password for your faculty reservation account
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
							<span>{successMessage} Redirecting to login in {redirectCountdown}s…</span>
						</div>
					)}

					{/* Form */}
					{!successMessage ? (
						<form id="loginForm" onSubmit={onSubmit} noValidate>
							{/* New Password */}
							<div className="lg-form-group">
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<label htmlFor="newPassword">New Password</label>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										style={{
											background: 'none',
											border: 'none',
											color: 'rgba(148, 163, 184, 0.8)',
											cursor: 'pointer',
											display: 'inline-flex',
											alignItems: 'center',
											gap: '4px',
											fontSize: '0.75rem',
											padding: 0
										}}
									>
										{showPassword ? <IconEyeOff /> : <IconEye />}
										<span>{showPassword ? 'Hide' : 'Show'}</span>
									</button>
								</div>
								<div className="lg-field">
									<span className="lg-field-icon"><IconLock /></span>
									<input
										type={showPassword ? 'text' : 'password'}
										id="newPassword"
										name="newPassword"
										required
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="At least 6 characters"
										className="lg-field-input"
										autoComplete="new-password"
										disabled={loading || !token}
									/>
								</div>
							</div>

							{/* Confirm Password */}
							<div className="lg-form-group">
								<label htmlFor="confirmPassword">Confirm New Password</label>
								<div className="lg-field">
									<span className="lg-field-icon"><IconLock /></span>
									<input
										type={showPassword ? 'text' : 'password'}
										id="confirmPassword"
										name="confirmPassword"
										required
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Re-enter your new password"
										className="lg-field-input"
										autoComplete="new-password"
										disabled={loading || !token}
									/>
								</div>
							</div>

							{/* Submit button */}
							<button
								type="submit"
								className="lg-btn-submit"
								disabled={loading || !token}
								id="resetSubmitBtn"
								style={{ marginTop: '8px' }}
							>
								{loading ? (
									<span>Updating Password…</span>
								) : (
									<span>Update Password</span>
								)}
							</button>
						</form>
					) : (
						<div style={{ padding: '24px 28px 0', textAlign: 'center' }}>
							<button
								type="button"
								className="lg-btn-submit"
								onClick={() => navigate('/login')}
							>
								Sign In Now
							</button>
						</div>
					)}

					{/* Footer link */}
					<div className="auth-footer">
						<p>
							Need to request a new link?{' '}
							<Link to="/forgot-password">Forgot Password</Link>
						</p>
					</div>
				</div>
			</main>

			
		</div>
	);
}

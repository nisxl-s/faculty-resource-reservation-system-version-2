import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNavbarEffects, useMobileNav } from '../hooks/effects';
import { API_ENDPOINTS } from '../config/api';
import { useToast } from '../components/common/Toast';
import AuthTransitionOverlay from '../components/common/AuthTransitionOverlay';
import PasswordInput from '../components/common/PasswordInput';
import uniLogo from '../assets/images/uni_logo.png';

import '../assets/css/navbar.css';
import '../assets/css/reg_styles.css';

// ── Custom Dropdown ──────────────────────────────────────────────────────────
const departments = [
	{ value: 'computer_science',  label: 'Computer Science' },
	{ value: 'mathematics',       label: 'Software Engineering' },
	{ value: 'physics',           label: 'Information Systems' },
	{ value: 'chemistry',         label: 'Other' },
];

function CustomSelect({ id, value, onChange, placeholder = 'Select an option', options = [] }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	// Close on outside click
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
				{/* Building icon */}
				<span className="rg-field-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
						<path d="M3 21h18M9 21V7l6-4v18M9 12h6"/>
					</svg>
				</span>
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

// ── Field with icon ──────────────────────────────────────────────────────────
function IconInput({ id, type = 'text', placeholder, value, onChange, icon, required }) {
	const Field = type === 'password' ? PasswordInput : 'input';
	return (
		<div className="rg-field">
			<span className="rg-field-icon">{icon}</span>
			<Field
				id={id}
				name={id}
				type={type}
				placeholder={placeholder}
				required={required}
				value={value}
				onChange={onChange}
				className="rg-field-input"
				autoComplete="off"
			/>
		</div>
	);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconUser = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
	</svg>
);
const IconMail = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
	</svg>
);
const IconID = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="9" x2="10" y2="9"/>
	</svg>
);
const IconLock = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
	</svg>
);
const IconShield = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
	</svg>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
	useNavbarEffects();
	useMobileNav();

	const [fullName, setFullName]             = useState('');
	const [email, setEmail]                   = useState('');
	const [facultyId, setFacultyId]           = useState('');
	const [department, setDepartment]         = useState('');
	const [password, setPassword]             = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading]               = useState(false);
	const [showAccountCreated, setShowAccountCreated] = useState(false);
	const [createdUserName, setCreatedUserName] = useState('');
	const navigate = useNavigate();
	const { showToast } = useToast();

	const handleAccountCreatedComplete = () => {
		navigate('/login');
	};

	async function onSubmit(e) {
		e.preventDefault();

		if (!fullName || !email || !facultyId || !department || !password || !confirmPassword) {
			showToast('Please fill in all fields', 'warning');
			return;
		}
		if (password !== confirmPassword) {
			showToast('Passwords do not match', 'error');
			return;
		}
		if (password.length < 8 || !/\d/.test(password)) {
			showToast('Password must be at least 8 characters and include a number', 'warning');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			showToast('Please enter a valid email address', 'warning');
			return;
		}

		try {
			setLoading(true);
			const response = await fetch(API_ENDPOINTS.REGISTER, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					full_name: fullName,
					email,
					password,
					role: 'student',
					department,
					registration_id: facultyId,
				}),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				showToast('Registration successful! Provisioning your account...', 'success');
				setCreatedUserName(fullName);
				setShowAccountCreated(true);
			} else {
				if (data.errors && Array.isArray(data.errors)) {
					showToast(data.errors.map(err => err.msg).join(' • '), 'error');
				} else {
					showToast(data.message || 'Registration failed. Please try again.', 'error');
				}
			}
		} catch (error) {
			console.error('Registration error:', error);
			showToast('An error occurred during registration. Please try again.', 'error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			{showAccountCreated ? (
				<AuthTransitionOverlay
					type="account_created"
					userName={createdUserName}
					duration={2400}
					onComplete={handleAccountCreatedComplete}
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
						<div className="auth-formRegister">

							{/* Header */}
							<div className="rg-header">
								<div className="rg-header-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
										<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
										<circle cx="9" cy="7" r="4"/>
										<line x1="19" y1="8" x2="19" y2="14"/>
										<line x1="22" y1="11" x2="16" y2="11"/>
									</svg>
								</div>
								<h1>Create Account</h1>
								<p className="rg-subtitle">Join the Faculty Resource Reservation System</p>
							</div>

							<form id="registerForm" onSubmit={onSubmit} noValidate>

								{/* Section 1: Personal & Academic Details */}
								<div className="rg-section-divider">
									<span>Personal & Academic Details</span>
								</div>

								{/* Full Name */}
								<div className="rg-form-group">
									<label htmlFor="fullName">Full Name</label>
									<IconInput
										id="fullName"
										placeholder="Enter your full name"
										value={fullName}
										onChange={e => setFullName(e.target.value)}
										icon={<IconUser />}
										required
									/>
								</div>

								{/* Email */}
								<div className="rg-form-group">
									<label htmlFor="email">Email Address</label>
									<IconInput
										id="email"
										type="email"
										placeholder="you@example.com"
										value={email}
										onChange={e => setEmail(e.target.value)}
										icon={<IconMail />}
										required
									/>
								</div>

								{/* Registration No */}
								<div className="rg-form-group">
									<label htmlFor="facultyId">Registration No.</label>
									<IconInput
										id="facultyId"
										placeholder="e.g. IT21001234"
										value={facultyId}
										onChange={e => setFacultyId(e.target.value)}
										icon={<IconID />}
										required
									/>
								</div>

								{/* Department – custom dropdown */}
								<div className="rg-form-group">
									<label htmlFor="registerpage-field-1">Department</label>
									<CustomSelect id="registerpage-field-1"
										value={department}
										onChange={setDepartment}
										placeholder="Choose your department"
										options={departments}
									/>
								</div>

								{/* Section 2: Account Security */}
								<div className="rg-section-divider">
									<span>Account Security</span>
								</div>

								{/* Password */}
								<div className="rg-form-group">
									<label htmlFor="password">Password</label>
									<IconInput
										id="password"
										type="password"
										placeholder="8+ characters, including a number"
										value={password}
										onChange={e => setPassword(e.target.value)}
										icon={<IconLock />}
										required
									/>
								</div>

								{/* Confirm Password */}
								<div className="rg-form-group">
									<label htmlFor="confirmPassword">Confirm Password</label>
									<IconInput
										id="confirmPassword"
										type="password"
										placeholder="Re-enter your password"
										value={confirmPassword}
										onChange={e => setConfirmPassword(e.target.value)}
										icon={<IconShield />}
										required
									/>
								</div>

								<button type="submit" className="rg-btn-submit" disabled={loading}>
									{loading ? (
										'Creating Account…'
									) : (
										<>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
												<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
												<circle cx="9" cy="7" r="4"/>
												<line x1="19" y1="8" x2="19" y2="14"/>
												<line x1="22" y1="11" x2="16" y2="11"/>
											</svg>
											Create Account
										</>
									)}
								</button>
							</form>

							<div className="auth-footer">
								<p>Already have an account? <Link to="/login">Sign in here</Link></p>
							</div>
						</div>
					</main>

					
				</>
			)}
		</div>
	);
}

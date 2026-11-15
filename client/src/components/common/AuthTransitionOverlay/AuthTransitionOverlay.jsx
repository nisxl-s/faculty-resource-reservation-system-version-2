import React, { useEffect } from 'react';
import './AuthTransitionOverlay.css';

/**
 * AuthTransitionOverlay
 * 
 * Standalone high-fidelity transition animation overlay for authentication actions:
 * - type="access_granted" (when signing in)
 * - type="account_created" (when registering)
 * 
 * I keep this overlay separate from the main loading screen.
 */
export default function AuthTransitionOverlay({
  type = 'access_granted',
  title,
  subtitle,
  userName = '',
  role = '',
  duration = 1800,
  onComplete,
}) {
  const isAccess = type === 'access_granted';

  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="ato-overlay" role="dialog" aria-modal="true" aria-label={isAccess ? 'Access Granted' : 'Account Created'}>
      <div className={`ato-card ${isAccess ? 'ato-mode-access' : 'ato-mode-account'}`}>
        
        {/* Pre-title status */}
        <div className="ato-pre-title">
          <span className="ato-live-dot" />
          <span>{isAccess ? 'Security Clearance Verified' : 'Profile Provisioned'}</span>
        </div>

        {/* Visual Animation Stage with Rings and Hologram */}
        <div className="ato-visual-stage" aria-hidden="true">
          <div className="ato-ring" />
          <div className="ato-ring-inner" />
          <div className="ato-glow-pulse" />
          
          <div className="ato-icon-badge">
            {isAccess ? (
              // Cyber biometric checkmark & shield icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // User Spark / Celebration Badge icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 8v6M22 11h-6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="ato-main-heading">
          {title || (isAccess ? 'ACCESS GRANTED' : 'ACCOUNT CREATED')}
        </h2>

        {/* Subtitle / Contextual Message */}
        <p className="ato-sub-message">
          {subtitle || (isAccess
            ? `Welcome back${userName ? `, ${userName}` : ''}. Redirecting to your ${role ? `${role} ` : ''}dashboard...`
            : `Welcome aboard${userName ? `, ${userName}` : ''}! Your account has been registered successfully.`
          )}
        </p>

        {/* Digital Scan / Progress Fill */}
        <div className="ato-progress-track">
          <div 
            className="ato-progress-fill" 
            style={{ animationDuration: `${duration}ms` }} 
          />
        </div>

        {/* Footer Terminal Readout */}
        <div className="ato-status-tag">
          <span className="ato-live-dot" />
          <span>{isAccess ? 'ESTABLISHING SECURE SESSION' : 'INITIALIZING LOGIN CREDENTIALS'}</span>
        </div>

      </div>
    </div>
  );
}

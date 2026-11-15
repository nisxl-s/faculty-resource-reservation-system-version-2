import { useEventCallback } from '../../../hooks/useEventCallback';
import React, { useEffect, useState } from 'react';

// Icons
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"/>
    </svg>
);

const IconAlertCircle = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);

const IconAlertTriangle = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

const IconInfo = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
);

const IconX = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

export default function Toast({ id, type = 'info', title, message, duration = 4500, onClose }) {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    const handleDismiss = useEventCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 280);
    });
  useEffect(() => {
        if (!duration) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 30);

        return () => clearInterval(interval);
    }, [duration, handleDismiss]);

    

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <IconCheck />;
            case 'error':
                return <IconAlertCircle />;
            case 'warning':
                return <IconAlertTriangle />;
            default:
                return <IconInfo />;
        }
    };

    return (
        <div 
            className={`toast-item toast-${type} ${isExiting ? 'toast-exit' : ''}`}
            role="alert"
        >
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                {title && <div className="toast-title">{title}</div>}
                <div className="toast-message">{message}</div>
            </div>
            <button 
                className="toast-close-btn" 
                onClick={handleDismiss} 
                aria-label="Close notification"
            >
                <IconX />
            </button>
            {duration > 0 && (
                <div 
                    className="toast-progress" 
                    style={{ width: `${progress}%`, transition: 'width 30ms linear' }}
                />
            )}
        </div>
    );
}

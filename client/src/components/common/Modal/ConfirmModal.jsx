import React, { useEffect, useRef, useId } from 'react';
import './ConfirmModal.css';

const IconTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const IconAlertTriangle = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

const IconHelpCircle = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

const IconLogOut = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

export default function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary', // 'primary' | 'danger' | 'warning'
    iconType = 'default', // 'trash' | 'logout' | 'alert' | 'default'
    onConfirm,
    onCancel
}) {
    const dialogRef = useRef(null);
    const titleId = useId();
    useEffect(() => {
        if (!isOpen) return;

        const previousFocus = document.activeElement;
        dialogRef.current?.querySelector('button')?.focus();
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            } else if (e.key === 'Tab') {
                const buttons = dialogRef.current?.querySelectorAll('button:not(:disabled)');
                if (!buttons?.length) return;
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    const renderIcon = () => {
        if (iconType === 'trash' || variant === 'danger') return <IconTrash />;
        if (iconType === 'logout') return <IconLogOut />;
        if (iconType === 'alert' || variant === 'warning') return <IconAlertTriangle />;
        return <IconHelpCircle />;
    };

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div 
                ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`confirm-dialog variant-${variant}`} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="confirm-dialog-header">
                    <div className="confirm-icon-wrap">
                        {renderIcon()}
                    </div>
                    <h3 id={titleId} className="confirm-dialog-title">{title}</h3>
                </div>

                <div className="confirm-dialog-body">
                    {message}
                </div>

                <div className="confirm-dialog-actions">
                    <button 
                        type="button" 
                        className="confirm-btn-cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        className={`confirm-btn-action btn-${variant}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

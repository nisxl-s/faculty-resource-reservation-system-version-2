import React, { createContext, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Toast from './Toast';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((toastData, toastType = 'info') => {
        // Support both showToast("Hello", "success") and showToast({ message, type, title, duration })
        let newToast;
        if (typeof toastData === 'string') {
            newToast = {
                id: Date.now() + Math.random(),
                message: toastData,
                type: toastType || 'info',
                duration: 4500
            };
        } else {
            newToast = {
                id: Date.now() + Math.random(),
                type: toastData.type || 'info',
                title: toastData.title,
                message: toastData.message || '',
                duration: toastData.duration !== undefined ? toastData.duration : 4500
            };
        }

        setToasts((prev) => [...prev, newToast]);
        return newToast.id;
    }, []);

    // Quick helper methods
    const toastSuccess = useCallback((msg, title) => showToast({ type: 'success', message: msg, title }), [showToast]);
    const toastError = useCallback((msg, title) => showToast({ type: 'error', message: msg, title }), [showToast]);
    const toastWarning = useCallback((msg, title) => showToast({ type: 'warning', message: msg, title }), [showToast]);
    const toastInfo = useCallback((msg, title) => showToast({ type: 'info', message: msg, title }), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, toastSuccess, toastError, toastWarning, toastInfo, removeToast }}>
            {children}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="toast-portal" aria-live="polite">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={removeToast}
                        />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

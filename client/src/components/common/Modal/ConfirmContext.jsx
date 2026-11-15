import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ConfirmModal from './ConfirmModal';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'primary',
        iconType: 'default'
    });

    const resolverRef = useRef(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            if (typeof options === 'string') {
                setModalState({
                    isOpen: true,
                    title: 'Confirmation',
                    message: options,
                    confirmText: 'Confirm',
                    cancelText: 'Cancel',
                    variant: 'primary',
                    iconType: 'default'
                });
            } else {
                setModalState({
                    isOpen: true,
                    title: options.title || 'Confirmation',
                    message: options.message || 'Are you sure?',
                    confirmText: options.confirmText || 'Confirm',
                    cancelText: options.cancelText || 'Cancel',
                    variant: options.variant || 'primary',
                    iconType: options.iconType || 'default'
                });
            }
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        if (resolverRef.current) {
            resolverRef.current(true);
            resolverRef.current = null;
        }
    }, []);

    const handleCancel = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <ConfirmModal
                    {...modalState}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />,
                document.body
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

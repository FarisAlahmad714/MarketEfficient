import { useState, useCallback } from 'react';

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const showModal = useCallback((props = {}) => {
    setModalProps(props);
    setIsOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsOpen(false);
    setModalProps({});
  }, []);

  // Convenience methods for common modal types
  const showAlert = useCallback((message, title = 'Alert', type = 'info') => {
    showModal({
      title,
      message,
      type,
    });
  }, [showModal]);

  const showSuccess = useCallback((message, title = 'Success') => {
    showModal({
      title,
      message,
      type: 'success',
    });
  }, [showModal]);

  const showError = useCallback((message, title = 'Error') => {
    showModal({
      title,
      message,
      type: 'error',
    });
  }, [showModal]);

  const showWarning = useCallback((message, title = 'Warning') => {
    showModal({
      title,
      message,
      type: 'warning',
    });
  }, [showModal]);

  const showConfirm = useCallback((message, onConfirm, title = 'Confirm') => {
    showModal({
      title,
      message,
      type: 'confirm',
      primaryAction: {
        text: 'Confirm',
        onClick: () => {
          onConfirm?.();
          hideModal();
        }
      },
      secondaryAction: {
        text: 'Cancel',
        onClick: hideModal
      },
      preventCloseOnOverlay: true
    });
  }, [showModal, hideModal]);

  const showDangerConfirm = useCallback((message, onConfirm, title = 'Confirm Action') => {
    showModal({
      title,
      message,
      type: 'warning',
      primaryAction: {
        text: 'Confirm',
        variant: 'danger',
        onClick: () => {
          onConfirm?.();
          hideModal();
        }
      },
      secondaryAction: {
        text: 'Cancel',
        onClick: hideModal
      },
      preventCloseOnOverlay: true
    });
  }, [showModal, hideModal]);

  return {
    isOpen,
    modalProps,
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showDangerConfirm
  };
};
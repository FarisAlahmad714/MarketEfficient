import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useContext } from 'react';

const AppModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  primaryAction,
  secondaryAction,
  icon,
  preventCloseOnOverlay = false,
  children
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !preventCloseOnOverlay) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventCloseOnOverlay]);

  if (!isOpen || !isBrowser) return null;

  const getTypeStyles = () => {
    const baseStyles = {
      borderColor: darkMode ? '#444' : '#ddd',
      iconColor: '#666'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          borderColor: '#4CAF50',
          iconColor: '#4CAF50',
          icon: icon || '✅'
        };
      case 'warning':
        return {
          ...baseStyles,
          borderColor: '#FF9800',
          iconColor: '#FF9800',
          icon: icon || '⚠️'
        };
      case 'error':
        return {
          ...baseStyles,
          borderColor: '#F44336',
          iconColor: '#F44336',
          icon: icon || '❌'
        };
      case 'confirm':
        return {
          ...baseStyles,
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          icon: icon || '❓'
        };
      default:
        return {
          ...baseStyles,
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          icon: icon || 'ℹ️'
        };
    }
  };

  const typeStyles = getTypeStyles();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !preventCloseOnOverlay) {
      onClose?.();
    }
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 12, 30, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100000,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={handleOverlayClick}
    >
      <div 
        style={{
          background: darkMode ? '#111827' : 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: children ? '600px' : '450px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: `2px solid ${typeStyles.borderColor}`,
          zIndex: 1000001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {typeStyles.icon && (
                <span style={{
                  fontSize: '20px',
                  color: typeStyles.iconColor
                }}>
                  {typeStyles.icon}
                </span>
              )}
              <h2 style={{
                margin: 0,
                fontSize: '1.4rem',
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333',
              }}>
                {title}
              </h2>
            </div>
            {!preventCloseOnOverlay && (
              <button 
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: darkMode ? '#888' : '#666',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#333' : '#f0f0f0';
                  e.target.style.color = darkMode ? '#e0e0e0' : '#333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = darkMode ? '#888' : '#666';
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{
          padding: title ? '20px 24px' : '24px',
        }}>
          {!title && typeStyles.icon && (
            <div style={{
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '32px',
                color: typeStyles.iconColor
              }}>
                {typeStyles.icon}
              </span>
            </div>
          )}

          {message && (
            <div style={{
              marginBottom: children || primaryAction || secondaryAction ? '20px' : '0',
              fontSize: '1rem',
              lineHeight: '1.6',
              color: darkMode ? '#b0b0b0' : '#555',
              textAlign: !title && !children ? 'center' : 'left'
            }}>
              {message}
            </div>
          )}

          {children && (
            <div>
              {children}
            </div>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: children ? '24px' : '0',
            }}>
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick || onClose}
                  disabled={secondaryAction.disabled}
                  style={{
                    padding: '10px 20px',
                    border: `2px solid ${darkMode ? '#444' : '#ddd'}`,
                    backgroundColor: 'transparent',
                    color: darkMode ? '#b0b0b0' : '#666',
                    borderRadius: '8px',
                    cursor: secondaryAction.disabled ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    opacity: secondaryAction.disabled ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!secondaryAction.disabled) {
                      e.target.style.backgroundColor = darkMode ? '#333' : '#f0f0f0';
                      e.target.style.color = darkMode ? '#e0e0e0' : '#333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!secondaryAction.disabled) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = darkMode ? '#b0b0b0' : '#666';
                    }
                  }}
                >
                  {secondaryAction.loading ? 'Loading...' : (secondaryAction.text || 'Cancel')}
                </button>
              )}

              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  style={{
                    padding: '10px 20px',
                    background: primaryAction.variant === 'danger' ? '#F44336' : 
                               primaryAction.variant === 'warning' ? '#FF9800' :
                               primaryAction.variant === 'success' ? '#4CAF50' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: primaryAction.disabled ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    opacity: primaryAction.disabled ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!primaryAction.disabled) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!primaryAction.disabled) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  {primaryAction.loading ? 'Loading...' : (primaryAction.text || 'OK')}
                </button>
              )}
            </div>
          )}

          {/* Simple actions for basic alerts */}
          {!primaryAction && !secondaryAction && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
};

export default AppModal;
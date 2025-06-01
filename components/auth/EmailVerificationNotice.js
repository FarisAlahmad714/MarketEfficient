import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const EmailVerificationNotice = ({ 
  userEmail, 
  userName, 
  onResendEmail,
  showResendOption = true,
  variant = 'success' // 'success', 'info', 'warning'
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    if (!onResendEmail) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      const success = await onResendEmail(userEmail);
      if (success) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9',
          borderColor: '#4caf50',
          iconColor: '#4caf50'
        };
      case 'warning':
        return {
          backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : '#fff3e0',
          borderColor: '#ff9800',
          iconColor: '#ff9800'
        };
      case 'info':
      default:
        return {
          backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : '#e3f2fd',
          borderColor: '#2196f3',
          iconColor: '#2196f3'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div style={{
      padding: '20px',
      backgroundColor: styles.backgroundColor,
      border: `2px solid ${styles.borderColor}`,
      borderRadius: '12px',
      marginBottom: '20px',
      position: 'relative'
    }}>
      {/* Email Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '15px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: styles.iconColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          📧
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            margin: '0 0 10px 0',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Check Your Email!
          </h3>

          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            margin: '0 0 15px 0',
            lineHeight: '1.6'
          }}>
            {userName ? `Hi ${userName}! ` : ''}We've sent a verification email to{' '}
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
              {userEmail}
            </strong>
          </p>

          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <h4 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              margin: '0 0 10px 0',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Next Steps:
            </h4>
            <ol style={{
              color: darkMode ? '#b0b0b0' : '#666',
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <h3>Check your email inbox (and spam folder)</h3>
              <h3>Click the verification link in the email</h3>
              <h3>Return here to log in and start trading</h3>
            </ol>
          </div>

          {showResendOption && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '14px'
              }}>
                Didn't receive the email?
              </span>
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: styles.iconColor,
                  textDecoration: 'underline',
                  cursor: isResending ? 'default' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isResending ? 0.6 : 1
                }}
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}

          {resendMessage && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: resendMessage.includes('sent') 
                ? (darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9')
                : (darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee'),
              color: resendMessage.includes('sent') ? '#4caf50' : '#f44336',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {resendMessage}
            </div>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '12px',
        color: styles.iconColor,
        opacity: 0.7
      }}>
        ✨
      </div>
    </div>
  );
};

export default EmailVerificationNotice; 
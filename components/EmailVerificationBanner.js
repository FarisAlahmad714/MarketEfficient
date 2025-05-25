import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';

const EmailVerificationBanner = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Don't show if user is verified, not logged in, or banner is dismissed
  if (!user || user.isVerified || isDismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToVerification = () => {
    router.push(`/auth/email-verification?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`);
  };

  return (
    <div style={{
      backgroundColor: darkMode ? '#1a237e' : '#e3f2fd',
      borderBottom: `3px solid ${darkMode ? '#3f51b5' : '#2196f3'}`,
      padding: '12px 20px',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#ff9800',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0
          }}>
            ⚠️
          </div>
          
          <div>
            <span style={{
              color: darkMode ? '#e3f2fd' : '#1565c0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📧 Please verify your email address to access all features.
            </span>
            <span style={{
              color: darkMode ? '#bbdefb' : '#1976d2',
              fontSize: '13px',
              marginLeft: '8px'
            }}>
              Check your inbox at <strong>{user.email}</strong>
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
        }}>
          <button
            onClick={handleGoToVerification}
            style={{
              padding: '6px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Verify Now
          </button>
          
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: darkMode ? '#90caf9' : '#1976d2',
              border: `1px solid ${darkMode ? '#90caf9' : '#1976d2'}`,
              borderRadius: '4px',
              fontSize: '13px',
              cursor: isResending ? 'default' : 'pointer',
              opacity: isResending ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {isResending ? 'Sending...' : 'Resend'}
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              color: darkMode ? '#90caf9' : '#1976d2',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              lineHeight: 1
            }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner; 
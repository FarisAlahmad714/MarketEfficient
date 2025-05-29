// components/CheckoutErrorRecovery.js
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { FaExclamationCircle, FaCreditCard, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/router';

const CheckoutErrorRecovery = ({ error, sessionId, onRetry }) => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Common payment error messages
  const errorMessages = {
    'card_declined': 'Your card was declined. Please try a different payment method.',
    'insufficient_funds': 'Your card has insufficient funds. Please try another card.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'processing_error': 'There was an error processing your payment. Please try again.',
    'authentication_required': 'Your bank requires additional authentication. Please try again.',
    'default': 'Something went wrong with your payment. Please try again.'
  };

  const getErrorMessage = (error) => {
    if (typeof error === 'string' && errorMessages[error]) {
      return errorMessages[error];
    }
    return errorMessages.default;
  };

  const handleRetryPayment = async () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // If we have a sessionId, try to resume the session
      if (sessionId) {
        const response = await fetch('/api/checkout/retry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ sessionId })
        });
        
        if (!response.ok) throw new Error('Failed to retry payment');
        
        const { url } = await response.json();
        window.location.href = url;
      } else if (onRetry) {
        // Custom retry handler
        await onRetry();
      } else {
        // Default: go back to pricing page
        router.push('/pricing');
      }
    } catch (err) {
      console.error('Retry payment error:', err);
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    // Could open a support modal or redirect to support page
    window.location.href = 'mailto:support@marketefficient.com?subject=Payment Issue';
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '40px auto',
      padding: '20px',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '12px',
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        <FaExclamationCircle size={30} color="#F44336" />
      </div>
      
      <h2 style={{
        color: darkMode ? '#e0e0e0' : '#333',
        marginBottom: '10px',
        fontSize: '24px'
      }}>
        Payment Failed
      </h2>
      
      <p style={{
        color: darkMode ? '#b0b0b0' : '#666',
        marginBottom: '30px',
        fontSize: '16px',
        lineHeight: '1.5'
      }}>
        {getErrorMessage(error)}
      </p>
      
      {retryCount > 0 && (
        <p style={{
          color: '#F44336',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          Retry attempt {retryCount} failed. Please check your payment details.
        </p>
      )}
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleRetryPayment}
          disabled={loading}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <FaCreditCard />
          {loading ? 'Processing...' : 'Try Again'}
        </button>
        
        <button
          onClick={() => router.back()}
          style={{
            backgroundColor: 'transparent',
            color: darkMode ? '#b0b0b0' : '#666',
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
            borderRadius: '6px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <FaArrowLeft />
          Go Back
        </button>
      </div>
      
      <p style={{
        color: darkMode ? '#888' : '#999',
        fontSize: '14px',
        marginTop: '20px'
      }}>
        Still having issues?{' '}
        <button
          onClick={handleContactSupport}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196F3',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px',
            padding: 0
          }}
        >
          Contact Support
        </button>
      </p>
    </div>
  );
};

// Hook to handle checkout errors
export const useCheckoutErrorRecovery = () => {
  const [checkoutError, setCheckoutError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  useEffect(() => {
    // Check URL params for checkout errors
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('payment_error');
    const session = urlParams.get('session_id');
    
    if (error) {
      setCheckoutError(error);
      setSessionId(session);
      
      // Store in localStorage for persistence
      localStorage.setItem('checkout_error', JSON.stringify({
        error,
        sessionId: session,
        timestamp: Date.now()
      }));
    } else {
      // Check localStorage for recent errors
      const stored = localStorage.getItem('checkout_error');
      if (stored) {
        const { error, sessionId, timestamp } = JSON.parse(stored);
        // Only show if error is less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          setCheckoutError(error);
          setSessionId(sessionId);
        } else {
          localStorage.removeItem('checkout_error');
        }
      }
    }
  }, []);
  
  const clearError = () => {
    setCheckoutError(null);
    setSessionId(null);
    localStorage.removeItem('checkout_error');
    
    // Clean URL
    const url = new URL(window.location);
    url.searchParams.delete('payment_error');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, document.title, url.pathname);
  };
  
  return {
    checkoutError,
    sessionId,
    clearError
  };
};

export default CheckoutErrorRecovery;
// pages/checkout/success.js
import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import Head from 'next/head';

const CheckoutSuccess = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const { session_id } = router.query;
        
        if (!session_id) {
          router.push('/profile');
          return;
        }
        
        // Verify the payment with backend
        const response = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ sessionId: session_id })
        });
        
        if (!response.ok) throw new Error('Failed to verify payment');
        
        const data = await response.json();
        setSubscription(data.subscription);
        
        // Clear any stored checkout errors
        localStorage.removeItem('checkout_error');
        
      } catch (error) {
        console.error('Error verifying payment:', error);
        router.push('/profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (router.isReady) {
      verifyPayment();
    }
  }, [router.isReady, router.query]);
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '70vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Payment Successful - MarketEfficient</title>
      </Head>
      
      <div style={{
        maxWidth: '500px',
        margin: '80px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px',
          animation: 'scaleIn 0.5s ease-out'
        }}>
          <FaCheckCircle size={40} color="#4CAF50" />
        </div>
        
        <h1 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '20px',
          fontSize: '32px'
        }}>
          Payment Successful!
        </h1>
        
        <p style={{
          color: darkMode ? '#b0b0b0' : '#666',
          marginBottom: '30px',
          fontSize: '18px',
          lineHeight: '1.5'
        }}>
          Welcome to MarketEfficient Pro! Your subscription is now active and you have 
          full access to all premium features.
        </p>
        
        {subscription && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f5f5f5',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '10px',
              fontSize: '18px'
            }}>
              Subscription Details
            </h3>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              margin: '5px 0',
              fontSize: '14px'
            }}>
              Plan: <strong style={{ textTransform: 'capitalize' }}>{subscription.plan}</strong>
            </p>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              margin: '5px 0',
              fontSize: '14px'
            }}>
              Next billing date: <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
            </p>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Go to Dashboard
            <FaArrowRight />
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            style={{
              backgroundColor: 'transparent',
              color: darkMode ? '#b0b0b0' : '#666',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              borderRadius: '6px',
              padding: '14px 24px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            View Subscription Details
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .spinner {
          border: 3px solid ${darkMode ? '#333' : '#f3f3f3'};
          border-top: 3px solid #2196F3;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default CheckoutSuccess;
// pages/auth/forgot-password.js
import React, { useState, useContext } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        const data = await response.json();
        setMessage(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>Forgot Password - Trading Platform</title>
        <meta name="description" content="Reset your Trading Platform password" />
      </Head>
      
      <div style={{
        maxWidth: '400px',
        margin: '40px auto',
        padding: '30px',
        borderRadius: '8px',
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          color: darkMode ? '#e0e0e0' : '#333' 
        }}>
          Reset Your Password
        </h2>
        
        {message && (
          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9',
            color: '#4caf50',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#b0b0b0' : '#666'
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '4px',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'default' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {isLoading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center',
          color: darkMode ? '#b0b0b0' : '#666',
          fontSize: '14px'
        }}>
          <Link 
            href="/auth/login"
            style={{
              color: darkMode ? '#90caf9' : '#2196F3',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
// pages/auth/reset-password.js
import React, { useState, useContext, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  useEffect(() => {
    // Get token from URL query parameters
    if (router.query.token) {
      setToken(router.query.token);
    }
  }, [router.query.token]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (!token) {
      setError('Invalid or missing reset token');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token,
          password 
        })
      });
      
      if (response.ok) {
        setMessage('Password reset successfully! You can now log in with your new password.');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!token) {
    return (
      <>
        <Head>
          <title>Reset Password - ChartSense</title>
          <meta name="description" content="Reset your ChartSense password" />
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
            Invalid Reset Link
          </h2>
          
          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
            color: '#f44336',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            This password reset link is invalid or has expired. Please request a new one.
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Link href="/auth/forgot-password" style={{
              color: '#2196F3',
              textDecoration: 'none'
            }}>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Reset Password - ChartSense</title>
        <meta name="description" content="Reset your ChartSense password" />
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
        
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
            color: '#f44336',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#b0b0b0' : '#666'
              }}
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '4px',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your new password"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#b0b0b0' : '#666'
              }}
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '4px',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Confirm your new password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center' }}>
          <Link href="/auth/login" style={{
            color: '#2196F3',
            textDecoration: 'none'
          }}>
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
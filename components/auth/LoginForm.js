// components/auth/LoginForm.js
import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { darkMode } = useContext(ThemeContext);
  const { login } = useContext(AuthContext);
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-form-container" style={{
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
        Login to Your Account
      </h2>
      
      {error && (
        <div style={{
          padding: '10px 15px',
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
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <label 
              htmlFor="password"
              style={{
                color: darkMode ? '#b0b0b0' : '#666'
              }}
            >
              Password
            </label>
            <Link 
              href="/auth/forgot-password"
              style={{
                fontSize: '14px',
                color: darkMode ? '#90caf9' : '#2196F3',
                textDecoration: 'none'
              }}
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div style={{ 
        marginTop: '24px', 
        textAlign: 'center',
        color: darkMode ? '#b0b0b0' : '#666',
        fontSize: '14px'
      }}>
        Don't have an account?{' '}
        <Link 
          href="/auth/register"
          style={{
            color: darkMode ? '#90caf9' : '#2196F3',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
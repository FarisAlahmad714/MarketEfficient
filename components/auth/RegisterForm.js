// components/auth/RegisterForm.js
import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);
  
  const { darkMode } = useContext(ThemeContext);
  const { register } = useContext(AuthContext);
  const router = useRouter();
  
  // Check if passwords match whenever either password field changes
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);
  
  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    // Contains numbers
    if (/[0-9]/.test(password)) strength += 1;
    // Contains special chars
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  }, [password]);
  
  const getStrengthColor = () => {
    if (passwordStrength < 2) return '#f44336'; // Weak - Red
    if (passwordStrength < 4) return '#ff9800'; // Medium - Orange
    return '#4caf50'; // Strong - Green
  };
  
  const getStrengthText = () => {
    if (passwordStrength < 2) return 'Weak';
    if (passwordStrength < 4) return 'Medium';
    return 'Strong';
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (passwordStrength < 2) {
      setError('Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(name, email, password);
      if (success) {
        setSuccess('Registration successful! Please check your email to verify your account.');
        // Optional: Redirect after a delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError('Registration failed. Email may already be in use.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
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
        Create an Account
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
      
      {success && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9',
          color: '#4caf50',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="name"
            style={{
              display: 'block',
              marginBottom: '8px',
              color: darkMode ? '#b0b0b0' : '#666'
            }}
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <label 
            htmlFor="password"
            style={{
              display: 'block',
              marginBottom: '8px',
              color: darkMode ? '#b0b0b0' : '#666'
            }}
          >
            Password
          </label>
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
          {password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  height: '5px',
                  width: '100%',
                  backgroundColor: darkMode ? '#333' : '#eee',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginRight: '10px'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getStrengthColor(),
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: getStrengthColor(),
                  minWidth: '60px',
                  textAlign: 'right'
                }}>
                  {getStrengthText()}
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: darkMode ? '#b0b0b0' : '#666',
                margin: '8px 0 0 0'
              }}>
                Use at least 8 characters with letters, numbers, and symbols
              </p>
            </div>
          )}
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
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '4px',
              border: `1px solid ${!confirmPassword ? (darkMode ? '#444' : '#ddd') : 
                (passwordMatch ? (darkMode ? '#388e3c' : '#4caf50') : (darkMode ? '#d32f2f' : '#f44336'))}`,
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '16px'
            }}
          />
          {confirmPassword && !passwordMatch && (
            <p style={{
              color: '#f44336',
              fontSize: '12px',
              margin: '8px 0 0 0'
            }}>
              Passwords don't match
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || (confirmPassword && !passwordMatch)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: (isLoading || (confirmPassword && !passwordMatch)) ? 
              (darkMode ? '#1b5e20' : '#a5d6a7') : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: (isLoading || (confirmPassword && !passwordMatch)) ? 'default' : 'pointer',
            opacity: (isLoading || (confirmPassword && !passwordMatch)) ? 0.7 : 1,
            transition: 'opacity 0.2s ease'
          }}
        >
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      
      <div style={{ 
        marginTop: '24px', 
        textAlign: 'center',
        color: darkMode ? '#b0b0b0' : '#666',
        fontSize: '14px'
      }}>
        Already have an account?{' '}
        <Link 
          href="/auth/login"
          style={{
            color: darkMode ? '#90caf9' : '#2196F3',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Login
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
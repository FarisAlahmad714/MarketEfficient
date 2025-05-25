import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import EmailVerificationNotice from '../../components/auth/EmailVerificationNotice';

export default function EmailVerificationPage() {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get email and name from query params or localStorage
    const { email, name } = router.query;
    if (email) {
      setUserEmail(email);
    }
    if (name) {
      setUserName(name);
    }

    // If no email provided, try to get from localStorage (if user just registered)
    if (!email) {
      const storedEmail = localStorage.getItem('pending_verification_email');
      const storedName = localStorage.getItem('pending_verification_name');
      if (storedEmail) {
        setUserEmail(storedEmail);
        setUserName(storedName || '');
      }
    }
  }, [router.query]);

  // Resend verification email function
  const handleResendEmail = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      return false;
    }
  };

  return (
    <>
      <Head>
        <title>Verify Your Email - ChartSense</title>
        <meta name="description" content="Please verify your email address to continue" />
      </Head>
      
      <div style={{
        maxWidth: '600px',
        margin: '80px auto',
        padding: '40px',
        borderRadius: '12px',
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '10px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Email Verification Required
          </h1>
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '16px'
          }}>
            To continue using ChartSense, please verify your email address.
          </p>
        </div>

        {userEmail ? (
          <EmailVerificationNotice
            userEmail={userEmail}
            userName={userName}
            onResendEmail={handleResendEmail}
            variant="info"
          />
        ) : (
          <div style={{
            padding: '20px',
            backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#ff9800',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 15px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '10px'
            }}>
              Email Address Required
            </h3>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              marginBottom: '20px'
            }}>
              We need your email address to send you a verification link.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const email = formData.get('email');
              if (email) {
                setUserEmail(email);
              }
            }}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    backgroundColor: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '16px'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Send Verification Email
              </button>
            </form>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <Link 
            href="/auth/login"
            style={{
              color: darkMode ? '#90caf9' : '#2196F3',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            ← Back to Login
          </Link>
          
          <Link 
            href="/auth/register"
            style={{
              color: darkMode ? '#90caf9' : '#2196F3',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Create New Account →
          </Link>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h4 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '10px',
            fontSize: '16px'
          }}>
            Having trouble?
          </h4>
          <ul style={{
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '14px',
            lineHeight: '1.6',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li>Check your spam/junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes for the email to arrive</li>
            <li>Try clicking "Resend verification email" if needed</li>
          </ul>
        </div>
      </div>
    </>
  );
} 
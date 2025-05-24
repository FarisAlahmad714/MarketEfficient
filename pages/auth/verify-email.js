import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useContext } from 'react';
import CryptoLoader from '../../components/CryptoLoader';

export default function VerifyEmail() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { token } = router.query;
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div style={{
      maxWidth: '500px',
      margin: '80px auto',
      padding: '30px',
      borderRadius: '8px',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        color: darkMode ? '#e0e0e0' : '#333',
        marginBottom: '20px'
      }}>
        Email Verification
      </h1>

      {status === 'verifying' && (
        <div style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CryptoLoader 
            message="Verifying your email address..."
            minDisplayTime={2000}
            height="300px"
          />
        </div>
      )}

      {status === 'success' && (
        <div>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            margin: '0 auto 20px'
          }}>
            ✓
          </div>
          <p style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
            {message}
          </p>
          <p style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
            Redirecting to login page...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#F44336',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            margin: '0 auto 20px'
          }}>
            ✗
          </div>
          <p style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
            {message}
          </p>
          <Link href="/auth/login" style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: '500',
            marginTop: '20px'
          }}>
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}
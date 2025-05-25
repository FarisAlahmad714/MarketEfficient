import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function VerificationSuccess() {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/auth/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Email Verified - ChartSense</title>
        <meta name="description" content="Your email has been successfully verified" />
      </Head>
      
      <div style={{
        maxWidth: '500px',
        margin: '80px auto',
        padding: '40px',
        borderRadius: '12px',
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          margin: '0 auto 30px',
          animation: 'pulse 2s infinite'
        }}>
          ✓
        </div>

        <h1 style={{ 
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '20px',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          Email Verified Successfully!
        </h1>

        <p style={{ 
          color: darkMode ? '#b0b0b0' : '#666',
          marginBottom: '30px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Congratulations! Your email address has been verified. You can now access all features of ChartSense.
        </p>

        <div style={{
          padding: '20px',
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '15px',
            fontSize: '18px'
          }}>
            What's Next?
          </h3>
          <ul style={{
            textAlign: 'left',
            color: darkMode ? '#b0b0b0' : '#666',
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Log in to your account</li>
            <li>Complete your profile setup</li>
            <li>Take your first bias test</li>
            <li>Explore our trading tools and resources</li>
          </ul>
        </div>

        <div style={{
          marginBottom: '20px'
        }}>
          <Link 
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '16px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            Go to Login
          </Link>
        </div>

        <p style={{ 
          color: darkMode ? '#888' : '#999',
          fontSize: '14px'
        }}>
          Redirecting automatically in {countdown} seconds...
        </p>

        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </>
  );
} 
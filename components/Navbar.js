import React, { useContext } from 'react';
import Link from 'next/link';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { FaSun, FaMoon, FaUser, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header 
      style={{
        background: darkMode ? '#1a1a1a' : 'white',
        color: darkMode ? '#e0e0e0' : '#333',
        boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
        padding: '20px 0',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Link href="/" style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: darkMode ? '#e0e0e0' : '#333',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.3s ease'
        }}>
          <span style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
            borderRadius: '8px',
            marginRight: '10px'
          }}></span>
          Trading Platform
        </Link>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <nav style={{ marginRight: '20px' }}>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: '20px'
            }}>
              <li>
                <Link href="/" style={{
                  color: router.pathname === '/' 
                    ? '#2196F3' 
                    : (darkMode ? '#b0b0b0' : '#555'),
                  textDecoration: 'none',
                  fontWeight: router.pathname === '/' ? '600' : '500',
                  padding: '8px 0',
                  borderBottom: router.pathname === '/' ? '2px solid #2196F3' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/bias-test" style={{
                  color: router.pathname === '/bias-test' || router.pathname.includes('/bias-test/') 
                    ? '#2196F3' 
                    : (darkMode ? '#b0b0b0' : '#555'),
                  textDecoration: 'none',
                  fontWeight: router.pathname === '/bias-test' || router.pathname.includes('/bias-test/') ? '600' : '500',
                  padding: '8px 0',
                  borderBottom: router.pathname === '/bias-test' || router.pathname.includes('/bias-test/') ? '2px solid #2196F3' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  Bias Test
                </Link>
              </li>
              <li>
                <Link href="/chart-exam" style={{
                  color: router.pathname === '/chart-exam' || router.pathname.includes('/chart-exam/') 
                    ? '#2196F3' 
                    : (darkMode ? '#b0b0b0' : '#555'),
                  textDecoration: 'none',
                  fontWeight: router.pathname === '/chart-exam' || router.pathname.includes('/chart-exam/') ? '600' : '500',
                  padding: '8px 0',
                  borderBottom: router.pathname === '/chart-exam' || router.pathname.includes('/chart-exam/') ? '2px solid #2196F3' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  Chart Exam
                </Link>
              </li>
              
              {/* User profile and admin links (only shown when authenticated) */}
              {isAuthenticated && user?.isAdmin && (
                <li>
                  <Link href="/admin" style={{
                    color: router.pathname === '/admin' || router.pathname.includes('/admin/') 
                      ? '#2196F3' 
                      : (darkMode ? '#b0b0b0' : '#555'),
                    textDecoration: 'none',
                    fontWeight: router.pathname === '/admin' ? '600' : '500',
                    padding: '8px 0',
                    borderBottom: router.pathname === '/admin' ? '2px solid #2196F3' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          
          {/* Auth-related UI */}
          <div style={{ 
            marginRight: '20px', 
            display: 'flex',
            alignItems: 'center', 
            gap: '15px'
          }}>
            {isAuthenticated ? (
              <>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: darkMode ? '#b0b0b0' : '#555',
                  fontSize: '14px'
                }}>
                  <FaUser style={{ fontSize: '16px' }} />
                  <span>{user?.name || 'User'}</span>
                  {!user?.isVerified && (
                    <span style={{
                      backgroundColor: darkMode ? '#333' : '#fff3cd',
                      color: darkMode ? '#ffc107' : '#856404',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Unverified
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: darkMode ? '#b0b0b0' : '#555',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '14px',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                  }}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link 
                href="/auth/login"
                style={{
                  color: darkMode ? '#90caf9' : '#2196F3',
                  textDecoration: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <FaUser style={{ fontSize: '14px' }} />
                <span>Login / Register</span>
              </Link>
            )}
          </div>
          
          {/* Theme toggle button */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
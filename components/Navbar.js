import React, { useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Added Image import
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { FaSun, FaMoon, FaUser, FaSignOutAlt, FaChartLine, FaCog, FaChevronDown } from 'react-icons/fa';

const Navbar = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header 
      style={{
        background: darkMode ? '#1a1a1a' : 'white',
        color: darkMode ? '#e0e0e0' : '#333',
        boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
        padding: '15px 0',
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
          fontSize: '22px',
          fontWeight: 'bold',
          color: darkMode ? '#e0e0e0' : '#333',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.3s ease'
        }}>
          {/* Replaced gradient span with Image component */}
          <Image 
            src="/images/logo.webp" 
            alt="ChartSense Logo" 
            width={32} 
            height={32} 
            style={{
              borderRadius: '8px',
              marginRight: '10px'
            }}
          />
          ChartSense
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
          
          {/* Auth-related UI - Improved */}
          <div style={{ 
            marginRight: '20px', 
            display: 'flex',
            alignItems: 'center', 
            gap: '15px',
            position: 'relative'
          }}>
            {isAuthenticated ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: darkMode ? '#e0e0e0' : '#333',
                    transition: 'all 0.2s ease',
                    fontSize: '14px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3f51b5, #2196F3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px'
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    lineHeight: '1.2' 
                  }}>
                    <span style={{ fontWeight: '500' }}>{user?.name || 'User'}</span>
                    {!user?.isVerified && (
                      <span style={{
                        fontSize: '11px',
                        color: '#ffc107',
                      }}>
                        Unverified
                      </span>
                    )}
                  </div>
                  <FaChevronDown style={{ 
                    fontSize: '12px', 
                    marginLeft: '3px',
                    transition: 'transform 0.2s ease',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                  }} />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: darkMode ? '#222' : 'white',
                    borderRadius: '8px',
                    boxShadow: darkMode ? '0 5px 15px rgba(0,0,0,0.3)' : '0 5px 15px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out',
                    overflow: 'hidden'
                  }}>
                    <Link href="/dashboard" style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: darkMode ? '#e0e0e0' : '#333',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: router.pathname === '/dashboard' ? (darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)') : 'transparent',
                      borderLeft: router.pathname === '/dashboard' ? '3px solid #2196F3' : 'none',
                      paddingLeft: router.pathname === '/dashboard' ? '13px' : '16px',
                    }}>
                      <FaChartLine style={{ fontSize: '16px', color: '#2196F3' }} />
                      <span>Dashboard</span>
                    </Link>
                    <Link href="/profile" style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: darkMode ? '#e0e0e0' : '#333',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: router.pathname === '/profile' ? (darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)') : 'transparent',
                      borderLeft: router.pathname === '/profile' ? '3px solid #2196F3' : 'none',
                      paddingLeft: router.pathname === '/profile' ? '13px' : '16px',
                    }}>
                      <FaUser style={{ fontSize: '16px', color: '#4CAF50' }} />
                      <span>Profile</span>
                    </Link>
                    <Link href="/settings" style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: darkMode ? '#e0e0e0' : '#333',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: router.pathname === '/settings' ? (darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)') : 'transparent',
                      borderLeft: router.pathname === '/settings' ? '3px solid #2196F3' : 'none',
                      paddingLeft: router.pathname === '/settings' ? '13px' : '16px',
                    }}>
                      <FaCog style={{ fontSize: '16px', color: '#9E9E9E' }} />
                      <span>Settings</span>
                    </Link>
                    <div style={{ 
                      height: '1px', 
                      backgroundColor: darkMode ? '#333' : '#eee', 
                      margin: '4px 0' 
                    }}></div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: darkMode ? '#e0e0e0' : '#333',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FaSignOutAlt style={{ fontSize: '16px', color: '#F44336' }} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/auth/login"
                style={{
                  color: darkMode ? '#90caf9' : '#2196F3',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
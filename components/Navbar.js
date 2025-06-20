import React, { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { BiHomeAlt } from 'react-icons/bi';
import { TbScale, TbChartLine } from 'react-icons/tb';
import { FaTachometerAlt, FaSun, FaMoon, FaChevronDown, FaUserCog, FaUserShield, FaSignOutAlt, FaCommentDots, FaGraduationCap, FaLock, FaChartLine as FaChartTradingLine, FaUser } from 'react-icons/fa';
import { RiExchangeLine } from 'react-icons/ri';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useProfileImage } from '../lib/useProfileImage';
import ProfileAvatar from './ProfileAvatar';
import FeedbackModal from './FeedbackModal';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const mobileMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch profile image for authenticated user
  const { profileImageUrl, loading: imageLoading, refreshProfileImage } = useProfileImage(user?.id, isAuthenticated);

  // Sandbox unlock status
  const [sandboxUnlocked, setSandboxUnlocked] = useState(false);
  const [sandboxProgress, setSandboxProgress] = useState(0);

  // Real-time asset prices using the API
  const [assetPrices, setAssetPrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const fetchIntervalRef = useRef(null);

  // Fetch REAL-TIME prices from API 
  const fetchPrices = async () => {
    try {
      console.log('Navbar: Fetching REAL-TIME ticker prices...');
      const response = await fetch('/api/crypto-prices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Navbar: REAL-TIME API response:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Filter out any assets that failed to get real prices (price = 0)
        const validPrices = data.data.filter(asset => asset.price > 0);
        
        if (validPrices.length > 0) {
          setAssetPrices(validPrices);
          setPricesLoading(false);
          setLastFetchTime(Date.now());
          console.log(`Navbar: Successfully updated ticker with REAL-TIME data for ${validPrices.length}/${data.data.length} assets`);
        } else {
          console.warn('Navbar: No valid real-time prices received');
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Navbar: Error fetching REAL-TIME prices:', error);
      
      // Only set fallback data if we don't have any existing data
      if (assetPrices.length === 0) {
        console.log('Navbar: No existing data, keeping ticker empty until real data is available');
        setPricesLoading(false);
      } else {
        console.log('Navbar: Keeping existing real-time data during temporary failure');
      }
    }
  };

  // Check sandbox unlock status
  const checkSandboxUnlock = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch('/api/sandbox/unlock-check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSandboxUnlocked(data.unlocked);
        setSandboxProgress(data.progressPercentage || 0);
      }
    } catch (error) {
      console.error('Error checking sandbox unlock status:', error);
    }
  };

  // Manage price fetching with visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop fetching when tab is not visible
        if (fetchIntervalRef.current) {
          clearInterval(fetchIntervalRef.current);
          fetchIntervalRef.current = null;
        }
        console.log('Navbar: Paused ticker updates (tab hidden)');
      } else {
        // Resume fetching when tab becomes visible
        fetchPrices(); // Fetch immediately
        if (fetchIntervalRef.current) {
          clearInterval(fetchIntervalRef.current);
        }
        fetchIntervalRef.current = setInterval(fetchPrices, 300000); // Update every 5 MINUTES for simple display
        console.log('Navbar: Resumed ticker updates (tab visible)');
      }
    };

    // Initial fetch when component mounts
    if (!document.hidden) {
      fetchPrices();
      fetchIntervalRef.current = setInterval(fetchPrices, 300000); // Update every 5 MINUTES for simple display
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array to run only once on mount

  // Debug: Log current asset prices (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Navbar: Current ticker prices:', assetPrices.map(p => `${p.symbol}: $${p.price.toFixed(2)} (${p.change24h.toFixed(2)}%)`));
    }
  }, [assetPrices]);

  // Check sandbox unlock status when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      checkSandboxUnlock();
    } else {
      setSandboxUnlocked(false);
      setSandboxProgress(0);
    }
  }, [isAuthenticated, user]);

  // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = () => {
      if (refreshProfileImage) {
        refreshProfileImage();
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, [refreshProfileImage]);

  // Handle window resize for canvas (if used for background effects)
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = 70;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target) && !event.target.closest('.user-avatar-button')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [mobileMenuOpen]);

  return (
    <header className={`navbar ${darkMode ? 'dark' : 'light'}`}>
      <canvas ref={canvasRef} className="navbar-background"></canvas>
      
      <div className="asset-ticker">
        {assetPrices.length > 0 ? (
          assetPrices.map((asset, index) => (
            <div key={`${asset.symbol}-${index}`} className="ticker-item">
              <span className="ticker-symbol">{asset.symbol}</span>
              <span className="ticker-price">
                ${typeof asset.price === 'number' ? 
                  (asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)) : 
                  'N/A'
                }
              </span>
              <span className={`ticker-change ${asset.change24h >= 0 ? 'positive' : 'negative'}`}>
                {typeof asset.change24h === 'number' ? 
                  `${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}%` : 
                  'N/A'
                }
              </span>
            </div>
          ))
        ) : pricesLoading ? (
          // Loading state
          Array.from({ length: 8 }, (_, index) => (
            <div key={`loading-${index}`} className="ticker-item">
              <span className="ticker-symbol">---</span>
              <span className="loading">Loading...</span>
            </div>
          ))
        ) : (
          // Error state
          <div className="ticker-item ticker-error">
            <span className="ticker-symbol">ERROR</span>
            <span className="loading">Unable to load prices</span>
          </div>
        )}
      </div>
      
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">
          <div className="logo-container">
            <div className="logo-frame">
              <Image 
                src="/images/logo.webp" 
                alt="ChartSense Logo" 
                width={40} 
                height={40} 
                className="brand-logo"
              />
              <div className="logo-glow"></div>
            </div>
            <div className="brand-text">
              <span className="brand-name">ChartSense</span>
              <span className="brand-tagline">Trading Platform</span>
            </div>
          </div>
        </Link>

        <nav className="navbar-nav">
          <Link href="/" className={`nav-link ${router.pathname === '/' ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <BiHomeAlt className="nav-icon" />
              <span className="nav-glow"></span>
            </div>
            <span className="nav-text">Home</span>
            {router.pathname === '/' && <div className="nav-active-dot"></div>}
          </Link>
          
          <Link href="/study" className={`nav-link ${router.pathname.includes('/study') ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <FaGraduationCap className="nav-icon" />
              <span className="nav-glow"></span>
            </div>
            <span className="nav-text">Study</span>
            {router.pathname.includes('/study') && <div className="nav-active-dot"></div>}
          </Link>
          
          <Link href="/bias-test" className={`nav-link ${router.pathname.includes('/bias-test') ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <TbScale className="nav-icon" />
              <span className="nav-glow"></span>
            </div>
            <span className="nav-text">Bias Test</span>
            {router.pathname.includes('/bias-test') && <div className="nav-active-dot"></div>}
          </Link>
          
          <Link href="/chart-exam" className={`nav-link ${router.pathname.includes('/chart-exam') ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <TbChartLine className="nav-icon" />
              <span className="nav-glow"></span>
            </div>
            <span className="nav-text">Chart Exam</span>
            {router.pathname.includes('/chart-exam') && <div className="nav-active-dot"></div>}
          </Link>
          
          <Link href="/dashboard" className={`nav-link ${router.pathname.includes('/dashboard') ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <FaTachometerAlt className="nav-icon" />
              <span className="nav-glow"></span>
            </div>
            <span className="nav-text">Dashboard</span>
            {router.pathname.includes('/dashboard') && <div className="nav-active-dot"></div>}
          </Link>
          
          {isAuthenticated && (
            <div className="sandbox-nav-container">
              <Link 
                href={sandboxUnlocked || user?.isAdmin ? "/sandbox" : "#"} 
                className={`nav-link ${router.pathname.includes('/sandbox') ? 'active' : ''} ${!sandboxUnlocked && !user?.isAdmin ? 'locked' : ''}`}
                onClick={!sandboxUnlocked && !user?.isAdmin ? (e) => {
                  e.preventDefault();
                  // Could show a modal with unlock requirements
                } : undefined}
                title={user?.isAdmin ? 'Sandbox Trading (Admin Access)' : sandboxUnlocked ? 'Sandbox Trading' : `Sandbox Trading (${sandboxProgress.toFixed(0)}% complete)`}
              >
                <div className="nav-icon-wrapper">
                  {sandboxUnlocked || user?.isAdmin ? (
                    <RiExchangeLine className="nav-icon" />
                  ) : (
                    <FaLock className="nav-icon" />
                  )}
                  <span className="nav-glow"></span>
                  {!sandboxUnlocked && !user?.isAdmin && sandboxProgress > 0 && (
                    <div className="progress-ring">
                      <svg width="40" height="40" className="progress-circle">
                        <circle 
                          cx="20" 
                          cy="20" 
                          r="18" 
                          stroke="rgba(59, 130, 246, 0.3)" 
                          strokeWidth="2" 
                          fill="none"
                        />
                        <circle 
                          cx="20" 
                          cy="20" 
                          r="18" 
                          stroke="#3b82f6" 
                          strokeWidth="2" 
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - sandboxProgress / 100)}`}
                          className="progress-circle-fill"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="nav-text">
                  {user?.isAdmin ? 'Sandbox' : sandboxUnlocked ? 'Sandbox' : `Sandbox ${sandboxProgress.toFixed(0)}%`}
                </span>
                {router.pathname.includes('/sandbox') && <div className="nav-active-dot"></div>}
              </Link>
              
              {!sandboxUnlocked && !user?.isAdmin && (
                <div className="sandbox-tooltip">
                  <div className="tooltip-content">
                    <div className="tooltip-header">
                      <FaLock className="tooltip-icon" />
                      <h4>Complete Tests to Unlock</h4>
                    </div>
                    <div className="tooltip-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${sandboxProgress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{sandboxProgress.toFixed(0)}% Complete</span>
                    </div>
                    <div className="tooltip-requirements">
                      <div className="requirement-item">
                        <TbScale className="req-icon" />
                        <span>Complete Bias Tests</span>
                      </div>
                      <div className="requirement-item">
                        <TbChartLine className="req-icon" />
                        <span>Pass Chart Exams</span>
                      </div>
                    </div>
                    <div className="tooltip-footer">
                      <span>Unlock $10,000 SENSE$ Trading</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="navbar-actions">
          <button 
            className="theme-toggle premium-button" 
            onClick={toggleTheme} 
            aria-label="Toggle theme"
          >
            <div className="button-content">
              {darkMode ? <FaSun /> : <FaMoon />}
              <span className="button-glow"></span>
            </div>
          </button>
          
          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="user-avatar-button premium-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <div className="avatar-container">
                  <ProfileAvatar
                    imageUrl={profileImageUrl}
                    name={user?.name}
                    size={36}
                    className="user-avatar"
                    style={{
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  />
                  <div className="user-info">
                    <span className="username">{user?.name || 'User'}</span>
                    {user?.isAdmin && <span className="admin-badge">Admin</span>}
                  </div>
                  <FaChevronDown className={`dropdown-arrow ${showUserMenu ? 'rotated' : ''}`} />
                  <span className="button-glow"></span>
                </div>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown premium-dropdown" ref={userMenuRef}>
                  <div className="dropdown-header">
                    <ProfileAvatar
                      imageUrl={profileImageUrl}
                      name={user?.name}
                      size={48}
                      className="dropdown-avatar"
                      style={{
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
                      }}
                      borderRadius="14px"
                    />
                    <div className="dropdown-user-info">
                      <span className="dropdown-username">{user?.name || 'User'}</span>
                      <span className="dropdown-email">{user?.email || 'user@example.com'}</span>
                      {user?.isAdmin && <span className="dropdown-admin-badge">Administrator</span>}
                    </div>
                  </div>
                  
                  <div className="dropdown-section">
                    <Link href="/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <div className="item-icon">
                        <FaTachometerAlt />
                      </div>
                      <div className="item-content">
                        <span className="item-title">Dashboard</span>
                        <span className="item-subtitle">View your performance</span>
                      </div>
                    </Link>
                    
                    {!user?.isAdmin && (
  <>
    <Link href={`/u/${user?.username || 'undefined'}`} className="dropdown-item" onClick={() => setShowUserMenu(false)}>
      <div className="item-icon">
        <FaUser />
      </div>
      <div className="item-content">
        <span className="item-title">{user?.username ? 'Profile' : 'Setup Profile'}</span>
        <span className="item-subtitle">{user?.username ? 'Your public profile' : 'Create your username first'}</span>
      </div>
    </Link>
  </>
)}
                    
                    {user?.isAdmin && (
                      <>
                        <Link href="/admin" className="dropdown-item admin-item" onClick={() => setShowUserMenu(false)}>
                          <div className="item-icon">
                            <FaUserShield />
                          </div>
                          <div className="item-content">
                            <span className="item-title">Admin Panel</span>
                            <span className="item-subtitle">System management</span>
                          </div>
                        </Link>
                        <Link href={user?.username ? `/u/${user.username}` : "/profile"} className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <div className="item-icon">
                            <FaUser />
                          </div>
                          <div className="item-content">
                            <span className="item-title">My Profile</span>
                            <span className="item-subtitle">View your public profile</span>
                          </div>
                        </Link>
                      </>
                    )}

                    {!user?.isAdmin && (
                      <Link
                        href="#"
                        className="dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowUserMenu(false);
                          setShowFeedbackModal(true);
                        }}
                      >
                        <div className="item-icon">
                          <FaCommentDots />
                        </div>
                        <div className="item-content">
                          <span className="item-title">Send Feedback</span>
                          <span className="item-subtitle">Help us improve</span>
                        </div>
                      </Link>
                    )}
                  </div>
                  
                  <div className="dropdown-footer">
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <div className="item-icon">
                        <FaSignOutAlt />
                      </div>
                      <div className="item-content">
                        <span className="item-title">Sign Out</span>
                        <span className="item-subtitle">Logout from your account</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="login-button premium-button"
              style={!darkMode ? {
                color: '#1e293b',
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              } : {
                color: 'white',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              <span>Sign In</span>
              <span className="button-glow"></span>
            </Link>
          )}
          
          <button
            className="mobile-toggle premium-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            style={{ display: 'none' }}
          >
            <div className="button-content">
              {mobileMenuOpen ? <HiX /> : <HiMenuAlt3 />}
              <span className="button-glow"></span>
            </div>
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu premium-mobile-menu" ref={mobileMenuRef}>
            <div className="mobile-header">
              <span className="mobile-title">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="mobile-close">
                <HiX />
              </button>
            </div>
            
            <div className="mobile-nav">
              <Link href="/" className={`mobile-link mobile-link-1 ${router.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <BiHomeAlt className="mobile-icon" />
                <span>Home</span>
              </Link>
              
              <Link href="/study" className={`mobile-link mobile-link-2 ${router.pathname.includes('/study') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <FaGraduationCap className="mobile-icon" />
                <span>Study</span>
              </Link>
              
              <Link href="/bias-test" className={`mobile-link mobile-link-3 ${router.pathname.includes('/bias-test') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <TbScale className="mobile-icon" />
                <span>Bias Test</span>
              </Link>
              
              <Link href="/chart-exam" className={`mobile-link mobile-link-4 ${router.pathname.includes('/chart-exam') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <TbChartLine className="mobile-icon" />
                <span>Chart Exam</span>
              </Link>
              
              <Link href="/dashboard" className={`mobile-link mobile-link-5 ${router.pathname.includes('/dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <FaTachometerAlt className="mobile-icon" />
                <span>Dashboard</span>
              </Link>
              
              {isAuthenticated && (
                <Link 
                  href={sandboxUnlocked || user?.isAdmin ? "/sandbox" : "#"} 
                  className={`mobile-link mobile-link-6 ${router.pathname.includes('/sandbox') ? 'active' : ''} ${!sandboxUnlocked && !user?.isAdmin ? 'locked' : ''}`}
                  onClick={(sandboxUnlocked || user?.isAdmin) ? () => setMobileMenuOpen(false) : (e) => {
                    e.preventDefault();
                    // Could show unlock requirements modal
                  }}
                >
                  {sandboxUnlocked || user?.isAdmin ? (
                    <RiExchangeLine className="mobile-icon" />
                  ) : (
                    <FaLock className="mobile-icon" />
                  )}
                  <span>
                    {user?.isAdmin ? 'Sandbox Trading' : sandboxUnlocked ? 'Sandbox Trading' : `Sandbox ${sandboxProgress.toFixed(0)}%`}
                  </span>
                </Link>
              )}
            </div>
            
            {isAuthenticated && (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <ProfileAvatar
                    imageUrl={profileImageUrl}
                    name={user?.name}
                    size={48}
                    className="mobile-avatar"
                    borderRadius="12px"
                  />
                  <div className="mobile-user-details">
                    <span className="mobile-username">{user?.name || 'User'}</span>
                    <span className="mobile-email">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>
                
                
                {user?.isAdmin && (
                  <Link href="/admin" className="mobile-link admin" onClick={() => setMobileMenuOpen(false)}>
                    <FaUserShield className="mobile-icon" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                
                {!user?.isAdmin && (
                  <button
                    className="mobile-link mobile-link-5"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      setShowFeedbackModal(true);
                    }}
                  >
                    <FaCommentDots className="mobile-icon" />
                    <span>Send Feedback</span>
                  </button>
                )}
              </div>
            )}
            
            <div className="mobile-footer">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="mobile-logout">
                  <FaSignOutAlt className="mobile-icon" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link href="/auth/login" className="mobile-login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />

      <style jsx global>{`
        /* NUCLEAR LINK RESET - Remove ALL hyperlink styling completely */
        .navbar a,
        .navbar a:any-link,
        .navbar a:link,
        .navbar a:visited,
        .navbar a:hover,
        .navbar a:active,
        .navbar a:focus,
        .navbar a:target {
          color: inherit !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
          background-color: transparent !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Override any deeply nested links */
        .navbar * a,
        .navbar * a:any-link,
        .navbar * a:link,
        .navbar * a:visited,
        .navbar * a:hover,
        .navbar * a:active,
        .navbar * a:focus {
          color: inherit !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
          background-color: transparent !important;
        }
        
        /* Specific navigation link reset */
        .navbar .nav-link,
        .navbar .nav-link:any-link,
        .navbar .nav-link:link,
        .navbar .nav-link:visited,
        .navbar .nav-link:hover,
        .navbar .nav-link:active,
        .navbar .nav-link:focus {
          color: inherit !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
        }
        
        /* Mobile link reset */
        .navbar .mobile-link,
        .navbar .mobile-link:any-link,
        .navbar .mobile-link:link,
        .navbar .mobile-link:visited,
        .navbar .mobile-link:hover,
        .navbar .mobile-link:active,
        .navbar .mobile-link:focus {
          color: inherit !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
          background-color: transparent !important;
        }
        
        /* Dropdown item reset */
        .navbar .dropdown-item,
        .navbar .dropdown-item:any-link,
        .navbar .dropdown-item:link,
        .navbar .dropdown-item:visited,
        .navbar .dropdown-item:hover,
        .navbar .dropdown-item:active,
        .navbar .dropdown-item:focus {
          text-decoration: none !important;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
        }
        
        .dark .dropdown-item {
          color: rgba(255, 255, 255, 0.85);
        }
        
        .light .dropdown-item {
          color: rgba(0, 0, 0, 0.85);
        }
        
        .dark .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
          transform: translateX(2px);
        }
        
        .light .dropdown-item:hover {
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.95);
          transform: translateX(2px);
        }
        
        /* Brand link reset */
        .navbar .navbar-brand,
        .navbar .navbar-brand:any-link,
        .navbar .navbar-brand:link,
        .navbar .navbar-brand:visited,
        .navbar .navbar-brand:hover,
        .navbar .navbar-brand:active,
        .navbar .navbar-brand:focus {
          color: inherit !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
          text-decoration-style: none !important;
          text-decoration-color: transparent !important;
        }
        
        /* Specific overrides for styled elements */
        .navbar .mobile-login,
        .navbar .mobile-login:any-link,
        .navbar .mobile-login:link,
        .navbar .mobile-login:visited,
        .navbar .mobile-login:hover,
        .navbar .mobile-login:active {
          color: white !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
        }
        
        .navbar .brand-name,
        .navbar .brand-name:any-link,
        .navbar .brand-name:link,
        .navbar .brand-name:visited,
        .navbar .brand-name:hover,
        .navbar .brand-name:active {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          text-decoration: none !important;
          text-decoration-line: none !important;
        }
      `}</style>

      <style jsx>{`
        .navbar {
          width: 100%;
          height: 70px;
          position: sticky;
          top: 0;
          z-index: 9999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible;
          isolation: isolate;
        }
        
        .dark.navbar {
          background: linear-gradient(135deg, 
            rgba(10, 12, 30, 0.95) 0%, 
            rgba(15, 20, 35, 0.98) 50%, 
            rgba(8, 15, 25, 0.95) 100%);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .light.navbar {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(250, 251, 252, 0.98) 50%, 
            rgba(245, 247, 250, 0.95) 100%);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .navbar-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          pointer-events: none;
          opacity: 0.6;
        }
        
        .asset-ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100vw;
          height: 16px;
          display: flex;
          gap: 25px;
          font-size: 14px;
          font-weight: 600;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0.8;
          animation: ticker 180s linear infinite;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(33, 150, 243, 0.05) 50%, 
            transparent 100%);
          box-sizing: border-box;
          contain: layout style paint;
        }
        
        .dark .asset-ticker {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .asset-ticker {
          color: rgba(0, 0, 0, 0.8);
        }
        
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-200%); }
        }
        
        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: max-content;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        
        .ticker-symbol {
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 14px;
          min-width: 35px;
        }
        
        .ticker-price {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 13px;
          min-width: 45px;
        }
        
        .ticker-change {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
          min-width: 35px;
        }
        
        .ticker-change.positive {
          color: #4CAF50;
        }
        
        .ticker-change.negative {
          color: #f44336;
        }
        
        .loading {
          color: #6b7280;
          font-size: 12px;
          animation: pulse 1.5s infinite;
        }
        
        .ticker-error {
          color: #ef4444;
        }
        
        .ticker-error .loading {
          color: #ef4444;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .navbar-container {
          max-width: 1200px;
          height: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 10000;
        }
        
        .navbar-brand {
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: inherit;
        }
        
        .navbar-brand:hover {
          transform: translateY(-1px);
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-frame {
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          overflow: hidden;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        
        .dark .logo-frame {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(99, 102, 241, 0.1) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .logo-frame {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.05) 0%, 
            rgba(99, 102, 241, 0.05) 100%);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .brand-logo {
          border-radius: 8px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateZ(4px);
        }
        
        .navbar-brand:hover .brand-logo {
          transform: translateZ(8px) rotate(5deg);
        }
        
        .logo-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, 
            rgba(59, 130, 246, 0.4) 0%, 
            transparent 70%);
          animation: logoGlow 3s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes logoGlow {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .brand-name {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
        }
        
        .brand-tagline {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .dark .brand-tagline {
          color: #94a3b8;
        }
        
        .light .brand-tagline {
          color: #64748b;
        }
        
        .navbar-nav {
          display: flex;
          gap: 8px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10001;
          background: rgba(255, 255, 255, 0.02);
          padding: 6px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        
        .dark .navbar-nav {
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .light .navbar-nav {
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border-radius: 12px;
          min-width: 80px;
          color: inherit;
        }
        
        .dark .nav-link {
          color: rgba(255, 255, 255, 0.85);
        }
        
        .light .nav-link {
          color: rgba(15, 23, 42, 0.8);
        }
        
        .nav-link:hover {
          transform: translateY(-2px);
        }
        
        .dark .nav-link:hover {
          color: #ffffff;
          background: rgba(59, 130, 246, 0.12);
        }
        
        .light .nav-link:hover {
          color: #1e293b;
          background: rgba(59, 130, 246, 0.08);
        }
        
        .nav-link.active {
          font-weight: 600;
        }
        
        .dark .nav-link.active {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.2);
          font-weight: 600;
        }
        
        .light .nav-link.active {
          color: #2563eb;
          background: rgba(59, 130, 246, 0.12);
          font-weight: 600;
        }
        
        .nav-icon-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-icon {
          font-size: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 2;
        }
        
        .nav-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 10px;
          background: radial-gradient(circle, 
            rgba(59, 130, 246, 0.3) 0%, 
            transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .nav-link.active .nav-glow {
          opacity: 1;
        }
        
        .nav-text {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
        }
        
        .nav-active-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        }
        
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 10001;
        }
        
        .premium-button {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .button-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          transition: all 0.3s ease;
        }
        
        .button-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, 
            rgba(59, 130, 246, 0.2) 0%, 
            transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        .premium-button:hover .button-glow {
          opacity: 1;
        }
        
        .theme-toggle {
          color: #f59e0b;
        }
        
        .dark .theme-toggle {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .light .theme-toggle {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.1);
        }
        
        .theme-toggle:hover {
          transform: rotate(15deg) scale(1.1);
        }
        
        .user-menu {
          position: relative;
          z-index: 10002;
        }
        
        .user-avatar-button {
          text-decoration: none;
        }
        
        .avatar-container {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dark .avatar-container {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .avatar-container {
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .user-avatar {
          flex-shrink: 0;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .username {
          font-size: 13px;
          font-weight: 600;
          line-height: 1;
        }
        
        .dark .username {
          color: #f1f5f9;
        }
        
        .light .username {
          color: #1e293b;
        }
        
        .admin-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 2px 6px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .dropdown-arrow {
          font-size: 12px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dark .dropdown-arrow {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .dropdown-arrow {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }
        
        .premium-dropdown {
          position: fixed;
          top: 70px;
          right: 24px;
          width: 320px;
          border-radius: 16px;
          overflow: hidden;
          z-index: 99999;
          animation: dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: top right;
        }
        
        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .dark .premium-dropdown {
          background: rgba(10, 12, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(30px);
        }
        
        .light .premium-dropdown {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(30px);
        }
        
        .dropdown-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid;
        }
        
        .dark .dropdown-header {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .light .dropdown-header {
          border-color: rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.01);
        }
        
        .dropdown-avatar {
          flex-shrink: 0;
        }
        
        .dropdown-user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .dropdown-username {
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
        }
        
        .dark .dropdown-username {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .dropdown-username {
          color: rgba(0, 0, 0, 0.95);
        }
        
        .dropdown-email {
          font-size: 13px;
          line-height: 1;
        }
        
        .dark .dropdown-email {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .dropdown-email {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .dropdown-admin-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
          align-self: flex-start;
        }
        
        .dropdown-section {
          padding: 12px 8px;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 4px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
          color: inherit;
        }
        
        .dark .dropdown-item {
          color: rgba(255, 255, 255, 0.85);
        }
        
        .light .dropdown-item {
          color: rgba(0, 0, 0, 0.85);
        }
        
        .dark .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
          transform: translateX(2px);
        }
        
        .light .dropdown-item:hover {
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.95);
          transform: translateX(2px);
        }
        
        .item-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        
        .dark .item-icon {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .item-icon {
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.7);
        }
        
        .dropdown-item:hover .item-icon {
          transform: scale(1.1);
        }
        
        .dark .dropdown-item:hover .item-icon {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }
        
        .light .dropdown-item:hover .item-icon {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .item-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
        }
        
        .item-subtitle {
          font-size: 12px;
          line-height: 1;
        }
        
        .dark .item-subtitle {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .light .item-subtitle {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .admin-item .item-icon {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .dropdown-footer {
          padding: 8px;
          border-top: 1px solid;
        }
        
        .dark .dropdown-footer {
          border-color: rgba(255, 255, 255, 0.08);
        }
        
        .light .dropdown-footer {
          border-color: rgba(0, 0, 0, 0.08);
        }
        
        .logout-item {
          color: #ef4444;
        }
        
        .logout-item .item-icon {
          background: rgba(239, 65, 68, 0.1);
          color: #ef4444;
        }
        
        .logout-item:hover {
          background: rgba(239, 65, 68, 0.1);
        }
        
        .login-button {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 99998;
          backdrop-filter: blur(10px);
          animation: overlayFadeIn 0.3s ease-out;
        }
        
        @keyframes overlayFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(10px);
          }
        }
        
        .premium-mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 320px;
          height: 100vh;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          animation: mobileSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                     mobileFloat 6s ease-in-out infinite 1s;
          overflow-y: auto;
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes mobileSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .dark .premium-mobile-menu {
          background: linear-gradient(160deg, 
            rgba(10, 12, 30, 0.98) 0%, 
            rgba(15, 20, 35, 0.98) 50%, 
            rgba(8, 15, 25, 0.98) 100%);
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(40px);
          box-shadow: 
            -20px 0 60px rgba(0, 0, 0, 0.4),
            inset 1px 0 0 rgba(255, 255, 255, 0.1),
            -1px 0 0 rgba(59, 130, 246, 0.1);
        }
        
        .light .premium-mobile-menu {
          background: linear-gradient(160deg, 
            rgba(255, 255, 255, 0.98) 0%, 
            rgba(250, 251, 252, 0.98) 50%, 
            rgba(245, 247, 250, 0.98) 100%);
          border-left: 1px solid rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(40px);
          box-shadow: 
            -20px 0 60px rgba(0, 0, 0, 0.15),
            inset 1px 0 0 rgba(255, 255, 255, 0.8),
            -1px 0 0 rgba(59, 130, 246, 0.1);
        }
        
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-bottom: 1px solid;
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: mobileItemSlideIn 0.5s ease-out 0.05s forwards;
        }
        
        .mobile-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.05) 50%, 
            transparent 100%);
          animation: headerShimmer 3s ease-in-out infinite;
        }
        
        @keyframes headerShimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        .dark .mobile-header {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .light .mobile-header {
          border-color: rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.01);
        }
        
        .mobile-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 2;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        
        .mobile-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 12px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .dark .mobile-close {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .mobile-close {
          color: rgba(0, 0, 0, 0.8);
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .dark .mobile-close:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          transform: scale(1.05) rotate(90deg);
        }
        
        .light .mobile-close:hover {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: scale(1.05) rotate(90deg);
        }
        
        .mobile-nav {
          padding: 24px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 20px;
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 6px;
          font-weight: 500;
          color: inherit;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
        }
        
        .mobile-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.1) 50%, 
            transparent 100%);
          transition: left 0.5s ease;
        }
        
        .mobile-link:hover::before {
          left: 100%;
        }
        
        .dark .mobile-link {
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.05);
        }
        
        .light .mobile-link {
          color: rgba(0, 0, 0, 0.85);
          background: rgba(0, 0, 0, 0.01);
          border-color: rgba(0, 0, 0, 0.05);
        }
        
        .dark .mobile-link:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          color: rgba(255, 255, 255, 0.95);
          transform: translateX(8px) scale(1.02);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }
        
        .light .mobile-link:hover {
          background: rgba(59, 130, 246, 0.04);
          border-color: rgba(59, 130, 246, 0.1);
          color: rgba(0, 0, 0, 0.95);
          transform: translateX(8px) scale(1.02);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.1);
        }
        
        .mobile-link.active {
          font-weight: 600;
          transform: translateX(8px);
        }
        
        .dark .mobile-link.active {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
        }
        
        .light .mobile-link.active {
          color: #2563eb;
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }
        
        .mobile-icon {
          font-size: 22px;
          width: 28px;
          display: flex;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
        }
        
        .mobile-link:hover .mobile-icon {
          transform: scale(1.2) rotate(5deg);
        }
        
        .mobile-link.active .mobile-icon {
          transform: scale(1.1);
        }
        
        /* Staggered animations for mobile menu items */
        .mobile-link {
          opacity: 0;
          animation: mobileItemSlideIn 0.5s ease-out forwards;
        }
        
        .mobile-link-1 {
          animation-delay: 0.1s;
        }
        
        .mobile-link-2 {
          animation-delay: 0.2s;
        }
        
        .mobile-link-3 {
          animation-delay: 0.3s;
        }
        
        .mobile-link-4 {
          animation-delay: 0.4s;
        }
        
        .mobile-link-5 {
          animation-delay: 0.45s;
        }
        
        @keyframes mobileItemSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes mobileFloat {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(0) translateY(-2px);
          }
        }
        
        .mobile-user-section {
          padding: 24px 20px;
          border-top: 1px solid;
          position: relative;
          opacity: 0;
          animation: mobileItemSlideIn 0.5s ease-out 0.5s forwards;
        }
        
        .mobile-user-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.3) 50%, 
            transparent 100%);
        }
        
        .dark .mobile-user-section {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.01);
        }
        
        .light .mobile-user-section {
          border-color: rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.005);
        }
        
        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 18px;
          margin-bottom: 20px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .mobile-user-info::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.05) 0%, 
            rgba(99, 102, 241, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .mobile-user-info:hover::before {
          opacity: 1;
        }
        
        .dark .mobile-user-info {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .light .mobile-user-info {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }
        
        .dark .mobile-user-info:hover {
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        
        .light .mobile-user-info:hover {
          border-color: rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
        }
        
        .mobile-avatar {
          flex-shrink: 0;
          transition: transform 0.3s ease;
          position: relative;
          z-index: 2;
        }
        
        .mobile-user-info:hover .mobile-avatar {
          transform: scale(1.05);
        }
        
        .mobile-user-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          z-index: 2;
        }
        
        .mobile-username {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }
        
        .dark .mobile-username {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .mobile-username {
          color: rgba(0, 0, 0, 0.95);
        }
        
        .mobile-email {
          font-size: 13px;
          font-weight: 500;
        }
        
        .dark .mobile-email {
          color: rgba(255, 255, 255, 0.65);
        }
        
        .light .mobile-email {
          color: rgba(0, 0, 0, 0.65);
        }
        
        .mobile-footer {
          padding: 24px 20px;
          border-top: 1px solid;
          position: relative;
          opacity: 0;
          animation: mobileItemSlideIn 0.5s ease-out 0.6s forwards;
        }
        
        .mobile-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.3) 50%, 
            transparent 100%);
        }
        
        .dark .mobile-footer {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.01);
        }
        
        .light .mobile-footer {
          border-color: rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.005);
        }
        
        .mobile-logout {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 20px;
          border-radius: 16px;
          background: none;
          border: 1px solid rgba(239, 68, 68, 0.2);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          width: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #ef4444;
          position: relative;
          overflow: hidden;
        }
        
        .mobile-logout::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(239, 68, 68, 0.1) 50%, 
            transparent 100%);
          transition: left 0.5s ease;
        }
        
        .mobile-logout:hover::before {
          left: 100%;
        }
        
        .mobile-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
        }
        
        .mobile-logout .mobile-icon {
          transition: transform 0.3s ease;
        }
        
        .mobile-logout:hover .mobile-icon {
          transform: scale(1.2) rotate(-5deg);
        }
        
        .mobile-login {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px 24px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white !important;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-login::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.2) 50%, 
            transparent 100%);
          transition: left 0.5s ease;
        }
        
        .mobile-login:hover::before {
          left: 100%;
        }
        
        .mobile-login:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
          background: linear-gradient(135deg, #2563eb 0%, #5b21b6 100%);
        }
        
        /* Sandbox Trading Styles */
        .nav-link.locked {
          opacity: 0.6;
          cursor: not-allowed;
          position: relative;
        }
        
        .dark .nav-link.locked {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .light .nav-link.locked {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .nav-link.locked:hover {
          transform: none;
          background: none;
        }
        
        .progress-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          pointer-events: none;
        }
        
        .progress-circle {
          transform: rotate(-90deg);
          transition: all 0.3s ease;
        }
        
        .progress-circle-fill {
          transition: stroke-dashoffset 0.5s ease;
          animation: progressPulse 2s ease-in-out infinite;
        }
        
        @keyframes progressPulse {
          0%, 100% { 
            stroke-width: 2; 
            opacity: 1;
          }
          50% { 
            stroke-width: 3; 
            opacity: 0.8;
          }
        }
        
        .mobile-link.locked {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .dark .mobile-link.locked {
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .light .mobile-link.locked {
          color: rgba(0, 0, 0, 0.5);
          background: rgba(0, 0, 0, 0.01);
        }
        
        .mobile-link.locked:hover {
          transform: none;
          background: rgba(255, 255, 255, 0.02);
        }
        
        /* Sandbox unlock notification styles */
        .sandbox-unlock-notification {
          position: fixed;
          top: 80px;
          right: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
          z-index: 10000;
          animation: slideInRight 0.5s ease-out;
          font-weight: 600;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .navbar-nav {
            display: none;
          }
          
          .mobile-toggle {
            display: block !important;
          }
          
          .brand-text {
            display: none;
          }
          
          .user-info {
            display: none;
          }
          
          .premium-dropdown {
            right: 16px;
            width: calc(100vw - 32px);
            max-width: 300px;
          }
          
          .premium-mobile-menu {
            width: 100vw;
          }
        }
        
        /* Sandbox Tooltip Styles */
        .sandbox-nav-container {
          position: relative;
        }
        
        .sandbox-tooltip {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 12px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 9999;
          pointer-events: none;
        }
        
        .sandbox-nav-container:hover .sandbox-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(4px);
          pointer-events: auto;
        }
        
        .tooltip-content {
          background: rgba(10, 12, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          width: 280px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          position: relative;
        }
        
        .light .tooltip-content {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .tooltip-content::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: rgba(10, 12, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: none;
          border-right: none;
          transform: translateX(-50%) rotate(45deg);
        }
        
        .light .tooltip-content::before {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .tooltip-icon {
          color: #f59e0b;
          font-size: 16px;
        }
        
        .tooltip-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .tooltip-header h4 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .tooltip-progress {
          margin-bottom: 16px;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .light .progress-bar {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        
        .progress-text {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .progress-text {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .tooltip-requirements {
          margin-bottom: 16px;
        }
        
        .requirement-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .requirement-item {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .req-icon {
          color: #3b82f6;
          font-size: 14px;
          width: 16px;
        }
        
        .tooltip-footer {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }
        
        .light .tooltip-footer {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .tooltip-footer span {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        
        .tooltip-footer span::before {
          content: '💰';
        }

        @media (max-width: 480px) {
          .navbar-container {
            padding: 0 16px;
          }
          
          .premium-dropdown {
            right: 8px;
            width: calc(100vw - 16px);
          }
          
          .sandbox-tooltip {
            left: 0;
            transform: none;
            margin-top: 8px;
          }
          
          .sandbox-nav-container:hover .sandbox-tooltip {
            transform: translateY(4px);
          }
          
          .tooltip-content {
            width: 260px;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
import React, { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { BiHomeAlt } from 'react-icons/bi';
import { TbScale, TbChartLine } from 'react-icons/tb';
import { FaTachometerAlt, FaSun, FaMoon, FaChevronDown, FaUserCog, FaUserShield, FaSignOutAlt, FaCommentDots } from 'react-icons/fa';
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
  const { profileImageUrl, loading: imageLoading } = useProfileImage(user?.id, isAuthenticated);

  // Sample crypto data (replace with real API data)
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const cryptoAssets = [
    { symbol: 'BTC', price: 50000, change24h: 2.5 },
    { symbol: 'ETH', price: 3000, change24h: -1.3 },
    { symbol: 'SOL', price: 100, change24h: 0.8 },
    { symbol: 'ADA', price: 0.5, change24h: 1.2 },
    { symbol: 'XRP', price: 0.8, change24h: -0.5 },
  ];

  // Simulate API fetch for crypto prices
  useEffect(() => {
    const fetchPrices = () => {
      setCryptoPrices(cryptoAssets.map(asset => ({
        ...asset,
        price: asset.price + (Math.random() - 0.5) * 10,
      })));
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

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
        {cryptoPrices.length > 0 ? (
          cryptoPrices.map((asset, index) => (
            <div key={index} className="ticker-item">
              <span className="ticker-symbol">{asset.symbol}</span>
              <span className="ticker-price">
                ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          cryptoAssets.slice(0, 5).map((asset, index) => (
            <div key={index} className="ticker-item">
              <span className="ticker-symbol">{asset.symbol}</span>
              <span className="loading">Loading...</span>
            </div>
          ))
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
                      <Link href="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <div className="item-icon">
                          <FaUserCog />
                        </div>
                        <div className="item-content">
                          <span className="item-title">Profile Settings</span>
                          <span className="item-subtitle">Manage your account</span>
                        </div>
                      </Link>
                    )}
                    
                    {user?.isAdmin && (
                      <Link href="/admin" className="dropdown-item admin-item" onClick={() => setShowUserMenu(false)}>
                        <div className="item-icon">
                          <FaUserShield />
                        </div>
                        <div className="item-content">
                          <span className="item-title">Admin Panel</span>
                          <span className="item-subtitle">System management</span>
                        </div>
                      </Link>
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
            <Link href="/auth/login" className="login-button premium-button">
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
              <Link href="/" className={`mobile-link ${router.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <BiHomeAlt className="mobile-icon" />
                <span>Home</span>
              </Link>
              
              <Link href="/bias-test" className={`mobile-link ${router.pathname.includes('/bias-test') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <TbScale className="mobile-icon" />
                <span>Bias Test</span>
              </Link>
              
              <Link href="/chart-exam" className={`mobile-link ${router.pathname.includes('/chart-exam') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <TbChartLine className="mobile-icon" />
                <span>Chart Exam</span>
              </Link>
              
              <Link href="/dashboard" className={`mobile-link ${router.pathname.includes('/dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <FaTachometerAlt className="mobile-icon" />
                <span>Dashboard</span>
              </Link>
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
                
                {!user?.isAdmin && (
                  <Link href="/profile" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <FaUserCog className="mobile-icon" />
                    <span>Profile Settings</span>
                  </Link>
                )}
                
                {user?.isAdmin && (
                  <Link href="/admin" className="mobile-link admin" onClick={() => setMobileMenuOpen(false)}>
                    <FaUserShield className="mobile-icon" />
                    <span>Admin Panel</span>
                  </Link>
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
        .navbar .login-button,
        .navbar .login-button:any-link,
        .navbar .login-button:link,
        .navbar .login-button:visited,
        .navbar .login-button:hover,
        .navbar .login-button:active,
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
          width: 100%;
          height: 16px;
          display: flex;
          gap: 35px;
          font-size: 12px;
          font-weight: 600;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0.8;
          animation: ticker 120s linear infinite;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(33, 150, 243, 0.05) 50%, 
            transparent 100%);
          max-width: 100vw;
          box-sizing: border-box;
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
          gap: 8px;
          min-width: max-content;
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        
        .ticker-symbol {
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 12px;
        }
        
        .ticker-price {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
        }
        
        .loading {
          color: #6b7280;
          font-size: 9px;
          animation: pulse 1.5s infinite;
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
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white !important;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
        }
        
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99998;
          backdrop-filter: blur(5px);
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
          animation: mobileSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        
        @keyframes mobileSlideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .dark .premium-mobile-menu {
          background: rgba(10, 12, 30, 0.98);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(30px);
        }
        
        .light .premium-mobile-menu {
          background: rgba(255, 255, 255, 0.98);
          border-left: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(30px);
        }
        
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid;
        }
        
        .dark .mobile-header {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .mobile-header {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .mobile-title {
          font-size: 18px;
          font-weight: 700;
        }
        
        .dark .mobile-title {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .mobile-title {
          color: rgba(0, 0, 0, 0.95);
        }
        
        .mobile-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .dark .mobile-close {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .mobile-close {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .dark .mobile-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .light .mobile-close:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        
        .mobile-nav {
          padding: 20px 16px;
          flex: 1;
        }
        
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 16px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 8px;
          font-weight: 500;
          color: inherit;
        }
        
        .dark .mobile-link {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .mobile-link {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .dark .mobile-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .mobile-link:hover {
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.95);
        }
        
        .mobile-link.active {
          font-weight: 600;
        }
        
        .dark .mobile-link.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        
        .light .mobile-link.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        
        .mobile-icon {
          font-size: 20px;
          width: 24px;
          display: flex;
          justify-content: center;
        }
        
        .mobile-user-section {
          padding: 20px 16px;
          border-top: 1px solid;
        }
        
        .dark .mobile-user-section {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .mobile-user-section {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        
        .dark .mobile-user-info {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .light .mobile-user-info {
          background: rgba(0, 0, 0, 0.03);
        }
        
        .mobile-avatar {
          flex-shrink: 0;
        }
        
        .mobile-user-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .mobile-username {
          font-size: 14px;
          font-weight: 600;
        }
        
        .dark .mobile-username {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .mobile-username {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .mobile-email {
          font-size: 12px;
        }
        
        .dark .mobile-email {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .mobile-email {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .mobile-footer {
          padding: 20px 16px;
          border-top: 1px solid;
        }
        
        .dark .mobile-footer {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .mobile-footer {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .mobile-logout {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          width: 100%;
          transition: all 0.2s ease;
          color: #ef4444;
        }
        
        .mobile-logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        
        .mobile-login {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white !important;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        .mobile-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
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
        
        @media (max-width: 480px) {
          .navbar-container {
            padding: 0 16px;
          }
          
          .premium-dropdown {
            right: 8px;
            width: calc(100vw - 16px);
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
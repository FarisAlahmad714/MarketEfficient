import React, { useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { 
  FaSun, 
  FaMoon, 
  FaSignOutAlt,
  FaUserCog,
  FaTachometerAlt,
  FaChevronDown,
  FaUserShield
} from 'react-icons/fa';
import { BiHomeAlt } from 'react-icons/bi';
import { TbScale, TbChartLine } from 'react-icons/tb';
import { HiMenuAlt3, HiX } from 'react-icons/hi';

const Navbar = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [priceError, setPriceError] = useState(false);
  const mobileMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const canvasRef = useRef(null);

  // Real crypto assets with CoinGecko IDs
  const cryptoAssets = [
    { symbol: 'BTC', id: 'bitcoin' },
    { symbol: 'ETH', id: 'ethereum' },
    { symbol: 'SOL', id: 'solana' },
    { symbol: 'XRP', id: 'ripple' },
    { symbol: 'ADA', id: 'cardano' },
    { symbol: 'DOT', id: 'polkadot' },
    { symbol: 'BNB', id: 'binancecoin' },
    { symbol: 'AVAX', id: 'avalanche-2' },
    { symbol: 'MATIC', id: 'matic-network' },
    { symbol: 'LINK', id: 'chainlink' },
    { symbol: 'UNI', id: 'uniswap' },
    { symbol: 'LTC', id: 'litecoin' },
    { symbol: 'ATOM', id: 'cosmos' },
    { symbol: 'ALGO', id: 'algorand' },
    { symbol: 'FIL', id: 'filecoin' },
    { symbol: 'VET', id: 'vechain' },
    { symbol: 'AAVE', id: 'aave' },
    { symbol: 'COMP', id: 'compound-governance-token' },
    { symbol: 'MKR', id: 'maker' },
    { symbol: 'SNX', id: 'havven' }
  ];

  // Fetch real-time crypto prices
  const fetchCryptoPrices = async () => {
    try {
      const ids = cryptoAssets.map(asset => asset.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24h_change=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      
      const data = await response.json();
      
      const formattedPrices = cryptoAssets.map(asset => {
        const priceData = data[asset.id];
        if (priceData) {
          return {
            symbol: asset.symbol,
            price: priceData.usd,
            change24h: priceData.usd_24h_change || 0
          };
        }
        return null;
      }).filter(Boolean);

      setCryptoPrices(formattedPrices);
      setPriceError(false);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      setPriceError(true);
      
      // Fallback to demo data if API fails
      const fallbackData = cryptoAssets.slice(0, 10).map(asset => ({
        symbol: asset.symbol,
        price: Math.random() * 1000 + 100,
        change24h: (Math.random() - 0.5) * 10
      }));
      setCryptoPrices(fallbackData);
    }
  };

  // Initialize price fetching
  useEffect(() => {
    fetchCryptoPrices();
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchCryptoPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Canvas setup for 3D background
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = 70; // Same as navbar height
    
    // Candlestick patterns
    const candlesticks = [];
    for (let i = 0; i < 10; i++) {
      createCandlestick(candlesticks);
    }
    
    // Chart lines
    const chartLines = [];
    for (let i = 0; i < 3; i++) {
      chartLines.push({
        points: generateChartLine(),
        color: darkMode 
          ? `rgba(33, 150, 243, ${0.1 + Math.random() * 0.15})` 
          : `rgba(33, 150, 243, ${0.05 + Math.random() * 0.1})`,
        speed: 0.2 + Math.random() * 0.3
      });
    }
    
    function createCandlestick(array) {
      const isGreen = Math.random() > 0.5;
      const height = 5 + Math.random() * 15;
      const wickHeight = height * (0.5 + Math.random() * 1);
      
      array.push({
        x: Math.random() * canvas.width,
        y: 10 + Math.random() * (canvas.height - 20),
        width: 3 + Math.random() * 3,
        height: height,
        wickHeight: wickHeight,
        isGreen: isGreen,
        color: isGreen 
          ? (darkMode ? 'rgba(46, 204, 113, 0.15)' : 'rgba(76, 175, 80, 0.2)') 
          : (darkMode ? 'rgba(231, 76, 60, 0.15)' : 'rgba(244, 67, 54, 0.2)'),
        speed: 0.3 + Math.random() * 0.5
      });
    }
    
    function generateChartLine() {
      const points = [];
      const segments = 10 + Math.floor(Math.random() * 10);
      const amplitude = 5 + Math.random() * 10;
      const baseY = 20 + Math.random() * (canvas.height - 40);
      
      for (let i = 0; i < segments; i++) {
        points.push({
          x: (canvas.width / segments) * i,
          y: baseY + (Math.random() * amplitude * 2 - amplitude)
        });
      }
      return points;
    }
    
    // Animation function
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw chart lines
      chartLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x, line.points[i].y);
          
          // Move points for animation
          line.points[i].x -= line.speed;
          if (line.points[i].x < 0) {
            line.points[i].x = canvas.width;
            line.points[i].y = 20 + Math.random() * (canvas.height - 40);
          }
        }
        
        // Reset first point if out of bounds
        if (line.points[0].x < 0) {
          line.points[0].x = canvas.width;
          line.points[0].y = 20 + Math.random() * (canvas.height - 40);
        } else {
          line.points[0].x -= line.speed;
        }
        
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      
      // Draw candlesticks
      candlesticks.forEach(candle => {
        // Body
        ctx.fillStyle = candle.color;
        ctx.fillRect(candle.x, candle.y - candle.height/2, candle.width, candle.height);
        
        // Upper wick
        ctx.beginPath();
        ctx.moveTo(candle.x + candle.width/2, candle.y - candle.height/2);
        ctx.lineTo(candle.x + candle.width/2, candle.y - candle.height/2 - candle.wickHeight/2);
        ctx.strokeStyle = candle.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Lower wick
        ctx.beginPath();
        ctx.moveTo(candle.x + candle.width/2, candle.y + candle.height/2);
        ctx.lineTo(candle.x + candle.width/2, candle.y + candle.height/2 + candle.wickHeight/2);
        ctx.stroke();
        
        // Move for animation
        candle.x -= candle.speed;
        
        // Reset if out of bounds
        if (candle.x + candle.width < 0) {
          candle.x = canvas.width + candle.width;
          candle.y = 10 + Math.random() * (canvas.height - 20);
          candle.isGreen = Math.random() > 0.5;
          candle.color = candle.isGreen 
            ? (darkMode ? 'rgba(46, 204, 113, 0.15)' : 'rgba(76, 175, 80, 0.2)') 
            : (darkMode ? 'rgba(231, 76, 60, 0.15)' : 'rgba(244, 67, 54, 0.2)');
        }
      });
      
      requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      
      // Reset chart lines with updated colors
      chartLines.length = 0;
      for (let i = 0; i < 3; i++) {
        chartLines.push({
          points: generateChartLine(),
          color: darkMode 
            ? `rgba(33, 150, 243, ${0.1 + Math.random() * 0.15})` 
            : `rgba(33, 150, 243, ${0.05 + Math.random() * 0.1})`,
          speed: 0.2 + Math.random() * 0.3
        });
      }
      
      // Update candlestick colors
      candlesticks.forEach(candle => {
        candle.color = candle.isGreen 
          ? (darkMode ? 'rgba(46, 204, 113, 0.15)' : 'rgba(76, 175, 80, 0.2)') 
          : (darkMode ? 'rgba(231, 76, 60, 0.15)' : 'rgba(244, 67, 54, 0.2)');
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
              <span className={`ticker-change ${asset.change24h >= 0 ? 'up' : 'down'}`}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
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
                  <div className="user-avatar">
                    <span className="avatar-text">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
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
                    <div className="dropdown-avatar">
                      <span className="dropdown-avatar-text">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
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
                    
                    <Link href="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <div className="item-icon">
                        <FaUserCog />
                      </div>
                      <div className="item-content">
                        <span className="item-title">Profile Settings</span>
                        <span className="item-subtitle">Manage your account</span>
                      </div>
                    </Link>
                    
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
          >
            <div className="button-content">
              {mobileMenuOpen ? <HiX /> : <HiMenuAlt3 />}
              <span className="button-glow"></span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - ENHANCED */}
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
                  <div className="mobile-avatar">
                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-username">{user?.name || 'User'}</span>
                    <span className="mobile-email">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>
                
                <Link href="/profile" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <FaUserCog className="mobile-icon" />
                  <span>Profile Settings</span>
                </Link>
                
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

      <style jsx>{`
        /* PREMIUM NAVBAR STYLES */
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
        
        /* ENHANCED TICKER */
        .asset-ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 16px;
          display: flex;
          gap: 35px;
          font-size: 10px;
          font-weight: 600;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0.8;
          animation: ticker 120s linear infinite;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(33, 150, 243, 0.05) 50%, 
            transparent 100%);
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
        }
        
        .ticker-symbol {
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .ticker-price {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .ticker-change.up {
          color: #10b981;
          font-weight: 700;
        }
        
        .ticker-change.down {
          color: #ef4444;
          font-weight: 700;
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
        
        /* PREMIUM BRAND */
        .navbar-brand {
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .brand-tagline {
          color: rgba(0, 0, 0, 0.6);
        }
        
        /* PREMIUM NAVIGATION */
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
        }
        
        .dark .nav-link {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .nav-link {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .nav-link:hover {
          transform: translateY(-2px);
        }
        
        .dark .nav-link:hover {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.08);
        }
        
        .light .nav-link:hover {
          color: rgba(0, 0, 0, 0.95);
          background: rgba(0, 0, 0, 0.06);
        }
        
        .nav-link.active {
          font-weight: 600;
        }
        
        .dark .nav-link.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
        }
        
        .light .nav-link.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
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
        
        /* PREMIUM ACTIONS */
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
        
        /* PREMIUM USER MENU */
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
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .username {
          color: rgba(0, 0, 0, 0.9);
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
        
        /* PREMIUM DROPDOWN */
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
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
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
          color: #ef4444 !important;
        }
        
        .logout-item .item-icon {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .logout-item:hover {
          background: rgba(239, 68, 68, 0.1) !important;
        }
        
        /* LOGIN BUTTON */
        .login-button {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          font-size: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
        }
        
        /* PREMIUM MOBILE MENU */
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
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white;
          font-weight: 700;
          font-size: 18px;
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
          color: white;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        .mobile-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
        }
        
        /* RESPONSIVE */
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
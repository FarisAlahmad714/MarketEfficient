import React, { useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { FaSun, FaMoon, FaUser, FaChevronDown, FaHome } from 'react-icons/fa';
import { IoLogOutOutline, IoPersonOutline, IoSettingsOutline } from 'react-icons/io5';
import { BiLineChart } from 'react-icons/bi';
import { TbArrowsUpDown, TbChartBar } from 'react-icons/tb';
import { HiMenuAlt3 } from 'react-icons/hi';

const Navbar = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
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
    <header className="navbar">
      <div className="container">
        <Link href="/" className="logo">
          <Image src="/images/logo.webp" alt="ChartSense Logo" width={32} height={32} />
          <h1>ChartSense</h1>
        </Link>

        <nav className="nav-section">
          <Link href="/" className={router.pathname === '/' ? 'nav-item active' : 'nav-item'}>
            <FaHome className="nav-icon" />
            Home
          </Link>
          <Link href="/bias-test" className={router.pathname.includes('/bias-test') ? 'nav-item active' : 'nav-item'}>
            <TbArrowsUpDown className="nav-icon" />
            Bias Test
          </Link>
          <Link href="/chart-exam" className={router.pathname.includes('/chart-exam') ? 'nav-item active' : 'nav-item'}>
            <BiLineChart className="nav-icon" />
            Chart Exam
          </Link>
        </nav>

        <div className="actions-section">
          {isAuthenticated ? (
            <div ref={dropdownRef} className="user-menu">
              <button
                className="avatar-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                <div className="avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                <FaChevronDown className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                    <div className="dropdown-user-info">
                      <p className="dropdown-user-name">{user?.name || 'User'}</p>
                      <p className="dropdown-user-email">{user?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <TbChartBar /> Dashboard
                  </Link>
                  <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <IoPersonOutline /> Profile
                  </Link>
                  <Link href="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <IoSettingsOutline /> Settings
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout-button">
                    <IoLogOutOutline /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="login-button">
              <FaUser />
            </Link>
          )}

          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <HiMenuAlt3 />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div ref={mobileMenuRef} className="mobile-menu">
            <div className="mobile-menu-header">
              <Link href="/" className="mobile-logo" onClick={() => setMobileMenuOpen(false)}>
                <Image src="/images/logo.webp" alt="ChartSense Logo" width={28} height={28} />
                ChartSense
              </Link>
              <button className="mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                ×
              </button>
            </div>

            <nav className="mobile-nav">
              <Link href="/" className={router.pathname === '/' ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setMobileMenuOpen(false)}>
                <FaHome /> Home
              </Link>
              <Link href="/bias-test" className={router.pathname.includes('/bias-test') ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setMobileMenuOpen(false)}>
                <TbArrowsUpDown /> Bias Test
              </Link>
              <Link href="/chart-exam" className={router.pathname.includes('/chart-exam') ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setMobileMenuOpen(false)}>
                <BiLineChart /> Chart Exam
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <TbChartBar /> Dashboard
                  </Link>
                  <Link href="/profile" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <IoPersonOutline /> Profile
                  </Link>
                  <Link href="/settings" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <IoSettingsOutline /> Settings
                  </Link>
                </>
              )}
            </nav>

            <div className="mobile-footer">
              <button onClick={toggleTheme} className="mobile-theme-toggle" aria-label="Toggle theme">
                Theme {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              {isAuthenticated && (
                <button onClick={handleLogout} className="mobile-logout-button">
                  <IoLogOutOutline /> Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar {
          background: #121212;
          padding: 12px 0;
          color: #fff;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .logo h1 {
          margin: 0 0 0 8px;
          font-size: 22px;
          color: #2196F3;
        }
        .nav-section {
          display: flex;
          gap: 40px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
        }
        .nav-item:hover, .nav-item.active {
          color: #2196F3;
        }
        .nav-icon {
          font-size: 20px;
        }
        .actions-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar-button {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
        }
        .avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2196F3;
          color: white;
          border-radius: 6px;
          font-size: 16px;
        }
        .dropdown-arrow {
          font-size: 10px;
          margin-left: 4px;
          transition: transform 0.2s;
        }
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #1a1a1a;
          border-radius: 8px;
          width: 240px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        .dropdown-header {
          padding: 12px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dropdown-user-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2196F3;
          color: white;
          border-radius: 50%;
          font-size: 16px;
          margin-right: 8px;
        }
        .dropdown-user-name {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }
        .dropdown-user-email {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          transition: background 0.2s;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .logout-button {
          width: 100%;
          background: none;
          border: none;
          color: #f07178;
          cursor: pointer;
        }
        .theme-toggle, .mobile-toggle {
          background: none;
          border: none;
          color: #FFC107;
          font-size: 20px;
          cursor: pointer;
        }
        .mobile-toggle {
          display: none;
        }
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: none;
        }
        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 80%;
          max-width: 300px;
          background: #151515;
          display: flex;
          flex-direction: column;
          z-index: 1001;
        }
        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .mobile-logo {
          display: flex;
          align-items: center;
          color: #2196F3;
          font-size: 18px;
        }
        .mobile-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 24px;
          cursor: pointer;
        }
        .mobile-nav {
          flex: 1;
          padding: 12px 0;
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
        }
        .mobile-nav-item:hover, .mobile-nav-item.active {
          background: rgba(255, 255, 255, 0.05);
          color: #2196F3;
        }
        .mobile-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .mobile-theme-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #FFC107;
          font-size: 14px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        .mobile-logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: none;
          border: none;
          color: #f07178;
          font-size: 14px;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .nav-section {
            display: none;
          }
          .mobile-toggle {
            display: block;
          }
          .mobile-menu-overlay {
            display: block;
          }
          .dropdown-menu {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 12px 12px 0 0;
          }
        }
        @media (min-width: 769px) and (max-width: 992px) {
          .nav-section {
            gap: 20px;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
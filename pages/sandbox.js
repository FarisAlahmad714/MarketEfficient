import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import SandboxTradingInterface from '../components/sandbox/SandboxTradingInterface';
import SandboxUnlockRequirements from '../components/sandbox/SandboxUnlockRequirements';
import GlobalLoader from '../components/GlobalLoader';
import storage from '../lib/storage';

const SandboxPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  const [sandboxStatus, setSandboxStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    checkSandboxAccess();
  }, [isAuthenticated, user]);

  const checkSandboxAccess = async () => {
    try {
      setLoading(true);
      
      const token = storage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/sandbox/unlock-check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check sandbox access');
      }

      const data = await response.json();
      setSandboxStatus(data);
      
    } catch (error) {
      setError('Failed to load sandbox. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlobalLoader 
        message="Loading Sandbox Trading..." 
        height="calc(100vh - 140px)"
      />
    );
  }

  if (error) {
    return (
      <div className={`error-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="error-content">
          <h1>⚠️ Error</h1>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
        
        <style jsx>{`
          .error-container {
            min-height: calc(100vh - 140px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }
          
          .error-content {
            text-align: center;
            max-width: 400px;
          }
          
          .error-content h1 {
            font-size: 2rem;
            margin-bottom: 16px;
            font-weight: 700;
          }
          
          .dark .error-content h1 {
            color: rgba(255, 255, 255, 0.9);
          }
          
          .light .error-content h1 {
            color: rgba(0, 0, 0, 0.9);
          }
          
          .error-content p {
            font-size: 1rem;
            margin-bottom: 24px;
            line-height: 1.6;
          }
          
          .dark .error-content p {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .light .error-content p {
            color: rgba(0, 0, 0, 0.7);
          }
          
          .retry-button {
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // TEMPORARY BYPASS: Sandbox unlock check disabled for development
  // To re-enable: Uncomment the block below
  /*
  // If sandbox is not unlocked, show requirements
  if (!sandboxStatus?.unlocked) {
    return (
      <SandboxUnlockRequirements 
        sandboxStatus={sandboxStatus}
        onRetryCheck={checkSandboxAccess}
      />
    );
  }
  */

  // Sandbox is unlocked - show trading interface
  return (
    <>
      <div className={`sandbox-page ${darkMode ? 'dark' : 'light'}`}>
        <div className="sandbox-hero">
          <div className="hero-background">
            <div className="grid-overlay"></div>
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
          </div>
          
          <div className="hero-content">
            <div className="badge-container">
              <span className="badge">PRACTICE MODE</span>
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">Sandbox</span>
              <span className="outline-text">Trading</span>
            </h1>
            <p className="hero-subtitle">
              Master your strategy with <span className="highlight">virtual SENSES</span> in a risk-free environment
            </p>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <span className="stat-label">Starting Balance</span>
                  <span className="stat-value">10,000 SENSES</span>
                </div>
              </div>
              <div className="stat-card quarterly-card">
                <div className="stat-icon">🎁</div>
                <div className="stat-info">
                  <span className="stat-label">Quarterly Drops</span>
                  <span className="stat-value">SENSES Fill-up</span>
                </div>
                <div className="pulse-indicator"></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <span className="stat-label">Risk Level</span>
                  <span className="stat-value">Zero Risk</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <span className="stat-label">Execution</span>
                  <span className="stat-value">Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="interface-container">
          <SandboxTradingInterface 
            sandboxStatus={sandboxStatus}
            onPortfolioUpdate={checkSandboxAccess}
          />
        </div>
      </div>

      <style jsx>{`
        .sandbox-page {
          min-height: calc(100vh - 140px);
          overflow-x: hidden;
        }
        
        .sandbox-hero {
          position: relative;
          padding: 80px 20px 60px;
          overflow: hidden;
        }
        
        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }
        
        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        .floating-shapes {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 20s ease-in-out infinite;
        }
        
        .shape-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          top: -200px;
          left: -100px;
          animation-delay: 0s;
        }
        
        .shape-2 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          bottom: -150px;
          right: -100px;
          animation-delay: 5s;
        }
        
        .shape-3 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 10s;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-30px) rotate(90deg); }
          50% { transform: translateY(20px) rotate(180deg); }
          75% { transform: translateY(-20px) rotate(270deg); }
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        
        .badge-container {
          margin-bottom: 20px;
        }
        
        .badge {
          display: inline-block;
          padding: 6px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #3b82f6;
          backdrop-filter: blur(10px);
        }
        
        .hero-title {
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 900;
          line-height: 1.1;
          margin: 0 0 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2em;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        
        .outline-text {
          color: transparent;
          -webkit-text-stroke: 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .dark .outline-text {
          -webkit-text-stroke-color: rgba(255, 255, 255, 0.2);
        }
        
        .light .outline-text {
          -webkit-text-stroke-color: rgba(0, 0, 0, 0.1);
        }
        
        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          line-height: 1.6;
          margin: 0 auto 40px;
          max-width: 600px;
        }
        
        .dark .hero-subtitle {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .hero-subtitle {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .highlight {
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin: 0 auto;
          max-width: 1000px;
        }
        
        .stat-card {
          position: relative;
          padding: 24px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .dark .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .stat-card {
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(59, 130, 246, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
        }
        
        .dark .stat-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .light .stat-card:hover {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card:hover::before {
          opacity: 1;
        }
        
        .stat-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
        }
        
        .dark .stat-icon {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .light .stat-icon {
          background: rgba(0, 0, 0, 0.03);
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        
        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          opacity: 0.7;
        }
        
        .stat-value {
          font-size: 1.125rem;
          font-weight: 700;
        }
        
        .dark .stat-value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .stat-value {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .interface-container {
          padding: 20px;
        }
        
        .quarterly-card {
          position: relative;
          overflow: visible;
        }
        
        .pulse-indicator {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        
        .quarterly-card .stat-icon {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.1));
        }
        
        .dark .quarterly-card {
          background: rgba(245, 158, 11, 0.05);
          border-color: rgba(245, 158, 11, 0.2);
        }
        
        .light .quarterly-card {
          background: rgba(245, 158, 11, 0.03);
          border-color: rgba(245, 158, 11, 0.15);
        }
        
        @media (max-width: 768px) {
          .sandbox-hero {
            padding: 60px 16px 40px;
          }
          
          .hero-title {
            font-size: clamp(2.5rem, 10vw, 4rem);
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .stat-card {
            padding: 20px;
          }
          
          .interface-container {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default SandboxPage;
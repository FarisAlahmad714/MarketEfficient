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

  // If sandbox is not unlocked, show requirements
  if (!sandboxStatus?.unlocked) {
    return (
      <SandboxUnlockRequirements 
        sandboxStatus={sandboxStatus}
        onRetryCheck={checkSandboxAccess}
      />
    );
  }

  // Sandbox is unlocked - show trading interface
  return (
    <>
      <div className={`sandbox-page ${darkMode ? 'dark' : 'light'}`}>
        <div className="sandbox-header">
          <div className="header-content">
            <div className="title-section">
              <h1>🎯 Sandbox Trading</h1>
              <p>Practice trading with virtual SENSES in a safe environment</p>
            </div>
            
          </div>
        </div>

        <SandboxTradingInterface 
          sandboxStatus={sandboxStatus}
          onPortfolioUpdate={checkSandboxAccess}
        />
      </div>

      <style jsx>{`
        .sandbox-page {
          min-height: calc(100vh - 140px);
          padding: 20px;
        }
        
        .sandbox-header {
          margin-bottom: 24px;
        }
        
        .header-content {
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          flex-wrap: wrap;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .title-section h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .title-section p {
          font-size: 1rem;
          margin: 0;
        }
        
        .dark .title-section p {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .title-section p {
          color: rgba(0, 0, 0, 0.7);
        }
        
        
        @media (max-width: 768px) {
          .sandbox-page {
            padding: 16px;
          }
          
          .title-section h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </>
  );
};

export default SandboxPage;
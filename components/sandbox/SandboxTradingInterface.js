import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import SandboxChart from './SandboxChart';
import TradingPanel from './TradingPanel';
import PortfolioOverview from './PortfolioOverview';
import PositionsPanel from './PositionsPanel';
// import PerformanceChart from './PerformanceChart';
import storage from '../../lib/storage';
// WebSocket removed - using API polling instead

const SandboxTradingInterface = ({ sandboxStatus, onPortfolioUpdate }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInteracting, setUserInteracting] = useState(false);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  
  const refreshIntervalRef = useRef(null);
  const priceUpdateIntervalRef = useRef(null);
  
  // Market data is now fetched via portfolio API calls - no WebSocket needed
  const [marketData, setMarketData] = useState({});

  useEffect(() => {
    initializeInterface();
    
    // Smart background updates without interrupting user flow
    setupSmartUpdates();
    
    // Track user activity for intelligent updates
    const trackActivity = () => {
      setLastUserActivity(Date.now());
      setUserInteracting(true);
      
      // Reset interaction flag after 5 seconds of inactivity
      setTimeout(() => setUserInteracting(false), 5000);
    };
    
    // Global activity listeners
    document.addEventListener('click', trackActivity);
    document.addEventListener('keypress', trackActivity);
    document.addEventListener('scroll', trackActivity);
    
    return () => {
      clearAllIntervals();
      document.removeEventListener('click', trackActivity);
      document.removeEventListener('keypress', trackActivity);
      document.removeEventListener('scroll', trackActivity);
    };
  }, []);

  const initializeInterface = async () => {
    try {
      setLoading(true);
      // Fetch portfolio data and initial asset price
      await fetchPortfolioData();
      await fetchAssetPrice(selectedAsset);
    } catch (error) {
      setError('Failed to load trading interface');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioData = async () => {
    try {
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      const data = await response.json();
      setPortfolioData(data);
      
      // Extract market data from portfolio response if available
      if (data.openPositions) {
        const newMarketData = {};
        data.openPositions.forEach(position => {
          if (position.currentPrice) {
            newMarketData[position.symbol] = {
              price: position.currentPrice,
              timestamp: Date.now()
            };
          }
        });
        setMarketData(newMarketData);
      }
      
    } catch (error) {
      throw error;
    }
  };

  // Market data comes from portfolio API calls - real prices via TwelveData

  const refreshPortfolio = async () => {
    try {
      await fetchPortfolioData();
      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }
    } catch (error) {
      // Don't show error to user for background refreshes
      // The user can still manually refresh if needed
    }
  };

  // Smart update system that doesn't interrupt user flow
  const setupSmartUpdates = () => {
    // Frequent price updates (every 10 seconds) - non-intrusive
    priceUpdateIntervalRef.current = setInterval(() => {
      updatePricesOnly();
    }, 10000);
    
    // Portfolio updates only when user is idle (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastUserActivity;
      const isUserIdle = timeSinceActivity > 30000; // 30 seconds of inactivity
      
      if (isUserIdle && !userInteracting) {
        refreshPortfolioSilently();
      }
    }, 30000);
  };

  const clearAllIntervals = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    if (priceUpdateIntervalRef.current) {
      clearInterval(priceUpdateIntervalRef.current);
    }
  };

  // Update only prices without refreshing entire portfolio
  const updatePricesOnly = async () => {
    try {
      if (selectedAsset) {
        const token = storage.getItem('auth_token');
        const response = await fetch(`/api/sandbox/market-data?symbols=${selectedAsset}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data[0]) {
            setMarketData(prev => ({
              ...prev,
              [selectedAsset]: {
                ...prev[selectedAsset],
                price: data.data[0].price,
                timestamp: Date.now()
              }
            }));
          }
        }
      }
    } catch (error) {
      // Silent fail for background price updates
    }
  };

  // Silent portfolio refresh that preserves user state
  const refreshPortfolioSilently = async () => {
    try {
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update portfolio data while preserving any user input state
        setPortfolioData(prevData => ({
          ...data,
          // Preserve any UI state that shouldn't be reset
          lastUpdate: Date.now()
        }));
        
        // Update position prices without disrupting UI
        if (data.openPositions) {
          const newMarketData = {};
          data.openPositions.forEach(position => {
            if (position.currentPrice) {
              newMarketData[position.symbol] = {
                price: position.currentPrice,
                timestamp: Date.now()
              };
            }
          });
          
          setMarketData(prev => ({
            ...prev,
            ...newMarketData
          }));
        }
      }
    } catch (error) {
    }
  };

  const handleAssetChange = async (newAsset) => {
    // Update asset immediately for responsive UI
    setSelectedAsset(newAsset);
    
    // Fetch price in background without blocking UI
    fetchAssetPrice(newAsset).catch(error => {
    });
  };

  const fetchAssetPrice = async (asset) => {
    // Fetch current price for the selected asset
    try {
      const token = storage.getItem('auth_token');
      const response = await fetch(`/api/sandbox/market-data?symbols=${asset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data[0]) {
          setMarketData(prev => ({
            ...prev,
            [asset]: {
              price: data.data[0].price,
              change24h: data.data[0].change24h || 0,
              timestamp: Date.now()
            }
          }));
        }
      }
    } catch (error) {
    }
  };

  const handleTradeSuccess = () => {
    // Immediate but silent refresh after trade success
    // This ensures accurate data without disrupting user flow
    setTimeout(() => {
      refreshPortfolioSilently();
    }, 1000); // Small delay to ensure trade is processed
  };

  if (loading) {
    return (
      <div className={`trading-interface ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trading interface...</p>
          <p className="connection-status">
            📡 Loading market data...
          </p>
        </div>
        
        <style jsx>{`
          .trading-interface {
            min-height: 600px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loading-container {
            text-align: center;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-container p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 1rem;
          }
          
          .light .loading-container p {
            color: rgba(0, 0, 0, 0.7);
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`trading-interface ${darkMode ? 'dark' : 'light'}`}>
        <div className="error-container">
          <h3>⚠️ Interface Error</h3>
          <p>{error}</p>
          <button onClick={initializeInterface} className="retry-button">
            Retry
          </button>
        </div>
        
        <style jsx>{`
          .trading-interface {
            min-height: 600px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .error-container {
            text-align: center;
            max-width: 400px;
          }
          
          .error-container h3 {
            font-size: 1.5rem;
            margin-bottom: 16px;
            font-weight: 700;
          }
          
          .dark .error-container h3 {
            color: rgba(255, 255, 255, 0.9);
          }
          
          .light .error-container h3 {
            color: rgba(0, 0, 0, 0.9);
          }
          
          .error-container p {
            margin-bottom: 24px;
            line-height: 1.6;
          }
          
          .dark .error-container p {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .light .error-container p {
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

  return (
    <div className={`trading-interface ${darkMode ? 'dark' : 'light'}`}>
      <div className="interface-layout">
        {/* Top Section - Portfolio Overview */}
        <div className="top-section">
          <PortfolioOverview 
            portfolioData={portfolioData}
            onRefresh={refreshPortfolio}
          />
          
          {/* Market Data Status */}
          <div className="market-status">
            <span className="status-indicator">
              {userInteracting ? '⏸️' : '🟢'}
            </span>
            <span className="status-text">
              {userInteracting ? 'Auto-refresh paused (trading mode)' : 'Real-time data: Live'}
            </span>
          </div>
        </div>

        {/* Main Section - Chart and Trading */}
        <div className="main-section">
          <div className="chart-container">
            <SandboxChart
              selectedAsset={selectedAsset}
              marketData={marketData}
              onAssetChange={handleAssetChange}
              portfolioData={portfolioData}
            />
          </div>
          
          <div className="trading-panel-container">
            <TradingPanel
              selectedAsset={selectedAsset}
              marketData={marketData}
              portfolioData={portfolioData}
              onTradeSuccess={handleTradeSuccess}
              onUserInteracting={setUserInteracting}
            />
          </div>
        </div>

        {/* Bottom Section - Positions Panel with Performance Tab */}
        <div className="bottom-section">
          <PositionsPanel
            portfolioData={portfolioData}
            marketData={marketData}
            onPositionUpdate={refreshPortfolio}
          />
        </div>
      </div>

      <style jsx>{`
        .trading-interface {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0;
        }
        
        .interface-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: calc(100vh - 200px);
        }
        
        .top-section {
          flex-shrink: 0;
        }
        
        .market-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .market-status {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .market-status {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.8);
        }
        
        .status-indicator {
          font-size: 0.75rem;
        }
        
        .reconnect-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #3b82f6;
          color: white;
          font-weight: 500;
        }
        
        .reconnect-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        
        .main-section {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
          flex: 1;
          min-height: 500px;
        }
        
        .chart-container {
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }
        
        .dark .chart-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .chart-container {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .trading-panel-container {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .dark .trading-panel-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .trading-panel-container {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .bottom-section {
          flex-shrink: 0;
        }
        
        @media (max-width: 1200px) {
          .main-section {
            grid-template-columns: 1fr 320px;
          }
        }
        
        @media (max-width: 1024px) {
          .main-section {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .trading-panel-container {
            order: -1;
          }
        }
        
        @media (max-width: 768px) {
          .trading-interface {
            padding: 0 8px;
          }
          
          .interface-layout {
            gap: 16px;
          }
          
          .main-section {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SandboxTradingInterface;
import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import SandboxChart from './SandboxChart';
import TradingPanel from './TradingPanel';
import PortfolioOverview from './PortfolioOverview';
import PositionsPanel from './PositionsPanel';
import storage from '../../lib/storage';

const SandboxTradingInterface = ({ sandboxStatus, onPortfolioUpdate }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const [selectedAsset, setSelectedAsset] = useState('BTCUSD');
  const [portfolioData, setPortfolioData] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    initializeInterface();
    
    // Set up refresh interval
    refreshIntervalRef.current = setInterval(() => {
      refreshMarketData();
      refreshPortfolio();
    }, 60000); // Refresh every minute
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const initializeInterface = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPortfolioData(),
        fetchMarketData()
      ]);
    } catch (error) {
      console.error('Error initializing sandbox interface:', error);
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
      
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  };

  const fetchMarketData = async () => {
    try {
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/market-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data = await response.json();
      
      if (data.success && data.assets) {
        // Convert assets array to lookup object
        const marketLookup = {};
        data.assets.forEach(asset => {
          marketLookup[asset.symbol] = asset;
        });
        setMarketData(marketLookup);
      }
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  };

  const refreshMarketData = async () => {
    try {
      await fetchMarketData();
    } catch (error) {
      console.error('Error refreshing market data:', error);
    }
  };

  const refreshPortfolio = async () => {
    try {
      await fetchPortfolioData();
      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    }
  };

  const handleAssetChange = (newAsset) => {
    setSelectedAsset(newAsset);
  };

  const handleTradeSuccess = () => {
    // Refresh portfolio data after successful trade
    refreshPortfolio();
  };

  if (loading) {
    return (
      <div className={`trading-interface ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trading interface...</p>
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
            />
          </div>
        </div>

        {/* Bottom Section - Positions */}
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
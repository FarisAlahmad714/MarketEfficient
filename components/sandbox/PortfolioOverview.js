import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const PortfolioOverview = ({ portfolioData, onRefresh }) => {
  const { darkMode } = useContext(ThemeContext);

  if (!portfolioData) {
    return (
      <div className={`portfolio-overview ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-overview">
          <div className="spinner"></div>
          <p>Loading portfolio data...</p>
        </div>
        
        <style jsx>{`
          .portfolio-overview {
            padding: 24px;
            border-radius: 16px;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .dark .portfolio-overview {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .light .portfolio-overview {
            background: rgba(0, 0, 0, 0.01);
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .loading-overview {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-overview p {
            margin: 0;
            font-weight: 500;
          }
          
          .dark .loading-overview p {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .light .loading-overview p {
            color: rgba(0, 0, 0, 0.7);
          }
        `}</style>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getPerformanceColor = (value) => {
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  };

  return (
    <div className={`portfolio-overview ${darkMode ? 'dark' : 'light'}`}>
      <div className="overview-header">
        <h2>Portfolio Overview</h2>
        <button className="refresh-button" onClick={onRefresh}>
          🔄 Refresh
        </button>
        <div className="reset-info">
          📅 Next Reset: {new Date(portfolioData.reset?.nextResetDate).toLocaleDateString()}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card balance-card">
          <div className="metric-header">
            <span className="metric-icon">📈</span>
            <span className="metric-label">Current Balance</span>
          </div>
          <div className="metric-value">
            {formatCurrency(portfolioData.currentValue || portfolioData.balance)} SENSE$
          </div>
          <div 
            className="metric-sublabel"
            style={{ color: getPerformanceColor(portfolioData.totalPnL || 0) }}
          >
            {formatPercentage(portfolioData.totalPnLPercentage || 0)} All Time
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🛡️</span>
            <span className="metric-label">Win Rate</span>
          </div>
          <div 
            className="metric-value"
            style={{ color: getPerformanceColor(portfolioData.performance?.winRate - 50 || 0) }}
          >
            {(portfolioData.performance?.winRate || 0).toFixed(1)}%
          </div>
          <div className="metric-sublabel">
            {portfolioData.trading?.winningTrades || 0}W / {portfolioData.trading?.losingTrades || 0}L
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🏆</span>
            <span className="metric-label">Best Return</span>
          </div>
          <div className="metric-value">
            {formatPercentage(portfolioData.performance?.highWaterMark || 0)}
          </div>
          <div className="metric-sublabel">High Water Mark</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">📊</span>
            <span className="metric-label">Total Trades</span>
          </div>
          <div className="metric-value">{portfolioData.trading?.totalTrades || 0}</div>
          <div className="metric-sublabel">
            Avg Win: {formatCurrency(portfolioData.trading?.averageWin || 0)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⚖️</span>
            <span className="metric-label">Profit Factor</span>
          </div>
          <div 
            className="metric-value"
            style={{ color: getPerformanceColor((portfolioData.performance?.profitFactor || 1) - 1) }}
          >
            {(portfolioData.performance?.profitFactor || 0).toFixed(2)}
          </div>
          <div className="metric-sublabel">Risk Management</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏰</span>
            <span className="metric-label">Last Trade</span>
          </div>
          <div className="metric-value">
            {portfolioData.trading?.lastTradeAt 
              ? new Date(portfolioData.trading.lastTradeAt).toLocaleDateString()
              : 'No trades yet'
            }
          </div>
          <div className="metric-sublabel">Activity</div>
        </div>
      </div>

      <style jsx>{`
        .portfolio-overview {
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .dark .portfolio-overview {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .portfolio-overview {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .overview-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .dark .overview-header h2 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .overview-header h2 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #3b82f6;
          color: white;
        }
        
        .refresh-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        
        .reset-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .reset-info {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .reset-info {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .metric-card {
          padding: 20px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .dark .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .light .metric-card {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
        }
        
        .dark .metric-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .light .metric-card:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .balance-card {
          grid-column: span 2;
        }
        
        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .metric-icon {
          font-size: 1rem;
        }
        
        .metric-label {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .dark .metric-label {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .metric-label {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .metric-value {
          font-size: 1.75rem;
          font-weight: 800;
          font-family: 'SF Mono', Monaco, monospace;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        
        .dark .metric-value {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .metric-value {
          color: rgba(0, 0, 0, 0.95);
        }
        
        .metric-sublabel {
          font-size: 0.75rem;
          font-weight: 500;
          opacity: 0.8;
        }
        
        .dark .metric-sublabel {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .metric-sublabel {
          color: rgba(0, 0, 0, 0.6);
        }
        
        @media (max-width: 768px) {
          .portfolio-overview {
            padding: 20px;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .balance-card {
            grid-column: span 1;
          }
          
          .metric-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PortfolioOverview;
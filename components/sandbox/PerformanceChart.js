import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaChartLine, FaTrendUp, FaTrendDown, FaCalendarAlt } from 'react-icons/fa';

const PerformanceChart = ({ portfolioData }) => {
  const { darkMode } = useContext(ThemeContext);
  const [timeframe, setTimeframe] = useState('7d'); // 1d, 7d, 30d, all

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return '0.00%';
    }
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  // Calculate performance metrics from trades
  const calculateMetrics = () => {
    if (!portfolioData?.recentTrades) return { totalReturn: 0, totalReturnPercent: 0, maxDrawdown: 0, winRate: 0, totalTrades: 0 };

    const trades = portfolioData.recentTrades || [];
    const startingBalance = 100000; // Default starting balance
    const currentBalance = portfolioData?.totalBalance || startingBalance;
    
    const totalReturn = currentBalance - startingBalance;
    const totalReturnPercent = (totalReturn / startingBalance) * 100;

    // Calculate win rate
    const profitableTrades = trades.filter(trade => (trade.realizedPnL || 0) > 0).length;
    const winRate = trades.length > 0 ? (profitableTrades / trades.length) * 100 : 0;

    // Simple max drawdown calculation
    let peak = startingBalance;
    let maxDrawdown = 0;
    let runningBalance = startingBalance;
    
    trades.forEach(trade => {
      runningBalance += (trade.realizedPnL || 0);
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return { totalReturn, totalReturnPercent, maxDrawdown, winRate, totalTrades: trades.length };
  };

  const metrics = calculateMetrics();

  // Generate recent trades list for display
  const getRecentTradesData = () => {
    if (!portfolioData?.recentTrades) return [];
    
    return portfolioData.recentTrades
      .slice(-10) // Last 10 trades
      .reverse() // Most recent first
      .map((trade, index) => {
        const percentage = trade.marginUsed && trade.marginUsed > 0 
          ? ((trade.realizedPnL || 0) / trade.marginUsed) * 100
          : 0;
        
        return {
          ...trade,
          percentage,
          index: index + 1
        };
      });
  };

  const recentTrades = getRecentTradesData();

  return (
    <div className={`performance-chart ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="chart-header">
        <div className="chart-title">
          <FaChartLine />
          <h3>Performance Analytics</h3>
        </div>
        
        <div className="chart-controls">
          <div className="timeframe-info">
            <span>📊 Trading Overview</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon profit">
            <FaTrendUp />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Return</div>
            <div className="metric-value" style={{ color: metrics.totalReturn >= 0 ? '#00ff88' : '#ff4757' }}>
              {metrics.totalReturn >= 0 ? '+' : ''}{formatCurrency(metrics.totalReturn)} SENSES
            </div>
            <div className="metric-subtitle" style={{ color: metrics.totalReturnPercent >= 0 ? '#00ff88' : '#ff4757' }}>
              {formatPercentage(metrics.totalReturnPercent)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon drawdown">
            <FaTrendDown />
          </div>
          <div className="metric-content">
            <div className="metric-label">Max Drawdown</div>
            <div className="metric-value" style={{ color: '#ff4757' }}>
              -{metrics.maxDrawdown.toFixed(2)}%
            </div>
            <div className="metric-subtitle">Peak to trough</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon winrate">
            <FaCalendarAlt />
          </div>
          <div className="metric-content">
            <div className="metric-label">Win Rate</div>
            <div className="metric-value" style={{ color: metrics.winRate >= 50 ? '#00ff88' : '#ffa502' }}>
              {metrics.winRate.toFixed(1)}%
            </div>
            <div className="metric-subtitle">
              {metrics.totalTrades} trades
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades Performance */}
      <div className="trades-performance">
        <h4>Recent Trading Performance</h4>
        {recentTrades.length > 0 ? (
          <div className="trades-list">
            {recentTrades.map((trade, index) => (
              <div key={trade.id || index} className="trade-performance-item">
                <div className="trade-info">
                  <div className="trade-symbol">
                    <span className="symbol">{trade.symbol}</span>
                    <span className={`side ${trade.side}`}>
                      {trade.side?.toUpperCase()} {trade.leverage > 1 ? `${trade.leverage}x` : ''}
                    </span>
                  </div>
                  <div className="trade-dates">
                    {new Date(trade.exitTime).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="trade-result">
                  <div 
                    className="pnl-amount"
                    style={{ color: (trade.realizedPnL || 0) >= 0 ? '#00ff88' : '#ff4757' }}
                  >
                    {(trade.realizedPnL || 0) >= 0 ? '+' : ''}{formatCurrency(trade.realizedPnL || 0)}
                  </div>
                  <div 
                    className="pnl-percentage"
                    style={{ color: trade.percentage >= 0 ? '#00ff88' : '#ff4757' }}
                  >
                    ({formatPercentage(trade.percentage)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-trades">
            <div className="empty-icon">📈</div>
            <h4>No Trading History</h4>
            <p>Start trading to see your performance analytics</p>
          </div>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <h4>Portfolio Overview</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Current Balance:</span>
            <span className="value">{formatCurrency(portfolioData?.totalBalance || 0)} SENSES</span>
          </div>
          <div className="summary-item">
            <span className="label">Available Balance:</span>
            <span className="value">{formatCurrency(portfolioData?.availableBalance || 0)} SENSES</span>
          </div>
          <div className="summary-item">
            <span className="label">Open Positions:</span>
            <span className="value">{portfolioData?.openPositions?.length || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Pending Orders:</span>
            <span className="value">{portfolioData?.pendingOrders?.length || 0}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .performance-chart {
          border-radius: 16px;
          padding: 24px;
          min-height: 500px;
        }
        
        .dark .performance-chart {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .performance-chart {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chart-title h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .dark .chart-title h3 {
          color: rgba(255, 255, 255, 0.9);
        }

        .light .chart-title h3 {
          color: rgba(0, 0, 0, 0.9);
        }

        .timeframe-info {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .dark .timeframe-info {
          color: rgba(255, 255, 255, 0.7);
        }

        .light .timeframe-info {
          color: rgba(0, 0, 0, 0.7);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dark .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .light .metric-card {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: white;
        }

        .metric-icon.profit {
          background: linear-gradient(135deg, #00ff88 0%, #00d4aa 100%);
        }

        .metric-icon.drawdown {
          background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
        }

        .metric-icon.winrate {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        }

        .metric-content {
          flex: 1;
        }

        .metric-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .dark .metric-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .light .metric-label {
          color: rgba(0, 0, 0, 0.7);
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
          margin-bottom: 2px;
        }

        .metric-subtitle {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .dark .metric-subtitle {
          color: rgba(255, 255, 255, 0.6);
        }

        .light .metric-subtitle {
          color: rgba(0, 0, 0, 0.6);
        }

        .trades-performance {
          margin-bottom: 32px;
        }

        .trades-performance h4 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .dark .trades-performance h4 {
          color: rgba(255, 255, 255, 0.9);
        }

        .light .trades-performance h4 {
          color: rgba(0, 0, 0, 0.9);
        }

        .trades-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .trade-performance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .dark .trade-performance-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .light .trade-performance-item {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .trade-performance-item:hover {
          transform: translateY(-1px);
        }

        .dark .trade-performance-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .light .trade-performance-item:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .trade-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .trade-symbol {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .symbol {
          font-weight: 700;
          font-size: 0.875rem;
        }

        .dark .symbol {
          color: rgba(255, 255, 255, 0.9);
        }

        .light .symbol {
          color: rgba(0, 0, 0, 0.9);
        }

        .side {
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .side.long {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }

        .side.short {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
        }

        .trade-dates {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .dark .trade-dates {
          color: rgba(255, 255, 255, 0.6);
        }

        .light .trade-dates {
          color: rgba(0, 0, 0, 0.6);
        }

        .trade-result {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .pnl-amount {
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .pnl-percentage {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .empty-trades {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        .empty-trades h4 {
          margin: 0 0 8px 0;
          font-size: 1.125rem;
          font-weight: 700;
        }

        .dark .empty-trades h4 {
          color: rgba(255, 255, 255, 0.9);
        }

        .light .empty-trades h4 {
          color: rgba(0, 0, 0, 0.9);
        }

        .empty-trades p {
          margin: 0;
          font-size: 0.875rem;
        }

        .dark .empty-trades p {
          color: rgba(255, 255, 255, 0.6);
        }

        .light .empty-trades p {
          color: rgba(0, 0, 0, 0.6);
        }

        .portfolio-summary h4 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .dark .portfolio-summary h4 {
          color: rgba(255, 255, 255, 0.9);
        }

        .light .portfolio-summary h4 {
          color: rgba(0, 0, 0, 0.9);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 8px;
        }

        .dark .summary-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .light .summary-item {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .summary-item .label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .dark .summary-item .label {
          color: rgba(255, 255, 255, 0.7);
        }

        .light .summary-item .label {
          color: rgba(0, 0, 0, 0.7);
        }

        .summary-item .value {
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .dark .summary-item .value {
          color: rgba(255, 255, 255, 0.9);
        }

        .light .summary-item .value {
          color: rgba(0, 0, 0, 0.9);
        }

        @media (max-width: 768px) {
          .performance-chart {
            padding: 16px;
          }

          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .metric-card {
            padding: 16px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceChart;
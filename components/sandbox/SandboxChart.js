import React, { useEffect, useRef, useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaChevronDown, FaClock, FaExpand } from 'react-icons/fa';
import { SANDBOX_ASSETS } from '../../lib/sandbox-constants';
// import SimpleChart from './SimpleChart'; // Not needed anymore
import storage from '../../lib/storage';

const SandboxChart = ({ selectedAsset, marketData, onAssetChange, portfolioData }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const dropdownRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1h');
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const timeframes = [
    { label: '1M', value: '1min' },
    { label: '5M', value: '5min' },
    { label: '15M', value: '15min' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1day' }
  ];

  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];

  useEffect(() => {
    if (selectedAsset) {
      loadChartData();
    }
  }, [selectedAsset, timeframe]); // Removed darkMode to prevent auto-refresh

  useEffect(() => {
    if (chartData.length > 0) {
      initializeChart(chartData);
    }
    
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
      if (chartContainerRef.current?._cleanup) {
        chartContainerRef.current._cleanup();
      }
    };
  }, [chartData, darkMode, fullscreen]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAssetSelector(false);
      }
    };

    if (showAssetSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAssetSelector]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      const token = storage.getItem('auth_token');
      const response = await fetch(`/api/sandbox/market-data?symbols=${selectedAsset}&interval=${timeframe}&type=chart&outputsize=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const data = await response.json();
      
      if (data.success && data.chartData) {
        setChartData(data.chartData);
      }
      
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeChart = async (data) => {
    try {
      if (!chartContainerRef.current || !data.length) {
        return;
      }

      // Clear existing chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }

      const { createChart } = await import('lightweight-charts');
      
      const chartOptions = {
        width: chartContainerRef.current.clientWidth,
        height: fullscreen ? window.innerHeight - 100 : 500,
        layout: {
          background: { color: darkMode ? '#0a0a0a' : '#ffffff' },
          textColor: darkMode ? '#d9d9d9' : '#333333',
        },
        grid: {
          vertLines: { color: darkMode ? '#1a1a1a' : '#f0f0f0' },
          horzLines: { color: darkMode ? '#1a1a1a' : '#f0f0f0' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: darkMode ? '#505050' : '#999999',
            style: 0,
          },
          horzLine: {
            width: 1,
            color: darkMode ? '#505050' : '#999999',
            style: 0,
          },
        },
        timeScale: {
          borderColor: darkMode ? '#333333' : '#d6d6d6',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: darkMode ? '#333333' : '#d6d6d6',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        handleScale: true,
        handleScroll: true,
      };

      chartInstanceRef.current = createChart(chartContainerRef.current, chartOptions);
      
      // Add candlestick series
      const candlestickSeries = chartInstanceRef.current.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#ff4757',
        borderUpColor: '#00ff88',
        borderDownColor: '#ff4757',
        wickUpColor: '#00ff88',
        wickDownColor: '#ff4757',
      });
      
      candlestickSeries.setData(data);
      
      // Add position markers if portfolio has open positions
      if (portfolioData?.openPositions?.length > 0) {
        addPositionMarkers(candlestickSeries);
      }
      
      // Add click handler for order placement
      chartInstanceRef.current.subscribeCrosshairMove((param) => {
        if (param.time && param.seriesPrices) {
          const price = param.seriesPrices.get(candlestickSeries);
          if (price) {
            // Could emit price for order placement
          }
        }
      });
      
      // Fit content
      chartInstanceRef.current.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: fullscreen ? window.innerHeight - 100 : 500
          });
        }
      };

      window.addEventListener('resize', handleResize);
      
      // Store cleanup function but don't return it here
      // (cleanup is handled by the useEffect)
      const cleanup = () => {
        window.removeEventListener('resize', handleResize);
      };
      
      // Just store the cleanup for later
      chartContainerRef.current._cleanup = cleanup;
      
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  };

  const addPositionMarkers = (series) => {
    if (!portfolioData?.openPositions) return;

    portfolioData.openPositions.forEach(position => {
      if (position.symbol === selectedAsset) {
        // Add entry marker
        series.createPriceLine({
          price: position.entryPrice,
          color: position.side === 'long' ? '#00ff88' : '#ff4757',
          lineWidth: 2,
          lineStyle: 0, // solid
          axisLabelVisible: true,
          title: `${position.side.toUpperCase()} Entry: ${position.entryPrice} SENSES`,
        });

        // Add stop loss marker if exists
        if (position.stopLoss?.price) {
          series.createPriceLine({
            price: position.stopLoss.price,
            color: '#ff6b6b',
            lineWidth: 1,
            lineStyle: 1, // dashed
            axisLabelVisible: true,
            title: `Stop Loss: ${position.stopLoss.price} SENSES`,
          });
        }

        // Add take profit marker if exists
        if (position.takeProfit?.price) {
          series.createPriceLine({
            price: position.takeProfit.price,
            color: '#51cf66',
            lineWidth: 1,
            lineStyle: 1, // dashed
            axisLabelVisible: true,
            title: `Take Profit: ${position.takeProfit.price} SENSES`,
          });
        }
      }
    });
  };

  const getCurrentPrice = () => {
    const asset = marketData[selectedAsset];
    return asset?.price || (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
  };

  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const current = chartData[chartData.length - 1].close;
    const previous = chartData[chartData.length - 2].close;
    const change = current - previous;
    const percentage = (change / previous) * 100;
    
    return { change, percentage };
  };

  const priceChange = getPriceChange();
  const currentPrice = getCurrentPrice();

  return (
    <div className={`sandbox-chart ${darkMode ? 'dark' : 'light'} ${fullscreen ? 'fullscreen' : ''}`}>
      {/* Chart Header */}
      <div className="chart-header">
        <div className="asset-info">
          <div 
            ref={dropdownRef}
            className="asset-selector" 
            onClick={(e) => {
              if (!showAssetSelector) {
                const rect = e.currentTarget.getBoundingClientRect();
                setDropdownPosition({
                  bottom: window.innerHeight - rect.top + window.scrollY + 8,
                  left: rect.left + window.scrollX
                });
              }
              setShowAssetSelector(!showAssetSelector);
            }}
          >
            <span className="asset-name">
              {allAssets.find(a => a.symbol === selectedAsset)?.name || selectedAsset}
            </span>
            <span className="asset-symbol">({selectedAsset}/SENSES)</span>
            <FaChevronDown className={`dropdown-icon ${showAssetSelector ? 'open' : ''}`} />
            
            {showAssetSelector && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowAssetSelector(false)} />
                <div 
                  className="asset-dropdown"
                  style={{
                    bottom: `${dropdownPosition.bottom}px`,
                    left: `${dropdownPosition.left}px`
                  }}
                >
                <div className="asset-category">
                  <h4>Cryptocurrencies</h4>
                  {SANDBOX_ASSETS.crypto.map(asset => (
                    <div 
                      key={asset.symbol}
                      className={`asset-option ${selectedAsset === asset.symbol ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssetChange(asset.symbol);
                        setShowAssetSelector(false);
                      }}
                    >
                      <span className="option-name">{asset.name}</span>
                      <span className="option-symbol">{asset.symbol}</span>
                    </div>
                  ))}
                </div>
                
                <div className="asset-category">
                  <h4>Stocks & ETFs</h4>
                  {SANDBOX_ASSETS.stocks.map(asset => (
                    <div 
                      key={asset.symbol}
                      className={`asset-option ${selectedAsset === asset.symbol ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssetChange(asset.symbol);
                        setShowAssetSelector(false);
                      }}
                    >
                      <span className="option-name">{asset.name}</span>
                      <span className="option-symbol">{asset.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
          
          <div className="price-info">
            <span className="current-price">{currentPrice.toFixed(2)} SENSES</span>
            <span className={`price-change ${priceChange.percentage >= 0 ? 'positive' : 'negative'}`}>
              {priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="chart-controls">
          <div className="timeframe-selector">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                className={`timeframe-button ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>
          
          <button 
            className="fullscreen-button"
            onClick={() => setFullscreen(!fullscreen)}
          >
            <FaExpand />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="chart-content">
        {loading && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Loading {selectedAsset} chart...</p>
          </div>
        )}
        
        <div 
          ref={chartContainerRef}
          className="chart-canvas"
          style={{ 
            width: '100%', 
            height: fullscreen ? 'calc(100vh - 200px)' : '500px',
            opacity: loading ? 0.3 : 1 
          }}
        />
      </div>

      <style jsx>{`
        .sandbox-chart {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          height: fit-content;
        }
        
        .sandbox-chart.fullscreen {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          border-radius: 0;
        }
        
        .dark .sandbox-chart {
          background: rgba(10, 10, 10, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .sandbox-chart {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .dark .chart-header {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .light .chart-header {
          border-color: rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.01);
        }
        
        .asset-info {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .asset-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .dark .asset-selector {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .asset-selector {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .asset-selector:hover {
          transform: translateY(-1px);
        }
        
        .dark .asset-selector:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .light .asset-selector:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        
        .asset-name {
          font-weight: 600;
          font-size: 1rem;
        }
        
        .dark .asset-name {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .asset-name {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .asset-symbol {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .asset-symbol {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .asset-symbol {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .dropdown-icon {
          font-size: 0.75rem;
          transition: transform 0.3s ease;
        }
        
        .dropdown-icon.open {
          transform: rotate(180deg);
        }
        
        .asset-dropdown {
          position: fixed !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          border-radius: 12px;
          padding: 16px;
          z-index: 99999 !important;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          width: 300px;
          pointer-events: auto !important;
        }
        
        .dark .asset-dropdown {
          background: rgba(10, 10, 10, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .asset-dropdown {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .asset-category {
          margin-bottom: 16px;
        }
        
        .asset-category:last-child {
          margin-bottom: 0;
        }
        
        .asset-category h4 {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid;
        }
        
        .dark .asset-category h4 {
          color: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .asset-category h4 {
          color: rgba(0, 0, 0, 0.6);
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .asset-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 2px;
        }
        
        .dark .asset-option {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .asset-option {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .dark .asset-option:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .asset-option:hover {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.95);
        }
        
        .asset-option.selected {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          font-weight: 600;
        }
        
        .option-name {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .option-symbol {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .price-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .current-price {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .current-price {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .light .current-price {
          color: rgba(0, 0, 0, 0.95);
        }
        
        .price-change {
          font-size: 1rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .price-change.positive {
          color: #00ff88;
        }
        
        .price-change.negative {
          color: #ff4757;
        }
        
        .chart-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .timeframe-selector {
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 8px;
        }
        
        .dark .timeframe-selector {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .light .timeframe-selector {
          background: rgba(0, 0, 0, 0.02);
        }
        
        .timeframe-button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dark .timeframe-button {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .timeframe-button {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .timeframe-button:hover {
          transform: translateY(-1px);
        }
        
        .dark .timeframe-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .timeframe-button:hover {
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .timeframe-button.active {
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }
        
        .fullscreen-button {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dark .fullscreen-button {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .fullscreen-button {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.7);
        }
        
        .fullscreen-button:hover {
          transform: translateY(-1px);
        }
        
        .dark .fullscreen-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .fullscreen-button:hover {
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .chart-content {
          position: relative;
        }
        
        .chart-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          text-align: center;
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .chart-loading p {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .chart-loading p {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .chart-loading p {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .chart-canvas {
          transition: opacity 0.3s ease;
        }
        
        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 99998;
          background: transparent;
          pointer-events: auto;
        }
        
        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .asset-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .chart-controls {
            width: 100%;
            justify-content: space-between;
          }
          
          .timeframe-selector {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

// Export with SSR disabled like your existing charts
export default dynamic(
  () => Promise.resolve(SandboxChart),
  { ssr: false }
);
import React, { useEffect, useRef, useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaClock, FaExpand, FaPencilAlt } from 'react-icons/fa';
import { SANDBOX_ASSETS } from '../../lib/sandbox-constants';
import SandboxDrawingTools from './SandboxDrawingTools';
import storage from '../../lib/storage';

const SandboxChart = ({ selectedAsset, marketData, onAssetChange, portfolioData }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('4h');
  const [fullscreen, setFullscreen] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [candlestickSeries, setCandlestickSeries] = useState(null);
  
  const timeframes = [
    { label: '1M', value: '1min' },
    { label: '5M', value: '5min' },
    { label: '15M', value: '15min' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1day' }
  ];
  
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];

  // Rest of your chart logic here...
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
          {/* SIMPLE HTML SELECT DROPDOWN */}
          <select 
            className="asset-selector-dropdown"
            value={selectedAsset}
            onChange={(e) => onAssetChange(e.target.value)}
          >
            <optgroup label="Cryptocurrencies">
              {SANDBOX_ASSETS.crypto.map(asset => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </optgroup>
            <optgroup label="Stocks & ETFs">
              {SANDBOX_ASSETS.stocks.map(asset => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </optgroup>
          </select>

          <div className="price-info">
            <div className="current-price">
              {currentPrice.toFixed(2)} SENSES
            </div>
            <div className={`price-change ${priceChange.change >= 0 ? 'positive' : 'negative'}`}>
              {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)} ({priceChange.percentage.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="chart-controls">
          <div className="timeframe-selector">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                className={`timeframe-btn ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="chart-actions">
            <button 
              className="action-btn"
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              title="Drawing Tools"
            >
              <FaPencilAlt />
            </button>
            <button 
              className="action-btn"
              onClick={() => setFullscreen(!fullscreen)}
              title="Fullscreen"
            >
              <FaExpand />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="chart-container"
        style={{ height: fullscreen ? 'calc(100vh - 140px)' : '500px' }}
      />

      {loading && (
        <div className="chart-loading">
          <FaClock /> Loading chart data...
        </div>
      )}

      <style jsx>{`
        .asset-selector-dropdown {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid;
          background: transparent;
          color: inherit;
          font-size: 1rem;
          font-weight: 600;
          min-width: 200px;
          cursor: pointer;
        }
        
        .dark .asset-selector-dropdown {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        
        .light .asset-selector-dropdown {
          border-color: rgba(0, 0, 0, 0.2);
          background: rgba(0, 0, 0, 0.02);
          color: black;
        }
        
        .asset-selector-dropdown:hover {
          border-color: #3b82f6;
        }
        
        .asset-selector-dropdown option {
          background: inherit;
          color: inherit;
        }
        
        /* Rest of your existing CSS... */
      `}</style>
    </div>
  );
};

export default SandboxChart;
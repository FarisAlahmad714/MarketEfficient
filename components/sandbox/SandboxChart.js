import React, { useEffect, useRef, useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaChevronDown, FaClock, FaExpand, FaPencilAlt } from 'react-icons/fa';
import { SANDBOX_ASSETS } from '../../lib/sandbox-constants';
import SandboxDrawingTools from './SandboxDrawingTools';
import storage from '../../lib/storage';

const SandboxChart = ({ selectedAsset, marketData, onAssetChange, portfolioData }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const dropdownRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('4h');
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
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
        setCandlestickSeries(null); // Clear series reference
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

  const getOptimalOutputSize = (timeframe) => {
    // Realistic candle counts with appropriate historical coverage
    const sizeMap = {
      '1min': 480,     // 8 hours (realistic for intraday scalping)
      '5min': 288,     // 24 hours (1 full trading day)  
      '15min': 384,    // 4 days (96 * 4 = good for swing setups)
      '1h': 720,       // 30 days (1 month of hourly data)
      '4h': 180,       // 30 days (1 month of 4h candles)
      '1day': 365      // 1 year (365 daily candles)
    };
    return sizeMap[timeframe] || 300;
  };

  // Get API limits for real data vs simulated data
  const getAPIOutputSize = (timeframe) => {
    // Conservative limits for TwelveData API to avoid rate limiting
    const apiLimits = {
      '1min': 300,     // API limit: ~5 hours
      '5min': 500,     // API limit: ~1.7 days  
      '15min': 800,    // API limit: ~8 days
      '1h': 1000,      // API limit: ~41 days
      '4h': 1000,      // API limit: ~166 days  
      '1day': 1000     // API limit: ~2.7 years
    };
    return apiLimits[timeframe] || 300;
  };

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      const token = storage.getItem('auth_token');
      
      // First try to get real data with API limits
      const apiOutputSize = getAPIOutputSize(timeframe);
      let response = await fetch(`/api/sandbox/market-data?symbols=${selectedAsset}&interval=${timeframe}&type=chart&outputsize=${apiOutputSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const data = await response.json();
      
      if (data.success && data.chartData) {
        let chartData = data.chartData;
        
        // If we got real data but need more historical data, extend with simulated data
        const desiredSize = getOptimalOutputSize(timeframe);
        if (chartData.length < desiredSize && !data.isSimulated) {
          
          // Request additional simulated historical data to fill the gap
          const additionalSize = desiredSize - chartData.length;
          const extendResponse = await fetch(`/api/sandbox/market-data?symbols=${selectedAsset}&interval=${timeframe}&type=chart&outputsize=${additionalSize}&extend=true&latestTime=${chartData[0]?.time}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (extendResponse.ok) {
            const extendData = await extendResponse.json();
            if (extendData.success && extendData.chartData) {
              // Prepend historical simulated data and ensure proper time ordering
              chartData = [...extendData.chartData, ...chartData];
              
              // Sort by time to ensure ascending order (required by lightweight-charts)
              chartData.sort((a, b) => a.time - b.time);
              
              // Remove any duplicate timestamps
              chartData = chartData.filter((candle, index, array) => 
                index === 0 || candle.time !== array[index - 1].time
              );
              
            }
          }
        }
        
        // Final safety check: ensure data is properly sorted and has no duplicates
        chartData.sort((a, b) => a.time - b.time);
        
        // Log first and last candle times for debugging
        if (chartData.length > 0) {
        }
        
        setChartData(chartData);
      }
      
    } catch (error) {
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
          mode: 0,
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
      const candlestickSeriesInstance = chartInstanceRef.current.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#ff4757',
        borderUpColor: '#00ff88',
        borderDownColor: '#ff4757',
        wickUpColor: '#00ff88',
        wickDownColor: '#ff4757',
      });
      
      candlestickSeriesInstance.setData(data);
      setCandlestickSeries(candlestickSeriesInstance);
      
      // Add position markers if portfolio has open positions
      if (portfolioData?.openPositions?.length > 0) {
        addPositionMarkers(candlestickSeriesInstance);
      }
      
      // Add click handler for order placement
      chartInstanceRef.current.subscribeCrosshairMove((param) => {
        if (param.time && param.seriesPrices) {
          const price = param.seriesPrices.get(candlestickSeriesInstance);
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

    // Add pending limit order markers
    if (portfolioData?.pendingOrders?.length > 0) {
      portfolioData.pendingOrders.forEach(order => {
        if (order.symbol === selectedAsset) {
          // Add pending limit order line
          series.createPriceLine({
            price: order.limitPrice,
            color: '#ffa502', // Orange for pending limit orders
            lineWidth: 2,
            lineStyle: 2, // dotted
            axisLabelVisible: true,
            title: `${order.side.toUpperCase()} Limit: ${order.limitPrice} SENSES`,
          });

          // Add TP/SL for pending orders if they exist
          if (order.stopLoss?.price) {
            series.createPriceLine({
              price: order.stopLoss.price,
              color: '#ff6b6b',
              lineWidth: 1,
              lineStyle: 3, // large dashed for pending order SL
              axisLabelVisible: true,
              title: `Pending SL: ${order.stopLoss.price} SENSES`,
            });
          }

          if (order.takeProfit?.price) {
            series.createPriceLine({
              price: order.takeProfit.price,
              color: '#51cf66',
              lineWidth: 1,
              lineStyle: 3, // large dashed for pending order TP
              axisLabelVisible: true,
              title: `Pending TP: ${order.takeProfit.price} SENSES`,
            });
          }
        }
      });
    }
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

  // Update chart with real-time prices (with disposal safety)
  useEffect(() => {
    if (candlestickSeries && 
        chartInstanceRef.current && 
        marketData[selectedAsset] && 
        chartData.length > 0) {
      try {
        const realTimePrice = marketData[selectedAsset].price;
        const lastCandle = chartData[chartData.length - 1];
        
        if (lastCandle && realTimePrice && realTimePrice !== lastCandle.close) {
          // Check if chart is still valid before updating
          if (chartInstanceRef.current && !chartInstanceRef.current._disposed) {
            const updatedCandle = {
              time: lastCandle.time,
              open: lastCandle.open,
              high: Math.max(lastCandle.high, realTimePrice),
              low: Math.min(lastCandle.low, realTimePrice),
              close: realTimePrice
            };
            
            candlestickSeries.update(updatedCandle);
          }
        }
      } catch (error) {
      }
    }
  }, [marketData, selectedAsset, candlestickSeries, chartData]);

  const priceChange = getPriceChange();
  const currentPrice = getCurrentPrice();

  return (
    <div className={`sandbox-chart ${darkMode ? 'dark' : 'light'} ${fullscreen ? 'fullscreen' : ''}`}>
      {/* Chart Header */}
      <div className="chart-header">
        <div className="asset-info">
          <button 
            className="asset-selector-button"
            onClick={() => setShowAssetSelector(true)}
          >
            <span className="selected-asset">
              {allAssets.find(a => a.symbol === selectedAsset)?.name || selectedAsset}
            </span>
            <span className="asset-symbol">({selectedAsset})</span>
            <FaChevronDown />
          </button>

          {/* BEAUTIFUL MODAL */}
          {showAssetSelector && (
            <div className="modal-overlay" onClick={() => setShowAssetSelector(false)}>
              <div className="asset-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Select Asset</h3>
                  <button className="close-btn" onClick={() => setShowAssetSelector(false)}>✕</button>
                </div>
                
                <div className="modal-content">
                  <div className="asset-section">
                    <h4>Cryptocurrencies</h4>
                    <div className="asset-grid">
                      {SANDBOX_ASSETS.crypto.map(asset => (
                        <div 
                          key={asset.symbol}
                          className={`asset-card ${selectedAsset === asset.symbol ? 'selected' : ''}`}
                          onClick={() => {
                            onAssetChange(asset.symbol);
                            setShowAssetSelector(false);
                          }}
                        >
                          <div className="asset-info">
                            <span className="asset-name">{asset.name}</span>
                            <span className="asset-symbol">{asset.symbol}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="asset-section">
                    <h4>Stocks & ETFs</h4>
                    <div className="asset-grid">
                      {SANDBOX_ASSETS.stocks.map(asset => (
                        <div 
                          key={asset.symbol}
                          className={`asset-card ${selectedAsset === asset.symbol ? 'selected' : ''}`}
                          onClick={() => {
                            onAssetChange(asset.symbol);
                            setShowAssetSelector(false);
                          }}
                        >
                          <div className="asset-info">
                            <span className="asset-name">{asset.name}</span>
                            <span className="asset-symbol">{asset.symbol}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
                className={`timeframe-button ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>
          
          <button 
            className={`drawing-tools-button ${showDrawingTools ? 'active' : ''}`}
            onClick={() => setShowDrawingTools(!showDrawingTools)}
            title="Toggle Drawing Tools"
          >
            <FaPencilAlt />
          </button>
          
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
            opacity: loading ? 0.3 : 1,
            position: 'relative'
          }}
        />
        
        {/* Drawing Tools Overlay */}
        {showDrawingTools && chartInstanceRef.current && chartContainerRef.current && candlestickSeries && (
          <SandboxDrawingTools
            chartInstance={chartInstanceRef.current}
            chartContainer={chartContainerRef.current}
            candlestickSeries={candlestickSeries}
            chartData={chartData}
            onDrawingUpdate={setDrawings}
          />
        )}
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
        
        .asset-selector-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid;
          background: transparent;
          color: inherit;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .dark .asset-selector-button {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        
        .light .asset-selector-button {
          border-color: rgba(0, 0, 0, 0.2);
          background: rgba(0, 0, 0, 0.02);
          color: black;
        }
        
        .asset-selector-button:hover {
          border-color: #3b82f6;
          transform: translateY(-1px);
        }
        
        /* BEAUTIFUL MODAL STYLES */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .asset-modal {
          background: var(--modal-bg);
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90vw;
          max-height: 80vh;
          overflow: hidden;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { transform: translateY(-20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        .dark .asset-modal {
          --modal-bg: rgba(10, 10, 10, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .asset-modal {
          --modal-bg: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 16px;
          border-bottom: 1px solid;
        }
        
        .dark .modal-header {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .modal-header {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .dark .close-btn {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .close-btn {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .close-btn:hover {
          background: rgba(255, 0, 0, 0.1);
          color: #ef4444;
        }
        
        .modal-content {
          padding: 16px 24px 24px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .asset-section {
          margin-bottom: 24px;
        }
        
        .asset-section:last-child {
          margin-bottom: 0;
        }
        
        .asset-section h4 {
          margin: 0 0 12px 0;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }
        
        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
        }
        
        .asset-card {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dark .asset-card {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .light .asset-card {
          border-color: rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
        }
        
        .asset-card:hover {
          border-color: #3b82f6;
          transform: translateY(-1px);
        }
        
        .asset-card.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        
        .asset-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .asset-name {
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .asset-symbol {
          font-size: 0.75rem;
          opacity: 0.7;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .asset-dropdown {
          position: fixed !important;
          bottom: auto !important;
          right: auto !important;
          /* old dropdown styles - can be removed later */
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
        
        .drawing-tools-button {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dark .drawing-tools-button {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .drawing-tools-button {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.7);
        }
        
        .drawing-tools-button:hover {
          transform: translateY(-1px);
        }
        
        .dark .drawing-tools-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .drawing-tools-button:hover {
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .drawing-tools-button.active {
          background: #00ff88;
          color: #000;
          font-weight: 600;
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
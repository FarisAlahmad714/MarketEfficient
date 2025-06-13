import React from 'react';

const SimpleChart = ({ data, selectedAsset, darkMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`chart-loading-state ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Loading Chart...</h3>
          <p>Fetching market data for {selectedAsset}</p>
        </div>
        
        <style jsx>{`
          .chart-loading-state {
            width: 100%;
            height: 500px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          
          .dark .chart-loading-state {
            background: linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .light .chart-loading-state {
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .loading-content {
            text-align: center;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-content h3 {
            margin: 0 0 8px 0;
            font-size: 1.25rem;
            font-weight: 700;
          }
          
          .dark .loading-content h3 {
            color: rgba(255, 255, 255, 0.9);
          }
          
          .light .loading-content h3 {
            color: rgba(0, 0, 0, 0.9);
          }
          
          .loading-content p {
            margin: 0;
            font-size: 0.875rem;
          }
          
          .dark .loading-content p {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .light .loading-content p {
            color: rgba(0, 0, 0, 0.6);
          }
        `}</style>
      </div>
    );
  }

  // Professional TradingView-style chart calculations
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.05; // Reduced padding for better view
  const adjustedMax = maxPrice + padding;
  const adjustedMin = minPrice - padding;
  const adjustedRange = adjustedMax - adjustedMin;

  const currentPrice = data[data.length - 1]?.close;
  const previousPrice = data[data.length - 2]?.close;
  const isUp = currentPrice > previousPrice;
  const priceChange = currentPrice - previousPrice;
  const percentChange = (priceChange / previousPrice) * 100;

  // Generate price grid levels
  const gridLevels = [];
  for (let i = 0; i <= 4; i++) {
    const level = i * 25; // 0%, 25%, 50%, 75%, 100%
    const price = adjustedMin + (adjustedRange * (100 - level) / 100);
    gridLevels.push({ level, price });
  }

  return (
    <div className={`professional-chart ${darkMode ? 'dark' : 'light'}`}>
      {/* TradingView Style Header */}
      <div className="tradingview-header">
        <div className="symbol-info">
          <span className="symbol-name">{selectedAsset}</span>
          <div className="price-display">
            <span className={`current-price ${isUp ? 'bullish' : 'bearish'}`}>
              ${currentPrice?.toFixed(2)}
            </span>
            <span className={`price-change ${isUp ? 'bullish' : 'bearish'}`}>
              {isUp ? '+' : ''}{priceChange?.toFixed(2)} ({percentChange?.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="chart-controls-header">
          <div className="indicator-buttons">
            <button className="indicator-btn">Indicators</button>
            <button className="indicator-btn">Compare</button>
          </div>
          <div className="chart-tools">
            <button className="tool-btn active">📊</button>
            <button className="tool-btn">📏</button>
            <button className="tool-btn">✏️</button>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="chart-main-container">
        {/* Price Scale */}
        <div className="price-scale">
          {gridLevels.map(({ level, price }) => (
            <div key={level} className="price-level" style={{ top: `${level}%` }}>
              <span className="price-tick">${price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Chart Canvas Area */}
        <div className="chart-canvas">
          {/* Grid Lines */}
          <div className="chart-grid">
            {gridLevels.map(({ level }) => (
              <div key={level} className="grid-line horizontal" style={{ top: `${level}%` }} />
            ))}
            {/* Vertical grid lines */}
            {[20, 40, 60, 80].map(pos => (
              <div key={pos} className="grid-line vertical" style={{ left: `${pos}%` }} />
            ))}
          </div>

          {/* Candlestick Chart */}
          <div className="candlestick-chart">
            {data.map((candle, index) => {
              const x = (index / (data.length - 1)) * 100;
              const openY = 100 - ((candle.open - adjustedMin) / adjustedRange) * 100;
              const closeY = 100 - ((candle.close - adjustedMin) / adjustedRange) * 100;
              const highY = 100 - ((candle.high - adjustedMin) / adjustedRange) * 100;
              const lowY = 100 - ((candle.low - adjustedMin) / adjustedRange) * 100;
              
              const isBullish = candle.close > candle.open;
              const bodyHeight = Math.abs(closeY - openY);
              const bodyTop = Math.min(openY, closeY);
              
              return (
                <div key={index} className="candlestick-wrapper" style={{ left: `${x}%` }}>
                  {/* Shadow/Wick */}
                  <div 
                    className={`candle-shadow ${isBullish ? 'bullish' : 'bearish'}`}
                    style={{ 
                      top: `${highY}%`, 
                      height: `${lowY - highY}%` 
                    }}
                  />
                  {/* Body */}
                  <div 
                    className={`candle-body ${isBullish ? 'bullish' : 'bearish'}`}
                    style={{ 
                      top: `${bodyTop}%`, 
                      height: `${Math.max(bodyHeight, 1)}%`
                    }}
                    title={`O: $${candle.open.toFixed(2)} H: $${candle.high.toFixed(2)} L: $${candle.low.toFixed(2)} C: $${candle.close.toFixed(2)}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Crosshair */}
          <div className="crosshair-overlay">
            {/* This would be interactive in a real implementation */}
          </div>
        </div>
      </div>

      {/* Time Scale */}
      <div className="time-scale">
        {[0, 25, 50, 75, 100].map(pos => {
          const dataIndex = Math.floor((pos / 100) * (data.length - 1));
          const timestamp = data[dataIndex]?.time;
          const date = timestamp ? new Date(timestamp * 1000) : new Date();
          
          return (
            <div key={pos} className="time-tick" style={{ left: `${pos}%` }}>
              {date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
          );
        })}
      </div>

      {/* Chart Footer */}
      <div className="chart-footer">
        <div className="market-stats">
          <span className="stat-item">
            <span className="stat-label">High:</span>
            <span className="stat-value">${maxPrice.toFixed(2)}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Low:</span>
            <span className="stat-value">${minPrice.toFixed(2)}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Volume:</span>
            <span className="stat-value">{(data[data.length - 1]?.volume || 0).toLocaleString()}</span>
          </span>
        </div>
      </div>

      <style jsx>{`
        .professional-chart {
          width: 100%;
          height: 500px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .dark .professional-chart {
          background: linear-gradient(145deg, #131722 0%, #1e222d 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .professional-chart {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        /* TradingView Header */
        .tradingview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid;
          min-height: 48px;
        }
        
        .dark .tradingview-header {
          background: rgba(25, 28, 36, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .tradingview-header {
          background: rgba(248, 250, 252, 0.95);
          border-color: rgba(0, 0, 0, 0.06);
        }

        .symbol-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .symbol-name {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .symbol-name {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .symbol-name {
          color: rgba(0, 0, 0, 0.9);
        }

        .price-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .current-price {
          font-size: 1rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .current-price.bullish {
          color: #00d4aa;
        }

        .current-price.bearish {
          color: #ff4976;
        }

        .price-change {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .price-change.bullish {
          color: #00d4aa;
          background: rgba(0, 212, 170, 0.1);
        }

        .price-change.bearish {
          color: #ff4976;
          background: rgba(255, 73, 118, 0.1);
        }

        .chart-controls-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .indicator-buttons {
          display: flex;
          gap: 8px;
        }

        .indicator-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dark .indicator-btn {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .indicator-btn {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .chart-tools {
          display: flex;
          gap: 4px;
        }

        .tool-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        
        .dark .tool-btn {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .tool-btn {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.6);
        }

        .tool-btn.active {
          background: #2962ff;
          color: white;
        }

        /* Main Chart Container */
        .chart-main-container {
          flex: 1;
          position: relative;
          display: flex;
        }

        .price-scale {
          width: 60px;
          position: relative;
          border-right: 1px solid;
        }
        
        .dark .price-scale {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(25, 28, 36, 0.3);
        }
        
        .light .price-scale {
          border-color: rgba(0, 0, 0, 0.06);
          background: rgba(248, 250, 252, 0.3);
        }

        .price-level {
          position: absolute;
          right: 8px;
          transform: translateY(-50%);
        }

        .price-tick {
          font-size: 0.75rem;
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 500;
        }
        
        .dark .price-tick {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .price-tick {
          color: rgba(0, 0, 0, 0.6);
        }

        .chart-canvas {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .chart-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .grid-line {
          position: absolute;
        }

        .grid-line.horizontal {
          left: 0;
          right: 0;
          height: 1px;
        }

        .grid-line.vertical {
          top: 0;
          bottom: 0;
          width: 1px;
        }
        
        .dark .grid-line {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .light .grid-line {
          background: rgba(0, 0, 0, 0.03);
        }

        .candlestick-chart {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .candlestick-wrapper {
          position: absolute;
          width: 3px;
          transform: translateX(-1.5px);
        }

        .candle-shadow {
          position: absolute;
          left: 50%;
          width: 1px;
          transform: translateX(-0.5px);
        }

        .candle-shadow.bullish {
          background: #00d4aa;
        }

        .candle-shadow.bearish {
          background: #ff4976;
        }

        .candle-body {
          position: absolute;
          left: 0;
          width: 100%;
          border-radius: 1px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .candle-body:hover {
          opacity: 0.8;
        }

        .candle-body.bullish {
          background: #00d4aa;
          border: 1px solid #00d4aa;
        }

        .candle-body.bearish {
          background: #ff4976;
          border: 1px solid #ff4976;
        }

        .crosshair-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        /* Time Scale */
        .time-scale {
          height: 32px;
          position: relative;
          border-top: 1px solid;
          display: flex;
          align-items: center;
        }
        
        .dark .time-scale {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(25, 28, 36, 0.3);
        }
        
        .light .time-scale {
          border-color: rgba(0, 0, 0, 0.06);
          background: rgba(248, 250, 252, 0.3);
        }

        .time-tick {
          position: absolute;
          transform: translateX(-50%);
          font-size: 0.75rem;
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 500;
        }
        
        .dark .time-tick {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .time-tick {
          color: rgba(0, 0, 0, 0.6);
        }

        /* Chart Footer */
        .chart-footer {
          padding: 8px 16px;
          border-top: 1px solid;
        }
        
        .dark .chart-footer {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(25, 28, 36, 0.3);
        }
        
        .light .chart-footer {
          border-color: rgba(0, 0, 0, 0.06);
          background: rgba(248, 250, 252, 0.3);
        }

        .market-stats {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }

        .stat-label {
          font-weight: 500;
        }
        
        .dark .stat-label {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .stat-label {
          color: rgba(0, 0, 0, 0.6);
        }

        .stat-value {
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 600;
        }
        
        .dark .stat-value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .stat-value {
          color: rgba(0, 0, 0, 0.9);
        }

        @media (max-width: 768px) {
          .professional-chart {
            height: 400px;
          }
          
          .tradingview-header {
            flex-direction: column;
            gap: 8px;
            padding: 8px 12px;
          }
          
          .symbol-info {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
          
          .chart-controls-header {
            gap: 8px;
          }
          
          .market-stats {
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
          }
          
          .price-scale {
            width: 50px;
          }
          
          .candlestick-wrapper {
            width: 2px;
            transform: translateX(-1px);
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleChart;
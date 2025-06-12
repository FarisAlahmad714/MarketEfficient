import React from 'react';

const SimpleChart = ({ data, selectedAsset, darkMode }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`simple-chart ${darkMode ? 'dark' : 'light'}`}>
        <div className="chart-placeholder">
          <div className="placeholder-icon">📈</div>
          <h3>Chart Loading...</h3>
          <p>Fetching market data for {selectedAsset}</p>
        </div>
        
        <style jsx>{`
          .simple-chart {
            width: 100%;
            height: 400px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .dark .simple-chart {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .light .simple-chart {
            background: rgba(0, 0, 0, 0.01);
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .chart-placeholder {
            text-align: center;
          }
          
          .placeholder-icon {
            font-size: 3rem;
            margin-bottom: 16px;
          }
          
          .chart-placeholder h3 {
            margin: 0 0 8px 0;
            font-size: 1.25rem;
            font-weight: 700;
          }
          
          .dark .chart-placeholder h3 {
            color: rgba(255, 255, 255, 0.9);
          }
          
          .light .chart-placeholder h3 {
            color: rgba(0, 0, 0, 0.9);
          }
          
          .chart-placeholder p {
            margin: 0;
            font-size: 0.875rem;
          }
          
          .dark .chart-placeholder p {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .light .chart-placeholder p {
            color: rgba(0, 0, 0, 0.6);
          }
        `}</style>
      </div>
    );
  }

  // Professional candlestick chart visualization
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;
  const adjustedMax = maxPrice + padding;
  const adjustedMin = minPrice - padding;
  const adjustedRange = adjustedMax - adjustedMin;

  const currentPrice = data[data.length - 1]?.close;
  const previousPrice = data[data.length - 2]?.close;
  const isUp = currentPrice > previousPrice;

  return (
    <div className={`professional-chart ${darkMode ? 'dark' : 'light'}`}>
      <div className="chart-header">
        <div className="asset-info">
          <h3>{selectedAsset}</h3>
          <div className={`price ${isUp ? 'up' : 'down'}`}>
            ${currentPrice?.toFixed(2)}
            <span className="change">
              {isUp ? '↗' : '↘'} {Math.abs(currentPrice - previousPrice).toFixed(2)} ({((currentPrice - previousPrice) / previousPrice * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="chart-controls">
          <div className="timeframe-buttons">
            <button className="tf-btn active">1H</button>
            <button className="tf-btn">4H</button>
            <button className="tf-btn">1D</button>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="price-grid">
          {/* Price levels */}
          {[0, 25, 50, 75, 100].map(level => {
            const price = adjustedMin + (adjustedRange * (100 - level) / 100);
            return (
              <div key={level} className="grid-line" style={{ top: `${level}%` }}>
                <span className="price-label">${price.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        
        <div className="candlestick-container">
          {data.map((candle, index) => {
            const x = (index / (data.length - 1)) * 100;
            const openY = 100 - ((candle.open - adjustedMin) / adjustedRange) * 100;
            const closeY = 100 - ((candle.close - adjustedMin) / adjustedRange) * 100;
            const highY = 100 - ((candle.high - adjustedMin) / adjustedRange) * 100;
            const lowY = 100 - ((candle.low - adjustedMin) / adjustedRange) * 100;
            
            const isGreen = candle.close > candle.open;
            const bodyHeight = Math.abs(closeY - openY);
            const bodyTop = Math.min(openY, closeY);
            
            return (
              <div key={index} className="candlestick" style={{ left: `${x}%` }}>
                {/* Wick */}
                <div 
                  className={`wick ${isGreen ? 'green' : 'red'}`}
                  style={{ 
                    top: `${highY}%`, 
                    height: `${lowY - highY}%` 
                  }}
                />
                {/* Body */}
                <div 
                  className={`body ${isGreen ? 'green' : 'red'}`}
                  style={{ 
                    top: `${bodyTop}%`, 
                    height: `${Math.max(bodyHeight, 0.5)}%`
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="chart-footer">
        <div className="market-info">
          <span className="info-item">H: ${maxPrice.toFixed(2)}</span>
          <span className="info-item">L: ${minPrice.toFixed(2)}</span>
          <span className="info-item">Vol: {(data[data.length - 1]?.volume || 0).toLocaleString()}</span>
          <span className="info-item">Candles: {data.length}</span>
        </div>
      </div>

      <style jsx>{`
        .simple-chart {
          width: 100%;
          height: 400px;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        
        .dark .simple-chart {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .simple-chart {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .chart-header {
          margin-bottom: 20px;
        }
        
        .asset-info h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .dark .asset-info h3 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .asset-info h3 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .price {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.25rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .price.up {
          color: #10b981;
        }
        
        .price.down {
          color: #ef4444;
        }
        
        .change {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .chart-container {
          flex: 1;
          margin: 20px 0;
        }
        
        .price-chart {
          width: 100%;
          height: 100%;
        }
        
        .chart-footer {
          margin-top: 20px;
        }
        
        .price-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .price-info {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .price-info {
          color: rgba(0, 0, 0, 0.7);
        }
        
        @media (max-width: 768px) {
          .simple-chart {
            height: 300px;
            padding: 16px;
          }
          
          .price-info {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleChart;
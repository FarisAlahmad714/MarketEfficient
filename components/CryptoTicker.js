import React, { useState, useEffect, memo, useRef } from 'react';

const UPDATE_INTERVAL = 30000; // 30 seconds to avoid too many API calls

const CryptoTicker = () => {
  const [assetPrices, setAssetPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/crypto-prices');
      const data = await response.json();
      
      if (data.success && data.data) {
        setAssetPrices(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Fallback data
      setAssetPrices([
        { symbol: 'BTC', price: 43000 + (Math.random() - 0.5) * 2000, change24h: (Math.random() - 0.5) * 5, type: 'crypto' },
        { symbol: 'ETH', price: 2500 + (Math.random() - 0.5) * 200, change24h: (Math.random() - 0.5) * 5, type: 'crypto' },
        { symbol: 'SOL', price: 80 + (Math.random() - 0.5) * 10, change24h: (Math.random() - 0.5) * 5, type: 'crypto' },
        { symbol: 'BNB', price: 300 + (Math.random() - 0.5) * 20, change24h: (Math.random() - 0.5) * 5, type: 'crypto' },
        { symbol: 'AAPL', price: 175 + (Math.random() - 0.5) * 10, change24h: (Math.random() - 0.5) * 3, type: 'stock' },
        { symbol: 'GLD', price: 190 + (Math.random() - 0.5) * 5, change24h: (Math.random() - 0.5) * 2, type: 'stock' },
        { symbol: 'TSLA', price: 250 + (Math.random() - 0.5) * 20, change24h: (Math.random() - 0.5) * 4, type: 'stock' },
        { symbol: 'NVDA', price: 800 + (Math.random() - 0.5) * 50, change24h: (Math.random() - 0.5) * 6, type: 'stock' }
      ]);
      setLoading(false);
    }
  };

  const startPriceUpdates = () => {
    fetchPrices(); // Fetch immediately when starting
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchPrices, UPDATE_INTERVAL);
  };

  const stopPriceUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPriceUpdates();
      } else {
        startPriceUpdates();
      }
    };

    // Start updates when component mounts and page is visible
    if (!document.hidden) {
      startPriceUpdates();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPriceUpdates(); // Clear interval on component unmount
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  return (
    <div className="asset-ticker">
      {assetPrices.length > 0 ? (
        assetPrices.map((asset, index) => (
          <div key={index} className="ticker-item">
            <span className="ticker-symbol">{asset.symbol}</span>
            <span className="ticker-price">
              ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
            </span>
            <span className={`ticker-change ${asset.change24h >= 0 ? 'positive' : 'negative'}`}>
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
            </span>
          </div>
        ))
      ) : (
        // Loading state
        Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="ticker-item">
            <span className="ticker-symbol">---</span>
            <span className="loading">Loading...</span>
          </div>
        ))
      )}
      <style jsx>{`
        .asset-ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100vw;
          height: 16px;
          display: flex;
          gap: 35px;
          font-size: 11px;
          font-weight: 600;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0.8;
          animation: ticker 180s linear infinite;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(33, 150, 243, 0.05) 50%, 
            transparent 100%);
          box-sizing: border-box;
          contain: layout style paint;
        }
        :global(.dark) .asset-ticker {
          color: rgba(255, 255, 255, 0.9);
        }
        :global(.light) .asset-ticker {
          color: rgba(0, 0, 0, 0.8);
        }
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-200%); }
        }
        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: max-content;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .ticker-symbol {
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 11px;
          min-width: 35px;
        }
        .ticker-price {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 10px;
          min-width: 45px;
        }
        .ticker-change {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 9px;
          min-width: 35px;
        }
        .ticker-change.positive {
          color: #4CAF50;
        }
        .ticker-change.negative {
          color: #f44336;
        }
        .loading {
          color: #6b7280;
          font-size: 9px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default memo(CryptoTicker); 
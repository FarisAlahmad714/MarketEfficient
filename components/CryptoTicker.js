import React, { useState, useEffect, memo, useRef } from 'react';

const cryptoAssetsData = [
  { symbol: 'BTC', price: 50000, change24h: 2.5 },
  { symbol: 'ETH', price: 3000, change24h: -1.3 },
  { symbol: 'SOL', price: 100, change24h: 0.8 },
  { symbol: 'ADA', price: 0.5, change24h: 1.2 },
  { symbol: 'XRP', price: 0.8, change24h: -0.5 },
];

const UPDATE_INTERVAL = 10000; // 10 seconds

const CryptoTicker = () => {
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const intervalRef = useRef(null);

  const fetchPrices = () => {
    setCryptoPrices(cryptoAssetsData.map(asset => ({
      ...asset,
      price: asset.price + (Math.random() - 0.5) * 10, // Simulating price changes
    })));
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
      {cryptoPrices.length > 0 ? (
        cryptoPrices.map((asset, index) => (
          <div key={index} className="ticker-item">
            <span className="ticker-symbol">{asset.symbol}</span>
            <span className="ticker-price">
              ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
            </span>
          </div>
        ))
      ) : (
        cryptoAssetsData.slice(0, 5).map((asset, index) => (
          <div key={index} className="ticker-item">
            <span className="ticker-symbol">{asset.symbol}</span>
            <span className="loading">Loading...</span>
          </div>
        ))
      )}
      <style jsx>{`
        .asset-ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 16px;
          display: flex;
          gap: 35px;
          font-size: 12px;
          font-weight: 600;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0.8;
          animation: ticker 120s linear infinite;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(33, 150, 243, 0.05) 50%, 
            transparent 100%);
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
          gap: 8px;
          min-width: max-content;
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .ticker-symbol {
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 12px;
        }
        .ticker-price {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
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
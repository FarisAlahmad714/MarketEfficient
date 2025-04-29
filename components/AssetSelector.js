// components/AssetSelector.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import TimeframeModal from './TimeframeModal';
import Image from 'next/image';

const AssetSelector = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/assets');
        setAssets(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setShowTimeframeModal(true);
  };

  const handleTimeframeSelect = (timeframe) => {
    if (selectedAsset) {
      router.push(`/bias-test/${selectedAsset.symbol}?timeframe=${timeframe}&random=${Math.random()}`);
    }
  };

  const handleCloseModal = () => {
    setShowTimeframeModal(false);
  };

  // Get gradient colors based on asset type
  const getGradient = (type, symbol) => {
    if (type === 'crypto') {
      if (symbol === 'btc') return 'linear-gradient(135deg, #f2a900 0%, #e09200 100%)';
      if (symbol === 'eth') return 'linear-gradient(135deg, #627eea 0%, #505dac 100%)';
      if (symbol === 'sol') return 'linear-gradient(135deg, #9945ff 0%, #6e29c8 100%)';
      if (symbol === 'bnb') return 'linear-gradient(135deg, #f3ba2f 0%, #d69e1c 100%)';
      return 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)';
    } else if (type === 'equity') {
      if (symbol === 'aapl') return 'linear-gradient(135deg, #a2aaad 0%, #818181 100%)';
      if (symbol === 'tsla') return 'linear-gradient(135deg, #e82127 0%, #b71d23 100%)';
      if (symbol === 'nvda') return 'linear-gradient(135deg, #76b900 0%, #5c9300 100%)';
      return 'linear-gradient(135deg, #3f51b5 0%, #2196F3 100%)';
    }
    return 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)';
  };

  // Get background image URLs for each asset
  const getBackgroundImage = (type, symbol) => {
    // In a production app, you would likely have actual image assets
    // Here we're using a CSS gradient as a fallback
    return `linear-gradient(rgba(10, 10, 10, 0.8), rgba(10, 10, 10, 0.9))`;
  };

  // Get icon class based on asset type and symbol
  const getIconClass = (type, symbol) => {
    if (type === 'crypto') {
      if (symbol === 'btc') return 'fa-bitcoin';
      if (symbol === 'eth') return 'fa-ethereum';
      return 'fa-coins';
    } else if (type === 'equity') {
      if (symbol === 'aapl') return 'fa-apple';
      if (symbol === 'tsla') return 'fa-car';
      if (symbol === 'nvda') return 'fa-microchip';
      return 'fa-chart-line';
    }
    return 'fa-random';
  };

  // Get description based on asset type
  const getDescription = (asset) => {
    if (asset.type === 'crypto') {
      return `Test your prediction skills on ${asset.name} cryptocurrency price movements across multiple timeframes.`;
    } else if (asset.type === 'equity') {
      return `Analyze ${asset.name} stock market patterns and predict future price action in this interactive test.`;
    }
    return `Experience a mix of different assets with the ${asset.name} option, challenging your prediction abilities.`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px', 
        color: '#666'
      }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #2196F3', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <p style={{ fontSize: '18px' }}>Loading assets...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '50px', 
        textAlign: 'center',
        color: '#d32f2f',
        minHeight: '400px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '32px', color: '#d32f2f' }}></i>
        </div>
        <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Error Loading Assets</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ 
          fontSize: '2.8rem', 
          marginBottom: '15px',
          background: 'linear-gradient(90deg, #2196F3, #4CAF50)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>
          Select an Asset for Testing
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '1.2rem', 
          maxWidth: '700px', 
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Test your prediction skills by analyzing price charts and forecasting market movements
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', 
        gap: '30px', 
        marginBottom: '60px' 
      }}>
        {assets.map(asset => (
          <div 
            key={asset.id} 
            onClick={() => handleAssetSelect(asset)}
            style={{ 
              height: '450px',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              background: getBackgroundImage(asset.type, asset.symbol),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ 
              position: 'relative', 
              zIndex: 1, 
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
            }}>
              <div>
                <div style={{ 
                  width: '70px',
                  height: '70px',
                  marginBottom: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  background: getGradient(asset.type, asset.symbol),
                  color: 'white',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                }}>
                  <i className={`fas ${getIconClass(asset.type, asset.symbol)}`}></i>
                </div>
                <h3 style={{ fontSize: '1.6rem', color: 'white', marginBottom: '15px' }}>
                  {asset.name}
                </h3>
                <div style={{ 
                  display: 'inline-block', 
                  padding: '5px 12px', 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#fff',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <i className={`fas ${getIconClass(asset.type, asset.symbol)}`} style={{ marginRight: '5px' }}></i>
                  {asset.type}
                </div>
                <p style={{ color: '#b0b0b0', marginBottom: '20px', lineHeight: 1.5 }}>
                  {getDescription(asset)}
                </p>
              </div>

              <div>
                <div style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                  <i style={{ color: '#4CAF50', marginRight: '8px' }} className="fas fa-chart-line"></i>
                  Available on multiple timeframes
                </div>
                <button style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 25px',
                  background: getGradient(asset.type, asset.symbol),
                  color: 'white',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                  fontSize: '16px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                }}
                >
                  Start Test
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTimeframeModal && (
        <TimeframeModal 
          assetName={selectedAsset?.name}
          onSelect={handleTimeframeSelect}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AssetSelector;
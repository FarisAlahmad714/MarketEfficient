import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const TimeframeModal = ({ assetName, onSelect, onClose }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const timeframes = [
    {
      id: 'random',
      name: 'Mixed Timeframes',
      description: 'Test across different timeframes',
      displayText: 'MIX'
    },
    {
      id: '4h',
      name: '4-Hour Charts',
      description: 'Short-term price action',
      displayText: '4H'
    },
    {
      id: 'daily',
      name: 'Daily Charts',
      description: 'Standard daily price action',
      displayText: '1D'
    },
    {
      id: 'weekly',
      name: 'Weekly Charts',
      description: 'Medium-term price action',
      displayText: '1W'
    },
    {
      id: 'monthly',
      name: 'Monthly Charts',
      description: 'Long-term price action',
      displayText: '1M'
    }
  ];

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{ 
        background: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '70vh',
        overflow: 'auto',
        boxShadow: darkMode ? '0 5px 25px rgba(0,0,0,0.5)' : '0 5px 25px rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 25px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '600',
            color: darkMode ? '#e0e0e0' : 'inherit'
          }}>
            Select Timeframe for {assetName}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none',
              border: 'none',
              fontSize: '1.8rem',
              cursor: 'pointer',
              color: darkMode ? '#999' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = darkMode ? '#333' : '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            &times;
          </button>
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
          padding: '25px',
        }}>
          {timeframes.map(timeframe => (
            <div 
              key={timeframe.id}
              onClick={() => onSelect(timeframe.id)}
              style={{ 
                background: darkMode ? '#2a2a2a' : '#f9f9fa',
                borderRadius: '12px',
                padding: '25px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '2px solid transparent',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = darkMode ? '#333' : '#f0f4fa';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = darkMode 
                  ? '0 8px 15px rgba(0,0,0,0.2)' 
                  : '0 8px 15px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#2196F3';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = darkMode ? '#2a2a2a' : '#f9f9fa';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '70px',
                height: '70px',
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.2) 100%)',
                borderRadius: '50%',
                margin: '0 auto 20px',
              }}>
                <span
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: '700',
                    color: '#2196F3',
                    textAlign: 'center',
                    letterSpacing: '0.5px',
                    filter: 'drop-shadow(0 2px 3px rgba(33, 150, 243, 0.3))'
                  }}
                >
                  {timeframe.displayText}
                </span>
              </div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontWeight: '600', 
                color: darkMode ? '#e0e0e0' : '#333' 
              }}>
                {timeframe.name}
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: darkMode ? '#b0b0b0' : '#666', 
                lineHeight: 1.5 
              }}>
                {timeframe.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeframeModal;
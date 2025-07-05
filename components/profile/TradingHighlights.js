// components/profile/TradingHighlights.js
import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaShare, FaClock, FaFire, FaTrophy } from 'react-icons/fa';

const TradingHighlights = ({ 
  tradingStats = null, 
  bestTrades = [], 
  darkMode = false, 
  isOwnProfile = false,
  onShareTrade = null 
}) => {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [sharingStates, setSharingStates] = useState({});
  const [sharedTrades, setSharedTrades] = useState(new Set());

  // Check shared status for all trades on mount
  useEffect(() => {
    if (bestTrades.length > 0 && isOwnProfile) {
      checkSharedStatus();
    }
  }, [bestTrades, isOwnProfile]);

  const checkSharedStatus = async () => {
    try {
      for (const trade of bestTrades) {
        const response = await fetch('/api/share/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'trading_highlight',
            data: {
              type: 'trading_highlight',
              symbol: trade.symbol,
              side: trade.side,
              return: trade.returnPercent,
              amount: trade.pnl,
              duration: trade.duration,
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              pnl: trade.pnl,
              leverage: trade.leverage
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isShared) {
            const tradeKey = `${trade.symbol}_${trade.side}_${trade.returnPercent}_${trade.entryPrice}`;
            setSharedTrades(prev => new Set([...prev, tradeKey]));
          }
        }
      }
    } catch (error) {
    }
  };

  if (!tradingStats && bestTrades.length === 0) {
    return (
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📈</div>
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '10px'
        }}>
          No Trading Data
        </h3>
        <p style={{
          color: darkMode ? '#b0b0b0' : '#666',
          margin: 0
        }}>
          {isOwnProfile 
            ? "Start sandbox trading to see your highlights here!"
            : "This user hasn't unlocked sandbox trading yet."
          }
        </p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };

  const formatPercentage = (percent) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getReturnColor = (returnPercent) => {
    if (returnPercent > 0) return '#4CAF50';
    if (returnPercent < 0) return '#F44336';
    return darkMode ? '#888' : '#666';
  };

  const getPerformanceLevel = (winRate) => {
    if (winRate >= 80) return { label: 'Expert', color: '#FFD700', icon: '👑' };
    if (winRate >= 70) return { label: 'Advanced', color: '#9C27B0', icon: '🔥' };
    if (winRate >= 60) return { label: 'Skilled', color: '#2196F3', icon: '⭐' };
    if (winRate >= 50) return { label: 'Learning', color: '#FF9800', icon: '📈' };
    return { label: 'Beginner', color: '#666', icon: '🌱' };
  };

  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
  };

  const handleShare = async (trade, e) => {
    e.stopPropagation();
    
    const tradeKey = `${trade.symbol}_${trade.side}_${trade.returnPercent}_${trade.entryPrice}`;
    
    // Prevent double-clicking
    if (sharingStates[tradeKey] || sharedTrades.has(tradeKey)) {
      return;
    }
    
    // Set sharing state
    setSharingStates(prev => ({ ...prev, [tradeKey]: true }));
    
    try {
      if (onShareTrade) {
        await onShareTrade({
          type: 'trading_highlight',
          symbol: trade.symbol,
          side: trade.side,
          return: trade.returnPercent,
          amount: trade.pnl,
          duration: trade.duration,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          pnl: trade.pnl,
          leverage: trade.leverage
        });
        
        // Mark as shared
        setSharedTrades(prev => new Set([...prev, tradeKey]));
      }
    } finally {
      // Reset sharing state
      setSharingStates(prev => ({ ...prev, [tradeKey]: false }));
    }
  };

  const performance = tradingStats ? getPerformanceLevel(tradingStats.winRate) : null;

  return (
    <>
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginTop: 0,
            marginBottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaFire style={{ color: '#FF9800' }} />
           Sandbox Trading Highlights
          </h2>
          
          {performance && (
            <div style={{
              backgroundColor: performance.color + '20',
              color: performance.color,
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>{performance.icon}</span>
              {performance.label} Trader
            </div>
          )}
        </div>

        {/* Trading Stats Overview */}
        {tradingStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '15px',
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: darkMode ? '#262626' : '#f9f9f9',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#2196F3',
                marginBottom: '5px'
              }}>
                {tradingStats.totalTrades}
              </div>
              <div style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '12px'
              }}>
                Total Trades
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getReturnColor(tradingStats.winRate - 50),
                marginBottom: '5px'
              }}>
                {Math.round(tradingStats.winRate)}%
              </div>
              <div style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '12px'
              }}>
                Win Rate
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getReturnColor(tradingStats.totalReturn),
                marginBottom: '5px'
              }}>
                {formatPercentage(tradingStats.totalReturn)}
              </div>
              <div style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '12px'
              }}>
                Total Return
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getReturnColor(tradingStats.bestReturn),
                marginBottom: '5px'
              }}>
                {formatPercentage(tradingStats.bestReturn)}
              </div>
              <div style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '12px'
              }}>
                Best Trade
              </div>
            </div>
          </div>
        )}

        {/* Best Trades */}
        {bestTrades.length > 0 && (
          <>
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaTrophy style={{ color: '#FFD700' }} />
              Best Trades
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {bestTrades.slice(0, 4).map((trade, index) => (
                <div
                  key={index}
                  onClick={() => handleTradeClick(trade)}
                  style={{
                    backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid ${getReturnColor(trade.returnPercent)}33`,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = darkMode 
                      ? '0 8px 20px rgba(0,0,0,0.4)' 
                      : '0 8px 20px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '16px',
                    backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    #{index + 1}
                  </div>

                  {/* Trade Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        color: trade.side === 'long' ? '#4CAF50' : '#F44336',
                        fontSize: '16px'
                      }}>
                        {trade.side === 'long' ? <FaArrowUp /> : <FaArrowDown />}
                      </div>
                      
                      <div>
                        <h4 style={{
                          margin: 0,
                          color: darkMode ? '#e0e0e0' : '#333',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {trade.symbol}
                        </h4>
                        <div style={{
                          color: darkMode ? '#b0b0b0' : '#666',
                          fontSize: '11px',
                          textTransform: 'uppercase'
                        }}>
                          {trade.side}
                        </div>
                      </div>
                    </div>
                    
                    {isOwnProfile && onShareTrade && (() => {
                      const tradeKey = `${trade.symbol}_${trade.side}_${trade.returnPercent}_${trade.entryPrice}`;
                      const isSharing = sharingStates[tradeKey];
                      const isShared = sharedTrades.has(tradeKey);
                      
                      return (
                        <button
                          onClick={(e) => handleShare(trade, e)}
                          disabled={isSharing || isShared}
                          style={{
                            backgroundColor: isShared ? '#4CAF50' : 'transparent',
                            border: 'none',
                            color: isShared ? 'white' : (darkMode ? '#888' : '#666'),
                            cursor: isSharing || isShared ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            opacity: isSharing ? 0.7 : 1
                          }}
                          title={isShared ? "Already shared" : isSharing ? "Sharing..." : "Share trade"}
                        >
                          <FaShare size={12} />
                        </button>
                      );
                    })()}
                  </div>

                  {/* Return & P&L */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: getReturnColor(trade.returnPercent)
                      }}>
                        {formatPercentage(trade.returnPercent)}
                      </div>
                      <div style={{
                        color: darkMode ? '#b0b0b0' : '#666',
                        fontSize: '11px'
                      }}>
                        Return
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: getReturnColor(trade.pnl)
                      }}>
                        {formatCurrency(Math.abs(trade.pnl))}
                      </div>
                      <div style={{
                        color: darkMode ? '#b0b0b0' : '#666',
                        fontSize: '11px'
                      }}>
                        P&L
                      </div>
                    </div>
                  </div>

                  {/* Duration & Entry */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: darkMode ? '#888' : '#666'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FaClock size={10} />
                      {trade.duration || 'N/A'}
                    </div>
                    
                    <div>
                      Entry: {formatCurrency(trade.entryPrice)}
                    </div>
                  </div>

                  {/* Leverage indicator */}
                  {trade.leverage && trade.leverage > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '9px',
                      fontWeight: '700'
                    }}>
                      {trade.leverage}x
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Performance Insights */}
        {tradingStats && (
          <div style={{
            marginTop: '25px',
            paddingTop: '20px',
            borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`
          }}>
            <h4 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              Performance Insights
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {/* Win Streak */}
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#4CAF50',
                  marginBottom: '5px'
                }}>
                  🔥 5
                </div>
                <div style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px'
                }}>
                  Current Win Streak
                </div>
              </div>
              
              {/* Best Day */}
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#2196F3',
                  marginBottom: '5px'
                }}>
                  +12.5%
                </div>
                <div style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px'
                }}>
                  Best Day Return
                </div>
              </div>
              
              {/* Risk Management */}
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#9C27B0',
                  marginBottom: '5px'
                }}>
                  -2.1%
                </div>
                <div style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px'
                }}>
                  Avg Loss Size
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedTrade(null)}
        >
          <div 
            style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '16px',
              padding: '25px',
              maxWidth: '500px',
              maxHeight: '75vh',
              overflowY: 'auto',
              width: '90%',
              border: `2px solid ${getReturnColor(selectedTrade.returnPercent)}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {selectedTrade.side === 'long' ? <FaArrowUp color="#4CAF50" /> : <FaArrowDown color="#F44336" />}
                {selectedTrade.symbol} Trade
              </h3>
              
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getReturnColor(selectedTrade.returnPercent)
              }}>
                {formatPercentage(selectedTrade.returnPercent)}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '5px'
                }}>
                  Entry Price
                </label>
                <div style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {formatCurrency(selectedTrade.entryPrice)}
                </div>
              </div>
              
              <div>
                <label style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '5px'
                }}>
                  Exit Price
                </label>
                <div style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {formatCurrency(selectedTrade.exitPrice)}
                </div>
              </div>
              
              <div>
                <label style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '5px'
                }}>
                  P&L
                </label>
                <div style={{
                  color: getReturnColor(selectedTrade.pnl),
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {formatCurrency(selectedTrade.pnl)}
                </div>
              </div>
              
              <div>
                <label style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '5px'
                }}>
                  Duration
                </label>
                <div style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {selectedTrade.duration || 'N/A'}
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              {isOwnProfile && onShareTrade && (() => {
                const tradeKey = `${selectedTrade.symbol}_${selectedTrade.side}_${selectedTrade.returnPercent}_${selectedTrade.entryPrice}`;
                const isSharing = sharingStates[tradeKey];
                const isShared = sharedTrades.has(tradeKey);
                
                return (
                  <button
                    onClick={async () => {
                      await handleShare(selectedTrade, { stopPropagation: () => {} });
                      setSelectedTrade(null);
                    }}
                    disabled={isSharing || isShared}
                    style={{
                      backgroundColor: isShared ? '#4CAF50' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: isSharing || isShared ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isSharing ? 0.7 : 1
                    }}
                  >
                    <FaShare size={12} />
                    {isShared ? 'Already Shared' : isSharing ? 'Sharing...' : 'Share Trade'}
                  </button>
                );
              })()}
              
              <button
                onClick={() => setSelectedTrade(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TradingHighlights;
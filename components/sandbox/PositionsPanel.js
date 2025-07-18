import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { FaEye, FaTimesCircle, FaEdit, FaArrowUp, FaArrowDown, FaClock, FaShieldAlt, FaShare } from 'react-icons/fa';
import SocialShareModal from '../profile/SocialShareModal';
import storage from '../../lib/storage';
import { getMaxLeverage } from '../../lib/sandbox-constants';
import CryptoLoader from '../CryptoLoader';

const PositionsPanel = ({ portfolioData, marketData, onPositionUpdate }) => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('open');
  const [editingPosition, setEditingPosition] = useState(null);
  const [closingPosition, setClosingPosition] = useState(null);
  const [partialCloseData, setPartialCloseData] = useState({ positionId: null, percentage: 50 });
  const [showPartialClose, setShowPartialClose] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [positionToClose, setPositionToClose] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  
  // Pagination state
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState(null);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return '(0.00%)';
    }
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const calculatePnLPercentage = (realizedPnL, marginUsed, leverage = 1) => {
    if (!marginUsed || marginUsed === 0 || isNaN(marginUsed) || isNaN(realizedPnL)) return 0;
    // Calculate percentage based on margin used (which is the actual capital at risk)
    const percentage = (realizedPnL / marginUsed) * 100;
    return isNaN(percentage) ? 0 : percentage;
  };

  const formatTradeDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const calculateLiquidationPrice = (position) => {
    if (!position || position.leverage <= 1) return null;
    
    // Liquidation at 90% loss of margin
    const liquidationThreshold = 0.9;
    
    // For leveraged positions, calculate the price movement that would cause 90% margin loss
    // liquidationThreshold = (priceMove / entryPrice) * leverage
    // priceMove = liquidationThreshold * entryPrice / leverage
    const priceMovementRatio = liquidationThreshold / position.leverage;
    
    if (position.side === 'long') {
      // Long position loses money when price goes down
      return position.entryPrice * (1 - priceMovementRatio);
    } else {
      // Short position loses money when price goes up
      return position.entryPrice * (1 + priceMovementRatio);
    }
  };

  const getLiquidationRisk = (position, currentPrice) => {
    const liquidationPrice = calculateLiquidationPrice(position);
    if (!liquidationPrice) return null;
    
    const distance = position.side === 'long' 
      ? ((currentPrice - liquidationPrice) / currentPrice) * 100
      : ((liquidationPrice - currentPrice) / currentPrice) * 100;
    
    return {
      price: liquidationPrice,
      distance: distance,
      risk: distance < 20 ? 'high' : distance < 50 ? 'medium' : 'low'
    };
  };

  const getPerformanceColor = (value) => {
    if (value > 0) return '#00ff88';
    if (value < 0) return '#ff4757';
    return darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  };

  const formatDuration = (entryTime) => {
    const now = new Date();
    const entry = new Date(entryTime);
    const diff = now - entry;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  // Load history with pagination
  const loadHistory = async (page = 1, append = false) => {
    setHistoryLoading(true);
    try {
      const token = storage.getItem('auth_token');
      const response = await fetch(`/api/sandbox/history?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('History API error response:', errorData);
        throw new Error(errorData.error || 'Failed to load history');
      }
      
      const data = await response.json();
      
      if (append) {
        setHistoryItems(prev => [...prev, ...data.data]);
      } else {
        setHistoryItems(data.data);
      }
      
      setHistoryPagination(data.pagination);
      setHistoryPage(page);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Load history when tab changes to history
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(1);
    }
  }, [activeTab]);
  
  const handleClosePosition = async (positionId, closeType = 'manual', partialPercentage = null) => {
    try {
      setLoading(true);
      setClosingPosition(positionId);
      
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/close-trade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tradeId: positionId,
          closeType,
          partialPercentage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close position');
      }
      
      // Close partial close modal
      setShowPartialClose(false);
      setPartialCloseData({ positionId: null, percentage: 50 });
      
      // Refresh positions
      if (onPositionUpdate) {
        onPositionUpdate();
      }
      
    } catch (error) {
      alert('Failed to close position: ' + error.message);
    } finally {
      setLoading(false);
      setClosingPosition(null);
    }
  };

  const openPartialCloseModal = (positionId) => {
    setPartialCloseData({ positionId, percentage: 50 });
    setShowPartialClose(true);
  };

  const handlePartialClose = () => {
    handleClosePosition(partialCloseData.positionId, 'partial', partialCloseData.percentage);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/cancel-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel order');
      }
      
      // Refresh positions
      if (onPositionUpdate) {
        onPositionUpdate();
      }
      
    } catch (error) {
      alert('Failed to cancel order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStopLossAndTakeProfit = async (positionId, newStopLoss, newTakeProfit) => {
    try {
      setLoading(true);
      
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/update-trade', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tradeId: positionId,
          stopLoss: newStopLoss,
          takeProfit: newTakeProfit
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update position');
      }
      
      setEditingPosition(null);
      
      // Refresh positions
      if (onPositionUpdate) {
        onPositionUpdate();
      }
      
    } catch (error) {
      alert('Failed to update position: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareTrade = (trade) => {
    const returnPercentage = trade.marginUsed && trade.marginUsed > 0 
      ? (trade.realizedPnL / trade.marginUsed) * 100 
      : 0;
    
    const shareData = {
      type: 'trading_highlight',
      symbol: trade.symbol,
      side: trade.side,
      leverage: trade.leverage,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      return: returnPercentage,
      pnl: trade.realizedPnL,
      duration: trade.duration,
      quantity: trade.quantity,
      marginUsed: trade.marginUsed,
      fees: trade.fees?.total || 0,
      entryReason: trade.preTradeAnalysis?.entryReason || '',
      confidenceLevel: trade.preTradeAnalysis?.confidenceLevel || 0,
      tradeId: trade.id,
      exitTime: trade.exitTime
    };
    
    setShareData(shareData);
    setShowShareModal(true);
  };


  const openPositions = portfolioData?.openPositions || [];
  const pendingOrders = portfolioData?.pendingOrders || [];
  const recentTrades = portfolioData?.recentTrades || [];
  const transactions = portfolioData?.transactions || [];

  // Combine trades and transactions for unified history
  // Debug history count
  console.log('[PositionsPanel] History items:', {
    recentTrades: recentTrades.length,
    transactions: transactions.length,
    total: recentTrades.length + transactions.length
  });
  
  const allHistoryItems = [
    ...recentTrades.map(trade => ({
      ...trade,
      itemType: 'trade',
      date: trade.exitTime,
      displayTitle: trade.symbol,
      displaySubtitle: `${trade.side.toUpperCase()} ${trade.leverage > 1 ? `${trade.leverage}x` : ''}`,
      displayAmount: trade.realizedPnL,
      displayAmountFormatted: `${trade.realizedPnL >= 0 ? '+' : ''}${formatCurrency(trade.realizedPnL || 0)} SENSES`
    })),
    ...transactions.map(tx => ({
      ...tx,
      itemType: 'transaction',
      date: tx.createdAt,
      displayTitle: tx.description,
      displaySubtitle: tx.category,
      displayAmount: tx.amount,
      displayAmountFormatted: tx.formattedAmount + ' SENSES'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className={`positions-panel ${darkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <div className="header-tabs">
          <button 
            className={`tab-button ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            🎯 Open Positions ({openPositions.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pending Orders ({pendingOrders.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📊 History ({historyPagination?.totalItems ?? allHistoryItems.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            📈 Performance
          </button>
        </div>
        {activeTab === 'open' && openPositions.length > 0 && (
          <button 
            className="force-check-button"
            onClick={async () => {
              try {
                const token = await storage.getItem('auth_token');
                const response = await fetch('/api/sandbox/force-check-positions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                if (response.ok) {
                  console.log('Force check completed');
                  // Trigger parent refresh if available
                  if (onTradeSuccess) {
                    onTradeSuccess();
                  }
                }
              } catch (error) {
                console.error('Error forcing position check:', error);
              }
            }}
            title="Force check all positions for SL/TP execution"
          >
            🔄 Check SL/TP
          </button>
        )}
      </div>

      <div className="panel-content">
        {activeTab === 'open' && (
          <div className="positions-content">
            {openPositions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                <h3>No Open Positions</h3>
                <p>Place your first trade to see positions here</p>
              </div>
            ) : (
              <div className="positions-list">
                {openPositions.map((position) => (
                  <div key={position.id} className="position-card">
                    <div className="position-header">
                      <div className="position-title">
                        <span className="symbol">{position.symbol}</span>
                        <span className={`side ${position.side}`}>
                          {position.side === 'long' ? <FaArrowUp /> : <FaArrowDown />}
                          {position.side.toUpperCase()}
                          {position.leverage > 1 && ` ${position.leverage}x`}
                        </span>
                        <span className="quantity">
                          {position.quantity?.toFixed(6) || '0'} units
                        </span>
                        {/* Display SL/TP in header for quick visibility */}
                        {(position.stopLoss?.price || position.takeProfit?.price) && (
                          <span className="sl-tp-indicators">
                            {position.stopLoss?.price && (
                              <span className="sl-indicator" title={`Stop Loss: ${position.stopLoss.price.toFixed(2)} SENSES`}>
                                SL: {position.stopLoss.price.toFixed(0)}
                              </span>
                            )}
                            {position.takeProfit?.price && (
                              <span className="tp-indicator" title={`Take Profit: ${position.takeProfit.price.toFixed(2)} SENSES`}>
                                TP: {position.takeProfit.price.toFixed(0)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      
                      <div className="position-actions">
                        <button 
                          className="action-button edit"
                          onClick={() => setEditingPosition(position.id)}
                          title="Edit Stop Loss"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-button partial"
                          onClick={() => openPartialCloseModal(position.id)}
                          disabled={loading}
                          title="Partial Close"
                        >
                          50%
                        </button>
                        <button 
                          className="action-button close"
                          onClick={() => {
                            setPositionToClose(position);
                            setShowCloseConfirm(true);
                          }}
                          disabled={loading || closingPosition === position.id}
                          title="Close Position"
                        >
                          {closingPosition === position.id ? (
                            <div className="button-spinner"></div>
                          ) : (
                            <FaTimesCircle />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="position-details">
                      <div className="detail-row">
                        <span className="detail-label">Entry Price:</span>
                        <span className="detail-value">{position.entryPrice?.toFixed(2)} SENSES</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">
                          Current Price:
                          <span 
                            className="info-icon" 
                            title={`Market price movement since entry. For ${position.side} positions: ${position.side === 'long' ? 'Green = profit, Red = loss' : 'Green = market up (loss for short), Red = market down (profit for short)'}`}
                            style={{ 
                              marginLeft: '4px', 
                              cursor: 'help',
                              color: '#666',
                              fontSize: '0.7rem'
                            }}
                          >
                            ⓘ
                          </span>
                        </span>
                        <span className="detail-value">
                          {marketData[position.symbol]?.price?.toFixed(2) || position.currentPrice?.toFixed(2)} SENSES
                          {(() => {
                            const currentPrice = marketData[position.symbol]?.price || position.currentPrice;
                            const priceChange = currentPrice - position.entryPrice;
                            const priceChangePercent = (priceChange / position.entryPrice) * 100;
                            
                            // Color based on price change direction: green for positive, red for negative
                            const color = priceChange >= 0 ? '#00ff88' : '#ff4757';
                            
                            return (
                              <span className="price-change" style={{ 
                                color: color, 
                                marginLeft: '8px', 
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} SENSES | {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                              </span>
                            );
                          })()} 
                        </span>
                      </div>
                      
                      {/* P&L Breakdown */}
                      <div className="detail-row pnl-breakdown">
                        <span className="detail-label">P&L Breakdown:</span>
                        <div className="pnl-details">
                          {(() => {
                            const currentPrice = marketData[position.symbol]?.price || position.currentPrice;
                            const priceChange = currentPrice - position.entryPrice;
                            
                            // Calculate raw P&L from price movement using standardized logic (with leverage)
                            const rawPnL = position.side === 'long' 
                              ? priceChange * position.quantity * (position.leverage || 1)
                              : -priceChange * position.quantity * (position.leverage || 1);
                            
                            // Actual P&L includes fees
                            const actualPnL = position.unrealizedPnL || 0;
                            const estimatedFees = rawPnL - actualPnL;
                            
                            return (
                              <div className="pnl-breakdown-details">
                                <div className="pnl-line">
                                  <span>Price Movement:</span>
                                  <span style={{ color: rawPnL >= 0 ? '#00ff88' : '#ff4757' }}>
                                    {rawPnL >= 0 ? '+' : ''}{rawPnL.toFixed(2)} SENSES
                                  </span>
                                </div>
                                {position.fees?.funding > 0 && (
                                  <div className="pnl-line">
                                    <span>Funding Fees:</span>
                                    <span style={{ color: '#ff4757' }}>
                                      -{(position.fees.funding || 0).toFixed(4)} SENSES
                                    </span>
                                  </div>
                                )}
                                {estimatedFees !== 0 && (
                                  <div className="pnl-line">
                                    <span>Trading Fees:</span>
                                    <span style={{ color: '#ff4757' }}>
                                      -{Math.abs(estimatedFees).toFixed(2)} SENSES
                                    </span>
                                  </div>
                                )}
                                <div className="pnl-line total">
                                  <span>Net P&L:</span>
                                  <span style={{ color: actualPnL >= 0 ? '#00ff88' : '#ff4757' }}>
                                    {actualPnL >= 0 ? '+' : ''}{actualPnL.toFixed(2)} SENSES
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Position Value:</span>
                        <span className="detail-value">{formatCurrency((marketData[position.symbol]?.price || position.currentPrice || position.entryPrice) * position.quantity * (position.leverage || 1))} SENSES</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Margin Used:</span>
                        <span className="detail-value">{formatCurrency(position.marginUsed || 0)} SENSES</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Entry Time:</span>
                        <span className="detail-value">{formatTradeDate(position.entryTime)}</span>
                      </div>
                      
                      {position.stopLoss?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Stop Loss:</span>
                          <span className="detail-value stop-loss">
                            {position.stopLoss.price.toFixed(2)} SENSES
                          </span>
                        </div>
                      )}
                      
                      {position.takeProfit?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Take Profit:</span>
                          <span className="detail-value take-profit">
                            {position.takeProfit.price.toFixed(2)} SENSES
                          </span>
                        </div>
                      )}
                      
                      {/* Liquidation Risk Info */}
                      {position.leverage > 1 && (() => {
                        const currentPrice = marketData[position.symbol]?.price || position.currentPrice;
                        const liquidationInfo = getLiquidationRisk(position, currentPrice);
                        
                        if (liquidationInfo) {
                          return (
                            <div className="detail-row">
                              <span className="detail-label">Liquidation Price:</span>
                              <span className="detail-value">
                                {liquidationInfo.price.toFixed(2)} SENSES
                                <span className={`risk-indicator risk-${liquidationInfo.risk}`} style={{
                                  marginLeft: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  color: liquidationInfo.risk === 'high' ? '#ff4757' : liquidationInfo.risk === 'medium' ? '#ffa502' : '#7bed9f'
                                }}>
                                  ({liquidationInfo.distance.toFixed(1)}% away)
                                </span>
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Funding Fee Info for Leveraged Positions */}
                      {position.leverage > 1 && (
                        <div className="detail-row">
                          <span className="detail-label">
                            Funding Fee Rate:
                            <span 
                              className="funding-fee-tooltip" 
                              style={{ 
                                marginLeft: '4px', 
                                cursor: 'help',
                                color: '#ffa502',
                                fontSize: '0.7rem',
                                position: 'relative',
                                display: 'inline-block'
                              }}
                            >
                              ⓘ
                              <span className="tooltip-text">
                                Leveraged positions are charged 0.01% every 8 hours (0.03% daily) to simulate real trading costs
                              </span>
                            </span>
                          </span>
                          <span className="detail-value" style={{ color: '#ffa502' }}>
                            0.01% / 8h
                            {position.fees?.funding > 0 && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '0.75rem',
                                color: '#ff4757'
                              }}>
                                (Paid: {(position.fees.funding || 0).toFixed(4)} SENSES)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="position-performance">
                      <div className="pnl-section">
                        <div 
                          className="pnl-amount"
                          style={{ color: getPerformanceColor(position.unrealizedPnL || 0) }}
                        >
                          {position.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(position.unrealizedPnL || 0)} SENSES
                        </div>
                        <div 
                          className="pnl-percentage"
                          style={{ color: getPerformanceColor(position.pnlPercentage || 0) }}
                        >
                          ({formatPercentage(position.pnlPercentage || 0)})
                        </div>
                      </div>
                      
                      <div className="position-meta">
                        <div className="meta-item">
                          <FaClock />
                          <span>{formatDuration(position.entryTime)}</span>
                        </div>
                        <div className="meta-item">
                          <span className="confidence">
                            Confidence: {position.confidenceLevel || 'N/A'}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trade Reason Preview */}
                    <div className="trade-analysis-preview">
                      <div className="analysis-item">
                        <strong>Entry Reason:</strong> {position.entryReason}
                      </div>
                    </div>

                    {/* Edit Stop Loss & Take Profit Modal */}
                    {editingPosition === position.id && (
                      <div className="edit-modal">
                        <div className="modal-content edit-sl-tp-modal">
                          <h4>Edit Stop Loss & Take Profit</h4>
                          
                          <div className="edit-fields">
                            <div className="edit-field">
                              <label>Stop Loss Price (SENSES)</label>
                              <input
                                type="number"
                                placeholder={position.stopLoss?.price || "Enter stop loss price"}
                                step="0.01"
                                className="modal-input"
                                id="stopLossInput"
                              />
                            </div>
                            
                            <div className="edit-field">
                              <label>Take Profit Price (SENSES)</label>
                              <input
                                type="number"
                                placeholder={position.takeProfit?.price || "Enter take profit price"}
                                step="0.01"
                                className="modal-input"
                                id="takeProfitInput"
                              />
                            </div>
                          </div>
                          
                          <div className="modal-actions">
                            <button 
                              className="modal-button cancel"
                              onClick={() => setEditingPosition(null)}
                            >
                              Cancel
                            </button>
                            <button 
                              className="modal-button save"
                              onClick={() => {
                                const stopLossInput = document.getElementById('stopLossInput');
                                const takeProfitInput = document.getElementById('takeProfitInput');
                                const newStopLoss = parseFloat(stopLossInput.value) || null;
                                const newTakeProfit = parseFloat(takeProfitInput.value) || null;
                                handleEditStopLossAndTakeProfit(position.id, newStopLoss, newTakeProfit);
                              }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Close Confirmation Modal */}
        {showCloseConfirm && positionToClose && (
          <div className="modal-overlay">
            <div className="modal-content close-confirm-modal">
              <h4>⚠️ Close Position</h4>
              <p>Are you sure you want to close this position?</p>
              
              <div className="position-summary">
                <div className="summary-item">
                  <span className="label">Asset:</span>
                  <span className="value">{positionToClose.symbol} {positionToClose.side.toUpperCase()} {positionToClose.leverage}x</span>
                </div>
                <div className="summary-item">
                  <span className="label">Quantity:</span>
                  <span className="value">{positionToClose.quantity?.toFixed(6)} units</span>
                </div>
                <div className="summary-item">
                  <span className="label">Current P&L:</span>
                  <span className="value" style={{ color: (positionToClose.unrealizedPnL || 0) >= 0 ? '#00ff88' : '#ff4757' }}>
                    {(positionToClose.unrealizedPnL || 0) >= 0 ? '+' : ''}{formatCurrency(positionToClose.unrealizedPnL || 0)} SENSES
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Entry Reason:</span>
                  <span className="value reason">{positionToClose.entryReason || 'No reason provided'}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => {
                    setShowCloseConfirm(false);
                    setPositionToClose(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button danger"
                  onClick={() => {
                    handleClosePosition(positionToClose.id);
                    setShowCloseConfirm(false);
                    setPositionToClose(null);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Closing...' : 'Yes, Close Position'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Confirmation Modal */}
        {showCancelConfirm && orderToCancel && (
          <div className="modal-overlay">
            <div className="modal-content close-confirm-modal">
              <h4>⚠️ Cancel Order</h4>
              <p>Are you sure you want to cancel this pending order?</p>
              
              <div className="position-summary">
                <div className="summary-item">
                  <span className="label">Asset:</span>
                  <span className="value">{orderToCancel.symbol} {orderToCancel.side.toUpperCase()} {orderToCancel.leverage}x</span>
                </div>
                <div className="summary-item">
                  <span className="label">Order Type:</span>
                  <span className="value">{orderToCancel.type.toUpperCase()}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Quantity:</span>
                  <span className="value">{orderToCancel.quantity} units</span>
                </div>
                <div className="summary-item">
                  <span className="label">Limit Price:</span>
                  <span className="value">{orderToCancel.limitPrice?.toFixed(2)} SENSES</span>
                </div>
                <div className="summary-item">
                  <span className="label">Entry Reason:</span>
                  <span className="value reason">{orderToCancel.entryReason || 'No reason provided'}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setOrderToCancel(null);
                  }}
                >
                  Keep Order
                </button>
                <button 
                  className="modal-button danger"
                  onClick={() => {
                    handleCancelOrder(orderToCancel.id);
                    setShowCancelConfirm(false);
                    setOrderToCancel(null);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Partial Close Modal */}
        {showPartialClose && (
          <div className="modal-overlay">
            <div className="modal-content partial-close-modal">
              <h4>Partial Close Position</h4>
              <p>Select the percentage of your position to close:</p>
              
              <div className="percentage-selector">
                <label>Close Percentage: {partialCloseData.percentage}%</label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="10"
                  value={partialCloseData.percentage}
                  onChange={(e) => setPartialCloseData({
                    ...partialCloseData,
                    percentage: parseInt(e.target.value)
                  })}
                  className="percentage-slider"
                />
                <div className="percentage-labels">
                  <span>10%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>90%</span>
                </div>
              </div>

              <div className="percentage-presets">
                {[25, 50, 75].map(percent => (
                  <button
                    key={percent}
                    className={`preset-button ${partialCloseData.percentage === percent ? 'active' : ''}`}
                    onClick={() => setPartialCloseData({
                      ...partialCloseData,
                      percentage: percent
                    })}
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => setShowPartialClose(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button save"
                  onClick={handlePartialClose}
                  disabled={loading}
                >
                  {loading ? 'Closing...' : `Close ${partialCloseData.percentage}%`}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-content">
            {pendingOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <h3>No Pending Orders</h3>
                <p>Place limit orders to see them here</p>
              </div>
            ) : (
              <div className="pending-list">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-title">
                        <span className="symbol">{order.symbol}</span>
                        <span className={`side ${order.side}`}>
                          {order.side === 'long' ? <FaArrowUp /> : <FaArrowDown />}
                          {order.side.toUpperCase()} LIMIT
                          {order.leverage > 1 && ` ${order.leverage}x`}
                        </span>
                        <span className="quantity">
                          {order.quantity} units
                        </span>
                      </div>
                      
                      <div className="order-actions">
                        <button 
                          className="action-button cancel"
                          onClick={() => {
                            setOrderToCancel(order);
                            setShowCancelConfirm(true);
                          }}
                          disabled={loading}
                          title="Cancel Order"
                        >
                          {loading ? (
                            <div className="button-spinner"></div>
                          ) : (
                            <FaTimesCircle />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="detail-row">
                        <span className="detail-label">Limit Price:</span>
                        <span className="detail-value">{order.limitPrice?.toFixed(2)} SENSES</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Current Price:</span>
                        <span className="detail-value">
                          {marketData[order.symbol]?.price?.toFixed(2) || 'Loading...'} SENSES
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Leverage:</span>
                        <span className="detail-value">{order.leverage || 1}x</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Margin Reserved:</span>
                        <span className="detail-value">{formatCurrency(order.marginReserved)} SENSES</span>
                      </div>
                      
                      {order.stopLoss?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Stop Loss:</span>
                          <span className="detail-value stop-loss">
                            {order.stopLoss.price.toFixed(2)} SENSES
                          </span>
                        </div>
                      )}
                      
                      {order.takeProfit?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Take Profit:</span>
                          <span className="detail-value take-profit">
                            {order.takeProfit.price.toFixed(2)} SENSES
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="order-meta">
                      <div className="meta-item">
                        <FaClock />
                        <span>Placed {formatDuration(order.orderTime)} ago</span>
                      </div>
                      <div className="meta-item">
                        <span className="confidence">
                          Confidence: {order.confidenceLevel || 'N/A'}/10
                        </span>
                      </div>
                    </div>

                    {/* Order Reason Preview */}
                    <div className="order-analysis-preview">
                      <div className="analysis-item">
                        <strong>Entry Reason:</strong> {order.entryReason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-content">
            {historyLoading && historyItems.length === 0 ? (
              <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                <CryptoLoader 
                  message="Loading history..." 
                  height="200px"
                  lightMode={!darkMode}
                />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No History</h3>
                <p>Your trades and transactions will appear here</p>
              </div>
            ) : (
              <>
                <div className="history-list">
                  {historyItems.map((item) => (
                  <div key={item.id} className={`history-card ${item.itemType}`}>
                    <div className="history-header">
                      <div className="item-info">
                        <span className="item-title">{item.displayTitle}</span>
                        <span className={`item-subtitle ${item.itemType === 'trade' ? item.side : 'transaction'}`}>
                          {item.itemType === 'trade' ? (
                            <>
                              {item.side === 'long' ? <FaArrowUp /> : <FaArrowDown />}
                              {item.displaySubtitle}
                            </>
                          ) : (
                            <>
                              {item.type === 'deposit' ? '💰' : item.type === 'fee' ? '💸' : '📊'}
                              {item.displaySubtitle}
                            </>
                          )}
                        </span>
                        {item.itemType === 'trade' && (
                          <span className="quantity">{item.quantity?.toFixed(6) || '0'} units</span>
                        )}
                      </div>
                      
                      <div className="item-actions">
                        <div 
                          className="item-result"
                          style={{ color: getPerformanceColor(item.displayAmount || 0) }}
                        >
                          <div className="amount">
                            {item.displayAmountFormatted}
                          </div>
                          {item.itemType === 'trade' && (
                            <div className="result-percentage">
                              {(() => {
                                let percentage = 0;
                                if (item.marginUsed && item.marginUsed > 0) {
                                  percentage = (item.realizedPnL / item.marginUsed) * 100;
                                }
                                return `(${formatPercentage(percentage)})`;
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {item.itemType === 'trade' && (
                          <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                            <button
                              onClick={() => handleShareTrade(item)}
                              className="share-trade-button"
                              style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#45a049';
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#4CAF50';
                                e.target.style.transform = 'scale(1)';
                              }}
                              title="Share this trade externally"
                            >
                              <FaShare size={10} />
                              Share
                            </button>
                            
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="history-details">
                      <div className="detail-grid">
                        {item.itemType === 'trade' ? (
                          <>
                            <div className="detail-item">
                              <span className="label">Entry:</span>
                              <span className="value">{item.entryPrice?.toFixed(2)} SENSES</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Exit:</span>
                              <span className="value">{item.exitPrice?.toFixed(2)} SENSES</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Duration:</span>
                              <span className="value">{item.duration}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Margin:</span>
                              <span className="value">{formatCurrency(item.marginUsed || 0)} SENSES</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Fees:</span>
                              <span className="value" style={{ color: '#ff4757' }}>
                                -{formatCurrency(item.fees?.total || 0)} SENSES
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Date:</span>
                              <span className="value">
                                {formatTradeDate(item.exitTime)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="detail-item">
                              <span className="label">Type:</span>
                              <span className="value">{item.category}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Amount:</span>
                              <span className="value" style={{ color: getPerformanceColor(item.amount) }}>
                                {item.displayAmountFormatted}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Balance Before:</span>
                              <span className="value">{formatCurrency(item.balanceBefore)} SENSES</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Balance After:</span>
                              <span className="value">{formatCurrency(item.balanceAfter)} SENSES</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Date:</span>
                              <span className="value">
                                {formatTradeDate(item.createdAt)}
                              </span>
                            </div>
                            {item.metadata?.quarter && (
                              <div className="detail-item">
                                <span className="label">Period:</span>
                                <span className="value">Q{item.metadata.quarter} {item.metadata.year}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Trade Analysis Preview - same as Open Positions */}
                      {item.itemType === 'trade' && item.entryReason && (
                        <div className="trade-analysis-preview">
                          <div className="analysis-item">
                            <strong>Entry Reason:</strong> {item.entryReason}
                          </div>
                          {item.closeReason && (
                            <div className="analysis-item">
                              <strong>Close Reason:</strong> 
                              <span className={`close-reason ${item.closeReason}`} style={{
                                marginLeft: '5px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.85em',
                                backgroundColor: item.closeReason === 'stop_loss' ? '#ff4757' :
                                               item.closeReason === 'take_profit' ? '#00ff88' :
                                               item.closeReason === 'liquidation' ? '#ff6348' :
                                               '#666',
                                color: '#fff'
                              }}>
                                {item.closeReason === 'stop_loss' ? '🛑 Stop Loss' :
                                 item.closeReason === 'take_profit' ? '🎯 Take Profit' :
                                 item.closeReason === 'liquidation' ? '⚠️ Liquidated' :
                                 item.closeReason === 'manual' ? '👤 Manual' : 
                                 item.closeReason}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                </div>
                
                {/* Load More Button */}
                {historyPagination?.hasMore && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={() => loadHistory(historyPage + 1, true)}
                      disabled={historyLoading}
                    >
                      {historyLoading ? 'Loading...' : (
                        <>
                          Load More 
                          <span className="remaining">
                            ({historyPagination.totalItems - historyItems.length} remaining)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-content">
            {(() => {
              // Calculate performance metrics
              const calculateMetrics = () => {
                if (!recentTrades.length) return { totalReturn: 0, totalReturnPercent: 0, winRate: 0, totalTrades: 0 };

                const startingBalance = 100000;
                
                // Try multiple ways to get current balance - use currentValue which includes unrealized P&L
                const currentBalance = portfolioData?.currentValue || 
                                     portfolioData?.totalBalance || 
                                     portfolioData?.balance || 
                                     startingBalance;
                
                
                // Calculate total return - use API calculated values if available
                const totalReturn = portfolioData?.totalPnL || (() => {
                  const totalPnLFromTrades = recentTrades.reduce((sum, trade) => {
                    const pnl = trade.realizedPnL || 0;
                    return sum + pnl;
                  }, 0);
                  return totalPnLFromTrades;
                })();
                
                const totalReturnPercent = portfolioData?.totalPnLPercentage || 
                                         (startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0);

                const profitableTrades = recentTrades.filter(trade => (trade.realizedPnL || 0) > 0).length;
                const winRate = recentTrades.length > 0 ? (profitableTrades / recentTrades.length) * 100 : 0;


                return { totalReturn, totalReturnPercent, winRate, totalTrades: recentTrades.length };
              };

              const metrics = calculateMetrics();

              return (
                <>
                  <div className="performance-header">
                    <h3>📈 Performance Analytics</h3>
                    <p>Overview of your trading performance</p>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-content">
                        <div className="metric-label">Total Return</div>
                        <div className="metric-value" style={{ color: metrics.totalReturn >= 0 ? '#00ff88' : '#ff4757' }}>
                          {metrics.totalReturn >= 0 ? '+' : ''}{formatCurrency(metrics.totalReturn)} SENSES
                        </div>
                        <div className="metric-subtitle" style={{ color: metrics.totalReturnPercent >= 0 ? '#00ff88' : '#ff4757' }}>
                          ({formatPercentage(metrics.totalReturnPercent)})
                        </div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-content">
                        <div className="metric-label">Win Rate</div>
                        <div className="metric-value" style={{ color: metrics.winRate >= 50 ? '#00ff88' : '#ffa502' }}>
                          {metrics.winRate.toFixed(1)}%
                        </div>
                        <div className="metric-subtitle">
                          {metrics.totalTrades} total trades
                        </div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-content">
                        <div className="metric-label">Portfolio Balance</div>
                        <div className="metric-value">
                          {formatCurrency(
                            portfolioData?.currentValue || 
                            portfolioData?.totalBalance || 
                            portfolioData?.balance || 
                            100000
                          )} SENSES
                        </div>
                        <div className="metric-subtitle">
                          Available: {formatCurrency(
                            portfolioData?.riskLimits?.availableMargin || 
                            portfolioData?.balance || 
                            portfolioData?.currentValue || 
                            0
                          )} SENSES
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simple Performance Chart */}
                  <div className="performance-chart-section">
                    <h4>Trading Performance Trend</h4>
                    <div className="simple-chart">
                      {(() => {
                        // Create a simple bar chart from recent trades
                        const chartTrades = recentTrades.slice(0, 12); // Most recent 12 trades
                        const maxAbsPnL = Math.max(...chartTrades.map(t => Math.abs(t.realizedPnL || 0)));
                        
                        if (chartTrades.length === 0) {
                          return (
                            <div className="empty-chart">
                              <div className="empty-chart-icon">📊</div>
                              <p>No trades to display</p>
                            </div>
                          );
                        }

                        return (
                          <div className="simple-chart-container">
                            <div className="chart-header">
                              <span className="chart-title">Recent Trades Performance</span>
                              <span className="chart-subtitle">Profit & Loss</span>
                            </div>
                            
                            <div className="chart-bars">
                              {chartTrades.map((trade, index) => {
                                const pnl = trade.realizedPnL || 0;
                                const isProfit = pnl >= 0;
                                const heightPercent = maxAbsPnL > 0 ? Math.min((Math.abs(pnl) / maxAbsPnL) * 80, 80) : 10;
                                const minHeight = 8;
                                const finalHeight = Math.max(heightPercent, minHeight);
                                
                                return (
                                  <div 
                                    key={trade.id || index} 
                                    className="trade-bar"
                                    title={`${trade.symbol} ${trade.side.toUpperCase()} ${trade.leverage}x: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)} SENSES`}
                                  >
                                    <div 
                                      className={`bar ${isProfit ? 'profit' : 'loss'}`}
                                      style={{ 
                                        height: `${finalHeight}%`,
                                        backgroundColor: isProfit ? '#22c55e' : '#ef4444'
                                      }}
                                    >
                                      <div className="bar-tooltip">
                                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                                      </div>
                                    </div>
                                    
                                    <div className="bar-label">
                                      <div className="symbol">{trade.symbol}</div>
                                      <div className={`trade-type ${trade.side}`}>
                                        {trade.side === 'long' ? '📈' : '📉'} {trade.leverage}x
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="chart-legend">
                              <div className="legend-item">
                                <div className="legend-color profit"></div>
                                <span>Profit</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color loss"></div>
                                <span>Loss</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="recent-performance">
                    <h4>Recent Trading Performance</h4>
                    {recentTrades.length > 0 ? (
                      <div className="performance-trades">
                        {recentTrades.slice(0, 8).map((trade, index) => {
                          
                          let percentage = 0;
                          
                          // Calculate percentage based on price movement, not margin
                          if (trade.entryPrice && trade.exitPrice && trade.quantity) {
                            const priceChange = trade.exitPrice - trade.entryPrice;
                            const priceChangePercent = (priceChange / trade.entryPrice) * 100;
                            // For leveraged trades, the percentage is the price change * leverage
                            percentage = trade.side === 'short' 
                              ? -priceChangePercent * (trade.leverage || 1)
                              : priceChangePercent * (trade.leverage || 1);
                          } else if (trade.pnlPercentage !== undefined && trade.pnlPercentage !== null && trade.pnlPercentage !== 0) {
                            // Use pre-calculated percentage from API only if it exists and is not zero
                            percentage = trade.pnlPercentage;
                          } else {
                            // Fallback: calculate based on a reasonable position size estimate
                            // Estimate position value from marginUsed * leverage
                            const estimatedPositionValue = (trade.marginUsed || 1000) * (trade.leverage || 1);
                            percentage = ((trade.realizedPnL || 0) / estimatedPositionValue) * 100;
                          }

                          return (
                            <div key={trade.id || index} className="performance-trade-item">
                              <div className="trade-summary">
                                <div className="trade-symbol-info">
                                  <span className="symbol">{trade.symbol}</span>
                                  <span className={`side ${trade.side}`}>
                                    {trade.side?.toUpperCase()} {trade.leverage > 1 ? `${trade.leverage}x` : ''}
                                  </span>
                                </div>
                                <div className="trade-date">
                                  {formatTradeDate(trade.exitTime)}
                                </div>
                              </div>
                              
                              <div className="trade-performance">
                                <div 
                                  className="pnl-amount"
                                  style={{ color: (trade.realizedPnL || 0) >= 0 ? '#00ff88' : '#ff4757' }}
                                >
                                  {(trade.realizedPnL || 0) >= 0 ? '+' : ''}{formatCurrency(trade.realizedPnL || 0)}
                                </div>
                                <div 
                                  className="pnl-percentage"
                                  style={{ color: percentage >= 0 ? '#00ff88' : '#ff4757' }}
                                >
                                  ({formatPercentage(percentage)})
                                </div>
                              </div>
                              
                              {/* Trade Reason Preview */}
                              <div className="trade-analysis-preview">
                                <div className="analysis-item">
                                  <strong>Entry Reason:</strong> {trade.entryReason || 'No analysis provided'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">📈</div>
                        <h3>No Trading History</h3>
                        <p>Start trading to see your performance analytics</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <style jsx>{`
        .positions-panel {
          border-radius: 16px;
          overflow: hidden;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        
        .dark .positions-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .positions-panel {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid;
          position: relative;
        }
        
        .force-check-button {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          padding: 8px 16px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .force-check-button:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-50%) scale(1.05);
        }
        
        .dark .panel-header {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .light .panel-header {
          border-color: rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.01);
        }
        
        .header-tabs {
          display: flex;
          gap: 8px;
        }
        
        .tab-button {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
        }
        
        .dark .tab-button {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .tab-button {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .tab-button:hover {
          transform: translateY(-1px);
        }
        
        .dark .tab-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .tab-button:hover {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .tab-button.active {
          background: #3b82f6;
          color: white;
        }
        
        .panel-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .dark .empty-state h3 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .empty-state h3 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }
        
        .dark .empty-state p {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .empty-state p {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .positions-list, .pending-list, .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .position-card, .order-card, .history-card {
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .dark .position-card, .dark .order-card, .dark .history-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .light .position-card, .light .order-card, .light .history-card {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .position-card:hover, .order-card:hover, .history-card:hover {
          transform: translateY(-2px);
        }
        
        .dark .position-card:hover, .dark .order-card:hover, .dark .history-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .light .position-card:hover, .light .order-card:hover, .light .history-card:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .position-header, .order-header, .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .position-title, .trade-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .symbol {
          font-weight: 700;
          font-size: 1rem;
        }
        
        .dark .symbol {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .symbol {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .side {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .side.long {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }
        
        .side.short {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
        }
        
        .quantity {
          font-size: 0.875rem;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .quantity {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .quantity {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .position-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .action-button.edit {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .action-button.edit:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.1);
        }
        
        .action-button.close {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .action-button.close:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.1);
        }
        
        .action-button.partial {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .action-button.partial:hover {
          background: rgba(245, 158, 11, 0.2);
          transform: scale(1.1);
        }
        
        .action-button.cancel {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .action-button.cancel:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.1);
        }
        
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-top: 2px solid #ef4444;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .position-details {
          margin-bottom: 16px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          font-weight: 500;
        }
        
        .dark .detail-label {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .detail-label {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .detail-value {
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .detail-value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .detail-value {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .detail-value.stop-loss {
          color: #ff4757;
        }
        
        .detail-value.take-profit {
          color: #00ff88;
        }
        
        .sl-tp-indicators {
          display: inline-flex;
          gap: 8px;
          margin-left: 12px;
        }
        
        .sl-indicator, .tp-indicator {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .sl-indicator {
          background: rgba(255, 71, 87, 0.15);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }
        
        .tp-indicator {
          background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.3);
        }
        
        .pnl-breakdown {
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
        }
        
        .dark .pnl-breakdown {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .light .pnl-breakdown {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .pnl-breakdown .detail-label {
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .pnl-breakdown-details {
          width: 100%;
        }
        
        .pnl-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 0.8rem;
        }
        
        .pnl-line.total {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .dark .pnl-line.total {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .pnl-line.total {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .dark .pnl-line span:first-child {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .pnl-line span:first-child {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .position-performance {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-top: 1px solid;
          margin-bottom: 16px;
        }
        
        .dark .position-performance {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .position-performance {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .pnl-amount {
          font-size: 1.125rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .pnl-percentage {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          margin-top: 2px;
        }
        
        .position-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .meta-item {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .meta-item {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .confidence {
          color: #3b82f6;
        }
        
        .trade-analysis-preview {
          font-size: 0.75rem;
          padding: 8px 12px;
          border-radius: 6px;
        }
        
        .dark .trade-analysis-preview {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .light .trade-analysis-preview {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .analysis-item {
          line-height: 1.4;
        }
        
        .dark .analysis-item {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .analysis-item {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .edit-modal {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        
        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          min-width: 250px;
        }
        
        .dark .modal-content {
          background: rgba(20, 20, 20, 0.98);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .modal-content h4 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          font-weight: 700;
        }
        
        .modal-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid rgba(128, 128, 128, 0.3);
          border-radius: 6px;
          font-family: 'SF Mono', Monaco, monospace;
          margin-bottom: 16px;
        }
        
        .dark .modal-input {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .modal-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .modal-button.cancel {
          background: rgba(128, 128, 128, 0.2);
          color: rgba(128, 128, 128, 0.8);
        }
        
        .modal-button.save {
          background: #3b82f6;
          color: white;
        }
        
        .modal-button.danger {
          background: #ef4444;
          color: white;
        }
        
        .modal-button.danger:hover:not(:disabled) {
          background: #dc2626;
        }
        
        .modal-button.danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .close-confirm-modal {
          min-width: 400px;
          max-width: 90vw;
        }
        
        .close-confirm-modal h4 {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #ef4444;
        }
        
        .close-confirm-modal p {
          margin: 0 0 20px 0;
          font-size: 0.875rem;
        }
        
        .dark .close-confirm-modal p {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .close-confirm-modal p {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .position-summary {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }
        
        .summary-item:last-child {
          margin-bottom: 0;
        }
        
        .summary-item .label {
          font-weight: 600;
          min-width: 80px;
        }
        
        .dark .summary-item .label {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .summary-item .label {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .summary-item .value {
          font-weight: 600;
          text-align: right;
          flex: 1;
          margin-left: 12px;
        }
        
        .dark .summary-item .value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .summary-item .value {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .summary-item .value.reason {
          font-weight: 400;
          font-style: italic;
          opacity: 0.8;
          font-size: 0.8rem;
          line-height: 1.3;
        }
        
        .history-details {
          padding: 8px 0;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .detail-item .label {
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .detail-item .label {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .detail-item .label {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .detail-item .value {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .detail-item .value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .detail-item .value {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .trade-result {
          text-align: right;
        }
        
        .result-percentage {
          display: block;
          font-size: 0.75rem;
          margin-top: 2px;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .partial-close-modal {
          min-width: 400px;
          max-width: 90vw;
        }
        
        .partial-close-modal h4 {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .dark .partial-close-modal h4 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .partial-close-modal h4 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .partial-close-modal p {
          margin: 0 0 24px 0;
          font-size: 0.875rem;
        }
        
        .dark .partial-close-modal p {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .partial-close-modal p {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .percentage-selector {
          margin-bottom: 20px;
        }
        
        .percentage-selector label {
          display: block;
          margin-bottom: 12px;
          font-weight: 600;
          font-size: 1rem;
        }
        
        .dark .percentage-selector label {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .percentage-selector label {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .percentage-slider {
          width: 100%;
          margin: 8px 0;
          cursor: pointer;
        }
        
        .percentage-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 8px;
        }
        
        .dark .percentage-labels {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .percentage-labels {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .percentage-presets {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .preset-button {
          flex: 1;
          padding: 8px 16px;
          border: 1px solid;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }
        
        .dark .preset-button {
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .preset-button {
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.7);
        }
        
        .preset-button:hover {
          transform: translateY(-1px);
        }
        
        .dark .preset-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .preset-button:hover {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .preset-button.active {
          background: #f59e0b;
          border-color: #f59e0b;
          color: white;
        }
        
        @media (max-width: 768px) {
          .panel-content {
            padding: 16px;
          }
          
          .position-card, .history-card {
            padding: 16px;
          }
          
          .position-header, .history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .position-actions {
            align-self: flex-end;
          }
          
          .detail-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .performance-trades {
            gap: 8px;
          }
        }
        
        /* Performance Tab Styles */
        .performance-content {
          padding: 24px;
        }
        
        .performance-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .performance-header h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .dark .performance-header h3 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .performance-header h3 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .performance-header p {
          margin: 0;
          font-size: 0.875rem;
        }
        
        .dark .performance-header p {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .performance-header p {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .metric-card {
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }
        
        .dark .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .light .metric-card {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .metric-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .dark .metric-label {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .metric-label {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .metric-value {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
          margin-bottom: 4px;
        }
        
        .metric-subtitle {
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .metric-subtitle {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .metric-subtitle {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .recent-performance h4 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .dark .recent-performance h4 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .recent-performance h4 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .performance-trades {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .performance-trade-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .dark .performance-trade-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .light .performance-trade-item {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .performance-trade-item:hover {
          transform: translateY(-1px);
        }
        
        .dark .performance-trade-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        
        .light .performance-trade-item:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        
        .trade-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .trade-symbol-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .trade-date {
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .trade-date {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .trade-date {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .trade-performance {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        
        .trade-performance .pnl-amount {
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .trade-performance .pnl-percentage {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        /* Performance Chart Styles */
        .performance-chart-section {
          margin: 32px 0;
        }
        
        .performance-chart-section h4 {
          margin: 0 0 20px 0;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .dark .performance-chart-section h4 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .performance-chart-section h4 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .simple-chart {
          padding: 0;
        }
        
        .empty-chart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        
        .empty-chart-icon {
          font-size: 2rem;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        
        .empty-chart p {
          margin: 0;
          font-size: 0.875rem;
          opacity: 0.7;
        }
        
        .simple-chart-container {
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
        }
        
        .dark .simple-chart-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .light .simple-chart-container {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .chart-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .chart-title {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .dark .chart-title {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .chart-title {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .chart-subtitle {
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .dark .chart-subtitle {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .chart-subtitle {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 12px;
          height: 150px;
          padding: 0 10px;
          margin-bottom: 20px;
        }
        
        .trade-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 35px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .trade-bar:hover {
          transform: translateY(-2px);
        }
        
        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          position: relative;
          min-height: 8px;
          margin-bottom: 8px;
        }
        
        .bar:hover {
          opacity: 0.8;
          transform: scaleX(1.1);
        }
        
        .bar.profit {
          background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
        }
        
        .bar.loss {
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }
        
        .bar-tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 10;
        }
        
        .bar:hover .bar-tooltip {
          opacity: 1;
        }
        
        .bar-label {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .bar-label .symbol {
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .dark .bar-label .symbol {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .bar-label .symbol {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .trade-type {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .trade-type.long {
          background: rgba(34, 197, 94, 0.15);
          color: #16a34a;
        }
        
        .trade-type.short {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }
        
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .legend-item {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .legend-item {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        
        .legend-color.profit {
          background: #22c55e;
        }
        
        .legend-color.loss {
          background: #ef4444;
        }
        
        /* Funding Fee Tooltip Styles */
        .funding-fee-tooltip .tooltip-text {
          visibility: hidden;
          width: 280px;
          background-color: rgba(0, 0, 0, 0.9);
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 8px 12px;
          position: absolute;
          z-index: 1000;
          bottom: 125%;
          left: 50%;
          margin-left: -140px;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.4;
          opacity: 0;
          transition: opacity 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .funding-fee-tooltip .tooltip-text::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
        }
        
        .funding-fee-tooltip:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>

      {/* Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={shareData}
        darkMode={darkMode}
        profileUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/u/${user?.username || 'unknown'}`}
      />
    </div>
  );
};

export default PositionsPanel;
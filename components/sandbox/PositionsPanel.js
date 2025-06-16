import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaEye, FaTimesCircle, FaEdit, FaArrowUp, FaArrowDown, FaClock, FaShieldAlt } from 'react-icons/fa';
import storage from '../../lib/storage';

const PositionsPanel = ({ portfolioData, marketData, onPositionUpdate }) => {
  const { darkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('open');
  const [editingPosition, setEditingPosition] = useState(null);
  const [closingPosition, setClosingPosition] = useState(null);
  const [partialCloseData, setPartialCloseData] = useState({ positionId: null, percentage: 50 });
  const [showPartialClose, setShowPartialClose] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
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
      console.error('Error closing position:', error);
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
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStopLoss = async (positionId, newStopLoss) => {
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
          stopLoss: newStopLoss
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
      console.error('Error updating position:', error);
      alert('Failed to update position: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openPositions = portfolioData?.openPositions || [];
  const pendingOrders = portfolioData?.pendingOrders || [];
  const recentTrades = portfolioData?.recentTrades || [];

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
            📊 Trade History ({recentTrades.length})
          </button>
        </div>
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
                          {position.quantity} units
                        </span>
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
                          onClick={() => handleClosePosition(position.id)}
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
                        <span className="detail-value">${position.entryPrice?.toFixed(2)}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Current Price:</span>
                        <span className="detail-value">
                          ${marketData[position.symbol]?.price?.toFixed(2) || position.currentPrice?.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Margin Used:</span>
                        <span className="detail-value">${formatCurrency(position.marginUsed)}</span>
                      </div>
                      
                      {position.stopLoss?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Stop Loss:</span>
                          <span className="detail-value stop-loss">
                            ${position.stopLoss.price.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {position.takeProfit?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Take Profit:</span>
                          <span className="detail-value take-profit">
                            ${position.takeProfit.price.toFixed(2)}
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
                          {position.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(position.unrealizedPnL || 0)} SENSE$
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
                            Confidence: {position.confidenceLevel}/10
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

                    {/* Edit Stop Loss Modal */}
                    {editingPosition === position.id && (
                      <div className="edit-modal">
                        <div className="modal-content">
                          <h4>Edit Stop Loss</h4>
                          <input
                            type="number"
                            placeholder="New stop loss price"
                            step="0.01"
                            className="modal-input"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const newStopLoss = parseFloat(e.target.value);
                                if (newStopLoss > 0) {
                                  handleEditStopLoss(position.id, newStopLoss);
                                }
                              }
                            }}
                          />
                          <div className="modal-actions">
                            <button 
                              className="modal-button cancel"
                              onClick={() => setEditingPosition(null)}
                            >
                              Cancel
                            </button>
                            <button 
                              className="modal-button save"
                              onClick={(e) => {
                                const input = e.target.parentElement.previousElementSibling;
                                const newStopLoss = parseFloat(input.value);
                                if (newStopLoss > 0) {
                                  handleEditStopLoss(position.id, newStopLoss);
                                }
                              }}
                            >
                              Save
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
                          onClick={() => handleCancelOrder(order.id)}
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
                        <span className="detail-value">${order.limitPrice?.toFixed(2)}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Current Price:</span>
                        <span className="detail-value">
                          ${marketData[order.symbol]?.price?.toFixed(2) || 'Loading...'}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Margin Reserved:</span>
                        <span className="detail-value">${formatCurrency(order.marginReserved)}</span>
                      </div>
                      
                      {order.stopLoss?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Stop Loss:</span>
                          <span className="detail-value stop-loss">
                            ${order.stopLoss.price.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {order.takeProfit?.price && (
                        <div className="detail-row">
                          <span className="detail-label">Take Profit:</span>
                          <span className="detail-value take-profit">
                            ${order.takeProfit.price.toFixed(2)}
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
                          Confidence: {order.confidenceLevel}/10
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
            {recentTrades.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Trade History</h3>
                <p>Your completed trades will appear here</p>
              </div>
            ) : (
              <div className="history-list">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="history-card">
                    <div className="history-header">
                      <div className="trade-info">
                        <span className="symbol">{trade.symbol}</span>
                        <span className={`side ${trade.side}`}>
                          {trade.side === 'long' ? <FaArrowUp /> : <FaArrowDown />}
                          {trade.side.toUpperCase()}
                          {trade.leverage > 1 && ` ${trade.leverage}x`}
                        </span>
                      </div>
                      
                      <div 
                        className="trade-result"
                        style={{ color: getPerformanceColor(trade.realizedPnL || 0) }}
                      >
                        {trade.realizedPnL >= 0 ? '+' : ''}{formatCurrency(trade.realizedPnL || 0)}
                        <span className="result-percentage">
                          ({formatPercentage(trade.pnlPercentage || 0)})
                        </span>
                      </div>
                    </div>

                    <div className="history-details">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Entry:</span>
                          <span className="value">${trade.entryPrice?.toFixed(2)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Exit:</span>
                          <span className="value">${trade.exitPrice?.toFixed(2)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Duration:</span>
                          <span className="value">{trade.duration}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Date:</span>
                          <span className="value">
                            {new Date(trade.exitTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        }
      `}</style>
    </div>
  );
};

export default PositionsPanel;
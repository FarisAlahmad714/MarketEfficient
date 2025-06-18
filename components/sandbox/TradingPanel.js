import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaLongArrowAltUp, FaLongArrowAltDown, FaExclamationTriangle, FaBrain, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import storage from '../../lib/storage';
import { formatSandboxPrice, formatSandboxCurrency } from '../../lib/sandbox-utils';

const TradingPanel = ({ selectedAsset, marketData, portfolioData, onTradeSuccess, onUserInteracting }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('long');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  // Pre-trade analysis (MANDATORY)
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState({
    entryReason: '',
    // technicalAnalysis: '', // Commented out for future use
    // riskManagement: '', // Commented out for future use
    // biasCheck: '', // Commented out for future use
    // confidenceLevel: 5, // Commented out for future use
    // expectedHoldTime: 'hours', // Commented out for future use
    // emotionalState: 'calm' // Commented out for future use
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Track user interaction to prevent auto-refresh during trading
  const handleUserInteraction = (interacting) => {
    if (onUserInteracting) {
      onUserInteracting(interacting);
    }
  };

  // Get current price with multiple fallbacks
  const currentPrice = marketData[selectedAsset]?.price || 
                      marketData[selectedAsset]?.currentPrice || 
                      portfolioData?.openPositions?.find(p => p.symbol === selectedAsset)?.currentPrice ||
                      (selectedAsset === 'BTC' ? 107000 : selectedAsset === 'SOL' ? 156 : selectedAsset === 'ETH' ? 3800 : 0);
  const availableBalance = portfolioData?.balance || 0;
  const currentValue = portfolioData?.currentValue || availableBalance;
  const availableMargin = portfolioData?.riskLimits?.availableMargin ?? availableBalance;
  
  
  // Define calculation functions first to avoid hoisting issues
  const calculateBasePositionValue = () => {
    const price = orderType === 'limit' ? parseFloat(limitPrice) || currentPrice : currentPrice;
    const qty = parseFloat(quantity) || 0;
    return price * qty; // Base position value (without leverage)
  };

  const calculatePositionValue = () => {
    return calculateBasePositionValue() * leverage; // LEVERAGED position value
  };

  const calculateMarginRequired = () => {
    return calculateBasePositionValue(); // Margin = base position value
  };

  const calculateMaxQuantity = () => {
    const price = orderType === 'limit' ? parseFloat(limitPrice) || currentPrice : currentPrice;
    if (price <= 0) return 0;
    
    const isAdmin = portfolioData?.isAdmin || false;
    
    // Calculate max based on available margin AT 1X LEVERAGE (baseline)
    const maxByMargin = availableMargin / price;
    
    if (isAdmin) {
      // Admins have no position size limits
      return maxByMargin;
    }
    
    // Calculate max based on position size limit (25% of portfolio)
    const maxPositionSize = availableBalance * (portfolioData?.riskLimits?.maxPositionSize || 0.25);
    const maxByPositionLimit = maxPositionSize / price;
    
    // Return the smaller of the two limits (at 1x leverage baseline)
    return Math.min(maxByMargin, maxByPositionLimit);
  };
  
  useEffect(() => {
    // Auto-fill limit price with current price only when switching to limit order
    // Don't override user's manually entered limit price
    if (orderType === 'limit' && currentPrice > 0 && !limitPrice) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [orderType, currentPrice]);

  // Only auto-fill limit price, don't mess with quantity

  const validateTrade = () => {
    const errors = [];
    
    if (!quantity || parseFloat(quantity) <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    
    if (calculateMarginRequired() > availableMargin) {
      errors.push('Insufficient margin available');
    }
    
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      errors.push('Limit price must be greater than 0');
    }
    
    if (leverage > (portfolioData?.riskLimits?.maxLeverage || 3)) {
      errors.push(`Maximum leverage is ${portfolioData?.riskLimits?.maxLeverage || 3}x`);
    }
    
    // Position size limit (25% of portfolio) - except for admins
    const positionValue = calculatePositionValue();
    const maxPositionSize = availableBalance * (portfolioData?.riskLimits?.maxPositionSize || 0.25);
    const isAdmin = portfolioData?.isAdmin || false;
    
    if (!isAdmin && positionValue > maxPositionSize) {
      errors.push(`Position size exceeds limit (${(portfolioData?.riskLimits?.maxPositionSize || 0.25) * 100}% of portfolio)`);
    }
    
    return errors;
  };

  const validateAnalysis = () => {
    const errors = [];
    
    if (analysis.entryReason.length < 10) {
      errors.push('Entry reason must be at least 10 characters');
    }
    
    // Commented out for future use
    // if (analysis.technicalAnalysis.length < 10) {
    //   errors.push('Technical analysis must be at least 10 characters');
    // }
    // 
    // if (analysis.riskManagement.length < 10) {
    //   errors.push('Risk management plan must be at least 10 characters');
    // }
    // 
    // if (analysis.biasCheck.length < 10) {
    //   errors.push('Bias check must be at least 10 characters');
    // }
    
    return errors;
  };

  const handleSubmitTrade = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Validate trade parameters
      const tradeErrors = validateTrade();
      if (tradeErrors.length > 0) {
        setError(tradeErrors.join('. '));
        return;
      }
      
      // Validate pre-trade analysis
      const analysisErrors = validateAnalysis();
      if (analysisErrors.length > 0) {
        setError('Complete analysis required: ' + analysisErrors.join('. '));
        return;
      }
      
      const tradeData = {
        symbol: selectedAsset,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        leverage,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        preTradeAnalysis: analysis
      };
      
      const token = storage.getItem('auth_token');
      const response = await fetch('/api/sandbox/place-trade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tradeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place trade');
      }
      
      const result = await response.json();
      
      // Reset form
      setQuantity('');
      // Don't reset limit price if user is still on limit order type
      if (orderType !== 'limit') {
        setLimitPrice('');
      }
      setStopLoss('');
      setTakeProfit('');
      setAnalysis({
        entryReason: '',
        // technicalAnalysis: '', // Commented out for future use
        // riskManagement: '', // Commented out for future use
        // biasCheck: '', // Commented out for future use
        // confidenceLevel: 5, // Commented out for future use
        // expectedHoldTime: 'hours', // Commented out for future use
        // emotionalState: 'calm' // Commented out for future use
      });
      setShowAnalysis(false);
      
      // Notify parent component
      if (onTradeSuccess) {
        onTradeSuccess();
      }
      
    } catch (error) {
      console.error('Error placing trade:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const setMaxQuantity = () => {
    const maxQty = calculateMaxQuantity();
    setQuantity(maxQty.toFixed(6));
  };

  const tradeErrors = validateTrade();
  const analysisErrors = validateAnalysis();
  const canPlaceTrade = tradeErrors.length === 0 && analysisErrors.length === 0;

  return (
    <div 
      className={`trading-panel ${darkMode ? 'dark' : 'light'}`}
      onMouseEnter={() => handleUserInteraction(true)}
      onMouseLeave={() => handleUserInteraction(false)}
      onFocus={() => handleUserInteraction(true)}
      onClick={() => handleUserInteraction(true)}
    >
      <div className="panel-header">
        <h3>📈 Place Order</h3>
        <div className="asset-price">
          <div className="price-display">
            <span className="asset-symbol">{selectedAsset}</span>
            <span className="price-value">${currentPrice.toFixed(2)}</span>
            <span className="price-conversion">
              (1 SENSES = {currentPrice > 0 ? (1 / currentPrice).toFixed(8) : '0.00000000'} {selectedAsset})
            </span>
          </div>
          
          <div className="balance-info">
            <div className="available-balance">
              Available: {formatSandboxCurrency(availableMargin)}
            </div>
            <div className="buying-power">
              Can Buy: {currentPrice > 0 ? (availableMargin / currentPrice).toFixed(6) : '0.000000'} {selectedAsset}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-content">
        {/* Order Type Selection */}
        <div className="form-section">
          <label>Order Type</label>
          <div className="button-group">
            <button 
              className={`type-button ${orderType === 'market' ? 'active' : ''}`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
            <button 
              className={`type-button ${orderType === 'limit' ? 'active' : ''}`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Side Selection */}
        <div className="form-section">
          <label>Direction</label>
          <div className="button-group">
            <button 
              className={`side-button long ${side === 'long' ? 'active' : ''}`}
              onClick={() => setSide('long')}
            >
              <FaLongArrowAltUp /> Long
            </button>
            <button 
              className={`side-button short ${side === 'short' ? 'active' : ''}`}
              onClick={() => setSide('short')}
            >
              <FaLongArrowAltDown /> Short
            </button>
          </div>
        </div>

        {/* Limit Price (if limit order) */}
        {orderType === 'limit' && (
          <div className="form-section">
            <label>Limit Price</label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Enter limit price"
              step="0.01"
              className="form-input"
            />
          </div>
        )}

        {/* Quantity */}
        <div className="form-section">
          <label>
            Quantity: {parseFloat(quantity || 0).toFixed(6)}
            <span className="max-link" onClick={setMaxQuantity}>
              Max: {calculateMaxQuantity().toFixed(6)}
            </span>
          </label>
          
          {/* Quantity Slider */}
          <div className="quantity-slider-container">
            <input
              type="range"
              min="0"
              max={calculateMaxQuantity()}
              value={quantity || 0}
              onChange={(e) => setQuantity(e.target.value)}
              step={calculateMaxQuantity() > 1 ? "0.000001" : "0.0000001"}
              className="quantity-slider"
            />
            <div className="slider-labels">
              <span>0</span>
              <span>{calculateMaxQuantity().toFixed(6)}</span>
            </div>
          </div>
          
          {/* Manual Input */}
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onFocus={() => handleUserInteraction(true)}
            onBlur={() => handleUserInteraction(false)}
            placeholder="Enter quantity manually"
            step="0.000001"
            className="form-input quantity-input"
          />
          
          {/* Balance Display */}
          <div className="balance-display">
            <div className="balance-item">
              <span className="balance-label">Asset Amount:</span>
              <span className="balance-value">{(parseFloat(quantity || 0)).toFixed(6)} {selectedAsset}</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">Token Value:</span>
              <span className="balance-value">{formatSandboxCurrency(calculateBasePositionValue())}</span>
            </div>
          </div>
        </div>

        {/* Leverage */}
        <div className="form-section">
          <label>Leverage: {leverage}x</label>
          <input
            type="range"
            min="1"
            max={portfolioData?.riskLimits?.maxLeverage || 3}
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="leverage-slider"
          />
          <div className="leverage-labels">
            <span>1x</span>
            <span>2x</span>
            <span>{portfolioData?.riskLimits?.maxLeverage || 3}x</span>
          </div>
          
          {/* Leverage Fee Warning */}
          {leverage > 1 && (
            <div className="leverage-warning">
              <div className="fee-info">
                📊 Higher leverage = Higher fees on position value
              </div>
              <div className="fee-breakdown">
                <span>1x Fee: {(calculateBasePositionValue() * 0.001).toFixed(2)} SENSES</span>
                <span>→</span>
                <span>{leverage}x Fee: {(calculatePositionValue() * 0.001).toFixed(2)} SENSES</span>
              </div>
            </div>
          )}
        </div>

        {/* Stop Loss & Take Profit */}
        <div className="form-row">
          <div className="form-section">
            <label>Stop Loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Optional"
              step="0.01"
              className="form-input"
            />
          </div>
          <div className="form-section">
            <label>Take Profit</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Optional"
              step="0.01"
              className="form-input"
            />
          </div>
        </div>

        {/* Trade Summary */}
        <div className="trade-summary">
          <div className="summary-row">
            <span>Position Value:</span>
            <span>{formatSandboxCurrency(calculatePositionValue())}</span>
          </div>
          <div className="summary-row">
            <span>Margin Required:</span>
            <span>{formatSandboxCurrency(calculateMarginRequired())}</span>
          </div>
          <div className="summary-row">
            <span>Available Margin:</span>
            <span>{formatSandboxCurrency(availableMargin)}</span>
          </div>
        </div>

        {/* Pre-Trade Analysis Section */}
        <div className="analysis-section">
          <button 
            className={`analysis-toggle ${showAnalysis ? 'active' : ''}`}
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <FaBrain /> Pre-Trade Analysis {showAnalysis ? '▼' : '▶'}
            <span className="required-badge">REQUIRED</span>
          </button>
          
          {showAnalysis && (
            <div className="analysis-form">
              <div className="analysis-field">
                <label>
                  <FaChartLine /> Why are you taking this trade?
                </label>
                <textarea
                  value={analysis.entryReason}
                  onChange={(e) => setAnalysis({...analysis, entryReason: e.target.value})}
                  onFocus={() => handleUserInteraction(true)}
                  onBlur={() => handleUserInteraction(false)}
                  placeholder="Explain your reasoning for entering this position... (minimum 10 characters)"
                  className="analysis-textarea"
                  rows="4"
                />
              </div>

              {/* Commented out for future use */}
              {/* 
              <div className="analysis-field">
                <label>
                  📊 Technical Analysis
                </label>
                <textarea
                  value={analysis.technicalAnalysis}
                  onChange={(e) => setAnalysis({...analysis, technicalAnalysis: e.target.value})}
                  placeholder="What technical indicators/patterns support this trade?"
                  className="analysis-textarea"
                  rows="3"
                />
              </div>

              <div className="analysis-field">
                <label>
                  <FaShieldAlt /> Risk Management
                </label>
                <textarea
                  value={analysis.riskManagement}
                  onChange={(e) => setAnalysis({...analysis, riskManagement: e.target.value})}
                  placeholder="How are you managing risk? What's your exit plan?"
                  className="analysis-textarea"
                  rows="3"
                />
              </div>

              <div className="analysis-field">
                <label>
                  🧠 Bias Check
                </label>
                <textarea
                  value={analysis.biasCheck}
                  onChange={(e) => setAnalysis({...analysis, biasCheck: e.target.value})}
                  placeholder="Are you being influenced by any cognitive biases? FOMO? Overconfidence?"
                  className="analysis-textarea"
                  rows="3"
                />
              </div>

              <div className="analysis-row">
                <div className="analysis-field">
                  <label>Confidence Level</label>
                  <select
                    value={analysis.confidenceLevel}
                    onChange={(e) => setAnalysis({...analysis, confidenceLevel: parseInt(e.target.value)})}
                    className="analysis-select"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}/10</option>
                    ))}
                  </select>
                </div>

                <div className="analysis-field">
                  <label>Expected Hold Time</label>
                  <select
                    value={analysis.expectedHoldTime}
                    onChange={(e) => setAnalysis({...analysis, expectedHoldTime: e.target.value})}
                    className="analysis-select"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
              </div>

              <div className="analysis-field">
                <label>Emotional State</label>
                <select
                  value={analysis.emotionalState}
                  onChange={(e) => setAnalysis({...analysis, emotionalState: e.target.value})}
                  className="analysis-select"
                >
                  <option value="calm">Calm & Focused</option>
                  <option value="excited">Excited</option>
                  <option value="fearful">Fearful</option>
                  <option value="confident">Confident</option>
                  <option value="uncertain">Uncertain</option>
                </select>
              </div>
              */}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button 
          className={`submit-button ${side} ${canPlaceTrade ? 'enabled' : 'disabled'}`}
          onClick={handleSubmitTrade}
          disabled={!canPlaceTrade || submitting}
        >
          {submitting ? (
            <>
              <div className="button-spinner"></div>
              Placing Order...
            </>
          ) : (
            <>
              {side === 'long' ? <FaLongArrowAltUp /> : <FaLongArrowAltDown />}
              {side === 'long' ? 'Buy' : 'Sell'} {selectedAsset}
            </>
          )}
        </button>

        {!canPlaceTrade && (
          <div className="validation-summary">
            {tradeErrors.map((error, index) => (
              <div key={index} className="validation-error">• {error}</div>
            ))}
            {!showAnalysis && analysisErrors.length > 0 && (
              <div className="validation-error">• Complete pre-trade analysis required</div>
            )}
            
          </div>
        )}
      </div>

      <style jsx>{`
        .trading-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
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
        
        .panel-header h3 {
          margin: 0 0 8px 0;
          font-size: 1.125rem;
          font-weight: 700;
        }
        
        .dark .panel-header h3 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .panel-header h3 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .asset-price {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .price-display {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .asset-symbol {
          font-size: 1rem;
          font-weight: 700;
          color: #3b82f6;
        }
        
        .price-value {
          font-size: 1rem;
          font-weight: 600;
        }
        
        .dark .price-value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .price-value {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .price-conversion {
          font-size: 0.875rem;
          font-weight: 500;
          color: #10b981;
        }
        
        .balance-info {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .available-balance,
        .buying-power {
          font-size: 0.875rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          white-space: nowrap;
        }
        
        .available-balance {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .buying-power {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .light .available-balance {
          background: rgba(16, 185, 129, 0.05);
          color: #059669;
        }
        
        .light .buying-power {
          background: rgba(245, 158, 11, 0.05);
          color: #d97706;
        }
        
        
        .panel-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .form-section {
          margin-bottom: 20px;
        }
        
        .form-section label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .dark .form-section label {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .form-section label {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .max-link {
          font-size: 0.75rem;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 500;
        }
        
        .max-link:hover {
          text-decoration: underline;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
        }
        
        .type-button, .side-button {
          flex: 1;
          padding: 12px;
          border: 1px solid;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .dark .type-button, .dark .side-button {
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .type-button, .light .side-button {
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.7);
        }
        
        .type-button:hover, .side-button:hover {
          transform: translateY(-1px);
        }
        
        .type-button.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .side-button.long.active {
          background: #00ff88;
          border-color: #00ff88;
          color: #000;
        }
        
        .side-button.short.active {
          background: #ff4757;
          border-color: #ff4757;
          color: white;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'SF Mono', Monaco, monospace;
          transition: all 0.3s ease;
        }
        
        .dark .form-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .form-input {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .leverage-slider, .quantity-slider {
          width: 100%;
          margin: 8px 0;
          cursor: pointer;
        }
        
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .leverage-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 500;
          position: relative;
        }
        
        .leverage-labels span:nth-child(2) {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .quantity-slider-container {
          margin: 12px 0;
        }
        
        .quantity-input {
          margin-top: 12px;
          font-size: 0.875rem;
        }
        
        .balance-display {
          margin-top: 16px;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid;
        }
        
        .dark .balance-display {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .balance-display {
          background: rgba(0, 0, 0, 0.01);
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .balance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .balance-item:last-child {
          margin-bottom: 0;
          padding-top: 8px;
          border-top: 1px solid;
          font-weight: 600;
        }
        
        .dark .balance-item:last-child {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .balance-item:last-child {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .balance-label {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .balance-label {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .balance-label {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .balance-value {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
        }
        
        .dark .balance-value {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .balance-value {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .dark .leverage-labels, .dark .slider-labels {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .leverage-labels, .light .slider-labels {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .leverage-warning {
          margin-top: 12px;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.75rem;
        }
        
        .dark .leverage-warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .light .leverage-warning {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .fee-info {
          font-weight: 600;
          margin-bottom: 6px;
          color: #f59e0b;
        }
        
        .fee-breakdown {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.7rem;
        }
        
        .dark .fee-breakdown {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .fee-breakdown {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .trade-summary {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .dark .trade-summary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .trade-summary {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }
        
        .summary-row:last-child {
          margin-bottom: 0;
          font-weight: 600;
        }
        
        .dark .summary-row {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .summary-row {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .analysis-section {
          margin-bottom: 24px;
        }
        
        .analysis-toggle {
          width: 100%;
          padding: 16px;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          background: transparent;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
        }
        
        .analysis-toggle:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        
        .analysis-toggle.active {
          background: #3b82f6;
          color: white;
        }
        
        .required-badge {
          position: absolute;
          right: 16px;
          font-size: 0.75rem;
          padding: 4px 8px;
          background: #f59e0b;
          color: white;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .analysis-form {
          margin-top: 16px;
          padding: 20px;
          border-radius: 12px;
        }
        
        .dark .analysis-form {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .analysis-form {
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .analysis-field {
          margin-bottom: 16px;
        }
        
        .analysis-field label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .analysis-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
          transition: all 0.3s ease;
        }
        
        .dark .analysis-textarea {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .analysis-textarea {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .analysis-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .analysis-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .analysis-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        
        .dark .analysis-select {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .analysis-select {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 16px;
        }
        
        .submit-button {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .submit-button.long.enabled {
          background: linear-gradient(135deg, #00ff88 0%, #00d96e 100%);
          color: #000;
        }
        
        .submit-button.short.enabled {
          background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
          color: white;
        }
        
        .submit-button.disabled {
          background: rgba(128, 128, 128, 0.3);
          color: rgba(128, 128, 128, 0.7);
          cursor: not-allowed;
        }
        
        .submit-button.enabled:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .validation-summary {
          margin-top: 12px;
        }
        
        .validation-error {
          font-size: 0.75rem;
          color: #ef4444;
          margin-bottom: 4px;
        }
        
        
        @media (max-width: 768px) {
          .panel-content {
            padding: 16px;
          }
          
          .form-row, .analysis-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TradingPanel;
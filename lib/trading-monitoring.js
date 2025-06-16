/**
 * Trading monitoring and alerting system
 * Integrates with existing admin panel for comprehensive oversight
 */

/**
 * Trading metrics collector
 */
export class TradingMetrics {
  constructor() {
    this.metrics = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalVolume: 0,
      totalPnL: 0,
      averageTradeSize: 0,
      errorsByType: {},
      liquidations: 0,
      activeUsers: new Set(),
      dailyMetrics: {},
      lastUpdate: new Date()
    };
  }

  /**
   * Record a trade event
   */
  recordTrade(userId, trade, success = true) {
    this.metrics.totalTrades++;
    this.metrics.activeUsers.add(userId);
    
    if (success) {
      this.metrics.successfulTrades++;
      this.metrics.totalVolume += trade.positionValue || 0;
      this.metrics.totalPnL += trade.realizedPnL || 0;
    } else {
      this.metrics.failedTrades++;
    }

    this.updateDailyMetrics();
    this.metrics.lastUpdate = new Date();
  }

  /**
   * Record an error event
   */
  recordError(errorType, severity = 'medium') {
    if (!this.metrics.errorsByType[errorType]) {
      this.metrics.errorsByType[errorType] = { count: 0, lastOccurred: null };
    }
    
    this.metrics.errorsByType[errorType].count++;
    this.metrics.errorsByType[errorType].lastOccurred = new Date();
    this.metrics.errorsByType[errorType].severity = severity;
  }

  /**
   * Record a liquidation event
   */
  recordLiquidation(userId, tradeId, liquidationValue) {
    this.metrics.liquidations++;
    this.updateDailyMetrics();
    
    // Log to admin panel immediately for critical events
    this.logCriticalEvent('liquidation', {
      userId,
      tradeId,
      liquidationValue,
      timestamp: new Date()
    });
  }

  /**
   * Update daily metrics
   */
  updateDailyMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.metrics.dailyMetrics[today]) {
      this.metrics.dailyMetrics[today] = {
        trades: 0,
        volume: 0,
        errors: 0,
        liquidations: 0,
        uniqueUsers: new Set()
      };
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeUsers: this.metrics.activeUsers.size,
      successRate: this.metrics.totalTrades > 0 ? 
        (this.metrics.successfulTrades / this.metrics.totalTrades * 100).toFixed(2) : 0,
      averageTradeSize: this.metrics.successfulTrades > 0 ? 
        (this.metrics.totalVolume / this.metrics.successfulTrades).toFixed(2) : 0
    };
  }

  /**
   * Log critical events to admin panel
   */
  async logCriticalEvent(eventType, details) {
    try {
      const AdminAction = require('../models/AdminAction');
      
      await AdminAction.create({
        adminId: 'SYSTEM_MONITOR',
        action: `TRADING_CRITICAL_${eventType.toUpperCase()}`,
        category: 'Trading',
        severity: 'critical',
        success: true,
        details: {
          eventType,
          ...details,
          systemGenerated: true
        },
        ipAddress: 'system',
        userAgent: 'trading-monitor',
        metadata: {
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } catch (error) {
      console.error('[CRITICAL] Failed to log trading event to admin panel:', error);
    }
  }
}

// Global metrics instance
const globalMetrics = new TradingMetrics();

/**
 * Trading alert system
 */
export class TradingAlerts {
  constructor() {
    this.alertThresholds = {
      errorRate: 10, // 10% error rate triggers alert
      liquidationCount: 5, // 5 liquidations per hour
      volumeSpike: 100000, // 100k SENSES volume spike
      failedTradesCount: 20, // 20 failed trades per hour
      priceDataFailures: 5 // 5 consecutive price data failures
    };
    
    this.recentEvents = {
      errors: [],
      liquidations: [],
      priceFailures: [],
      failedTrades: []
    };
  }

  /**
   * Check if alert should be triggered
   */
  async checkAlerts() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Check error rate
    const recentErrors = this.recentEvents.errors.filter(e => e.timestamp > oneHourAgo);
    if (recentErrors.length > this.alertThresholds.errorRate) {
      await this.triggerAlert('HIGH_ERROR_RATE', {
        errorCount: recentErrors.length,
        threshold: this.alertThresholds.errorRate,
        timeWindow: '1 hour'
      });
    }

    // Check liquidation count
    const recentLiquidations = this.recentEvents.liquidations.filter(l => l.timestamp > oneHourAgo);
    if (recentLiquidations.length >= this.alertThresholds.liquidationCount) {
      await this.triggerAlert('HIGH_LIQUIDATION_COUNT', {
        liquidationCount: recentLiquidations.length,
        threshold: this.alertThresholds.liquidationCount,
        timeWindow: '1 hour'
      });
    }

    // Check consecutive price failures
    const recentPriceFailures = this.recentEvents.priceFailures.slice(-this.alertThresholds.priceDataFailures);
    if (recentPriceFailures.length >= this.alertThresholds.priceDataFailures) {
      const allRecent = recentPriceFailures.every(f => (now - f.timestamp) < 5 * 60 * 1000); // 5 minutes
      if (allRecent) {
        await this.triggerAlert('CONSECUTIVE_PRICE_FAILURES', {
          failureCount: recentPriceFailures.length,
          threshold: this.alertThresholds.priceDataFailures,
          timeWindow: '5 minutes'
        });
      }
    }
  }

  /**
   * Record an event for monitoring
   */
  recordEvent(eventType, data) {
    if (this.recentEvents[eventType]) {
      this.recentEvents[eventType].push({
        ...data,
        timestamp: new Date()
      });
      
      // Keep only last 100 events per type
      this.recentEvents[eventType] = this.recentEvents[eventType].slice(-100);
    }
  }

  /**
   * Trigger an alert and log to admin panel
   */
  async triggerAlert(alertType, details) {
    try {
      const AdminAction = require('../models/AdminAction');
      
      await AdminAction.create({
        adminId: 'SYSTEM_ALERT',
        action: `TRADING_ALERT_${alertType}`,
        category: 'Trading',
        severity: 'critical',
        success: true,
        details: {
          alertType,
          ...details,
          recommendation: this.getRecommendation(alertType),
          systemGenerated: true
        },
        ipAddress: 'system',
        userAgent: 'trading-alerts',
        metadata: {
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          autoGenerated: true
        }
      });

      // Also log to console for immediate attention
      console.error(`[TRADING ALERT] ${alertType}:`, details);

    } catch (error) {
      console.error('[CRITICAL] Failed to trigger trading alert:', error);
    }
  }

  /**
   * Get recommendations for alert types
   */
  getRecommendation(alertType) {
    const recommendations = {
      HIGH_ERROR_RATE: 'Check system health, review error logs, consider scaling resources',
      HIGH_LIQUIDATION_COUNT: 'Review liquidation logic, check for market volatility, notify users',
      CONSECUTIVE_PRICE_FAILURES: 'Check external API status, activate fallback mechanisms',
      VOLUME_SPIKE: 'Monitor system performance, check for unusual activity patterns',
      HIGH_FAILED_TRADES: 'Review trade validation logic, check database connectivity'
    };
    
    return recommendations[alertType] || 'Review system logs and take appropriate action';
  }
}

// Global alerts instance
const globalAlerts = new TradingAlerts();

/**
 * Trading health monitor
 */
export class TradingHealthMonitor {
  constructor() {
    this.lastHealthCheck = null;
    this.healthStatus = 'unknown';
    this.componentStatus = {
      database: 'unknown',
      priceApi: 'unknown',
      tradingEngine: 'unknown'
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthResults = {
      timestamp: new Date(),
      overall: 'healthy',
      components: {}
    };

    try {
      // Check database connectivity
      healthResults.components.database = await this.checkDatabase();
      
      // Check price API
      healthResults.components.priceApi = await this.checkPriceAPI();
      
      // Check trading engine
      healthResults.components.tradingEngine = await this.checkTradingEngine();

      // Determine overall health
      const unhealthyComponents = Object.values(healthResults.components)
        .filter(status => status !== 'healthy');
      
      if (unhealthyComponents.length > 0) {
        healthResults.overall = unhealthyComponents.length === Object.keys(healthResults.components).length 
          ? 'critical' : 'degraded';
      }

      this.healthStatus = healthResults.overall;
      this.componentStatus = healthResults.components;
      this.lastHealthCheck = healthResults.timestamp;

      // Log health status to admin panel
      await this.logHealthStatus(healthResults);

      return healthResults;

    } catch (error) {
      console.error('[HEALTH CHECK] Failed to perform health check:', error);
      return {
        timestamp: new Date(),
        overall: 'critical',
        error: error.message,
        components: this.componentStatus
      };
    }
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    try {
      const connectDB = require('./database');
      await connectDB();
      
      // Try a simple query
      const SandboxPortfolio = require('../models/SandboxPortfolio');
      await SandboxPortfolio.countDocuments().limit(1);
      
      return 'healthy';
    } catch (error) {
      console.error('[HEALTH CHECK] Database check failed:', error);
      return 'unhealthy';
    }
  }

  /**
   * Check price API connectivity
   */
  async checkPriceAPI() {
    try {
      const { getPriceSimulator } = require('./priceSimulation');
      const priceSimulator = getPriceSimulator();
      
      // Test getting a price
      const testPrice = priceSimulator.getPrice('BTC');
      
      return testPrice && testPrice > 0 ? 'healthy' : 'degraded';
    } catch (error) {
      console.error('[HEALTH CHECK] Price API check failed:', error);
      return 'unhealthy';
    }
  }

  /**
   * Check trading engine
   */
  async checkTradingEngine() {
    try {
      // Test validation functions
      const { validateSymbol } = require('./trading-validation');
      validateSymbol('BTC');
      
      // Test P&L calculator
      const { calculateUnrealizedPnL } = require('./pnl-calculator');
      calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 51000,
        quantity: 0.1
      });
      
      return 'healthy';
    } catch (error) {
      console.error('[HEALTH CHECK] Trading engine check failed:', error);
      return 'unhealthy';
    }
  }

  /**
   * Log health status to admin panel
   */
  async logHealthStatus(healthResults) {
    try {
      const AdminAction = require('../models/AdminAction');
      
      const severity = healthResults.overall === 'healthy' ? 'low' : 
                      healthResults.overall === 'degraded' ? 'medium' : 'critical';
      
      await AdminAction.create({
        adminId: 'SYSTEM_HEALTH',
        action: `TRADING_HEALTH_CHECK_${healthResults.overall.toUpperCase()}`,
        category: 'Trading',
        severity,
        success: healthResults.overall !== 'critical',
        details: {
          healthStatus: healthResults,
          systemGenerated: true
        },
        ipAddress: 'system',
        userAgent: 'health-monitor',
        metadata: {
          timestamp: healthResults.timestamp,
          environment: process.env.NODE_ENV || 'development'
        }
      });

    } catch (error) {
      console.error('[HEALTH CHECK] Failed to log health status:', error);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      lastCheck: this.lastHealthCheck,
      overallStatus: this.healthStatus,
      components: this.componentStatus
    };
  }
}

// Global health monitor instance
const globalHealthMonitor = new TradingHealthMonitor();

/**
 * Monitoring middleware for trading APIs
 */
export function tradingMonitoringMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Track request
  globalMetrics.recordEvent?.('apiRequest', {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    timestamp: new Date()
  });

  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    
    // Record metrics
    if (req.url.includes('/place-trade')) {
      globalMetrics.recordTrade(req.user?.id, data, success);
    }
    
    if (!success) {
      globalMetrics.recordError(`HTTP_${res.statusCode}`, 'medium');
      globalAlerts.recordEvent?.('errors', {
        statusCode: res.statusCode,
        url: req.url,
        duration
      });
    }

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Initialize monitoring system
 */
export async function initializeMonitoring() {
  console.log('[MONITORING] Initializing trading monitoring system...');
  
  // Perform initial health check
  await globalHealthMonitor.performHealthCheck();
  
  // Set up periodic health checks (every 5 minutes)
  setInterval(async () => {
    await globalHealthMonitor.performHealthCheck();
    await globalAlerts.checkAlerts();
  }, 5 * 60 * 1000);
  
  console.log('[MONITORING] Trading monitoring system initialized');
}

/**
 * Get monitoring dashboard data for admin panel
 */
export function getMonitoringDashboard() {
  return {
    metrics: globalMetrics.getMetrics(),
    health: globalHealthMonitor.getHealthStatus(),
    alerts: {
      thresholds: globalAlerts.alertThresholds,
      recentEvents: Object.keys(globalAlerts.recentEvents).reduce((acc, key) => {
        acc[key] = globalAlerts.recentEvents[key].slice(-10); // Last 10 events
        return acc;
      }, {})
    },
    timestamp: new Date()
  };
}

// Export instances for use in other modules
export { globalMetrics, globalAlerts, globalHealthMonitor };
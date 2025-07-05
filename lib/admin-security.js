/**
 * Admin security controls and limits
 * Ensures even admin users have reasonable safety limits
 */

// Admin limits configuration
const ADMIN_LIMITS = {
  POSITION_SIZE: {
    MAX_PERCENT_OF_BALANCE: 75, // 75% max for admins vs 25% for users
    ABSOLUTE_MAX_VALUE: 1000000 // 1M SENSES absolute maximum
  },
  LEVERAGE: {
    MAX: 5, // 5x max for admins vs 3x for users
    REQUIRES_APPROVAL_ABOVE: 3 // Requires special approval above 3x
  },
  TRADING: {
    MAX_TRADES_PER_HOUR: 100, // Rate limiting
    MAX_DAILY_VOLUME: 10000000, // 10M SENSES daily volume limit
    COOL_DOWN_AFTER_LIQUIDATION: 60000 // 1 minute cooldown after liquidation
  },
  OVERRIDE: {
    REQUIRES_JUSTIFICATION: true,
    LOG_ALL_OVERRIDES: true,
    NOTIFICATION_THRESHOLD: 500000 // Notify other admins for overrides >500k SENSES
  }
};

/**
 * Admin action validator
 */
class AdminSecurityValidator {
  constructor() {
    this.recentActions = new Map(); // userId -> actions array
    this.overrideLog = [];
  }

  /**
   * Validate admin trading action
   */
  async validateAdminTrade(userId, tradeData, justification = null) {
    const validation = {
      allowed: true,
      warnings: [],
      requiresApproval: false,
      securityChecks: {}
    };

    try {
      // Check position size limits
      validation.securityChecks.positionSize = this.checkPositionSize(tradeData);
      
      // Check leverage limits
      validation.securityChecks.leverage = this.checkLeverage(tradeData);
      
      // Check rate limiting
      validation.securityChecks.rateLimit = await this.checkRateLimit(userId);
      
      // Check daily volume
      validation.securityChecks.dailyVolume = await this.checkDailyVolume(userId, tradeData);

      // Aggregate warnings and approval requirements
      Object.values(validation.securityChecks).forEach(check => {
        if (check.warnings) validation.warnings.push(...check.warnings);
        if (check.requiresApproval) validation.requiresApproval = true;
        if (!check.allowed) validation.allowed = false;
      });

      // Log override if necessary
      if (validation.warnings.length > 0) {
        await this.logAdminOverride(userId, tradeData, validation, justification);
      }

      return validation;

    } catch (error) {
      return {
        allowed: false,
        warnings: ['Security validation failed'],
        requiresApproval: true,
        error: error.message
      };
    }
  }

  /**
   * Check position size against admin limits
   */
  checkPositionSize(tradeData) {
    const { positionValue, portfolioBalance } = tradeData;
    const maxByPercent = portfolioBalance * (ADMIN_LIMITS.POSITION_SIZE.MAX_PERCENT_OF_BALANCE / 100);
    const maxValue = Math.min(maxByPercent, ADMIN_LIMITS.POSITION_SIZE.ABSOLUTE_MAX_VALUE);

    if (positionValue > ADMIN_LIMITS.POSITION_SIZE.ABSOLUTE_MAX_VALUE) {
      return {
        allowed: false,
        warnings: [`Position value ${positionValue.toLocaleString()} SENSES exceeds absolute maximum ${ADMIN_LIMITS.POSITION_SIZE.ABSOLUTE_MAX_VALUE.toLocaleString()} SENSES`],
        requiresApproval: true
      };
    }

    if (positionValue > maxByPercent) {
      return {
        allowed: true,
        warnings: [`Position size ${(positionValue / portfolioBalance * 100).toFixed(1)}% exceeds normal admin limit of ${ADMIN_LIMITS.POSITION_SIZE.MAX_PERCENT_OF_BALANCE}%`],
        requiresApproval: positionValue > ADMIN_LIMITS.OVERRIDE.NOTIFICATION_THRESHOLD
      };
    }

    return { allowed: true, warnings: [], requiresApproval: false };
  }

  /**
   * Check leverage against admin limits
   */
  checkLeverage(tradeData) {
    const { leverage } = tradeData;

    if (leverage > ADMIN_LIMITS.LEVERAGE.MAX) {
      return {
        allowed: false,
        warnings: [`Leverage ${leverage}x exceeds admin maximum of ${ADMIN_LIMITS.LEVERAGE.MAX}x`],
        requiresApproval: true
      };
    }

    if (leverage > ADMIN_LIMITS.LEVERAGE.REQUIRES_APPROVAL_ABOVE) {
      return {
        allowed: true,
        warnings: [`High leverage ${leverage}x requires additional approval`],
        requiresApproval: true
      };
    }

    return { allowed: true, warnings: [], requiresApproval: false };
  }

  /**
   * Check rate limiting for admin trades
   */
  async checkRateLimit(userId) {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    if (!this.recentActions.has(userId)) {
      this.recentActions.set(userId, []);
    }

    const userActions = this.recentActions.get(userId);
    const recentTrades = userActions.filter(action => 
      action.type === 'trade' && action.timestamp > oneHourAgo
    );

    if (recentTrades.length >= ADMIN_LIMITS.TRADING.MAX_TRADES_PER_HOUR) {
      return {
        allowed: false,
        warnings: [`Rate limit exceeded: ${recentTrades.length} trades in last hour (max: ${ADMIN_LIMITS.TRADING.MAX_TRADES_PER_HOUR})`],
        requiresApproval: true
      };
    }

    // Record this action
    userActions.push({
      type: 'trade',
      timestamp: now
    });

    // Clean old actions
    this.recentActions.set(userId, userActions.filter(action => action.timestamp > oneHourAgo));

    return { allowed: true, warnings: [], requiresApproval: false };
  }

  /**
   * Check daily volume limits
   */
  async checkDailyVolume(userId, tradeData) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const SandboxTrade = require('../models/SandboxTrade');
      const todaysTrades = await SandboxTrade.find({
        userId,
        entryTime: { $gte: today },
        status: { $ne: 'pending' }
      });

      const todaysVolume = todaysTrades.reduce((sum, trade) => sum + (trade.positionValue || 0), 0);
      const newTotalVolume = todaysVolume + tradeData.positionValue;

      if (newTotalVolume > ADMIN_LIMITS.TRADING.MAX_DAILY_VOLUME) {
        return {
          allowed: false,
          warnings: [`Daily volume limit exceeded: ${newTotalVolume.toLocaleString()} SENSES (max: ${ADMIN_LIMITS.TRADING.MAX_DAILY_VOLUME.toLocaleString()} SENSES)`],
          requiresApproval: true
        };
      }

      if (newTotalVolume > ADMIN_LIMITS.TRADING.MAX_DAILY_VOLUME * 0.8) {
        return {
          allowed: true,
          warnings: [`Approaching daily volume limit: ${newTotalVolume.toLocaleString()} of ${ADMIN_LIMITS.TRADING.MAX_DAILY_VOLUME.toLocaleString()} SENSES`],
          requiresApproval: false
        };
      }

      return { allowed: true, warnings: [], requiresApproval: false };

    } catch (error) {
      return {
        allowed: true,
        warnings: ['Unable to verify daily volume'],
        requiresApproval: false
      };
    }
  }

  /**
   * Log admin override to audit trail
   */
  async logAdminOverride(userId, tradeData, validation, justification) {
    try {
      const AdminAction = require('../models/AdminAction');
      
      const overrideData = {
        adminUserId: userId,
        action: 'ADMIN_TRADING_OVERRIDE',
        targetType: 'trading',
        category: 'Trading',
        severity: validation.requiresApproval ? 'high' : 'medium',
        success: validation.allowed,
        description: `Admin trading override - ${validation.allowed ? 'allowed' : 'blocked'}`,
        details: {
          tradeData: {
            symbol: tradeData.symbol,
            side: tradeData.side,
            quantity: tradeData.quantity,
            leverage: tradeData.leverage,
            positionValue: tradeData.positionValue
          },
          validation,
          justification: justification || 'No justification provided',
          adminLimitsApplied: true
        },
        ipAddress: 'system',
        userAgent: 'admin-security-validator',
        metadata: {
          timestamp: new Date(),
          securityLevel: 'admin-override',
          requiresReview: validation.requiresApproval
        }
      };

      await AdminAction.create(overrideData);

      // Add to local override log
      this.overrideLog.push({
        userId,
        timestamp: new Date(),
        validation,
        justification
      });

      // Keep only last 100 overrides
      this.overrideLog = this.overrideLog.slice(-100);

    } catch (error) {
    }
  }

  /**
   * Get recent admin overrides for review
   */
  getRecentOverrides(limit = 20) {
    return this.overrideLog.slice(-limit);
  }
}

/**
 * Admin approval system for high-risk actions
 */
class AdminApprovalSystem {
  constructor() {
    this.pendingApprovals = new Map();
  }

  /**
   * Request approval for admin action
   */
  async requestApproval(adminUserId, action, details, requiredApprovers = 1) {
    const approvalId = this.generateApprovalId();
    
    const approval = {
      id: approvalId,
      requestedBy: adminUserId,
      action,
      details,
      requiredApprovers,
      approvers: [],
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.pendingApprovals.set(approvalId, approval);

    // Log approval request
    await this.logApprovalRequest(approval);

    return approvalId;
  }

  /**
   * Approve or reject an action
   */
  async processApproval(approvalId, approverUserId, approved, comment = '') {
    const approval = this.pendingApprovals.get(approvalId);
    
    if (!approval || approval.status !== 'pending') {
      throw new Error('Approval request not found or already processed');
    }

    if (approval.requestedBy === approverUserId) {
      throw new Error('Cannot approve your own request');
    }

    if (new Date() > approval.expiresAt) {
      approval.status = 'expired';
      throw new Error('Approval request has expired');
    }

    approval.approvers.push({
      userId: approverUserId,
      approved,
      comment,
      timestamp: new Date()
    });

    // Check if enough approvals
    const approvedCount = approval.approvers.filter(a => a.approved).length;
    const rejectedCount = approval.approvers.filter(a => !a.approved).length;

    if (rejectedCount > 0) {
      approval.status = 'rejected';
    } else if (approvedCount >= approval.requiredApprovers) {
      approval.status = 'approved';
    }

    // Log approval decision
    await this.logApprovalDecision(approval, approverUserId, approved, comment);

    return approval.status;
  }

  /**
   * Generate unique approval ID
   */
  generateApprovalId() {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log approval request
   */
  async logApprovalRequest(approval) {
    try {
      const AdminAction = require('../models/AdminAction');
      
      await AdminAction.create({
        adminUserId: approval.requestedBy,
        action: 'ADMIN_APPROVAL_REQUESTED',
        targetType: 'system',
        category: 'security',
        severity: 'high',
        success: true,
        description: `Admin approval requested for ${approval.action}`,
        details: {
          approvalId: approval.id,
          requestedAction: approval.action,
          details: approval.details,
          requiredApprovers: approval.requiredApprovers
        },
        ipAddress: 'system',
        userAgent: 'admin-approval-system'
      });
    } catch (error) {
    }
  }

  /**
   * Log approval decision
   */
  async logApprovalDecision(approval, approverUserId, approved, comment) {
    try {
      const AdminAction = require('../models/AdminAction');
      
      await AdminAction.create({
        adminUserId: approverUserId,
        action: `ADMIN_APPROVAL_${approved ? 'GRANTED' : 'DENIED'}`,
        targetType: 'system',
        category: 'security',
        severity: 'high',
        success: true,
        description: `Admin approval ${approved ? 'granted' : 'denied'} for ${approval.action}`,
        details: {
          approvalId: approval.id,
          originalRequest: approval.action,
          comment,
          finalStatus: approval.status
        },
        ipAddress: 'system',
        userAgent: 'admin-approval-system'
      });
    } catch (error) {
    }
  }
}

// Global instances
const adminSecurityValidator = new AdminSecurityValidator();
const adminApprovalSystem = new AdminApprovalSystem();

// Export for CommonJS
module.exports = {
  ADMIN_LIMITS,
  AdminSecurityValidator,
  AdminApprovalSystem,
  adminSecurityValidator,
  adminApprovalSystem
};
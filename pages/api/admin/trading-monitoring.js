/**
 * Trading monitoring API endpoint for admin panel
 * Provides real-time trading system health and metrics
 */

import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import { getMonitoringDashboard, globalHealthMonitor } from '../../../lib/trading-monitoring';

async function tradingMonitoringHandler(req, res) {
  const userId = req.user.id;

  try {
    // Check if user is admin
    const User = require('../../../models/User');
    const user = await User.findById(userId);
    
    if (!user?.isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Admin access required' 
      });
    }

    if (req.method === 'GET') {
      const { type } = req.query;

      switch (type) {
        case 'dashboard':
          // Get comprehensive monitoring dashboard
          const dashboardData = getMonitoringDashboard();
          return res.status(200).json({
            success: true,
            data: dashboardData
          });

        case 'health':
          // Get current health status
          const healthStatus = globalHealthMonitor.getHealthStatus();
          return res.status(200).json({
            success: true,
            data: healthStatus
          });

        case 'health-check':
          // Perform immediate health check
          const healthResults = await globalHealthMonitor.performHealthCheck();
          return res.status(200).json({
            success: true,
            data: healthResults
          });

        default:
          // Return basic trading system status
          return res.status(200).json({
            success: true,
            data: {
              status: 'Trading monitoring API operational',
              timestamp: new Date().toISOString(),
              availableEndpoints: [
                'GET ?type=dashboard - Full monitoring dashboard',
                'GET ?type=health - Current health status',
                'GET ?type=health-check - Perform immediate health check'
              ]
            }
          });
      }
    }

    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported' 
    });

  } catch (error) {
    console.error('Trading monitoring API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch trading monitoring data' 
    });
  }
}

export default createApiHandler(
  composeMiddleware(
    requireAuth,
    tradingMonitoringHandler
  )
);
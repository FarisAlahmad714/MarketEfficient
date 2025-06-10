// pages/api/charting-exam/session-status.js
// Get current chart session status

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import { getSessionStatus } from '../../../lib/timeWindow';

async function sessionStatusHandler(req, res) {
  // User is already authenticated via middleware
  const userId = req.user.id;
  
  const { examType, chartCount, part } = req.query;
  
  // Validate required parameters
  if (!examType || !chartCount) {
    return res.status(400).json({
      error: 'Missing required parameters',
      code: 'MISSING_PARAMS',
      message: 'examType and chartCount are required'
    });
  }
  
  // Get session status
  const status = getSessionStatus(userId, examType, parseInt(chartCount), parseInt(part) || 1);
  
  if (!status) {
    return res.status(404).json({
      error: 'Session not found',
      code: 'SESSION_NOT_FOUND',
      message: 'No active session found for this chart'
    });
  }
  
  return res.status(200).json({
    success: true,
    session: {
      examType,
      chartCount: parseInt(chartCount),
      part: parseInt(part) || 1,
      timeRemaining: status.timeRemaining,
      timeSpent: status.timeSpent,
      attempts: status.attempts,
      isExpired: status.isExpired,
      startTime: status.startTime,
      expiresAt: status.expiresAt
    }
  });
}

// Export with required auth
export default createApiHandler(
  composeMiddleware(requireAuth, sessionStatusHandler),
  { methods: ['GET'] }
);
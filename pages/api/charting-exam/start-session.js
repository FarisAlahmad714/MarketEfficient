// pages/api/charting-exam/start-session.js
// Start a new chart session with time window

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import { startChartSession } from '../../../lib/timeWindow';

async function startSessionHandler(req, res) {
  // User is already authenticated via middleware
  const userId = req.user.id;
  
  const { examType, chartCount, part } = req.body;
  
  // Validate required parameters
  if (!examType || !chartCount) {
    return res.status(400).json({
      error: 'Missing required parameters',
      code: 'MISSING_PARAMS',
      message: 'examType and chartCount are required'
    });
  }
  
  // Validate exam type
  const validExamTypes = ['swing', 'fibonacci', 'fvg'];
  if (!validExamTypes.includes(examType)) {
    return res.status(400).json({
      error: 'Invalid exam type',
      code: 'INVALID_EXAM_TYPE',
      message: `examType must be one of: ${validExamTypes.join(', ')}`
    });
  }
  
  // Start the chart session
  const session = startChartSession(userId, examType, chartCount, part || 1);
  
  return res.status(200).json({
    success: true,
    message: 'Chart session started',
    session: {
      sessionKey: session.sessionKey,
      examType,
      chartCount,
      part: part || 1,
      timeLimit: session.timeLimit,
      timeRemaining: session.timeRemaining,
      startTime: session.startTime,
      expiresAt: session.expiresAt
    }
  });
}

// Export with required auth
export default createApiHandler(
  composeMiddleware(requireAuth, startSessionHandler),
  { methods: ['POST'] }
);
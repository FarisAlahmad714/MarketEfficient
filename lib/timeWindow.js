// lib/timeWindow.js
// Time window management for charting exams

import ChartExamAnalytics from '../models/ChartExamAnalytics';

// In-memory store for chart sessions (in production, use Redis)
const chartSessions = new Map();

// Clean up expired sessions every 30 minutes (less aggressive)
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of chartSessions.entries()) {
    // Only clean up sessions that expired more than 5 minutes ago
    if (now > session.expiresAt + (5 * 60 * 1000)) {
      console.log(`Cleaning up expired session: ${key}`);
      chartSessions.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Start a new chart session with time window
 * @param {string} userId - User ID
 * @param {string} examType - 'swing', 'fibonacci', 'fvg'
 * @param {number} chartCount - Chart number
 * @param {number} part - Part number (for fibonacci/fvg)
 * @returns {Object} Session info
 */
export function startChartSession(userId, examType, chartCount, part = 1) {
  // Define time limits per exam type (in seconds)
  const timeLimits = {
    swing: 3 * 60,      // 3 minutes
    fibonacci: 2 * 60,  // 2 minutes
    fvg: 2.5 * 60      // 2.5 minutes
  };

  const timeLimit = timeLimits[examType] || 3 * 60;
  const sessionKey = `${userId}_${examType}_${chartCount}_${part}`;
  const now = Date.now();
  
  const session = {
    userId,
    examType,
    chartCount,
    part,
    startTime: now,
    expiresAt: now + (timeLimit * 1000),
    timeLimit,
    attempts: 0,
    submissions: [],
    focusEvents: [],
    deviceInfo: null,
    chartMetadata: null
  };
  
  chartSessions.set(sessionKey, session);
  console.log(`Created session: ${sessionKey}, expires at: ${new Date(session.expiresAt).toISOString()}`);
  
  return {
    sessionKey,
    startTime: session.startTime,
    expiresAt: session.expiresAt,
    timeLimit: session.timeLimit,
    timeRemaining: timeLimit
  };
}

/**
 * Check if a submission is within the time window
 * @param {string} userId - User ID
 * @param {string} examType - 'swing', 'fibonacci', 'fvg'
 * @param {number} chartCount - Chart number
 * @param {number} part - Part number
 * @returns {Object} Validation result
 */
export function validateTimeWindow(userId, examType, chartCount, part = 1) {
  const sessionKey = `${userId}_${examType}_${chartCount}_${part}`;
  const session = chartSessions.get(sessionKey);
  const now = Date.now();
  
  console.log(`Validating session: ${sessionKey}`);
  console.log(`Available sessions:`, Array.from(chartSessions.keys()));
  
  if (!session) {
    // Try to auto-create session if none exists (graceful fallback)
    console.log(`No session found for ${sessionKey}, creating new session`);
    const newSession = startChartSession(userId, examType, chartCount, part);
    const createdSession = chartSessions.get(sessionKey);
    
    if (!createdSession) {
      return {
        valid: false,
        error: 'NO_SESSION',
        message: 'Chart session not found. Please reload the chart.',
        code: 'SESSION_NOT_FOUND'
      };
    }
    
    // Return the newly created session
    return {
      valid: true,
      timeRemaining: Math.max(0, Math.floor((createdSession.expiresAt - now) / 1000)),
      timeSpent: 0,
      attempts: 1,
      session: createdSession
    };
  }
  
  if (now > session.expiresAt) {
    return {
      valid: false,
      error: 'TIME_EXPIRED',
      message: 'Time limit exceeded for this chart.',
      code: 'TIME_LIMIT_EXCEEDED',
      timeSpent: session.timeLimit,
      attempts: session.attempts
    };
  }
  
  // Update attempt count
  session.attempts++;
  
  const timeRemaining = Math.max(0, Math.floor((session.expiresAt - now) / 1000));
  const timeSpent = Math.floor((now - session.startTime) / 1000);
  
  return {
    valid: true,
    timeRemaining,
    timeSpent,
    attempts: session.attempts,
    session
  };
}

/**
 * Record a submission for analytics
 * @param {string} sessionKey - Session key
 * @param {Object} submissionData - Submission details
 */
export function recordSubmission(sessionKey, submissionData) {
  const session = chartSessions.get(sessionKey);
  if (session) {
    const submission = {
      timestamp: Date.now(),
      score: submissionData.score || 0,
      totalPoints: submissionData.totalPoints || 0,
      accuracy: submissionData.totalPoints > 0 ? 
        submissionData.score / submissionData.totalPoints : 0,
      drawingsCount: submissionData.drawings || 0,
      timeSpentOnAttempt: submissionData.timeSpent || 0,
      mistakes: submissionData.mistakes || []
    };
    
    session.submissions.push(submission);
  }
}

/**
 * Record focus events for analytics
 * @param {string} sessionKey - Session key
 * @param {string} eventType - 'lost_focus', 'gained_focus', 'warning_shown', 'timeout_reset'
 * @param {number} duration - Duration for lost_focus events
 */
export function recordFocusEvent(sessionKey, eventType, duration = null) {
  const session = chartSessions.get(sessionKey);
  if (session) {
    const event = {
      type: eventType,
      timestamp: new Date(),
      duration
    };
    
    session.focusEvents.push(event);
    console.log(`Recorded focus event: ${eventType} for session ${sessionKey}`);
  }
}

/**
 * Set chart metadata for analytics
 * @param {string} sessionKey - Session key
 * @param {Object} metadata - Chart metadata
 */
export function setChartMetadata(sessionKey, metadata) {
  const session = chartSessions.get(sessionKey);
  if (session) {
    session.chartMetadata = {
      symbol: metadata.symbol,
      timeframe: metadata.timeframe,
      priceRange: metadata.priceRange,
      volatility: metadata.volatility,
      trendDirection: metadata.trendDirection
    };
  }
}

/**
 * Set device info for analytics
 * @param {string} sessionKey - Session key
 * @param {Object} deviceInfo - Device information
 */
export function setDeviceInfo(sessionKey, deviceInfo) {
  const session = chartSessions.get(sessionKey);
  if (session) {
    session.deviceInfo = {
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      isMobile: deviceInfo.isMobile
    };
  }
}

/**
 * End a chart session and return analytics data
 * @param {string} userId - User ID
 * @param {string} examType - 'swing', 'fibonacci', 'fvg'
 * @param {number} chartCount - Chart number
 * @param {number} part - Part number
 * @returns {Object} Session analytics
 */
export async function endChartSession(userId, examType, chartCount, part = 1) {
  const sessionKey = `${userId}_${examType}_${chartCount}_${part}`;
  const session = chartSessions.get(sessionKey);
  
  if (!session) {
    return null;
  }
  
  const now = Date.now();
  const totalTimeSpent = Math.floor((now - session.startTime) / 1000);
  
  // Calculate analytics
  const analytics = {
    userId: session.userId,
    sessionId: sessionKey,
    examType: session.examType,
    chartCount: session.chartCount,
    part: session.part,
    sessionStartTime: new Date(session.startTime),
    sessionEndTime: new Date(now),
    totalTimeSpent,
    timeLimit: session.timeLimit,
    timePressureRatio: totalTimeSpent / session.timeLimit,
    attempts: session.attempts,
    submissions: session.submissions,
    focusEvents: session.focusEvents,
    chartMetadata: session.chartMetadata || {},
    deviceInfo: session.deviceInfo || {},
    completed: now <= session.expiresAt
  };
  
  // Calculate focus metrics
  let totalFocusLostTime = 0;
  let focusLossCount = 0;
  
  for (let i = 0; i < session.focusEvents.length; i++) {
    const event = session.focusEvents[i];
    if (event.type === 'lost_focus') {
      focusLossCount++;
      if (event.duration) {
        totalFocusLostTime += event.duration;
      }
    }
  }
  
  analytics.totalFocusLostTime = totalFocusLostTime;
  analytics.focusLossCount = focusLossCount;
  
  // Calculate final score and accuracy
  if (session.submissions.length > 0) {
    const lastSubmission = session.submissions[session.submissions.length - 1];
    analytics.finalScore = lastSubmission.score;
    analytics.finalAccuracy = lastSubmission.accuracy;
  } else {
    analytics.finalScore = 0;
    analytics.finalAccuracy = 0;
  }
  
  // Try to save to database
  try {
    const analyticsRecord = new ChartExamAnalytics(analytics);
    await analyticsRecord.save();
    console.log(`Saved analytics for session: ${sessionKey}`);
  } catch (error) {
    console.error('Error saving chart exam analytics:', error);
    // Don't fail the session end if analytics save fails
  }
  
  // Clean up session
  chartSessions.delete(sessionKey);
  
  return analytics;
}

/**
 * Get current session status
 * @param {string} userId - User ID
 * @param {string} examType - 'swing', 'fibonacci', 'fvg'
 * @param {number} chartCount - Chart number
 * @param {number} part - Part number
 * @returns {Object|null} Session status
 */
export function getSessionStatus(userId, examType, chartCount, part = 1) {
  const sessionKey = `${userId}_${examType}_${chartCount}_${part}`;
  const session = chartSessions.get(sessionKey);
  
  if (!session) {
    return null;
  }
  
  const now = Date.now();
  const timeRemaining = Math.max(0, Math.floor((session.expiresAt - now) / 1000));
  const timeSpent = Math.floor((now - session.startTime) / 1000);
  
  return {
    sessionKey,
    timeRemaining,
    timeSpent,
    attempts: session.attempts,
    isExpired: now > session.expiresAt,
    startTime: session.startTime,
    expiresAt: session.expiresAt
  };
}
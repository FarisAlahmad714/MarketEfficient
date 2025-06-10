import { createApiHandler } from '../../../lib/api-handler';
import { requireAdmin } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import ChartExamAnalytics from '../../../models/ChartExamAnalytics';

async function chartAnalyticsHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // User is already authenticated and verified as admin via middleware

    // Connect to database
    const { connectToDatabase } = require('../../../lib/database');
    await connectToDatabase();

    // Parse query parameters
    const { timeRange = '30', examType, format } = req.query;
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = {
      sessionStartTime: { $gte: startDate }
    };

    if (examType && examType !== 'all') {
      query.examType = examType;
    }

    // Fetch analytics data
    const analyticsData = await ChartExamAnalytics.find(query)
      .sort({ sessionStartTime: -1 })
      .lean();

    // If CSV export requested
    if (format === 'csv') {
      const csv = convertToCSV(analyticsData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=chart-exam-analytics.csv');
      return res.status(200).send(csv);
    }

    // Calculate summary statistics
    const totalSessions = analyticsData.length;
    const completedSessions = analyticsData.filter(session => session.completed).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions * 100) : 0;

    // Calculate average metrics
    const avgTimeSpent = analyticsData.length > 0 
      ? analyticsData.reduce((sum, session) => sum + (session.totalTimeSpent || 0), 0) / analyticsData.length
      : 0;

    const avgAccuracy = analyticsData.length > 0
      ? analyticsData.reduce((sum, session) => sum + (session.finalAccuracy || 0), 0) / analyticsData.length
      : 0;

    const avgAttempts = analyticsData.length > 0
      ? analyticsData.reduce((sum, session) => sum + (session.attempts || 0), 0) / analyticsData.length
      : 0;

    // Group by exam type
    const examTypeStats = {};
    ['swing', 'fibonacci', 'fvg'].forEach(type => {
      const typeData = analyticsData.filter(session => session.examType === type);
      examTypeStats[type] = {
        totalSessions: typeData.length,
        completionRate: typeData.length > 0 ? 
          (typeData.filter(s => s.completed).length / typeData.length * 100) : 0,
        avgAccuracy: typeData.length > 0 ?
          typeData.reduce((sum, s) => sum + (s.finalAccuracy || 0), 0) / typeData.length : 0,
        avgTimeSpent: typeData.length > 0 ?
          typeData.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0) / typeData.length : 0
      };
    });

    // Focus loss statistics
    const totalFocusLosses = analyticsData.reduce((sum, session) => 
      sum + (session.focusLossCount || 0), 0);
    const avgFocusLossTime = analyticsData.length > 0 ?
      analyticsData.reduce((sum, session) => sum + (session.totalFocusLostTime || 0), 0) / analyticsData.length : 0;

    // Get recent sessions (limit to 50 most recent)
    const recentSessions = analyticsData.slice(0, 50).map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      examType: session.examType,
      chartCount: session.chartCount,
      part: session.part,
      sessionStartTime: session.sessionStartTime,
      totalTimeSpent: session.totalTimeSpent,
      finalScore: session.finalScore,
      finalAccuracy: session.finalAccuracy,
      attempts: session.attempts,
      completed: session.completed,
      focusLossCount: session.focusLossCount,
      deviceInfo: session.deviceInfo
    }));

    // Calculate time pressure metrics
    const timePressureMetrics = analyticsData
      .filter(session => session.timePressureRatio)
      .reduce((acc, session) => {
        acc.total += session.timePressureRatio;
        acc.count += 1;
        if (session.timePressureRatio > 0.8) acc.highPressure += 1;
        return acc;
      }, { total: 0, count: 0, highPressure: 0 });

    const avgTimePressure = timePressureMetrics.count > 0 ? 
      timePressureMetrics.total / timePressureMetrics.count : 0;
    const highPressureRate = timePressureMetrics.count > 0 ?
      (timePressureMetrics.highPressure / timePressureMetrics.count * 100) : 0;

    // Return analytics summary
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSessions,
          completedSessions,
          completionRate: Math.round(completionRate * 100) / 100,
          avgTimeSpent: Math.round(avgTimeSpent * 100) / 100,
          avgAccuracy: Math.round(avgAccuracy * 100) / 100,
          avgAttempts: Math.round(avgAttempts * 100) / 100,
          totalFocusLosses,
          avgFocusLossTime: Math.round(avgFocusLossTime * 100) / 100,
          avgTimePressure: Math.round(avgTimePressure * 100) / 100,
          highPressureRate: Math.round(highPressureRate * 100) / 100
        },
        examTypeStats,
        recentSessions,
        timeRange: days
      }
    });

  } catch (error) {
    console.error('Error fetching chart analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

function convertToCSV(data) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  // Define CSV headers
  const headers = [
    'Session ID',
    'User ID', 
    'Exam Type',
    'Chart Count',
    'Part',
    'Start Time',
    'End Time',
    'Total Time (s)',
    'Time Limit (s)',
    'Time Pressure Ratio',
    'Attempts',
    'Final Score',
    'Final Accuracy',
    'Completed',
    'Focus Loss Count',
    'Total Focus Lost Time (ms)',
    'Device Type',
    'Screen Resolution'
  ];

  // Convert data to CSV rows
  const csvRows = [headers.join(',')];
  
  data.forEach(session => {
    const row = [
      `"${session.sessionId || ''}"`,
      `"${session.userId || ''}"`,
      `"${session.examType || ''}"`,
      session.chartCount || 0,
      session.part || 0,
      `"${session.sessionStartTime ? new Date(session.sessionStartTime).toISOString() : ''}"`,
      `"${session.sessionEndTime ? new Date(session.sessionEndTime).toISOString() : ''}"`,
      session.totalTimeSpent || 0,
      session.timeLimit || 0,
      session.timePressureRatio || 0,
      session.attempts || 0,
      session.finalScore || 0,
      session.finalAccuracy || 0,
      session.completed ? 'Yes' : 'No',
      session.focusLossCount || 0,
      session.totalFocusLostTime || 0,
      `"${session.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}"`,
      `"${session.deviceInfo?.screenResolution || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Export the wrapped handler
export default createApiHandler(
  composeMiddleware(requireAdmin, chartAnalyticsHandler),
  { methods: ['GET'] }
);
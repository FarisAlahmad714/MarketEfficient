import { createApiHandler } from '../../../lib/api-handler';
import { requireAdmin } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import BiasTestAnalytics from '../../../models/BiasTestAnalytics';

async function biasAnalyticsHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // User is already authenticated and verified as admin via middleware

    // Connect to database
    const { connectToDatabase } = require('../../../lib/database');
    await connectToDatabase();

    // Parse query parameters
    const { timeRange = '30', testType, format, metric = 'overview' } = req.query;
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = {
      sessionStartTime: { $gte: startDate }
    };

    if (testType && testType !== 'all') {
      query.testType = testType;
    }

    // Fetch analytics data
    const analyticsData = await BiasTestAnalytics.find(query)
      .sort({ sessionStartTime: -1 })
      .lean();

    // If CSV export requested
    if (format === 'csv') {
      const csv = convertToCSV(analyticsData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bias-test-analytics.csv');
      return res.status(200).send(csv);
    }

    // Handle different metric types
    switch (metric) {
      case 'progression':
        return res.status(200).json(await getProgressionMetrics(analyticsData));
      
      case 'market-insights':
        return res.status(200).json(await getMarketInsights(analyticsData));
      
      case 'monetization':
        return res.status(200).json(await getMonetizationMetrics(analyticsData));
      
      default:
        return res.status(200).json(await getOverviewMetrics(analyticsData, days));
    }

  } catch (error) {
    console.error('Error fetching bias analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

async function getOverviewMetrics(analyticsData, timeRange) {
  const totalSessions = analyticsData.length;
  
  if (totalSessions === 0) {
    return {
      success: true,
      data: {
        overview: {
          totalSessions: 0,
          avgAccuracy: 0,
          avgConfidence: 0,
          avgSessionTime: 0,
          premiumCandidates: 0,
          highChurnRisk: 0
        },
        testTypeStats: {},
        assetPerformance: {},
        recentSessions: [],
        timeRange
      }
    };
  }

  // Calculate summary statistics
  const avgAccuracy = analyticsData.reduce((sum, session) => sum + (session.finalAccuracy || 0), 0) / totalSessions;
  const avgSessionTime = analyticsData.reduce((sum, session) => sum + (session.totalSessionTime || 0), 0) / totalSessions;
  const avgConfidence = analyticsData.reduce((sum, session) => {
    const sessionAvgConfidence = session.questionAnalytics.reduce((qSum, q) => qSum + q.confidenceLevel, 0) / session.questionAnalytics.length;
    return sum + sessionAvgConfidence;
  }, 0) / totalSessions;

  // Monetization metrics
  const premiumCandidates = analyticsData.filter(session => session.monetizationFlags?.premiumCandidate).length;
  const highChurnRisk = analyticsData.filter(session => session.monetizationFlags?.churnRisk > 0.7).length;

  // Group by test type
  const testTypeStats = {};
  ['crypto', 'forex', 'stocks'].forEach(type => {
    const typeData = analyticsData.filter(session => session.testType === type);
    testTypeStats[type] = {
      totalSessions: typeData.length,
      avgAccuracy: typeData.length > 0 ? 
        typeData.reduce((sum, s) => sum + (s.finalAccuracy || 0), 0) / typeData.length : 0,
      avgSessionTime: typeData.length > 0 ?
        typeData.reduce((sum, s) => sum + (s.totalSessionTime || 0), 0) / typeData.length : 0,
      avgTechnicalScore: typeData.length > 0 ?
        typeData.reduce((sum, s) => sum + (s.progressionMetrics?.technicalAnalysisScore || 0), 0) / typeData.length : 0
    };
  });

  // Asset performance analysis
  const assetPerformance = {};
  const assetGroups = analyticsData.reduce((groups, session) => {
    if (!groups[session.assetSymbol]) {
      groups[session.assetSymbol] = [];
    }
    groups[session.assetSymbol].push(session);
    return groups;
  }, {});

  Object.keys(assetGroups).forEach(asset => {
    const assetData = assetGroups[asset];
    assetPerformance[asset] = {
      totalSessions: assetData.length,
      avgAccuracy: assetData.reduce((sum, s) => sum + (s.finalAccuracy || 0), 0) / assetData.length,
      difficultyScore: 1 - (assetData.reduce((sum, s) => sum + (s.finalAccuracy || 0), 0) / assetData.length), // Inverse of accuracy
      popularityRank: assetData.length
    };
  });

  // Get recent sessions (limit to 50 most recent)
  const recentSessions = analyticsData.slice(0, 50).map(session => ({
    sessionId: session.sessionId,
    userId: session.userId,
    testType: session.testType,
    assetSymbol: session.assetSymbol,
    sessionStartTime: session.sessionStartTime,
    totalSessionTime: session.totalSessionTime,
    finalScore: session.finalScore,
    finalAccuracy: session.finalAccuracy,
    avgConfidence: session.questionAnalytics.reduce((sum, q) => sum + q.confidenceLevel, 0) / session.questionAnalytics.length,
    technicalScore: session.progressionMetrics?.technicalAnalysisScore || 0,
    premiumCandidate: session.monetizationFlags?.premiumCandidate || false,
    churnRisk: session.monetizationFlags?.churnRisk || 0,
    deviceInfo: session.deviceInfo
  }));

  // Behavioral insights
  const behaviorMetrics = {
    avgReasoningQuality: analyticsData.reduce((sum, session) => sum + (session.behaviorMetrics?.reasoningQuality || 0), 0) / totalSessions,
    avgRiskTolerance: analyticsData.reduce((sum, session) => sum + (session.behaviorMetrics?.riskTolerance || 0), 0) / totalSessions,
    avgSessionEngagement: analyticsData.reduce((sum, session) => sum + (session.behaviorMetrics?.sessionEngagement || 0), 0) / totalSessions
  };

  return {
    success: true,
    data: {
      overview: {
        totalSessions,
        avgAccuracy: Math.round(avgAccuracy * 10000) / 100, // Percentage with 2 decimal places
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgSessionTime: Math.round(avgSessionTime * 100) / 100,
        premiumCandidates,
        highChurnRisk,
        premiumCandidateRate: Math.round((premiumCandidates / totalSessions) * 10000) / 100,
        churnRiskRate: Math.round((highChurnRisk / totalSessions) * 10000) / 100
      },
      testTypeStats,
      assetPerformance,
      behaviorMetrics: {
        avgReasoningQuality: Math.round(behaviorMetrics.avgReasoningQuality * 10000) / 100,
        avgRiskTolerance: Math.round(behaviorMetrics.avgRiskTolerance * 10000) / 100,
        avgSessionEngagement: Math.round(behaviorMetrics.avgSessionEngagement * 10000) / 100
      },
      recentSessions,
      timeRange
    }
  };
}

async function getProgressionMetrics(analyticsData) {
  // User progression analysis
  const userProgression = {};
  
  analyticsData.forEach(session => {
    if (!userProgression[session.userId]) {
      userProgression[session.userId] = [];
    }
    userProgression[session.userId].push(session);
  });

  const progressionStats = Object.keys(userProgression).map(userId => {
    const userSessions = userProgression[userId].sort((a, b) => 
      new Date(a.sessionStartTime) - new Date(b.sessionStartTime)
    );
    
    if (userSessions.length < 2) return null;
    
    const firstSession = userSessions[0];
    const lastSession = userSessions[userSessions.length - 1];
    
    return {
      userId,
      sessionCount: userSessions.length,
      accuracyImprovement: lastSession.finalAccuracy - firstSession.finalAccuracy,
      confidenceCalibration: lastSession.progressionMetrics?.overconfidenceScore || 0,
      technicalGrowth: (lastSession.progressionMetrics?.technicalAnalysisScore || 0) - 
                       (firstSession.progressionMetrics?.technicalAnalysisScore || 0),
      engagementTrend: (lastSession.behaviorMetrics?.sessionEngagement || 0) - 
                       (firstSession.behaviorMetrics?.sessionEngagement || 0),
      learningVelocity: lastSession.monetizationFlags?.learningVelocity || 0
    };
  }).filter(stat => stat !== null);

  return {
    success: true,
    data: {
      totalUsers: Object.keys(userProgression).length,
      usersWithProgression: progressionStats.length,
      avgAccuracyImprovement: progressionStats.reduce((sum, user) => sum + user.accuracyImprovement, 0) / progressionStats.length,
      avgTechnicalGrowth: progressionStats.reduce((sum, user) => sum + user.technicalGrowth, 0) / progressionStats.length,
      topLearners: progressionStats.sort((a, b) => b.learningVelocity - a.learningVelocity).slice(0, 10),
      improvementDistribution: {
        improved: progressionStats.filter(u => u.accuracyImprovement > 0.1).length,
        stable: progressionStats.filter(u => Math.abs(u.accuracyImprovement) <= 0.1).length,
        declined: progressionStats.filter(u => u.accuracyImprovement < -0.1).length
      }
    }
  };
}

async function getMarketInsights(analyticsData) {
  // Market condition analysis
  const marketConditions = ['trending', 'sideways', 'volatile'];
  const conditionAnalysis = {};
  
  marketConditions.forEach(condition => {
    const conditionSessions = analyticsData.filter(session => 
      session.questionAnalytics.some(q => q.marketCondition === condition)
    );
    
    if (conditionSessions.length > 0) {
      const conditionQuestions = conditionSessions.flatMap(session => 
        session.questionAnalytics.filter(q => q.marketCondition === condition)
      );
      
      conditionAnalysis[condition] = {
        totalQuestions: conditionQuestions.length,
        avgAccuracy: conditionQuestions.reduce((sum, q) => sum + (q.isCorrect ? 1 : 0), 0) / conditionQuestions.length,
        avgConfidence: conditionQuestions.reduce((sum, q) => sum + q.confidenceLevel, 0) / conditionQuestions.length,
        avgTechnicalComplexity: conditionQuestions.reduce((sum, q) => sum + q.technicalComplexity, 0) / conditionQuestions.length
      };
    }
  });

  // Bias pattern analysis
  const biasPatterns = analyticsData.reduce((patterns, session) => {
    const pattern = session.comparativeMetrics?.biasPattern || 'unknown';
    patterns[pattern] = (patterns[pattern] || 0) + 1;
    return patterns;
  }, {});

  // Technical analysis insights
  const technicalInsights = analyticsData.reduce((insights, session) => {
    session.questionAnalytics.forEach(question => {
      question.technicalFactors.forEach(factor => {
        if (!insights[factor]) {
          insights[factor] = { count: 0, successRate: 0, totalSuccess: 0 };
        }
        insights[factor].count += 1;
        insights[factor].totalSuccess += question.isCorrect ? 1 : 0;
        insights[factor].successRate = insights[factor].totalSuccess / insights[factor].count;
      });
    });
    return insights;
  }, {});

  return {
    success: true,
    data: {
      marketConditionAnalysis: conditionAnalysis,
      biasPatterns,
      technicalInsights: Object.keys(technicalInsights)
        .sort((a, b) => technicalInsights[b].count - technicalInsights[a].count)
        .slice(0, 20)
        .reduce((obj, key) => {
          obj[key] = technicalInsights[key];
          return obj;
        }, {}),
      totalInsights: analyticsData.reduce((sum, session) => sum + (session.researchValue?.uniqueInsights || 0), 0)
    }
  };
}

async function getMonetizationMetrics(analyticsData) {
  // Premium conversion analysis
  const premiumCandidates = analyticsData.filter(session => session.monetizationFlags?.premiumCandidate);
  const highEngagement = analyticsData.filter(session => session.monetizationFlags?.engagementLevel === 'high');
  const churnRisk = analyticsData.filter(session => session.monetizationFlags?.churnRisk > 0.7);

  // Feature utilization analysis
  const avgFeatureUtilization = analyticsData.reduce((sum, session) => 
    sum + (session.monetizationFlags?.featureUtilization || 0), 0) / analyticsData.length;

  // Data value analysis
  const highValueData = analyticsData.filter(session => session.researchValue?.dataQuality > 0.7);
  const marketableInsights = analyticsData.reduce((insights, session) => {
    (session.researchValue?.marketableInsights || []).forEach(insight => {
      insights[insight] = (insights[insight] || 0) + 1;
    });
    return insights;
  }, {});

  return {
    success: true,
    data: {
      conversionPotential: {
        totalSessions: analyticsData.length,
        premiumCandidates: premiumCandidates.length,
        premiumCandidateRate: (premiumCandidates.length / analyticsData.length) * 100,
        highEngagementUsers: highEngagement.length,
        avgLearningVelocity: analyticsData.reduce((sum, s) => sum + (s.monetizationFlags?.learningVelocity || 0), 0) / analyticsData.length
      },
      retentionRisk: {
        highChurnRisk: churnRisk.length,
        churnRiskRate: (churnRisk.length / analyticsData.length) * 100,
        avgFeatureUtilization: avgFeatureUtilization * 100
      },
      dataMonetization: {
        highValueSessions: highValueData.length,
        dataQualityRate: (highValueData.length / analyticsData.length) * 100,
        marketableInsights,
        avgUniqueInsights: analyticsData.reduce((sum, s) => sum + (s.researchValue?.uniqueInsights || 0), 0) / analyticsData.length
      }
    }
  };
}

function convertToCSV(data) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  // Define CSV headers
  const headers = [
    'Session ID',
    'User ID',
    'Test Type',
    'Asset Symbol',
    'Start Time',
    'End Time',
    'Session Time (s)',
    'Final Score',
    'Final Accuracy',
    'Avg Confidence',
    'Technical Score',
    'Overconfidence Score',
    'Reasoning Quality',
    'Risk Tolerance',
    'Premium Candidate',
    'Churn Risk',
    'Device Type',
    'Market Condition Strength'
  ];

  // Convert data to CSV rows
  const csvRows = [headers.join(',')];
  
  data.forEach(session => {
    const avgConfidence = session.questionAnalytics.reduce((sum, q) => sum + q.confidenceLevel, 0) / session.questionAnalytics.length;
    
    const row = [
      `"${session.sessionId || ''}"`,
      `"${session.userId || ''}"`,
      `"${session.testType || ''}"`,
      `"${session.assetSymbol || ''}"`,
      `"${session.sessionStartTime ? new Date(session.sessionStartTime).toISOString() : ''}"`,
      `"${session.sessionEndTime ? new Date(session.sessionEndTime).toISOString() : ''}"`,
      session.totalSessionTime || 0,
      session.finalScore || 0,
      session.finalAccuracy || 0,
      Math.round(avgConfidence * 100) / 100,
      session.progressionMetrics?.technicalAnalysisScore || 0,
      session.progressionMetrics?.overconfidenceScore || 0,
      session.behaviorMetrics?.reasoningQuality || 0,
      session.behaviorMetrics?.riskTolerance || 0,
      session.monetizationFlags?.premiumCandidate ? 'Yes' : 'No',
      session.monetizationFlags?.churnRisk || 0,
      `"${session.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}"`,
      `"${session.comparativeMetrics?.marketConditionStrength || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Export the wrapped handler
export default createApiHandler(
  composeMiddleware(requireAdmin, biasAnalyticsHandler),
  { methods: ['GET'] }
);
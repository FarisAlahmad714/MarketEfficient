// pages/api/debug/test-results.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import User from '../../../models/User';
import mongoose from 'mongoose';

async function debugTestResultsHandler(req, res) {
  await connectDB();
  
  const { method } = req;
  
  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For admin users or when debugging their own results
    const currentUser = await User.findById(req.user.id);
    let targetUserId = req.user.id;
    let targetUser = currentUser;

    // If admin, allow debugging any user
    if (currentUser?.isAdmin && (req.query.userId || req.body.userId)) {
      const debugUserId = req.query.userId || req.body.userId;
      
      // Find user by ID, email, or username
      if (mongoose.Types.ObjectId.isValid(debugUserId)) {
        targetUser = await User.findById(debugUserId);
      } else {
        targetUser = await User.findOne({
          $or: [
            { email: debugUserId },
            { username: debugUserId }
          ]
        });
      }

      if (!targetUser) {
        return res.status(404).json({ 
          error: 'Target user not found',
          searched: debugUserId 
        });
      }
      
      targetUserId = targetUser._id;
    }

    // Fetch all test results for the target user
    const testResults = await TestResults.find({ userId: targetUserId })
      .sort({ completedAt: -1 })
      .exec();

    // Analyze the results
    const analysis = analyzeTestResults(testResults, targetUser);

    return res.status(200).json({
      success: true,
      user: {
        id: targetUser._id,
        email: targetUser.email,
        username: targetUser.username,
        createdAt: targetUser.createdAt
      },
      analysis
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to debug test results',
      message: error.message 
    });
  }
}

function analyzeTestResults(testResults, user) {
  const analysis = {
    totalResults: testResults.length,
    byTestType: {},
    scores: [],
    statistics: {},
    issues: {
      duplicates: [],
      orphaned: [],
      dataIntegrity: []
    },
    averages: {}
  };

  if (testResults.length === 0) {
    return analysis;
  }

  // Group by test type and collect all scores
  const duplicateGroups = {};
  let totalScore = 0;
  let totalPossible = 0;
  const allPercentages = [];

  testResults.forEach((result, index) => {
    const testType = result.testType;
    
    // Initialize test type group
    if (!analysis.byTestType[testType]) {
      analysis.byTestType[testType] = {
        count: 0,
        scores: [],
        averagePercentage: 0,
        recent: []
      };
    }

    // Calculate percentage
    const percentage = result.totalPoints > 0 ? 
      ((result.score / result.totalPoints) * 100) : 0;

    // Collect data
    const scoreData = {
      id: result._id,
      testType: result.testType,
      subType: result.subType,
      assetSymbol: result.assetSymbol,
      score: result.score,
      totalPoints: result.totalPoints,
      percentage: parseFloat(percentage.toFixed(1)),
      status: result.status,
      completedAt: result.completedAt,
      details: result.details ? {
        timeframe: result.details.timeframe,
        sessionId: result.details.sessionId,
        questionCount: result.details.testDetails?.length || 0
      } : null
    };

    analysis.scores.push(scoreData);
    analysis.byTestType[testType].count++;
    analysis.byTestType[testType].scores.push(scoreData);
    
    // Add to recent (first 3)
    if (analysis.byTestType[testType].recent.length < 3) {
      analysis.byTestType[testType].recent.push(scoreData);
    }

    totalScore += result.score;
    totalPossible += result.totalPoints;
    allPercentages.push(percentage);

    // Check for duplicates
    const dupKey = `${result.testType}-${result.assetSymbol}-${result.completedAt.toISOString().split('T')[0]}`;
    if (!duplicateGroups[dupKey]) {
      duplicateGroups[dupKey] = [];
    }
    duplicateGroups[dupKey].push({
      id: result._id,
      completedAt: result.completedAt
    });

    // Check for data integrity issues
    const issues = [];
    if (!result.score && result.score !== 0) issues.push('Missing score');
    if (!result.totalPoints) issues.push('Missing totalPoints');
    if (!result.testType) issues.push('Missing testType');
    if (!result.assetSymbol) issues.push('Missing assetSymbol');
    if (!result.completedAt) issues.push('Missing completedAt');
    if (result.score < 0) issues.push('Negative score');
    if (result.totalPoints < 0) issues.push('Negative totalPoints');
    if (result.score > result.totalPoints) issues.push('Score exceeds totalPoints');
    if (!result.userId) issues.push('Orphaned (no userId)');

    if (issues.length > 0) {
      analysis.issues.dataIntegrity.push({
        resultId: result._id,
        issues
      });
    }
  });

  // Calculate averages
  analysis.averages.weightedAverage = totalPossible > 0 ? 
    parseFloat(((totalScore / totalPossible) * 100).toFixed(1)) : 0;
  
  analysis.averages.simpleAverage = allPercentages.length > 0 ? 
    parseFloat((allPercentages.reduce((sum, p) => sum + p, 0) / allPercentages.length).toFixed(1)) : 0;

  analysis.averages.discrepancy = Math.abs(
    analysis.averages.weightedAverage - analysis.averages.simpleAverage
  ) > 0.1;

  // Calculate averages by test type
  Object.keys(analysis.byTestType).forEach(testType => {
    const typeData = analysis.byTestType[testType];
    const typePercentages = typeData.scores.map(s => s.percentage);
    typeData.averagePercentage = typePercentages.length > 0 ? 
      parseFloat((typePercentages.reduce((sum, p) => sum + p, 0) / typePercentages.length).toFixed(1)) : 0;
  });

  // Detect duplicates
  Object.entries(duplicateGroups).forEach(([key, group]) => {
    if (group.length > 1) {
      analysis.issues.duplicates.push({
        key,
        count: group.length,
        entries: group
      });
    }
  });

  // Summary statistics
  analysis.statistics = {
    totalTests: testResults.length,
    duplicateEntries: analysis.issues.duplicates.reduce((sum, dup) => sum + dup.count - 1, 0),
    dataIssues: analysis.issues.dataIntegrity.length,
    testTypes: Object.keys(analysis.byTestType).length,
    dateRange: testResults.length > 0 ? {
      earliest: testResults[testResults.length - 1].completedAt,
      latest: testResults[0].completedAt
    } : null
  };

  return analysis;
}

export default createApiHandler(
  composeMiddleware(requireAuth, debugTestResultsHandler),
  { methods: ['GET', 'POST'] }
);
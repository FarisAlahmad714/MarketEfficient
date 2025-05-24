// pages/api/dashboard/user-metrics.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import TestResults from '../../../models/TestResults';

async function userMetricsHandler(req, res) {
  // User is already authenticated via middleware
  const userId = req.user.id;
  
  // Get period from query params (default to 'month')
  const period = req.query.period || 'month';
  
  // Calculate start date based on period
  const now = new Date();
  let startDate;
  
  if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === 'year') {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    return res.status(400).json({ error: 'Invalid period' });
  }
  
  // Fetch user's test results from database (exclude test data entries)
  const testResults = await TestResults.find({
    userId,
    completedAt: { $gte: startDate },
    testType: { $ne: 'bias-test-data' } // Exclude backup test data entries
  }).sort({ completedAt: 1 });
  
  // Process and aggregate results
  const metrics = processTestResults(testResults, period);
  
  return res.status(200).json(metrics);
}

// Process raw test results into dashboard metrics
function processTestResults(results, period) {
  // Skip if no results
  if (!results || results.length === 0) {
    return {
      summary: {
        totalTests: 0,
        averageScore: 0,
        completionRate: 0,
        testsByType: {},
      },
      trends: {
        daily: [],
        weekly: [],
      },
      testTypes: {},
      recentActivity: []
    };
  }
  
  // Filter out any remaining test data entries (double safety)
  const validResults = results.filter(result => result.testType !== 'bias-test-data');
  
  // Calculate total tests and average score
  const totalTests = validResults.length;
  const totalScore = validResults.reduce((sum, result) => sum + result.score, 0);
  const totalPossible = validResults.reduce((sum, result) => sum + result.totalPoints, 0);
  const averageScore = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
  
  // Group tests by type
  const testsByType = validResults.reduce((acc, result) => {
    const testType = result.subType || result.testType;
    if (!acc[testType]) {
      acc[testType] = {
        count: 0,
        score: 0,
        totalPoints: 0
      };
    }
    
    acc[testType].count++;
    acc[testType].score += result.score;
    acc[testType].totalPoints += result.totalPoints;
    
    return acc;
  }, {});
  
  // Calculate average score for each test type
  Object.keys(testsByType).forEach(type => {
    testsByType[type].averageScore = 
      testsByType[type].totalPoints > 0 
        ? (testsByType[type].score / testsByType[type].totalPoints) * 100 
        : 0;
  });
  
  // Generate time-based trends
  const dailyData = generateDailyData(validResults);
  const weeklyData = generateWeeklyData(validResults);
  
  // Get recent activity (last 5 tests)
  const recentActivity = validResults
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5)
    .map(result => ({
      id: result._id,
      testType: result.subType || result.testType,
      assetSymbol: result.assetSymbol,
      score: result.score,
      totalPoints: result.totalPoints,
      percentageScore: result.totalPoints > 0 ? (result.score / result.totalPoints) * 100 : 0,
      completedAt: result.completedAt
    }));
  
  return {
    summary: {
      totalTests,
      averageScore,
      completionRate: totalTests > 0 ? 100 : 0, // Will enhance later
      testsByType
    },
    trends: {
      daily: dailyData,
      weekly: weeklyData
    },
    testTypeBreakdown: generateTestTypeBreakdown(validResults),
    recentActivity
  };
}

// Generate daily trend data
function generateDailyData(results) {
  const days = {};
  const now = new Date();
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    days[dateString] = {
      date: dateString,
      count: 0,
      score: 0,
      totalPoints: 0
    };
  }
  
  // Populate with actual data
  results.forEach(result => {
    const dateString = new Date(result.completedAt).toISOString().split('T')[0];
    if (days[dateString]) {
      days[dateString].count++;
      days[dateString].score += result.score;
      days[dateString].totalPoints += result.totalPoints;
    }
  });
  
  // Calculate averages and return as array
  return Object.values(days).map(day => ({
    date: day.date,
    count: day.count,
    averageScore: day.totalPoints > 0 ? (day.score / day.totalPoints) * 100 : 0
  }));
}

// Generate weekly trend data
function generateWeeklyData(results) {
  const weeks = {};
  const now = new Date();
  
  // Initialize last 4 weeks
  for (let i = 3; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - (i * 7));
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekString = `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`;
    
    weeks[weekString] = {
      week: weekString,
      count: 0,
      score: 0,
      totalPoints: 0,
      start: new Date(weekStart),
      end: new Date(weekEnd)
    };
  }
  
  // Populate with actual data
  results.forEach(result => {
    const resultDate = new Date(result.completedAt);
    
    Object.values(weeks).forEach(week => {
      if (resultDate >= week.start && resultDate <= week.end) {
        week.count++;
        week.score += result.score;
        week.totalPoints += result.totalPoints;
      }
    });
  });
  
  // Calculate averages and return as array
  return Object.values(weeks).map(week => ({
    week: week.week,
    count: week.count,
    averageScore: week.totalPoints > 0 ? (week.score / week.totalPoints) * 100 : 0
  }));
}

// Generate test type breakdown data for radar chart
function generateTestTypeBreakdown(results) {
  const breakdown = {};
  
  // Group by test type
  results.forEach(result => {
    const testType = result.subType || result.testType;
    if (!breakdown[testType]) {
      breakdown[testType] = {
        scores: [],
        totalScore: 0,
        totalPossible: 0
      };
    }
    
    breakdown[testType].scores.push(result.score / result.totalPoints);
    breakdown[testType].totalScore += result.score;
    breakdown[testType].totalPossible += result.totalPoints;
  });
  
  // Calculate average scores for each test type
  const formattedBreakdown = Object.keys(breakdown).map(type => {
    return {
      type,
      averagePercentage: breakdown[type].totalPossible > 0 
        ? (breakdown[type].totalScore / breakdown[type].totalPossible) * 100 
        : 0,
      count: breakdown[type].scores.length
    };
  });
  
  return formattedBreakdown;
}

// Export the wrapped handler with middleware
export default createApiHandler(
  composeMiddleware(requireAuth, userMetricsHandler),
  { methods: ['GET'] }
);
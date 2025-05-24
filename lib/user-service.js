// lib/user-service.js
import TestResults from '../models/TestResults';
import User from '../models/User';

export async function getUserMetrics(userId, period) {
  const now = new Date();
  let startDate, prevStartDate;

  if (period === 'weekly') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  } else if (period === 'monthly') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  } else {
    throw new Error('Invalid period');
  }

  const testResults = await TestResults.find({
    userId,
    completedAt: { $gte: startDate },
    testType: { $ne: 'bias-test-data' }  // ← Exclude test data
  }).sort({ completedAt: 1 });

  const prevTestResults = await TestResults.find({
    userId,
    completedAt: { $gte: prevStartDate, $lt: startDate }
  });

  const testsTaken = testResults.length;
  const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
  const totalPossible = testResults.reduce((sum, result) => sum + result.totalPoints, 0);
  const averageScore = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

  const prevTotalScore = prevTestResults.reduce((sum, result) => sum + result.score, 0);
  const prevTotalPossible = prevTestResults.reduce((sum, result) => sum + result.totalPoints, 0);
  const prevAverageScore = prevTotalPossible > 0 ? (prevTotalScore / prevTotalPossible) * 100 : 0;

  const improvement = averageScore - prevAverageScore;

  return {
    testsTaken,
    averageScore,
    improvement
  };
}

export async function getInactiveUsers(daysInactive) {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);

  const activeUsers = await TestResults.distinct('userId', {
    completedAt: { $gte: cutoffDate }
  });

  const inactiveUsers = await User.find({
    _id: { $nin: activeUsers },
    isVerified: true
  });

  return inactiveUsers;
}
// pages/api/sandbox/unlock-check.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import TestResults from '../../../models/TestResults';

async function unlockCheckHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  
  try {
    // Check if user is admin first
    const User = require('../../../models/User');
    const user = await User.findById(userId);
    const isAdmin = user?.isAdmin || false;
    
    // Get or create sandbox portfolio
    let portfolio = await SandboxPortfolio.findOne({ userId });
    
    if (!portfolio) {
      portfolio = new SandboxPortfolio({ 
        userId,
        unlocked: isAdmin // Auto-unlock for admins
      });
    }
    
    // Auto-unlock for admins
    if (isAdmin && !portfolio.unlocked) {
      portfolio.unlocked = true;
      portfolio.unlockedAt = new Date();
    }
    
    // Update unlock progress based on current test results (skip for admins)
    if (!isAdmin) {
      await portfolio.updateUnlockProgress();
    }
    await portfolio.save();
    
    // Get detailed progress information
    const biasTests = await TestResults.find({
      userId,
      testType: { $nin: ['bias-test-data', 'chart-exam'] },
      $or: [
        { testType: 'bias-test' },
        { subType: { $in: ['anchoring', 'confirmation', 'availability', 'overconfidence', 'loss-aversion'] } }
      ]
    }).sort({ completedAt: -1 });
    
    const chartExams = await TestResults.find({
      userId,
      $or: [
        { testType: 'chart-exam' },
        { subType: { $in: ['swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'] } }
      ]
    }).sort({ completedAt: -1 });
    
    // Calculate average scores
    const biasAverage = biasTests.length > 0 
      ? biasTests.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / biasTests.length
      : 0;
      
    const chartAverage = chartExams.length > 0
      ? chartExams.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / chartExams.length
      : 0;
    
    const response = {
      unlocked: portfolio.unlocked,
      unlockedAt: portfolio.unlockedAt,
      eligibleForUnlock: portfolio.unlockEligible,
      progressPercentage: isAdmin ? 100 : portfolio.unlockProgressPercentage,
      isAdmin,
      
      requirements: {
        biasTests: {
          completed: biasTests.length,
          required: portfolio.unlockProgress.biasTests.required,
          averageScore: Math.round(biasAverage * 10) / 10,
          recentTests: biasTests.slice(0, 3).map(test => ({
            type: test.subType || test.testType,
            score: Math.round((test.score / test.totalPoints) * 100),
            assetSymbol: test.assetSymbol,
            completedAt: test.completedAt
          }))
        },
        
        chartExams: {
          completed: chartExams.length,
          required: portfolio.unlockProgress.chartExams.required,
          averageScore: Math.round(chartAverage * 10) / 10,
          recentExams: chartExams.slice(0, 3).map(exam => ({
            type: exam.subType || exam.testType,
            score: Math.round((exam.score / exam.totalPoints) * 100),
            assetSymbol: exam.assetSymbol,
            completedAt: exam.completedAt
          }))
        }
      },
      
      nextSteps: isAdmin ? [{
        type: 'unlock',
        action: 'Sandbox Trading Unlocked! 🎯 (Admin Access)',
        priority: 'success',
        link: '/sandbox'
      }] : getNextSteps(biasTests.length, chartExams.length, portfolio.unlockProgress),
      
      // Portfolio info if unlocked
      portfolio: portfolio.unlocked ? {
        balance: portfolio.balance,
        totalReturn: portfolio.totalReturn,
        totalTrades: portfolio.totalTrades,
        winRate: portfolio.winRate,
        lastTradeAt: portfolio.lastTradeAt,
        nextTopUpDate: portfolio.nextTopUpDate,
        isTopUpDue: portfolio.isTopUpDue(),
        topUpCount: portfolio.topUpCount
      } : null
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error checking sandbox unlock status:', error);
    res.status(500).json({ 
      error: 'Failed to check unlock status',
      message: error.message 
    });
  }
}

function getNextSteps(biasCompleted, chartCompleted, unlockProgress) {
  const steps = [];
  
  if (biasCompleted < unlockProgress.biasTests.required) {
    const remaining = unlockProgress.biasTests.required - biasCompleted;
    steps.push({
      type: 'bias-test',
      action: `Complete ${remaining} more bias test${remaining > 1 ? 's' : ''}`,
      priority: 'high',
      link: '/bias-test'
    });
  }
  
  if (chartCompleted < unlockProgress.chartExams.required) {
    const remaining = unlockProgress.chartExams.required - chartCompleted;
    steps.push({
      type: 'chart-exam',
      action: `Complete ${remaining} more chart exam${remaining > 1 ? 's' : ''}`,
      priority: 'high',
      link: '/chart-exam'
    });
  }
  
  if (steps.length === 0) {
    steps.push({
      type: 'unlock',
      action: 'Sandbox Trading Unlocked! 🎯',
      priority: 'success',
      link: '/sandbox'
    });
  }
  
  return steps;
}

export default createApiHandler(
  composeMiddleware(requireAuth, unlockCheckHandler),
  { methods: ['GET'] }
);
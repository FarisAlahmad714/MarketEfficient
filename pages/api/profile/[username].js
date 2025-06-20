// pages/api/profile/[username].js
import { validateRequest } from '../../../middleware/auth';
import User from '../../../models/User';
import TestResults from '../../../models/TestResults';
import SandboxTrade from '../../../models/SandboxTrade';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import dbConnect from '../../../lib/database';
import { getSignedUrlForImage } from '../../../lib/gcs-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find user by username - all profiles are now public
    const user = await User.findOne({ 
      username: username.toLowerCase()
    }).select('username name bio profileImageUrl profileImageGcsPath socialLinks shareResults createdAt');

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Generate signed URL for profile image if it exists
    let profileImageUrl = null;
    if (user.profileImageGcsPath) {
      try {
        profileImageUrl = await getSignedUrlForImage(user.profileImageGcsPath);
      } catch (error) {
        console.error('Error generating signed URL for profile image:', error);
        // Fall back to the stored URL if signed URL generation fails
        profileImageUrl = user.profileImageUrl;
      }
    }

    // Get user's test results if they allow sharing
    let testResults = [];
    let tradingStats = null;
    let achievements = [];

    // Debug: Always show test results since we removed privacy settings
    console.log(`[PROFILE API] User ${user.username} shareResults:`, user.shareResults);
    
    // Since we removed privacy settings, all users share results by default  
    // Show recent tests with variety across different test types
    const totalTests = await TestResults.countDocuments({ userId: user._id });
    console.log(`[PROFILE API] User ${user.username} total tests in DB:`, totalTests);

    // Get recent tests, but also ensure we show variety by getting some of each type
    const recentBiasTests = await TestResults.find({
      userId: user._id,
      testType: 'bias-test',
      status: { $in: ['completed', 'processing'] }
    })
    .select('testType subType score totalPoints completedAt assetSymbol')
    .sort({ completedAt: -1 })
    .limit(7);

    const recentChartTests = await TestResults.find({
      userId: user._id,
      testType: 'chart-exam',
      status: { $in: ['completed', 'processing'] }, // Include processing status!
      score: { $exists: true },
      totalPoints: { $exists: true }
    })
    .select('testType subType score totalPoints completedAt assetSymbol')
    .sort({ completedAt: -1 })
    .limit(3);

    // Combine and sort by date
    testResults = [...recentBiasTests, ...recentChartTests]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10);

    console.log(`[PROFILE API] User ${user.username} found ${testResults.length} recent tests:`, testResults.map(t => ({ type: t.testType, subType: t.subType, date: t.completedAt })));
    
    // Debug: Check all test types for this user
    const allTestTypes = await TestResults.distinct('testType', { userId: user._id });
    console.log(`[PROFILE API] User ${user.username} all test types in DB:`, allTestTypes);
    
    // Debug: Check recent chart-exam tests specifically  
    console.log(`[PROFILE API] User ${user.username} chart-exam tests found:`, recentChartTests.length);

      // Get trading statistics
      try {
        const sandboxPortfolio = await SandboxPortfolio.findOne({ userId: user._id });
        console.log(`[PROFILE API] User ${user.username} sandbox portfolio:`, sandboxPortfolio ? { unlocked: sandboxPortfolio.unlocked, totalPnL: sandboxPortfolio.totalPnLPercentage } : 'null');
        
        if (sandboxPortfolio && sandboxPortfolio.unlocked) {
          const tradingStatsData = await SandboxTrade.getUserTradingStats(user._id);
          console.log(`[PROFILE API] User ${user.username} trading stats:`, tradingStatsData);
          tradingStats = {
            totalTrades: tradingStatsData.totalTrades,
            winRate: Math.round(tradingStatsData.winRate),
            totalReturn: sandboxPortfolio.totalPnLPercentage,
            bestReturn: tradingStatsData.bestReturn
          };
        }
      } catch (error) {
        console.error('Error fetching trading stats:', error);
      }

      // Generate lifetime achievements based on test results and trading performance
      const lifetimeAchievements = generateAchievements(testResults, tradingStats);
      
      // Get goal-based achievements from dashboard API
      const goalAchievements = await getGoalAchievements(user._id);
      
      // Get time info for achievements display
      const timeInfo = getCurrentTimeInfo();
      
      achievements = {
        lifetime: lifetimeAchievements,
        goals: goalAchievements,
        // Include all available achievements for gallery display
        allAvailable: getAllAvailableAchievements(timeInfo)
      };

    // Calculate public profile stats
    const totalEarnedAchievements = (achievements.lifetime?.length || 0) + (achievements.goals?.filter(g => g.earned)?.length || 0);
    
    const profileStats = {
      testsCompleted: testResults.length,
      averageScore: testResults.length > 0 
        ? Math.round(testResults.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / testResults.length)
        : 0,
      memberSince: user.createdAt,
      achievements: totalEarnedAchievements
    };

    // Organize test results by type for better display
    const testsByType = {
      biasTests: recentBiasTests.map(test => ({
        type: formatTestType(test.testType),
        subType: test.subType,
        score: test.score,
        totalPoints: test.totalPoints,
        percentage: Math.round((test.score / test.totalPoints) * 100),
        completedAt: test.completedAt,
        asset: test.assetSymbol
      })),
      chartExams: recentChartTests.map(test => ({
        type: formatTestType(test.testType),
        subType: test.subType,
        score: test.score,
        totalPoints: test.totalPoints,
        percentage: Math.round((test.score / test.totalPoints) * 100),
        completedAt: test.completedAt,
        asset: test.assetSymbol
      }))
    };

    const publicProfile = {
      username: user.username,
      name: user.name,
      bio: user.bio,
      profileImageUrl: profileImageUrl,
      socialLinks: user.socialLinks,
      stats: profileStats,
      recentTests: testResults.map(test => ({
        type: formatTestType(test.testType),
        subType: test.subType,
        score: test.score,
        totalPoints: test.totalPoints,
        percentage: Math.round((test.score / test.totalPoints) * 100),
        completedAt: test.completedAt,
        asset: test.assetSymbol
      })),
      testsByType: testsByType, // Add organized test data
      tradingStats: tradingStats,
      achievements: achievements
    };

    res.status(200).json(publicProfile);

  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to format test types for display
function formatTestType(type) {
  const typeMap = {
    'bias-test': 'Bias Test',
    'chart-exam': 'Chart Exam',
    'swing-analysis': 'Swing Analysis',
    'fibonacci-retracement': 'Fibonacci Retracement',
    'fair-value-gaps': 'Fair Value Gaps'
  };
  return typeMap[type] || type.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Helper function to generate achievements based on performance
function generateAchievements(testResults, tradingStats) {
  const achievements = [];

  if (testResults.length === 0) return achievements;

  // Test-based achievements
  const totalTests = testResults.length;
  const averageScore = testResults.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / totalTests;

  // Score achievements
  if (averageScore >= 90) {
    achievements.push({
      id: 'expert_analyst',
      title: 'Expert Analyst',
      description: '90%+ average score',
      icon: '🎯',
      color: '#FFD700',
      rarity: 'legendary'
    });
  } else if (averageScore >= 80) {
    achievements.push({
      id: 'skilled_trader',
      title: 'Skilled Trader',
      description: '80%+ average score',
      icon: '⭐',
      color: '#4CAF50',
      rarity: 'rare'
    });
  } else if (averageScore >= 70) {
    achievements.push({
      id: 'proficient_analyzer',
      title: 'Proficient Analyzer',
      description: '70%+ average score',
      icon: '📈',
      color: '#2196F3',
      rarity: 'common'
    });
  }

  // Volume achievements
  if (totalTests >= 50) {
    achievements.push({
      id: 'test_veteran',
      title: 'Test Veteran',
      description: '50+ tests completed',
      icon: '🏆',
      color: '#9C27B0',
      rarity: 'rare'
    });
  } else if (totalTests >= 20) {
    achievements.push({
      id: 'active_learner',
      title: 'Active Learner',
      description: '20+ tests completed',
      icon: '📚',
      color: '#FF9800',
      rarity: 'common'
    });
  } else if (totalTests >= 10) {
    achievements.push({
      id: 'getting_started',
      title: 'Getting Started',
      description: '10+ tests completed',
      icon: '🌱',
      color: '#4CAF50',
      rarity: 'common'
    });
  }

  // Test type diversity
  const testTypes = [...new Set(testResults.map(test => test.testType))];
  if (testTypes.length >= 3) {
    achievements.push({
      id: 'well_rounded',
      title: 'Well Rounded',
      description: 'Completed multiple test types',
      icon: '🎨',
      color: '#E91E63',
      rarity: 'common'
    });
  }

  // Perfect scores
  const perfectScores = testResults.filter(test => test.score === test.totalPoints).length;
  if (perfectScores >= 5) {
    achievements.push({
      id: 'perfectionist',
      title: 'Perfectionist',
      description: '5+ perfect scores',
      icon: '💎',
      color: '#00BCD4',
      rarity: 'legendary'
    });
  } else if (perfectScores >= 1) {
    achievements.push({
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Achieved 100% on a test',
      icon: '✨',
      color: '#FFEB3B',
      rarity: 'rare'
    });
  }

  // Trading achievements (if available)
  if (tradingStats && tradingStats.totalTrades > 0) {
    if (tradingStats.winRate >= 70) {
      achievements.push({
        id: 'profitable_trader',
        title: 'Profitable Trader',
        description: '70%+ win rate',
        icon: '💰',
        color: '#4CAF50',
        rarity: 'rare'
      });
    }

    if (tradingStats.totalReturn > 50) {
      achievements.push({
        id: 'portfolio_growth',
        title: 'Portfolio Growth',
        description: '50%+ portfolio return',
        icon: '📊',
        color: '#2196F3',
        rarity: 'rare'
      });
    }

    if (tradingStats.totalTrades >= 100) {
      achievements.push({
        id: 'active_trader',
        title: 'Active Trader',
        description: '100+ trades executed',
        icon: '⚡',
        color: '#FF5722',
        rarity: 'common'
      });
    }
  }

  return achievements.slice(0, 6); // Limit to top 6 achievements
}

// Helper function to get all available achievements (both earned and unearned)
function getAllAvailableAchievements(timeInfo) {
  return {
    goals: [
      {
        id: 'weekly_tests-goal',
        title: 'Weekly Test Goal',
        description: 'Complete your weekly test target',
        icon: '📝',
        color: '#2196F3',
        rarity: 'goal',
        period: 'week',
        daysRemaining: timeInfo?.daysRemainingInWeek || 0,
        type: 'tests'
      },
      {
        id: 'weekly_score-goal',
        title: 'Weekly Score Goal',
        description: 'Reach your weekly average score target',
        icon: '🎯',
        color: '#4CAF50',
        rarity: 'goal',
        period: 'week',
        daysRemaining: timeInfo?.daysRemainingInWeek || 0,
        type: 'score'
      },
      {
        id: 'monthly_tests-goal',
        title: 'Monthly Test Goal',
        description: 'Complete your monthly test target',
        icon: '📚',
        color: '#2196F3',
        rarity: 'goal',
        period: 'month',
        daysRemaining: timeInfo?.daysRemainingInMonth || 0,
        type: 'tests'
      },
      {
        id: 'monthly_score-goal',
        title: 'Monthly Score Goal',
        description: 'Reach your monthly average score target',
        icon: '🏆',
        color: '#4CAF50',
        rarity: 'goal',
        period: 'month',
        daysRemaining: timeInfo?.daysRemainingInMonth || 0,
        type: 'score'
      }
    ],
    lifetime: [
      {
        id: 'first_test',
        title: 'First Steps',
        description: 'Complete your first test',
        icon: '🌱',
        color: '#4CAF50',
        rarity: 'common',
        requirement: 1,
        type: 'tests_completed'
      },
      {
        id: 'getting_started',
        title: 'Getting Started',
        description: 'Complete 10 tests',
        icon: '📚',
        color: '#4CAF50',
        rarity: 'common',
        requirement: 10,
        type: 'tests_completed'
      },
      {
        id: 'active_learner',
        title: 'Active Learner',
        description: 'Complete 20 tests',
        icon: '🎓',
        color: '#FF9800',
        rarity: 'common',
        requirement: 20,
        type: 'tests_completed'
      },
      {
        id: 'test_veteran',
        title: 'Test Veteran',
        description: 'Complete 50 tests',
        icon: '🏆',
        color: '#9C27B0',
        rarity: 'rare',
        requirement: 50,
        type: 'tests_completed'
      },
      {
        id: 'test_legend',
        title: 'Test Legend',
        description: 'Complete 100 tests',
        icon: '👑',
        color: '#FFD700',
        rarity: 'legendary',
        requirement: 100,
        type: 'tests_completed'
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Achieve 100% on a test',
        icon: '✨',
        color: '#FFEB3B',
        rarity: 'rare',
        requirement: 1,
        type: 'perfect_scores'
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Achieve 5 perfect scores',
        icon: '💎',
        color: '#00BCD4',
        rarity: 'legendary',
        requirement: 5,
        type: 'perfect_scores'
      },
      {
        id: 'proficient_analyzer',
        title: 'Proficient Analyzer',
        description: 'Maintain 70%+ average score',
        icon: '📈',
        color: '#2196F3',
        rarity: 'common',
        requirement: 70,
        type: 'average_score'
      },
      {
        id: 'skilled_trader',
        title: 'Skilled Trader',
        description: 'Maintain 80%+ average score',
        icon: '⭐',
        color: '#4CAF50',
        rarity: 'rare',
        requirement: 80,
        type: 'average_score'
      },
      {
        id: 'expert_analyst',
        title: 'Expert Analyst',
        description: 'Maintain 90%+ average score',
        icon: '🎯',
        color: '#FFD700',
        rarity: 'legendary',
        requirement: 90,
        type: 'average_score'
      },
      {
        id: 'well_rounded',
        title: 'Well Rounded',
        description: 'Complete multiple test types',
        icon: '🎨',
        color: '#E91E63',
        rarity: 'common',
        requirement: 3,
        type: 'test_types'
      },
      {
        id: 'profitable_trader',
        title: 'Profitable Trader',
        description: 'Achieve 70%+ trading win rate',
        icon: '💰',
        color: '#4CAF50',
        rarity: 'rare',
        requirement: 70,
        type: 'win_rate'
      },
      {
        id: 'portfolio_growth',
        title: 'Portfolio Growth',
        description: 'Achieve 50%+ portfolio return',
        icon: '📊',
        color: '#2196F3',
        rarity: 'rare',
        requirement: 50,
        type: 'portfolio_return'
      },
      {
        id: 'active_trader',
        title: 'Active Trader',
        description: 'Execute 100+ trades',
        icon: '⚡',
        color: '#FF5722',
        rarity: 'common',
        requirement: 100,
        type: 'total_trades'
      },
      {
        id: 'trading_master',
        title: 'Trading Master',
        description: 'Execute 500+ trades',
        icon: '🚀',
        color: '#9C27B0',
        rarity: 'legendary',
        requirement: 500,
        type: 'total_trades'
      }
    ]
  };
}

// Helper function to get real dashboard goals and convert completed ones to achievements
async function getGoalAchievements(userId) {
  try {
    console.log(`[PROFILE API] Fetching goal achievements for user ${userId}`);
    
    // Get user metrics for goal calculation
    const userMetrics = await getUserMetrics(userId);
    
    // Get current time info
    const timeInfo = getCurrentTimeInfo();
    
    // Generate current week and month goals using the same logic as dashboard
    const weeklyGoals = generateGoalsForPeriod('week', userMetrics, timeInfo);
    const monthlyGoals = generateGoalsForPeriod('month', userMetrics, timeInfo);
    
    // Convert completed goals to achievements
    const goalAchievements = [];
    
    // Process weekly goals
    weeklyGoals.forEach(goal => {
      if (goal.percentage >= 100) {
        goalAchievements.push({
          id: `weekly_${goal.id}`,
          title: goal.title.replace('Complete ', '').replace('Reach ', '') + ' ✅',
          description: `✅ ${goal.message}`,
          icon: getGoalIcon(goal.id),
          color: goal.color,
          rarity: 'goal',
          completedAt: new Date(),
          period: 'week',
          daysRemaining: timeInfo.daysRemainingInWeek,
          earned: true
        });
      } else {
        // Add as available but not earned
        goalAchievements.push({
          id: `weekly_${goal.id}`,
          title: goal.title,
          description: goal.description,
          icon: getGoalIcon(goal.id),
          color: goal.color,
          rarity: 'goal',
          period: 'week',
          target: goal.target,
          current: goal.current,
          progress: goal.percentage,
          daysRemaining: timeInfo.daysRemainingInWeek,
          earned: false
        });
      }
    });
    
    // Process monthly goals
    monthlyGoals.forEach(goal => {
      if (goal.percentage >= 100) {
        goalAchievements.push({
          id: `monthly_${goal.id}`,
          title: goal.title.replace('Complete ', '').replace('Reach ', '') + ' ✅',
          description: `✅ ${goal.message}`,
          icon: getGoalIcon(goal.id),
          color: goal.color,
          rarity: 'goal',
          completedAt: new Date(),
          period: 'month',
          daysRemaining: timeInfo.daysRemainingInMonth,
          earned: true
        });
      } else {
        // Add as available but not earned
        goalAchievements.push({
          id: `monthly_${goal.id}`,
          title: goal.title,
          description: goal.description,
          icon: getGoalIcon(goal.id),
          color: goal.color,
          rarity: 'goal',
          period: 'month',
          target: goal.target,
          current: goal.current,
          progress: goal.percentage,
          daysRemaining: timeInfo.daysRemainingInMonth,
          earned: false
        });
      }
    });
    
    console.log(`[PROFILE API] Generated ${goalAchievements.length} goal achievements`);
    return goalAchievements;
  } catch (error) {
    console.error('Error fetching goal achievements:', error);
    return [];
  }
}

// Helper function to get user metrics for goal calculation
async function getUserMetrics(userId) {
  try {
    // Get all test results for the user
    const testResults = await TestResults.find({ userId }).sort({ completedAt: -1 });
    
    // Calculate metrics
    const totalTests = testResults.length;
    const averageScore = totalTests > 0 
      ? testResults.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / totalTests
      : 0;
    
    // Group by test type
    const testsByType = {};
    testResults.forEach(test => {
      if (!testsByType[test.testType]) {
        testsByType[test.testType] = {
          count: 0,
          totalScore: 0,
          totalPoints: 0
        };
      }
      testsByType[test.testType].count++;
      testsByType[test.testType].totalScore += test.score;
      testsByType[test.testType].totalPoints += test.totalPoints;
    });
    
    // Calculate averages for each type
    Object.keys(testsByType).forEach(type => {
      const typeData = testsByType[type];
      typeData.averageScore = (typeData.totalScore / typeData.totalPoints) * 100;
    });
    
    return {
      summary: {
        totalTests,
        averageScore,
        testsByType
      }
    };
  } catch (error) {
    console.error('Error getting user metrics:', error);
    return { summary: { totalTests: 0, averageScore: 0, testsByType: {} } };
  }
}

// Helper function to get current time info (copied from dashboard logic)
function getCurrentTimeInfo() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  // Calculate week number (ISO week - starts on Monday)
  const startOfYear = new Date(currentYear, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  // Calculate days remaining in week (Sunday is the end of week)
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const daysRemainingInWeek = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  // Calculate days remaining in month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemainingInMonth = lastDayOfMonth - currentDate;
  
  // Calculate days remaining in year
  const lastDayOfYear = new Date(currentYear, 11, 31);
  const diffTime = Math.abs(lastDayOfYear - now);
  const daysRemainingInYear = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Format names
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  return {
    weekNumber,
    currentMonth: monthNames[currentMonth],
    currentMonthNumber: currentMonth + 1,
    currentYear,
    daysRemainingInWeek,
    daysRemainingInMonth,
    daysRemainingInYear,
    formattedWeek: `Week ${weekNumber} of ${currentYear}`,
    formattedMonth: `${monthNames[currentMonth]} ${currentYear}`,
    formattedYear: `${currentYear}`
  };
}

// Helper function to generate goals using dashboard logic
function generateGoalsForPeriod(period, metrics, timeInfo) {
  // Seeded random function for deterministic goals
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  // Calculate period seed for deterministic goals
  let periodSeed;
  if (period === 'week') {
    periodSeed = timeInfo.weekNumber + timeInfo.currentYear * 100;
  } else if (period === 'month') {
    periodSeed = timeInfo.currentMonthNumber + timeInfo.currentYear * 100;
  } else {
    periodSeed = timeInfo.currentYear;
  }
  
  const goals = [];
  
  // Get user level
  const getCurrentLevel = () => {
    const avgScore = metrics?.summary?.averageScore || 0;
    if (avgScore >= 85) return 'expert';
    if (avgScore >= 70) return 'advanced';
    if (avgScore >= 55) return 'intermediate';
    if (avgScore >= 40) return 'beginner';
    return 'novice';
  };
  
  const userLevel = getCurrentLevel();
  
  // Calculate percentage and completion message
  const calculatePercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };
  
  const getCompletionMessage = (current, target) => {
    if (current >= target) {
      return 'Goal completed! 🎉';
    } else {
      const remaining = target - current;
      if (isNaN(remaining)) return 'Start working toward this goal';
      if (remaining === 1) return '1 more to reach your goal';
      return `${remaining} more to reach your goal`;
    }
  };
  
  // 1. TESTS COMPLETION GOAL
  let testsTarget;
  if (period === 'week') {
    const baseTarget = 5;
    const levelMultipliers = {
      novice: 1,
      beginner: 1.2,
      intermediate: 1.4,
      advanced: 1.6,
      expert: 2
    };
    testsTarget = Math.round(baseTarget * levelMultipliers[userLevel]);
    testsTarget = Math.max(testsTarget, 3);
  } else if (period === 'month') {
    testsTarget = Math.round(20 + seededRandom(periodSeed) * 10);
  } else {
    testsTarget = Math.round(100 + seededRandom(periodSeed) * 50);
  }
  
  const testsCompleted = metrics?.summary?.totalTests || 0;
  
  goals.push({
    id: 'tests-goal',
    title: `Complete ${testsTarget} Tests`,
    description: `Goal to complete at least ${testsTarget} trading tests this ${period}`,
    current: testsCompleted,
    target: testsTarget,
    percentage: calculatePercentage(testsCompleted, testsTarget),
    message: getCompletionMessage(testsCompleted, testsTarget),
    color: '#2196F3'
  });
  
  // 2. SCORE IMPROVEMENT GOAL
  let scoreTarget;
  if (period === 'week') {
    scoreTarget = Math.round(60 + seededRandom(periodSeed * 2) * 10);
  } else if (period === 'month') {
    scoreTarget = Math.round(70 + seededRandom(periodSeed * 2) * 10);
  } else {
    scoreTarget = Math.round(80 + seededRandom(periodSeed * 2) * 10);
  }
  
  const currentScore = metrics?.summary?.averageScore || 0;
  
  goals.push({
    id: 'score-goal',
    title: `Reach ${scoreTarget}% Average Score`,
    description: `Goal to achieve an average score of at least ${scoreTarget}% across all your trading tests this ${period}`,
    current: currentScore,
    target: scoreTarget,
    percentage: calculatePercentage(currentScore, scoreTarget),
    message: currentScore >= scoreTarget 
      ? 'Goal completed! 🎉' 
      : `${(scoreTarget - currentScore).toFixed(1)}% improvement needed`,
    color: '#4CAF50'
  });
  
  return goals;
}

// Helper function to get goal icon based on goal ID
function getGoalIcon(goalId) {
  const iconMap = {
    'tests-goal': '📝',
    'score-goal': '🎯',
    'focus-type-goal': '🎨',
    'diversity-goal': '🌟'
  };
  return iconMap[goalId] || '🏆';
}
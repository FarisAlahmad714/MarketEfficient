// pages/api/profile/[username].js
import { validateRequest } from '../../../middleware/auth';
import User from '../../../models/User';
import TestResults from '../../../models/TestResults';
import SandboxTrade from '../../../models/SandboxTrade';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import dbConnect from '../../../lib/database';
import { getSignedUrlForImage } from '../../../lib/gcs-service';
import { generateGoalsForPeriod, getCurrentTimeInfo } from '../../../lib/goal-service';
import { getBadgeObjectsFromIds } from '../../../lib/badge-service';

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
    }).select('username name bio profileImageUrl profileImageGcsPath socialLinks shareResults createdAt earnedBadges');

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

    // Get full badge objects from badge IDs
    let earnedBadgeObjects = [];
    try {
      earnedBadgeObjects = await getBadgeObjectsFromIds(user._id, user.earnedBadges || []);
    } catch (error) {
      console.error('Error getting badge objects:', error);
    }

    const publicProfile = {
      _id: user._id,
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
      achievements: achievements,
      earnedBadges: user.earnedBadges || [], // Badge IDs for BadgeModal
      earnedBadgeObjects: earnedBadgeObjects // Full badge objects for ProfileHeader
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
  
  // Get all available lifetime achievements for reference
  const timeInfo = getCurrentTimeInfo();
  const availableLifetimeAchievements = getAllAvailableAchievements(timeInfo).lifetime;

  if (testResults.length === 0) return achievements;

  // Test-based achievements
  const totalTests = testResults.length;
  const averageScore = testResults.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / totalTests;
  const perfectScores = testResults.filter(test => test.score === test.totalPoints).length;
  const testTypes = [...new Set(testResults.map(test => test.testType))];

  // Check against available lifetime achievements ONLY
  availableLifetimeAchievements.forEach(achievement => {
    let earned = false;
    
    if (achievement.type === 'tests_completed') {
      earned = totalTests >= achievement.requirement;
    } else if (achievement.type === 'average_score') {
      earned = averageScore >= achievement.requirement;
    } else if (achievement.type === 'perfect_scores') {
      earned = perfectScores >= achievement.requirement;
    } else if (achievement.type === 'test_types') {
      earned = testTypes.length >= achievement.requirement;
    } else if (achievement.type === 'win_rate' && tradingStats) {
      earned = tradingStats.winRate >= achievement.requirement;
    } else if (achievement.type === 'portfolio_return' && tradingStats) {
      earned = tradingStats.totalReturn >= achievement.requirement;
    } else if (achievement.type === 'total_trades' && tradingStats) {
      earned = tradingStats.totalTrades >= achievement.requirement;
    }
    
    if (earned) {
      achievements.push({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        color: achievement.color,
        rarity: achievement.rarity,
        completedAt: new Date() // You might want to track actual completion dates
      });
    }
  });

  return achievements;
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
    
    // Generate current dashboard goals using the shared goal service
    const weeklyGoals = generateGoalsForPeriod('week', userMetrics);
    const monthlyGoals = generateGoalsForPeriod('month', userMetrics);
    
    // Convert completed goals to achievements (ONLY completed ones)
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
// getCurrentTimeInfo is now provided by the shared goal service

// Goals are now generated using the shared goal service

// Helper function to get goal icon based on goal ID
function getGoalIcon(goalId) {
  const iconMap = {
    'volume_basic': '📝',
    'volume_daily': '🗓️',
    'score_improvement': '🎯',
    'score_streak': '🔥',
    'skill_mastery': '🧙‍♂️',
    'skill_focus': '🎨',
    'perfect_challenge': '💎',
    'speed_challenge': '⚡',
    'weak_area_focus': '📈',
    'comeback_challenge': '🔄',
    'variety_explorer': '🌟',
    'new_territory': '🗺️',
    'efficiency_master': '⚙️',
    'knowledge_synthesis': '🧩',
    'leaderboard_climb': '🏆',
    'milestone_hunter': '🎖️',
    // Legacy support
    'tests-goal': '📝',
    'score-goal': '🎯',
    'bias-goal': '🧠',
    'perfect-goal': '💎'
  };
  return iconMap[goalId] || '🏆';
}
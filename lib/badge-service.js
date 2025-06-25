// lib/badge-service.js
import User from '../models/User';
import TestResults from '../models/TestResults';
import SandboxTrade from '../models/SandboxTrade';
import { sendBadgeReceivedEmail } from './email-service';

// Check for new badges and send notifications
export const checkAndNotifyNewBadges = async (userId) => {
  try {
    const user = await User.findById(userId).select('username name email earnedBadges notifications');
    if (!user || user.notifications?.email === false || user.notifications?.badges === false) {
      return { success: false, reason: 'User not found or badge notifications disabled' };
    }

    // Get current achievements
    const currentBadges = await generateUserAchievements(userId);
    
    // Get previously earned badges (stored in user document)
    const previousBadgeIds = user.earnedBadges || [];
    
    // Find new badges
    const newBadges = currentBadges.filter(badge => !previousBadgeIds.includes(badge.id));
    
    if (newBadges.length > 0) {
      // Update user's earned badges
      const updatedBadgeIds = [...previousBadgeIds, ...newBadges.map(b => b.id)];
      await User.findByIdAndUpdate(userId, { 
        earnedBadges: updatedBadgeIds,
        lastBadgeCheck: new Date()
      });

      // Send email notifications for new badges
      const emailResults = [];
      for (const badge of newBadges) {
        try {
          await sendBadgeReceivedEmail(user, badge);
          emailResults.push({ badge: badge.id, sent: true });
          console.log(`Badge notification sent to ${user.email} for badge: ${badge.title}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to send badge email for ${badge.title}:`, error);
          emailResults.push({ badge: badge.id, sent: false, error: error.message });
        }
      }

      return {
        success: true,
        newBadges: newBadges.length,
        badges: newBadges.map(b => ({ id: b.id, title: b.title, rarity: b.rarity })),
        emailResults
      };
    }

    return { success: true, newBadges: 0, message: 'No new badges earned' };
    
  } catch (error) {
    console.error('Error checking for new badges:', error);
    return { success: false, error: error.message };
  }
};

// Generate user achievements (same logic as profile API but standalone)
async function generateUserAchievements(userId) {
  try {
    // Get test results
    const testResults = await TestResults.find({
      userId,
      status: { $in: ['completed', 'processing'] },
      score: { $exists: true },
      totalPoints: { $exists: true }
    }).select('testType subType score totalPoints completedAt');

    // Get trading stats
    let tradingStats = null;
    try {
      tradingStats = await SandboxTrade.getUserTradingStats(userId);
    } catch (error) {
      console.log('No trading stats available for user:', userId);
    }

    return generateAchievements(testResults, tradingStats);
  } catch (error) {
    console.error('Error generating achievements:', error);
    return [];
  }
}

// Helper function to generate achievements (copied from profile API)
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

  // First test achievement
  if (totalTests >= 1) {
    achievements.push({
      id: 'first_steps',
      title: 'First Steps',
      description: 'Completed your first test',
      icon: '🚀',
      color: '#2196F3',
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

  // Recent activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTests = testResults.filter(test => new Date(test.completedAt) > weekAgo);
  if (recentTests.length >= 5) {
    achievements.push({
      id: 'week_warrior',
      title: 'Week Warrior',
      description: '5+ tests in one week',
      icon: '⚡',
      color: '#FF5722',
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

    if (tradingStats.totalTrades >= 1) {
      achievements.push({
        id: 'first_trade',
        title: 'First Trade',
        description: 'Executed your first trade',
        icon: '🎯',
        color: '#4CAF50',
        rarity: 'common'
      });
    }
  }

  return achievements;
}

export default {
  checkAndNotifyNewBadges,
  generateUserAchievements
};
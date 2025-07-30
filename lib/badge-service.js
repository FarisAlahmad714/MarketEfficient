// lib/badge-service.js
import User from '../models/User';
import TestResults from '../models/TestResults';
import SandboxTrade from '../models/SandboxTrade';
import StudyProgress from '../models/StudyProgress';
import { studyContent } from './studyContent';
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
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
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
    return { success: false, error: error.message };
  }
};

// Generate user achievements (same logic as profile API but standalone)
async function generateUserAchievements(userId) {
  try {
    // Get test results
    const testResults = await TestResults.find({
      userId,
      status: 'completed',
      score: { $exists: true },
      totalPoints: { $exists: true }
    }).select('testType subType score totalPoints completedAt');

    // Get trading stats
    let tradingStats = null;
    try {
      tradingStats = await SandboxTrade.getUserTradingStats(userId);
    } catch (error) {
    }

    // Get study progress
    let studyProgress = null;
    try {
      studyProgress = await StudyProgress.findOne({ userId });
    } catch (error) {
    }

    return generateAchievements(testResults, tradingStats, studyProgress);
  } catch (error) {
    return [];
  }
}

// Helper function to generate achievements with unique trading-focused system
function generateAchievements(testResults, tradingStats, studyProgress) {
  const achievements = [];

  // Allow study badges even without test results
  if (testResults.length === 0 && !studyProgress) return achievements;

  // Calculate comprehensive stats
  const totalTests = testResults.length;
  const averageScore = totalTests > 0 ? testResults.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / totalTests : 0;
  const perfectScores = testResults.filter(test => test.score === test.totalPoints).length;
  const testTypes = [...new Set(testResults.map(test => test.testType))];
  
  // Time-based analysis
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentTests = testResults.filter(test => new Date(test.completedAt) > last30Days);
  const weeklyTests = testResults.filter(test => new Date(test.completedAt) > last7Days);

  // === INITIATION BADGES (Ultra Rare - Only first achievements) ===
  if (totalTests >= 1) {
    achievements.push({
      id: 'market_awakening',
      title: 'Market Awakening',
      description: 'Taken your first step into the trading matrix',
      icon: '🌅',
      color: '#FF6B35',
      rarity: 'common',
      category: 'initiation'
    });
  }

  // === TECHNICAL MASTERY BADGES (Hard to achieve) ===
  if (averageScore >= 95 && totalTests >= 50) {
    achievements.push({
      id: 'chart_whisperer',
      title: 'Chart Whisperer',
      description: '95%+ average with 50+ tests - You see what others miss',
      icon: '🔮',
      color: '#8E44AD',
      rarity: 'mythic',
      category: 'mastery'
    });
  } else if (averageScore >= 90 && totalTests >= 30) {
    achievements.push({
      id: 'pattern_prophet',
      title: 'Pattern Prophet',
      description: '90%+ average with 30+ tests - Predicting market moves',
      icon: '🧙‍♂️',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'mastery'
    });
  } else if (averageScore >= 85 && totalTests >= 20) {
    achievements.push({
      id: 'technical_sage',
      title: 'Technical Sage',
      description: '85%+ average with 20+ tests - True understanding',
      icon: '📜',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'mastery'
    });
  } else if (averageScore >= 75 && totalTests >= 15) {
    achievements.push({
      id: 'trend_hunter',
      title: 'Trend Hunter',
      description: '75%+ average with 15+ tests - Tracking the flow',
      icon: '🎯',
      color: '#3498DB',
      rarity: 'rare',
      category: 'mastery'
    });
  }

  // === BIAS DESTRUCTION BADGES (Psychology focused) ===
  const biasTests = testResults.filter(test => test.testType === 'bias-test');
  if (biasTests.length >= 25 && biasTests.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / biasTests.length >= 80) {
    achievements.push({
      id: 'bias_destroyer',
      title: 'Bias Destroyer',
      description: '25+ bias tests with 80%+ avg - Mind over emotions',
      icon: '🧠',
      color: '#E74C3C',
      rarity: 'legendary',
      category: 'psychology'
    });
  } else if (biasTests.length >= 15 && biasTests.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0) / biasTests.length >= 70) {
    achievements.push({
      id: 'emotional_warrior',
      title: 'Emotional Warrior',
      description: '15+ bias tests with 70%+ avg - Conquering fear & greed',
      icon: '⚔️',
      color: '#9B59B6',
      rarity: 'epic',
      category: 'psychology'
    });
  } else if (biasTests.length >= 10) {
    achievements.push({
      id: 'self_aware',
      title: 'Self-Aware',
      description: '10+ bias tests - Know thy trading self',
      icon: '🪞',
      color: '#F39C12',
      rarity: 'rare',
      category: 'psychology'
    });
  }

  // === PERFECTIONIST BADGES (Extremely hard) ===
  if (perfectScores >= 20) {
    achievements.push({
      id: 'flawless_legend',
      title: 'Flawless Legend',
      description: '20+ perfect scores - Absolute market precision',
      icon: '💎',
      color: '#1ABC9C',
      rarity: 'mythic',
      category: 'perfection'
    });
  } else if (perfectScores >= 10) {
    achievements.push({
      id: 'precision_master',
      title: 'Precision Master',
      description: '10+ perfect scores - Surgical accuracy',
      icon: '🎯',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'perfection'
    });
  } else if (perfectScores >= 5) {
    achievements.push({
      id: 'perfectionist',
      title: 'Perfectionist',
      description: '5+ perfect scores - Demanding excellence',
      icon: '✨',
      color: '#3498DB',
      rarity: 'epic',
      category: 'perfection'
    });
  }

  // === VOLUME BADGES (Dedication based) ===
  if (totalTests >= 200) {
    achievements.push({
      id: 'market_obsessed',
      title: 'Market Obsessed',
      description: '200+ tests - Markets are your life',
      icon: '🔥',
      color: '#E74C3C',
      rarity: 'mythic',
      category: 'dedication'
    });
  } else if (totalTests >= 100) {
    achievements.push({
      id: 'chart_addict',
      title: 'Chart Addict',
      description: '100+ tests - Can\'t stop analyzing',
      icon: '📊',
      color: '#9B59B6',
      rarity: 'legendary',
      category: 'dedication'
    });
  } else if (totalTests >= 50) {
    achievements.push({
      id: 'committed_student',
      title: 'Committed Student',
      description: '50+ tests - Serious about learning',
      icon: '📚',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'dedication'
    });
  } else if (totalTests >= 25) {
    achievements.push({
      id: 'dedicated_learner',
      title: 'Dedicated Learner',
      description: '25+ tests - Building knowledge',
      icon: '🎓',
      color: '#F39C12',
      rarity: 'rare',
      category: 'dedication'
    });
  }

  // === CONSISTENCY BADGES (Time-based performance) ===
  if (weeklyTests.length >= 15) {
    achievements.push({
      id: 'market_maniac',
      title: 'Market Maniac',
      description: '15+ tests in one week - Unstoppable momentum',
      icon: '⚡',
      color: '#E74C3C',
      rarity: 'legendary',
      category: 'consistency'
    });
  } else if (weeklyTests.length >= 10) {
    achievements.push({
      id: 'weekly_warrior',
      title: 'Weekly Warrior',
      description: '10+ tests in one week - Intense focus',
      icon: '🗡️',
      color: '#9B59B6',
      rarity: 'epic',
      category: 'consistency'
    });
  } else if (recentTests.length >= 20) {
    achievements.push({
      id: 'monthly_grinder',
      title: 'Monthly Grinder',
      description: '20+ tests this month - Steady progress',
      icon: '⚙️',
      color: '#3498DB',
      rarity: 'rare',
      category: 'consistency'
    });
  }

  // === VERSATILITY BADGES (Multi-skill) ===
  if (testTypes.length >= 4 && totalTests >= 40) {
    achievements.push({
      id: 'market_polymath',
      title: 'Market Polymath',
      description: 'Master of all trading disciplines',
      icon: '🎭',
      color: '#8E44AD',
      rarity: 'legendary',
      category: 'versatility'
    });
  } else if (testTypes.length >= 3 && totalTests >= 20) {
    achievements.push({
      id: 'well_rounded_trader',
      title: 'Well-Rounded Trader',
      description: 'Skilled across multiple test types',
      icon: '⚖️',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'versatility'
    });
  }

  // === TRADING PSYCHOLOGY BADGES (Sandbox based) ===
  if (tradingStats && tradingStats.totalTrades > 0) {
    // First trade (easy start)
    if (tradingStats.totalTrades >= 1) {
      achievements.push({
        id: 'cherry_popped',
        title: 'Cherry Popped',
        description: 'Your first trade - Welcome to the game',
        icon: '🍒',
        color: '#FF6B9D',
        rarity: 'common',
        category: 'trading'
      });
    }

    // Risk Management Master
    if (tradingStats.winRate >= 85 && tradingStats.totalTrades >= 50) {
      achievements.push({
        id: 'risk_master',
        title: 'Risk Master',
        description: '85%+ win rate with 50+ trades - Calculated precision',
        icon: '🛡️',
        color: '#1ABC9C',
        rarity: 'mythic',
        category: 'trading'
      });
    } else if (tradingStats.winRate >= 75 && tradingStats.totalTrades >= 30) {
      achievements.push({
        id: 'money_magnet',
        title: 'Money Magnet',
        description: '75%+ win rate with 30+ trades - Profits flow to you',
        icon: '🧲',
        color: '#FFD700',
        rarity: 'legendary',
        category: 'trading'
      });
    }

    // Portfolio Performance
    if (tradingStats.totalReturn > 200 && tradingStats.totalTrades >= 25) {
      achievements.push({
        id: 'wealth_builder',
        title: 'Wealth Builder',
        description: '200%+ returns - Compounding genius',
        icon: '🏰',
        color: '#2ECC71',
        rarity: 'legendary',
        category: 'trading'
      });
    } else if (tradingStats.totalReturn > 100 && tradingStats.totalTrades >= 15) {
      achievements.push({
        id: 'profit_hunter',
        title: 'Profit Hunter',
        description: '100%+ returns - Doubling down',
        icon: '🏹',
        color: '#F39C12',
        rarity: 'epic',
        category: 'trading'
      });
    }

    // Volume Trading
    if (tradingStats.totalTrades >= 500) {
      achievements.push({
        id: 'trade_machine',
        title: 'Trade Machine',
        description: '500+ trades - Relentless execution',
        icon: '🤖',
        color: '#95A5A6',
        rarity: 'mythic',
        category: 'trading'
      });
    } else if (tradingStats.totalTrades >= 250) {
      achievements.push({
        id: 'execution_expert',
        title: 'Execution Expert',
        description: '250+ trades - Trading is your craft',
        icon: '⚡',
        color: '#9B59B6',
        rarity: 'legendary',
        category: 'trading'
      });
    } else if (tradingStats.totalTrades >= 100) {
      achievements.push({
        id: 'active_trader',
        title: 'Active Trader',
        description: '100+ trades - Building experience',
        icon: '📈',
        color: '#3498DB',
        rarity: 'epic',
        category: 'trading'
      });
    }
  }

  // === SPECIAL ACHIEVEMENT BADGES (Unique combinations) ===
  if (averageScore >= 90 && perfectScores >= 10 && totalTests >= 50) {
    achievements.push({
      id: 'trading_god',
      title: 'Trading God',
      description: 'Ultimate mastery - 90%+ avg, 10+ perfects, 50+ tests',
      icon: '👑',
      color: '#FFD700',
      rarity: 'mythic',
      category: 'ultimate'
    });
  }

  if (totalTests >= 100 && tradingStats && tradingStats.totalTrades >= 200 && tradingStats.winRate >= 70) {
    achievements.push({
      id: 'complete_trader',
      title: 'Complete Trader',
      description: 'Theory + Practice mastery - The full package',
      icon: '🎯',
      color: '#8E44AD',
      rarity: 'mythic',
      category: 'ultimate'
    });
  }

  // === STUDY CURRICULUM BADGE ===
  if (studyProgress) {
    const totalTopics = Object.keys(studyContent).length;
    
    // 100% curriculum completion
    if (studyProgress.totalTopicsCompleted >= totalTopics) {
      achievements.push({
        id: 'curriculum_master',
        title: 'Curriculum Master',
        description: 'Completed the entire trading curriculum',
        icon: '🎓',
        color: '#FFD700',
        rarity: 'mythic',
        category: 'education'
      });
    }
  }

  return achievements;
}

// Define all possible badges in the system
const ALL_SYSTEM_BADGES = {
  // Initiation
  'market_awakening': {
    id: 'market_awakening',
    title: 'Market Awakening',
    description: 'Taken your first step into the trading matrix',
    icon: '🌅',
    color: '#FF6B35',
    rarity: 'common',
    category: 'initiation'
  },
  // Technical Mastery
  'chart_whisperer': {
    id: 'chart_whisperer',
    title: 'Chart Whisperer',
    description: '95%+ average with 50+ tests - You see what others miss',
    icon: '🔮',
    color: '#8E44AD',
    rarity: 'mythic',
    category: 'mastery'
  },
  'pattern_prophet': {
    id: 'pattern_prophet',
    title: 'Pattern Prophet',
    description: '90%+ average with 30+ tests - Predicting market moves',
    icon: '🧙‍♂️',
    color: '#FFD700',
    rarity: 'legendary',
    category: 'mastery'
  },
  'technical_sage': {
    id: 'technical_sage',
    title: 'Technical Sage',
    description: '85%+ average with 20+ tests - True understanding',
    icon: '📜',
    color: '#2ECC71',
    rarity: 'epic',
    category: 'mastery'
  },
  'trend_hunter': {
    id: 'trend_hunter',
    title: 'Trend Hunter',
    description: '75%+ average with 15+ tests - Tracking the flow',
    icon: '🎯',
    color: '#3498DB',
    rarity: 'rare',
    category: 'mastery'
  },
  // Bias Destruction
  'bias_destroyer': {
    id: 'bias_destroyer',
    title: 'Bias Destroyer',
    description: '25+ bias tests with 80%+ avg - Mind over emotions',
    icon: '🧠',
    color: '#E74C3C',
    rarity: 'legendary',
    category: 'psychology'
  },
  'emotional_warrior': {
    id: 'emotional_warrior',
    title: 'Emotional Warrior',
    description: '15+ bias tests with 70%+ avg - Conquering fear & greed',
    icon: '⚔️',
    color: '#9B59B6',
    rarity: 'epic',
    category: 'psychology'
  },
  'self_aware': {
    id: 'self_aware',
    title: 'Self-Aware',
    description: '10+ bias tests - Know thy trading self',
    icon: '🪞',
    color: '#F39C12',
    rarity: 'rare',
    category: 'psychology'
  },
  // Perfectionist
  'flawless_legend': {
    id: 'flawless_legend',
    title: 'Flawless Legend',
    description: '20+ perfect scores - Absolute market precision',
    icon: '💎',
    color: '#1ABC9C',
    rarity: 'mythic',
    category: 'perfection'
  },
  'precision_master': {
    id: 'precision_master',
    title: 'Precision Master',
    description: '10+ perfect scores - Surgical accuracy',
    icon: '🎯',
    color: '#FFD700',
    rarity: 'legendary',
    category: 'perfection'
  },
  'perfectionist': {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: '5+ perfect scores - Demanding excellence',
    icon: '✨',
    color: '#3498DB',
    rarity: 'epic',
    category: 'perfection'
  },
  // Volume
  'market_obsessed': {
    id: 'market_obsessed',
    title: 'Market Obsessed',
    description: '200+ tests - Markets are your life',
    icon: '🔥',
    color: '#E74C3C',
    rarity: 'mythic',
    category: 'dedication'
  },
  'chart_addict': {
    id: 'chart_addict',
    title: 'Chart Addict',
    description: '100+ tests - Can\'t stop analyzing',
    icon: '📊',
    color: '#9B59B6',
    rarity: 'legendary',
    category: 'dedication'
  },
  'committed_student': {
    id: 'committed_student',
    title: 'Committed Student',
    description: '50+ tests - Serious about learning',
    icon: '📚',
    color: '#2ECC71',
    rarity: 'epic',
    category: 'dedication'
  },
  'dedicated_learner': {
    id: 'dedicated_learner',
    title: 'Dedicated Learner',
    description: '25+ tests - Building knowledge',
    icon: '🎓',
    color: '#F39C12',
    rarity: 'rare',
    category: 'dedication'
  },
  // Consistency
  'market_maniac': {
    id: 'market_maniac',
    title: 'Market Maniac',
    description: '15+ tests in one week - Unstoppable momentum',
    icon: '⚡',
    color: '#E74C3C',
    rarity: 'legendary',
    category: 'consistency'
  },
  'weekly_warrior': {
    id: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: '10+ tests in one week - Intense focus',
    icon: '🗡️',
    color: '#9B59B6',
    rarity: 'epic',
    category: 'consistency'
  },
  'monthly_grinder': {
    id: 'monthly_grinder',
    title: 'Monthly Grinder',
    description: '20+ tests this month - Steady progress',
    icon: '⚙️',
    color: '#3498DB',
    rarity: 'rare',
    category: 'consistency'
  },
  // Versatility
  'market_polymath': {
    id: 'market_polymath',
    title: 'Market Polymath',
    description: 'Master of all trading disciplines',
    icon: '🎭',
    color: '#8E44AD',
    rarity: 'legendary',
    category: 'versatility'
  },
  'well_rounded_trader': {
    id: 'well_rounded_trader',
    title: 'Well-Rounded Trader',
    description: 'Skilled across multiple test types',
    icon: '⚖️',
    color: '#2ECC71',
    rarity: 'epic',
    category: 'versatility'
  },
  // Trading
  'cherry_popped': {
    id: 'cherry_popped',
    title: 'Cherry Popped',
    description: 'Your first trade - Welcome to the game',
    icon: '🍒',
    color: '#FF6B9D',
    rarity: 'common',
    category: 'trading'
  },
  'risk_master': {
    id: 'risk_master',
    title: 'Risk Master',
    description: '85%+ win rate with 50+ trades - Calculated precision',
    icon: '🛡️',
    color: '#1ABC9C',
    rarity: 'mythic',
    category: 'trading'
  },
  'money_magnet': {
    id: 'money_magnet',
    title: 'Money Magnet',
    description: '75%+ win rate with 30+ trades - Profits flow to you',
    icon: '🧲',
    color: '#FFD700',
    rarity: 'legendary',
    category: 'trading'
  },
  'wealth_builder': {
    id: 'wealth_builder',
    title: 'Wealth Builder',
    description: '200%+ returns - Compounding genius',
    icon: '🏰',
    color: '#2ECC71',
    rarity: 'legendary',
    category: 'trading'
  },
  'profit_hunter': {
    id: 'profit_hunter',
    title: 'Profit Hunter',
    description: '100%+ returns - Doubling down',
    icon: '🏹',
    color: '#F39C12',
    rarity: 'epic',
    category: 'trading'
  },
  'trade_machine': {
    id: 'trade_machine',
    title: 'Trade Machine',
    description: '500+ trades - Relentless execution',
    icon: '🤖',
    color: '#95A5A6',
    rarity: 'mythic',
    category: 'trading'
  },
  'execution_expert': {
    id: 'execution_expert',
    title: 'Execution Expert',
    description: '250+ trades - Trading is your craft',
    icon: '⚡',
    color: '#9B59B6',
    rarity: 'legendary',
    category: 'trading'
  },
  'active_trader': {
    id: 'active_trader',
    title: 'Active Trader',
    description: '100+ trades - Building experience',
    icon: '📈',
    color: '#3498DB',
    rarity: 'epic',
    category: 'trading'
  },
  // Special Achievement
  'trading_god': {
    id: 'trading_god',
    title: 'Trading God',
    description: 'Ultimate mastery - 90%+ avg, 10+ perfects, 50+ tests',
    icon: '👑',
    color: '#FFD700',
    rarity: 'mythic',
    category: 'ultimate'
  },
  'complete_trader': {
    id: 'complete_trader',
    title: 'Complete Trader',
    description: 'Theory + Practice mastery - The full package',
    icon: '🎯',
    color: '#8E44AD',
    rarity: 'mythic',
    category: 'ultimate'
  },
  'curriculum_master': {
    id: 'curriculum_master',
    title: 'Curriculum Master',
    description: 'Completed the entire trading curriculum',
    icon: '🎓',
    color: '#FFD700',
    rarity: 'mythic',
    category: 'education'
  }
};

// Convert badge IDs to full badge objects
export const getBadgeObjectsFromIds = async (userId, badgeIds) => {
  if (!badgeIds || badgeIds.length === 0) return [];
  
  try {
    // Simply map the badge IDs to their full objects
    const earnedBadges = badgeIds
      .map(badgeId => ALL_SYSTEM_BADGES[badgeId])
      .filter(badge => badge !== undefined);
    
    return earnedBadges;
  } catch (error) {
    return [];
  }
};

export default {
  checkAndNotifyNewBadges,
  generateUserAchievements,
  getBadgeObjectsFromIds
};
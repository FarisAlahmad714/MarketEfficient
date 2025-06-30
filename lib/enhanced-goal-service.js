// lib/enhanced-goal-service.js
// Enhanced goal generation service with variety, personalization, and adaptive difficulty

const { generateProgressiveGoals, getUnlockedGoalTypes } = require('./goal-progression-system');

/**
 * Seeded random function for deterministic goal generation
 */
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/**
 * Get current time information for period calculations
 */
const getCurrentTimeInfo = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const weekNumber = Math.ceil((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  const currentMonthNumber = now.getMonth() + 1;
  
  // Calculate days remaining in current periods
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  const daysRemainingInWeek = Math.ceil((endOfWeek - now) / (24 * 60 * 60 * 1000));
  
  const endOfMonth = new Date(currentYear, currentMonthNumber, 0);
  const daysRemainingInMonth = Math.ceil((endOfMonth - now) / (24 * 60 * 60 * 1000));
  
  const endOfYear = new Date(currentYear, 11, 31);
  const daysRemainingInYear = Math.ceil((endOfYear - now) / (24 * 60 * 60 * 1000));
  
  return {
    currentYear,
    weekNumber,
    currentMonthNumber,
    daysRemainingInWeek,
    daysRemainingInMonth,
    daysRemainingInYear
  };
};

/**
 * Get user level based on average score
 */
const getUserLevel = (averageScore) => {
  if (averageScore >= 90) return 'master';
  if (averageScore >= 85) return 'expert';
  if (averageScore >= 70) return 'advanced';
  if (averageScore >= 55) return 'intermediate';
  if (averageScore >= 40) return 'beginner';
  return 'novice';
};

/**
 * Calculate goal completion percentage
 */
const calculatePercentage = (current, target) => {
  return Math.min((current / target) * 100, 100);
};

/**
 * Get completion message for goal
 */
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

/**
 * Available test types with metadata
 */
const TEST_TYPES = {
  'bias-test': { name: 'Bias Test', icon: '🧠', color: '#9B59B6', focus: 'psychology' },
  'chart-exam': { name: 'Chart Analysis', icon: '📊', color: '#3498DB', focus: 'technical' },
  'swing-analysis': { name: 'Swing Trading', icon: '📈', color: '#2ECC71', focus: 'strategy' },
  'fibonacci-retracement': { name: 'Fibonacci', icon: '🌀', color: '#F39C12', focus: 'technical' },
  'fair-value-gaps': { name: 'Fair Value Gaps', icon: '📏', color: '#E74C3C', focus: 'advanced' }
};

/**
 * Enhanced goal templates with variety and personalization
 */
const GOAL_TEMPLATES = {
  // Core Volume Goals
  volume_basic: {
    id: 'volume_basic',
    title: (target, period) => `Complete ${target} Tests`,
    description: (target, period) => `Complete at least ${target} trading tests this ${period}`,
    icon: '📝',
    color: '#2196F3',
    category: 'volume'
  },
  
  volume_daily: {
    id: 'volume_daily',
    title: (target, period) => `Daily Consistency`,
    description: (target, period) => `Complete at least ${target} test${target > 1 ? 's' : ''} per day`,
    icon: '🗓️',
    color: '#4CAF50',
    category: 'consistency'
  },

  // Score Performance Goals
  score_improvement: {
    id: 'score_improvement',
    title: (target, period) => `Reach ${target}% Average Score`,
    description: (target, period) => `Achieve an average score of at least ${target}% this ${period}`,
    icon: '🎯',
    color: '#FF6B35',
    category: 'performance'
  },

  score_streak: {
    id: 'score_streak',
    title: (target, period) => `Score Streak`,
    description: (target, period) => `Achieve ${target}+ consecutive tests above 70%`,
    icon: '🔥',
    color: '#E91E63',
    category: 'consistency'
  },

  // Skill-Specific Goals
  skill_mastery: {
    id: 'skill_mastery',
    title: (target, period, testType) => `${TEST_TYPES[testType]?.name} Mastery`,
    description: (target, period, testType) => `Complete ${target} ${TEST_TYPES[testType]?.name} tests with 80%+ average`,
    icon: TEST_TYPES.bias?.icon || '🎯',
    color: TEST_TYPES.bias?.color || '#9B59B6',
    category: 'mastery'
  },

  skill_focus: {
    id: 'skill_focus',
    title: (target, period, testType) => `${TEST_TYPES[testType]?.name} Focus`,
    description: (target, period, testType) => `Complete ${target} ${TEST_TYPES[testType]?.name} tests this ${period}`,
    icon: '🎨',
    color: '#9C27B0',
    category: 'focus'
  },

  // Challenge Goals  
  perfect_challenge: {
    id: 'perfect_challenge',
    title: (target, period) => `Perfect Score Challenge`,
    description: (target, period) => `Achieve ${target} perfect score${target > 1 ? 's' : ''} (100%)`,
    icon: '💎',
    color: '#FFD700',
    category: 'challenge'
  },

  speed_challenge: {
    id: 'speed_challenge',
    title: (target, period) => `Speed Challenge`,
    description: (target, period) => `Complete ${target} tests in under 2 minutes each`,
    icon: '⚡',
    color: '#00BCD4',
    category: 'challenge'
  },

  // Improvement Goals
  weak_area_focus: {
    id: 'weak_area_focus',
    title: (target, period, testType) => `Improve Your Weakness`,
    description: (target, period, testType) => `Raise your ${TEST_TYPES[testType]?.name} average by ${target}%`,
    icon: '📈',
    color: '#795548',
    category: 'improvement'
  },

  comeback_challenge: {
    id: 'comeback_challenge',
    title: (target, period) => `Comeback Challenge`,
    description: (target, period) => `Turn ${target} failed attempts into 70%+ scores`,
    icon: '🔄',
    color: '#607D8B',
    category: 'improvement'
  },

  // Exploration Goals
  variety_explorer: {
    id: 'variety_explorer',
    title: (target, period) => `Test Type Explorer`,
    description: (target, period) => `Try all ${target} different test types this ${period}`,
    icon: '🌟',
    color: '#673AB7',
    category: 'exploration'
  },

  new_territory: {
    id: 'new_territory',
    title: (target, period, testType) => `New Territory`,
    description: (target, period, testType) => `Try ${TEST_TYPES[testType]?.name} for the first time and score 60%+`,
    icon: '🗺️',
    color: '#FF5722',
    category: 'exploration'
  },

  // Advanced Goals
  efficiency_master: {
    id: 'efficiency_master',
    title: (target, period) => `Efficiency Master`,
    description: (target, period) => `Maintain ${target}%+ accuracy with 90%+ completion rate`,
    icon: '⚙️',
    color: '#455A64',
    category: 'advanced'
  },

  knowledge_synthesis: {
    id: 'knowledge_synthesis',
    title: (target, period) => `Knowledge Synthesis`,
    description: (target, period) => `Score 85%+ across ${target} different test categories`,
    icon: '🧩',
    color: '#8BC34A',
    category: 'advanced'
  },

  // Social/Competitive Goals
  leaderboard_climb: {
    id: 'leaderboard_climb',
    title: (target, period) => `Leaderboard Climb`,
    description: (target, period) => `Improve your ranking by ${target} positions this ${period}`,
    icon: '🏆',
    color: '#FFC107',
    category: 'competitive'
  },

  // Milestone Goals
  milestone_hunter: {
    id: 'milestone_hunter',
    title: (target, period) => `Milestone Hunter`,
    description: (target, period) => `Reach ${target} total completed tests`,
    icon: '🎖️',
    color: '#009688',
    category: 'milestone'
  }
};

/**
 * Get user's weakest test types for personalized goals
 */
const getWeakestTestTypes = (metrics) => {
  if (!metrics?.testTypes) return Object.keys(TEST_TYPES);
  
  const testTypePerformance = metrics.testTypes
    .filter(t => t.count >= 3) // Only consider types with enough data
    .sort((a, b) => a.averageScore - b.averageScore);
    
  return testTypePerformance.length > 0 
    ? testTypePerformance.slice(0, 2).map(t => t.testType)
    : Object.keys(TEST_TYPES);
};

/**
 * Get user's strongest test types
 */
const getStrongestTestTypes = (metrics) => {
  if (!metrics?.testTypes) return Object.keys(TEST_TYPES);
  
  const testTypePerformance = metrics.testTypes
    .filter(t => t.count >= 3)
    .sort((a, b) => b.averageScore - a.averageScore);
    
  return testTypePerformance.length > 0 
    ? testTypePerformance.slice(0, 2).map(t => t.testType)
    : Object.keys(TEST_TYPES);
};

/**
 * Calculate adaptive difficulty based on user performance
 */
const getAdaptiveDifficulty = (userLevel, metrics, period) => {
  const baseMultipliers = {
    novice: 0.7,
    beginner: 0.85,
    intermediate: 1.0,
    advanced: 1.15,
    expert: 1.3,
    master: 1.5
  };
  
  let difficulty = baseMultipliers[userLevel] || 1.0;
  
  // Adjust based on recent performance trend
  const recentAverage = metrics?.summary?.averageScore || 0;
  if (recentAverage > 85) difficulty *= 1.1; // Make it harder for high performers
  if (recentAverage < 50) difficulty *= 0.9; // Make it easier for struggling users
  
  // Period-based adjustments
  if (period === 'week') difficulty *= 0.8;      // Weekly goals are more achievable
  if (period === 'month') difficulty *= 1.0;     // Standard difficulty
  if (period === 'year') difficulty *= 1.2;      // Yearly goals are ambitious
  
  return Math.max(0.5, Math.min(2.0, difficulty)); // Clamp between 0.5x and 2x
};

/**
 * Generate enhanced goals for a specific period
 */
const generateGoalsForPeriod = (period, metrics) => {
  const timeInfo = getCurrentTimeInfo();
  const userLevel = getUserLevel(metrics?.summary?.averageScore || 0);
  const difficulty = getAdaptiveDifficulty(userLevel, metrics, period);
  
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
  const goalCount = period === 'week' ? 4 : period === 'month' ? 3 : 2;
  
  // Get personalization data
  const weakestTypes = getWeakestTestTypes(metrics);
  const strongestTypes = getStrongestTestTypes(metrics);
  const totalTests = metrics?.summary?.totalTests || 0;
  const averageScore = metrics?.summary?.averageScore || 0;
  
  // Get unlocked goal types based on user progression
  const unlockedTypes = getUnlockedGoalTypes(metrics);
  const availableGoalTemplates = Object.keys(GOAL_TEMPLATES).filter(templateId => 
    unlockedTypes.includes(templateId)
  );
  
  const selectedGoals = [];
  
  for (let i = 0; i < goalCount; i++) {
    const goalIndex = Math.floor(seededRandom(periodSeed + i) * availableGoalTemplates.length);
    const goalTemplateId = availableGoalTemplates[goalIndex];
    const template = GOAL_TEMPLATES[goalTemplateId];
    
    let goal = generateGoalFromTemplate(template, period, metrics, difficulty, periodSeed + i, {
      weakestTypes,
      strongestTypes,
      totalTests,
      averageScore
    });
    
    if (goal) {
      selectedGoals.push(goal);
    }
  }
  
  // Ensure we always have core goals if generation fails
  if (selectedGoals.length < goalCount) {
    selectedGoals.push(...generateFallbackGoals(period, metrics, difficulty, goalCount - selectedGoals.length));
  }
  
  // Apply progression system enhancements
  const enhancedGoals = generateProgressiveGoals(period, metrics, selectedGoals.slice(0, goalCount));
  
  return enhancedGoals;
};

/**
 * Generate a goal from a template with intelligent parameters
 */
const generateGoalFromTemplate = (template, period, metrics, difficulty, seed, context) => {
  const { weakestTypes, strongestTypes, totalTests, averageScore } = context;
  let target, testType, current;
  
  switch (template.id) {
    case 'volume_basic':
      if (period === 'week') {
        target = Math.round((3 + seededRandom(seed) * 4) * difficulty);
      } else if (period === 'month') {
        target = Math.round((15 + seededRandom(seed) * 15) * difficulty);
      } else {
        target = Math.round((80 + seededRandom(seed) * 70) * difficulty);
      }
      current = totalTests;
      break;
      
    case 'score_improvement':
      if (period === 'week') {
        target = Math.round(Math.max(averageScore + 5, 60 + seededRandom(seed) * 15));
      } else if (period === 'month') {
        target = Math.round(Math.max(averageScore + 8, 70 + seededRandom(seed) * 15));
      } else {
        target = Math.round(Math.max(averageScore + 12, 80 + seededRandom(seed) * 10));
      }
      current = averageScore;
      break;
      
    case 'skill_focus':
      testType = weakestTypes[Math.floor(seededRandom(seed) * weakestTypes.length)];
      target = period === 'week' ? Math.round(2 + seededRandom(seed) * 2) : Math.round(5 + seededRandom(seed) * 5);
      current = metrics?.testTypes?.find(t => t.testType === testType)?.count || 0;
      break;
      
    case 'perfect_challenge':
      target = period === 'week' ? 1 : period === 'month' ? Math.round(2 + seededRandom(seed) * 2) : Math.round(5 + seededRandom(seed) * 5);
      current = metrics?.summary?.perfectScores || 0;
      break;
      
    case 'variety_explorer':
      target = Math.min(Object.keys(TEST_TYPES).length, period === 'week' ? 3 : period === 'month' ? 4 : 5);
      current = metrics?.testTypes?.length || 0;
      break;
      
    default:
      return null;
  }
  
  // Apply template to create goal
  return {
    id: template.id,
    title: template.title(target, period, testType),
    description: template.description(target, period, testType),
    current: current,
    target: target,
    percentage: calculatePercentage(current, target),
    message: getCompletionMessage(current, target),
    icon: (testType && TEST_TYPES[testType]) ? TEST_TYPES[testType].icon : template.icon,
    color: (testType && TEST_TYPES[testType]) ? TEST_TYPES[testType].color : template.color,
    category: template.category,
    testType: testType
  };
};

/**
 * Generate fallback goals if template generation fails
 */
const generateFallbackGoals = (period, metrics, difficulty, count) => {
  const fallbacks = [];
  const totalTests = metrics?.summary?.totalTests || 0;
  const averageScore = metrics?.summary?.averageScore || 0;
  
  if (count > 0) {
    fallbacks.push({
      id: 'fallback_volume',
      title: `Complete ${Math.round((period === 'week' ? 5 : period === 'month' ? 20 : 100) * difficulty)} Tests`,
      description: `Complete tests this ${period}`,
      current: totalTests,
      target: Math.round((period === 'week' ? 5 : period === 'month' ? 20 : 100) * difficulty),
      percentage: calculatePercentage(totalTests, Math.round((period === 'week' ? 5 : period === 'month' ? 20 : 100) * difficulty)),
      message: getCompletionMessage(totalTests, Math.round((period === 'week' ? 5 : period === 'month' ? 20 : 100) * difficulty)),
      icon: '📝',
      color: '#2196F3',
      category: 'volume'
    });
  }
  
  return fallbacks;
};

/**
 * Get time remaining text for a period
 */
const getRemainingTimeText = (period) => {
  const timeInfo = getCurrentTimeInfo();
  
  if (period === 'week') {
    const days = timeInfo.daysRemainingInWeek;
    if (days === 0) return 'Last day of the week';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  } else if (period === 'month') {
    const days = timeInfo.daysRemainingInMonth;
    if (days === 0) return 'Last day of the month';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  } else {
    const days = timeInfo.daysRemainingInYear;
    if (days === 0) return 'Last day of the year';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  }
};

module.exports = {
  generateGoalsForPeriod,
  getCurrentTimeInfo,
  getRemainingTimeText,
  getUserLevel,
  calculatePercentage,
  getCompletionMessage,
  GOAL_TEMPLATES,
  TEST_TYPES,
  // Re-export progression system functions
  ...require('./goal-progression-system')
};
// lib/goal-service.js
// Shared goal generation service to ensure consistency between dashboard and profile

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
 * Generate goals for a specific period
 * @param {string} period - 'week', 'month', or 'year'
 * @param {object} metrics - User metrics object with summary data
 * @returns {array} Array of goal objects
 */
const generateGoalsForPeriod = (period, metrics) => {
  const timeInfo = getCurrentTimeInfo();
  
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
  const userLevel = getUserLevel(metrics?.summary?.averageScore || 0);
  
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
      : `${Math.abs(scoreTarget - currentScore).toFixed(1)}% improvement needed`,
    color: '#FF6B35'
  });
  
  // 3. BIAS TESTS GOAL (Weekly and Monthly only)
  if (period === 'week' || period === 'month') {
    const biasTarget = period === 'week' ? 3 : Math.round(8 + seededRandom(periodSeed * 3) * 4);
    const biasCompleted = metrics?.testTypes?.find(t => t.testType === 'Bias Test')?.count || 0;
    
    goals.push({
      id: 'bias-goal',
      title: `Complete ${biasTarget} Bias Tests`,
      description: `Goal to complete ${biasTarget} bias psychology tests this ${period}`,
      current: biasCompleted,
      target: biasTarget,
      percentage: calculatePercentage(biasCompleted, biasTarget),
      message: getCompletionMessage(biasCompleted, biasTarget),
      color: '#9B59B6'
    });
  }
  
  // 4. PERFECT SCORE GOAL (Weekly only)
  if (period === 'week') {
    const perfectTarget = 1;
    const perfectCompleted = metrics?.summary?.perfectScores || 0;
    
    goals.push({
      id: 'perfect-goal',
      title: `Get ${perfectTarget} Perfect Score`,
      description: 'Achieve a perfect score on any test',
      current: perfectCompleted,
      target: perfectTarget,
      percentage: calculatePercentage(perfectCompleted, perfectTarget),
      message: getCompletionMessage(perfectCompleted, perfectTarget),
      color: '#FFD700'
    });
  }
  
  return goals;
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
  getCompletionMessage
};
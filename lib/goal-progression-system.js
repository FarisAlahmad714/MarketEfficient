// lib/goal-progression-system.js
// Achievement chains and progressive goal unlocking system

/**
 * Achievement chains - goals that unlock based on previous completions
 */
const ACHIEVEMENT_CHAINS = {
  // Mastery Progression Chain
  mastery_chain: {
    id: 'mastery_chain',
    name: 'Path to Mastery',
    description: 'Progressive skill development chain',
    chain: [
      {
        level: 1,
        id: 'first_steps',
        title: 'First Steps',
        requirement: 'Complete 5 tests',
        unlocks: 'score_seeker'
      },
      {
        level: 2,
        id: 'score_seeker',
        title: 'Score Seeker',
        requirement: 'Achieve 60% average score',
        unlocks: 'consistency_builder'
      },
      {
        level: 3,
        id: 'consistency_builder',
        title: 'Consistency Builder',
        requirement: 'Complete 3 tests above 70% in a row',
        unlocks: 'skill_explorer'
      },
      {
        level: 4,
        id: 'skill_explorer',
        title: 'Skill Explorer',
        requirement: 'Try all 5 test types',
        unlocks: 'perfectionist_path'
      },
      {
        level: 5,
        id: 'perfectionist_path',
        title: 'Perfectionist Path',
        requirement: 'Achieve 2 perfect scores',
        unlocks: 'master_candidate'
      },
      {
        level: 6,
        id: 'master_candidate',
        title: 'Master Candidate',
        requirement: 'Achieve 85% average across 50+ tests',
        unlocks: null // Final level
      }
    ]
  },

  // Speed Development Chain
  speed_chain: {
    id: 'speed_chain',
    name: 'Speed Development',
    description: 'Fast completion mastery chain',
    chain: [
      {
        level: 1,
        id: 'time_conscious',
        title: 'Time Conscious',
        requirement: 'Complete 5 tests under 3 minutes each',
        unlocks: 'speed_demon'
      },
      {
        level: 2,
        id: 'speed_demon',
        title: 'Speed Demon',
        requirement: 'Complete 10 tests under 2 minutes each',
        unlocks: 'lightning_fast'
      },
      {
        level: 3,
        id: 'lightning_fast',
        title: 'Lightning Fast',
        requirement: 'Complete 20 tests under 90 seconds each',
        unlocks: null
      }
    ]
  },

  // Psychology Mastery Chain
  psychology_chain: {
    id: 'psychology_chain',
    name: 'Psychology Mastery',
    description: 'Bias test specialization chain',
    chain: [
      {
        level: 1,
        id: 'bias_aware',
        title: 'Bias Aware',
        requirement: 'Complete 10 bias tests',
        unlocks: 'psychology_student'
      },
      {
        level: 2,
        id: 'psychology_student',
        title: 'Psychology Student',
        requirement: 'Achieve 75% average on bias tests',
        unlocks: 'mind_master'
      },
      {
        level: 3,
        id: 'mind_master',
        title: 'Mind Master',
        requirement: 'Achieve 90% average on 25+ bias tests',
        unlocks: null
      }
    ]
  }
};

/**
 * Special event goals that appear periodically
 */
const SPECIAL_EVENTS = {
  weekend_warrior: {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete 10 tests over the weekend',
    trigger: 'weekend', // Appears only on weekends
    duration: 2, // 2 days
    rewards: ['bonus_xp', 'special_badge']
  },

  monthly_marathon: {
    id: 'monthly_marathon',
    title: 'Monthly Marathon',
    description: 'Complete 100 tests this month',
    trigger: 'month_start', // Appears first week of month
    duration: 30,
    rewards: ['exclusive_badge', 'leaderboard_boost']
  },

  perfect_week: {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Achieve perfect scores on 7 different days',
    trigger: 'random', // 10% chance each week
    duration: 7,
    rewards: ['perfect_streak_badge', 'bonus_multiplier']
  }
};

/**
 * Get user's current progress in achievement chains
 */
const getUserChainProgress = (userMetrics, completedGoals = []) => {
  const chainProgress = {};
  
  Object.values(ACHIEVEMENT_CHAINS).forEach(chain => {
    const progress = {
      chainId: chain.id,
      name: chain.name,
      description: chain.description,
      currentLevel: 0,
      completedLevels: [],
      nextLevel: null,
      totalLevels: chain.chain.length
    };
    
    // Check each level in the chain
    for (let i = 0; i < chain.chain.length; i++) {
      const level = chain.chain[i];
      const isCompleted = checkChainLevelCompletion(level, userMetrics, completedGoals);
      
      if (isCompleted) {
        progress.completedLevels.push(level);
        progress.currentLevel = i + 1;
      } else {
        progress.nextLevel = level;
        break;
      }
    }
    
    chainProgress[chain.id] = progress;
  });
  
  return chainProgress;
};

/**
 * Check if a specific chain level is completed
 */
const checkChainLevelCompletion = (level, userMetrics, completedGoals) => {
  const { requirement } = level;
  const metrics = userMetrics?.summary || {};
  
  // Parse requirement and check completion
  if (requirement.includes('Complete') && requirement.includes('tests')) {
    const requiredCount = parseInt(requirement.match(/\d+/)[0]);
    return (metrics.totalTests || 0) >= requiredCount;
  }
  
  if (requirement.includes('average score')) {
    const requiredScore = parseInt(requirement.match(/\d+/)[0]);
    return (metrics.averageScore || 0) >= requiredScore;
  }
  
  if (requirement.includes('perfect scores')) {
    const requiredPerfect = parseInt(requirement.match(/\d+/)[0]);
    return (metrics.perfectScores || 0) >= requiredPerfect;
  }
  
  if (requirement.includes('test types')) {
    const requiredTypes = parseInt(requirement.match(/\d+/)[0]);
    return (userMetrics?.testTypes?.length || 0) >= requiredTypes;
  }
  
  if (requirement.includes('in a row')) {
    // This would require streak tracking - simplified for now
    return (metrics.averageScore || 0) >= 70 && (metrics.totalTests || 0) >= 3;
  }
  
  return false;
};

/**
 * Get unlocked goal types based on user progress
 */
const getUnlockedGoalTypes = (userMetrics, completedGoals = []) => {
  const chainProgress = getUserChainProgress(userMetrics, completedGoals);
  const unlockedTypes = new Set(['volume_basic', 'score_improvement']); // Always available
  
  // Add unlocked types based on chain progress
  Object.values(chainProgress).forEach(progress => {
    progress.completedLevels.forEach(level => {
      if (level.unlocks) {
        unlockedTypes.add(level.unlocks);
      }
    });
  });
  
  // Add types based on user level
  const userLevel = getUserLevel(userMetrics?.summary?.averageScore || 0);
  const levelUnlocks = {
    novice: ['volume_daily'],
    beginner: ['skill_focus', 'variety_explorer'],
    intermediate: ['perfect_challenge', 'weak_area_focus'],
    advanced: ['speed_challenge', 'efficiency_master'],
    expert: ['knowledge_synthesis', 'leaderboard_climb'],
    master: ['milestone_hunter', 'comeback_challenge']
  };
  
  const userLevelIndex = ['novice', 'beginner', 'intermediate', 'advanced', 'expert', 'master'].indexOf(userLevel);
  for (let i = 0; i <= userLevelIndex; i++) {
    const level = ['novice', 'beginner', 'intermediate', 'advanced', 'expert', 'master'][i];
    if (levelUnlocks[level]) {
      levelUnlocks[level].forEach(type => unlockedTypes.add(type));
    }
  }
  
  return Array.from(unlockedTypes);
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
 * Check for active special events
 */
const getActiveSpecialEvents = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const activeEvents = [];
  
  // Weekend Warrior (Friday-Sunday)
  if (dayOfWeek >= 5 || dayOfWeek === 0) {
    activeEvents.push(SPECIAL_EVENTS.weekend_warrior);
  }
  
  // Monthly Marathon (first week of month)
  if (dayOfMonth <= 7) {
    activeEvents.push(SPECIAL_EVENTS.monthly_marathon);
  }
  
  // Perfect Week (10% random chance - use date as seed)
  const weekSeed = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const random = Math.sin(weekSeed) % 1;
  if (Math.abs(random) < 0.1) {
    activeEvents.push(SPECIAL_EVENTS.perfect_week);
  }
  
  return activeEvents;
};

/**
 * Generate goals with progression awareness
 */
const generateProgressiveGoals = (period, metrics, baseGoals) => {
  const unlockedTypes = getUnlockedGoalTypes(metrics);
  const chainProgress = getUserChainProgress(metrics);
  const specialEvents = getActiveSpecialEvents();
  
  // Filter base goals to only include unlocked types
  const availableGoals = baseGoals.filter(goal => 
    unlockedTypes.includes(goal.id) || goal.category === 'volume' // Always allow volume goals
  );
  
  // Add chain progression goals if user is ready for next level
  Object.values(chainProgress).forEach(progress => {
    if (progress.nextLevel && progress.currentLevel < progress.totalLevels) {
      const chainGoal = {
        id: `chain_${progress.nextLevel.id}`,
        title: `🔗 ${progress.nextLevel.title}`,
        description: `Chain Goal: ${progress.nextLevel.requirement}`,
        current: 0, // Would need specific calculation
        target: 1,
        percentage: 0,
        message: 'Complete to unlock next tier',
        icon: '🔗',
        color: '#FF9800',
        category: 'progression',
        isChainGoal: true,
        chainInfo: {
          chainName: progress.name,
          level: progress.nextLevel.level,
          totalLevels: progress.totalLevels
        }
      };
      availableGoals.push(chainGoal);
    }
  });
  
  // Add special event goals
  specialEvents.forEach(event => {
    const eventGoal = {
      id: `event_${event.id}`,
      title: `🎉 ${event.title}`,
      description: `Limited Time: ${event.description}`,
      current: 0,
      target: 1,
      percentage: 0,
      message: 'Limited time special event!',
      icon: '🎉',
      color: '#E91E63',
      category: 'event',
      isSpecialEvent: true,
      eventInfo: {
        duration: event.duration,
        rewards: event.rewards
      }
    };
    availableGoals.push(eventGoal);
  });
  
  return availableGoals;
};

module.exports = {
  ACHIEVEMENT_CHAINS,
  SPECIAL_EVENTS,
  getUserChainProgress,
  getUnlockedGoalTypes,
  getActiveSpecialEvents,
  generateProgressiveGoals,
  checkChainLevelCompletion
};
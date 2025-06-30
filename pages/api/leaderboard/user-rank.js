// pages/api/leaderboard/user-rank.js
import { createApiHandler } from '../../../lib/api-handler';
import { optionalAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import TestResults from '../../../models/TestResults';
import User from '../../../models/User';
import { cache } from '../../../lib/cache';

async function userRankHandler(req, res) {
  const { username, testType = 'all', period = 'all' } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  // Find user by username
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check cache first
  const cacheKey = `user_rank_${user._id}_${testType}_${period}`;
  const cachedRank = cache.get('userMetrics', cacheKey);
  if (cachedRank) {
    return res.status(200).json(cachedRank);
  }
  
  // Calculate time frame based on period
  let startDate = null;
  if (period !== 'all') {
    startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
  }
  
  // Build the query
  const query = {};
  
  // Add testType filter if provided
  if (testType && testType !== 'all') {
    if (['bias-test', 'chart-exam'].includes(testType)) {
      query.testType = testType;
    } else {
      query.subType = testType;
      query.testType = 'chart-exam';
    }
  }
  
  // Add time period filter if applicable
  if (startDate) {
    query.completedAt = { $gte: startDate };
  }
  
  // Get the full leaderboard to find user's actual rank
  const leaderboardResults = await TestResults.aggregate([
    { $match: query },
    { 
      $addFields: { 
        percentageScore: {
          $cond: {
            if: { $gt: ["$totalPoints", 0] },
            then: { $multiply: [{ $divide: ["$score", "$totalPoints"] }, 100] },
            else: 0
          }
        }
      } 
    },
    { 
      $group: {
        _id: "$userId",
        bestScore: { $max: "$percentageScore" },
        testsTaken: { $sum: 1 },
        latestTest: { $max: "$completedAt" }
      }
    },
    { 
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $match: { "user.0": { $exists: true } } }, // Only include existing users
    { $sort: { bestScore: -1, testsTaken: -1 } } // Exact same sorting as main leaderboard
  ]);
  
  // Find user's rank in the sorted results
  const userIndex = leaderboardResults.findIndex(result => result._id.toString() === user._id.toString());
  
  if (userIndex === -1) {
    return res.status(200).json({
      rank: null,
      totalParticipants: leaderboardResults.length,
      userScore: 0,
      testsTaken: 0,
      percentile: null,
      testType,
      period
    });
  }
  
  const userResult = leaderboardResults[userIndex];
  const rank = userIndex + 1; // Convert 0-based index to 1-based rank
  const total = leaderboardResults.length;
  const percentile = Math.round(((total - rank + 1) / total) * 100);
  
  // Get rank badge info
  const getRankBadge = (rank, total) => {
    const percentage = (rank / total) * 100;
    
    if (rank === 1) {
      return { badge: 'champion', icon: '👑', color: '#FFD700', label: '#1 Champion' };
    } else if (rank <= 3) {
      return { badge: 'podium', icon: '🥇', color: '#FFD700', label: `Top 3` };
    } else if (rank <= 10) {
      return { badge: 'top10', icon: '🏆', color: '#FF9800', label: 'Top 10' };
    } else if (percentage <= 5) {
      return { badge: 'elite', icon: '💎', color: '#9C27B0', label: 'Top 5%' };
    } else if (percentage <= 10) {
      return { badge: 'expert', icon: '⭐', color: '#2196F3', label: 'Top 10%' };
    } else if (percentage <= 25) {
      return { badge: 'skilled', icon: '🎯', color: '#4CAF50', label: 'Top 25%' };
    } else if (percentage <= 50) {
      return { badge: 'rising', icon: '📈', color: '#8BC34A', label: 'Top 50%' };
    } else {
      return { badge: 'participant', icon: '🎪', color: '#607D8B', label: 'Participant' };
    }
  };
  
  const rankBadge = getRankBadge(rank, total);
  
  const rankData = {
    rank,
    totalParticipants: total,
    userScore: Math.round(userResult.bestScore * 10) / 10,
    testsTaken: userResult.testsTaken,
    percentile,
    rankBadge,
    testType,
    period
  };
  
  // Cache for 10 minutes
  cache.set('userMetrics', cacheKey, rankData);
  
  return res.status(200).json(rankData);
}

export default createApiHandler(
  composeMiddleware(optionalAuth, userRankHandler),
  { methods: ['GET'] }
);
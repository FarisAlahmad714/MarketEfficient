// pages/api/leaderboard.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../lib/api-handler';
import { optionalAuth } from '../../middleware/auth';
import { composeMiddleware } from '../../lib/api-handler';
import TestResults from '../../models/TestResults';
import User from '../../models/User';

async function leaderboardHandler(req, res) {
  // Extract query parameters
  const { testType, period = 'all', limit = 10 } = req.query;
  
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
    // Check if it's a main test type or a subType
    if (['bias-test', 'chart-exam'].includes(testType)) {
      query.testType = testType;
    } else {
      // For specific exam types like 'swing-analysis', 'fibonacci-retracement', etc.
      query.subType = testType;
      query.testType = 'chart-exam';
    }
  }
  
  // Add time period filter if applicable
  if (startDate) {
    query.completedAt = { $gte: startDate };
  }
  
  // Fetch top scores
  // We need to consider that different tests have different point scales,
  // so we'll calculate a percentage score for fair comparison
  const results = await TestResults.aggregate([
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
        latestTest: { $max: "$completedAt" },
        // Keep track of the test document with the best score
        bestTestId: { 
          $first: {
            $cond: [
              { $eq: ["$percentageScore", { $max: "$percentageScore" }] },
              "$_id",
              null
            ]
          }
        }
      }
    },
    { $sort: { bestScore: -1, testsTaken: -1 } },
    { $limit: parseInt(limit) }
  ]);
  
  // Fetch user details for each result
  const userIds = results.map(result => result._id);
  const users = await User.find(
    { _id: { $in: userIds } },
    { name: 1, email: 1, profileImageGcsPath: 1 } // Include profile image path
  );
  
  // Create a map of userId to user data for quick lookup
  const userMap = {};
  users.forEach(user => {
    userMap[user._id] = user;
  });
  
  // Add user data to results and format - ONLY include users that still exist
  const leaderboardData = results
    .filter(result => userMap[result._id]) // Filter out deleted users
    .map((result, index) => {
      const userData = userMap[result._id];
      
      return {
        rank: index + 1,
        userId: result._id,
        name: userData.name,
        // Mask email for privacy
        email: userData.email ? `${userData.email.split('@')[0].substring(0, 3)}***@${userData.email.split('@')[1]}` : null,
        score: parseFloat(result.bestScore.toFixed(1)),
        testsTaken: result.testsTaken,
        lastActive: result.latestTest,
        profileImageGcsPath: userData.profileImageGcsPath || null
      };
    });
  
  // Also get the rank of the current user if they're authenticated
  let currentUserRank = null;
  
  if (req.user) {
    // Find user's best score with the same criteria  
    const userQuery = { ...query, userId: req.user.id };
    const userBestResult = await TestResults.aggregate([
      { $match: userQuery },
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
      { $sort: { percentageScore: -1 } },
      { $limit: 1 }
    ]);
    
    if (userBestResult.length > 0) {
      // Count how many users have a better score
      const userBestScore = userBestResult[0].percentageScore;
      const betterScoresCount = await TestResults.aggregate([
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
            bestScore: { $max: "$percentageScore" }
          }
        },
        { $match: { bestScore: { $gt: userBestScore } } },
        { $count: "count" }
      ]);
      
      currentUserRank = betterScoresCount.length > 0 ? betterScoresCount[0].count + 1 : 1;
    }
  }
  
  return res.status(200).json({
    leaderboard: leaderboardData,
    currentUserRank,
    totalParticipants: await TestResults.aggregate([
      { $match: query },
      { $group: { _id: "$userId" } },
      { 
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $match: { "user.0": { $exists: true } } }, // Only count if user still exists
      { $count: "count" }
    ]).then(result => result.length > 0 ? result[0].count : 0),
    testType: testType || 'all',
    period
  });
}

// Export with optional auth (allows both authenticated and public access)
export default createApiHandler(
  composeMiddleware(optionalAuth, leaderboardHandler),
  { methods: ['GET'] }
);
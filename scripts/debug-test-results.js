#!/usr/bin/env node

// scripts/debug-test-results.js
const mongoose = require('mongoose');
const connectDB = require('../lib/database');
const TestResults = require('../models/TestResults');
const User = require('../models/User');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function debugTestResults(userIdentifier) {
  try {
    await connectDB();
    
    // Find user by email, username, or userId
    let user;
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      user = await User.findById(userIdentifier);
    } else {
      user = await User.findOne({
        $or: [
          { email: userIdentifier },
          { username: userIdentifier }
        ]
      });
    }

    if (!user) {
      colorLog('red', `❌ User not found: ${userIdentifier}`);
      return;
    }

    colorLog('green', `✅ Found user: ${user.email} (${user.username})`);
    colorLog('blue', `   User ID: ${user._id}`);
    colorLog('blue', `   Created: ${user.createdAt}`);
    
    // Fetch all test results for this user
    const testResults = await TestResults.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .exec();

    colorLog('cyan', `\n📊 Total test results found: ${testResults.length}`);

    if (testResults.length === 0) {
      colorLog('yellow', '⚠️  No test results found for this user');
      return;
    }

    // Group by test type
    const groupedResults = {};
    const allScores = [];
    let duplicateCount = 0;
    let orphanedCount = 0;

    colorLog('bright', '\n📋 DETAILED TEST RESULTS:');
    console.log('=' * 80);

    testResults.forEach((result, index) => {
      const testType = result.testType;
      if (!groupedResults[testType]) {
        groupedResults[testType] = [];
      }
      groupedResults[testType].push(result);
      
      // Calculate percentage score
      const percentage = result.totalPoints > 0 ? 
        ((result.score / result.totalPoints) * 100).toFixed(1) : 0;
      
      allScores.push({
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: parseFloat(percentage),
        testType: result.testType,
        date: result.completedAt
      });

      // Check for potential issues
      if (!result.userId) {
        orphanedCount++;
        colorLog('red', `   ⚠️  Orphaned result (no userId)`);
      }

      colorLog('white', `\n${index + 1}. Test Result ID: ${result._id}`);
      colorLog('blue', `   Type: ${result.testType}${result.subType ? ` (${result.subType})` : ''}`);
      colorLog('blue', `   Asset: ${result.assetSymbol}`);
      colorLog('blue', `   Score: ${result.score}/${result.totalPoints} (${percentage}%)`);
      colorLog('blue', `   Status: ${result.status}`);
      colorLog('blue', `   Completed: ${result.completedAt}`);
      
      if (result.details) {
        if (result.details.timeframe) {
          colorLog('blue', `   Timeframe: ${result.details.timeframe}`);
        }
        if (result.details.sessionId) {
          colorLog('blue', `   Session ID: ${result.details.sessionId}`);
        }
        if (result.details.testDetails && result.details.testDetails.length > 0) {
          colorLog('blue', `   Questions: ${result.details.testDetails.length}`);
          
          // Show question breakdown
          result.details.testDetails.forEach((detail, qIndex) => {
            const correctSymbol = detail.isCorrect ? '✅' : '❌';
            console.log(`     Q${detail.question || qIndex + 1}: ${correctSymbol} ${detail.prediction || 'N/A'}`);
          });
        }
      }
    });

    // Check for duplicates
    colorLog('bright', '\n🔍 DUPLICATE DETECTION:');
    const duplicateGroups = {};
    testResults.forEach(result => {
      const key = `${result.testType}-${result.assetSymbol}-${result.completedAt.toISOString().split('T')[0]}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(result);
    });

    Object.entries(duplicateGroups).forEach(([key, group]) => {
      if (group.length > 1) {
        duplicateCount += group.length - 1;
        colorLog('yellow', `⚠️  Potential duplicates for ${key}: ${group.length} entries`);
        group.forEach(dup => {
          colorLog('yellow', `   - ${dup._id} (${dup.completedAt})`);
        });
      }
    });

    if (duplicateCount === 0) {
      colorLog('green', '✅ No duplicate entries detected');
    }

    // Calculate statistics
    colorLog('bright', '\n📈 STATISTICS:');
    console.log('=' * 50);
    
    // Overall average
    const totalScore = allScores.reduce((sum, s) => sum + s.score, 0);
    const totalPossible = allScores.reduce((sum, s) => sum + s.totalPoints, 0);
    const overallAverage = totalPossible > 0 ? ((totalScore / totalPossible) * 100).toFixed(1) : 0;
    
    colorLog('cyan', `📊 Overall Average: ${overallAverage}%`);
    colorLog('cyan', `📊 Total Tests: ${testResults.length}`);
    colorLog('cyan', `📊 Total Score: ${totalScore}/${totalPossible}`);

    // Manual average calculation verification
    const percentages = allScores.map(s => s.percentage);
    const manualAverage = percentages.length > 0 ? 
      (percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(1) : 0;
    
    colorLog('magenta', `🔢 Manual Average (sum of percentages / count): ${manualAverage}%`);
    
    if (Math.abs(parseFloat(overallAverage) - parseFloat(manualAverage)) > 0.1) {
      colorLog('red', '❌ DISCREPANCY DETECTED: Weighted vs Simple average mismatch!');
    } else {
      colorLog('green', '✅ Average calculations match');
    }

    // Statistics by test type
    colorLog('bright', '\n📊 BY TEST TYPE:');
    Object.entries(groupedResults).forEach(([testType, results]) => {
      const typeScores = results.map(r => ({
        score: r.score,
        totalPoints: r.totalPoints,
        percentage: r.totalPoints > 0 ? ((r.score / r.totalPoints) * 100) : 0
      }));
      
      const typeAverage = typeScores.length > 0 ? 
        (typeScores.reduce((sum, s) => sum + s.percentage, 0) / typeScores.length).toFixed(1) : 0;
      
      colorLog('blue', `  ${testType}: ${results.length} tests, ${typeAverage}% average`);
      
      // Show recent scores
      const recentScores = results.slice(0, 3).map(r => {
        const pct = r.totalPoints > 0 ? ((r.score / r.totalPoints) * 100).toFixed(1) : 0;
        return `${pct}%`;
      });
      colorLog('blue', `    Recent: ${recentScores.join(', ')}`);
    });

    // Data integrity checks
    colorLog('bright', '\n🔍 DATA INTEGRITY CHECKS:');
    let issuesFound = 0;
    
    testResults.forEach((result, index) => {
      const issues = [];
      
      if (!result.score && result.score !== 0) issues.push('Missing score');
      if (!result.totalPoints) issues.push('Missing totalPoints');
      if (!result.testType) issues.push('Missing testType');
      if (!result.assetSymbol) issues.push('Missing assetSymbol');
      if (!result.completedAt) issues.push('Missing completedAt');
      if (result.score < 0) issues.push('Negative score');
      if (result.totalPoints < 0) issues.push('Negative totalPoints');
      if (result.score > result.totalPoints) issues.push('Score exceeds totalPoints');
      
      if (issues.length > 0) {
        issuesFound++;
        colorLog('red', `❌ Issues in result ${index + 1} (${result._id}):`);
        issues.forEach(issue => colorLog('red', `   - ${issue}`));
      }
    });

    if (issuesFound === 0) {
      colorLog('green', '✅ No data integrity issues found');
    } else {
      colorLog('red', `❌ Found ${issuesFound} results with data integrity issues`);
    }

    // Summary
    colorLog('bright', '\n📋 SUMMARY:');
    colorLog('white', `Total Results: ${testResults.length}`);
    colorLog('white', `Duplicate Entries: ${duplicateCount}`);
    colorLog('white', `Orphaned Entries: ${orphanedCount}`);
    colorLog('white', `Data Issues: ${issuesFound}`);
    colorLog('white', `Overall Average: ${overallAverage}%`);
    colorLog('white', `Manual Average: ${manualAverage}%`);

  } catch (error) {
    colorLog('red', `❌ Error debugging test results: ${error.message}`);
    console.error(error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
  }
}

// CLI interface
if (require.main === module) {
  const userIdentifier = process.argv[2];
  
  if (!userIdentifier) {
    console.log('Usage: node scripts/debug-test-results.js <user-email|username|userId>');
    console.log('Example: node scripts/debug-test-results.js user@example.com');
    process.exit(1);
  }
  
  debugTestResults(userIdentifier)
    .then(() => {
      console.log('\n✅ Debug completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugTestResults };
#!/usr/bin/env node

// scripts/simple-chart-analysis.js
// SAFE READ-ONLY ANALYSIS - No dependencies on ES modules
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Simple logger replacement
const logger = {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

// Direct database connection (simplified)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Please set MONGODB_URI environment variable');
  process.exit(1);
}

// TestResults schema (simplified)
const TestResultsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  testType: String,
  subType: String,
  assetSymbol: String,
  score: Number,
  totalPoints: Number,
  status: String,
  completedAt: Date,
  details: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const TestResults = mongoose.model('TestResults', TestResultsSchema);

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

async function analyzeChartExamData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    colorLog('bright', '🔍 ANALYZING CHART EXAM DATA (READ-ONLY)...\n');
    
    // Get all chart exam results
    const chartExamResults = await TestResults.find({
      testType: 'chart-exam'
    }).sort({ completedAt: -1 });
    
    colorLog('cyan', `📊 Total chart exam results found: ${chartExamResults.length}\n`);
    
    if (chartExamResults.length === 0) {
      colorLog('yellow', '⚠️  No chart exam data found - nothing to analyze');
      return { totalRecords: 0, totalIssues: 0, analysis: {} };
    }
    
    // Analyze by subType
    const analysis = {
      'swing-analysis': { total: 0, issues: [], samples: [], stats: {} },
      'fibonacci-retracement': { total: 0, issues: [], samples: [], stats: {} },
      'fair-value-gaps': { total: 0, issues: [], samples: [], stats: {} }
    };
    
    let totalIssues = 0;
    
    for (const result of chartExamResults) {
      const subType = result.subType;
      if (!analysis[subType]) continue;
      
      analysis[subType].total++;
      
      // Calculate percentage
      const percentage = result.totalPoints > 0 ? 
        ((result.score / result.totalPoints) * 100) : 0;
      
      // Store sample for analysis
      const sample = {
        id: result._id.toString(),
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: percentage.toFixed(1),
        completedAt: result.completedAt ? result.completedAt.toISOString() : 'Unknown'
      };
      
      // Check for potential issues
      const issues = checkForIssues(result);
      if (issues.length > 0) {
        sample.issues = issues;
        analysis[subType].issues.push(sample);
        totalIssues++;
      }
      
      // Keep first 5 samples for review
      if (analysis[subType].samples.length < 5) {
        analysis[subType].samples.push(sample);
      }
    }
    
    // Calculate statistics for each subtype
    for (const [subType, data] of Object.entries(analysis)) {
      if (data.total > 0) {
        const subtypeResults = chartExamResults.filter(r => r.subType === subType);
        const percentages = subtypeResults.map(r => 
          r.totalPoints > 0 ? (r.score / r.totalPoints) * 100 : 0
        );
        
        data.stats = {
          averagePercentage: percentages.length > 0 ? 
            (percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(1) : 0,
          minPercentage: percentages.length > 0 ? Math.min(...percentages).toFixed(1) : 0,
          maxPercentage: percentages.length > 0 ? Math.max(...percentages).toFixed(1) : 0,
          over100Count: percentages.filter(p => p > 100).length
        };
      }
    }
    
    // Print detailed analysis
    colorLog('bright', '📈 ANALYSIS BY TEST TYPE:\n');
    
    for (const [subType, data] of Object.entries(analysis)) {
      if (data.total === 0) continue;
      
      colorLog('blue', `🎯 ${subType.toUpperCase()}:`);
      colorLog('white', `   Total: ${data.total}`);
      colorLog('white', `   Issues: ${data.issues.length}`);
      colorLog('white', `   Average: ${data.stats.averagePercentage}%`);
      colorLog('white', `   Range: ${data.stats.minPercentage}% - ${data.stats.maxPercentage}%`);
      
      if (data.stats.over100Count > 0) {
        colorLog('red', `   ❌ Results over 100%: ${data.stats.over100Count}`);
      } else {
        colorLog('green', `   ✅ No results over 100%`);
      }
      
      if (data.issues.length > 0) {
        colorLog('yellow', `   Sample issues:`);
        data.issues.slice(0, 3).forEach((issue, i) => {
          colorLog('yellow', `     ${i + 1}. Score: ${issue.score}/${issue.totalPoints} = ${issue.percentage}%`);
          colorLog('yellow', `        Issues: ${issue.issues.join(', ')}`);
        });
      }
      
      colorLog('white', `   Sample data:`);
      data.samples.slice(0, 3).forEach((sample, i) => {
        const color = sample.issues && sample.issues.length > 0 ? 'yellow' : 'white';
        colorLog(color, `     ${i + 1}. ${sample.score}/${sample.totalPoints} = ${sample.percentage}%`);
      });
      
      console.log('');
    }
    
    const summary = {
      totalRecords: chartExamResults.length,
      totalIssues: totalIssues,
      issueRate: chartExamResults.length > 0 ? 
        ((totalIssues / chartExamResults.length) * 100).toFixed(1) : 0
    };
    
    colorLog('bright', '🚨 SUMMARY:');
    colorLog('cyan', `   Total records: ${summary.totalRecords}`);
    colorLog('cyan', `   Total issues: ${summary.totalIssues}`);
    colorLog('cyan', `   Issue rate: ${summary.issueRate}%\n`);
    
    if (totalIssues > 0) {
      colorLog('red', '❌ DATA INCONSISTENCIES DETECTED');
      colorLog('yellow', '📋 Migration recommended to fix scoring consistency');
      
      // Show specific issue types
      colorLog('white', '\nIssue breakdown:');
      const issueTypes = {};
      Object.values(analysis).forEach(data => {
        data.issues.forEach(issue => {
          issue.issues.forEach(issueText => {
            issueTypes[issueText] = (issueTypes[issueText] || 0) + 1;
          });
        });
      });
      
      Object.entries(issueTypes).forEach(([issue, count]) => {
        colorLog('yellow', `   - ${issue}: ${count} occurrences`);
      });
      
    } else {
      colorLog('green', '✅ NO ISSUES DETECTED');
      colorLog('green', '📋 Data appears consistent - API fixes only needed');
    }
    
    return {
      summary,
      analysis,
      recommendation: totalIssues > 0 
        ? 'Data migration required to fix scoring inconsistencies'
        : 'No issues found - API fixes only needed'
    };
    
  } catch (error) {
    colorLog('red', `❌ Error analyzing data: ${error.message}`);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

function checkForIssues(result) {
  const issues = [];
  const { subType, score, totalPoints } = result;
  
  // Basic validation
  if (typeof score !== 'number') issues.push('Invalid score type');
  if (typeof totalPoints !== 'number') issues.push('Invalid totalPoints type');
  if (score < 0) issues.push('Negative score');
  if (totalPoints <= 0) issues.push('Invalid totalPoints');
  
  // Skip further checks if basic validation failed
  if (issues.length > 0) return issues;
  
  // Check for impossible percentages (over 100%)
  if (score > totalPoints) {
    issues.push('Score exceeds totalPoints');
  }
  
  // Check for percentage over 100%
  const percentage = (score / totalPoints) * 100;
  if (percentage > 100) {
    issues.push(`Percentage over 100% (${percentage.toFixed(1)}%)`);
  }
  
  // SubType-specific checks
  switch (subType) {
    case 'fair-value-gaps':
      // FVG 120% bug: score > 1 with totalPoints = 1
      if (totalPoints === 1 && score > 1) {
        issues.push('FVG 120% bug detected');
      }
      // Another FVG inconsistency pattern
      if (totalPoints < score && score > 0) {
        issues.push('FVG totalPoints inconsistency');
      }
      break;
      
    case 'fibonacci-retracement':
      // Fibonacci should always have totalPoints = 2
      if (totalPoints !== 2) {
        issues.push(`Fibonacci totalPoints should be 2, got ${totalPoints}`);
      }
      // Fibonacci allows partial credit (0.5 increments)
      if (score % 0.5 !== 0) {
        issues.push('Fibonacci score not in 0.5 increments');
      }
      break;
      
    case 'swing-analysis':
      // Check for exactly 10 (suggests hardcoded value from results page)
      if (totalPoints === 10) {
        issues.push('Potentially hardcoded totalPoints=10');
      }
      // Reasonable bounds check
      if (totalPoints > 20 || totalPoints < 2) {
        issues.push(`Unusual totalPoints: ${totalPoints}`);
      }
      break;
  }
  
  return issues;
}

// CLI interface
if (require.main === module) {
  analyzeChartExamData()
    .then((result) => {
      colorLog('green', '\n✅ Analysis complete');
      if (result.summary.totalIssues > 0) {
        colorLog('yellow', '📋 Next step: Run data migration to fix issues');
      } else {
        colorLog('green', '📋 Next step: Apply API fixes only');
      }
      process.exit(0);
    })
    .catch((error) => {
      colorLog('red', '❌ Analysis failed');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { analyzeChartExamData };
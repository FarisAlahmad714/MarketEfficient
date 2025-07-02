// scripts/analyze-chart-exam-data.js
// READ-ONLY ANALYSIS - No data changes made
// Run this FIRST to understand current data state

const connectDB = require('../lib/database');
const TestResults = require('../models/TestResults');

async function analyzeChartExamData() {
  console.log('🔍 ANALYZING CHART EXAM DATA (READ-ONLY)...\n');
  
  try {
    await connectDB();
    
    // Get all chart exam results
    const chartExamResults = await TestResults.find({
      testType: 'chart-exam'
    }).sort({ completedAt: -1 });
    
    console.log(`📊 Total chart exam results found: ${chartExamResults.length}\n`);
    
    if (chartExamResults.length === 0) {
      console.log('✅ No chart exam data found - nothing to migrate');
      return;
    }
    
    // Analyze by subType
    const analysis = {
      'swing-analysis': { total: 0, issues: [] },
      'fibonacci-retracement': { total: 0, issues: [] },
      'fair-value-gaps': { total: 0, issues: [] }
    };
    
    let totalIssues = 0;
    
    for (const result of chartExamResults) {
      const subType = result.subType;
      if (!analysis[subType]) continue;
      
      analysis[subType].total++;
      
      // Check for potential issues
      const issues = checkForIssues(result);
      if (issues.length > 0) {
        analysis[subType].issues.push({
          id: result._id,
          userId: result.userId,
          score: result.score,
          totalPoints: result.totalPoints,
          completedAt: result.completedAt,
          issues: issues
        });
        totalIssues++;
      }
    }
    
    // Print detailed analysis
    console.log('📈 ANALYSIS BY TEST TYPE:\n');
    
    for (const [subType, data] of Object.entries(analysis)) {
      console.log(`🎯 ${subType.toUpperCase()}:`);
      console.log(`   Total: ${data.total}`);
      console.log(`   Issues: ${data.issues.length}`);
      
      if (data.issues.length > 0) {
        console.log(`   Sample issues:`);
        data.issues.slice(0, 3).forEach((issue, i) => {
          console.log(`     ${i + 1}. Score: ${issue.score}/${issue.totalPoints} = ${((issue.score / issue.totalPoints) * 100).toFixed(1)}%`);
          console.log(`        Issues: ${issue.issues.join(', ')}`);
        });
      }
      console.log('');
    }
    
    console.log(`🚨 SUMMARY:`);
    console.log(`   Total issues found: ${totalIssues}`);
    console.log(`   Total records: ${chartExamResults.length}`);
    console.log(`   Issue rate: ${((totalIssues / chartExamResults.length) * 100).toFixed(1)}%\n`);
    
    if (totalIssues > 0) {
      console.log('❌ DATA INCONSISTENCIES DETECTED');
      console.log('📋 Migration needed to fix scoring consistency');
    } else {
      console.log('✅ NO ISSUES DETECTED');
      console.log('📋 Data appears consistent - API fixes only needed');
    }
    
    return {
      totalRecords: chartExamResults.length,
      totalIssues: totalIssues,
      analysis: analysis
    };
    
  } catch (error) {
    console.error('❌ Error analyzing data:', error);
    throw error;
  }
}

function checkForIssues(result) {
  const issues = [];
  const { subType, score, totalPoints } = result;
  
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
      // FVG should never have totalPoints = 1 unless truly no gaps
      // But score > 1 with totalPoints = 1 indicates the 120% bug
      if (totalPoints === 1 && score > 1) {
        issues.push('FVG 120% bug - score > totalPoints=1');
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
      // Swing analysis should have reasonable totalPoints (not exactly 10)
      if (totalPoints === 10) {
        issues.push('Swing analysis may be using hardcoded totalPoints=10');
      }
      // Score should not exceed reasonable swing point count
      if (totalPoints > 20) {
        issues.push(`Unusually high totalPoints for swing analysis: ${totalPoints}`);
      }
      break;
  }
  
  return issues;
}

// Allow running directly with node
if (require.main === module) {
  analyzeChartExamData()
    .then((result) => {
      console.log('✅ Analysis complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = analyzeChartExamData;
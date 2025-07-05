// pages/api/admin/analyze-data.js
// SAFE READ-ONLY ANALYSIS API endpoint

import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    
    // Get all chart exam results
    const chartExamResults = await TestResults.find({
      testType: 'chart-exam'
    }).sort({ completedAt: -1 });
    
    
    if (chartExamResults.length === 0) {
      return res.json({
        message: 'No chart exam data found',
        totalRecords: 0,
        totalIssues: 0,
        analysis: {}
      });
    }
    
    // Analyze by subType
    const analysis = {
      'swing-analysis': { total: 0, issues: [], samples: [] },
      'fibonacci-retracement': { total: 0, issues: [], samples: [] },
      'fair-value-gaps': { total: 0, issues: [], samples: [] }
    };
    
    let totalIssues = 0;
    
    for (const result of chartExamResults) {
      const subType = result.subType;
      if (!analysis[subType]) continue;
      
      analysis[subType].total++;
      
      // Store sample for analysis
      const sample = {
        id: result._id.toString(),
        userId: result.userId?.toString() || 'unknown',
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: ((result.score / result.totalPoints) * 100).toFixed(1),
        completedAt: result.completedAt,
        issues: []
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
    
    const summary = {
      totalRecords: chartExamResults.length,
      totalIssues: totalIssues,
      issueRate: ((totalIssues / chartExamResults.length) * 100).toFixed(1),
      needsMigration: totalIssues > 0
    };
    
    
    return res.json({
      summary,
      analysis,
      recommendation: totalIssues > 0 
        ? 'Data migration required to fix scoring inconsistencies'
        : 'No issues found - API fixes only needed'
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
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
        issues.push('FVG 120% bug detected');
      }
      if (totalPoints < score && score > 0) {
        issues.push('FVG totalPoints inconsistency');
      }
      break;
      
    case 'fibonacci-retracement':
      // Fibonacci should always have totalPoints = 2
      if (totalPoints !== 2) {
        issues.push(`Fibonacci totalPoints should be 2, got ${totalPoints}`);
      }
      break;
      
    case 'swing-analysis':
      // Check for exactly 10 (suggests hardcoded value)
      if (totalPoints === 10) {
        issues.push('Potentially hardcoded totalPoints=10');
      }
      if (totalPoints > 20 || totalPoints < 2) {
        issues.push(`Unusual totalPoints: ${totalPoints}`);
      }
      break;
  }
  
  return issues;
}
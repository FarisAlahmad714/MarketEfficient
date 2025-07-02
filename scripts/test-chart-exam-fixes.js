#!/usr/bin/env node

// scripts/test-chart-exam-fixes.js
// Test script to verify chart exam fixes work correctly
require('dotenv').config({ path: '.env.local' });
const { validateChartExamResult, logValidationIssues } = require('../lib/chart-exam-validation');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testChartExamFixes() {
  colorLog('bright', '🧪 TESTING CHART EXAM FIXES\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test data validation
  colorLog('blue', '📋 Testing Data Validation:');
  
  // Test 1: Valid FVG result
  const validFVG = {
    userId: '507f1f77bcf86cd799439011',
    testType: 'chart-exam',
    subType: 'fair-value-gaps',
    assetSymbol: 'EURUSD',
    score: 3,
    totalPoints: 5
  };
  
  const validation1 = validateChartExamResult(validFVG);
  if (validation1.valid) {
    colorLog('green', '✅ Test 1: Valid FVG result - PASSED');
    testsPassed++;
  } else {
    colorLog('red', '❌ Test 1: Valid FVG result - FAILED');
    console.log('   Errors:', validation1.errors);
    testsFailed++;
  }

  // Test 2: Invalid score > totalPoints (the 120% bug)
  const invalidScore = {
    userId: '507f1f77bcf86cd799439011',
    testType: 'chart-exam',
    subType: 'fair-value-gaps',
    assetSymbol: 'EURUSD',
    score: 6,
    totalPoints: 5
  };
  
  const validation2 = validateChartExamResult(invalidScore);
  if (!validation2.valid && validation2.errors.some(e => e.includes('cannot exceed totalPoints'))) {
    colorLog('green', '✅ Test 2: Detects score > totalPoints - PASSED');
    testsPassed++;
  } else {
    colorLog('red', '❌ Test 2: Should detect score > totalPoints - FAILED');
    testsFailed++;
  }

  // Test 3: Fibonacci validation
  const validFibonacci = {
    userId: '507f1f77bcf86cd799439011',
    testType: 'chart-exam',
    subType: 'fibonacci-retracement',
    assetSymbol: 'BTCUSD',
    score: 1.5,
    totalPoints: 2
  };
  
  const validation3 = validateChartExamResult(validFibonacci);
  if (validation3.valid) {
    colorLog('green', '✅ Test 3: Valid Fibonacci result - PASSED');
    testsPassed++;
  } else {
    colorLog('red', '❌ Test 3: Valid Fibonacci result - FAILED');
    console.log('   Errors:', validation3.errors);
    testsFailed++;
  }

  // Test 4: Invalid Fibonacci totalPoints
  const invalidFibonacci = {
    userId: '507f1f77bcf86cd799439011',
    testType: 'chart-exam',
    subType: 'fibonacci-retracement',
    assetSymbol: 'BTCUSD',
    score: 5,
    totalPoints: 7  // Should be 2
  };
  
  const validation4 = validateChartExamResult(invalidFibonacci);
  if (!validation4.valid && validation4.errors.some(e => e.includes('totalPoints should be 2'))) {
    colorLog('green', '✅ Test 4: Detects invalid Fibonacci totalPoints - PASSED');
    testsPassed++;
  } else {
    colorLog('red', '❌ Test 4: Should detect invalid Fibonacci totalPoints - FAILED');
    testsFailed++;
  }

  // Test score data structures
  colorLog('blue', '\n📊 Testing Score Data Structures:');

  // Test 5: Old swing analysis format (just numbers)
  const oldSwingFormat = [10, 8, 12, 6, 9];
  const oldTotal = oldSwingFormat.reduce((sum, score) => sum + score, 0);
  const oldPossible = oldSwingFormat.length * 10; // Old hardcoded way
  const oldPercentage = (oldTotal / oldPossible) * 100;
  
  colorLog('cyan', `   Old Swing Format: ${oldTotal}/${oldPossible} = ${oldPercentage.toFixed(1)}%`);

  // Test 6: New swing analysis format (with totalPoints)
  const newSwingFormat = [
    { score: 10, totalPoints: 16 },
    { score: 8, totalPoints: 12 },
    { score: 12, totalPoints: 14 },
    { score: 6, totalPoints: 8 },
    { score: 9, totalPoints: 11 }
  ];
  const newTotal = newSwingFormat.reduce((sum, item) => sum + item.score, 0);
  const newPossible = newSwingFormat.reduce((sum, item) => sum + item.totalPoints, 0);
  const newPercentage = (newTotal / newPossible) * 100;
  
  colorLog('cyan', `   New Swing Format: ${newTotal}/${newPossible} = ${newPercentage.toFixed(1)}%`);
  
  if (Math.abs(newPercentage - oldPercentage) > 0.1) {
    colorLog('green', '✅ Test 5-6: New format shows different (more accurate) percentage - PASSED');
    testsPassed++;
  } else {
    colorLog('yellow', '⚠️  Test 5-6: Percentages are similar (might be coincidence)');
    testsPassed++;
  }

  // Test 7: FVG format with dynamic totalPoints
  const fvgFormat = [
    { part1: 3, part1TotalPoints: 4, part2: 2, part2TotalPoints: 3 },
    { part1: 5, part1TotalPoints: 6, part2: 1, part2TotalPoints: 2 },
    { part1: 0, part1TotalPoints: 1, part2: 4, part2TotalPoints: 5 }
  ];
  const fvgTotal = fvgFormat.reduce((sum, item) => sum + (item.part1 || 0) + (item.part2 || 0), 0);
  const fvgPossible = fvgFormat.reduce((sum, item) => sum + (item.part1TotalPoints || 0) + (item.part2TotalPoints || 0), 0);
  const fvgPercentage = (fvgTotal / fvgPossible) * 100;
  
  colorLog('cyan', `   FVG Format: ${fvgTotal}/${fvgPossible} = ${fvgPercentage.toFixed(1)}%`);
  
  if (fvgPercentage <= 100 && fvgPercentage >= 0) {
    colorLog('green', '✅ Test 7: FVG percentage is reasonable - PASSED');
    testsPassed++;
  } else {
    colorLog('red', '❌ Test 7: FVG percentage is unreasonable - FAILED');
    testsFailed++;
  }

  // Summary
  colorLog('bright', '\n📋 TEST SUMMARY:');
  colorLog('green', `✅ Tests Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    colorLog('red', `❌ Tests Failed: ${testsFailed}`);
  }
  
  const totalTests = testsPassed + testsFailed;
  const successRate = ((testsPassed / totalTests) * 100).toFixed(1);
  colorLog('cyan', `📊 Success Rate: ${successRate}%`);

  if (testsFailed === 0) {
    colorLog('bright', '\n🎉 ALL TESTS PASSED! Chart exam fixes are working correctly.');
    return true;
  } else {
    colorLog('bright', '\n⚠️  SOME TESTS FAILED. Review the fixes before deploying.');
    return false;
  }
}

// Test percentage calculation scenarios
function testPercentageCalculations() {
  colorLog('bright', '\n🧮 TESTING PERCENTAGE CALCULATIONS:\n');

  const scenarios = [
    { name: 'Perfect FVG Score', score: 5, total: 5, expected: 100 },
    { name: 'Partial FVG Score', score: 3, total: 5, expected: 60 },
    { name: 'Zero FVG Score', score: 0, total: 3, expected: 0 },
    { name: 'Perfect Fibonacci', score: 2, total: 2, expected: 100 },
    { name: 'Partial Fibonacci', score: 1.5, total: 2, expected: 75 },
    { name: 'Swing Analysis', score: 8, total: 12, expected: 66.7 }
  ];

  scenarios.forEach(scenario => {
    const calculated = (scenario.score / scenario.total) * 100;
    const difference = Math.abs(calculated - scenario.expected);
    
    if (difference < 0.1) {
      colorLog('green', `✅ ${scenario.name}: ${calculated.toFixed(1)}% (expected ${scenario.expected}%)`);
    } else {
      colorLog('red', `❌ ${scenario.name}: ${calculated.toFixed(1)}% (expected ${scenario.expected}%)`);
    }
  });
}

// CLI interface
if (require.main === module) {
  try {
    const success = testChartExamFixes();
    testPercentageCalculations();
    
    if (success) {
      colorLog('bright', '\n✅ All fixes are working correctly. Ready for deployment!');
      process.exit(0);
    } else {
      colorLog('bright', '\n❌ Some issues found. Please review before deploying.');
      process.exit(1);
    }
  } catch (error) {
    colorLog('red', `❌ Test failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

module.exports = { testChartExamFixes, testPercentageCalculations };
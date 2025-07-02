// lib/chart-exam-validation.js
// Data validation utilities for chart exam results

/**
 * Validate chart exam result data before saving to database
 * @param {Object} resultData - The result data to validate
 * @returns {Object} { valid: boolean, errors: string[], sanitized: Object }
 */
function validateChartExamResult(resultData) {
  const errors = [];
  const sanitized = { ...resultData };

  // Basic required fields
  if (!resultData.userId) {
    errors.push('Missing userId');
  }

  if (!resultData.testType || resultData.testType !== 'chart-exam') {
    errors.push('Invalid testType - must be "chart-exam"');
  }

  if (!resultData.subType || !['swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'].includes(resultData.subType)) {
    errors.push('Invalid subType - must be swing-analysis, fibonacci-retracement, or fair-value-gaps');
  }

  // Score validation
  if (typeof resultData.score !== 'number' || resultData.score < 0) {
    errors.push('Invalid score - must be a non-negative number');
  }

  if (typeof resultData.totalPoints !== 'number' || resultData.totalPoints <= 0) {
    errors.push('Invalid totalPoints - must be a positive number');
  }

  // Logical validation
  if (resultData.score > resultData.totalPoints) {
    errors.push(`Score (${resultData.score}) cannot exceed totalPoints (${resultData.totalPoints})`);
  }

  // SubType-specific validation
  switch (resultData.subType) {
    case 'swing-analysis':
      if (resultData.totalPoints > 25) {
        errors.push(`Swing analysis totalPoints (${resultData.totalPoints}) seems unusually high`);
      }
      if (resultData.totalPoints < 2) {
        errors.push(`Swing analysis totalPoints (${resultData.totalPoints}) seems too low`);
      }
      break;

    case 'fibonacci-retracement':
      if (resultData.totalPoints !== 2) {
        errors.push(`Fibonacci retracement totalPoints should be 2, got ${resultData.totalPoints}`);
      }
      // Fibonacci allows partial credit in 0.5 increments
      if (resultData.score % 0.5 !== 0) {
        errors.push(`Fibonacci score should be in 0.5 increments, got ${resultData.score}`);
      }
      break;

    case 'fair-value-gaps':
      if (resultData.totalPoints > 15) {
        errors.push(`FVG totalPoints (${resultData.totalPoints}) seems unusually high`);
      }
      if (resultData.totalPoints < 0) {
        errors.push(`FVG totalPoints (${resultData.totalPoints}) cannot be negative`);
      }
      break;
  }

  // Sanitize data
  sanitized.score = Math.max(0, Math.min(resultData.score, resultData.totalPoints));
  sanitized.completedAt = sanitized.completedAt || new Date();

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Log validation warnings for monitoring
 * @param {string} subType - The exam subtype
 * @param {Object} resultData - The result data
 * @param {Array} errors - Validation errors
 */
function logValidationIssues(subType, resultData, errors) {
  if (errors.length > 0) {
    console.warn(`Chart exam validation issues for ${subType}:`, {
      errors,
      score: resultData.score,
      totalPoints: resultData.totalPoints,
      percentage: ((resultData.score / resultData.totalPoints) * 100).toFixed(1) + '%'
    });
  }
}

/**
 * Check if a percentage seems unreasonable
 * @param {number} score 
 * @param {number} totalPoints 
 * @returns {boolean}
 */
function isPercentageUnreasonable(score, totalPoints) {
  if (totalPoints <= 0) return true;
  const percentage = (score / totalPoints) * 100;
  return percentage > 100 || percentage < 0;
}

module.exports = {
  validateChartExamResult,
  logValidationIssues,
  isPercentageUnreasonable
};
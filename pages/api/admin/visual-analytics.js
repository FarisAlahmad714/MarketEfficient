// pages/api/admin/visual-analytics.js - THE GOLDMINE API
import { requireAdmin } from '../../../middleware/auth';
import TestResults from '../../../models/TestResults';
import User from '../../../models/User';
import connectDB from '../../../lib/database';
import { getAnalyticsData, getSignedUrlForImage } from '../../../lib/gcs-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        // Get query parameters for filtering
        const { 
          timeframe = 'month', 
          testType = null, 
          userId = null,
          includeImages = 'true',
          limit = 50 
        } = req.query;

        // 🔥 MONGODB PSYCHOLOGICAL DATA
        let mongoQuery = {};
        if (testType) mongoQuery.testType = testType;
        if (userId) mongoQuery.userId = userId;

        // Time filtering
        const timeFilter = getTimeFilter(timeframe);
        if (timeFilter) mongoQuery.completedAt = timeFilter;

        const testResults = await TestResults.find(mongoQuery)
          .populate('userId', 'name email')
          .sort({ completedAt: -1 })
          .limit(parseInt(limit));

        // 🔥 GCS VISUAL DATA (if images requested)
        let gcsData = null;
        if (includeImages === 'true') {
          try {
            gcsData = await getAnalyticsData(timeframe, testType);
            console.log('GCS Analytics Data:', gcsData); // Debug log
          } catch (error) {
            console.log('GCS data not available, continuing with MongoDB only. Error:', error.message);
          }
        }

        // 🔥 COMBINE THE GOLDMINE
        const combinedAnalytics = await combineMongoGCSData(testResults, gcsData);

        // 🔥 BUSINESS INTELLIGENCE METRICS
        const businessMetrics = generateBusinessMetrics(testResults, gcsData);

        // 🔥 VISUAL INSIGHTS
        const visualInsights = await generateVisualInsights(testResults, gcsData);

        res.status(200).json({
          success: true,
          data: {
            combined_analytics: combinedAnalytics,
            business_metrics: businessMetrics,
            visual_insights: visualInsights,
            data_sources: {
              mongodb_records: testResults.length,
              gcs_metadata_files: gcsData?.totalFiles || 0,
              images_available: includeImages === 'true'
            },
            query_info: {
              timeframe,
              testType,
              userId,
              limit: parseInt(limit)
            }
          }
        });

      } catch (error) {
        console.error('Visual analytics error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch visual analytics',
          details: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}

// 🔥 COMBINE MONGODB + GCS DATA
async function combineMongoGCSData(testResults, gcsData) {
  const combined = [];

  for (const testResult of testResults) {
    const entry = {
      // MongoDB psychological data
      mongodb_data: {
        test_id: testResult._id,
        user_name: testResult.userId?.name || 'Unknown',
        user_email: testResult.userId?.email,
        test_type: testResult.testType,
        asset_symbol: testResult.assetSymbol,
        score: testResult.score,
        total_points: testResult.totalPoints,
        completed_at: testResult.completedAt,
        session_id: testResult.details?.sessionId,
        questions_data: testResult.details?.testDetails || []
      },
      
      // GCS image metadata (if available)
      gcs_images: [],
      
      // Combined insights
      psychological_insights: {
        confidence_avg: calculateAverageConfidence(testResult.details?.testDetails),
        time_spent_total: calculateTotalTimeSpent(testResult.details?.testDetails),
        accuracy_rate: (testResult.score / testResult.totalPoints) * 100,
        reasoning_quality: analyzeReasoningQuality(testResult.details?.testDetails)
      }
    };

    // Match GCS images to this test session
    if (gcsData && testResult.details?.sessionId) {
      const sessionImages = gcsData.metadataFiles.filter(metadata => 
        metadata.session_reference === testResult.details.sessionId ||
        metadata.image_analytics?.session_reference === testResult.details.sessionId
      );
      
      for (const imageMetadata of sessionImages) {
        try {
          const signedUrl = await getSignedUrlForImage(imageMetadata.storage_details?.gcs_path || imageMetadata.imagePath);
          entry.gcs_images.push({
            ...imageMetadata,
            signed_url: signedUrl,
            viewable_until: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
          });
        } catch (error) {
          console.log('Could not generate signed URL for image:', error.message);
        }
      }
    }

    combined.push(entry);
  }

  return combined;
}

// 🔥 BUSINESS METRICS
function generateBusinessMetrics(testResults, gcsData) {
  const metrics = {
    overview: {
      total_tests_completed: testResults.length,
      total_images_uploaded: gcsData?.totalFiles || 0,
      average_score: testResults.length > 0 
        ? testResults.reduce((sum, t) => sum + (t.score / t.totalPoints), 0) / testResults.length * 100 
        : 0,
      data_richness_score: calculateDataRichnessScore(testResults, gcsData)
    },
    
    engagement: {
      tests_by_type: {},
      images_by_type: gcsData?.testTypes || {},
      average_questions_per_test: calculateAvgQuestionsPerTest(testResults),
      completion_rate: calculateCompletionRate(testResults)
    },
    
    monetization: {
      premium_data_points: testResults.length + (gcsData?.totalFiles || 0),
      psychological_insights_count: countPsychologicalInsights(testResults),
      visual_data_value: gcsData?.totalFiles || 0,
      
      // ENHANCED PRICING MODEL - Based on Data Quality & Research Value
      estimated_research_value: calculateResearchValue(testResults, gcsData),
      pricing_breakdown: {
        base_test_value: testResults.length * 12, // $12 per psychological test (industry baseline)
        detailed_reasoning_bonus: countDetailedReasoning(testResults) * 8, // $8 bonus for detailed analysis
        confidence_data_value: countConfidenceData(testResults) * 5, // $5 for confidence calibration data
        visual_chart_value: (gcsData?.totalFiles || 0) * 18, // $18 per chart image with metadata
        temporal_data_bonus: (gcsData?.totalFiles || 0) * 7, // $7 for temporal/behavioral metadata
        premium_multiplier: calculatePremiumMultiplier(testResults, gcsData)
      },
      market_comparisons: {
        academic_research_rate: '$20-40 per quality data point',
        fintech_training_data: '$15-30 per labeled example', 
        behavioral_finance_premium: '2-3x standard pricing',
        our_competitive_advantage: 'Unique psychology + visual data combination'
      }
    }
  };

  // Count tests by type
  testResults.forEach(test => {
    metrics.engagement.tests_by_type[test.testType] = 
      (metrics.engagement.tests_by_type[test.testType] || 0) + 1;
  });

  return metrics;
}

// 🔥 VISUAL INSIGHTS
async function generateVisualInsights(testResults, gcsData) {
  return {
    test_patterns: {
      most_challenging_assets: findMostChallengingAssets(testResults),
      highest_confidence_scenarios: findHighConfidenceScenarios(testResults),
      common_mistake_patterns: findCommonMistakes(testResults)
    },
    
    upload_patterns: {
      peak_activity_hours: gcsData ? analyzePeakHours(gcsData.metadataFiles) : null,
      upload_frequency: gcsData ? analyzeUploadFrequency(gcsData.metadataFiles) : null,
      image_quality_metrics: gcsData ? analyzeImageQuality(gcsData.metadataFiles) : null
    },
    
    user_behavior: {
      session_completion_patterns: analyzeSessionPatterns(testResults),
      reasoning_complexity: analyzeReasoningComplexity(testResults),
      confidence_accuracy_correlation: analyzeConfidenceAccuracy(testResults)
    }
  };
}

// 🔥 HELPER FUNCTIONS
function getTimeFilter(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case 'today':
      return { $gte: new Date(now.setHours(0, 0, 0, 0)) };
    case 'week':
      return { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    case 'month':
      return { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    case 'year':
      return { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
    default:
      return null;
  }
}

function calculateAverageConfidence(testDetails) {
  if (!testDetails || testDetails.length === 0) return 0;
  const confidenceLevels = testDetails.filter(td => td.confidenceLevel).map(td => td.confidenceLevel);
  return confidenceLevels.length > 0 
    ? confidenceLevels.reduce((sum, conf) => sum + conf, 0) / confidenceLevels.length 
    : 0;
}

function calculateTotalTimeSpent(testDetails) {
  if (!testDetails || testDetails.length === 0) return 0;
  return testDetails.reduce((total, td) => total + (td.timeSpent || 0), 0);
}

function analyzeReasoningQuality(testDetails) {
  if (!testDetails || testDetails.length === 0) return 'no_data';
  const reasoningLengths = testDetails.filter(td => td.reasoning).map(td => td.reasoning.length);
  const avgLength = reasoningLengths.reduce((sum, len) => sum + len, 0) / reasoningLengths.length;
  
  if (avgLength > 200) return 'detailed';
  if (avgLength > 100) return 'moderate';
  if (avgLength > 50) return 'basic';
  return 'minimal';
}

function calculateDataRichnessScore(testResults, gcsData) {
  let score = 0;
  
  // Base scoring
  score += testResults.length * 12; // 12 points per test (increased)
  score += (gcsData?.totalFiles || 0) * 18; // 18 points per image (increased)
  
  // Quality bonuses - more sophisticated scoring
  testResults.forEach(test => {
    if (test.details?.testDetails) {
      score += test.details.testDetails.length * 3; // 3 points per question
      test.details.testDetails.forEach(detail => {
        // Detailed reasoning bonus (tiered)
        if (detail.reasoning) {
          if (detail.reasoning.length > 200) score += 8; // Premium detailed reasoning
          else if (detail.reasoning.length > 100) score += 5; // Good reasoning
          else if (detail.reasoning.length > 50) score += 2; // Basic reasoning
        }
        
        // Confidence data bonus (tiered)
        if (detail.confidenceLevel) {
          score += 4; // Base confidence data
          if (detail.confidenceLevel >= 8 || detail.confidenceLevel <= 3) {
            score += 2; // Extreme confidence levels are more valuable
          }
        }
        
        // Time spent data
        if (detail.timeSpent && detail.timeSpent > 10) score += 3; // Thoughtful responses
        
        // Correctness tracking
        if (detail.isCorrect !== undefined) score += 2;
      });
    }
  });
  
  // Combined data synergy bonus
  if (testResults.length > 0 && gcsData?.totalFiles > 0) {
    const synergyBonus = Math.min(testResults.length, gcsData.totalFiles) * 5;
    score += synergyBonus;
  }
  
  // Scale bonuses
  if (score > 800) score += 50; // Premium dataset bonus
  if (score > 500) score += 25; // Substantial dataset bonus
  
  return Math.min(score, 1000); // Cap at 1000
}

function calculateAvgQuestionsPerTest(testResults) {
  if (testResults.length === 0) return 0;
  const totalQuestions = testResults.reduce((sum, test) => 
    sum + (test.details?.testDetails?.length || 0), 0);
  return totalQuestions / testResults.length;
}

function calculateCompletionRate(testResults) {
  if (testResults.length === 0) return 100;
  const completedTests = testResults.filter(test => test.status === 'completed').length;
  return (completedTests / testResults.length) * 100;
}

function countPsychologicalInsights(testResults) {
  return testResults.reduce((count, test) => {
    if (!test.details?.testDetails) return count;
    return count + test.details.testDetails.filter(detail => 
      detail.reasoning || detail.confidenceLevel || detail.timeSpent
    ).length;
  }, 0);
}

// ENHANCED PRICING CALCULATION FUNCTIONS
function calculateResearchValue(testResults, gcsData) {
  let totalValue = 0;
  
  // Base psychological test value
  totalValue += testResults.length * 12;
  
  // Quality bonuses
  totalValue += countDetailedReasoning(testResults) * 8;
  totalValue += countConfidenceData(testResults) * 5;
  
  // Visual data value
  totalValue += (gcsData?.totalFiles || 0) * 18;
  totalValue += (gcsData?.totalFiles || 0) * 7; // temporal metadata bonus
  
  // Premium multiplier for combined psychology + visual data
  const multiplier = calculatePremiumMultiplier(testResults, gcsData);
  totalValue *= multiplier;
  
  return Math.round(totalValue);
}

function countDetailedReasoning(testResults) {
  return testResults.reduce((count, test) => {
    if (!test.details?.testDetails) return count;
    return count + test.details.testDetails.filter(detail => 
      detail.reasoning && detail.reasoning.length > 150 // Detailed reasoning threshold
    ).length;
  }, 0);
}

function countConfidenceData(testResults) {
  return testResults.reduce((count, test) => {
    if (!test.details?.testDetails) return count;
    return count + test.details.testDetails.filter(detail => 
      detail.confidenceLevel && detail.confidenceLevel > 0
    ).length;
  }, 0);
}

function calculatePremiumMultiplier(testResults, gcsData) {
  let multiplier = 1.0;
  
  // Combined data bonus (psychology + visual)
  if (testResults.length > 0 && gcsData?.totalFiles > 0) {
    multiplier += 0.3; // 30% bonus for combined dataset
  }
  
  // High-quality data bonus
  const avgDetailedReasoning = countDetailedReasoning(testResults) / Math.max(testResults.length, 1);
  if (avgDetailedReasoning > 0.7) {
    multiplier += 0.2; // 20% bonus for high-quality reasoning
  }
  
  // Scale bonus for large datasets
  const totalDataPoints = testResults.length + (gcsData?.totalFiles || 0);
  if (totalDataPoints > 500) {
    multiplier += 0.15; // 15% bonus for substantial dataset
  } else if (totalDataPoints > 100) {
    multiplier += 0.1; // 10% bonus for moderate dataset
  }
  
  return Math.min(multiplier, 2.0); // Cap at 2x multiplier
}

function findMostChallengingAssets(testResults) {
  const assetScores = {};
  testResults.forEach(test => {
    if (!assetScores[test.assetSymbol]) {
      assetScores[test.assetSymbol] = { total: 0, count: 0 };
    }
    assetScores[test.assetSymbol].total += (test.score / test.totalPoints);
    assetScores[test.assetSymbol].count += 1;
  });
  
  return Object.entries(assetScores)
    .map(([asset, data]) => ({ 
      asset, 
      avg_score: data.total / data.count,
      test_count: data.count 
    }))
    .sort((a, b) => a.avg_score - b.avg_score)
    .slice(0, 5);
}

function findHighConfidenceScenarios(testResults) {
  const scenarios = [];
  testResults.forEach(test => {
    if (test.details?.testDetails) {
      test.details.testDetails.forEach(detail => {
        if (detail.confidenceLevel && detail.confidenceLevel >= 8) {
          scenarios.push({
            asset: test.assetSymbol,
            confidence: detail.confidenceLevel,
            correct: detail.isCorrect,
            reasoning: detail.reasoning?.substring(0, 100) + '...'
          });
        }
      });
    }
  });
  return scenarios.slice(0, 10);
}

function findCommonMistakes(testResults) {
  const mistakes = {};
  testResults.forEach(test => {
    if (test.details?.testDetails) {
      test.details.testDetails.forEach(detail => {
        if (!detail.isCorrect && detail.prediction && detail.correctAnswer) {
          const mistakeKey = `${detail.prediction}_vs_${detail.correctAnswer}`;
          mistakes[mistakeKey] = (mistakes[mistakeKey] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(mistakes)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzePeakHours(metadataFiles) {
  const hourCounts = {};
  metadataFiles.forEach(file => {
    const hour = file.temporal_analytics?.upload_hour || 
                 file.timing_data?.upload_hour ||
                 new Date(file.upload_timestamp || file.uploadedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), uploads: count }))
    .sort((a, b) => b.uploads - a.uploads);
}

function analyzeUploadFrequency(metadataFiles) {
  const dailyCounts = {};
  metadataFiles.forEach(file => {
    const date = new Date(file.upload_timestamp || file.uploadedAt).toDateString();
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });
  
  return Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, uploads: count }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function analyzeImageQuality(metadataFiles) {
  const totalSize = metadataFiles.reduce((sum, file) => 
    sum + (file.storage_details?.file_size_bytes || file.fileSize || 0), 0);
  const avgSize = totalSize / metadataFiles.length;
  
  return {
    total_images: metadataFiles.length,
    average_file_size_mb: (avgSize / (1024 * 1024)).toFixed(2),
    total_storage_mb: (totalSize / (1024 * 1024)).toFixed(2)
  };
}

function analyzeSessionPatterns(testResults) {
  const patterns = {
    complete_sessions: 0,
    partial_sessions: 0,
    average_questions_completed: 0
  };
  
  testResults.forEach(test => {
    if (test.status === 'completed') {
      patterns.complete_sessions++;
    } else {
      patterns.partial_sessions++;
    }
  });
  
  return patterns;
}

function analyzeReasoningComplexity(testResults) {
  const complexityLevels = { basic: 0, moderate: 0, detailed: 0 };
  
  testResults.forEach(test => {
    if (test.details?.testDetails) {
      test.details.testDetails.forEach(detail => {
        if (detail.reasoning) {
          const length = detail.reasoning.length;
          if (length > 200) complexityLevels.detailed++;
          else if (length > 100) complexityLevels.moderate++;
          else complexityLevels.basic++;
        }
      });
    }
  });
  
  return complexityLevels;
}

function analyzeConfidenceAccuracy(testResults) {
  const data = [];
  
  testResults.forEach(test => {
    if (test.details?.testDetails) {
      test.details.testDetails.forEach(detail => {
        if (detail.confidenceLevel && detail.isCorrect !== undefined) {
          data.push({
            confidence: detail.confidenceLevel,
            correct: detail.isCorrect
          });
        }
      });
    }
  });
  
  return data;
}
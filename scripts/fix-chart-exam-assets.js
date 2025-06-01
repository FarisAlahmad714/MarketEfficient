// scripts/fix-chart-exam-assets.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const TestResults = require('../models/TestResults');
const logger = require('../lib/logger'); // Adjust path to your logger utility
async function fixChartExamAssets() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Update all chart exam entries
  const result = await TestResults.updateMany(
    { 
      testType: 'chart-exam',
      assetSymbol: { $in: ['UNKNOWN', null, undefined] }
    },
    { 
      $set: { assetSymbol: 'MULTIASSET' }
    }
  );
  
  logger.log(`✅ Updated ${result.modifiedCount} chart exam records to MULTIASSET`);
  
  // Show current stats
  const stats = await TestResults.aggregate([
    { $match: { testType: 'chart-exam' } },
    { $group: { 
      _id: { 
        subType: '$subType', 
        assetSymbol: '$assetSymbol' 
      }, 
      count: { $sum: 1 } 
    }},
    { $sort: { '_id.subType': 1 } }
  ]);
  
  logger.log('\n📊 Current Chart Exam Stats:');
  stats.forEach(stat => {
    logger.log(`  ${stat._id.subType} - ${stat._id.assetSymbol}: ${stat.count} tests`);
  });
  
  await mongoose.disconnect();
}

fixChartExamAssets();
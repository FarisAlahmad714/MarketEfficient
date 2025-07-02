#!/usr/bin/env node
// scripts/fix-badges.js
// Script to fix badge notifications and retroactively award badges

const mongoose = require('mongoose');
const path = require('path');

// Set up paths
process.chdir(path.join(__dirname, '..'));

// Import models and services
const connectDB = require('../lib/database');
const User = require('../models/User');
const TestResults = require('../models/TestResults');

// Import badge service - handle both ES modules and CommonJS
let checkAndNotifyNewBadges;

async function loadBadgeService() {
  try {
    // Try dynamic import for ES modules
    const badgeService = await import('../lib/badge-service.js');
    checkAndNotifyNewBadges = badgeService.checkAndNotifyNewBadges;
  } catch (error) {
    // Fallback to require for CommonJS
    try {
      const badgeService = require('../lib/badge-service');
      checkAndNotifyNewBadges = badgeService.checkAndNotifyNewBadges;
    } catch (err) {
      console.error('Could not load badge service:', err);
      process.exit(1);
    }
  }
}

async function fixBadgeSystem() {
  console.log('🔧 Starting Badge System Fix...\n');

  try {
    // Connect to database
    console.log('📦 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Load badge service
    console.log('🎖️  Loading badge service...');
    await loadBadgeService();
    console.log('✅ Badge service loaded\n');

    // Step 1: Find users with notification issues
    console.log('🔍 Finding users with notification issues...');
    const usersWithIssues = await User.find({
      $or: [
        { 'notifications.email': { $ne: true } },
        { 'notifications.badges': { $ne: true } },
        { 'notifications.email': { $exists: false } },
        { 'notifications.badges': { $exists: false } }
      ]
    }).select('username email notifications earnedBadges');

    console.log(`📊 Found ${usersWithIssues.length} users with notification issues\n`);

    const results = {
      usersFixed: 0,
      badgesAwarded: 0,
      errors: []
    };

    // Step 2: Fix notification settings for problematic users
    if (usersWithIssues.length > 0) {
      console.log('🔨 Fixing notification settings...');
      
      for (const user of usersWithIssues) {
        try {
          await User.findByIdAndUpdate(
            user._id,
            {
              $set: {
                'notifications.email': true,
                'notifications.badges': true,
                'notifications.metrics': true,
                'notifications.reminders': true
              }
            }
          );
          
          results.usersFixed++;
          console.log(`✅ Fixed: ${user.username || user.email}`);
        } catch (error) {
          console.log(`❌ Error fixing: ${user.username || user.email} - ${error.message}`);
          results.errors.push({
            user: user.username || user.email,
            error: error.message
          });
        }
      }
      console.log(`\n🎯 Fixed notifications for ${results.usersFixed} users\n`);
    }

    // Step 3: Run badge check for ALL users to award missing badges
    console.log('🏆 Checking badges for all users...');
    const allUsers = await User.find({}).select('_id username email earnedBadges');
    console.log(`👥 Processing ${allUsers.length} total users...\n`);

    let processedCount = 0;
    for (const user of allUsers) {
      try {
        const beforeBadges = user.earnedBadges ? user.earnedBadges.length : 0;
        
        const badgeResult = await checkAndNotifyNewBadges(user._id);
        
        if (badgeResult.success && badgeResult.newBadges > 0) {
          results.badgesAwarded += badgeResult.newBadges;
          console.log(`🎖️  ${user.username || user.email}: +${badgeResult.newBadges} badges (${badgeResult.badges?.map(b => b.title).join(', ')})`);
        }
        
        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`   📈 Processed ${processedCount}/${allUsers.length} users...`);
        }
      } catch (error) {
        console.log(`❌ Badge error for ${user.username || user.email}: ${error.message}`);
        results.errors.push({
          user: user.username || user.email,
          error: error.message
        });
      }
    }

    // Step 4: Summary
    console.log('\n🎉 Badge Fix Complete!\n');
    console.log('📋 SUMMARY:');
    console.log(`   👥 Users processed: ${allUsers.length}`);
    console.log(`   🔧 Users with notification fixes: ${results.usersFixed}`);
    console.log(`   🏆 Total badges awarded: ${results.badgesAwarded}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      results.errors.forEach(error => {
        console.log(`   - ${error.user}: ${error.error}`);
      });
    }

    console.log('\n✅ All done! Users will now receive badges properly.\n');

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  fixBadgeSystem().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixBadgeSystem };
// scripts/cleanup-old-posts.js
// Script to clean up old shared content posts and ensure proper userId fields

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.local' });

// Import models
const SharedContent = require('../models/SharedContent');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Notification = require('../models/Notification');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanupOldPosts() {
  try {
    console.log('🧹 Starting cleanup of old shared content posts...');
    
    // Define the cutoff date: July 3, 2025, 08:06 AM
    const cutoffDate = new Date('2025-07-03T08:06:00.000Z');
    console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);
    
    // Find all posts before the cutoff date
    const oldPosts = await SharedContent.find({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`📊 Found ${oldPosts.length} posts before cutoff date`);
    
    if (oldPosts.length === 0) {
      console.log('✅ No old posts to clean up');
      return;
    }
    
    // Extract shareIds for cleanup
    const shareIds = oldPosts.map(post => post.shareId);
    
    console.log('🗑️ Deleting related data...');
    
    // Delete related comments
    const deletedComments = await Comment.deleteMany({
      shareId: { $in: shareIds }
    });
    console.log(`   Comments deleted: ${deletedComments.deletedCount}`);
    
    // Delete related likes
    const deletedLikes = await Like.deleteMany({
      targetId: { $in: shareIds },
      targetType: 'shared_content'
    });
    console.log(`   Likes deleted: ${deletedLikes.deletedCount}`);
    
    // Delete related notifications
    const deletedNotifications = await Notification.deleteMany({
      'metadata.shareId': { $in: shareIds }
    });
    console.log(`   Notifications deleted: ${deletedNotifications.deletedCount}`);
    
    // Delete the old posts themselves
    const deletedPosts = await SharedContent.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    console.log(`   Posts deleted: ${deletedPosts.deletedCount}`);
    
    console.log('✅ Cleanup completed successfully!');
    
    // Show remaining posts count
    const remainingPosts = await SharedContent.countDocuments();
    console.log(`📊 Remaining posts: ${remainingPosts}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function fixMissingUserIds() {
  try {
    console.log('🔧 Fixing posts with missing userId fields...');
    
    // Find posts without userId but with username
    const postsWithoutUserId = await SharedContent.find({
      userId: { $exists: false },
      username: { $exists: true, $ne: null }
    });
    
    console.log(`📊 Found ${postsWithoutUserId.length} posts without userId`);
    
    let fixed = 0;
    let notFound = 0;
    
    for (const post of postsWithoutUserId) {
      try {
        // Find user by username
        const user = await User.findOne({ username: post.username }).select('_id');
        
        if (user) {
          // Update the post with userId
          await SharedContent.updateOne(
            { _id: post._id },
            { $set: { userId: user._id } }
          );
          fixed++;
          console.log(`   Fixed: ${post.username} -> ${user._id}`);
        } else {
          notFound++;
          console.log(`   ⚠️ User not found: ${post.username}`);
        }
      } catch (error) {
        console.error(`   ❌ Error fixing post ${post._id}:`, error);
      }
    }
    
    console.log(`✅ Fixed ${fixed} posts, ${notFound} users not found`);
    
  } catch (error) {
    console.error('❌ Error fixing missing userIds:', error);
  }
}

async function main() {
  await connectDB();
  
  console.log('🚀 Choose an option:');
  console.log('1. Delete all posts before July 3, 2025, 08:06 AM');
  console.log('2. Fix missing userId fields (keep posts but add userId)');
  console.log('3. Both: Fix userId fields then delete old posts');
  
  // For this script, we'll do option 1 (delete old posts)
  // You can modify this based on your preference
  
  const option = process.argv[2] || '1';
  
  switch (option) {
    case '1':
      await cleanupOldPosts();
      break;
    case '2':
      await fixMissingUserIds();
      break;
    case '3':
      await fixMissingUserIds();
      await cleanupOldPosts();
      break;
    default:
      console.log('❌ Invalid option. Use: node cleanup-old-posts.js [1|2|3]');
  }
  
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanupOldPosts, fixMissingUserIds };
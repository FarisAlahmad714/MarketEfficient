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
  } catch (error) {
    process.exit(1);
  }
}

async function cleanupOldPosts() {
  try {
    
    // Define the cutoff date: July 3, 2025, 08:06 AM
    const cutoffDate = new Date('2025-07-03T08:06:00.000Z');
    
    // Find all posts before the cutoff date
    const oldPosts = await SharedContent.find({
      createdAt: { $lt: cutoffDate }
    });
    
    
    if (oldPosts.length === 0) {
      return;
    }
    
    // Extract shareIds for cleanup
    const shareIds = oldPosts.map(post => post.shareId);
    
    
    // Delete related comments
    const deletedComments = await Comment.deleteMany({
      shareId: { $in: shareIds }
    });
    
    // Delete related likes
    const deletedLikes = await Like.deleteMany({
      targetId: { $in: shareIds },
      targetType: 'shared_content'
    });
    
    // Delete related notifications
    const deletedNotifications = await Notification.deleteMany({
      'metadata.shareId': { $in: shareIds }
    });
    
    // Delete the old posts themselves
    const deletedPosts = await SharedContent.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    
    // Show remaining posts count
    const remainingPosts = await SharedContent.countDocuments();
    
  } catch (error) {
  }
}

async function fixMissingUserIds() {
  try {
    
    // Find posts without userId but with username
    const postsWithoutUserId = await SharedContent.find({
      userId: { $exists: false },
      username: { $exists: true, $ne: null }
    });
    
    
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
        } else {
          notFound++;
        }
      } catch (error) {
      }
    }
    
    
  } catch (error) {
  }
}

async function main() {
  await connectDB();
  
  
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
  }
  
  await mongoose.disconnect();
}

// Run the script
if (require.main === module) {
}

module.exports = { cleanupOldPosts, fixMissingUserIds };
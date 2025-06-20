// scripts/update-user-privacy.js
// Script to update all users to have public profiles and share results

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.local' });

const User = require('../models/User');

async function updateUserPrivacy() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all users to have public profiles and share results
    const result = await User.updateMany(
      {}, // Update all users
      {
        $set: {
          profileVisibility: 'public',
          shareResults: true
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log('All users now have public profiles and share results');

    // Show some examples
    const sampleUsers = await User.find({})
      .select('username profileVisibility shareResults')
      .limit(5);
    
    console.log('Sample users:');
    sampleUsers.forEach(user => {
      console.log(`- ${user.username}: profileVisibility=${user.profileVisibility}, shareResults=${user.shareResults}`);
    });

  } catch (error) {
    console.error('Error updating user privacy:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateUserPrivacy();
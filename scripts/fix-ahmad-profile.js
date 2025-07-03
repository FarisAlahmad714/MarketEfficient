const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  bio: String,
  profileVisibility: String,
  shareResults: Boolean
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fixAhmadProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'ahmadalkhdairi@yahoo.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Current user state:', {
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profileVisibility: user.profileVisibility,
      shareResults: user.shareResults
    });

    let needsUpdate = false;

    // Generate username if missing
    if (!user.username) {
      let baseUsername = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15);
      
      if (!/^[a-z]/.test(baseUsername)) {
        baseUsername = 'user' + baseUsername;
      }

      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user.username = username;
      needsUpdate = true;
      console.log('Generated username:', username);
    }

    // Set default profile settings if missing
    if (!user.profileVisibility) {
      user.profileVisibility = 'public';
      needsUpdate = true;
    }
    
    if (user.shareResults === undefined) {
      user.shareResults = true;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await user.save();
      console.log('✅ User profile fixed successfully!');
      console.log('Updated fields:', {
        username: user.username,
        profileVisibility: user.profileVisibility,
        shareResults: user.shareResults
      });
    } else {
      console.log('✅ User profile is already complete - no updates needed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAhmadProfile();
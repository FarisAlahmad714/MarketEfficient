const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function verifyAhmadEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
    const user = await User.findOne({email: 'ahmadalkhdairi@yahoo.com'});
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('Current verification status:', user.emailVerified);

    // Verify the email
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    
    await user.save();
    
    console.log('✅ Email verification updated successfully!');
    console.log('New verification status:', user.emailVerified);
    console.log('Verified at:', user.emailVerifiedAt);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAhmadEmail();
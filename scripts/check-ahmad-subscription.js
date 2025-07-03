const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkAhmadSubscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user
    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
    const user = await User.findOne({email: 'ahmadalkhdairi@yahoo.com'});
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User Info:');
    console.log('  ID:', user._id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email); 
    console.log('  Username:', user.username);
    console.log('  Admin:', user.isAdmin || false);
    console.log('  Verified:', user.emailVerified || false);

    // Check subscription
    const Subscription = mongoose.model('Subscription', new mongoose.Schema({}, {strict: false}));
    const subscription = await Subscription.findOne({userId: user._id});
    
    console.log('\n💳 Subscription Status:');
    if (subscription) {
      console.log('  Status:', subscription.status);
      console.log('  Plan:', subscription.plan);
      console.log('  Active:', subscription.status === 'active');
      console.log('  Created:', subscription.createdAt);
      console.log('  Current Period End:', subscription.currentPeriodEnd);
    } else {
      console.log('  ❌ No subscription found');
    }

    // Check for alternative access methods
    console.log('\n🔑 Access Methods:');
    console.log('  Is Admin:', user.isAdmin || false);
    console.log('  Has Subscription:', !!subscription);
    console.log('  Subscription Active:', subscription?.status === 'active');
    console.log('  Dashboard Access:', user.isAdmin || subscription?.status === 'active');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAhmadSubscription();
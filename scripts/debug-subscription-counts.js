const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schemas
const SubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  status: String,
  plan: String,
  amount: Number,
  originalAmount: Number,
  discountAmount: Number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  promoCodeUsed: mongoose.Schema.Types.ObjectId,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  createdAt: Date
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  registrationPromoCode: String,
  isAdmin: Boolean
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function debugSubscriptionCounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get all subscriptions
    const allSubs = await Subscription.find({});
    console.log(`\n📊 TOTAL SUBSCRIPTIONS IN DATABASE: ${allSubs.length}`);

    // Break down by amount
    const freeSubs = allSubs.filter(sub => sub.amount === 0);
    const paidSubs = allSubs.filter(sub => sub.amount > 0);
    console.log(`💰 Free subscriptions (amount = 0): ${freeSubs.length}`);
    console.log(`💳 Paid subscriptions (amount > 0): ${paidSubs.length}`);

    // Break down by expiration
    const unlimitedSubs = allSubs.filter(sub => sub.currentPeriodEnd === null);
    const limitedSubs = allSubs.filter(sub => sub.currentPeriodEnd !== null);
    console.log(`♾️  Unlimited access (no expiration): ${unlimitedSubs.length}`);
    console.log(`⏰ With expiration dates: ${limitedSubs.length}`);

    // Break down by promo code usage
    const promoSubs = allSubs.filter(sub => sub.promoCodeUsed);
    const nonPromoSubs = allSubs.filter(sub => !sub.promoCodeUsed);
    console.log(`🎫 With promo codes: ${promoSubs.length}`);
    console.log(`🚫 Without promo codes: ${nonPromoSubs.length}`);

    // Break down by user existence
    let withUsers = 0;
    let orphaned = 0;
    
    for (const sub of allSubs) {
      const user = await User.findById(sub.userId);
      if (user) {
        withUsers++;
      } else {
        orphaned++;
      }
    }
    
    console.log(`👤 With existing users: ${withUsers}`);
    console.log(`💀 Orphaned (user deleted): ${orphaned}`);

    // Show status breakdown
    const statusCounts = {};
    allSubs.forEach(sub => {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    });
    console.log(`\n📈 STATUS BREAKDOWN:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Show plan breakdown
    const planCounts = {};
    allSubs.forEach(sub => {
      planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
    });
    console.log(`\n📦 PLAN BREAKDOWN:`);
    Object.entries(planCounts).forEach(([plan, count]) => {
      console.log(`   ${plan}: ${count}`);
    });

    // Validation check
    console.log(`\n🔍 VALIDATION CHECK:`);
    console.log(`Free + Paid = ${freeSubs.length} + ${paidSubs.length} = ${freeSubs.length + paidSubs.length}`);
    console.log(`Unlimited + Limited = ${unlimitedSubs.length} + ${limitedSubs.length} = ${unlimitedSubs.length + limitedSubs.length}`);
    console.log(`With Users + Orphaned = ${withUsers} + ${orphaned} = ${withUsers + orphaned}`);
    console.log(`Total should be: ${allSubs.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

debugSubscriptionCounts();
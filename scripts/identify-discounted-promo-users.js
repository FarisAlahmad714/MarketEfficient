const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas with proper population
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
  createdAt: Date
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  registrationPromoCode: String,
  isAdmin: Boolean,
  createdAt: Date
});

const PromoCodeSchema = new mongoose.Schema({
  code: String,
  description: String,
  discountType: String
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);

async function identifyDiscountedPromoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Find all subscriptions with discounted promo codes (amount > 0)
    const discountedSubs = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      amount: { $gt: 0 } // Paid subscriptions (not 100% free)
    }).sort({ createdAt: -1 });

    console.log(`\n🔍 Found ${discountedSubs.length} discounted promo subscriptions\n`);

    if (discountedSubs.length === 0) {
      console.log('No discounted promo subscriptions found.');
      return;
    }

    console.log('═'.repeat(100));
    console.log('DISCOUNTED PROMO SUBSCRIPTIONS:');
    console.log('═'.repeat(100));

    for (const sub of discountedSubs) {
      // Manually fetch user and promo code details
      const user = await User.findById(sub.userId);
      const promoCode = await PromoCode.findById(sub.promoCodeUsed);
      
      const hasExpiration = sub.currentPeriodEnd !== null;
      const isExpired = hasExpiration && sub.currentPeriodEnd < new Date();
      const daysRemaining = hasExpiration ? Math.ceil((sub.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';

      console.log(`\n👤 ${user ? user.name : 'USER DELETED'} (${user ? user.email : 'NO EMAIL'})`);
      console.log(`   User ID: ${sub.userId}`);
      console.log(`   Promo Code: ${promoCode ? promoCode.code : 'PROMO DELETED'} - ${promoCode ? promoCode.description : 'N/A'}`);
      console.log(`   Status: ${sub.status} | Plan: ${sub.plan}`);
      console.log(`   Amount: $${(sub.amount / 100).toFixed(2)}/month`);
      console.log(`   Original: $${(sub.originalAmount / 100).toFixed(2)} | Discount: $${(sub.discountAmount / 100).toFixed(2)}`);
      console.log(`   Created: ${sub.createdAt ? sub.createdAt.toLocaleDateString() : 'Unknown'}`);
      
      if (hasExpiration) {
        console.log(`   Expiration: ${sub.currentPeriodEnd.toLocaleDateString()} (${daysRemaining} days)`);
        console.log(`   Billing Status: ✅ RECURRING (Monthly expiration - correct)`);
      } else {
        console.log(`   Expiration: NEVER`);
        console.log(`   Billing Status: ❌ UNLIMITED ACCESS (Should be recurring!)`);
      }

      if (user) {
        console.log(`   User Status: ACTIVE`);
      } else {
        console.log(`   User Status: ⚠️  DELETED (Orphaned subscription)`);
      }
      console.log(`   ─────────────────────────────────────────────────────────────`);
    }

    // Summary
    const withUsers = discountedSubs.filter(async sub => await User.findById(sub.userId));
    const withExpiration = discountedSubs.filter(sub => sub.currentPeriodEnd !== null);
    const unlimited = discountedSubs.filter(sub => sub.currentPeriodEnd === null);

    console.log('\n📊 SUMMARY:');
    console.log(`Total discounted promo subscriptions: ${discountedSubs.length}`);
    console.log(`With monthly expiration (correct): ${withExpiration.length}`);
    console.log(`With unlimited access (incorrect): ${unlimited.length}`);

    // Show which of your current 9 users are affected
    console.log('\n🎯 CURRENT ACTIVE USERS WITH DISCOUNTED PROMOS:');
    const currentUsers = await User.find({
      _id: { $in: discountedSubs.map(sub => sub.userId) }
    });

    if (currentUsers.length > 0) {
      console.log('These are your current users from the admin panel:');
      for (const user of currentUsers) {
        const userSub = discountedSubs.find(sub => sub.userId.equals(user._id));
        const promoCode = await PromoCode.findById(userSub.promoCodeUsed);
        console.log(`   • ${user.name} (${user.email}) - ${promoCode?.code || 'Unknown'} - $${(userSub.amount / 100).toFixed(2)}/month`);
      }
    } else {
      console.log('None of your current 9 users are on discounted promo codes.');
      console.log('All discounted promo subscriptions appear to be from deleted users.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

identifyDiscountedPromoUsers();
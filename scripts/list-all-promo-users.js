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
  discountType: String,
  discountAmount: Number
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);

async function listAllPromoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get all promo subscriptions with user and promo code details
    const promoSubscriptions = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null }
    }).populate('userId', 'name email isAdmin createdAt')
      .populate('promoCodeUsed', 'code description discountType discountAmount')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Found ${promoSubscriptions.length} total promo subscriptions\n`);
    console.log('═'.repeat(100));
    console.log('ALL PROMO CODE SUBSCRIPTIONS:');
    console.log('═'.repeat(100));

    let activeCount = 0;
    let unlimitedCount = 0;
    let expiredCount = 0;

    promoSubscriptions.forEach((sub, index) => {
      const user = sub.userId;
      const promo = sub.promoCodeUsed;
      const hasExpiration = sub.currentPeriodEnd !== null;
      const isExpired = hasExpiration && sub.currentPeriodEnd < new Date();
      
      if (sub.status === 'active') activeCount++;
      if (!hasExpiration) unlimitedCount++;
      if (isExpired) expiredCount++;

      console.log(`\n${index + 1}. ${user ? user.name : 'DELETED USER'} (${user ? user.email : 'NO EMAIL'})`);
      console.log(`   User ID: ${sub.userId}`);
      console.log(`   Admin: ${user?.isAdmin ? 'YES' : 'NO'}`);
      console.log(`   Promo Code: ${promo ? promo.code : 'DELETED PROMO'} - ${promo ? promo.description : 'N/A'}`);
      console.log(`   Status: ${sub.status} | Plan: ${sub.plan}`);
      console.log(`   Amount: $${(sub.amount / 100).toFixed(2)} (Original: $${(sub.originalAmount / 100).toFixed(2)})`);
      console.log(`   Discount: $${(sub.discountAmount / 100).toFixed(2)}`);
      console.log(`   Created: ${sub.createdAt ? sub.createdAt.toLocaleDateString() : 'Unknown'}`);
      
      if (hasExpiration) {
        const daysRemaining = Math.ceil((sub.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`   Expiration: ${sub.currentPeriodEnd.toLocaleDateString()} (${daysRemaining} days)`);
        console.log(`   🔴 LIMITED ACCESS`);
      } else {
        console.log(`   Expiration: NEVER`);
        console.log(`   ✅ UNLIMITED ACCESS`);
      }
      console.log(`   ─────────────────────────────────────────────────────────────`);
    });

    console.log('\n📈 SUMMARY:');
    console.log(`Total promo subscriptions: ${promoSubscriptions.length}`);
    console.log(`Active subscriptions: ${activeCount}`);
    console.log(`Unlimited access: ${unlimitedCount}`);
    console.log(`With expiration dates: ${promoSubscriptions.length - unlimitedCount}`);
    console.log(`Expired: ${expiredCount}`);

    // Check for orphaned subscriptions (user deleted but subscription remains)
    const orphanedSubs = promoSubscriptions.filter(sub => !sub.userId);
    if (orphanedSubs.length > 0) {
      console.log(`\n⚠️  ORPHANED SUBSCRIPTIONS: ${orphanedSubs.length}`);
      console.log('These subscriptions have no associated user (user was deleted)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

listAllPromoUsers();
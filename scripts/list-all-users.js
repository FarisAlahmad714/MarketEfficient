const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schemas to avoid bcrypt issues
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
  isAdmin: Boolean,
  isVerified: Boolean,
  subscriptionStatus: String,
  subscriptionTier: String,
  hasActiveSubscription: Boolean,
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

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get all users (excluding obvious test/temp accounts)
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    
    console.log(`\n📊 Found ${allUsers.length} total users in database\n`);
    console.log('═'.repeat(120));
    console.log('ALL USERS WITH SUBSCRIPTION DETAILS:');
    console.log('═'.repeat(120));

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      
      // Get user's subscription
      const subscription = await Subscription.findOne({ userId: user._id });
      
      // Get promo code if used
      let promoCode = null;
      if (subscription?.promoCodeUsed) {
        promoCode = await PromoCode.findById(subscription.promoCodeUsed);
      }

      const hasExpiration = subscription && subscription.currentPeriodEnd !== null;
      const isExpired = hasExpiration && subscription.currentPeriodEnd < new Date();
      const daysRemaining = hasExpiration ? Math.ceil((subscription.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)) : null;

      console.log(`\n${i + 1}. ${user.name || 'No Name'}`);
      console.log(`   📧 Email: ${user.email || 'No Email'}`);
      console.log(`   👤 Admin: ${user.isAdmin ? 'YES' : 'NO'}`);
      console.log(`   ✅ Verified: ${user.isVerified ? 'YES' : 'NO'}`);
      console.log(`   📅 Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}`);
      
      if (subscription) {
        console.log(`   💳 Subscription Status: ${subscription.status}`);
        console.log(`   📦 Plan: ${subscription.plan}`);
        
        if (subscription.amount === 0) {
          console.log(`   💰 Amount: FREE (100% promo discount)`);
        } else {
          console.log(`   💰 Amount: $${(subscription.amount / 100).toFixed(2)}/month`);
          if (subscription.originalAmount && subscription.discountAmount) {
            console.log(`   💸 Original: $${(subscription.originalAmount / 100).toFixed(2)} | Discount: $${(subscription.discountAmount / 100).toFixed(2)}`);
          }
        }
        
        if (promoCode) {
          console.log(`   🎫 Promo Code: ${promoCode.code} - ${promoCode.description}`);
        } else if (user.registrationPromoCode) {
          console.log(`   🎫 Promo Code: ${user.registrationPromoCode} (code details not found)`);
        }
        
        if (hasExpiration) {
          const status = isExpired ? '🔴 EXPIRED' : '🟡 EXPIRES';
          console.log(`   ⏰ Expiration: ${subscription.currentPeriodEnd.toLocaleDateString()} (${daysRemaining} days) ${status}`);
        } else {
          console.log(`   ⏰ Expiration: ✅ UNLIMITED ACCESS`);
        }
        
        if (subscription.stripeCustomerId) {
          console.log(`   🏦 Stripe Customer: ${subscription.stripeCustomerId}`);
        }
        if (subscription.stripeSubscriptionId) {
          console.log(`   🔄 Stripe Subscription: ${subscription.stripeSubscriptionId}`);
        }
      } else {
        console.log(`   💳 Subscription: ❌ NO SUBSCRIPTION`);
      }
      
      console.log(`   ─────────────────────────────────────────────────────────────────────────────────────────────────`);
    }

    // Summary statistics
    const activeUsers = allUsers.filter(user => user.hasActiveSubscription);
    const adminUsers = allUsers.filter(user => user.isAdmin);
    const verifiedUsers = allUsers.filter(user => user.isVerified);
    
    const subscriptions = await Subscription.find({});
    const freeSubscriptions = subscriptions.filter(sub => sub.amount === 0);
    const paidSubscriptions = subscriptions.filter(sub => sub.amount > 0);
    const unlimitedAccess = subscriptions.filter(sub => sub.currentPeriodEnd === null);

    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`📊 Total Users: ${allUsers.length}`);
    console.log(`✅ Active Subscriptions: ${activeUsers.length}`);
    console.log(`👑 Admin Users: ${adminUsers.length}`);
    console.log(`📧 Verified Users: ${verifiedUsers.length}`);
    console.log(`💰 Free Subscriptions: ${freeSubscriptions.length}`);
    console.log(`💳 Paid Subscriptions: ${paidSubscriptions.length}`);
    console.log(`♾️  Unlimited Access: ${unlimitedAccess.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

listAllUsers();
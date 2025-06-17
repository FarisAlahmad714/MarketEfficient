const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schemas to avoid bcrypt issues
const SubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  status: String,
  plan: String,
  amount: Number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  promoCodeUsed: mongoose.Schema.Types.ObjectId,
  discountAmount: Number,
  originalAmount: Number,
  updatedAt: Date
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  subscriptionStatus: String,
  subscriptionTier: String,
  hasActiveSubscription: Boolean,
  isAdmin: Boolean,
  registrationPromoCode: String
});

const PromoCodeSchema = new mongoose.Schema({
  code: String,
  description: String,
  discountType: String,
  discountAmount: Number,
  discountPercentage: Number
});

const AdminActionSchema = new mongoose.Schema({
  adminUserId: mongoose.Schema.Types.ObjectId,
  action: String,
  targetType: String,
  targetId: mongoose.Schema.Types.ObjectId,
  targetIdentifier: String,
  description: String,
  details: mongoose.Schema.Types.Mixed,
  category: String,
  severity: String,
  createdAt: { type: Date, default: Date.now }
});

// Add methods to schemas
SubscriptionSchema.methods.getDaysRemaining = function() {
  if (!this.currentPeriodEnd) return Infinity;
  const now = new Date();
  const end = new Date(this.currentPeriodEnd);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

UserSchema.methods.updateSubscriptionStatus = async function(status, plan) {
  this.subscriptionStatus = status;
  this.hasActiveSubscription = ['active', 'trialing', 'admin_access'].includes(status);
  this.subscriptionTier = this.hasActiveSubscription ? plan : 'free';
  return this.save();
};

AdminActionSchema.statics.logAction = async function(actionData) {
  const action = new this(actionData);
  return action.save();
};

// Create models
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);
const AdminAction = mongoose.models.AdminAction || mongoose.model('AdminAction', AdminActionSchema);

async function fixPromoUnlimitedAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Find all subscriptions that used promo codes but have expiration dates
    const affectedSubscriptions = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      currentPeriodEnd: { $exists: true, $ne: null }
    }).populate('userId', 'name email registrationPromoCode')
      .populate('promoCodeUsed', 'code description discountType');

    console.log(`\n🔍 Found ${affectedSubscriptions.length} promo code subscriptions with expiration dates`);

    if (affectedSubscriptions.length === 0) {
      console.log('✅ No subscriptions need fixing - all promo users already have unlimited access!');
      return;
    }

    // Display affected users
    console.log('\n📋 Users who will get unlimited access:');
    console.log('─'.repeat(80));
    
    for (const sub of affectedSubscriptions) {
      const user = sub.userId;
      const promoCode = sub.promoCodeUsed;
      const daysRemaining = sub.getDaysRemaining();
      
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   Promo Code: ${promoCode.code} - ${promoCode.description}`);
      console.log(`   Current Expiration: ${sub.currentPeriodEnd.toLocaleDateString()}`);
      console.log(`   Days Remaining: ${daysRemaining}`);
      console.log(`   Status: ${sub.status} | Plan: ${sub.plan}`);
      console.log('─'.repeat(40));
    }

    // Find admin user for logging
    const adminUser = await User.findOne({ isAdmin: true });
    
    // Update subscriptions
    let updated = 0;
    let errors = 0;

    console.log('\n🔧 Updating subscriptions to unlimited access...');

    for (const subscription of affectedSubscriptions) {
      try {
        const user = subscription.userId;
        const previousEnd = subscription.currentPeriodEnd;
        
        // Update to unlimited access
        subscription.currentPeriodEnd = null;
        subscription.status = subscription.status === 'inactive' ? 'active' : subscription.status;
        await subscription.save();

        // Update user subscription status if needed
        if (user && !user.hasActiveSubscription) {
          await user.updateSubscriptionStatus('active', subscription.plan);
        }

        // Log admin action
        if (adminUser) {
          await AdminAction.logAction({
            adminUserId: adminUser._id,
            action: 'subscription_unlimited_access_granted',
            targetType: 'subscription',
            targetId: subscription._id,
            targetIdentifier: user.email,
            description: `Granted unlimited access for promo code subscription`,
            details: {
              reason: 'Promo code users should have unlimited access - migration fix',
              promoCode: subscription.promoCodeUsed.code,
              previousExpiration: previousEnd,
              newExpiration: null
            },
            category: 'user_management',
            severity: 'medium'
          });
        }

        console.log(`✅ Updated: ${user.email} - Now has unlimited access`);
        updated++;

      } catch (error) {
        console.log(`❌ Error updating ${subscription.userId.email}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updated} users`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Total processed: ${affectedSubscriptions.length}`);

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const remainingIssues = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      currentPeriodEnd: { $exists: true, $ne: null }
    });

    if (remainingIssues.length === 0) {
      console.log('🎉 SUCCESS: All promo code users now have unlimited access!');
    } else {
      console.log(`⚠️  ${remainingIssues.length} subscriptions still have expiration dates (may need manual review)`);
    }

  } catch (error) {
    console.error('❌ Error fixing promo unlimited access:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Disconnected from MongoDB');
  }
}

// Query function to check current state
async function checkPromoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const promoSubscriptions = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null }
    }).populate('userId', 'name email')
      .populate('promoCodeUsed', 'code description');

    const withExpiration = promoSubscriptions.filter(sub => sub.currentPeriodEnd !== null);
    const unlimited = promoSubscriptions.filter(sub => sub.currentPeriodEnd === null);

    console.log('📊 Promo Code Subscription Status:');
    console.log(`Total promo subscriptions: ${promoSubscriptions.length}`);
    console.log(`❌ With expiration dates: ${withExpiration.length}`);
    console.log(`✅ Unlimited access: ${unlimited.length}`);

    return {
      total: promoSubscriptions.length,
      needsFix: withExpiration.length,
      unlimited: unlimited.length
    };

  } finally {
    await mongoose.disconnect();
  }
}

// Export functions
module.exports = {
  fixPromoUnlimitedAccess,
  checkPromoUsers
};

// Run the fix if this script is called directly
if (require.main === module) {
  console.log('🚀 Starting promo code unlimited access fix...\n');
  fixPromoUnlimitedAccess();
}
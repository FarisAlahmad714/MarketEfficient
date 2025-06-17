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

AdminActionSchema.statics.logAction = async function(actionData) {
  const action = new this(actionData);
  return action.save();
};

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const AdminAction = mongoose.models.AdminAction || mongoose.model('AdminAction', AdminActionSchema);

async function cleanupOrphanedSubscriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get all subscriptions
    const allSubscriptions = await Subscription.find({});
    console.log(`\n📊 Found ${allSubscriptions.length} total subscriptions`);

    // Check which ones are orphaned
    const orphanedSubscriptions = [];
    const validSubscriptions = [];

    console.log('\n🔍 Checking subscription ownership...');
    
    for (const sub of allSubscriptions) {
      const user = await User.findById(sub.userId);
      if (user) {
        validSubscriptions.push(sub);
      } else {
        orphanedSubscriptions.push(sub);
      }
    }

    console.log(`✅ Valid subscriptions (user exists): ${validSubscriptions.length}`);
    console.log(`💀 Orphaned subscriptions (user deleted): ${orphanedSubscriptions.length}`);

    if (orphanedSubscriptions.length === 0) {
      console.log('\n🎉 No orphaned subscriptions found! Database is clean.');
      return;
    }

    // Show details of what will be deleted
    console.log('\n⚠️  ORPHANED SUBSCRIPTIONS TO BE DELETED:');
    console.log('─'.repeat(80));
    
    let totalOrphanedRevenue = 0;
    const deletionDetails = [];

    orphanedSubscriptions.forEach((sub, index) => {
      const revenue = sub.amount || 0;
      totalOrphanedRevenue += revenue;
      
      console.log(`${index + 1}. User ID: ${sub.userId}`);
      console.log(`   Status: ${sub.status} | Plan: ${sub.plan}`);
      console.log(`   Amount: $${(revenue / 100).toFixed(2)}`);
      console.log(`   Created: ${sub.createdAt ? sub.createdAt.toLocaleDateString() : 'Unknown'}`);
      console.log(`   Promo Used: ${sub.promoCodeUsed ? 'Yes' : 'No'}`);
      if (sub.stripeCustomerId) console.log(`   Stripe Customer: ${sub.stripeCustomerId}`);
      if (sub.stripeSubscriptionId) console.log(`   Stripe Subscription: ${sub.stripeSubscriptionId}`);
      console.log('   ─────────────────────────────────────────');

      deletionDetails.push({
        subscriptionId: sub._id,
        userId: sub.userId,
        status: sub.status,
        plan: sub.plan,
        amount: revenue,
        createdAt: sub.createdAt,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubscriptionId: sub.stripeSubscriptionId
      });
    });

    console.log(`\n💰 Total orphaned revenue: $${(totalOrphanedRevenue / 100).toFixed(2)}`);

    // Find admin user for logging
    const adminUser = await User.findOne({ isAdmin: true });
    
    // Delete orphaned subscriptions
    console.log('\n🧹 Starting cleanup...');
    
    let deleted = 0;
    let errors = 0;

    for (const sub of orphanedSubscriptions) {
      try {
        await Subscription.findByIdAndDelete(sub._id);
        deleted++;
        console.log(`✅ Deleted subscription ${sub._id} (User: ${sub.userId})`);
      } catch (error) {
        console.log(`❌ Error deleting subscription ${sub._id}: ${error.message}`);
        errors++;
      }
    }

    // Log the cleanup action
    if (adminUser && deleted > 0) {
      await AdminAction.logAction({
        adminUserId: adminUser._id,
        action: 'orphaned_subscriptions_cleanup',
        targetType: 'subscription',
        targetId: null,
        targetIdentifier: 'bulk_cleanup',
        description: `Cleaned up ${deleted} orphaned subscriptions from deleted users`,
        details: {
          reason: 'Database maintenance - removing subscriptions for deleted users',
          deletedCount: deleted,
          totalOrphanedRevenue: totalOrphanedRevenue,
          deletionDetails: deletionDetails
        },
        category: 'system_maintenance',
        severity: 'medium'
      });
    }

    // Verify cleanup
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`Successfully deleted: ${deleted} subscriptions`);
    console.log(`Errors: ${errors}`);
    console.log(`Orphaned revenue cleaned: $${(totalOrphanedRevenue / 100).toFixed(2)}`);

    // Final verification
    const remainingSubscriptions = await Subscription.find({});
    console.log(`\n🔍 VERIFICATION:`);
    console.log(`Subscriptions before cleanup: ${allSubscriptions.length}`);
    console.log(`Subscriptions after cleanup: ${remainingSubscriptions.length}`);
    console.log(`Expected remaining: ${validSubscriptions.length}`);
    
    if (remainingSubscriptions.length === validSubscriptions.length) {
      console.log('✅ SUCCESS: Cleanup completed successfully!');
    } else {
      console.log('⚠️  WARNING: Subscription count mismatch, please review.');
    }

    // Show final clean state
    const freeAfter = remainingSubscriptions.filter(sub => sub.amount === 0).length;
    const paidAfter = remainingSubscriptions.filter(sub => sub.amount > 0).length;
    const unlimitedAfter = remainingSubscriptions.filter(sub => sub.currentPeriodEnd === null).length;
    
    console.log(`\n📈 FINAL CLEAN STATE:`);
    console.log(`Total subscriptions: ${remainingSubscriptions.length}`);
    console.log(`Free subscriptions: ${freeAfter}`);
    console.log(`Paid subscriptions: ${paidAfter}`);
    console.log(`Unlimited access: ${unlimitedAfter}`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

cleanupOrphanedSubscriptions();
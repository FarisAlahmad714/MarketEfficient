// scripts/sync-subscriptions.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Define schemas to match your models
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
  updatedAt: Date
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  subscriptionStatus: String,
  subscriptionTier: String,
  hasActiveSubscription: Boolean
});

// Add the updateSubscriptionStatus method to match your User model
UserSchema.methods.updateSubscriptionStatus = async function(status, plan) {
  this.subscriptionStatus = status;
  this.hasActiveSubscription = ['active', 'trialing'].includes(status);
  this.subscriptionTier = this.hasActiveSubscription ? plan : 'free';
  return this.save();
};

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function syncSubscriptionStatuses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, let's see what subscriptions exist
    const allSubscriptions = await Subscription.find({});
    console.log(`\n📊 Total subscriptions in database: ${allSubscriptions.length}`);
    
    // Count by type
    const stripeSubscriptions = allSubscriptions.filter(s => s.stripeSubscriptionId);
    const manualSubscriptions = allSubscriptions.filter(s => !s.stripeSubscriptionId);
    
    console.log(`  - Stripe-managed subscriptions: ${stripeSubscriptions.length}`);
    console.log(`  - Manual subscriptions (promo/one-time): ${manualSubscriptions.length}`);
    
    // Show status breakdown
    const statusCounts = {};
    allSubscriptions.forEach(s => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });
    console.log(`  - Status breakdown:`, statusCounts);

    // Now sync only Stripe-managed subscriptions
    const subscriptionsToSync = await Subscription.find({
      stripeSubscriptionId: { $exists: true, $ne: null },
      status: { $in: ['active', 'trialing', 'past_due'] }
    });

    console.log(`\n🔄 Found ${subscriptionsToSync.length} Stripe subscriptions to sync`);

    let synced = 0;
    let updated = 0;
    let errors = 0;

    for (const subscription of subscriptionsToSync) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );

        if (stripeSubscription.status !== subscription.status) {
          console.log(`\nUpdating subscription ${subscription._id}:`);
          console.log(`  Customer: ${stripeSubscription.customer}`);
          console.log(`  Old status: ${subscription.status}`);
          console.log(`  New status: ${stripeSubscription.status}`);

          subscription.status = stripeSubscription.status;
          subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
          subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
          subscription.updatedAt = new Date();
          
          await subscription.save();

          const user = await User.findById(subscription.userId);
          if (user) {
            await user.updateSubscriptionStatus(
              stripeSubscription.status,
              subscription.plan
            );
            console.log(`  Updated user ${user.email} subscription status`);
          }

          updated++;
        }
        
        synced++;
      } catch (error) {
        console.error(`Error syncing subscription ${subscription._id}:`, error.message);
        errors++;
      }
    }

    // Check for expired manual subscriptions
    console.log(`\n🕐 Checking for expired manual subscriptions...`);
    const expiredManual = await Subscription.find({
      stripeSubscriptionId: { $exists: false },
      status: 'active',
      currentPeriodEnd: { $lt: new Date() }
    });

    if (expiredManual.length > 0) {
      console.log(`Found ${expiredManual.length} expired manual subscriptions`);
      for (const sub of expiredManual) {
        sub.status = 'expired';
        await sub.save();
        
        const user = await User.findById(sub.userId);
        if (user) {
          await user.updateSubscriptionStatus('expired', 'free');
          console.log(`  Expired subscription for user: ${user.email}`);
        }
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`Stripe subscriptions checked: ${subscriptionsToSync.length}`);
    console.log(`Successfully synced: ${synced}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log(`Expired manual subscriptions: ${expiredManual.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('Sync error:', error);
    process.exit(1);
  }
}

// Run the sync - THIS WAS MISSING!
syncSubscriptionStatuses();
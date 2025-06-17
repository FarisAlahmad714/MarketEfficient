const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schemas
const SubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
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
  isAdmin: Boolean
});

const PromoCodeSchema = new mongoose.Schema({
  code: String,
  description: String,
  discountType: String,
  discountAmount: Number,
  discountPercentage: Number
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);

async function fixDiscountedPromoBilling() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Find all discounted promo subscriptions (amount > 0) that have unlimited access
    const discountedPromoSubs = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      amount: { $gt: 0 }, // Paid subscriptions (not 100% free)
      currentPeriodEnd: null // Currently have unlimited access
    }).populate('userId', 'name email')
      .populate('promoCodeUsed', 'code description discountType');

    console.log(`\n🔍 Found ${discountedPromoSubs.length} discounted promo subscriptions with incorrect unlimited access`);

    if (discountedPromoSubs.length === 0) {
      console.log('✅ No discounted promo subscriptions need fixing!');
      return;
    }

    console.log('\n⚠️  CRITICAL: These users paid for discounted subscriptions but got unlimited access:');
    console.log('─'.repeat(80));

    const validUsers = discountedPromoSubs.filter(sub => sub.userId); // Only users that still exist
    
    for (const sub of validUsers) {
      const user = sub.userId;
      const promo = sub.promoCodeUsed;
      
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   Promo Code: ${promo?.code || 'Unknown'}`);
      console.log(`   Paid Amount: $${(sub.amount / 100).toFixed(2)}/month`);
      console.log(`   Original Amount: $${(sub.originalAmount / 100).toFixed(2)}`);
      console.log(`   Discount: $${(sub.discountAmount / 100).toFixed(2)}`);
      console.log(`   Current Status: UNLIMITED ACCESS (WRONG!)`);
      console.log(`   Should be: RECURRING $${(sub.amount / 100).toFixed(2)}/month`);
      console.log('─'.repeat(40));
    }

    console.log('\n🚨 URGENT ACTION NEEDED:');
    console.log('These users should be on recurring Stripe subscriptions, not unlimited access!');
    console.log('\nOptions:');
    console.log('1. Create proper Stripe subscriptions for them');
    console.log('2. Set proper expiration dates (1 month from now) and let them renew');
    console.log('3. Contact them to set up proper billing');

    // For now, let's set proper expiration dates (1 month from now)
    console.log('\n🔧 Setting proper expiration dates (1 month from creation date)...');
    
    let fixed = 0;
    for (const sub of validUsers) {
      try {
        // Set expiration to 1 month from creation
        const creationDate = sub.createdAt || new Date();
        const expirationDate = new Date(creationDate);
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        
        sub.currentPeriodStart = creationDate;
        sub.currentPeriodEnd = expirationDate;
        await sub.save();
        
        console.log(`✅ Fixed: ${sub.userId.email} - Expires ${expirationDate.toLocaleDateString()}`);
        fixed++;
      } catch (error) {
        console.log(`❌ Error fixing ${sub.userId.email}: ${error.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`Fixed: ${fixed} discounted promo subscriptions`);
    console.log(`These users now have proper expiration dates and will need to renew.`);

    // Also check for 100% free promos that should keep unlimited access
    const freePromoSubs = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      amount: 0, // 100% free
      currentPeriodEnd: null // Unlimited access (correct)
    }).populate('userId', 'name email')
      .populate('promoCodeUsed', 'code');

    const validFreeUsers = freePromoSubs.filter(sub => sub.userId);
    console.log(`\n✅ ${validFreeUsers.length} users with 100% free promo codes correctly have unlimited access`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

fixDiscountedPromoBilling();
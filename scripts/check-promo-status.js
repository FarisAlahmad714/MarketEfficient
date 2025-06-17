const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schemas
const SubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  status: String,
  plan: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  promoCodeUsed: mongoose.Schema.Types.ObjectId,
  discountAmount: Number
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  registrationPromoCode: String
});

const PromoCodeSchema = new mongoose.Schema({
  code: String,
  description: String
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);

async function checkPromoStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    const promoSubscriptions = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null }
    });

    const withExpiration = promoSubscriptions.filter(sub => sub.currentPeriodEnd !== null);
    const unlimited = promoSubscriptions.filter(sub => sub.currentPeriodEnd === null);

    console.log('\n📊 Promo Code Subscription Status:');
    console.log(`Total promo subscriptions: ${promoSubscriptions.length}`);
    console.log(`❌ Still with expiration dates: ${withExpiration.length}`);
    console.log(`✅ Unlimited access (no expiration): ${unlimited.length}`);

    if (withExpiration.length > 0) {
      console.log('\n⚠️  Users still with expiration dates:');
      withExpiration.forEach(sub => {
        console.log(`  - ${sub._id}: expires ${sub.currentPeriodEnd.toLocaleDateString()}`);
      });
    } else {
      console.log('\n🎉 SUCCESS: All promo users now have unlimited access!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Disconnected from MongoDB');
  }
}

checkPromoStatus();
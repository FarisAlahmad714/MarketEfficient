const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initPromoCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first admin user to assign as creator
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Using admin user: ${adminUser.email} as promo code creator`);

    // Create preset promo codes
    const createdCodes = await PromoCode.createPresetCodes(adminUser._id);

    if (createdCodes.length > 0) {
      console.log('\n✅ Successfully created preset promo codes:');
      createdCodes.forEach(code => {
        console.log(`- ${code.code}: ${code.description} (Final price: $${code.finalPrice / 100})`);
      });
    } else {
      console.log('\n⚠️  All preset promo codes already exist');
    }

    // Display all existing promo codes
    const allCodes = await PromoCode.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log('\n📋 All existing promo codes:');
    console.log('─'.repeat(80));
    
    allCodes.forEach(code => {
      const status = code.isActive ? '🟢 Active' : '🔴 Inactive';
      const usage = `${code.currentUses}/${code.maxUses}`;
      const finalPrice = code.finalPrice ? `$${code.finalPrice / 100}` : 'N/A';
      
      console.log(`${status} ${code.code}`);
      console.log(`  Description: ${code.description}`);
      console.log(`  Type: ${code.type} | Discount: ${code.discountType}`);
      console.log(`  Final Price: ${finalPrice} | Usage: ${usage}`);
      console.log(`  Created by: ${code.createdBy?.name || 'Unknown'} on ${code.createdAt.toLocaleDateString()}`);
      console.log('─'.repeat(40));
    });

    console.log('\n🎉 Promo code initialization completed!');

  } catch (error) {
    console.error('Error initializing promo codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
initPromoCodes(); 
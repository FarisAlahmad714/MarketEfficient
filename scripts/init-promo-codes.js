const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const dotenv = require('dotenv');
const logger = require('../lib/logger'); // Adjust path to your logger utility

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initPromoCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('Connected to MongoDB');

    // Find the first admin user to assign as creator
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    logger.log(`Using admin user: ${adminUser.email} as promo code creator`);

    // Create preset promo codes
    const createdCodes = await PromoCode.createPresetCodes(adminUser._id);

    if (createdCodes.length > 0) {
      logger.log('\n✅ Successfully created preset promo codes:');
      createdCodes.forEach(code => {
        logger.log(`- ${code.code}: ${code.description} (Final price: $${code.finalPrice / 100})`);
      });
    } else {
      logger.log('\n⚠️  All preset promo codes already exist');
    }

    // Display all existing promo codes
    const allCodes = await PromoCode.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    logger.log('\n📋 All existing promo codes:');
    logger.log('─'.repeat(80));
    
    allCodes.forEach(code => {
      const status = code.isActive ? '🟢 Active' : '🔴 Inactive';
      const usage = `${code.currentUses}/${code.maxUses}`;
      const finalPrice = code.finalPrice ? `$${code.finalPrice / 100}` : 'N/A';
      
      logger.log(`${status} ${code.code}`);
      logger.log(`  Description: ${code.description}`);
      logger.log(`  Type: ${code.type} | Discount: ${code.discountType}`);
      logger.log(`  Final Price: ${finalPrice} | Usage: ${usage}`);
      logger.log(`  Created by: ${code.createdBy?.name || 'Unknown'} on ${code.createdAt.toLocaleDateString()}`);
      logger.log('─'.repeat(40));
    });

    logger.log('\n🎉 Promo code initialization completed!');

  } catch (error) {
    console.error('Error initializing promo codes:', error);
  } finally {
    await mongoose.disconnect();
    logger.log('Disconnected from MongoDB');
  }
}

// Run the script
initPromoCodes(); 
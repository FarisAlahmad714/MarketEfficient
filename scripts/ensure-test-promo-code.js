require('dotenv').config();
const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');

async function ensureTestPromoCode() {
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

    // Check if TESTFREE already exists
    const existingCode = await PromoCode.findOne({ code: 'TESTFREE' });
    
    if (existingCode) {
      console.log('✅ TESTFREE promo code already exists');
      console.log('   - Description:', existingCode.description);
      console.log('   - Discount Type:', existingCode.discountType);
      console.log('   - Is Active:', existingCode.isActive);
      console.log('   - Current Uses:', existingCode.currentUses, '/', existingCode.maxUses);
    } else {
      // Create TESTFREE promo code
      const testFreeCode = new PromoCode({
        code: 'TESTFREE',
        type: 'preset',
        discountType: 'free_access',
        discountValue: 0,
        finalPrice: 0,
        description: 'Test Code - Free access for testing (100% off)',
        isActive: true,
        maxUses: 100, // Allow many uses for testing
        applicablePlans: ['monthly', 'annual', 'both'],
        createdBy: adminUser._id
      });

      await testFreeCode.save();
      console.log('✅ Created TESTFREE promo code successfully!');
    }

    // Also ensure other preset codes exist
    const presetCodes = [
      {
        code: 'WIZDOM',
        type: 'preset',
        discountType: 'fixed_amount',
        discountValue: 900, // $9 off
        finalPrice: 2000, // $20 final price
        description: 'WIZDOM Community Discount - $20 monthly subscription (30% off)',
        maxUses: 100,
        applicablePlans: ['monthly']
      },
      {
        code: 'FOXDEN',
        type: 'preset',
        discountType: 'fixed_amount',
        discountValue: 900, // $9 off
        finalPrice: 2000, // $20 final price
        description: 'FOXDEN Community Discount - $20 monthly subscription (30% off)',
        maxUses: 100,
        applicablePlans: ['monthly']
      },
      {
        code: 'FRIENDSFAMILY',
        type: 'preset',
        discountType: 'fixed_amount',
        discountValue: 1400, // $14 off
        finalPrice: 1500, // $15 final price
        description: 'Friends & Family Discount - $15 monthly subscription (48% off)',
        maxUses: 50,
        applicablePlans: ['monthly']
      }
    ];

    for (const codeData of presetCodes) {
      const existing = await PromoCode.findOne({ code: codeData.code });
      if (!existing) {
        const newCode = new PromoCode({
          ...codeData,
          createdBy: adminUser._id,
          isActive: true
        });
        await newCode.save();
        console.log(`✅ Created ${codeData.code} promo code`);
      } else {
        console.log(`✅ ${codeData.code} promo code already exists`);
      }
    }

    // Display all active promo codes
    console.log('\n📋 All active promo codes:');
    const allCodes = await PromoCode.find({ isActive: true });
    allCodes.forEach(code => {
      console.log(`- ${code.code}: ${code.description}`);
      console.log(`  Final Price: $${code.finalPrice ? (code.finalPrice / 100).toFixed(2) : 'Variable'}`);
      console.log(`  Uses: ${code.currentUses}/${code.maxUses}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

ensureTestPromoCode(); 
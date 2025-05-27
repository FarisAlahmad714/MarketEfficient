const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updatePromoCodes() {
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

    // Define the correct promo codes as per user requirements
    const correctPromoCodes = [
      {
        code: 'WIZDOM',
        type: 'preset',
        discountType: 'fixed_amount',
        discountValue: 900, // $9 off
        finalPrice: 2000, // $20 final price (30% off monthly)
        description: 'WIZDOM Community Discount - $20 monthly subscription (30% off)',
        maxUses: 1,
        applicablePlans: ['monthly']
      },
      {
        code: 'FOXDEN',
        type: 'preset',
        discountType: 'fixed_amount',
        discountValue: 900, // $9 off
        finalPrice: 2000, // $20 final price (30% off monthly)
        description: 'FOXDEN Community Discount - $20 monthly subscription (30% off)',
        maxUses: 1,
        applicablePlans: ['monthly']
      },
      {
        code: 'FRIENDSFAMILY',
        type: 'preset',
        discountType: 'fixed_amount',
        discountValue: 1400, // $14 off
        finalPrice: 1500, // $15 final price (48% off monthly)
        description: 'Friends & Family Discount - $15 monthly subscription (48% off)',
        maxUses: 1,
        applicablePlans: ['monthly']
      }
    ];

    console.log('\n🔄 Updating promo codes...');

    for (const codeData of correctPromoCodes) {
      try {
        // Check if code already exists
        const existingCode = await PromoCode.findOne({ code: codeData.code });
        
        if (existingCode) {
          // Update existing code
          await PromoCode.findOneAndUpdate(
            { code: codeData.code },
            {
              type: codeData.type,
              discountType: codeData.discountType,
              discountValue: codeData.discountValue,
              finalPrice: codeData.finalPrice,
              description: codeData.description,
              maxUses: codeData.maxUses,
              applicablePlans: codeData.applicablePlans,
              isActive: true,
              updatedAt: new Date()
            }
          );
          console.log(`✅ Updated existing code: ${codeData.code}`);
        } else {
          // Create new code
          const newCode = new PromoCode({
            ...codeData,
            createdBy: adminUser._id,
            isActive: true
          });
          await newCode.save();
          console.log(`✅ Created new code: ${codeData.code}`);
        }
      } catch (error) {
        console.error(`❌ Error processing code ${codeData.code}:`, error.message);
      }
    }

    // Display all existing promo codes
    const allCodes = await PromoCode.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log('\n📋 Current promo codes in database:');
    console.log('─'.repeat(80));
    
    allCodes.forEach(code => {
      const status = code.isActive ? '🟢 Active' : '🔴 Inactive';
      const usage = `${code.currentUses}/${code.maxUses}`;
      const finalPrice = code.finalPrice ? `$${code.finalPrice / 100}` : 'N/A';
      const originalPrice = '$29.00'; // Monthly price
      const discount = code.finalPrice ? Math.round(((2900 - code.finalPrice) / 2900) * 100) : 0;
      
      console.log(`${status} ${code.code}`);
      console.log(`  Description: ${code.description}`);
      console.log(`  Type: ${code.type} | Discount: ${code.discountType}`);
      console.log(`  Pricing: ${originalPrice} → ${finalPrice} (${discount}% off)`);
      console.log(`  Usage: ${usage} | Plans: ${code.applicablePlans.join(', ')}`);
      console.log(`  Created by: ${code.createdBy?.name || 'Unknown'} on ${code.createdAt.toLocaleDateString()}`);
      console.log('─'.repeat(40));
    });

    console.log('\n🎉 Promo code update completed!');
    console.log('\n📝 Summary:');
    console.log('• WIZDOM: $29 → $20 (30% off monthly)');
    console.log('• FOXDEN: $29 → $20 (30% off monthly)');
    console.log('• FRIENDSFAMILY: $29 → $15 (48% off monthly)');
    console.log('\n🔗 Admin can now manage these codes at: /admin/promo-codes');

  } catch (error) {
    console.error('Error updating promo codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updatePromoCodes(); 
// Script to remove TESTFREE promo code from database
const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const connectDB = require('../lib/database');

async function removeTestFreeCode() {
  try {
    await connectDB();
    
    // Find and delete TESTFREE code
    const result = await PromoCode.findOneAndDelete({ code: 'TESTFREE' });
    
    if (result) {
      console.log('✅ Successfully removed TESTFREE promo code');
      console.log('Removed code details:', {
        code: result.code,
        type: result.type,
        discountType: result.discountType,
        currentUses: result.currentUses,
        maxUses: result.maxUses
      });
    } else {
      console.log('ℹ️ TESTFREE promo code not found in database');
    }
    
    // Also check for any generated codes based on TESTFREE
    const generatedCodes = await PromoCode.find({ 
      code: { $regex: '^TESTFREE', $options: 'i' } 
    });
    
    if (generatedCodes.length > 0) {
      console.log(`\n⚠️ Found ${generatedCodes.length} codes starting with TESTFREE:`);
      for (const code of generatedCodes) {
        console.log(`- ${code.code} (type: ${code.type}, uses: ${code.currentUses}/${code.maxUses})`);
      }
      
      console.log('\nRemoving all TESTFREE-based codes...');
      const deleteResult = await PromoCode.deleteMany({ 
        code: { $regex: '^TESTFREE', $options: 'i' } 
      });
      console.log(`✅ Removed ${deleteResult.deletedCount} TESTFREE-based codes`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing TESTFREE code:', error);
    process.exit(1);
  }
}

removeTestFreeCode();
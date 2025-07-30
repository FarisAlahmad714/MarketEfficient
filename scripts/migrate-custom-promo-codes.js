// Migration script to convert custom promo codes to generated type
// This ensures all promo codes are either preset templates or generated from templates

const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const AdminAction = require('../models/AdminAction');
require('dotenv').config({ path: '.env.local' });

async function migrateCustomPromoCodes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all custom promo codes
    const customCodes = await PromoCode.find({ type: 'custom' });
    console.log(`Found ${customCodes.length} custom promo codes to migrate`);

    if (customCodes.length === 0) {
      console.log('No custom promo codes found. Migration complete.');
      return;
    }

    let migrated = 0;
    let failed = 0;

    for (const code of customCodes) {
      try {
        // Update type from 'custom' to 'generated'
        code.type = 'generated';
        
        // Ensure all required fields are properly set
        if (!code.finalPrice && code.discountType === 'fixed_amount') {
          // Calculate final price based on discount value
          // Assuming monthly price of 2900 cents ($29)
          code.finalPrice = Math.max(0, 2900 - code.discountValue);
        }

        // Add migration note to description
        code.description = `[Migrated from custom] ${code.description}`;

        await code.save();
        migrated++;
        console.log(`✅ Migrated code: ${code.code}`);

        // Log the migration
        await AdminAction.logAction({
          adminUserId: mongoose.Types.ObjectId('000000000000000000000000'), // System user
          action: 'promo_code_migrated',
          targetType: 'promo_code',
          targetId: code._id,
          targetIdentifier: code.code,
          description: `Migrated custom promo code ${code.code} to generated type`,
          details: {
            previousType: 'custom',
            newType: 'generated',
            reason: 'System migration - custom codes deprecated'
          },
          category: 'system',
          severity: 'low'
        });

      } catch (error) {
        console.error(`❌ Failed to migrate code ${code.code}:`, error.message);
        failed++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total custom codes found: ${customCodes.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Failed to migrate: ${failed}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateCustomPromoCodes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateCustomPromoCodes;
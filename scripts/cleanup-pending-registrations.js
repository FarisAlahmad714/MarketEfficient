// scripts/cleanup-pending-registrations.js - UPDATED VERSION
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function cleanupPendingRegistrations(options = {}) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import the model
    const PendingRegistration = require('../models/PendingRegistration');

    const { 
      forceAll = false, 
      includeRecent = true, // NEW: Include recent registrations
      maxAge = 5 // NEW: Clean registrations older than 5 minutes (instead of 30)
    } = options;

    let totalCleaned = 0;

    if (forceAll) {
      // Option to clean ALL pending registrations
      const allPending = await PendingRegistration.deleteMany({});
      console.log(`🔥 FORCE: Deleted ALL pending registrations: ${allPending.deletedCount}`);
      totalCleaned = allPending.deletedCount;
    } else {
      // 1. Clean up expired checkout sessions (older than specified age)
      const maxAgeMs = maxAge * 60 * 1000; // Convert minutes to milliseconds
      const cutoffTime = new Date(Date.now() - maxAgeMs);
      
      const expiredCheckouts = await PendingRegistration.deleteMany({
        status: 'checkout_started',
        checkoutStartedAt: { $lt: cutoffTime }
      });

      // 2. Clean up old pending registrations (using maxAge)
      const oldPending = await PendingRegistration.deleteMany({
        createdAt: { $lt: cutoffTime }
      });

      // 3. Clean up any with "expired" status
      const expiredStatus = await PendingRegistration.deleteMany({
        status: 'expired'
      });

      // 4. NEW: Clean recent registrations if includeRecent is true
      let recentCleaned = { deletedCount: 0 };
      if (includeRecent) {
        recentCleaned = await PendingRegistration.deleteMany({
          status: 'pending',
          createdAt: { $gte: cutoffTime } // Recent ones
        });
      }

      totalCleaned = expiredCheckouts.deletedCount + oldPending.deletedCount + expiredStatus.deletedCount + recentCleaned.deletedCount;

      console.log(`✅ Cleanup Results:`);
      console.log(`   - Expired checkouts: ${expiredCheckouts.deletedCount}`);
      console.log(`   - Old pending (>${maxAge}min): ${oldPending.deletedCount}`);
      console.log(`   - Expired status: ${expiredStatus.deletedCount}`);
      if (includeRecent) {
        console.log(`   - Recent pending (<${maxAge}min): ${recentCleaned.deletedCount}`);
      }
      console.log(`   - Total cleaned: ${totalCleaned}`);
    }

    // Show current stats
    const remaining = await PendingRegistration.countDocuments();
    console.log(`📊 Remaining pending registrations: ${remaining}`);

    if (remaining > 0) {
      const recentActivity = await PendingRegistration.find({
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }).sort({ createdAt: -1 });

      if (recentActivity.length > 0) {
        console.log('\n🕐 Recent Activity (Last hour):');
        recentActivity.forEach(reg => {
          const age = Math.floor((Date.now() - reg.createdAt.getTime()) / 60000);
          console.log(`   ${reg.email} - ${reg.status} (${age} min ago)`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed!');
    
    return { totalCleaned, remaining };
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  const forceAll = args.includes('--force-all');
  const conservativeMode = args.includes('--conservative');
  
  const options = {
    forceAll,
    includeRecent: !conservativeMode, // Don't clean recent if in conservative mode
    maxAge: conservativeMode ? 30 : 5  // 30 minutes if conservative, 5 minutes if not
  };

  console.log(`🧹 Running cleanup with options:`, options);
  cleanupPendingRegistrations(options);
}

module.exports = cleanupPendingRegistrations;
#!/usr/bin/env node

/**
 * Migration Script: Backfill Historical Quarterly Deposits
 * 
 * This script creates SandboxTransaction records for all historical quarterly deposits
 * that users have received but weren't previously recorded in transaction history.
 * 
 * Run with: node scripts/migrate-sandbox-deposits.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from multiple possible files
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import models
const SandboxPortfolio = require('../models/SandboxPortfolio');
const SandboxTransaction = require('../models/SandboxTransaction');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set. Check your .env.local file.');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Calculate historical deposit dates based on current data
const calculateHistoricalDepositDates = (portfolio) => {
  const depositDates = [];
  
  if (portfolio.topUpCount === 0) {
    return depositDates; // No historical deposits
  }
  
  // Start from the last known top-up date and work backwards
  let currentDate = portfolio.lastTopUpDate ? new Date(portfolio.lastTopUpDate) : new Date();
  
  // If no lastTopUpDate, estimate based on creation time
  if (!portfolio.lastTopUpDate) {
    currentDate = new Date(portfolio.createdAt);
    // Find the next quarter date from creation
    const currentMonth = currentDate.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const quarterStartDates = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    
    // Find next quarter date
    let nextQuarterMonth = quarterStartDates.find(month => month > currentMonth);
    if (!nextQuarterMonth) {
      nextQuarterMonth = 0; // January of next year
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    currentDate = new Date(currentDate.getFullYear(), nextQuarterMonth, 1);
  }
  
  // Generate historical dates by going back quarters
  for (let i = 0; i < portfolio.topUpCount; i++) {
    depositDates.unshift(new Date(currentDate));
    
    // Go back one quarter
    const month = currentDate.getMonth();
    if (month === 0) {
      currentDate.setMonth(9); // October
      currentDate.setFullYear(currentDate.getFullYear() - 1);
    } else if (month === 3) {
      currentDate.setMonth(0); // January
    } else if (month === 6) {
      currentDate.setMonth(3); // April
    } else if (month === 9) {
      currentDate.setMonth(6); // July
    }
  }
  
  return depositDates;
};

// Main migration function
const migrateHistoricalDeposits = async () => {
  console.log('🚀 Starting historical deposit migration...\n');
  
  try {
    // Get all portfolios with historical deposits
    const portfolios = await SandboxPortfolio.find({
      topUpCount: { $gt: 0 }
    }).populate('userId', 'username email');
    
    console.log(`📊 Found ${portfolios.length} portfolios with historical deposits\n`);
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    let errors = [];
    
    for (const portfolio of portfolios) {
      try {
        const userId = portfolio.userId._id;
        const username = portfolio.userId.username || portfolio.userId.email;
        
        console.log(`Processing: ${username} (${portfolio.topUpCount} deposits)`);
        
        // Check if transactions already exist for this user
        const existingTransactions = await SandboxTransaction.countDocuments({
          userId: userId,
          type: 'deposit',
          description: 'ChartSense Quarterly Deposit'
        });
        
        if (existingTransactions >= portfolio.topUpCount) {
          console.log(`  ⏭️  Skipped - already has ${existingTransactions} deposit records`);
          totalSkipped++;
          continue;
        }
        
        // Calculate historical deposit dates
        const depositDates = calculateHistoricalDepositDates(portfolio);
        
        if (depositDates.length === 0) {
          console.log(`  ⏭️  Skipped - no historical dates calculated`);
          totalSkipped++;
          continue;
        }
        
        // Create transaction records for each historical deposit
        let migratedCount = 0;
        let runningBalance = portfolio.initialBalance;
        
        for (let i = 0; i < depositDates.length; i++) {
          const depositDate = depositDates[i];
          const quarter = Math.floor(depositDate.getMonth() / 3) + 1;
          const year = depositDate.getFullYear();
          
          // Check if this specific deposit already exists
          const existingDeposit = await SandboxTransaction.findOne({
            userId: userId,
            type: 'deposit',
            description: 'ChartSense Quarterly Deposit',
            'metadata.quarter': quarter,
            'metadata.year': year
          });
          
          if (existingDeposit) {
            console.log(`    ⏭️  Q${quarter} ${year} already exists`);
            runningBalance += 10000; // Account for this deposit in balance calculation
            continue;
          }
          
          // Create historical transaction record
          const transaction = new SandboxTransaction({
            userId: userId,
            type: 'deposit',
            amount: 10000,
            description: 'ChartSense Quarterly Deposit',
            balanceBefore: runningBalance,
            balanceAfter: runningBalance + 10000,
            createdAt: depositDate,
            updatedAt: depositDate,
            metadata: {
              topUpCount: i + 1,
              quarter: quarter,
              year: year,
              migrated: true,
              migrationDate: new Date()
            }
          });
          
          await transaction.save();
          runningBalance += 10000;
          migratedCount++;
          
          console.log(`    ✅ Q${quarter} ${year} - ${depositDate.toDateString()}`);
        }
        
        console.log(`  🎯 Migrated ${migratedCount} historical deposits\n`);
        totalMigrated += migratedCount;
        
      } catch (error) {
        console.error(`  ❌ Error processing ${portfolio.userId.username || 'unknown'}:`, error.message);
        errors.push({
          userId: portfolio.userId._id,
          username: portfolio.userId.username || portfolio.userId.email,
          error: error.message
        });
      }
    }
    
    // Migration summary
    console.log('\n📈 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Total transactions migrated: ${totalMigrated}`);
    console.log(`⏭️  Portfolios skipped: ${totalSkipped}`);
    console.log(`❌ Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      errors.forEach(error => {
        console.log(`  - ${error.username}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    return {
      success: true,
      totalMigrated,
      totalSkipped,
      errors
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Dry run function to preview what would be migrated
const dryRunMigration = async () => {
  console.log('🔍 DRY RUN - Preview of migration...\n');
  
  const portfolios = await SandboxPortfolio.find({
    topUpCount: { $gt: 0 }
  }).populate('userId', 'username email');
  
  console.log(`📊 Found ${portfolios.length} portfolios with historical deposits\n`);
  
  for (const portfolio of portfolios) {
    const username = portfolio.userId.username || portfolio.userId.email;
    const depositDates = calculateHistoricalDepositDates(portfolio);
    
    console.log(`${username}:`);
    console.log(`  Top-up count: ${portfolio.topUpCount}`);
    console.log(`  Last top-up: ${portfolio.lastTopUpDate || 'Not recorded'}`);
    console.log(`  Calculated deposit dates:`);
    
    depositDates.forEach((date, index) => {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const year = date.getFullYear();
      console.log(`    ${index + 1}. Q${quarter} ${year} - ${date.toDateString()}`);
    });
    
    console.log('');
  }
  
  console.log('🔍 Dry run completed. No data was modified.');
};

// CLI interface
const main = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  const forceRun = args.includes('--force') || args.includes('-f');
  
  try {
    if (isDryRun) {
      await dryRunMigration();
    } else {
      if (!forceRun) {
        console.log('⚠️  This will modify your database. Run with --dry-run first to preview.');
        console.log('⚠️  Use --force to proceed with actual migration.\n');
        process.exit(0);
      }
      
      await migrateHistoricalDeposits();
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Export for use as API endpoint
module.exports = {
  migrateHistoricalDeposits,
  dryRunMigration,
  calculateHistoricalDepositDates
};

// Run if called directly
if (require.main === module) {
  main();
}
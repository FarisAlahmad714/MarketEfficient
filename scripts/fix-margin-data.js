// scripts/fix-margin-data.js
// Migration script to fix trades with missing or incorrect marginUsed data

const mongoose = require('mongoose');

// Connect to the database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-platform');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Define the schema (simplified)
const SandboxTradeSchema = new mongoose.Schema({}, { strict: false });
const SandboxTrade = mongoose.model('SandboxTrade', SandboxTradeSchema);

async function fixMarginData() {
  try {
    console.log('Starting margin data fix...');
    
    // Find all trades with missing or invalid marginUsed
    const trades = await SandboxTrade.find({
      $or: [
        { marginUsed: { $exists: false } },
        { marginUsed: null },
        { marginUsed: { $type: 'string' } }, // Sometimes stored as string
        { marginUsed: 0 },
        { marginUsed: NaN }
      ]
    });
    
    console.log(`Found ${trades.length} trades with margin issues`);
    
    let fixed = 0;
    
    for (const trade of trades) {
      try {
        // Calculate correct marginUsed
        const entryPrice = trade.entryPrice || 0;
        const quantity = trade.quantity || 0;
        const leverage = trade.leverage || 1;
        
        if (entryPrice > 0 && quantity > 0) {
          const positionValue = entryPrice * quantity;
          const marginUsed = positionValue / leverage;
          
          // Update the trade
          await SandboxTrade.findByIdAndUpdate(trade._id, {
            marginUsed: marginUsed
          });
          
          console.log(`Fixed trade ${trade._id}: marginUsed = ${marginUsed.toFixed(2)}`);
          fixed++;
        } else {
          console.log(`Skipped trade ${trade._id}: invalid data (entryPrice: ${entryPrice}, quantity: ${quantity})`);
        }
      } catch (error) {
        console.error(`Error fixing trade ${trade._id}:`, error);
      }
    }
    
    console.log(`Fixed ${fixed} trades`);
    
    // Verify the fix
    const remainingIssues = await SandboxTrade.find({
      $or: [
        { marginUsed: { $exists: false } },
        { marginUsed: null },
        { marginUsed: 0 }
      ],
      entryPrice: { $gt: 0 },
      quantity: { $gt: 0 }
    }).countDocuments();
    
    console.log(`Remaining issues: ${remainingIssues}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Migration complete');
  }
}

// Run the script
if (require.main === module) {
  connectDB().then(() => {
    fixMarginData();
  });
}

module.exports = { fixMarginData };
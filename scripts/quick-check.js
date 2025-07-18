// Quick check for history count
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function quickCheck() {
  try {
    // Direct connection
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const User = mongoose.models.User || require('../models/User');
    const SandboxTrade = mongoose.models.SandboxTrade || require('../models/SandboxTrade');
    const SandboxTransaction = mongoose.models.SandboxTransaction || require('../models/SandboxTransaction');
    
    // Find user
    const user = await User.findOne({ email: 'Support@chartsense.trade' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email}`);
    
    // Count closed trades
    const closedTrades = await SandboxTrade.countDocuments({
      userId: user._id,
      status: 'closed'
    });
    
    // Count transactions
    const transactions = await SandboxTransaction.countDocuments({
      userId: user._id
    });
    
    console.log(`\nDatabase counts:`);
    console.log(`- Closed trades: ${closedTrades}`);
    console.log(`- Transactions: ${transactions}`);
    console.log(`- Total: ${closedTrades + transactions}`);
    
    // Get what API would return (limited to 20 each)
    const apiTrades = await SandboxTrade.find({
      userId: user._id,
      status: 'closed'
    }).sort({ exitTime: -1 }).limit(20);
    
    const apiTransactions = await SandboxTransaction.find({
      userId: user._id
    }).sort({ createdAt: -1 }).limit(20);
    
    console.log(`\nAPI would return:`);
    console.log(`- Trades: ${apiTrades.length} (limited to 20)`);
    console.log(`- Transactions: ${apiTransactions.length} (limited to 20)`);
    console.log(`- History tab total: ${apiTrades.length + apiTransactions.length}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

quickCheck();
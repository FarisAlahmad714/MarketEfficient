// Script to check actual database counts for history tab
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkHistoryCounts() {
  try {
    // Connect directly to avoid module issues
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find your user ID
    const userEmail = process.env.USER_EMAIL || 'support@chartsense.trade';
    const user = await db.collection('users').findOne({ email: userEmail });
    
    if (!user) {
      console.log(`User not found with email: ${userEmail}`);
      process.exit(1);
    }
    
    console.log(`\nChecking history for user: ${user.email} (${user._id})`);
    console.log('='.repeat(60));
    
    // Count all closed trades
    const totalClosedTrades = await db.collection('sandboxtrades').countDocuments({
      userId: user._id,
      status: 'closed'
    });
    
    // Get recent 20 trades (what API returns)
    const recentTrades = await db.collection('sandboxtrades').find({
      userId: user._id,
      status: 'closed'
    })
    .sort({ exitTime: -1 })
    .limit(20)
    .toArray();
    
    // Count all transactions
    const totalTransactions = await db.collection('sandboxtransactions').countDocuments({
      userId: user._id
    });
    
    // Get recent 20 transactions (what API returns)
    const recentTransactions = await db.collection('sandboxtransactions').find({
      userId: user._id
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
    
    console.log('\nCLOSED TRADES:');
    console.log(`Total in database: ${totalClosedTrades}`);
    console.log(`Recent 20 trades returned by API:`);
    recentTrades.forEach((trade, i) => {
      console.log(`  ${i+1}. ${trade.symbol} - ${(trade.realizedPnL || 0).toFixed(2)} SENSES - ${trade.closeReason || 'manual'} - ${new Date(trade.exitTime).toLocaleDateString()}`);
    });
    
    console.log('\n\nTRANSACTIONS:');
    console.log(`Total in database: ${totalTransactions}`);
    console.log(`Recent 20 transactions returned by API:`);
    recentTransactions.forEach((tx, i) => {
      console.log(`  ${i+1}. ${tx.type} - ${(tx.amount || 0).toFixed(2)} SENSES - ${tx.description} - ${new Date(tx.createdAt).toLocaleDateString()}`);
    });
    
    console.log('\n\nHISTORY TAB SHOULD SHOW:');
    console.log(`${recentTrades.length} trades + ${recentTransactions.length} transactions = ${recentTrades.length + recentTransactions.length} total items`);
    
    if (recentTrades.length + recentTransactions.length === 21) {
      console.log('\n✓ This matches the "21" you\'re seeing in the UI!');
    }
    
    // Check for any open positions
    const openPositions = await db.collection('sandboxtrades').countDocuments({
      userId: user._id,
      status: 'open'
    });
    console.log(`\n\nOpen positions: ${openPositions}`);
    
    console.log('\n\nTOTAL IN DATABASE:');
    console.log(`Closed trades: ${totalClosedTrades}`);
    console.log(`Transactions: ${totalTransactions}`);
    console.log(`TOTAL HISTORY ITEMS: ${totalClosedTrades + totalTransactions}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkHistoryCounts();
// pages/api/sandbox/history.js
const { requireAuth } = require('../../../middleware/auth');
const { createApiHandler, composeMiddleware } = require('../../../lib/api-handler');
const connectDB = require('../../../lib/database');
const SandboxTrade = require('../../../models/SandboxTrade');
const SandboxTransaction = require('../../../models/SandboxTransaction');

async function historyHandler(req, res) {
  console.log('=== HISTORY API CALLED ===');
  console.log('User ID:', req.user?.id);
  
  try {
    await connectDB();
    
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log('History API - userId:', userId, 'page:', page, 'limit:', limit, 'skip:', skip);
    
    // Get total counts first
    let totalTrades = 0;
    let totalTransactions = 0;
    
    try {
      totalTrades = await SandboxTrade.countDocuments({ userId, status: 'closed' });
      totalTransactions = await SandboxTransaction.countDocuments({ userId });
      console.log('Counts successful - trades:', totalTrades, 'transactions:', totalTransactions);
    } catch (countError) {
      console.error('Count error:', countError);
      throw new Error('Failed to count documents: ' + countError.message);
    }
    
    // Get paginated trades
    let trades = [];
    try {
      trades = await SandboxTrade.find({ userId, status: 'closed' })
        .sort({ exitTime: -1 })
        .skip(skip)
        .limit(limit)
        .select('symbol side entryPrice exitPrice realizedPnL leverage entryTime exitTime duration pnlPercentage marginUsed quantity fees preTradeAnalysis closeReason')
        .lean();
      console.log('Trades fetched:', trades.length);
      if (trades.length > 0) {
        console.log('First trade sample:', JSON.stringify(trades[0], null, 2));
      }
    } catch (tradeError) {
      console.error('Trade fetch error:', tradeError);
      throw new Error('Failed to fetch trades: ' + tradeError.message);
    }
    
    // Get paginated transactions
    let transactions = [];
    try {
      transactions = await SandboxTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      console.log('Transactions fetched:', transactions.length);
    } catch (txError) {
      console.error('Transaction fetch error:', txError);
      throw new Error('Failed to fetch transactions: ' + txError.message);
    }
    
    // Combine and sort by date
    const allItems = [
      ...trades.map(trade => ({
        ...trade,
        id: trade._id,
        itemType: 'trade',
        date: trade.exitTime,
        displayTitle: trade.symbol,
        displaySubtitle: `${trade.side.toUpperCase()} ${trade.leverage > 1 ? `${trade.leverage}x` : ''}`,
        displayAmount: trade.realizedPnL,
        displayAmountFormatted: `${trade.realizedPnL >= 0 ? '+' : ''}${formatCurrency(trade.realizedPnL || 0)} SENSES`,
        entryReason: trade.preTradeAnalysis?.entryReason || null,
        closeReason: trade.closeReason || null
      })),
      ...transactions.map(tx => ({
        ...tx,
        id: tx._id,
        itemType: 'transaction',
        date: tx.createdAt,
        displayTitle: tx.description,
        displaySubtitle: tx.category,
        displayAmount: tx.amount,
        displayAmountFormatted: `${tx.amount >= 0 ? '+' : ''}${formatCurrency(tx.amount)} SENSES`
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log('Returning items:', allItems.length);
    if (allItems.length > 0 && allItems[0].itemType === 'trade') {
      console.log('First item has these fields:', Object.keys(allItems[0]));
    }
    
    res.status(200).json({
      success: true,
      data: allItems,
      pagination: {
        page,
        limit,
        totalTrades,
        totalTransactions,
        totalItems: totalTrades + totalTransactions,
        totalPages: Math.ceil((totalTrades + totalTransactions) / limit),
        hasMore: (totalTrades + totalTransactions) > (page * limit)
      }
    });
    
  } catch (error) {
    console.error('History API error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch history',
      message: error.message,
      details: error.toString()
    });
  }
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

module.exports = createApiHandler(
  composeMiddleware(requireAuth, historyHandler),
  { methods: ['GET'] }
);
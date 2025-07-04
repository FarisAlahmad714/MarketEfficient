import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';

export default async function handler(req, res) {
  console.log('🚀 FAST-TRADE API CALLED');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    console.log('⏱️ Starting at', startTime);
    
    // Simple auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Auth verified in', Date.now() - startTime, 'ms');
    
    await connectDB();
    console.log('📦 DB connected in', Date.now() - startTime, 'ms');
    
    const userId = decoded.userId;
    const { symbol, side, type, quantity, leverage = 1, preTradeAnalysis } = req.body;
    
    console.log('📋 Trade data:', { symbol, side, type, quantity, leverage });
    
    // Basic validation
    if (!symbol || !side || !type || !quantity || !preTradeAnalysis?.entryReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    console.log('✅ Validation passed in', Date.now() - startTime, 'ms');
    
    // Get portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId, unlocked: true });
    if (!portfolio) {
      return res.status(403).json({ error: 'Sandbox not unlocked' });
    }
    
    console.log('💰 Portfolio found in', Date.now() - startTime, 'ms');
    
    // Use simple fixed price (no external API call)
    const mockPrices = {
      'BTC': 108000,
      'ETH': 2500,
      'SOL': 147,
      'BNB': 653,
      'AAPL': 213,
      'TSLA': 315,
      'NVDA': 159,
      'GLD': 307
    };
    
    const currentPrice = mockPrices[symbol] || 100;
    console.log('💹 Price set in', Date.now() - startTime, 'ms');
    
    // Calculate position
    const positionValue = quantity * currentPrice * leverage;
    const marginUsed = quantity * currentPrice;
    const entryFee = positionValue * 0.001;
    
    // Check balance
    if (marginUsed > portfolio.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    console.log('🔢 Calculations done in', Date.now() - startTime, 'ms');
    
    // Determine asset type
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB'];
    const assetType = cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
    
    // Cap leverage at 3 for validation
    const cappedLeverage = Math.min(parseInt(leverage), 3);
    
    // Create trade
    const trade = new SandboxTrade({
      userId,
      portfolioId: portfolio._id,
      symbol: symbol.toUpperCase(),
      assetType,
      side,
      type,
      quantity: parseFloat(quantity),
      leverage: cappedLeverage,
      entryPrice: currentPrice,
      currentPrice: currentPrice,
      positionValue,
      marginUsed,
      status: 'open',
      entryTime: new Date(),
      fees: { entry: entryFee, exit: 0, total: entryFee },
      unrealizedPnL: 0,
      preTradeAnalysis: {
        entryReason: preTradeAnalysis.entryReason
      }
    });
    
    await trade.save();
    console.log('💾 Trade saved in', Date.now() - startTime, 'ms');
    
    // Update portfolio
    portfolio.balance -= entryFee;
    portfolio.totalTrades += 1;
    portfolio.lastTradeAt = new Date();
    await portfolio.save();
    
    console.log('🎯 Portfolio updated in', Date.now() - startTime, 'ms');
    
    const response = {
      success: true,
      trade: {
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        status: trade.status
      },
      portfolio: {
        balance: portfolio.balance
      }
    };
    
    console.log('✅ FAST-TRADE completed in', Date.now() - startTime, 'ms');
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ FAST-TRADE error:', error);
    return res.status(500).json({ error: 'Failed to place trade', details: error.message });
  }
}
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
const { SANDBOX_ASSETS } = require('../../../lib/sandbox-constants-data');

export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // Simple auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await connectDB();
    
    const userId = decoded.userId;
    const { symbol, side, type, quantity, leverage = 1, stopLoss, takeProfit, preTradeAnalysis } = req.body;
    
    
    // Basic validation
    if (!symbol || !side || !type || !quantity || !preTradeAnalysis?.entryReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    
    // Get portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId, unlocked: true });
    if (!portfolio) {
      return res.status(403).json({ error: 'Sandbox not unlocked' });
    }
    
    
    // Get real-time price using price simulator
    const { getPriceSimulator } = require('../../../lib/priceSimulation');
    const priceSimulator = getPriceSimulator();
    
    // Try to get real price from API first, fallback to simulated
    let currentPrice;
    try {
      currentPrice = await priceSimulator.getPriceAsync(symbol.toUpperCase());
    } catch (error) {
      // Fallback to synchronous simulated price
      currentPrice = priceSimulator.getPrice(symbol.toUpperCase());
    }
    
    if (!currentPrice || currentPrice <= 0) {
      return res.status(400).json({ error: 'Unable to fetch current market price' });
    }
    
    // Determine asset type first to get max leverage
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB'];
    const assetType = cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
    
    // Get asset-specific max leverage
    const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
    const asset = allAssets.find(a => a.symbol === symbol.toUpperCase());
    const maxLeverage = asset?.maxLeverage || 3; // Default to 3 if asset not found
    
    // Cap leverage at asset-specific maximum
    const cappedLeverage = Math.min(Number(leverage) || 1, maxLeverage);
    
    // Calculate position with capped leverage
    const positionValue = quantity * currentPrice * cappedLeverage;
    const marginUsed = quantity * currentPrice;
    const entryFee = positionValue * 0.001;
    
    // Check balance
    if (marginUsed > portfolio.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
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
        entryReason: preTradeAnalysis?.entryReason || ''
      },
      stopLoss: stopLoss ? { price: parseFloat(stopLoss), type: 'stop_loss' } : null,
      takeProfit: takeProfit ? { price: parseFloat(takeProfit), type: 'take_profit' } : null
    });
    
    await trade.save();
    
    // Update portfolio
    portfolio.balance -= entryFee;
    portfolio.totalTrades += 1;
    portfolio.lastTradeAt = new Date();
    await portfolio.save();
    
    
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
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error in place-trade-fast:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Failed to place trade', details: error.message });
  }
}
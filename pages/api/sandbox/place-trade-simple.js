// Minimal working place-trade API
import { requireAuth } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    
    await connectDB();
    
    const userId = req.user.id;
    const { symbol, side, type, quantity, leverage = 1 } = req.body;
    
    
    // Get portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId, unlocked: true });
    if (!portfolio) {
      return res.status(403).json({ error: 'Sandbox not unlocked' });
    }
    
    
    // Simple validation
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    // Mock price (replace with real price later)
    const currentPrice = symbol === 'BTC' ? 107000 : 100;
    const positionValue = quantity * currentPrice * leverage;
    
    if (positionValue > portfolio.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    
    // Create trade
    const trade = new SandboxTrade({
      userId,
      portfolioId: portfolio._id,
      symbol: symbol.toUpperCase(),
      side,
      type,
      quantity: parseFloat(quantity),
      leverage: parseInt(leverage),
      entryPrice: currentPrice,
      currentPrice: currentPrice,
      positionValue,
      marginUsed: positionValue / leverage,
      status: 'open',
      entryTime: new Date(),
      fees: { entry: positionValue * 0.001, exit: 0, total: positionValue * 0.001 },
      unrealizedPnL: 0
    });
    
    await trade.save();
    
    // Update portfolio
    portfolio.balance -= trade.fees.total;
    portfolio.totalTrades += 1;
    portfolio.lastTradeAt = new Date();
    await portfolio.save();
    
    
    return res.status(200).json({
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
    });
    
  } catch (error) {
    return res.status(500).json({ error: 'Failed to place trade', details: error.message });
  }
}

export default requireAuth(handler);
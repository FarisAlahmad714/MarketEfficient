// pages/api/sandbox/update-trade.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxTrade from '../../../models/SandboxTrade';
import stopLossMonitor from '../../../lib/sandbox-stop-loss-monitor';

async function updateTradeHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const { tradeId, stopLoss, takeProfit } = req.body;

  try {
    // Validate required fields
    if (!tradeId) {
      return res.status(400).json({ 
        error: 'Missing trade ID',
        message: 'Trade ID is required to update position' 
      });
    }

    // Find the trade
    const trade = await SandboxTrade.findOne({ 
      _id: tradeId, 
      userId,
      status: 'open' 
    });

    if (!trade) {
      return res.status(404).json({ 
        error: 'Trade not found',
        message: 'Trade not found or already closed' 
      });
    }

    // Build update object
    const updateData = {};

    if (stopLoss !== null && stopLoss !== undefined && !isNaN(stopLoss) && stopLoss > 0) {
      // Update the entire stopLoss object to avoid MongoDB error when stopLoss is null
      updateData.stopLoss = { price: parseFloat(stopLoss) };
    }

    if (takeProfit !== null && takeProfit !== undefined && !isNaN(takeProfit) && takeProfit > 0) {
      // Update the entire takeProfit object to avoid MongoDB error when takeProfit is null
      updateData.takeProfit = { price: parseFloat(takeProfit) };
    }

    // Update the trade
    const updatedTrade = await SandboxTrade.findByIdAndUpdate(
      tradeId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedTrade) {
      return res.status(500).json({ 
        error: 'Update failed',
        message: 'Failed to update trade in database' 
      });
    }

    // Force immediate check of this position for SL/TP
    setTimeout(async () => {
      try {
        await stopLossMonitor.checkAllOpenTrades();
      } catch (error) {
        // Silent fail - monitor will check again on next interval
      }
    }, 1000); // Small delay to ensure DB update is propagated

    res.status(200).json({
      success: true,
      message: 'Trade updated successfully',
      trade: {
        id: updatedTrade._id,
        symbol: updatedTrade.symbol,
        side: updatedTrade.side,
        stopLoss: updatedTrade.stopLoss,
        takeProfit: updatedTrade.takeProfit
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, updateTradeHandler),
  { methods: ['PUT'] }
);
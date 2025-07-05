// pages/api/sandbox/cancel-order.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';

async function cancelOrderHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const { orderId } = req.body;

  try {
    // Validate required fields
    if (!orderId) {
      return res.status(400).json({ 
        error: 'Missing order ID',
        message: 'Order ID is required to cancel order' 
      });
    }

    // Find the pending order
    const order = await SandboxTrade.findOne({ 
      _id: orderId, 
      userId, 
      status: 'pending' 
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'Order not found or already executed/cancelled' 
      });
    }

    // Get user's portfolio
    const portfolio = await SandboxPortfolio.findOne({ 
      _id: order.portfolioId,
      userId 
    });

    if (!portfolio) {
      return res.status(404).json({ 
        error: 'Portfolio not found',
        message: 'Associated portfolio not found' 
      });
    }

    // Cancel the order
    order.status = 'cancelled';
    order.closeReason = 'cancelled';
    order.exitTime = new Date();
    
    await order.save();

    // Release the reserved margin back to available balance
    // (For pending orders, margin was reserved but not deducted)
    // No balance change needed since pending orders don't affect balance

    const response = {
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        limitPrice: order.limitPrice,
        status: order.status,
        cancelledAt: order.exitTime
      },
      portfolio: {
        balance: portfolio.balance,
        availableMargin: portfolio.balance // All balance is available since order was cancelled
      }
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to cancel order',
      message: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, cancelOrderHandler),
  { methods: ['POST'] }
);
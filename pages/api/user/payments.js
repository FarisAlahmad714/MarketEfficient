import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Payment from '../../../models/Payment';
import connectDB from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's payment history
    const payments = await Payment.find({ 
      userId: user._id 
    })
    .sort({ createdAt: -1 })
    .limit(50) // Limit to last 50 payments
    .select('amount currency status description stripePaymentIntentId createdAt metadata');

    const paymentHistory = payments.map(payment => ({
      id: payment._id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: payment.description || 'Subscription Payment',
      stripePaymentIntentId: payment.stripePaymentIntentId,
      createdAt: payment.createdAt,
      metadata: payment.metadata
    }));

    res.status(200).json({
      payments: paymentHistory,
      total: paymentHistory.length
    });

  } catch (error) {
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch payment history',
      details: error.message 
    });
  }
} 
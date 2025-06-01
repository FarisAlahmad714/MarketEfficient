// pages/api/health.js
import connectDB from '../../lib/database';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check database connection
    await connectDB();
    const dbState = mongoose.connection.readyState;
    health.database = {
      status: dbState === 1 ? 'connected' : 'disconnected',
      readyState: dbState
    };

    // Check Stripe (non-blocking)
    if (process.env.STRIPE_SECRET_KEY) {
      health.stripe = { status: 'configured' };
    }

    // Check email service (non-blocking)
    if (process.env.MAILJET_API_KEY) {
      health.email = { status: 'configured' };
    }

    res.status(200).json(health);
  } catch (error) {
    health.status = 'error';
    health.error = {
      message: error.message,
      database: 'disconnected'
    };
    res.status(503).json(health);
  }
}
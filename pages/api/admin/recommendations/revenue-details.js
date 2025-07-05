import connectDB from '../../../../lib/database';
import Payment from '../../../../models/Payment';
import { requireAdmin } from '../../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

    // Get current month and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month revenue
    const currentMonthPayments = await Payment.find({
      createdAt: { $gte: currentMonthStart },
      status: 'succeeded'
    }).select('amount currency createdAt');

    // Get previous month revenue
    const previousMonthPayments = await Payment.find({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
      status: 'succeeded'
    }).select('amount currency createdAt');

    // Calculate totals (assuming amounts are in cents)
    const currentRevenue = currentMonthPayments.reduce((sum, payment) => {
      return sum + (payment.amount / 100); // Convert from cents to dollars
    }, 0);

    const previousRevenue = previousMonthPayments.reduce((sum, payment) => {
      return sum + (payment.amount / 100); // Convert from cents to dollars
    }, 0);

    // Calculate percentage change
    let revenueChange = 0;
    if (previousRevenue > 0) {
      revenueChange = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10;
    } else if (currentRevenue > 0) {
      revenueChange = 100; // 100% increase if no previous revenue
    }

    // Daily breakdown for current month
    const dailyRevenue = {};
    currentMonthPayments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += payment.amount / 100;
    });

    // Revenue by currency
    const currencyBreakdown = {};
    [...currentMonthPayments, ...previousMonthPayments].forEach(payment => {
      const currency = payment.currency || 'USD';
      if (!currencyBreakdown[currency]) {
        currencyBreakdown[currency] = { current: 0, previous: 0 };
      }
    });

    currentMonthPayments.forEach(payment => {
      const currency = payment.currency || 'USD';
      currencyBreakdown[currency].current += payment.amount / 100;
    });

    previousMonthPayments.forEach(payment => {
      const currency = payment.currency || 'USD';
      currencyBreakdown[currency].previous += payment.amount / 100;
    });

    // Generate insights
    const insights = [];
    
    if (revenueChange > 0) {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        description: `Revenue increased by ${revenueChange}% compared to last month`
      });
      
      if (revenueChange > 20) {
        insights.push({
          type: 'opportunity',
          title: 'Scale Marketing',
          description: 'Consider increasing marketing spend to capitalize on this growth trend'
        });
      }
    } else if (revenueChange < 0) {
      insights.push({
        type: 'warning',
        title: 'Revenue Decline',
        description: `Revenue decreased by ${Math.abs(revenueChange)}% compared to last month`
      });
      
      insights.push({
        type: 'action',
        title: 'Retention Strategy',
        description: 'Consider implementing user retention campaigns and reviewing pricing'
      });
    }

    if (currentMonthPayments.length > previousMonthPayments.length) {
      insights.push({
        type: 'positive',
        title: 'More Transactions',
        description: `${currentMonthPayments.length - previousMonthPayments.length} more transactions this month`
      });
    }

    res.status(200).json({
      currentRevenue: Math.round(currentRevenue * 100) / 100,
      previousRevenue: Math.round(previousRevenue * 100) / 100,
      revenueChange,
      transactions: {
        current: currentMonthPayments.length,
        previous: previousMonthPayments.length
      },
      dailyRevenue,
      currencyBreakdown,
      insights,
      period: {
        current: {
          start: currentMonthStart.toISOString(),
          end: now.toISOString()
        },
        previous: {
          start: previousMonthStart.toISOString(),
          end: previousMonthEnd.toISOString()
        }
      }
    });

      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch revenue details' });
      } finally {
        resolve();
      }
    });
  });
}
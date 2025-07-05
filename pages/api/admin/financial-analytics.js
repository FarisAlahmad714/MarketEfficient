// pages/api/admin/financial-analytics.js - Comprehensive Financial Analytics
import { requireAdmin } from '../../../middleware/auth';
import PaymentHistory from '../../../models/PaymentHistory';
import Subscription from '../../../models/Subscription';
import PromoCode from '../../../models/PromoCode';
import User from '../../../models/User';
import connectDB from '../../../lib/database';
import { startOfMonth, subMonths, startOfWeek, startOfDay, subDays } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        const now = new Date();
        const currentMonth = startOfMonth(now);
        const lastMonth = subMonths(currentMonth, 1);
        const last3Months = subMonths(currentMonth, 3);
        const last7Days = subDays(now, 7);
        const last30Days = subDays(now, 30);

        // 1. REVENUE METRICS
        
        // Current month revenue
        const currentMonthRevenue = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'succeeded',
              createdAt: { $gte: currentMonth },
              amount: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);

        // Last month revenue
        const lastMonthRevenue = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'succeeded',
              createdAt: { $gte: lastMonth, $lt: currentMonth },
              amount: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);

        // Last 7 days revenue trend
        const last7DaysRevenue = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'succeeded',
              createdAt: { $gte: last7Days },
              amount: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              revenue: { $sum: '$amount' },
              transactions: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]);

        // Monthly revenue trend (last 6 months)
        const monthlyRevenueTrend = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'succeeded',
              createdAt: { $gte: subMonths(now, 6) },
              amount: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$amount' },
              transactions: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 2. SUBSCRIPTION ANALYTICS

        // Active subscriptions breakdown
        const subscriptionBreakdown = await Subscription.aggregate([
          {
            $match: {
              status: { $in: ['active', 'trialing'] }
            }
          },
          {
            $group: {
              _id: '$plan',
              count: { $sum: 1 },
              totalRevenue: { $sum: '$amount' }
            }
          }
        ]);

        // Subscription churn analysis
        const churnAnalysis = await Subscription.aggregate([
          {
            $match: {
              status: 'canceled',
              updatedAt: { $gte: last30Days }
            }
          },
          {
            $group: {
              _id: '$plan',
              churned: { $sum: 1 },
              lostRevenue: { $sum: '$amount' }
            }
          }
        ]);

        // 3. PROMO CODE PERFORMANCE

        // Most used promo codes
        const promoPerformance = await PromoCode.aggregate([
          {
            $match: {
              usedCount: { $gt: 0 }
            }
          },
          {
            $project: {
              code: 1,
              usedCount: 1,
              maxUses: 1,
              discountType: 1,
              discountValue: 1,
              estimatedDiscount: {
                $cond: {
                  if: { $eq: ['$discountType', 'percentage'] },
                  then: { $multiply: ['$usedCount', '$discountValue', 10] }, // Estimate
                  else: { $multiply: ['$usedCount', '$discountValue'] }
                }
              }
            }
          },
          { $sort: { usedCount: -1 } },
          { $limit: 10 }
        ]);

        // 4. PAYMENT FAILURE ANALYSIS

        const paymentFailures = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'failed',
              createdAt: { $gte: last30Days }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              failures: { $sum: 1 },
              lostRevenue: { $sum: '$amount' }
            }
          },
          { $sort: { '_id': 1 } }
        ]);

        // 5. CUSTOMER LIFETIME VALUE

        const customerMetrics = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'succeeded',
              amount: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: '$userId',
              totalSpent: { $sum: '$amount' },
              transactionCount: { $sum: 1 },
              firstPayment: { $min: '$createdAt' },
              lastPayment: { $max: '$createdAt' }
            }
          },
          {
            $group: {
              _id: null,
              avgLifetimeValue: { $avg: '$totalSpent' },
              avgTransactionsPerUser: { $avg: '$transactionCount' },
              totalCustomers: { $sum: 1 }
            }
          }
        ]);

        // 6. CONVERSION FUNNEL

        const totalUsers = await User.countDocuments({ isVerified: true });
        const paidUsers = await PaymentHistory.distinct('userId', { 
          status: 'succeeded', 
          amount: { $gt: 0 } 
        });
        const activeSubscribers = await Subscription.countDocuments({
          status: { $in: ['active', 'trialing'] }
        });

        // 7. FINANCIAL HEALTH INDICATORS

        const currentMonthTotal = currentMonthRevenue[0]?.total || 0;
        const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
        const monthOverMonthGrowth = lastMonthTotal > 0 
          ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
          : 0;

        const totalRevenue = await PaymentHistory.aggregate([
          {
            $match: {
              status: 'succeeded',
              amount: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);

        // Calculate average order value
        const avgOrderValue = totalRevenue[0]?.count > 0 
          ? totalRevenue[0].total / totalRevenue[0].count 
          : 0;

        // Response
        res.status(200).json({
          // Revenue Overview
          revenue: {
            currentMonth: currentMonthTotal / 100, // Convert cents to dollars
            lastMonth: lastMonthTotal / 100,
            monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 100) / 100,
            totalRevenue: (totalRevenue[0]?.total || 0) / 100,
            totalTransactions: totalRevenue[0]?.count || 0,
            avgOrderValue: avgOrderValue / 100,
            last7DaysTrend: last7DaysRevenue.map(day => ({
              date: day._id,
              revenue: day.revenue / 100,
              transactions: day.transactions
            })),
            monthlyTrend: monthlyRevenueTrend.map(month => ({
              month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
              revenue: month.revenue / 100,
              transactions: month.transactions
            }))
          },

          // Subscription Analytics
          subscriptions: {
            breakdown: subscriptionBreakdown.map(sub => ({
              plan: sub._id,
              count: sub.count,
              revenue: sub.totalRevenue / 100
            })),
            churn: churnAnalysis.map(churn => ({
              plan: churn._id,
              churned: churn.churned,
              lostRevenue: churn.lostRevenue / 100
            })),
            active: activeSubscribers,
            conversionRate: totalUsers > 0 ? (paidUsers.length / totalUsers * 100).toFixed(2) : 0
          },

          // Promo Analytics
          promos: {
            topPerforming: promoPerformance.map(promo => ({
              code: promo.code,
              used: promo.usedCount,
              maxUses: promo.maxUses,
              utilizationRate: promo.maxUses > 0 ? (promo.usedCount / promo.maxUses * 100).toFixed(1) : 'Unlimited',
              estimatedDiscount: promo.estimatedDiscount / 100
            }))
          },

          // Customer Analytics
          customers: {
            total: totalUsers,
            paying: paidUsers.length,
            avgLifetimeValue: (customerMetrics[0]?.avgLifetimeValue || 0) / 100,
            avgTransactionsPerUser: Math.round(customerMetrics[0]?.avgTransactionsPerUser || 0),
            conversionRate: totalUsers > 0 ? (paidUsers.length / totalUsers * 100).toFixed(2) : 0
          },

          // Payment Health
          paymentHealth: {
            failureRate: paymentFailures.length > 0 ? 'See failures array' : '0%',
            recentFailures: paymentFailures.map(failure => ({
              date: failure._id,
              failures: failure.failures,
              lostRevenue: failure.lostRevenue / 100
            }))
          },

          // Meta
          lastUpdated: now.toISOString(),
          dataSource: 'local-database'
        });

      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to fetch financial analytics',
          message: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}
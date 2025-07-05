// pages/api/cron/email-automation.js - Combined email automation for Hobby plan
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { sendMetricsEmail, sendInactiveUserReminder } from '../../../lib/email-service';
import { getUserMetrics, getInactiveUsers } from '../../../lib/user-service';

export default async function handler(req, res) {
  // Only allow GET requests for cron jobs
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate cron secret for security
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDB();
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = today.getDate();
    
    
    const results = {
      weeklyMetrics: null,
      monthlyMetrics: null,
      inactiveReminders: null
    };
    
    // Sunday (0) - Weekly Metrics
    if (dayOfWeek === 0) {
      results.weeklyMetrics = await runWeeklyMetrics();
    }
    
    // 1st of month - Monthly Metrics + Quarterly Sandbox Deposits
    if (dayOfMonth === 1) {
      results.monthlyMetrics = await runMonthlyMetrics();
      
      // Check if this is a quarter start month (Jan=0, Apr=3, Jul=6, Oct=9)
      const currentMonth = today.getMonth();
      if ([0, 3, 6, 9].includes(currentMonth)) {
        results.sandboxDeposits = await runQuarterlySandboxDeposits();
      }
    }
    
    // Monday (1) - Inactive Reminders
    if (dayOfWeek === 1) {
      results.inactiveReminders = await runInactiveReminders();
    }
    
    // If no tasks ran today
    if (!results.weeklyMetrics && !results.monthlyMetrics && !results.inactiveReminders) {
      return res.status(200).json({
        message: 'No email tasks scheduled for today',
        day: dayOfWeek,
        date: dayOfMonth,
        nextTasks: getNextScheduledTasks(dayOfWeek, dayOfMonth)
      });
    }
    
    return res.status(200).json({
      message: 'Email automation cron job completed',
      results,
      executedOn: today.toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Cron job failed',
      message: error.message 
    });
  }
}

async function runWeeklyMetrics() {
  try {
    const users = await User.find({ 
      isVerified: true,
      'notifications.email': { $ne: false }
    });
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'weekly');
        
        if (metrics.testsTaken > 0) {
          await sendMetricsEmail(user, metrics, 'weekly');
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        errors.push({ email: user.email, error: error.message });
      }
    }
    
    return {
      type: 'weekly-metrics',
      totalUsers: users.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 3)
    };
    
  } catch (error) {
    return {
      type: 'weekly-metrics',
      error: error.message
    };
  }
}

async function runMonthlyMetrics() {
  try {
    const users = await User.find({ 
      isVerified: true,
      'notifications.email': { $ne: false }
    });
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'monthly');
        
        if (metrics.testsTaken > 0) {
          await sendMetricsEmail(user, metrics, 'monthly');
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        errors.push({ email: user.email, error: error.message });
      }
    }
    
    return {
      type: 'monthly-metrics',
      totalUsers: users.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 3)
    };
    
  } catch (error) {
    return {
      type: 'monthly-metrics',
      error: error.message
    };
  }
}

async function runInactiveReminders() {
  try {
    const inactiveUsers = await getInactiveUsers(30);
    const eligibleUsers = inactiveUsers.filter(user => user.notifications?.email !== false);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const user of eligibleUsers) {
      try {
        await sendInactiveUserReminder(user);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        errors.push({ email: user.email, error: error.message });
      }
    }
    
    return {
      type: 'inactive-reminders',
      totalInactive: inactiveUsers.length,
      eligibleUsers: eligibleUsers.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 3)
    };
    
  } catch (error) {
    return {
      type: 'inactive-reminders',
      error: error.message
    };
  }
}

function getNextScheduledTasks(currentDay, currentDate) {
  const tasks = [];
  
  // Next Sunday for weekly metrics
  const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay;
  tasks.push(`Weekly Metrics: in ${daysUntilSunday} days (Sunday)`);
  
  // Next Monday for inactive reminders  
  const daysUntilMonday = currentDay <= 1 ? (1 - currentDay) : (8 - currentDay);
  if (daysUntilMonday > 0) {
    tasks.push(`Inactive Reminders: in ${daysUntilMonday} days (Monday)`);
  }
  
  // Next 1st of month for monthly metrics
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  const daysUntilFirstOfMonth = Math.ceil((nextMonth - new Date()) / (1000 * 60 * 60 * 24));
  tasks.push(`Monthly Metrics: in ${daysUntilFirstOfMonth} days (1st of month)`);
  
  return tasks;
}

async function runQuarterlySandboxDeposits() {
  try {
    const SandboxPortfolio = require('../../../models/SandboxPortfolio');
    const SandboxTransaction = require('../../../models/SandboxTransaction');
    const { sendSandboxDepositNotification } = require('../../../lib/email-service');
    
    // Find all users with sandbox portfolios
    const portfolios = await SandboxPortfolio.find({}).populate('userId');
    
    let successCount = 0;
    let errorCount = 0;
    let depositCount = 0;
    const errors = [];
    
    for (const portfolio of portfolios) {
      try {
        const user = portfolio.userId;
        if (!user || !user.isVerified || user.notifications?.email === false) {
          continue;
        }
        
        // Check if quarterly top-up is due
        if (portfolio.isTopUpDue()) {
          // Perform the deposit
          portfolio.performQuarterlyTopUp();
          await portfolio.save();
          depositCount++;
          
          // Create transaction record for trading history
          await SandboxTransaction.create({
            userId: user._id,
            type: 'deposit',
            amount: 10000,
            description: 'ChartSense Quarterly Deposit',
            balanceBefore: portfolio.balance - 10000,
            balanceAfter: portfolio.balance,
            metadata: {
              topUpCount: portfolio.topUpCount,
              quarter: Math.floor(new Date().getMonth() / 3) + 1,
              year: new Date().getFullYear()
            }
          });
          
          // Send email notification
          await sendSandboxDepositNotification(user, {
            amount: 10000,
            newBalance: portfolio.balance,
            quarter: Math.floor(new Date().getMonth() / 3) + 1,
            year: new Date().getFullYear()
          });
          
        }
        
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        errors.push({ portfolioId: portfolio._id, error: error.message });
      }
    }
    
    return {
      type: 'quarterly-sandbox-deposits',
      totalPortfolios: portfolios.length,
      successCount,
      errorCount,
      depositsProcessed: depositCount,
      errors: errors.slice(0, 3)
    };
    
  } catch (error) {
    return {
      type: 'quarterly-sandbox-deposits',
      error: error.message
    };
  }
}
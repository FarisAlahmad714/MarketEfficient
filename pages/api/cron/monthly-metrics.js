// pages/api/cron/monthly-metrics.js - Monthly metrics cron job
import { authenticate } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { sendMetricsEmail } from '../../../lib/email-service';
import { getUserMetrics } from '../../../lib/user-service';

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
    
    console.log('Starting monthly metrics cron job...');
    
    // Get all verified users with email notifications enabled
    const users = await User.find({ 
      isVerified: true,
      'notifications.email': { $ne: false }
    });
    
    console.log(`Found ${users.length} eligible users for monthly metrics`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'monthly');
        
        // Only send email if user has taken tests this month
        if (metrics.testsTaken > 0) {
          await sendMetricsEmail(user, metrics, 'monthly');
          successCount++;
          console.log(`Sent monthly metrics to ${user.email}`);
        } else {
          console.log(`Skipped ${user.email} - no tests taken this month`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error sending monthly metrics to ${user.email}:`, error);
        errorCount++;
        errors.push({ email: user.email, error: error.message });
      }
    }
    
    console.log(`Monthly metrics cron completed: ${successCount} sent, ${errorCount} errors`);
    
    return res.status(200).json({
      message: 'Monthly metrics cron job completed',
      totalUsers: users.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 5) // Return first 5 errors
    });
    
  } catch (error) {
    console.error('Monthly metrics cron error:', error);
    return res.status(500).json({ 
      error: 'Cron job failed',
      message: error.message 
    });
  }
}
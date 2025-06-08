// pages/api/cron/weekly-metrics.js - Weekly metrics cron job
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
    
    console.log('Starting weekly metrics cron job...');
    
    // Get all verified users with email notifications enabled
    const users = await User.find({ 
      isVerified: true,
      'notifications.email': { $ne: false }
    });
    
    console.log(`Found ${users.length} eligible users for weekly metrics`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'weekly');
        
        // Only send email if user has taken tests this week
        if (metrics.testsTaken > 0) {
          await sendMetricsEmail(user, metrics, 'weekly');
          successCount++;
          console.log(`Sent weekly metrics to ${user.email}`);
        } else {
          console.log(`Skipped ${user.email} - no tests taken this week`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error sending weekly metrics to ${user.email}:`, error);
        errorCount++;
        errors.push({ email: user.email, error: error.message });
      }
    }
    
    console.log(`Weekly metrics cron completed: ${successCount} sent, ${errorCount} errors`);
    
    return res.status(200).json({
      message: 'Weekly metrics cron job completed',
      totalUsers: users.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 5) // Return first 5 errors
    });
    
  } catch (error) {
    console.error('Weekly metrics cron error:', error);
    return res.status(500).json({ 
      error: 'Cron job failed',
      message: error.message 
    });
  }
}
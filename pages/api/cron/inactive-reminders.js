// pages/api/cron/inactive-reminders.js - Inactive user reminders cron job
import { authenticate } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import { sendInactiveUserReminder } from '../../../lib/email-service';
import { getInactiveUsers } from '../../../lib/user-service';

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
    
    
    // Get users who haven't been active for 30 days
    const inactiveUsers = await getInactiveUsers(30);
    
    // Filter users who have email notifications enabled
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
    
    
    return res.status(200).json({
      message: 'Inactive reminders cron job completed',
      totalInactive: inactiveUsers.length,
      eligibleUsers: eligibleUsers.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 5) // Return first 5 errors
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Cron job failed',
      message: error.message 
    });
  }
}
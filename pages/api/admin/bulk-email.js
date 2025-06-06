// pages/api/admin/bulk-email.js - Bulk Email Sending API
import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import AdminAction from '../../../models/AdminAction';
import connectDB from '../../../lib/database';
import { sendBulkEmail as sendEmailService } from '../../../lib/email-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        const { subject, message, userGroup, scheduledFor } = req.body;
        const adminUser = req.user;

        if (!subject || !message) {
          return res.status(400).json({ error: 'Subject and message are required' });
        }

        // Build user query based on selected group
        let userQuery = { isVerified: true };
        
        switch (userGroup) {
          case 'subscribers':
            const activeSubscriberIds = await Subscription.distinct('userId', {
              status: { $in: ['active', 'trialing'] }
            });
            userQuery._id = { $in: activeSubscriberIds };
            break;
          
          case 'free':
            const subscriberIds = await Subscription.distinct('userId');
            userQuery._id = { $nin: subscriberIds };
            break;
          
          case 'inactive':
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            userQuery.lastLoginAt = { $lt: thirtyDaysAgo };
            break;
          
          case 'all':
          default:
            // Keep default query
            break;
        }

        // Get target users
        const targetUsers = await User.find(userQuery, 'email name').lean();
        
        if (targetUsers.length === 0) {
          return res.status(400).json({ error: 'No users found matching the criteria' });
        }

        // Limit to prevent spam (max 1000 users per bulk email)
        const limitedUsers = targetUsers.slice(0, 1000);
        
        let sentCount = 0;
        let failedCount = 0;
        const errors = [];

        // Send emails in batches
        const batchSize = 50;
        for (let i = 0; i < limitedUsers.length; i += batchSize) {
          const batch = limitedUsers.slice(i, i + batchSize);
          
          for (const user of batch) {
            try {
              await sendEmailService({
                to: user.email,
                subject: subject,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Hello ${user.name || 'User'},</h2>
                    <div style="line-height: 1.6; color: #555;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #888;">
                      This email was sent from MarketEfficient Admin Panel.<br>
                      If you no longer wish to receive these emails, please contact support.
                    </p>
                  </div>
                `,
                text: `Hello ${user.name || 'User'},\n\n${message}\n\n---\nThis email was sent from MarketEfficient Admin Panel.`
              });
              sentCount++;
            } catch (error) {
              failedCount++;
              errors.push({ email: user.email, error: error.message });
            }
          }

          // Small delay between batches to avoid rate limiting
          if (i + batchSize < limitedUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Log admin action
        await AdminAction.logAction({
          adminUserId: adminUser._id,
          action: 'email_sent',
          targetType: 'bulk',
          description: `Sent bulk email to ${userGroup} users: "${subject}"`,
          details: {
            emailType: 'bulk',
            userGroup,
            subject,
            recipientCount: sentCount,
            failedCount,
            totalTargeted: limitedUsers.length,
            errors: errors.slice(0, 10) // Log first 10 errors only
          },
          category: 'user_management',
          severity: 'medium',
          success: sentCount > 0
        });

        res.status(200).json({
          message: `Bulk email sent successfully`,
          sentCount,
          failedCount,
          totalTargeted: limitedUsers.length,
          errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Return first 5 errors
        });

      } catch (error) {
        console.error('Bulk email API error:', error);
        
        // Log failed action
        try {
          await AdminAction.logAction({
            adminUserId: req.user?._id,
            action: 'email_sent',
            targetType: 'bulk',
            description: `Failed to send bulk email: ${error.message}`,
            details: {
              emailType: 'bulk',
              errorMessage: error.message
            },
            category: 'user_management',
            severity: 'high',
            success: false,
            errorMessage: error.message
          });
        } catch (logError) {
          console.error('Failed to log bulk email error:', logError);
        }

        res.status(500).json({ 
          error: 'Failed to send bulk email',
          message: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}
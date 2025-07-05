// pages/api/admin/bulk-email.js - Bulk Email Sending API
import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import AdminAction from '../../../models/AdminAction';
import connectDB from '../../../lib/database';
import { sendBulkEmail } from '../../../lib/email-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        const { subject, message, userGroup, scheduledFor, templateId, customRecipients } = req.body;
        const adminUser = req.user;

        // Define email templates
        const templates = {
          welcome: {
            subject: "Welcome to ChartSense - Start Your Trading Journey!",
            message: `🎉 Welcome to ChartSense!

We're excited to have you join our community of traders. Here's what you can do next:

📊 Take your first bias test to assess your trading skills
📈 Explore our chart exam to test your technical analysis
📚 Access our educational resources and trading insights
🏆 Track your progress on the dashboard

Ready to become a better trader? Let's get started!

Best regards,
The ChartSense Team`
          },
          announcement: {
            subject: "Important Update from ChartSense",
            message: `📢 Important Announcement

Hello from the ChartSense team!

We have some exciting updates to share with you:

[Add your announcement here]

Thank you for being part of our trading community.

Best regards,
The ChartSense Team`
          },
          reminder: {
            subject: "Don't Forget - Continue Your Trading Journey",
            message: `⏰ Friendly Reminder

Hi there!

We noticed you haven't been active lately on ChartSense. Don't let your trading skills get rusty!

Here are some quick activities you can do:
• Take a quick bias test (2-3 minutes)
• Try our chart exam to sharpen your analysis
• Check your performance metrics

Your trading journey is important to us. Come back and continue improving!

Best regards,
The ChartSense Team`
          },
          maintenance: {
            subject: "Scheduled Maintenance Notice - ChartSense",
            message: `🔧 Maintenance Notice

Dear ChartSense Users,

We will be performing scheduled maintenance to improve our platform:

📅 Date: [Insert Date]
⏰ Time: [Insert Time]
⏱️ Duration: [Insert Duration]

During this time, the platform may be temporarily unavailable. We apologize for any inconvenience.

Thank you for your patience as we work to enhance your trading experience.

Best regards,
The ChartSense Team`
          },
          feature: {
            subject: "🚀 New Feature Alert - ChartSense",
            message: `🆕 Exciting New Feature!

We're thrilled to announce a new feature that will enhance your trading experience:

[Describe the new feature]

Key benefits:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

Try it out today and let us know what you think!

Best regards,
The ChartSense Team`
          }
        };

        // Use template if specified
        let finalSubject = subject;
        let finalMessage = message;
        
        if (templateId && templates[templateId]) {
          finalSubject = templates[templateId].subject;
          finalMessage = templates[templateId].message;
        }

        if (!finalSubject || !finalMessage) {
          return res.status(400).json({ error: 'Subject and message are required' });
        }

        // Get target users
        let targetUsers = [];

        if (customRecipients && customRecipients.length > 0) {
          // Custom recipients specified
          targetUsers = await User.find({
            _id: { $in: customRecipients },
            isVerified: true
          }, 'email name').lean();
        } else {
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

          targetUsers = await User.find(userQuery, 'email name').lean();
        }
        
        if (targetUsers.length === 0) {
          return res.status(400).json({ error: 'No users found matching the criteria' });
        }

        // Limit to prevent spam (max 1000 users per bulk email)
        const limitedUsers = targetUsers.slice(0, 1000);
        
        let sentCount = 0;
        let failedCount = 0;
        const errors = [];

        // Send emails in batches
        const batchSize = 10; // Reduced batch size for better reliability
        for (let i = 0; i < limitedUsers.length; i += batchSize) {
          const batch = limitedUsers.slice(i, i + batchSize);
          
          
          for (const user of batch) {
            try {
              await sendBulkEmail({
                to: user.email,
                subject: finalSubject,
                html: `
                  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <h1 style="color: #2196F3; margin: 0; font-size: 28px; font-weight: bold;">📧 ChartSense</h1>
                      <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Important Message from Admin</p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
                      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Hello ${user.name || 'User'},</h2>
                      
                      <div style="line-height: 1.8; color: #555; font-size: 16px; margin-bottom: 30px;">
                        ${finalMessage.replace(/\n/g, '<br>')}
                      </div>
                      
                      <!-- CTA Section -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
                          Visit Dashboard
                        </a>
                      </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
                      <p style="margin: 0 0 10px 0;">© 2025 ChartSense - Advanced Trading Analytics</p>
                      <p style="margin: 0;">This email was sent from ChartSense Admin Panel</p>
                      <p style="margin: 10px 0 0 0;">If you no longer wish to receive these emails, please contact support.</p>
                    </div>
                  </div>
                `,
                text: `Hello ${user.name || 'User'},\n\n${finalMessage}\n\n---\n\nVisit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nThis email was sent from ChartSense Admin Panel.\nIf you no longer wish to receive these emails, please contact support.\n\n© 2025 ChartSense - Advanced Trading Analytics`
              });
              sentCount++;
              
              // Small delay between each email to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (error) {
              failedCount++;
              errors.push({ 
                email: user.email, 
                error: error.message,
                timestamp: new Date().toISOString()
              });
            }
          }

          // Longer delay between batches to avoid rate limiting
          if (i + batchSize < limitedUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Log admin action
        await AdminAction.logAction({
          adminUserId: adminUser.id || adminUser._id || adminUser.userId,
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
        
        // Log failed action
        try {
          await AdminAction.logAction({
            adminUserId: req.user?.id || req.user?._id || req.user?.userId,
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
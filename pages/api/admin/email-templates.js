// pages/api/admin/email-templates.js - Get email templates
import { requireAdmin } from '../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        const templates = {
          welcome: {
            id: 'welcome',
            name: 'Welcome Message',
            subject: "Welcome to ChartSense - Start Your Trading Journey!",
            message: `🎉 Welcome to ChartSense!

We're excited to have you join our community of traders. Here's what you can do next:

📊 Take your first bias test to assess your trading skills
📈 Explore our chart exam to test your technical analysis
📚 Access our educational resources and trading insights
🏆 Track your progress on the dashboard

Ready to become a better trader? Let's get started!

Best regards,
The ChartSense Team`,
            category: 'onboarding'
          },
          announcement: {
            id: 'announcement',
            name: 'General Announcement',
            subject: "Important Update from ChartSense",
            message: `📢 Important Announcement

Hello from the ChartSense team!

We have some exciting updates to share with you:

[Add your announcement here]

Thank you for being part of our trading community.

Best regards,
The ChartSense Team`,
            category: 'communication'
          },
          reminder: {
            id: 'reminder',
            name: 'Activity Reminder',
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
The ChartSense Team`,
            category: 'engagement'
          },
          maintenance: {
            id: 'maintenance',
            name: 'Maintenance Notice',
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
The ChartSense Team`,
            category: 'technical'
          },
          feature: {
            id: 'feature',
            name: 'New Feature Announcement',
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
The ChartSense Team`,
            category: 'product'
          },
          promotional: {
            id: 'promotional',
            name: 'Promotional Offer',
            subject: "🎯 Special Offer - Upgrade Your Trading Skills",
            message: `💰 Limited Time Offer!

Ready to take your trading to the next level?

For a limited time, we're offering:

🔥 [Special offer details]
⏰ Valid until: [Expiry date]
💎 Bonus: [Additional benefits]

Don't miss out on this opportunity to enhance your trading skills!

[Call to action]

Best regards,
The ChartSense Team`,
            category: 'marketing'
          }
        };

        res.status(200).json({
          message: 'Email templates retrieved successfully',
          templates: Object.values(templates)
        });

      } catch (error) {
        console.error('Email templates API error:', error);
        res.status(500).json({ 
          error: 'Failed to retrieve email templates',
          message: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}
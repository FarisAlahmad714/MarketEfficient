import connectDB from '../../../../lib/database';
import { requireAdmin } from '../../../../middleware/auth';

// For now, we'll create a simple EmailCampaign model structure
// In production, you might want to create a proper Mongoose model
const EmailCampaign = {
  async create(campaignData) {
    // This would normally save to database
    // For now, we'll just return a mock response
    return {
      _id: 'campaign_' + Date.now(),
      ...campaignData,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

    const {
      name,
      subject,
      template,
      schedule,
      scheduledDate,
      includePromoCode,
      promoCode,
      promoDiscount,
      campaignType,
      targetUsers,
      targetCount
    } = req.body;

    // Validate required fields
    if (!name || !subject || !campaignType) {
      return res.status(400).json({ error: 'Name, subject, and campaign type are required' });
    }

    if (!targetUsers || !Array.isArray(targetUsers) || targetUsers.length === 0) {
      return res.status(400).json({ error: 'Target users are required' });
    }

    // Validate scheduled date if needed
    if (schedule === 'scheduled') {
      if (!scheduledDate) {
        return res.status(400).json({ error: 'Scheduled date is required for scheduled campaigns' });
      }
      
      const scheduleTime = new Date(scheduledDate);
      if (scheduleTime <= new Date()) {
        return res.status(400).json({ error: 'Scheduled date must be in the future' });
      }
    }

    // Create campaign data structure
    const campaignData = {
      name: name.trim(),
      subject: subject.trim(),
      template,
      schedule,
      scheduledDate: schedule === 'scheduled' ? new Date(scheduledDate) : null,
      campaignType,
      targetUsers,
      targetCount,
      createdBy: 'admin',
      status: schedule === 'immediate' ? 'draft' : 'scheduled',
      
      // Email content details
      emailConfig: {
        includePromoCode: includePromoCode || false,
        promoCode: includePromoCode ? promoCode : null,
        promoDiscount: includePromoCode ? promoDiscount : null
      },

      // Analytics placeholders
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      },

      // Template-specific content
      templateContent: getTemplateContent(template, campaignType, {
        includePromoCode,
        promoCode,
        promoDiscount
      })
    };

    // For now, we'll just create a mock campaign
    // In production, you would save this to your EmailCampaign collection
    const campaign = await EmailCampaign.create(campaignData);

    // Log the campaign creation for audit trail

    // Return success response
    res.status(201).json({
      success: true,
      campaign: {
        id: campaign._id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        targetCount: campaign.targetCount,
        createdAt: campaign.createdAt,
        scheduledDate: campaign.scheduledDate
      },
      message: schedule === 'immediate' 
        ? `Campaign "${name}" created as draft. It will not be sent until manually approved.`
        : `Campaign "${name}" scheduled for ${new Date(scheduledDate).toLocaleString()}.`
    });

      } catch (error) {
        res.status(500).json({ error: 'Failed to create email campaign' });
      } finally {
        resolve();
      }
    });
  });
}

// Helper function to generate template content
function getTemplateContent(template, campaignType, options) {
  const { includePromoCode, promoCode, promoDiscount } = options;

  const templates = {
    inactive_users: {
      default: {
        title: 'We Miss You!',
        content: `
          <h2>Your Trading Psychology Journey Awaits</h2>
          <p>Hi there,</p>
          <p>We noticed you haven't been active on ChartSense lately, and we wanted to reach out to see how you're doing.</p>
          <p>Your trading psychology development is important to us, and we have some new insights and tools that could help you on your journey.</p>
          ${includePromoCode ? `
          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Special Welcome Back Offer</h3>
            <p>Use code <strong>${promoCode}</strong> for ${promoDiscount}% off your next subscription!</p>
          </div>
          ` : ''}
          <p>We'd love to have you back. Click the link below to continue your progress:</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Return to Dashboard</a>
          <p>Best regards,<br>The ChartSense Team</p>
        `
      },
      discount: {
        title: 'Special Offer Just For You',
        content: `
          <h2>Come Back with 20% Off!</h2>
          <p>We have something special waiting for you...</p>
          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Limited Time Offer</h3>
            <p>Use code <strong>${promoCode}</strong> for ${promoDiscount}% off!</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Claim Your Discount</a>
        `
      },
      educational: {
        title: 'New Trading Psychology Insights',
        content: `
          <h2>Your Learning Journey Continues</h2>
          <p>We've been working on new content that we think you'll find valuable for your trading psychology development.</p>
          <ul>
            <li>Advanced bias recognition techniques</li>
            <li>New chart analysis tools</li>
            <li>Personalized insights based on your progress</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Continue Learning</a>
        `
      }
    },
    revenue_growth: {
      default: {
        title: 'Unlock Advanced Features',
        content: `
          <h2>Take Your Trading to the Next Level</h2>
          <p>Based on your progress, we think you're ready for our advanced features:</p>
          <ul>
            <li>Advanced bias detection algorithms</li>
            <li>Personalized trading recommendations</li>
            <li>Extended analytics and reporting</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Upgrade Now</a>
        `
      }
    }
  };

  return templates[campaignType]?.[template] || templates.inactive_users.default;
}
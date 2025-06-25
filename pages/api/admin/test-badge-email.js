// pages/api/admin/test-badge-email.js
import { validateRequest } from '../../../middleware/auth';
import User from '../../../models/User';
import { sendBadgeReceivedEmail } from '../../../lib/email-service';
import { checkAndNotifyNewBadges } from '../../../lib/badge-service';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Validate admin user
    const { user } = await validateRequest(req);
    if (!user || user.subscriptionTier !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { testUserId, badgeType } = req.body;

    if (!testUserId) {
      return res.status(400).json({ error: 'testUserId is required' });
    }

    const testUser = await User.findById(testUserId);
    if (!testUser) {
      return res.status(404).json({ error: 'Test user not found' });
    }

    if (badgeType === 'check_all') {
      // Check for actual new badges
      const result = await checkAndNotifyNewBadges(testUserId);
      return res.status(200).json({
        success: true,
        message: 'Badge check completed',
        result
      });
    }

    // Send a test badge email with sample data
    const testBadge = {
      id: 'test_badge',
      title: 'Test Achievement',
      description: 'This is a test badge for email functionality',
      icon: '🧪',
      color: '#2196F3',
      rarity: 'rare'
    };

    const emailSent = await sendBadgeReceivedEmail(testUser, testBadge);

    return res.status(200).json({
      success: true,
      message: `Test badge email ${emailSent ? 'sent successfully' : 'failed to send'} to ${testUser.email}`,
      emailSent,
      testBadge
    });

  } catch (error) {
    console.error('Error sending test badge email:', error);
    return res.status(500).json({ 
      error: 'Failed to send test badge email',
      message: error.message 
    });
  }
}
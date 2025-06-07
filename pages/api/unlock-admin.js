// Emergency admin unlock endpoint
import connectDB from '../../lib/database';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const unlockSecret = req.body.unlockSecret;
  if (unlockSecret !== 'unlock-admin-emergency-2024') {
    return res.status(403).json({ error: 'Invalid unlock secret' });
  }

  try {
    await connectDB();

    // Find and unlock the admin user
    const adminUser = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'support@chartsense.trade' 
    });

    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Reset login attempts and remove lock
    adminUser.loginAttempts = 0;
    adminUser.lockUntil = undefined;
    await adminUser.save();

    res.status(200).json({ 
      message: 'Admin account unlocked successfully',
      email: adminUser.email,
      loginAttempts: adminUser.loginAttempts
    });

  } catch (error) {
    console.error('Admin unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock admin account' });
  }
}
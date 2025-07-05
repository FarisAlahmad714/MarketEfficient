// pages/api/admin/update-user-privacy.js
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { requireAuth } from '../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication and admin status
  try {
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  try {
    await connectDB();

    // Update all users to have public profiles and share results
    const result = await User.updateMany(
      {}, // Update all users
      {
        $set: {
          profileVisibility: 'public',
          shareResults: true
        }
      }
    );


    // Get sample of updated users
    const sampleUsers = await User.find({})
      .select('username profileVisibility shareResults')
      .limit(5);

    return res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount,
      sampleUsers: sampleUsers.map(user => ({
        username: user.username,
        profileVisibility: user.profileVisibility,
        shareResults: user.shareResults
      }))
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to update user privacy',
      details: error.message 
    });
  }
}
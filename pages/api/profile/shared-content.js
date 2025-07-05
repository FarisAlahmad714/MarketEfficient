// pages/api/profile/shared-content.js
import dbConnect from '../../../lib/database';
import SharedContent from '../../../models/SharedContent';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { username, type, limit = 10 } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Build query
    const query = { username };
    if (type && type !== 'all') {
      query.type = type;
    }

    // Fetch shared content with pagination
    const sharedContent = await SharedContent.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Fetch user profile to get profileImageGcsPath
    const userProfile = await User.findOne({ username })
      .select('_id profileImageGcsPath')
      .lean();

    // Add userId and profileImageGcsPath to each content item
    const sharedContentWithUserData = sharedContent.map(item => ({
      ...item,
      userId: item.userId || userProfile?._id || null,
      profileImageGcsPath: userProfile?.profileImageGcsPath || null
    }));

    // Group by type for easier display
    const groupedContent = {
      test_result: [],
      trading_highlight: [],
      achievement: [],
      badge: [],
      all: sharedContentWithUserData
    };

    sharedContentWithUserData.forEach(item => {
      if (groupedContent[item.type]) {
        groupedContent[item.type].push(item);
      }
    });

    res.status(200).json({
      success: true,
      content: groupedContent,
      total: sharedContentWithUserData.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
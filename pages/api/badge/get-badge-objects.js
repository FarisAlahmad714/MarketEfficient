// pages/api/badge/get-badge-objects.js
import { verifyToken } from '../../../lib/auth';
import { getBadgeObjectsFromIds } from '../../../lib/badge-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const decoded = verifyToken(req);
    const userId = decoded.userId;
    
    const { badgeIds } = req.body;
    
    if (!badgeIds || !Array.isArray(badgeIds)) {
      return res.status(400).json({ error: 'Badge IDs array is required' });
    }
    
    // Get full badge objects from IDs
    const badges = await getBadgeObjectsFromIds(userId, badgeIds);
    
    res.status(200).json({
      success: true,
      badges
    });
    
  } catch (error) {
    console.error('Error getting badge objects:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get badge objects' 
    });
  }
}
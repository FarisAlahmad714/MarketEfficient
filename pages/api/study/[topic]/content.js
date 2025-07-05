import { studyContent, isTopicAccessible } from '../../../../lib/studyContent';
import { verifyToken } from '../../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic } = req.query;

  try {
    // Decode the topic name
    const topicName = decodeURIComponent(topic);
    const topicData = studyContent[topicName];

    if (!topicData) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get user info from token
    let userSubscription = 'free';
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      try {
        const user = await verifyToken(authHeader.replace('Bearer ', ''));
        if (user) {
          // Check if user is admin first
          if (user.isAdmin) {
            isAdmin = true;
            userSubscription = 'paid'; // Treat admin as paid for compatibility
          } else if (user.subscriptionStatus === 'active' || user.isPremium) {
            userSubscription = 'paid';
          } else if (user.promoCode) {
            userSubscription = 'promo';
          } else if (user.createdAt) {
            userSubscription = 'existing';
          }
        }
      } catch (error) {
      }
    }

    // Check if user has access to this topic
    if (!isTopicAccessible(topicData.level, userSubscription, isAdmin)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'This content requires a Pro subscription',
        requiredLevel: topicData.level
      });
    }

    // Return the full topic content
    res.status(200).json({
      topicName,
      level: topicData.level,
      icon: topicData.icon,
      description: topicData.description,
      estimatedTime: topicData.estimatedTime,
      lessons: topicData.lessons,
      userSubscription
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
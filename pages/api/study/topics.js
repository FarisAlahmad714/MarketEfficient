import { studyContent, isTopicAccessible } from '../../../lib/studyContent';
import { verifyToken } from '../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user info from token if available
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
        console.log('Token verification failed, using free access');
      }
    }

    // Format topics with access information
    const topics = Object.entries(studyContent).map(([topicName, topicData]) => ({
      name: topicName,
      level: topicData.level,
      icon: topicData.icon,
      description: topicData.description,
      estimatedTime: topicData.estimatedTime,
      lessonCount: Object.keys(topicData.lessons).length,
      isAccessible: isTopicAccessible(topicData.level, userSubscription, isAdmin),
      lessons: Object.keys(topicData.lessons)
    }));

    res.status(200).json({
      topics,
      userSubscription
    });
  } catch (error) {
    console.error('Error fetching study topics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
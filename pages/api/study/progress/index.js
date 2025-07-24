import connectDB from '../../../../lib/database';
import StudyProgress from '../../../../models/StudyProgress';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();

    // Get or create progress for user
    const progress = await StudyProgress.findOrCreateByUserId(decoded.userId);
    
    // Convert Map to plain object for JSON response
    const topicProgressObj = {};
    for (const [topicName, topicData] of progress.topicProgress) {
      topicProgressObj[topicName] = {
        completedLessons: topicData.completedLessons || [],
        completedAt: topicData.completedAt || null,
        lastAccessedAt: topicData.lastAccessedAt || null,
        totalTimeSpent: topicData.totalTimeSpent || 0,
        // Convert nested quizScores Map to object if it exists
        quizScores: topicData.quizScores ? Object.fromEntries(topicData.quizScores) : {}
      };
    }
    
    const progressData = {
      userId: progress.userId,
      topicProgress: topicProgressObj,
      totalTopicsCompleted: progress.totalTopicsCompleted,
      totalLessonsCompleted: progress.totalLessonsCompleted,
      streakDays: progress.streakDays,
      lastStudyDate: progress.lastStudyDate,
      updatedAt: progress.updatedAt
    };

    res.status(200).json({ success: true, progress: progressData });
  } catch (error) {
    console.error('Error fetching study progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
}
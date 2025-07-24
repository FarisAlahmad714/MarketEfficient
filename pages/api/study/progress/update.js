import connectDB from '../../../../lib/database';
import StudyProgress from '../../../../models/StudyProgress';
import { studyContent } from '../../../../lib/studyContent';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { topicName, lessonTitle, action, quizScore } = req.body;

    if (!topicName || !action) {
      return res.status(400).json({ error: 'Topic name and action required' });
    }

    await connectDB();

    // Get or create progress
    let progress = await StudyProgress.findOrCreateByUserId(decoded.userId);
    
    // Get or create topic progress
    let topicProgress = progress.topicProgress.get(topicName) || {
      completedLessons: [],
      quizScores: new Map(),
      lastAccessedAt: new Date()
    };

    // Update based on action
    switch (action) {
      case 'completeLesson':
        if (lessonTitle && !topicProgress.completedLessons.includes(lessonTitle)) {
          topicProgress.completedLessons.push(lessonTitle);
          progress.totalLessonsCompleted += 1;
          
          // If quiz score provided, save it
          if (quizScore !== undefined) {
            topicProgress.quizScores.set(lessonTitle, quizScore);
          }
          
          // Check if all lessons in topic are completed
          const topic = studyContent[topicName];
          if (topic && topicProgress.completedLessons.length === Object.keys(topic.lessons).length) {
            topicProgress.completedAt = new Date();
            progress.totalTopicsCompleted += 1;
          }
        }
        break;
        
      case 'startTopic':
        topicProgress.lastAccessedAt = new Date();
        break;
        
      case 'updateQuizScore':
        if (lessonTitle && quizScore !== undefined) {
          topicProgress.quizScores.set(lessonTitle, quizScore);
        }
        break;
    }

    // Update topic progress
    progress.topicProgress.set(topicName, topicProgress);
    
    // Update study streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastStudy = progress.lastStudyDate ? new Date(progress.lastStudyDate).setHours(0, 0, 0, 0) : null;
    
    if (!lastStudy || today - lastStudy > 86400000) {
      // More than a day since last study, reset or increment streak
      progress.streakDays = (!lastStudy || today - lastStudy === 86400000) ? progress.streakDays + 1 : 1;
    }
    
    progress.lastStudyDate = new Date();
    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Progress updated',
      topicCompleted: topicProgress.completedAt != null,
      totalCompleted: progress.totalTopicsCompleted
    });
  } catch (error) {
    console.error('Error updating study progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
}
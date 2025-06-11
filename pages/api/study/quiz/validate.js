import { studyContent } from '../../../../lib/studyContent';
import { verifyToken } from '../../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topicName, lessonTitle, answer } = req.body;

    if (!topicName || !lessonTitle || answer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get topic data
    const topicData = studyContent[topicName];
    if (!topicData) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get lesson data
    const lessonData = topicData.lessons[lessonTitle];
    if (!lessonData || !lessonData.quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Validate the answer
    const isCorrect = parseInt(answer) === lessonData.quiz.correct;
    
    // Optional: Log quiz attempt for analytics
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const user = await verifyToken(authHeader.replace('Bearer ', ''));
        if (user) {
          console.log(`Quiz attempt - User: ${user.email}, Topic: ${topicName}, Lesson: ${lessonTitle}, Correct: ${isCorrect}`);
          // Here you could save to database for progress tracking
        }
      } catch (error) {
        console.log('Could not identify user for quiz logging');
      }
    }

    res.status(200).json({
      isCorrect,
      explanation: lessonData.quiz.explanation,
      correctAnswer: lessonData.quiz.correct
    });
  } catch (error) {
    console.error('Error validating quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
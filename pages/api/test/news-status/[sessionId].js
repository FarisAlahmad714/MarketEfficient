import logger from '../../../../lib/logger';

// Use the same global sessions object as the main test API
if (!global.biasTestSessions) {
  global.biasTestSessions = {};
}
const sessions = global.biasTestSessions;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const testSessionKey = sessionId + '_test';
    const testSession = sessions[testSessionKey];

    if (!testSession) {
      logger.log(`Session not found: ${testSessionKey}. Available sessions: ${Object.keys(sessions).join(', ')}`);
      return res.status(404).json({ error: 'Test session not found' });
    }

    // Check news loading status for all questions
    const newsStatus = testSession.questions.map(question => ({
      id: question.id,
      news_loading: question.news_loading || false,
      has_news: question.news_annotations && question.news_annotations.length > 0,
      news_count: question.news_annotations ? question.news_annotations.length : 0
    }));

    // Calculate overall progress
    const totalQuestions = testSession.questions.length;
    const completedQuestions = testSession.questions.filter(q => !q.news_loading).length;
    const questionsWithNews = testSession.questions.filter(q => 
      q.news_annotations && q.news_annotations.length > 0
    ).length;

    const response = {
      session_id: sessionId,
      total_questions: totalQuestions,
      completed_questions: completedQuestions,
      questions_with_news: questionsWithNews,
      overall_progress: Math.round((completedQuestions / totalQuestions) * 100),
      all_complete: completedQuestions === totalQuestions,
      questions: newsStatus,
      // Include updated questions with news annotations for frontend update
      updated_questions: testSession.questions.filter(q => !q.news_loading && q.news_annotations.length > 0)
    };

    logger.log(`News status check for session ${sessionId}: ${completedQuestions}/${totalQuestions} complete`);
    
    return res.status(200).json(response);

  } catch (error) {
    logger.error('Error checking news status:', error);
    return res.status(500).json({ 
      error: 'Failed to check news status',
      details: error.message 
    });
  }
}
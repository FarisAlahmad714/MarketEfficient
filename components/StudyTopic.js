import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { studyContent, isTopicAccessible } from '../lib/studyContent';
import { useRouter } from 'next/router';

const StudyTopic = ({ topicName }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizResult, setQuizResult] = useState(null);
  const [userSubscription, setUserSubscription] = useState('free');

  const topicData = studyContent[topicName];
  const lessons = Object.entries(topicData?.lessons || {});
  const [lessonTitle, lessonContent] = lessons[currentLesson] || ['', { content: '', quiz: null }];

  useEffect(() => {
    if (user) {
      if (user.subscriptionStatus === 'active' || user.isPremium) {
        setUserSubscription('paid');
      } else if (user.promoCode) {
        setUserSubscription('promo');
      } else if (user.email) {
        // If user is logged in (has email), give them existing user access
        setUserSubscription('existing');
      }
      console.log('User subscription set to:', userSubscription, 'User data:', user);
    } else {
      setUserSubscription('free');
      console.log('No user found, setting subscription to free');
    }
  }, [user]);

  // Remove the automatic redirect that's causing the infinite loop
  // Instead, we'll show an access denied message in the render

  const nextLesson = () => {
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
      setShowQuiz(false);
      setQuizAnswer('');
      setQuizResult(null);
    }
  };

  const prevLesson = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      setShowQuiz(false);
      setQuizAnswer('');
      setQuizResult(null);
    }
  };

  const completeLesson = () => {
    setCompletedLessons(prev => new Set([...prev, currentLesson]));
    
    if (lessonContent.quiz) {
      setShowQuiz(true);
    } else {
      nextLesson();
    }
  };

  const submitQuiz = () => {
    const isCorrect = parseInt(quizAnswer) === lessonContent.quiz.correct;
    setQuizResult({
      isCorrect,
      explanation: lessonContent.quiz.explanation
    });

    // Allow progression regardless of quiz result after showing feedback
    setTimeout(() => {
      if (currentLesson < lessons.length - 1) {
        nextLesson();
      } else {
        // Completed all lessons - redirect to quiz selection or next topic
        router.push('/chart-exam');
      }
    }, 3000);
  };

  const progressPercentage = ((currentLesson + 1) / lessons.length) * 100;

  if (!topicData) {
    return <div>Loading...</div>;
  }

  // Check access without redirecting (removed isLoading check since it's causing issues)
  if (!isTopicAccessible(topicData.level, userSubscription)) {
    return (
      <div className="study-topic-container">
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>This content requires a subscription to access.</p>
          <button onClick={() => router.push('/pricing')} className="upgrade-btn">
            Upgrade Now
          </button>
          <button onClick={() => router.push('/study')} className="back-btn">
            Back to Study
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-topic-container">
      {/* Header */}
      <div className="study-topic-header">
        <button 
          className="back-btn"
          onClick={() => router.push('/study')}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Study</span>
        </button>
        
        <div className="topic-info">
          <h1>{topicName}</h1>
          <div className="topic-meta">
            <span className={`difficulty-badge ${topicData.level}`}>
              {topicData.level}
            </span>
            <span className="estimated-time">
              <i className="fas fa-clock"></i>
              {topicData.estimatedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-info">
          <span>Lesson {currentLesson + 1} of {lessons.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Lesson Steps */}
        <div className="lesson-steps">
          {lessons.map((_, index) => (
            <div 
              key={index}
              className={`step ${index < currentLesson ? 'completed' : ''} ${index === currentLesson ? 'current' : ''}`}
              onClick={() => index <= currentLesson && setCurrentLesson(index)}
            >
              {index < currentLesson ? (
                <i className="fas fa-check"></i>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lesson Content */}
      {!showQuiz ? (
        <div className="lesson-content">
          <div className="lesson-header">
            <h2>{lessonTitle}</h2>
          </div>
          
          <div 
            className="lesson-body"
            dangerouslySetInnerHTML={{ __html: lessonContent.content }}
          />
          
          <div className="lesson-navigation">
            <button 
              className="nav-btn prev-btn"
              onClick={prevLesson}
              disabled={currentLesson === 0}
            >
              <i className="fas fa-arrow-left"></i>
              Previous
            </button>
            
            <button 
              className="nav-btn complete-btn"
              onClick={completeLesson}
            >
              {lessonContent.quiz ? 'Take Quiz' : 'Next Lesson'}
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Section */
        <div className="quiz-section">
          <div className="quiz-header">
            <h2>Knowledge Check</h2>
            <p>Test your understanding of this lesson</p>
          </div>
          
          <div className="quiz-content">
            <div className="quiz-question">
              <h3>{lessonContent.quiz.question}</h3>
            </div>
            
            <div className="quiz-options">
              {lessonContent.quiz.options.map((option, index) => (
                <label key={index} className="quiz-option">
                  <input 
                    type="radio"
                    name="quiz-answer"
                    value={index + 1}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    disabled={quizResult !== null}
                  />
                  <span className="option-text">{option}</span>
                  {quizResult && (
                    <span className={`option-indicator ${
                      index + 1 === lessonContent.quiz.correct ? 'correct' : 
                      parseInt(quizAnswer) === index + 1 ? 'incorrect' : ''
                    }`}>
                      {index + 1 === lessonContent.quiz.correct ? (
                        <i className="fas fa-check"></i>
                      ) : parseInt(quizAnswer) === index + 1 ? (
                        <i className="fas fa-times"></i>
                      ) : null}
                    </span>
                  )}
                </label>
              ))}
            </div>
            
            {!quizResult ? (
              <button 
                className="submit-quiz-btn"
                onClick={submitQuiz}
                disabled={!quizAnswer}
              >
                Submit Answer
              </button>
            ) : (
              <div className={`quiz-result ${quizResult.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-icon">
                  {quizResult.isCorrect ? (
                    <i className="fas fa-check-circle"></i>
                  ) : (
                    <i className="fas fa-times-circle"></i>
                  )}
                </div>
                <div className="result-content">
                  <h4>{quizResult.isCorrect ? 'Correct!' : 'Not quite right'}</h4>
                  <p>{quizResult.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .study-topic-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        .study-topic-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 30px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .back-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .topic-info h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          color: var(--text-primary);
        }

        .topic-meta {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .difficulty-badge {
          padding: 6px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .difficulty-badge.beginner {
          background: #4CAF50;
          color: white;
        }

        .difficulty-badge.intermediate {
          background: #FF9800;
          color: white;
        }

        .difficulty-badge.advanced {
          background: #F44336;
          color: white;
        }

        .estimated-time {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .estimated-time i {
          color: var(--accent-primary);
        }

        .progress-section {
          background: var(--bg-tertiary);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .progress-bar {
          height: 8px;
          background: var(--bg-secondary);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .lesson-steps {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .step.completed {
          background: var(--accent-primary);
          color: white;
        }

        .step.current {
          background: var(--accent-secondary);
          color: white;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
        }

        .step:hover {
          transform: scale(1.1);
        }

        .lesson-content {
          background: var(--bg-tertiary);
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .lesson-header {
          padding: 30px 30px 20px 30px;
          border-bottom: 1px solid var(--bg-secondary);
        }

        .lesson-header h2 {
          font-size: 1.8rem;
          color: var(--text-primary);
          margin: 0;
        }

        .lesson-body {
          padding: 30px;
          color: var(--text-primary);
          line-height: 1.8;
        }

        /* Lesson Content Styles */
        .lesson-body :global(.lesson-intro) {
          margin-bottom: 30px;
        }

        .lesson-body :global(.lesson-intro p) {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .lesson-body :global(.lesson-image) {
          width: 100%;
          max-width: 600px;
          height: auto;
          border-radius: 10px;
          margin: 20px auto;
          display: block;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .lesson-body :global(.concept-section),
        .lesson-body :global(.key-points),
        .lesson-body :global(.practice-section) {
          margin: 30px 0;
        }

        .lesson-body :global(.concept-section h4),
        .lesson-body :global(.key-points h4),
        .lesson-body :global(.practice-section h4) {
          color: var(--accent-primary);
          font-size: 1.3rem;
          margin-bottom: 15px;
        }

        .lesson-body :global(.point-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .lesson-body :global(.point-card) {
          background: var(--bg-secondary);
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid var(--accent-primary);
        }

        .lesson-body :global(.point-card h5) {
          color: var(--text-primary);
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .lesson-body :global(.point-card p) {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.95rem;
        }

        .lesson-body :global(.rule-list) {
          list-style: none;
          padding: 0;
        }

        .lesson-body :global(.rule-item) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          color: var(--text-primary);
        }

        .lesson-body :global(.rule-item i) {
          color: var(--accent-primary);
          font-size: 1.1rem;
        }

        .lesson-navigation {
          padding: 30px;
          border-top: 1px solid var(--bg-secondary);
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 25px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .prev-btn {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        .prev-btn:hover:not(:disabled) {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .complete-btn {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          margin-left: auto;
        }

        .complete-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
        }

        /* Quiz Styles */
        .quiz-section {
          background: var(--bg-tertiary);
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .quiz-header {
          padding: 30px 30px 20px 30px;
          text-align: center;
          border-bottom: 1px solid var(--bg-secondary);
        }

        .quiz-header h2 {
          font-size: 1.8rem;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .quiz-header p {
          color: var(--text-secondary);
          margin: 0;
        }

        .quiz-content {
          padding: 30px;
        }

        .quiz-question h3 {
          font-size: 1.3rem;
          color: var(--text-primary);
          margin-bottom: 25px;
          line-height: 1.5;
        }

        .quiz-options {
          margin-bottom: 30px;
        }

        .quiz-option {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px 20px;
          margin-bottom: 12px;
          background: var(--bg-secondary);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .quiz-option:hover {
          background: var(--bg-primary);
        }

        .quiz-option input[type="radio"] {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-primary);
        }

        .option-text {
          flex: 1;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .option-indicator {
          position: absolute;
          right: 20px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .option-indicator.correct {
          background: #4CAF50;
          color: white;
        }

        .option-indicator.incorrect {
          background: #F44336;
          color: white;
        }

        .submit-quiz-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-quiz-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-quiz-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
        }

        .quiz-result {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 25px;
          border-radius: 12px;
          margin-top: 20px;
        }

        .quiz-result.correct {
          background: rgba(76, 175, 80, 0.1);
          border: 2px solid rgba(76, 175, 80, 0.3);
        }

        .quiz-result.incorrect {
          background: rgba(244, 67, 54, 0.1);
          border: 2px solid rgba(244, 67, 54, 0.3);
        }

        .result-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .quiz-result.correct .result-icon {
          color: #4CAF50;
        }

        .quiz-result.incorrect .result-icon {
          color: #F44336;
        }

        .result-content h4 {
          margin: 0 0 10px 0;
          color: var(--text-primary);
          font-size: 1.2rem;
        }

        .result-content p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .study-topic-header {
            flex-direction: column;
            gap: 15px;
          }

          .topic-info h1 {
            font-size: 2rem;
          }

          .lesson-steps {
            overflow-x: auto;
            padding-bottom: 10px;
          }

          .step {
            min-width: 40px;
          }

          .lesson-navigation {
            flex-direction: column;
          }

          .complete-btn {
            margin-left: 0;
          }

          .quiz-result {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default StudyTopic;
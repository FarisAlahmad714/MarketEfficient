import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { studyContent, isTopicAccessible } from '../lib/studyContent';
import Link from 'next/link';
import { useRouter } from 'next/router';

const StudySection = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userSubscription, setUserSubscription] = useState('free');

  useEffect(() => {
    if (user) {
      // Determine user subscription status - if user is logged in, give them access to all content for now
      if (user.subscriptionStatus === 'active' || user.isPremium) {
        setUserSubscription('paid');
      } else if (user.promoCode) {
        setUserSubscription('promo');
      } else if (user.email) {
        // If user is logged in (has email), give them existing user access
        setUserSubscription('existing');
      }
    } else {
      setUserSubscription('free');
    }
  }, [user]);

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getDifficultyIcon = (level) => {
    switch (level) {
      case 'beginner': return 'fas fa-seedling';
      case 'intermediate': return 'fas fa-fire';
      case 'advanced': return 'fas fa-crown';
      default: return 'fas fa-book';
    }
  };

  return (
    <div className="study-section-container">
      <div className="study-header">
        <h1>Trading <span className="highlight">Education</span></h1>
        <p>Master technical analysis with our comprehensive study materials</p>
        <div className="progress-overview">
          <div className="user-level">
            <i className="fas fa-user-graduate"></i>
            <span>Your Level: {userSubscription === 'free' ? 'Beginner' : 'Advanced'}</span>
          </div>
        </div>
      </div>

      <div className="study-grid">
        {Object.entries(studyContent).map(([topicName, topicData]) => {
          const isAccessible = isTopicAccessible(topicData.level, userSubscription);
          
          return (
            <div 
              key={topicName}
              className={`study-card ${!isAccessible ? 'locked' : ''} ${topicData.level}`}
            >
              <div className="study-card-header">
                <div className="topic-icon">
                  <i className={topicData.icon}></i>
                </div>
                <div className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(topicData.level) }}>
                  <i className={getDifficultyIcon(topicData.level)}></i>
                  <span>{topicData.level}</span>
                </div>
              </div>

              <div className="study-card-content">
                <h3>{topicName}</h3>
                <p>{topicData.description}</p>
                
                <div className="study-meta">
                  <div className="estimated-time">
                    <i className="fas fa-clock"></i>
                    <span>{topicData.estimatedTime}</span>
                  </div>
                  <div className="lesson-count">
                    <i className="fas fa-book-open"></i>
                    <span>{Object.keys(topicData.lessons).length} lessons</span>
                  </div>
                </div>

                <div className="lesson-preview">
                  <h4>What you'll learn:</h4>
                  <ul>
                    {Object.keys(topicData.lessons).slice(0, 3).map((lessonTitle, index) => (
                      <li key={index}>
                        <i className="fas fa-check-circle"></i>
                        {lessonTitle}
                      </li>
                    ))}
                    {Object.keys(topicData.lessons).length > 3 && (
                      <li className="more-lessons">
                        <i className="fas fa-plus-circle"></i>
                        +{Object.keys(topicData.lessons).length - 3} more lessons
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="study-card-footer">
                {isAccessible ? (
                  <Link href={`/study/${encodeURIComponent(topicName)}`} className="study-btn">
                    <span>Start Learning</span>
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                ) : (
                  <div className="locked-content">
                    <button 
                      className="unlock-btn"
                      onClick={() => router.push('/pricing')}
                    >
                      <i className="fas fa-lock"></i>
                      <span>Unlock with Pro</span>
                    </button>
                    <p className="unlock-note">This content requires a Pro subscription</p>
                  </div>
                )}
              </div>

              {!isAccessible && (
                <div className="lock-overlay">
                  <div className="lock-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="study-benefits">
        <h2>Why Study with MarketEfficient?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3>Real Market Examples</h3>
            <p>Learn with actual market data and real trading scenarios</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3>Interactive Learning</h3>
            <p>Quizzes and practical exercises reinforce your knowledge</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <h3>Progressive Difficulty</h3>
            <p>Start with basics and advance to professional-level concepts</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-certificate"></i>
            </div>
            <h3>Test Your Skills</h3>
            <p>Apply your knowledge in our comprehensive testing system</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .study-section-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .study-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .study-header h1 {
          font-size: 3rem;
          margin-bottom: 15px;
          color: var(--text-primary);
        }

        .highlight {
          color: var(--accent-primary);
          position: relative;
        }

        .highlight::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 2px;
        }

        .study-header p {
          font-size: 1.3rem;
          color: var(--text-secondary);
          margin-bottom: 30px;
        }

        .progress-overview {
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .user-level {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: var(--bg-tertiary);
          border-radius: 25px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .user-level i {
          color: var(--accent-primary);
          font-size: 1.2rem;
        }

        .study-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 30px;
          margin-bottom: 80px;
        }

        .study-card {
          background: var(--bg-tertiary);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          position: relative;
          border: 2px solid transparent;
        }

        .study-card:not(.locked):hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .study-card.beginner {
          border-color: rgba(76, 175, 80, 0.3);
        }

        .study-card.intermediate {
          border-color: rgba(255, 152, 0, 0.3);
        }

        .study-card.advanced {
          border-color: rgba(244, 67, 54, 0.3);
        }

        .study-card.locked {
          opacity: 0.7;
          filter: grayscale(0.3);
        }

        .study-card-header {
          padding: 25px 25px 0 25px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .topic-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .difficulty-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .study-card-content {
          padding: 25px;
        }

        .study-card-content h3 {
          font-size: 1.4rem;
          margin-bottom: 15px;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .study-card-content p {
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .study-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .estimated-time,
        .lesson-count {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .estimated-time i,
        .lesson-count i {
          color: var(--accent-primary);
        }

        .lesson-preview h4 {
          font-size: 1rem;
          margin-bottom: 12px;
          color: var(--text-primary);
        }

        .lesson-preview ul {
          list-style: none;
          padding: 0;
        }

        .lesson-preview li {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .lesson-preview li i {
          color: var(--accent-primary);
          font-size: 0.8rem;
        }

        .more-lessons {
          font-style: italic;
          opacity: 0.8;
        }

        .study-card-footer {
          padding: 0 25px 25px 25px;
        }

        .study-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .study-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
        }

        .study-btn i {
          transition: transform 0.3s ease;
        }

        .study-btn:hover i {
          transform: translateX(5px);
        }

        .locked-content {
          text-align: center;
        }

        .unlock-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 15px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 2px solid var(--accent-primary);
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .unlock-btn:hover {
          background: var(--accent-primary);
          color: white;
        }

        .unlock-note {
          margin-top: 10px;
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
        }

        .lock-icon {
          width: 80px;
          height: 80px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
        }

        .study-benefits {
          text-align: center;
          margin-top: 80px;
        }

        .study-benefits h2 {
          font-size: 2.5rem;
          margin-bottom: 50px;
          color: var(--text-primary);
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
        }

        .benefit-card {
          padding: 40px 30px;
          background: var(--bg-tertiary);
          border-radius: 20px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .benefit-card:hover {
          transform: translateY(-5px);
        }

        .benefit-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
          font-size: 2rem;
          color: white;
        }

        .benefit-card h3 {
          font-size: 1.3rem;
          margin-bottom: 15px;
          color: var(--text-primary);
        }

        .benefit-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .study-grid {
            grid-template-columns: 1fr;
          }

          .study-header h1 {
            font-size: 2.2rem;
          }

          .study-header p {
            font-size: 1.1rem;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StudySection;
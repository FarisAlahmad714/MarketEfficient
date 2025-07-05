import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTopicsByDifficulty, getDifficultyMetadata, isTopicAccessible } from '../lib/studyContent';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/StudySection.module.css';

const StudySection = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userSubscription, setUserSubscription] = useState('free');
  const [activeTab, setActiveTab] = useState('all');
  
  const topicsByDifficulty = getTopicsByDifficulty();
  const difficultyMetadata = getDifficultyMetadata();

  useEffect(() => {
    if (user) {
      // Admin users get full access
      if (user.isAdmin) {
        setUserSubscription('paid');
      } else if (user.subscriptionStatus === 'active' || user.isPremium) {
        setUserSubscription('paid');
      } else if (user.promoCode) {
        setUserSubscription('promo');
      } else if (user.email) {
        setUserSubscription('existing');
      }
    } else {
      setUserSubscription('free');
    }
  }, [user]);

  const getUserLevelText = () => {
    if (userSubscription === 'paid' || userSubscription === 'promo') return 'Premium Trader';
    if (userSubscription === 'existing') return 'Intermediate Trader';
    return 'Beginner Trader';
  };

  const getAccessibleTopicsCount = (difficulty) => {
    return topicsByDifficulty[difficulty]?.filter(topic => 
      isTopicAccessible(topic.level, userSubscription, user?.isAdmin)
    ).length || 0;
  };

  const renderTopicCard = (topic) => {
    const isAccessible = isTopicAccessible(topic.level, userSubscription, user?.isAdmin);
    
    return (
      <div 
        key={topic.name}
        className={`${styles.studyCard} ${!isAccessible ? styles.locked : ''} ${styles[topic.level]}`}
      >
        <div className={styles.studyCardHeader}>
          <div className={styles.difficultyBadge} style={{ backgroundColor: difficultyMetadata[topic.level]?.color }}>
            <i className={difficultyMetadata[topic.level]?.icon}></i>
            <span>{topic.level}</span>
          </div>
        </div>

        <div className={styles.studyCardContent}>
          <h3>{topic.name}</h3>
          <p>{topic.description}</p>
          
          <div className={styles.studyMeta}>
            <div className={styles.estimatedTime}>
              <i className="fas fa-clock"></i>
              <span>{topic.estimatedTime}</span>
            </div>
            <div className={styles.lessonCount}>
              <i className="fas fa-book-open"></i>
              <span>{Object.keys(topic.lessons).length} lessons</span>
            </div>
          </div>

          <div className={styles.lessonPreview}>
            <h4>Course Content ({Object.keys(topic.lessons).length} lessons)</h4>
            <div className={styles.lessonsGrid}>
              {Object.keys(topic.lessons).slice(0, 3).map((lessonTitle, index) => (
                <div key={index} className={styles.lessonItem}>
                  <div className={styles.lessonThumbnail}>
                    <div className={styles.lessonPlayBtn}>
                      <i className="fas fa-play"></i>
                    </div>
                    <div className={styles.lessonDuration}>5 min</div>
                  </div>
                  <div className={styles.lessonDetails}>
                    <h5 className={styles.lessonName}>{lessonTitle}</h5>
                    <div className={styles.lessonMeta}>
                      <span className={styles.lessonType}>
                        <i className="fas fa-video"></i>
                        Video Lesson
                      </span>
                      <span className={styles.lessonDifficulty}>
                        <i className="fas fa-signal"></i>
                        {topic.level}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(topic.lessons).length > 3 && (
                <div className={styles.moreLessonsItem}>
                  <div className={styles.moreLessonsThumbnail}>
                    <div className={styles.moreLessonsCount}>
                      +{Object.keys(topic.lessons).length - 3}
                    </div>
                  </div>
                  <div className={styles.moreLessonsDetails}>
                    <h5>More Lessons Available</h5>
                    <p>Unlock premium to access all course content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.studyCardFooter}>
          {isAccessible ? (
            <Link href={`/study/${encodeURIComponent(topic.name)}`} className={styles.studyBtn}>
              <span>Start Learning</span>
              <i className="fas fa-arrow-right"></i>
            </Link>
          ) : (
            <div className={styles.lockedContent}>
              <button 
                className={styles.unlockBtn}
                onClick={() => router.push('/pricing')}
              >
                <i className="fas fa-lock"></i>
                <span>Unlock with Pro</span>
              </button>
              <p className={styles.unlockNote}>{difficultyMetadata[topic.level]?.accessText}</p>
            </div>
          )}
        </div>

        {!isAccessible && (
          <div className={styles.lockOverlay}>
            <div className={styles.lockIcon}>
              <i className="fas fa-lock"></i>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDifficultySection = (difficulty) => {
    const topics = topicsByDifficulty[difficulty] || [];
    const metadata = difficultyMetadata[difficulty];
    const accessibleCount = getAccessibleTopicsCount(difficulty);
    
    if (topics.length === 0) return null;

    return (
      <div className="difficulty-section" key={difficulty}>
        <div className="difficulty-header">
          <div className="difficulty-info">
            <div className="difficulty-icon" style={{ backgroundColor: metadata.color }}>
              <i className={metadata.icon}></i>
            </div>
            <div className="difficulty-text">
              <h2>{metadata.title}</h2>
              <p>{metadata.description}</p>
              <div className="progress-info">
                <span className="progress-count">{accessibleCount}/{topics.length} topics available</span>
                <span className="access-badge" style={{ backgroundColor: `${metadata.color}20`, color: metadata.color }}>
                  {metadata.accessText}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="topics-grid">
          {topics.map(topic => renderTopicCard(topic))}
        </div>
      </div>
    );
  };

  const renderAllTopics = () => {
    return (
      <div className="all-topics-section">
        {Object.keys(topicsByDifficulty).map(difficulty => renderDifficultySection(difficulty))}
      </div>
    );
  };

  return (
    <div className="study-section-container">
      <div className="study-header">
        <h1>Trading <span className="highlight">Academy</span></h1>
        <p>Master professional trading with our comprehensive educational platform</p>
        <div className="progress-overview">
          <div className="user-level">
            <i className="fas fa-user-graduate"></i>
            <span>Your Level: {getUserLevelText()}</span>
          </div>
          <div className="total-progress">
            <i className="fas fa-chart-bar"></i>
            <span>
              {Object.values(topicsByDifficulty).reduce((acc, topics) => 
                acc + topics.filter(topic => isTopicAccessible(topic.level, userSubscription, user?.isAdmin)).length, 0
              )} topics available
            </span>
          </div>
        </div>
      </div>

      <div className="study-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="fas fa-th-large"></i>
            All Courses
          </button>
          {Object.entries(difficultyMetadata).map(([difficulty, metadata]) => (
            <button 
              key={difficulty}
              className={`nav-tab ${activeTab === difficulty ? 'active' : ''}`}
              onClick={() => setActiveTab(difficulty)}
              style={{ '--tab-color': metadata.color }}
            >
              <i className={metadata.icon}></i>
              {metadata.title}
              <span className="tab-count">{topicsByDifficulty[difficulty]?.length || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="study-content">
        {activeTab === 'all' ? renderAllTopics() : renderDifficultySection(activeTab)}
      </div>

      <div className="study-benefits">
        <h2>Why Choose ChartSense Academy?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h3>Structured Learning Path</h3>
            <p>From beginner fundamentals to advanced institutional strategies</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3>Real Market Analysis</h3>
            <p>Learn with actual trading charts and professional examples</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3>Interactive Quizzes</h3>
            <p>Test your knowledge and reinforce learning with instant feedback</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3>Professional Techniques</h3>
            <p>Master institutional trading methods used by professional traders</p>
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
          margin-bottom: 50px;
        }

        .study-header h1 {
          font-size: 3.5rem;
          margin-bottom: 15px;
          color: var(--text-primary);
          font-weight: 700;
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
          height: 4px;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 2px;
        }

        .study-header p {
          font-size: 1.4rem;
          color: var(--text-secondary);
          margin-bottom: 30px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .progress-overview {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }

        .user-level,
        .total-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 25px;
          background: var(--bg-tertiary);
          border-radius: 30px;
          color: var(--text-primary);
          font-weight: 600;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .user-level i,
        .total-progress i {
          color: var(--accent-primary);
          font-size: 1.3rem;
        }

        .study-navigation {
          margin-bottom: 50px;
        }

        .nav-tabs {
          display: flex;
          justify-content: center;
          gap: 10px;
          background: var(--bg-tertiary);
          padding: 8px;
          border-radius: 50px;
          flex-wrap: wrap;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-radius: 25px;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .nav-tab:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .nav-tab.active {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }

        .tab-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-left: 5px;
        }

        .difficulty-section {
          margin-bottom: 60px;
        }

        .difficulty-header {
          margin-bottom: 30px;
        }

        .difficulty-info {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 25px;
          background: var(--bg-tertiary);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .difficulty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
          flex-shrink: 0;
        }

        .difficulty-text h2 {
          font-size: 2rem;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .difficulty-text p {
          color: var(--text-secondary);
          margin-bottom: 15px;
          font-size: 1.1rem;
        }

        .progress-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .progress-count {
          color: var(--text-primary);
          font-weight: 600;
        }

        .access-badge {
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .topics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 25px;
        }

        .study-card {
          background: var(--bg-tertiary);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          border: 1px solid var(--bg-secondary);
        }

        .study-card:not(.locked):hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .study-card.beginner {
          border-left: 4px solid #4CAF50;
        }

        .study-card.intermediate {
          border-left: 4px solid #FF9800;
        }

        .study-card.advanced {
          border-left: 4px solid #F44336;
        }

        .study-card.locked {
          opacity: 0.7;
          filter: grayscale(0.3);
        }

        .study-card-header {
          padding: 24px 24px 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .topic-icon {
          width: 56px;
          height: 56px;
          background: var(--accent-primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
          flex-shrink: 0;
        }

        .difficulty-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        .study-card-content {
          padding: 20px 24px;
        }

        .study-card-content h3 {
          font-size: 1.4rem;
          margin-bottom: 12px;
          color: var(--text-primary);
          line-height: 1.4;
          font-weight: 600;
        }

        .study-card-content p {
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .study-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .estimated-time,
        .lesson-count {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .estimated-time i,
        .lesson-count i {
          color: var(--accent-primary);
          font-size: 0.9rem;
        }

        .lesson-preview {
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .lesson-preview h4 {
          font-size: 1rem;
          margin-bottom: 12px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .lessons-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .lesson-item:hover {
          background: var(--bg-primary);
        }

        .lesson-thumbnail {
          width: 48px;
          height: 32px;
          background: var(--accent-primary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lesson-play-btn {
          color: white;
          font-size: 0.8rem;
        }

        .lesson-duration {
          position: absolute;
          bottom: 2px;
          right: 4px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 0.7rem;
        }

        .lesson-details {
          flex: 1;
        }

        .lesson-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .lesson-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .lesson-type,
        .lesson-difficulty {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .lesson-type i,
        .lesson-difficulty i {
          color: var(--accent-primary);
          font-size: 0.7rem;
        }

        .more-lessons-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-tertiary);
          border: 1px dashed var(--accent-primary);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .more-lessons-item:hover {
          background: var(--bg-primary);
          border-style: solid;
        }

        .more-lessons-thumbnail {
          width: 48px;
          height: 32px;
          background: var(--bg-secondary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .more-lessons-count {
          font-size: 1rem;
          font-weight: 600;
          color: var(--accent-primary);
        }

        .more-lessons-details {
          flex: 1;
        }

        .more-lessons-details h5 {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--accent-primary);
          margin: 0 0 2px 0;
        }

        .more-lessons-details p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }


        .study-card-footer {
          padding: 0 24px 24px 24px;
        }

        .study-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 16px;
          background: var(--accent-primary);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .study-btn:hover {
          background: var(--accent-secondary);
          transform: translateY(-1px);
        }

        .locked-content {
          text-align: center;
        }

        .unlock-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 16px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--accent-primary);
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .unlock-btn:hover {
          background: var(--accent-primary);
          color: white;
          transform: translateY(-1px);
        }

        .unlock-note {
          margin-top: 8px;
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(1px);
        }

        .lock-icon {
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
        }

        .study-benefits {
          text-align: center;
          margin-top: 100px;
          padding: 60px 0;
          background: var(--bg-tertiary);
          border-radius: 30px;
        }

        .study-benefits h2 {
          font-size: 2.8rem;
          margin-bottom: 50px;
          color: var(--text-primary);
          font-weight: 700;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          padding: 0 40px;
        }

        .benefit-card {
          padding: 40px 30px;
          background: var(--bg-primary);
          border-radius: 25px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .benefit-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }

        .benefit-icon {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px auto;
          font-size: 2.2rem;
          color: white;
          box-shadow: 0 10px 25px rgba(76, 175, 80, 0.3);
        }

        .benefit-card h3 {
          font-size: 1.4rem;
          margin-bottom: 15px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .benefit-card p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .topics-grid {
            grid-template-columns: 1fr;
          }

          .study-header h1 {
            font-size: 2.5rem;
          }

          .study-header p {
            font-size: 1.2rem;
          }

          .progress-overview {
            flex-direction: column;
            align-items: center;
          }

          .nav-tabs {
            flex-direction: column;
            padding: 15px;
          }

          .difficulty-info {
            flex-direction: column;
            text-align: center;
          }

          .difficulty-icon {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }

          .benefit-icon {
            width: 70px;
            height: 70px;
            font-size: 1.8rem;
            margin-bottom: 20px;
          }

          .study-benefits {
            padding: 40px 20px;
          }
        }

        @media (max-width: 480px) {
          .study-header h1 {
            font-size: 2rem;
          }

          .study-header p {
            font-size: 1.1rem;
          }

          .difficulty-icon {
            width: 50px;
            height: 50px;
            font-size: 1.3rem;
          }

          .benefit-icon {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
            margin-bottom: 15px;
          }

          .topic-icon {
            width: 48px;
            height: 48px;
            font-size: 1.3rem;
          }

          .benefits-grid {
            padding: 0 15px;
          }

          .study-benefits {
            padding: 30px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudySection;
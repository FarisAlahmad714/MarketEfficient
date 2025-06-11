import { useRouter } from 'next/router';
import { useState, useEffect, useContext } from 'react';
import StudyTopic from '../../components/StudyTopic';
import TrackedPage from '../../components/TrackedPage';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { studyContent } from '../../lib/studyContent';

export default function StudyTopicPage() {
  const router = useRouter();
  const { topic } = router.query;
  const { user, isLoading } = useAuth();
  const { darkMode } = useContext(ThemeContext);
  const [topicData, setTopicData] = useState(null);
  const [error, setError] = useState(null);

  const topicName = topic ? decodeURIComponent(topic) : '';

  useEffect(() => {
    if (topicName && studyContent[topicName]) {
      setTopicData(studyContent[topicName]);
    } else if (topicName) {
      setError('Topic not found');
    }
  }, [topicName]);

  if (isLoading) {
    return (
      <TrackedPage>
        <div style={{
          minHeight: '100vh',
          background: darkMode 
            ? 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)' 
            : 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)',
          transition: 'background 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading lesson...</p>
          </div>
        </div>
      </TrackedPage>
    );
  }

  if (error) {
    return (
      <TrackedPage>
        <div style={{
          minHeight: '100vh',
          background: darkMode 
            ? 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)' 
            : 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)',
          transition: 'background 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="error-container">
            <h1>Topic Not Found</h1>
            <p>The requested study topic could not be found.</p>
            <button onClick={() => router.push('/study')} className="back-button">
              Back to Study
            </button>
          </div>
        </div>
      </TrackedPage>
    );
  }

  if (!topicData) {
    return (
      <TrackedPage>
        <div style={{
          minHeight: '100vh',
          background: darkMode 
            ? 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)' 
            : 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)',
          transition: 'background 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading content...</p>
          </div>
        </div>
      </TrackedPage>
    );
  }

  return (
    <TrackedPage>
      <div style={{
        minHeight: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)' 
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)',
        transition: 'background 0.3s ease'
      }}>
        <main>
          <StudyTopic topicName={topicName} />
        </main>
      </div>
    </TrackedPage>
  );
}

export async function getStaticPaths() {
  // Generate paths for all study topics
  const paths = Object.keys(studyContent).map(topic => ({
    params: { topic: encodeURIComponent(topic) }
  }));

  return {
    paths,
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params }) {
  const topicName = decodeURIComponent(params.topic);
  
  if (!studyContent[topicName]) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      topicName
    }
  };
}
import { useState, useEffect, useContext } from 'react';
import StudySection from '../../components/StudySection';
import TrackedPage from '../../components/TrackedPage';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function StudyPage() {
  const { user, isLoading } = useAuth();
  const { darkMode } = useContext(ThemeContext);

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
            <p>Loading study materials...</p>
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
          <StudySection />
        </main>
      </div>
    </TrackedPage>
  );
}

export async function getStaticProps() {
  return {
    props: {
      // Any static props if needed
    },
  };
}
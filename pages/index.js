// pages/index.js
import Link from 'next/link';
import { useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import Leaderboard from '../components/Leaderboard';

export default function HomePage() {
  const { darkMode } = useContext(ThemeContext);
  
  useEffect(() => {
    console.log('Home page loaded');
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: darkMode ? '#e0e0e0' : '#333' 
      }}>
        Trading Analysis Platform
      </h1>

      {/* Main Feature Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 8px 16px rgba(0,0,0,0.4)' 
            : '0 8px 16px rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 4px rgba(0,0,0,0.1)';
        }}
        >
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Daily Bias Test</h2>
          <p style={{ 
            color: darkMode ? '#b0b0b0' : '#555', 
            flex: 1,
            marginBottom: '20px'
          }}>
            Test your ability to predict market direction based on historical price data.
            Challenge yourself with real price action scenarios and measure your trading intuition.
          </p>
          <Link href="/bias-test" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px', 
            fontWeight: '500',
            textAlign: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#43A047';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
          }}
          >
            Start Testing
          </Link>
        </div>

        <div style={{ 
          backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 8px 16px rgba(0,0,0,0.4)' 
            : '0 8px 16px rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 4px rgba(0,0,0,0.1)';
        }}
        >
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Charting Exams</h2>
          <p style={{ 
            color: darkMode ? '#b0b0b0' : '#555',
            flex: 1,
            marginBottom: '20px'
          }}>
            Practice technical analysis with interactive charting exercises.
            Master swing points, Fibonacci retracements, and fair value gaps through hands-on practice.
          </p>
          <Link href="/chart-exam" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px', 
            fontWeight: '500',
            textAlign: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#1E88E5';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#2196F3';
          }}
          >
            Start Learning
          </Link>
        </div>
        
        <div style={{ 
          backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 8px 16px rgba(0,0,0,0.4)' 
            : '0 8px 16px rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 4px rgba(0,0,0,0.1)';
        }}
        >
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Your Dashboard</h2>
          <p style={{ 
            color: darkMode ? '#b0b0b0' : '#555',
            flex: 1,
            marginBottom: '20px'
          }}>
            Track your progress, review your test history, and analyze your performance metrics.
            Compare your results over time and identify areas for improvement.
          </p>
          <Link href="/dashboard" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            backgroundColor: '#9C27B0', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px', 
            fontWeight: '500',
            textAlign: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#8E24AA';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#9C27B0';
          }}
          >
            View Dashboard
          </Link>
        </div>
      </div>
      
      {/* Leaderboard Section */}
      <Leaderboard />
      
      {/* Additional Features Section */}
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '8px',
        padding: '25px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginTop: 0,
          marginBottom: '20px'
        }}>
          Improve Your Trading Skills
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <FeatureCard 
            darkMode={darkMode}
            icon="📊"
            title="Pattern Recognition"
            description="Learn to identify key chart patterns through regular practice and testing."
          />
          
          <FeatureCard 
            darkMode={darkMode}
            icon="🧠"
            title="Remove Bias"
            description="Overcome emotional trading and cognitive biases by testing your analysis against actual outcomes."
          />
          
          <FeatureCard 
            darkMode={darkMode}
            icon="📈"
            title="Track Progress"
            description="Monitor your improvement over time with detailed performance metrics and insights."
          />
          
          <FeatureCard 
            darkMode={darkMode}
            icon="🏆"
            title="Compete & Learn"
            description="Challenge yourself against other traders on the leaderboard and learn from the best."
          />
        </div>
      </div>
    </div>
  );
}

// Feature card component
const FeatureCard = ({ darkMode, icon, title, description }) => {
  return (
    <div style={{
      backgroundColor: darkMode ? '#262626' : '#f5f5f5',
      padding: '20px',
      borderRadius: '8px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = darkMode 
        ? '0 6px 12px rgba(0,0,0,0.3)' 
        : '0 6px 12px rgba(0,0,0,0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        fontSize: '2rem',
        marginBottom: '10px'
      }}>
        {icon}
      </div>
      <h3 style={{
        color: darkMode ? '#e0e0e0' : '#333',
        marginTop: 0,
        marginBottom: '10px'
      }}>
        {title}
      </h3>
      <p style={{
        color: darkMode ? '#b0b0b0' : '#666',
        margin: 0
      }}>
        {description}
      </p>
    </div>
  );
};
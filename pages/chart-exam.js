import React, { useContext, useState } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import Link from 'next/link';

const ChartExamIntro = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState(null);

  const examTypes = [
    {
      id: 'swing-analysis',  // Changed from 'swing-points'
      title: 'Swing Point Analysis',
      description: 'Learn to identify key swing points (highs and lows) in chart patterns. Swing points are crucial for determining market structure and potential reversal zones.',
      image: '/images/placeholder-chart.png',
      difficulty: 'Beginner'
    },
    {
      id: 'fibonacci-retracement',  // Changed from 'fibonacci'
      title: 'Fibonacci Retracements',
      description: 'Master the use of Fibonacci retracement levels to identify potential support and resistance zones. These mathematical ratios help predict where price might reverse.',
      image: '/images/placeholder-chart.png',
      difficulty: 'Intermediate'
    },
    {
      id: 'fair-value-gaps',  // Changed from 'fvg'
      title: 'Fair Value Gaps (FVG)',
      description: 'Understand how to spot and trade Fair Value Gaps - areas where price makes a significant move leaving an imbalance that often gets filled later.',
      image: '/images/placeholder-chart.png',
      difficulty: 'Advanced'
    }
  ];

  const handleExamStart = () => {
    if (selectedExam) {
      router.push(`/chart-exam/${selectedExam}`);
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        Technical Analysis Chart Exam
      </h1>

      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '40px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          marginBottom: '20px',
          color: darkMode ? '#e0e0e0' : '#333',
          fontSize: '1.5rem'
        }}>
          Test Your Technical Analysis Skills
        </h2>
        <p style={{ 
          marginBottom: '20px',
          lineHeight: '1.6',
          color: darkMode ? '#b0b0b0' : '#555'
        }}>
          Our chart exams help you practice and improve your technical analysis skills using real market data. 
          Select an exam type below to begin, and test your ability to identify key patterns and make accurate market predictions.
        </p>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: darkMode ? '#0d47a1' : '#e3f2fd',
            color: darkMode ? '#90caf9' : '#0d47a1',
            borderRadius: '20px',
            fontSize: '0.9rem',
            display: 'inline-block'
          }}>
            <span style={{ marginRight: '6px' }}>•</span>
            Interactive Charts
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: darkMode ? '#0d47a1' : '#e3f2fd',
            color: darkMode ? '#90caf9' : '#0d47a1',
            borderRadius: '20px',
            fontSize: '0.9rem',
            display: 'inline-block'
          }}>
            <span style={{ marginRight: '6px' }}>•</span>
            Drawing Tools
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: darkMode ? '#0d47a1' : '#e3f2fd',
            color: darkMode ? '#90caf9' : '#0d47a1',
            borderRadius: '20px',
            fontSize: '0.9rem',
            display: 'inline-block'
          }}>
            <span style={{ marginRight: '6px' }}>•</span>
            Real-time Feedback
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '30px',
        marginBottom: '40px'
      }}>
        {examTypes.map(exam => (
          <div 
            key={exam.id}
            style={{
              backgroundColor: selectedExam === exam.id 
                ? (darkMode ? '#1a237e' : '#e8eaf6') 
                : (darkMode ? '#262626' : 'white'),
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              border: selectedExam === exam.id 
                ? `2px solid ${darkMode ? '#5c6bc0' : '#3f51b5'}`
                : `2px solid transparent`,
              cursor: 'pointer'
            }}
            onClick={() => setSelectedExam(exam.id)}
          >
            <div style={{
              height: '180px',
              backgroundColor: darkMode ? '#333' : '#f5f5f5',
              backgroundImage: `url(${exam.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                backgroundColor: exam.difficulty === 'Beginner' 
                  ? '#4CAF50' 
                  : exam.difficulty === 'Intermediate'
                    ? '#FF9800'
                    : '#F44336',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {exam.difficulty}
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ 
                marginBottom: '15px',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                {exam.title}
              </h3>
              <p style={{ 
                marginBottom: '20px',
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                {exam.description}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: '6px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '0.9rem'
                }}>
                  Select
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px'
      }}>
        <button
          onClick={handleExamStart}
          disabled={!selectedExam}
          style={{
            padding: '15px 40px',
            backgroundColor: selectedExam ? '#2196F3' : (darkMode ? '#555' : '#ccc'),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedExam ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '18px',
            transition: 'all 0.3s ease',
            opacity: selectedExam ? 1 : 0.7
          }}
        >
          Start Exam
        </button>
      </div>
    </div>
  );
};

export default ChartExamIntro; 
import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import Link from 'next/link';

const ChartExamIntro = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const examTypes = [
    {
      id: 'swing-analysis',
      title: 'Swing Point Analysis',
      description: 'Learn to identify key swing points (highs and lows) in chart patterns. Swing points are crucial for determining market structure and potential reversal zones.',
      image: '/images/swing.jpg',
      difficulty: 'Beginner'
    },
    {
      id: 'fibonacci-retracement',
      title: 'Fibonacci Retracements',
      description: 'Master the use of Fibonacci retracement levels to identify potential support and resistance zones. These mathematical ratios help predict where price might reverse.',
      image: '/images/fib.jpg',
      difficulty: 'Intermediate'
    },
    {
      id: 'fair-value-gaps',
      title: 'Fair Value Gaps (FVG)',
      description: 'Understand how to spot and trade Fair Value Gaps - areas where price makes a significant move leaving an imbalance that often gets filled later.',
      image: '/images/fvg.jpg',
      difficulty: 'Advanced'
    }
  ];

  const handleExamStart = () => {
    if (selectedExam) {
      router.push(`/chart-exam/${selectedExam}`);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === examTypes.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? examTypes.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // If the selected exam isn't currently visible, select the currently visible one
  useEffect(() => {
    if (selectedExam !== examTypes[currentIndex].id) {
      setSelectedExam(examTypes[currentIndex].id);
    }
  }, [currentIndex, examTypes]);

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
          Navigate through the exam types below to begin, and test your ability to identify key patterns and make accurate market predictions.
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

      {/* 3D Carousel Container */}
      <div style={{
        position: 'relative',
        marginBottom: '40px',
        height: '580px', // Increased height to accommodate 3D effect
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}>
        {/* Carousel Navigation - Previous Button */}
        <button 
          onClick={prevSlide}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20, // Increased z-index
            padding: '12px 16px',
            backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px'
          }}
        >
          &#10094;
        </button>
        
        {/* Carousel Track - Contains all slides */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease'
        }}>
          {/* Previous Slide (Left) */}
          {examTypes.length > 1 && (
            <div 
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '500px',
                height: '590px',
                transform: 'translate(-50%, -50%) translateX(-65%) translateZ(-200px) rotateY(25deg)',
                opacity: 0.6,
                transition: 'all 0.5s ease',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: darkMode ? '#262626' : 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  height: '300px', // Increased image height
                  backgroundColor: darkMode ? '#333' : '#f5f5f5',
                  backgroundImage: `url(${examTypes[currentIndex === 0 ? examTypes.length - 1 : currentIndex - 1].image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    backgroundColor: examTypes[currentIndex === 0 ? examTypes.length - 1 : currentIndex - 1].difficulty === 'Beginner' 
                      ? '#4CAF50' 
                      : examTypes[currentIndex === 0 ? examTypes.length - 1 : currentIndex - 1].difficulty === 'Intermediate'
                        ? '#FF9800'
                        : '#F44336',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {examTypes[currentIndex === 0 ? examTypes.length - 1 : currentIndex - 1].difficulty}
                  </div>
                </div>
                <div style={{ padding: '25px', flex: 1 }}>
                  <h3 style={{ 
                    marginBottom: '15px',
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '1.4rem'
                  }}>
                    {examTypes[currentIndex === 0 ? examTypes.length - 1 : currentIndex - 1].title}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Main Carousel Item - Current Exam */}
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '500px',
                              height: '590px',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              transition: 'all 0.5s ease',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedExam(examTypes[currentIndex].id)}
          >
            <div 
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: selectedExam === examTypes[currentIndex].id 
                  ? (darkMode ? '#1a237e' : '#e8eaf6') 
                  : (darkMode ? '#262626' : 'white'),
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: darkMode ? '0 8px 30px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                border: selectedExam === examTypes[currentIndex].id 
                  ? `2px solid ${darkMode ? '#5c6bc0' : '#3f51b5'}`
                  : `2px solid transparent`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                height: '380px', // Further increased image height
                backgroundColor: darkMode ? '#333' : '#f5f5f5',
                backgroundImage: `url(${examTypes[currentIndex].image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '5px 10px',
                  backgroundColor: examTypes[currentIndex].difficulty === 'Beginner' 
                    ? '#4CAF50' 
                    : examTypes[currentIndex].difficulty === 'Intermediate'
                      ? '#FF9800'
                      : '#F44336',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {examTypes[currentIndex].difficulty}
                </div>
              </div>
              <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ 
                  marginBottom: '15px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '1.4rem'
                }}>
                  {examTypes[currentIndex].title}
                </h3>
                <p style={{ 
                  marginBottom: '20px',
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  flex: 1
                }}>
                  {examTypes[currentIndex].description}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    padding: '10px 20px',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                    borderRadius: '6px',
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    Selected
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Slide (Right) */}
          {examTypes.length > 1 && (
            <div 
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '500px',
                height: '590px',
                transform: 'translate(-50%, -50%) translateX(65%) translateZ(-200px) rotateY(-25deg)',
                opacity: 0.6,
                transition: 'all 0.5s ease',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: darkMode ? '#262626' : 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  height: '300px', // Increased image height
                  backgroundColor: darkMode ? '#333' : '#f5f5f5',
                  backgroundImage: `url(${examTypes[currentIndex === examTypes.length - 1 ? 0 : currentIndex + 1].image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    backgroundColor: examTypes[currentIndex === examTypes.length - 1 ? 0 : currentIndex + 1].difficulty === 'Beginner' 
                      ? '#4CAF50' 
                      : examTypes[currentIndex === examTypes.length - 1 ? 0 : currentIndex + 1].difficulty === 'Intermediate'
                        ? '#FF9800'
                        : '#F44336',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {examTypes[currentIndex === examTypes.length - 1 ? 0 : currentIndex + 1].difficulty}
                  </div>
                </div>
                <div style={{ padding: '25px', flex: 1 }}>
                  <h3 style={{ 
                    marginBottom: '15px',
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '1.4rem'
                  }}>
                    {examTypes[currentIndex === examTypes.length - 1 ? 0 : currentIndex + 1].title}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Carousel Navigation - Next Button */}
        <button 
          onClick={nextSlide}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20, // Increased z-index
            padding: '12px 16px',
            backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px'
          }}
        >
          &#10095;
        </button>
      </div>

      {/* Carousel Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        {examTypes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: currentIndex === index 
                ? '#2196F3' 
                : darkMode ? '#555' : '#ccc',
              margin: '0 6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Action Button */}
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
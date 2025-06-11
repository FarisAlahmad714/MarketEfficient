import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import Link from 'next/link';
import TrackedPage from '../components/TrackedPage';

const ChartExamIntro = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('next');

  // Add CSS animation styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes progressBar {
        0% { transform: scaleX(0); }
        100% { transform: scaleX(1); }
      }
      
      @keyframes slideInFromRight {
        0% { 
          transform: translate(-50%, -50%) translateX(100%) rotateY(-90deg) scale(0.8);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) translateX(50%) rotateY(-45deg) scale(0.9);
          opacity: 0.5;
        }
        100% { 
          transform: translate(-50%, -50%) translateX(0%) rotateY(0deg) scale(1);
          opacity: 1;
        }
      }
      
      @keyframes slideInFromLeft {
        0% { 
          transform: translate(-50%, -50%) translateX(-100%) rotateY(90deg) scale(0.8);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) translateX(-50%) rotateY(45deg) scale(0.9);
          opacity: 0.5;
        }
        100% { 
          transform: translate(-50%, -50%) translateX(0%) rotateY(0deg) scale(1);
          opacity: 1;
        }
      }
      
      @keyframes slideOutToLeft {
        0% { 
          transform: translate(-50%, -50%) translateX(0%) rotateY(0deg) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) translateX(-50%) rotateY(45deg) scale(0.9);
          opacity: 0.5;
        }
        100% { 
          transform: translate(-50%, -50%) translateX(-100%) rotateY(90deg) scale(0.8);
          opacity: 0;
        }
      }
      
      @keyframes slideOutToRight {
        0% { 
          transform: translate(-50%, -50%) translateX(0%) rotateY(0deg) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) translateX(50%) rotateY(-45deg) scale(0.9);
          opacity: 0.5;
        }
        100% { 
          transform: translate(-50%, -50%) translateX(100%) rotateY(-90deg) scale(0.8);
          opacity: 0;
        }
      }
      
      @keyframes mobileSlideIn {
        0% { 
          transform: translateX(-${currentIndex * (100 / examTypes.length)}%) scale(0.8) rotateX(45deg);
          opacity: 0;
        }
        50% {
          transform: translateX(-${currentIndex * (100 / examTypes.length)}%) scale(0.9) rotateX(22deg);
          opacity: 0.7;
        }
        100% { 
          transform: translateX(-${currentIndex * (100 / examTypes.length)}%) scale(1) rotateX(0deg);
          opacity: 1;
        }
      }
      
      @keyframes cardFlip {
        0% { transform: rotateY(0deg) scale(1); }
        50% { transform: rotateY(90deg) scale(0.8); }
        100% { transform: rotateY(0deg) scale(1); }
      }
      
      @keyframes bounceIn {
        0% { 
          transform: scale(0.3) rotate(-10deg);
          opacity: 0;
        }
        50% { 
          transform: scale(1.05) rotate(5deg);
          opacity: 0.8;
        }
        70% { 
          transform: scale(0.9) rotate(-2deg);
          opacity: 0.9;
        }
        100% { 
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }
      
      @keyframes sideCardSlide {
        0% { 
          transform: translate(-50%, -50%) translateX(var(--start-x)) translateZ(-200px) rotateY(var(--start-rotate)) scale(0.6);
          opacity: 0.4;
        }
        100% { 
          transform: translate(-50%, -50%) translateX(var(--end-x)) translateZ(-200px) rotateY(var(--end-rotate)) scale(0.8);
          opacity: 0.6;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % examTypes.length);
      }, 4000); // Change slide every 4 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, examTypes.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsPlaying(true);
  };

  const handleExamStart = (examId) => {
    setSelectedExam(examId);
  };

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection('next');
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === examTypes.length - 1 ? 0 : prevIndex + 1
      );
      setTimeout(() => setIsTransitioning(false), 100);
    }, 200);
    
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 2000);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection('prev');
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? examTypes.length - 1 : prevIndex - 1
      );
      setTimeout(() => setIsTransitioning(false), 100);
    }, 200);
    
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 2000);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setDirection(index > currentIndex ? 'next' : 'prev');
    
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 200);
    
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 3000);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPlaying(false); // Pause during touch
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    
    setTimeout(() => setIsPlaying(true), 2000); // Resume auto-play
  };

  // Removed auto-selection logic - selectedExam should only be set when user clicks Start

  // Mobile carousel styles
  const mobileCarouselStyle = {
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    borderRadius: '12px'
  };

  const mobileSlideTrackStyle = {
    display: 'flex',
    width: `${examTypes.length * 100}%`,
    transform: `translateX(-${currentIndex * (100 / examTypes.length)}%)`,
    transition: isTransitioning 
      ? 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
      : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    animation: isTransitioning ? 'mobileSlideIn 0.8s ease-out' : 'none'
  };

  const mobileSlideStyle = {
    width: `${100 / examTypes.length}%`,
    flexShrink: 0,
    padding: '0 10px',
    boxSizing: 'border-box'
  };

  // Desktop 3D carousel styles
  const desktopCarouselStyle = {
    position: 'relative',
    marginBottom: isMobile ? '20px' : '40px',
    height: isMobile ? 'auto' : '580px',
    perspective: isMobile ? 'none' : '1000px',
    transformStyle: isMobile ? 'initial' : 'preserve-3d'
  };

  const getCardWidth = () => isMobile ? '100%' : '500px';
  const getCardHeight = () => isMobile ? 'auto' : '590px';

  return (
    <TrackedPage>
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: isMobile ? '20px 15px' : '40px 20px',
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '20px' : '40px',
        color: darkMode ? '#e0e0e0' : '#333',
        fontSize: isMobile ? '1.8rem' : '2.5rem'
      }}>
        Technical Analysis Chart Exam
      </h1>

      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
        borderRadius: '8px',
        padding: isMobile ? '20px' : '30px',
        marginBottom: isMobile ? '20px' : '40px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          marginBottom: isMobile ? '15px' : '20px',
          color: darkMode ? '#e0e0e0' : '#333',
          fontSize: isMobile ? '1.3rem' : '1.5rem'
        }}>
          Test Your Technical Analysis Skills
        </h2>
        <p style={{ 
          marginBottom: isMobile ? '15px' : '20px',
          lineHeight: '1.6',
          color: darkMode ? '#b0b0b0' : '#555',
          fontSize: isMobile ? '0.95rem' : '1rem'
        }}>
          Our chart exams help you practice and improve your technical analysis skills using real market data. 
          Navigate through the exam types below to begin, and test your ability to identify key patterns and make accurate market predictions.
        </p>
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '10px',
          flexWrap: 'wrap'
        }}>
          {['Interactive Charts', 'Drawing Tools', 'Real-time Feedback'].map((feature, index) => (
            <div key={index} style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              backgroundColor: darkMode ? '#0d47a1' : '#e3f2fd',
              color: darkMode ? '#90caf9' : '#0d47a1',
              borderRadius: '20px',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              display: 'inline-block'
            }}>
              <span style={{ marginRight: '6px' }}>•</span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Carousel Container */}
      <div 
        style={desktopCarouselStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {isMobile ? (
          // Mobile: Simple swipe carousel
          <div style={mobileCarouselStyle}>
            <div style={mobileSlideTrackStyle}>
              {examTypes.map((exam, index) => (
                <div 
                  key={exam.id}
                  style={mobileSlideStyle}
                >
                  <div 
                    style={{
                      backgroundColor: darkMode ? '#262626' : 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: darkMode ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.1)',
                      border: `2px solid transparent`,
                      cursor: 'pointer',
                      height: '100%',
                      transform: `scale(${index === currentIndex ? 1 : 0.95})`,
                      transition: isTransitioning 
                        ? 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
                        : 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      opacity: index === currentIndex ? 1 : 0.8,
                      animation: isTransitioning && index === currentIndex ? 'cardFlip 0.8s ease-in-out' : 'none'
                    }}
                  >
                    <div style={{
                      height: '200px',
                      backgroundColor: darkMode ? '#333' : '#f5f5f5',
                      backgroundImage: `url(${exam.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '4px 8px',
                        backgroundColor: exam.difficulty === 'Beginner' 
                          ? '#4CAF50' 
                          : exam.difficulty === 'Intermediate'
                            ? '#FF9800'
                            : '#F44336',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {exam.difficulty}
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ 
                        marginBottom: '12px',
                        color: darkMode ? '#e0e0e0' : '#333',
                        fontSize: '1.2rem'
                      }}>
                        {exam.title}
                      </h3>
                      <p style={{ 
                        marginBottom: '15px',
                        color: darkMode ? '#b0b0b0' : '#666',
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                      }}>
                        {exam.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={() => handleExamStart(exam.id)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease',
                            touchAction: 'manipulation',
                            transform: 'scale(1)',
                            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
                          }}
                        >
                          Start Exam
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Desktop: 3D carousel (existing code)
          <>
            {/* Carousel Navigation - Previous Button */}
            <button 
              onClick={prevSlide}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
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
                height: '50px',
                transition: 'all 0.3s ease',
                opacity: hoveredCard !== null || isMobile ? 1 : 0.7
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                e.target.style.backgroundColor = darkMode ? 'rgba(33, 150, 243, 1)' : 'rgba(33, 150, 243, 1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(-50%) scale(1)';
                e.target.style.backgroundColor = darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.9)';
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
              transition: isTransitioning 
                ? 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
                : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}>
              {/* Previous Slide (Left) */}
              {examTypes.length > 1 && (
                <div 
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: getCardWidth(),
                    height: getCardHeight(),
                    transform: 'translate(-50%, -50%) translateX(-65%) translateZ(-200px) rotateY(25deg)',
                    opacity: isTransitioning ? 0.3 : 0.6,
                    transition: isTransitioning 
                      ? 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
                      : 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    pointerEvents: 'none',
                    animation: isTransitioning ? 'sideCardSlide 0.8s ease-out' : 'none'
                  }}
                  ref={(el) => {
                    if (el && isTransitioning) {
                      el.style.setProperty('--start-x', direction === 'next' ? '-65%' : '65%');
                      el.style.setProperty('--end-x', '-65%');
                      el.style.setProperty('--start-rotate', direction === 'next' ? '25deg' : '-25deg');
                      el.style.setProperty('--end-rotate', '25deg');
                    }
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
                      height: '300px',
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
                  width: getCardWidth(),
                  height: getCardHeight(),
                  transform: `translate(-50%, -50%) scale(${hoveredCard === currentIndex ? 1.05 : 1})`,
                  zIndex: 10,
                  transition: isTransitioning 
                    ? 'none' 
                    : 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  cursor: 'pointer',
                  animation: isTransitioning 
                    ? (direction === 'next' ? 'slideInFromRight 0.8s ease-out' : 'slideInFromLeft 0.8s ease-out')
                    : 'none'
                }}
                onMouseEnter={() => setHoveredCard(currentIndex)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: darkMode ? '#262626' : 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: hoveredCard === currentIndex 
                      ? (darkMode ? '0 15px 40px rgba(0,0,0,0.6)' : '0 15px 40px rgba(0,0,0,0.3)')
                      : (darkMode ? '0 8px 30px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.2)'),
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    border: `2px solid transparent`,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: hoveredCard === currentIndex ? 'translateY(-5px)' : 'translateY(0)'
                  }}
                >
                  <div style={{
                    height: '380px',
                    backgroundColor: darkMode ? '#333' : '#f5f5f5',
                    backgroundImage: `url(${examTypes[currentIndex].image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    transition: isTransitioning 
                      ? 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
                      : 'transform 0.4s ease',
                    transform: isTransitioning 
                      ? 'scale(1.1) rotate(2deg)' 
                      : (hoveredCard === currentIndex ? 'scale(1.02)' : 'scale(1)'),
                    filter: isTransitioning ? 'brightness(1.1) contrast(1.1)' : 'none'
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
                      <button
                        onClick={() => handleExamStart(examTypes[currentIndex].id)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'all 0.3s ease',
                          transform: 'scale(1)',
                          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
                        }}
                      >
                        Start Exam
                      </button>
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
                    width: getCardWidth(),
                    height: getCardHeight(),
                    transform: 'translate(-50%, -50%) translateX(65%) translateZ(-200px) rotateY(-25deg)',
                    opacity: isTransitioning ? 0.3 : 0.6,
                    transition: isTransitioning 
                      ? 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
                      : 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    pointerEvents: 'none',
                    animation: isTransitioning ? 'sideCardSlide 0.8s ease-out' : 'none'
                  }}
                  ref={(el) => {
                    if (el && isTransitioning) {
                      el.style.setProperty('--start-x', direction === 'next' ? '65%' : '-65%');
                      el.style.setProperty('--end-x', '65%');
                      el.style.setProperty('--start-rotate', direction === 'next' ? '-25deg' : '25deg');
                      el.style.setProperty('--end-rotate', '-25deg');
                    }
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
                      height: '300px',
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
                zIndex: 20,
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
                height: '50px',
                transition: 'all 0.3s ease',
                opacity: hoveredCard !== null || isMobile ? 1 : 0.7
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                e.target.style.backgroundColor = darkMode ? 'rgba(33, 150, 243, 1)' : 'rgba(33, 150, 243, 1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(-50%) scale(1)';
                e.target.style.backgroundColor = darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.9)';
              }}
            >
              &#10095;
            </button>
          </>
        )}

        {/* Mobile Navigation Buttons */}
        {isMobile && (
          <>
            <button 
              onClick={prevSlide}
              style={{
                position: 'absolute',
                left: '5px',
                top: '40%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                padding: '15px',
                backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.9)' : 'rgba(33, 150, 243, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
                boxShadow: '0 2px 15px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                touchAction: 'manipulation'
              }}
            >
              &#10094;
            </button>
            
            <button 
              onClick={nextSlide}
              style={{
                position: 'absolute',
                right: '5px',
                top: '40%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                padding: '15px',
                backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.9)' : 'rgba(33, 150, 243, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
                boxShadow: '0 2px 15px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                touchAction: 'manipulation'
              }}
            >
              &#10095;
            </button>
          </>
        )}
      </div>

      {/* Auto-play Progress Indicator */}
      {isPlaying && !isMobile && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '4px',
          backgroundColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#2196F3',
            borderRadius: '2px',
            animation: 'progressBar 4s linear infinite',
            transformOrigin: 'left'
          }} />
        </div>
      )}

      {/* Carousel Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: isMobile ? '20px' : '30px',
        marginTop: isMobile ? '20px' : '0'
      }}>
        {examTypes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: isMobile ? '14px' : '12px',
              height: isMobile ? '14px' : '12px',
              borderRadius: '50%',
              backgroundColor: currentIndex === index 
                ? '#2196F3' 
                : darkMode ? '#555' : '#ccc',
              margin: isMobile ? '0 8px' : '0 6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              touchAction: 'manipulation',
              transform: currentIndex === index 
                ? (isTransitioning ? 'scale(1.5) rotate(180deg)' : 'scale(1.2)') 
                : 'scale(1)',
              boxShadow: currentIndex === index ? '0 0 15px rgba(33, 150, 243, 0.6)' : 'none',
              animation: currentIndex === index && isTransitioning ? 'bounceIn 0.6s ease-out' : 'none'
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Asset Selection Modal */}
      {selectedExam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setSelectedExam(null)}>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExam(null);
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: darkMode ? '#e0e0e0' : '#666',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            {/* Modal Header */}
            <h3 style={{
              margin: '0 0 10px 0',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '1.5rem'
            }}>
              {examTypes.find(exam => exam.id === selectedExam)?.title}
            </h3>

            <p style={{
              margin: '0 0 25px 0',
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '0.95rem'
            }}>
              Choose your preferred asset type for this exam
            </p>

            {/* Asset Type Selection */}
            <div style={{ marginBottom: '25px' }}>
              <div
                onClick={() => router.push(`/chart-exam/${selectedExam}?assetType=crypto`)}
                style={{
                  padding: '20px',
                  border: `2px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: darkMode ? '#333' : '#f8f9fa'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#2196F3';
                  e.currentTarget.style.backgroundColor = darkMode ? '#3a3a3a' : '#f0f8ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#404040' : '#e0e0e0';
                  e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '24px', marginRight: '12px' }}>₿</span>
                  <h4 style={{
                    margin: 0,
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '1.1rem'
                  }}>
                    Cryptocurrency
                  </h4>
                </div>
                <p style={{
                  margin: 0,
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '0.9rem'
                }}>
                  BTC, ETH, SOL, and other digital assets • Higher volatility • 24/7 markets
                </p>
              </div>

              <div
                onClick={() => router.push(`/chart-exam/${selectedExam}?assetType=stocks`)}
                style={{
                  padding: '20px',
                  border: `2px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: darkMode ? '#333' : '#f8f9fa'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#2196F3';
                  e.currentTarget.style.backgroundColor = darkMode ? '#3a3a3a' : '#f0f8ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#404040' : '#e0e0e0';
                  e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '24px', marginRight: '12px' }}>📈</span>
                  <h4 style={{
                    margin: 0,
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '1.1rem'
                  }}>
                    Stocks
                  </h4>
                </div>
                <p style={{
                  margin: 0,
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '0.9rem'
                }}>
                  AAPL, NVDA, TSLA, and other equities • Traditional patterns • Market hours
                </p>
              </div>
            </div>

            {/* Randomization Info */}
            <div style={{
              backgroundColor: darkMode ? '#1a1a1a' : '#f0f8ff',
              border: `1px solid ${darkMode ? '#404040' : '#e3f2fd'}`,
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h5 style={{
                margin: '0 0 8px 0',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '8px' }}>🎲</span>
                Exam Randomization
              </h5>
              <p style={{
                margin: 0,
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}>
                Each exam randomly selects different assets and timeframes:
                <br />
                <strong>• Swing Analysis & Fibonacci:</strong> 1h, 4h, 1d, 1w timeframes
                <br />
                <strong>• Fair Value Gaps:</strong> 1h, 4h, 1d timeframes (no weekly)
                <br />
                Historical data spans 1-2 years for variety in market conditions.
              </p>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setSelectedExam(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: `2px solid ${darkMode ? '#666' : '#ccc'}`,
                  borderRadius: '6px',
                  color: darkMode ? '#e0e0e0' : '#666',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TrackedPage>
  );
};

export default ChartExamIntro;
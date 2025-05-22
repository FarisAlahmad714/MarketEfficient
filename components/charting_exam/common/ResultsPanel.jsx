import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTimes as FaX, FaExclamationTriangle, FaEye, FaEyeSlash, FaRuler } from 'react-icons/fa';

// Background overlay - now passes clicks through when transparent
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, ${props => props.$transparent ? 0 : 0.6});
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  transition: background-color 0.3s ease;
  
  /* Critical fix: pointer-events should be 'none' when transparent to allow interaction with background */
  pointer-events: ${props => props.$transparent ? 'none' : 'auto'};
`;

// Main results container - completely invisible in chart view mode
const ResultsContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background-color: ${props => props.$transparent 
    ? 'rgba(0, 0, 0, 0)'  
    : (props.$isDarkMode ? '#262626' : '#f5f5f5')};
  border-radius: 12px;
  box-shadow: ${props => props.$transparent 
    ? 'none' 
    : '0 10px 30px rgba(0, 0, 0, 0.3)'};
  padding: 25px;
  overflow-y: auto;
  z-index: 100;
  transition: all 0.3s ease;
  border: none;
  opacity: ${props => props.$transparent ? 0 : 1};
  
  /* In transparent mode, this becomes invisible and stops pointer events */
  pointer-events: ${props => props.$transparent ? 'none' : 'auto'};
  visibility: ${props => props.$transparent ? 'hidden' : 'visible'};
`;

// Toggle button that remains visible even in transparent mode
const TransparencyToggle = styled(motion.button)`
  position: fixed;
  top: 90px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.$transparent
    ? (props.$isDarkMode ? '#3f51b5' : '#2196F3')
    : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')};
  border: ${props => props.$transparent ? '2px solid white' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$transparent ? 'white' : (props.$isDarkMode ? '#b0b0b0' : '#666')};
  transition: all 0.2s ease;
  z-index: 102;
  box-shadow: ${props => props.$transparent ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none'};
  
  /* Critical: Toggle button always needs pointer events to stay interactive */
  pointer-events: auto !important;
  
  &:hover {
    background-color: ${props => props.$transparent
      ? (props.$isDarkMode ? '#303f9f' : '#1976D2')
      : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')};
    transform: scale(1.1);
  }
`;

const TransparencyMessage = styled(motion.div)`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 0.9rem;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 101;
  pointer-events: none;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
  transition: all 0.2s ease;
  z-index: 2;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  }
`;

// Continue floating button that appears when in transparent mode
const ContinueFloatingButton = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 25px;
  background-color: ${props => props.$isDarkMode ? '#3f51b5' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 102;
  
  /* Critical: Continue button always needs pointer events to stay interactive */
  pointer-events: auto !important;
  
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? '#303f9f' : '#1976D2'};
    transform: translateY(-2px);
  }
`;

const ResultsHeader = styled.div`
  margin-bottom: 20px;
  padding-right: 30px; /* space for close button */
`;

const ResultsTitle = styled.h3`
  font-size: 1.6rem;
  margin-bottom: 10px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const ScoreSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 10px;
`;

const ScoreLabel = styled.span`
  font-size: 1.1rem;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const ScoreValue = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  color: ${props => props.good ? '#4CAF50' : '#F44336'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${props => props.$isDarkMode ? '#333' : '#ddd'};
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background-color: #4CAF50;
  width: ${props => props.percentage}%;
  border-radius: 4px;
`;

const FeedbackSection = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 10px;
  background-color: ${props => props.type === 'correct' 
    ? (props.$isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)') 
    : props.type === 'incorrect' 
      ? (props.$isDarkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)')
      : props.type === 'info'
        ? (props.$isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)')
        : (props.$isDarkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)')
  };
  border: 1px solid ${props => props.type === 'correct' 
    ? '#4CAF50' 
    : props.type === 'incorrect' 
      ? '#F44336'
      : props.type === 'info'
        ? '#2196F3'
        : '#FF9800'
  };
`;

const SectionTitle = styled.h4`
  font-size: 1.1rem;
  margin: 0 0 15px 0;
  color: ${props => props.type === 'correct' 
    ? '#4CAF50' 
    : props.type === 'incorrect' 
      ? '#F44336'
      : props.type === 'info'
        ? '#2196F3'
        : '#FF9800'
  };
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeedbackCard = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const FeedbackType = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: ${props => 
    props.type === 'high' ? '#4CAF50' :
    props.type === 'low' ? '#2196F3' :
    props.type === 'bullish' ? '#4CAF50' :
    props.type === 'bearish' ? '#F44336' :
    props.type === 'uptrend' ? '#4CAF50' :
    props.type === 'downtrend' ? '#F44336' :
    props.type === 'missed' ? '#FF9800' : '#9E9E9E'
  };
  margin-bottom: 8px;
`;

const FeedbackPrice = styled.div`
  font-size: 0.95rem;
  margin-bottom: 8px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  font-family: 'Roboto Mono', monospace;
`;

const FeedbackAdvice = styled.p`
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
  line-height: 1.5;
`;

// Fibonacci answer display
const FibonacciAnswerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
  
  @media (max-width: 460px) {
    grid-template-columns: 1fr;
  }
`;

// FVG answer display - similar to Fibonacci but adapted for FVGs
const FVGAnswerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 10px;
`;

const FibonacciLevelItem = styled(motion.div)`
  padding: 10px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  h5 {
    margin: 0 0 8px 0;
    font-size: 0.9rem;
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  }
  
  .level-price {
    font-family: 'Roboto Mono', monospace;
    font-weight: ${props => props.isKey ? 'bold' : 'normal'};
    font-size: 0.9rem;
    margin-bottom: 4px;
    color: ${props => props.isKey 
      ? '#F0B90B' 
      : (props.$isDarkMode ? '#e0e0e0' : '#333')};
    display: flex;
    justify-content: space-between;
    
    span:last-child {
      opacity: ${props => props.isKey ? 1 : 0.7};
    }
  }
  
  .level-date {
    font-size: 0.8rem;
    color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
  }
`;

const FVGItem = styled(motion.div)`
  padding: 10px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.type === 'bullish' ? '#4CAF50' : '#F44336'};
  
  h5 {
    margin: 0 0 8px 0;
    font-size: 0.9rem;
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .gap-details {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.9rem;
    margin-bottom: 4px;
    color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
    display: flex;
    justify-content: space-between;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: ${props => props.missed ? '#FF9800' : '#4CAF50'};
`;

const KeyLevelBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  background-color: ${props => props.$isDarkMode ? 'rgba(240, 185, 11, 0.2)' : 'rgba(240, 185, 11, 0.1)'};
  border: 1px solid #F0B90B;
  border-radius: 3px;
  margin-left: 8px;
  font-size: 0.7rem;
  color: #F0B90B;
  font-weight: bold;
`;

const ContinueButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background-color: ${props => props.$isDarkMode ? '#3f51b5' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? '#303f9f' : '#1976D2'};
  }
`;

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } }
};

const progressVariants = {
  hidden: { width: 0 },
  visible: percentage => ({ width: `${percentage}%`, transition: { duration: 0.8 } })
};

const buttonPulseVariants = {
  pulse: {
    scale: [1, 1.1, 1],
    boxShadow: [
      '0 0 10px rgba(255, 255, 255, 0.5)', 
      '0 0 20px rgba(255, 255, 255, 0.8)', 
      '0 0 10px rgba(255, 255, 255, 0.5)'
    ],
    transition: {
      repeat: Infinity,
      repeatType: "reverse",
      duration: 2
    }
  }
};

// Animation variants for Fibonacci levels
const fibItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: custom => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: custom * 0.1,
      type: 'spring',
      damping: 15, 
      stiffness: 200 
    } 
  })
};

// Animation variants for FVG items
const fvgItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: custom => ({ 
    opacity: 1, 
    x: 0, 
    transition: { 
      delay: custom * 0.1,
      type: 'spring',
      damping: 15, 
      stiffness: 200 
    } 
  })
};

const ResultsPanel = ({ results, onContinue, examType, part, chartCount, isDarkMode }) => {
  const [transparent, setTransparent] = useState(false);
  const [showTransparencyMessage, setShowTransparencyMessage] = useState(false);
  
  if (!results) return null;
  
  const scorePercentage = results.totalExpectedPoints > 0 
    ? (results.score / results.totalExpectedPoints) * 100 
    : 0;

  // Toggle transparency mode
  const toggleTransparency = () => {
    setTransparent(!transparent);
    // Show message
    setShowTransparencyMessage(true);
    // Hide message after 3 seconds
    setTimeout(() => {
      setShowTransparencyMessage(false);
    }, 3000);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onContinue();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onContinue]);
  
  // Format date
  const formatDate = (time) => {
    if (!time) return "N/A";
    try {
      const date = new Date(time * 1000);
      return date.toLocaleDateString();
    } catch (err) {
      return "Invalid Date";
    }
  };
  
  // Fixed getFeedbackTypeTitle function to properly handle Fibonacci retracement feedback
  const getFeedbackTypeTitle = (feedback) => {
    if (!feedback) return 'Unknown';
    
    // First try to use the type property
    if (feedback.type) {
      switch (feedback.type) {
        case 'high':
          return 'HIGH';
        case 'low':
          return 'LOW';
        case 'bullish':
          return 'BULLISH';
        case 'bearish':
          return 'BEARISH';
        case 'uptrend':
          return 'UPTREND';
        case 'downtrend':
          return 'DOWNTREND';
        case 'missed_point':
        case 'missed_gap':
        case 'missed_retracement':
          return 'MISSED';
        case 'no_gaps':
          return 'CORRECT';
        default:
          return feedback.type.toUpperCase();
      }
    }
    
    // If type is missing, try to use direction (used by Fibonacci retracement)
    if (feedback.direction) {
      return feedback.direction.toUpperCase();
    }
    
    // If neither exists, return Unknown
    return 'Unknown';
  };
  
  // Get appropriate continue button text
  const getContinueText = () => {
    if (chartCount >= 5 && 
        ((examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') ? 
         part === 2 : true)) {
      return 'Finish Exam';
    }
    return 'Continue';
  };
  
  // Check if a Fibonacci level is a key level
  const isKeyFibLevel = (level) => {
    return [0.5, 0.618, 0.705].includes(level);
  };
  
  return (
    <AnimatePresence>
      <Overlay
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        $transparent={transparent}
        onClick={(e) => {
          // This is key: we only trigger onContinue if NOT in transparent mode
          // AND only if clicking directly on the overlay (not its children)
          if (!transparent && e.target === e.currentTarget) {
            onContinue();
          }
        }}
      >
        {/* Toggle button - always visible even in transparent mode */}
        <TransparencyToggle 
          onClick={(e) => {
            e.stopPropagation(); // Prevent click from bubbling to overlay
            toggleTransparency();
          }} 
          title={transparent ? "Show results" : "Show chart"}
          $transparent={transparent}
          $isDarkMode={isDarkMode}
          as={motion.button}
          animate={transparent ? "pulse" : ""}
          variants={buttonPulseVariants}
        >
          {transparent ? <FaEye /> : <FaEyeSlash />}
        </TransparencyToggle>
        
        {/* Floating continue button in transparent mode */}
        {transparent && (
          <ContinueFloatingButton
            onClick={(e) => {
              e.stopPropagation(); // Prevent click from bubbling
              onContinue();
            }}
            $isDarkMode={isDarkMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getContinueText()}
          </ContinueFloatingButton>
        )}
        
        {showTransparencyMessage && (
          <TransparencyMessage
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {transparent ? (
              <>
                <FaEye /> Viewing chart - toggle button to return to results
              </>
            ) : (
              <>
                <FaEyeSlash /> Viewing results
              </>
            )}
          </TransparencyMessage>
        )}
        
        <ResultsContainer
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          $transparent={transparent}
          $isDarkMode={isDarkMode}
          onClick={(e) => e.stopPropagation()}
        >
          {!transparent && <CloseButton $isDarkMode={isDarkMode} onClick={onContinue}><FaTimes /></CloseButton>}
          
          <ResultsHeader>
            <ResultsTitle $isDarkMode={isDarkMode}>Analysis Results</ResultsTitle>
          </ResultsHeader>
          
          <ScoreSummary $isDarkMode={isDarkMode}>
            <ScoreLabel $isDarkMode={isDarkMode}>
              {examType === 'fibonacci-retracement'
                ? `Part ${part} Analysis`
                : examType === 'fair-value-gaps'
                  ? `${part === 1 ? 'Bullish' : 'Bearish'} FVG Analysis`
                  : 'Swing Points Analysis'}
            </ScoreLabel>
            <ScoreValue good={results.score > 0}>
              {results.score}/{results.totalExpectedPoints}
            </ScoreValue>
          </ScoreSummary>
          
          <ProgressBar $isDarkMode={isDarkMode}>
            <ProgressFill 
              percentage={scorePercentage}
              initial="hidden"
              animate="visible"
              custom={scorePercentage}
              variants={progressVariants}
            />
          </ProgressBar>
          
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px', 
            fontSize: '0.9rem', 
            color: isDarkMode ? '#b0b0b0' : '#666' 
          }}>
            {scorePercentage.toFixed(1)}% Correct
          </div>
          
          {/* Correct Fibonacci Retracement Answer Section */}
          {examType === 'fibonacci-retracement' && results.expected && (
            <FeedbackSection type="info" $isDarkMode={isDarkMode}>
              <SectionTitle type="info">
                <FaRuler />
                Correct {part === 1 ? 'Uptrend' : 'Downtrend'} Fibonacci Points
              </SectionTitle>
              
              <FibonacciAnswerGrid>
                <FibonacciLevelItem 
                  $isDarkMode={isDarkMode} 
                  isKey={true}
                  variants={fibItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                >
                  <h5>Start Point (Level 1.0)</h5>
                  <div className="level-price">
                    <span>Price:</span>
                    <span>{results.expected.start.price.toFixed(2)}</span>
                  </div>
                  <div className="level-date">
                    Date: {formatDate(results.expected.start.time)}
                  </div>
                </FibonacciLevelItem>
                
                <FibonacciLevelItem 
                  $isDarkMode={isDarkMode} 
                  isKey={true}
                  variants={fibItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  <h5>End Point (Level 0.0)</h5>
                  <div className="level-price">
                    <span>Price:</span>
                    <span>{results.expected.end.price.toFixed(2)}</span>
                  </div>
                  <div className="level-date">
                    Date: {formatDate(results.expected.end.time)}
                  </div>
                </FibonacciLevelItem>
              </FibonacciAnswerGrid>
              
              <h5 style={{ 
                marginTop: '15px', 
                marginBottom: '10px',
                fontSize: '0.95rem',
                color: isDarkMode ? '#b0b0b0' : '#666'
              }}>
                Key Fibonacci Levels
              </h5>
              
              <FibonacciAnswerGrid>
                {results.expected.levels && 
                 results.expected.levels
                   .filter(level => [0, 0.382, 0.5, 0.618, 0.786, 1].includes(level.level))
                   .map((level, index) => (
                    <FibonacciLevelItem 
                      key={level.level} 
                      $isDarkMode={isDarkMode} 
                      isKey={isKeyFibLevel(level.level)}
                      variants={fibItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index + 2}
                    >
                      <h5>
                        Level {level.label}
                        {isKeyFibLevel(level.level) && <KeyLevelBadge $isDarkMode={isDarkMode}>KEY</KeyLevelBadge>}
                      </h5>
                      <div className="level-price">
                        <span>Price:</span>
                        <span>{level.price.toFixed(2)}</span>
                      </div>
                    </FibonacciLevelItem>
                  ))
                }
              </FibonacciAnswerGrid>
            </FeedbackSection>
          )}
          
          {/* Correct Fair Value Gaps Answer Section */}
          {examType === 'fair-value-gaps' && results.expected && results.expected.gaps && (
            <FeedbackSection type="info" $isDarkMode={isDarkMode}>
              <SectionTitle type="info">
                <FaRuler />
                {part === 1 ? 'Bullish' : 'Bearish'} Fair Value Gaps
              </SectionTitle>
              
              {/* Display all Fair Value Gaps */}
              <FVGAnswerGrid>
                {results.expected.gaps.map((gap, index) => {
                  // Check if this gap was identified correctly
                  const wasIdentified = results.feedback?.correct?.some(correct => 
                    // Compare prices (with tolerance) to determine if this was identified
                    Math.abs(correct.topPrice - gap.topPrice) < 0.01 && 
                    Math.abs(correct.bottomPrice - gap.bottomPrice) < 0.01
                  );
                  
                  // Determine if this is a missed gap
                  const wasMissed = !wasIdentified;
                  
                  return (
                    <FVGItem 
                      key={`gap-${index}`} 
                      $isDarkMode={isDarkMode}
                      type={gap.type}
                      variants={fvgItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                    >
                      <h5>
                        <span>FVG #{index + 1}</span>
                        <StatusBadge missed={wasMissed}>
                          {wasMissed ? 'MISSED' : 'IDENTIFIED'}
                        </StatusBadge>
                      </h5>
                      
                      <div className="gap-details">
                        <span>Type:</span>
                        <span>{gap.type === 'bullish' ? 'Bullish' : 'Bearish'}</span>
                      </div>
                      
                      <div className="gap-details">
                        <span>Range:</span>
                        <span>{gap.bottomPrice.toFixed(2)} - {gap.topPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="gap-details">
                        <span>Size:</span>
                        <span>{(gap.topPrice - gap.bottomPrice).toFixed(2)}</span>
                      </div>
                      
                      <div className="gap-details">
                        <span>Date:</span>
                        <span>{formatDate(gap.endTime)}</span>
                      </div>
                      
                      <FeedbackAdvice $isDarkMode={isDarkMode} style={{marginTop: '8px'}}>
                        {wasMissed 
                          ? `You missed this ${gap.type} Fair Value Gap.`
                          : `You correctly identified this ${gap.type} Fair Value Gap.`}
                      </FeedbackAdvice>
                    </FVGItem>
                  );
                })}
                
                {/* Show message if no gaps exist */}
                {(!results.expected.gaps || results.expected.gaps.length === 0) && (
                  <FVGItem $isDarkMode={isDarkMode}>
                    <h5>No Fair Value Gaps</h5>
                    <FeedbackAdvice $isDarkMode={isDarkMode}>
                      There were no {part === 1 ? 'bullish' : 'bearish'} Fair Value Gaps in this chart.
                    </FeedbackAdvice>
                  </FVGItem>
                )}
              </FVGAnswerGrid>
            </FeedbackSection>
          )}
          
          {/* Helper function to filter feedback based on current part */}
          {(() => {
            // For Fibonacci retracement, filter feedback based on direction matching the current part
            const filterFibonacciFeedback = (feedbackArray) => {
              if (!feedbackArray || !Array.isArray(feedbackArray)) return [];
              if (examType !== 'fibonacci-retracement') return feedbackArray;
              
              const expectedDirection = part === 1 ? 'uptrend' : 'downtrend';
              return feedbackArray.filter(feedback => {
                // Keep feedback if it matches the expected direction
                // or if it has no direction but is specifically for this part
                return feedback.direction === expectedDirection || 
                       (feedback.type === 'missed_retracement' && 
                        (!feedback.direction || feedback.direction === expectedDirection));
              });
            };

            // Apply filters to correct and incorrect arrays
            const filteredCorrect = results.feedback?.correct ? 
              filterFibonacciFeedback(results.feedback.correct) : [];
            
            const filteredIncorrect = results.feedback?.incorrect ? 
              filterFibonacciFeedback(results.feedback.incorrect) : [];
              
            const incorrectNonMissed = filteredIncorrect.filter(f => 
              f.type !== 'missed_point' && 
              f.type !== 'missed_gap' && 
              f.type !== 'missed_retracement'
            );
            
            const missedPoints = filteredIncorrect.filter(f => 
              f.type === 'missed_point' || 
              f.type === 'missed_gap' || 
              f.type === 'missed_retracement'
            );

            // Only show these sections for exams where we're not already showing detailed results
            // (e.g., don't repeat missed gaps in this section if we're already showing them in the dedicated FVG section)
            const shouldShowDetailedSections = examType !== 'fair-value-gaps';

            return (
              <>
                {/* Correct Feedback */}
                {filteredCorrect.length > 0 && (
                  <FeedbackSection type="correct" $isDarkMode={isDarkMode}>
                    <SectionTitle type="correct">
                      <FaCheck />
                      {examType === 'fibonacci-retracement'
                        ? 'Your Retracement'
                        : examType === 'fair-value-gaps'
                          ? 'Correctly Identified Gaps'
                          : 'Correct Points'}
                    </SectionTitle>
                    
                    {filteredCorrect.map((feedback, index) => (
                      <FeedbackCard key={`correct-${index}`} $isDarkMode={isDarkMode}>
                        <FeedbackType type={feedback.type || feedback.direction}>
                          {getFeedbackTypeTitle(feedback)}
                        </FeedbackType>
                        
                        {feedback.price && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            Price: {feedback.price.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        {(feedback.topPrice || feedback.bottomPrice) && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            Range: {feedback.bottomPrice?.toFixed(4)} - {feedback.topPrice?.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        {(feedback.startPrice || feedback.endPrice) && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            From {feedback.startPrice?.toFixed(4)} to {feedback.endPrice?.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        <FeedbackAdvice $isDarkMode={isDarkMode}>
                          {feedback.advice || 'Good job!'}
                        </FeedbackAdvice>
                      </FeedbackCard>
                    ))}
                  </FeedbackSection>
                )}
                
                {/* Incorrect Feedback */}
                {incorrectNonMissed.length > 0 && (
                  <FeedbackSection type="incorrect" $isDarkMode={isDarkMode}>
                    <SectionTitle type="incorrect">
                      <FaX />
                      {examType === 'fibonacci-retracement'
                        ? 'Incorrect Aspects'
                        : examType === 'fair-value-gaps'
                          ? 'Incorrect Markings'
                          : 'Incorrect Points'}
                    </SectionTitle>
                    
                    {incorrectNonMissed.map((feedback, index) => (
                      <FeedbackCard key={`incorrect-${index}`} $isDarkMode={isDarkMode}>
                        <FeedbackType type={feedback.type || feedback.direction}>
                          {getFeedbackTypeTitle(feedback)}
                        </FeedbackType>
                        
                        {feedback.price && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            Price: {feedback.price.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        {(feedback.topPrice || feedback.bottomPrice) && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            Range: {feedback.bottomPrice?.toFixed(4)} - {feedback.topPrice?.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        {(feedback.startPrice || feedback.endPrice) && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            From {feedback.startPrice?.toFixed(4)} to {feedback.endPrice?.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        <FeedbackAdvice $isDarkMode={isDarkMode}>
                          {feedback.advice || 'This marking was incorrect.'}
                        </FeedbackAdvice>
                      </FeedbackCard>
                    ))}
                  </FeedbackSection>
                )}
                
                {/* Missed Points - only show for non-FVG exams as FVG exam already has detailed view */}
                {shouldShowDetailedSections && missedPoints.length > 0 && (
                  <FeedbackSection type="missed" $isDarkMode={isDarkMode}>
                    <SectionTitle type="missed">
                      <FaExclamationTriangle />
                      {examType === 'fibonacci-retracement'
                        ? 'Missed Retracement'
                        : examType === 'fair-value-gaps'
                          ? 'Missed Gaps'
                          : 'Missed Points'}
                    </SectionTitle>
                    
                    {missedPoints.map((feedback, index) => (
                      <FeedbackCard key={`missed-${index}`} $isDarkMode={isDarkMode}>
                        <FeedbackType type="missed">
                          MISSED
                        </FeedbackType>
                        
                        {feedback.price && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            Price: {feedback.price.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        {(feedback.topPrice || feedback.bottomPrice) && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            Range: {feedback.bottomPrice?.toFixed(4)} - {feedback.topPrice?.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        {(feedback.startPrice || feedback.endPrice) && (
                          <FeedbackPrice $isDarkMode={isDarkMode}>
                            From {feedback.startPrice?.toFixed(4)} to {feedback.endPrice?.toFixed(4)}
                          </FeedbackPrice>
                        )}
                        
                        <FeedbackAdvice $isDarkMode={isDarkMode}>
                          {feedback.advice || 'You missed this point.'}
                        </FeedbackAdvice>
                      </FeedbackCard>
                    ))}
                  </FeedbackSection>
                )}
              </>
            );
          })()}
          
          {!transparent && (
            <ContinueButton 
              onClick={onContinue} 
              $isDarkMode={isDarkMode}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {getContinueText()}
            </ContinueButton>
          )}
        </ResultsContainer>
      </Overlay>
    </AnimatePresence>
  );
};

export default ResultsPanel;
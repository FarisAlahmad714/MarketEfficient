import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTimes as FaX, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';

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
    : (props.theme.darkMode ? '#262626' : '#f5f5f5')};
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
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.$transparent
    ? (props.theme.darkMode ? '#3f51b5' : '#2196F3')
    : (props.theme.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')};
  border: ${props => props.$transparent ? '2px solid white' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$transparent ? 'white' : (props.theme.darkMode ? '#b0b0b0' : '#666')};
  transition: all 0.2s ease;
  z-index: 102;
  box-shadow: ${props => props.$transparent ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none'};
  
  /* Critical: Toggle button always needs pointer events to stay interactive */
  pointer-events: auto !important;
  
  &:hover {
    background-color: ${props => props.$transparent
      ? (props.theme.darkMode ? '#303f9f' : '#1976D2')
      : (props.theme.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')};
    transform: scale(1.1);
  }
`;

const TransparencyMessage = styled(motion.div)`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => props.theme.darkMode ? '#333' : '#333'};
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
  background-color: ${props => props.theme.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.theme.darkMode ? '#b0b0b0' : '#666'};
  transition: all 0.2s ease;
  z-index: 2;
  
  &:hover {
    background-color: ${props => props.theme.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
    color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
  }
`;

// Continue floating button that appears when in transparent mode
const ContinueFloatingButton = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 25px;
  background-color: ${props => props.theme.darkMode ? '#3f51b5' : '#2196F3'};
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
    background-color: ${props => props.theme.darkMode ? '#303f9f' : '#1976D2'};
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
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const ScoreSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background-color: ${props => props.theme.darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 10px;
`;

const ScoreLabel = styled.span`
  font-size: 1.1rem;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const ScoreValue = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  color: ${props => props.good ? '#4CAF50' : '#F44336'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${props => props.theme.darkMode ? '#333' : '#ddd'};
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
    ? (props.theme.darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)') 
    : props.type === 'incorrect' 
      ? (props.theme.darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)')
      : (props.theme.darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)')
  };
  border: 1px solid ${props => props.type === 'correct' 
    ? '#4CAF50' 
    : props.type === 'incorrect' 
      ? '#F44336'
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
      : '#FF9800'
  };
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeedbackCard = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  background-color: ${props => props.theme.darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
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
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
  font-family: 'Roboto Mono', monospace;
`;

const FeedbackAdvice = styled.p`
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
  color: ${props => props.theme.darkMode ? '#b0b0b0' : '#666'};
  line-height: 1.5;
`;

const ContinueButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background-color: ${props => props.theme.darkMode ? '#3f51b5' : '#2196F3'};
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
    background-color: ${props => props.theme.darkMode ? '#303f9f' : '#1976D2'};
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
  
  const getFeedbackTypeTitle = (feedback) => {
    if (!feedback || !feedback.type) return 'Unknown';
    
    // Handle different feedback types
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
          onClick={(e) => e.stopPropagation()}
        >
          {!transparent && <CloseButton onClick={onContinue}><FaTimes /></CloseButton>}
          
          <ResultsHeader>
            <ResultsTitle>Analysis Results</ResultsTitle>
          </ResultsHeader>
          
          <ScoreSummary>
            <ScoreLabel>
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
          
          <ProgressBar>
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
          
          {/* Correct Feedback */}
          {results.feedback && results.feedback.correct && results.feedback.correct.length > 0 && (
            <FeedbackSection type="correct">
              <SectionTitle type="correct">
                <FaCheck />
                {examType === 'fibonacci-retracement'
                  ? 'Your Retracement'
                  : examType === 'fair-value-gaps'
                    ? 'Correctly Identified Gaps'
                    : 'Correct Points'}
              </SectionTitle>
              
              {results.feedback.correct.map((feedback, index) => (
                <FeedbackCard key={`correct-${index}`} isDarkMode={isDarkMode}>
                  <FeedbackType type={feedback.type || feedback.direction}>
                    {getFeedbackTypeTitle(feedback)}
                  </FeedbackType>
                  
                  {feedback.price && (
                    <FeedbackPrice isDarkMode={isDarkMode}>
                      Price: {feedback.price.toFixed(4)}
                    </FeedbackPrice>
                  )}
                  
                  {(feedback.topPrice || feedback.bottomPrice) && (
                    <FeedbackPrice isDarkMode={isDarkMode}>
                      Range: {feedback.bottomPrice?.toFixed(4)} - {feedback.topPrice?.toFixed(4)}
                    </FeedbackPrice>
                  )}
                  
                  {(feedback.startPrice || feedback.endPrice) && (
                    <FeedbackPrice isDarkMode={isDarkMode}>
                      From {feedback.startPrice?.toFixed(4)} to {feedback.endPrice?.toFixed(4)}
                    </FeedbackPrice>
                  )}
                  
                  <FeedbackAdvice isDarkMode={isDarkMode}>
                    {feedback.advice || 'Good job!'}
                  </FeedbackAdvice>
                </FeedbackCard>
              ))}
            </FeedbackSection>
          )}
          
          {/* Incorrect Feedback */}
          {results.feedback && results.feedback.incorrect && 
           results.feedback.incorrect.filter(f => f.type !== 'missed_point' && 
                                                f.type !== 'missed_gap' && 
                                                f.type !== 'missed_retracement').length > 0 && (
            <FeedbackSection type="incorrect">
              <SectionTitle type="incorrect">
                <FaX />
                {examType === 'fibonacci-retracement'
                  ? 'Incorrect Aspects'
                  : examType === 'fair-value-gaps'
                    ? 'Incorrect Markings'
                    : 'Incorrect Points'}
              </SectionTitle>
              
              {results.feedback.incorrect
                .filter(f => f.type !== 'missed_point' && 
                            f.type !== 'missed_gap' && 
                            f.type !== 'missed_retracement')
                .map((feedback, index) => (
                  <FeedbackCard key={`incorrect-${index}`} isDarkMode={isDarkMode}>
                    <FeedbackType type={feedback.type || feedback.direction}>
                      {getFeedbackTypeTitle(feedback)}
                    </FeedbackType>
                    
                    {feedback.price && (
                      <FeedbackPrice isDarkMode={isDarkMode}>
                        Price: {feedback.price.toFixed(4)}
                      </FeedbackPrice>
                    )}
                    
                    {(feedback.topPrice || feedback.bottomPrice) && (
                      <FeedbackPrice isDarkMode={isDarkMode}>
                        Range: {feedback.bottomPrice?.toFixed(4)} - {feedback.topPrice?.toFixed(4)}
                      </FeedbackPrice>
                    )}
                    
                    {(feedback.startPrice || feedback.endPrice) && (
                      <FeedbackPrice isDarkMode={isDarkMode}>
                        From {feedback.startPrice?.toFixed(4)} to {feedback.endPrice?.toFixed(4)}
                      </FeedbackPrice>
                    )}
                    
                    <FeedbackAdvice isDarkMode={isDarkMode}>
                      {feedback.advice || 'This marking was incorrect.'}
                    </FeedbackAdvice>
                  </FeedbackCard>
              ))}
            </FeedbackSection>
          )}
          
          {/* Missed Points */}
          {results.feedback && results.feedback.incorrect && 
           results.feedback.incorrect.filter(f => f.type === 'missed_point' || 
                                                f.type === 'missed_gap' || 
                                                f.type === 'missed_retracement').length > 0 && (
            <FeedbackSection type="missed">
              <SectionTitle type="missed">
                <FaExclamationTriangle />
                {examType === 'fibonacci-retracement'
                  ? 'Missed Retracement'
                  : examType === 'fair-value-gaps'
                    ? 'Missed Gaps'
                    : 'Missed Points'}
              </SectionTitle>
              
              {results.feedback.incorrect
                .filter(f => f.type === 'missed_point' || 
                            f.type === 'missed_gap' || 
                            f.type === 'missed_retracement')
                .map((feedback, index) => (
                  <FeedbackCard key={`missed-${index}`} isDarkMode={isDarkMode}>
                    <FeedbackType type="missed">
                      MISSED
                    </FeedbackType>
                    
                    {feedback.price && (
                      <FeedbackPrice isDarkMode={isDarkMode}>
                        Price: {feedback.price.toFixed(4)}
                      </FeedbackPrice>
                    )}
                    
                    {(feedback.topPrice || feedback.bottomPrice) && (
                      <FeedbackPrice isDarkMode={isDarkMode}>
                        Range: {feedback.bottomPrice?.toFixed(4)} - {feedback.topPrice?.toFixed(4)}
                      </FeedbackPrice>
                    )}
                    
                    {(feedback.startPrice || feedback.endPrice) && (
                      <FeedbackPrice isDarkMode={isDarkMode}>
                        From {feedback.startPrice?.toFixed(4)} to {feedback.endPrice?.toFixed(4)}
                      </FeedbackPrice>
                    )}
                    
                    <FeedbackAdvice isDarkMode={isDarkMode}>
                      {feedback.advice || 'You missed this point.'}
                    </FeedbackAdvice>
                  </FeedbackCard>
              ))}
            </FeedbackSection>
          )}
          
          {!transparent && (
            <ContinueButton 
              onClick={onContinue} 
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
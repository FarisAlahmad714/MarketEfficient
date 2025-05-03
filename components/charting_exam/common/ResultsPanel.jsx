import React from 'react';
import styled from 'styled-components';

const ResultsContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 350px;
  background-color: ${props => props.theme.darkMode ? '#262626' : '#f5f5f5'};
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
  padding: 20px;
  overflow-y: auto;
  z-index: 100;
  transition: transform 0.3s ease;
  transform: ${props => props.show ? 'translateX(0)' : 'translateX(100%)'};
`;

const ResultsHeader = styled.div`
  margin-bottom: 20px;
`;

const ResultsTitle = styled.h3`
  font-size: 1.4rem;
  margin-bottom: 10px;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const ScoreSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: ${props => props.theme.darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 8px;
`;

const ScoreLabel = styled.span`
  font-size: 1.1rem;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const ScoreValue = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.good ? '#4CAF50' : '#F44336'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.darkMode ? '#333' : '#ddd'};
  border-radius: 3px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #4CAF50;
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
`;

const FeedbackSection = styled.div`
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 8px;
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
  font-size: 1rem;
  margin: 0 0 10px 0;
  color: ${props => props.type === 'correct' 
    ? '#4CAF50' 
    : props.type === 'incorrect' 
      ? '#F44336'
      : '#FF9800'
  };
`;

const FeedbackCard = styled.div`
  padding: 10px;
  margin-bottom: 10px;
  background-color: ${props => props.theme.darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FeedbackType = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
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
  margin-bottom: 5px;
`;

const FeedbackPrice = styled.div`
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const FeedbackAdvice = styled.p`
  font-size: 0.85rem;
  margin: 0;
  font-style: italic;
  color: ${props => props.theme.darkMode ? '#b0b0b0' : '#666'};
`;

const ContinueButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: ${props => props.theme.darkMode ? '#3f51b5' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.darkMode ? '#303f9f' : '#1976D2'};
  }
`;

const ResultsPanel = ({ results, onContinue, examType, part, chartCount, isDarkMode }) => {
  if (!results) return null;
  
  const scorePercentage = results.totalExpectedPoints > 0 
    ? (results.score / results.totalExpectedPoints) * 100 
    : 0;
  
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
  
  return (
    <ResultsContainer show={true}>
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
        <ProgressFill percentage={scorePercentage} />
      </ProgressBar>
      
      {/* Correct Feedback */}
      {results.feedback && results.feedback.correct && results.feedback.correct.length > 0 && (
        <FeedbackSection type="correct">
          <SectionTitle type="correct">
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
      
      <ContinueButton onClick={onContinue} isDarkMode={isDarkMode}>
        {chartCount >= 5 && 
         ((examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') ? 
          part === 2 : true) 
          ? 'Finish Exam' 
          : 'Continue'}
      </ContinueButton>
    </ResultsContainer>
  );
};

export default ResultsPanel;
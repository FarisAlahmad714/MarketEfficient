import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { ThemeContext } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

// Styled components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
  max-width: 700px;
  margin: 0 auto;
`;

const ResultsCard = styled(motion.div)`
  background-color: ${props => props.isDarkMode ? '#262626' : 'white'};
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: ${props => props.isDarkMode 
    ? '0 8px 30px rgba(0, 0, 0, 0.3)' 
    : '0 8px 30px rgba(0, 0, 0, 0.1)'};
`;

const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#444' : '#eee'};
`;

const ExamTitle = styled.h2`
  font-size: 1.8rem;
  margin: 0;
  color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
`;

const ScoreDisplay = styled.div`
  background: ${props => getScoreBackground(props.score, props.total, props.isDarkMode)};
  border-radius: 10px;
  padding: 10px 20px;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
`;

const BreakdownContainer = styled.div`
  margin-top: 25px;
`;

const BreakdownTitle = styled.h3`
  font-size: 1.4rem;
  margin-bottom: 15px;
  color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
`;

const ChartBreakdown = styled.div`
  background-color: ${props => props.isDarkMode ? '#1e1e1e' : '#f8f9fa'};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
`;

const ChartTitle = styled.h4`
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 15px;
  color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
`;

const PartScore = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background-color: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  border-radius: 6px;
  margin-bottom: 10px;
`;

const PartTitle = styled.span`
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
`;

const PartResult = styled.span`
  color: ${props => getScoreColor(props.score, props.total, props.isDarkMode)};
  font-weight: 600;
`;

const ProgressBar = styled.div`
  height: 8px;
  width: 100%;
  background-color: ${props => props.isDarkMode ? '#333' : '#e0e0e0'};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 20px;
  margin-bottom: 10px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => (props.score / props.total) * 100}%;
  background-color: ${props => getProgressColor(props.score, props.total)};
  border-radius: 4px;
  transition: width 1s ease-in-out;
`;

const Feedback = styled.div`
  margin-top: 25px;
  padding: 20px;
  background-color: ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)'};
  border-radius: 8px;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
`;

const FeedbackTitle = styled.h4`
  margin-top: 0;
  color: ${props => props.isDarkMode ? '#e0e0e0' : '#333'};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 40px;
`;

const Button = styled.button`
  padding: 12px 25px;
  background-color: ${props => props.primary 
    ? (props.isDarkMode ? '#3f51b5' : '#2196F3') 
    : (props.isDarkMode ? '#333' : '#f5f5f5')};
  color: ${props => props.primary 
    ? 'white' 
    : (props.isDarkMode ? '#e0e0e0' : '#333')};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.primary 
      ? (props.isDarkMode ? '#303f9f' : '#1976D2') 
      : (props.isDarkMode ? '#444' : '#e0e0e0')};
  }
`;

// Helper functions
function getScoreBackground(score, total, isDarkMode) {
  const percentage = (score / total) * 100;
  if (percentage >= 80) return 'linear-gradient(135deg, #4CAF50, #2E7D32)';
  if (percentage >= 60) return 'linear-gradient(135deg, #8BC34A, #558B2F)';
  if (percentage >= 40) return 'linear-gradient(135deg, #FFC107, #FF8F00)';
  if (percentage >= 20) return 'linear-gradient(135deg, #FF9800, #E65100)';
  return 'linear-gradient(135deg, #F44336, #B71C1C)';
}

function getScoreColor(score, total, isDarkMode) {
  const percentage = (score / total) * 100;
  if (percentage >= 80) return '#4CAF50';
  if (percentage >= 60) return '#8BC34A';
  if (percentage >= 40) return '#FFC107';
  if (percentage >= 20) return '#FF9800';
  return '#F44336';
}

function getProgressColor(score, total) {
  const percentage = (score / total) * 100;
  if (percentage >= 80) return '#4CAF50';
  if (percentage >= 60) return '#8BC34A';
  if (percentage >= 40) return '#FFC107';
  if (percentage >= 20) return '#FF9800';
  return '#F44336';
}

function getExamTypeName(examType) {
  switch (examType) {
    case 'swing-analysis': return 'Swing Analysis';
    case 'fibonacci-retracement': return 'Fibonacci Retracement';
    case 'fair-value-gaps': return 'Fair Value Gaps';
    default: return 'Chart Exam';
  }
}

function getFeedbackMessage(percentage) {
  if (percentage >= 90) return "Outstanding! You've demonstrated excellent technical analysis skills.";
  if (percentage >= 80) return "Great job! You have a solid understanding of chart patterns.";
  if (percentage >= 70) return "Good work! You're on your way to becoming proficient in technical analysis.";
  if (percentage >= 60) return "You're making progress! With more practice, you'll improve your chart reading skills.";
  if (percentage >= 50) return "You've got the basics down. Keep practicing to improve your accuracy.";
  if (percentage >= 40) return "You're starting to grasp these concepts. More practice will help solidify your skills.";
  if (percentage >= 30) return "Keep working on it. Technical analysis takes time to master.";
  if (percentage < 30) return "Don't be discouraged. Technical analysis is challenging and requires practice.";
}

function getImprovementTips(examType, percentage) {
  const commonTips = [
    "Review the educational materials for this exam type",
    "Practice identifying patterns on different charts",
    "Try analyzing charts at different timeframes"
  ];
  
  const specificTips = {
    'swing-analysis': [
      "Look for price action that forms clear higher highs and lower lows",
      "Pay attention to the strength of each swing (how far price moves)",
      "Practice identifying swing points across different market conditions"
    ],
    'fibonacci-retracement': [
      "Always identify the major trend direction first",
      "Make sure to accurately select the swing high and swing low points",
      "Look for price reactions at key Fibonacci levels (0.382, 0.618, etc.)"
    ],
    'fair-value-gaps': [
      "Look for quick moves that leave unfilled price areas",
      "Focus on gaps that form from strong momentum candles",
      "Pay attention to whether price has returned to fill the gap"
    ]
  };
  
  // Determine how many tips to give based on score
  const numTips = percentage < 60 ? 3 : (percentage < 80 ? 2 : 1);
  
  // Combine common and specific tips
  const selectedCommonTips = commonTips.slice(0, Math.min(1, numTips));
  const selectedSpecificTips = specificTips[examType] 
    ? specificTips[examType].slice(0, numTips - selectedCommonTips.length) 
    : [];
  
  return [...selectedCommonTips, ...selectedSpecificTips];
}

const ChartExamResults = () => {
  const router = useRouter();
  const { darkMode } = useContext(ThemeContext);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load results from sessionStorage
    try {
      const storedResults = sessionStorage.getItem('chartExamResults');
      if (storedResults) {
        setResults(JSON.parse(storedResults));
      } else if (router.query.scores) {
        // Fallback to URL parameters
        try {
          const scores = JSON.parse(decodeURIComponent(router.query.scores));
          const examType = router.query.examType;
          setResults({ scores, examType });
        } catch (e) {
          console.error('Error parsing scores from URL', e);
        }
      } else {
        // If no results found, redirect to exam selection
        router.push('/chart-exam');
      }
    } catch (e) {
      console.error('Error loading exam results', e);
    } finally {
      setLoading(false);
    }
  }, [router.query]);
  
  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div className="spinner" style={{ 
            width: '50px', 
            height: '50px', 
            border: `4px solid ${darkMode ? '#333' : '#f3f3f3'}`,
            borderTop: `4px solid ${darkMode ? '#3f51b5' : '#2196F3'}`,
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading your results...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Container>
    );
  }
  
  if (!results) {
    return (
      <Container>
        <Header>
          <Title isDarkMode={darkMode}>No Results Found</Title>
          <Subtitle isDarkMode={darkMode}>
            We couldn't find any exam results to display. Please try taking an exam first.
          </Subtitle>
          <div style={{ marginTop: '30px' }}>
            <Link href="/chart-exam" passHref>
              <Button primary isDarkMode={darkMode} as="a">
                Go to Chart Exams
              </Button>
            </Link>
          </div>
        </Header>
      </Container>
    );
  }
  
  // Calculate total score
  const { scores, examType } = results;
  
  let totalScore = 0;
  let totalPossible = 0;
  
  if (examType === 'swing-analysis') {
    totalScore = scores.reduce((sum, score) => sum + (typeof score === 'number' ? score : 0), 0);
    totalPossible = scores.length * 10;
  } else if (examType === 'fibonacci-retracement') {
    totalScore = scores.reduce((sum, score) => sum + (score.part1 || 0) + (score.part2 || 0), 0);
    totalPossible = scores.length * 4;
  } else if (examType === 'fair-value-gaps') {
    totalScore = scores.reduce((sum, score) => sum + (score.part1 || 0) + (score.part2 || 0), 0);
    totalPossible = scores.length * 10;
  }
  
  const scorePercentage = (totalScore / totalPossible) * 100;
  const feedbackMessage = getFeedbackMessage(scorePercentage);
  const improvementTips = getImprovementTips(examType, scorePercentage);
  
  return (
    <Container>
      <Header>
        <Title isDarkMode={darkMode}>Exam Results</Title>
        <Subtitle isDarkMode={darkMode}>
          Here's how you performed on the {getExamTypeName(examType)} exam
        </Subtitle>
      </Header>
      
      <ResultsCard 
        isDarkMode={darkMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ScoreHeader isDarkMode={darkMode}>
          <ExamTitle isDarkMode={darkMode}>{getExamTypeName(examType)}</ExamTitle>
          <ScoreDisplay 
            score={totalScore} 
            total={totalPossible}
            isDarkMode={darkMode}
          >
            {totalScore} / {totalPossible} Points
          </ScoreDisplay>
        </ScoreHeader>
        
        <ProgressBar isDarkMode={darkMode}>
          <ProgressFill score={totalScore} total={totalPossible} />
        </ProgressBar>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '5px', 
          fontSize: '0.9rem',
          color: darkMode ? '#b0b0b0' : '#666'
        }}>
          {scorePercentage.toFixed(1)}% Accuracy
        </div>
        
        <BreakdownContainer>
          <BreakdownTitle isDarkMode={darkMode}>Chart Breakdown</BreakdownTitle>
          
          {scores.map((score, index) => (
            <ChartBreakdown key={index} isDarkMode={darkMode}>
              <ChartTitle isDarkMode={darkMode}>Chart {index + 1}</ChartTitle>
              
              {examType === 'swing-analysis' ? (
                <PartScore isDarkMode={darkMode}>
                  <PartTitle isDarkMode={darkMode}>Swing Points</PartTitle>
                  <PartResult 
                    score={score} 
                    total={10}
                    isDarkMode={darkMode}
                  >
                    {score} / 10
                  </PartResult>
                </PartScore>
              ) : (
                <>
                  <PartScore isDarkMode={darkMode}>
                    <PartTitle isDarkMode={darkMode}>Part 1</PartTitle>
                    <PartResult 
                      score={score.part1 || 0} 
                      total={examType === 'fibonacci-retracement' ? 2 : 5}
                      isDarkMode={darkMode}
                    >
                      {score.part1 || 0} / {examType === 'fibonacci-retracement' ? 2 : 5}
                    </PartResult>
                  </PartScore>
                  
                  <PartScore isDarkMode={darkMode}>
                    <PartTitle isDarkMode={darkMode}>Part 2</PartTitle>
                    <PartResult 
                      score={score.part2 || 0} 
                      total={examType === 'fibonacci-retracement' ? 2 : 5}
                      isDarkMode={darkMode}
                    >
                      {score.part2 || 0} / {examType === 'fibonacci-retracement' ? 2 : 5}
                    </PartResult>
                  </PartScore>
                </>
              )}
            </ChartBreakdown>
          ))}
        </BreakdownContainer>
        
        <Feedback isDarkMode={darkMode}>
          <FeedbackTitle isDarkMode={darkMode}>Feedback</FeedbackTitle>
          <p>{feedbackMessage}</p>
          
          {scorePercentage < 90 && (
            <>
              <FeedbackTitle isDarkMode={darkMode}>Areas for Improvement</FeedbackTitle>
              <ul>
                {improvementTips.map((tip, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{tip}</li>
                ))}
              </ul>
            </>
          )}
        </Feedback>
      </ResultsCard>
      
      <ButtonContainer>
        <Link href="/chart-exam" passHref>
          <Button isDarkMode={darkMode} as="a">
            Back to Exam Selection
          </Button>
        </Link>
        
        <Link href={`/chart-exam/${examType}`} passHref>
          <Button primary isDarkMode={darkMode} as="a">
            Try Again
          </Button>
        </Link>
      </ButtonContainer>
    </Container>
  );
};

export default ChartExamResults;
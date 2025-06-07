import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import Confetti from 'react-confetti';
import { ThemeContext } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import CryptoLoader from '../../components/CryptoLoader';
import TrackedPage from '../../components/TrackedPage';
import storage from '../../lib/storage';

// Styled components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  position: relative;
  z-index: 1;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh; // Adjust as needed
  text-align: center;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh; // Adjust as needed
  text-align: center;
  color: red; // Basic error styling
  font-size: 1.2rem;
  padding: 20px;
  border: 1px solid red;
  border-radius: 8px;
  background-color: #ffeeee;
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
  const [scoresArray, setScoresArray] = useState(null);
  const [currentExamType, setCurrentExamType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle window resize for confetti
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      setError('');
      try {
        let queryExamType = router.query.examType;
        let queryScoresString = router.query.scores;

        let finalScoresArray = null;

        if (queryScoresString) {
          try {
            finalScoresArray = JSON.parse(queryScoresString);
            if (queryExamType) {
              setCurrentExamType(queryExamType);
            }
            if (process.env.NODE_ENV === 'development') {
              console.log("[ResultsPage] Loaded results from query params.");
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.error("[ResultsPage] Failed to parse scores from query params:", e);
            }
            queryScoresString = null; 
          }
        }

        if (!finalScoresArray) {
          const storedResultsString = await storage.getItem('chartExamResults');
          if (storedResultsString) {
            try {
              finalScoresArray = JSON.parse(storedResultsString);
              if (process.env.NODE_ENV === 'development') {
                console.log("[ResultsPage] Loaded results from storage.");
              }
              // Attempt to get examType if not already set by query
              if (!queryExamType) {
                const storedExamType = await storage.getItem('currentExamType'); // This was a potential issue, ensure 'currentExamType' is being set if relied upon
                if (storedExamType) {
                  setCurrentExamType(storedExamType);
                } else {
                  // Heuristic: try to infer from scores structure if possible, or default
                  // This part is tricky without knowing the exact structure of 'currentExamType' or if it's always passed in query
                  if (process.env.NODE_ENV === 'development') {
                    console.warn("[ResultsPage] Exam type not found in storage or query. Attempting to infer or default.");
                  }
                  // For now, if queryExamType was missing and storedExamType is missing, it remains an issue.
                }
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.error("[ResultsPage] Error parsing stored exam results:", e);
              }
              setError('Failed to parse exam results from storage. The data might be corrupted.');
              finalScoresArray = null; 
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn("[ResultsPage] No exam results found in query params or storage.");
            }
            if(queryExamType) setCurrentExamType(queryExamType); 
          }
        }
        
        setScoresArray(finalScoresArray);
        // Ensure currentExamType is set if it came from query and scores were also from query
        if (queryExamType && finalScoresArray && !currentExamType) {
            setCurrentExamType(queryExamType);
        }

        setLoading(false);
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 10000); // Confetti for 10 seconds
        return () => clearTimeout(timer);

      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error("[ResultsPage] Error loading exam results:", e);
        }
        setError('An unexpected error occurred while loading exam results.');
      }
    };

    if (router.isReady) {
        loadResults();
    }

  }, [router.isReady, router.query]);

  if (loading) {
    return <LoadingContainer><CryptoLoader /></LoadingContainer>;
  }

  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }

  // Updated Guard condition
  if (!scoresArray || !Array.isArray(scoresArray) || scoresArray.length === 0) {
    return (
      <Container>
        <Header>
          <Title isDarkMode={darkMode}>No Results Found</Title>
          <Subtitle isDarkMode={darkMode}>
            We couldn't find any exam results to display. Please try taking an exam first.
          </Subtitle>
        </Header>
        <ButtonContainer>
          <Link href="/chart-exam" passHref>
            <Button primary isDarkMode={darkMode} as="a">Take an Exam</Button>
          </Link>
        </ButtonContainer>
      </Container>
    );
  }

  // Directly use scoresArray and currentExamType
  // No destructuring from a 'results' object needed here for these two

  let totalScore = 0;
  let totalPossible = 0;
  
  if (currentExamType === 'swing-analysis') {
    totalScore = scoresArray.reduce((sum, scoreItem) => sum + (typeof scoreItem === 'number' ? scoreItem : 0), 0);
    totalPossible = scoresArray.length * 10; // Assuming 10 points per swing analysis chart
  } else if (currentExamType === 'fibonacci-retracement') {
    totalScore = scoresArray.reduce((sum, scoreItem) => sum + (scoreItem.part1 || 0) + (scoreItem.part2 || 0), 0);
    totalPossible = scoresArray.length * 4; // 2 for part1, 2 for part2
  } else if (currentExamType === 'fair-value-gaps') {
    totalScore = scoresArray.reduce((sum, scoreItem) => sum + (scoreItem.part1 || 0) + (scoreItem.part2 || 0), 0);
    totalPossible = scoresArray.length * 10; // Assuming 5 for part1, 5 for part2 (example)
  }

  const scorePercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
  const feedbackMessage = getFeedbackMessage(scorePercentage);
  const improvementTips = getImprovementTips(currentExamType, scorePercentage);
  
  return (
    <TrackedPage pageName="ChartExamResults">
      <Container isDarkMode={darkMode}>
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
          />
        )}
        <Header>
          <Title isDarkMode={darkMode}>Exam Results</Title>
          <Subtitle isDarkMode={darkMode}>
           Here's how you performed on the {getExamTypeName(currentExamType)} exam
          </Subtitle>
        </Header>

        <ResultsCard 
          isDarkMode={darkMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ScoreHeader isDarkMode={darkMode}>
           <ExamTitle isDarkMode={darkMode}>{getExamTypeName(currentExamType)}</ExamTitle>
            <ScoreDisplay 
              score={totalScore} 
              total={totalPossible} 
              isDarkMode={darkMode}
            >
              {totalScore} / {totalPossible} ({scorePercentage.toFixed(0)}%)
            </ScoreDisplay>
          </ScoreHeader>

          <ProgressBar score={totalScore} total={totalPossible} isDarkMode={darkMode}>
            <ProgressFill score={totalScore} total={totalPossible} />
          </ProgressBar>

          <BreakdownContainer>
            <BreakdownTitle isDarkMode={darkMode}>Chart Breakdown</BreakdownTitle>
            {/* This is where the user's error was (line 436 in their stack trace) */}
            {scoresArray.map((scoreItem, index) => (
              <ChartBreakdown key={index} isDarkMode={darkMode}>
                <ChartTitle isDarkMode={darkMode}>Chart {index + 1}</ChartTitle>
                
                {currentExamType === 'swing-analysis' ? (
                  <PartScore isDarkMode={darkMode}>
                    <PartTitle isDarkMode={darkMode}>Swing Points</PartTitle>
                    <PartResult 
                      score={typeof scoreItem === 'number' ? scoreItem : 0} 
                      total={10} // Assuming 10 points for swing analysis
                      isDarkMode={darkMode}
                    >
                      {typeof scoreItem === 'number' ? scoreItem : 0} / 10
                    </PartResult>
                  </PartScore>
                ) : (currentExamType === 'fibonacci-retracement' || currentExamType === 'fair-value-gaps') ? (
                  <>
                    <PartScore isDarkMode={darkMode}>
                      <PartTitle isDarkMode={darkMode}>Part 1</PartTitle>
                      <PartResult 
                        score={scoreItem.part1 || 0} 
                        total={currentExamType === 'fibonacci-retracement' ? 2 : 5} // Example totals
                        isDarkMode={darkMode}
                      >
                        {scoreItem.part1 || 0} / {currentExamType === 'fibonacci-retracement' ? 2 : 5}
                      </PartResult>
                    </PartScore>
                    <PartScore isDarkMode={darkMode}>
                      <PartTitle isDarkMode={darkMode}>Part 2</PartTitle>
                      <PartResult 
                        score={scoreItem.part2 || 0} 
                        total={currentExamType === 'fibonacci-retracement' ? 2 : 5} // Example totals
                        isDarkMode={darkMode}
                      >
                        {scoreItem.part2 || 0} / {currentExamType === 'fibonacci-retracement' ? 2 : 5}
                      </PartResult>
                    </PartScore>
                  </>
                ) : null}
              </ChartBreakdown>
            ))}
          </BreakdownContainer>

          <Feedback isDarkMode={darkMode}>
            <FeedbackTitle isDarkMode={darkMode}>Feedback</FeedbackTitle>
            <p>{feedbackMessage}</p>
            <h4>How to Improve:</h4>
            <ul>
              {improvementTips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </Feedback>
        </ResultsCard>

        <ButtonContainer>
          <Link href="/dashboard" passHref>
            <Button isDarkMode={darkMode} as="a">Back to Dashboard</Button>
          </Link>
          
          <Link href={`/chart-exam/${currentExamType || 'fair-value-gaps'}`} passHref>
            <Button primary isDarkMode={darkMode} as="a">
              Try Again
            </Button>
          </Link>
        </ButtonContainer>
      </Container>
    </TrackedPage>
  );
};

export default ChartExamResults;
import React, { useState, useEffect ,useRef} from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import SwingAnalysis from './SwingAnalysis';
import FibonacciRetracement from './FibonacciRetracement';
import FairValueGaps from './FairValueGaps';
import ExamProgress from './common/ExamProgress';
import ResultsPanel from './common/ResultsPanel';
import CountdownTimer from './common/CountdownTimer';
import FocusWarningModal from './common/FocusWarningModal';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../CryptoLoader';
import logger from '../../lib/logger';
import storage from '../../lib/storage';
import AppModal from '../common/AppModal';
import { useModal } from '../../lib/useModal';
// Styled components with $-prefixed props to prevent DOM forwarding
const ExamContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
`;

const ExamHeader = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

const HelpButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background: ${({ $isDarkMode }) => $isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border: 1px solid ${({ $isDarkMode }) => $isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ $isDarkMode }) => $isDarkMode ? '#ffffff' : '#1a1a1a'};
  font-size: 16px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    transform: scale(1.1);
    background: ${({ $isDarkMode }) => $isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  margin-bottom: 10px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const Subtitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 5px;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#555'};
`;

const Instructions = styled.p`
  font-size: 1rem;
  margin-bottom: 20px;
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
  line-height: 1.5;
`;

const ChartContainer = styled.div`
  margin-bottom: 20px;
`;

const ControlPanel = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.$isDarkMode ? '#3f51b5' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? '#303f9f' : '#1976D2'};
  }
  
  &:disabled {
    background-color: ${props => props.$isDarkMode ? '#555' : '#ccc'};
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${props => props.$isDarkMode ? 'flex' : 'flex'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  
  > div {
    background: ${props => props.$isDarkMode ? '#1e1e1e' : 'white'};
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const ChartExam = ({ examType, assetType, startTour, tourCompleted = false }) => {
  // Move all hook calls inside the component function
  const router = useRouter();
  const { darkMode } = React.useContext(ThemeContext);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartCount, setChartCount] = useState(1);
  const [part, setPart] = useState(1);
  const [drawings, setDrawings] = useState([]);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [focusWarningTime, setFocusWarningTime] = useState(60);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const chartRef = useRef(null);
  const { isOpen: modalOpen, modalProps, hideModal, showAlert, showError } = useModal();
  // Start a new chart session
  const startChartSession = async () => {
    try {
      const token = await storage.getItem('auth_token');
      const response = await fetch('/api/charting-exam/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examType: examType === 'swing-analysis' ? 'swing' : 
                    examType === 'fibonacci-retracement' ? 'fibonacci' : 'fvg',
          chartCount,
          part: (examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') ? part : 1
        })
      });

      const data = await response.json();
      if (data.success) {
        setTimeRemaining(data.session.timeRemaining);
        setSessionStarted(true);
        setIsTimerPaused(false); // Ensure timer starts unpaused for new sessions
        logger.log('Chart session started:', data.session);
      } else {
        console.error('Failed to start session:', data.message);
      }
    } catch (error) {
      console.error('Error starting chart session:', error);
    }
  };

  // Handle time expiry
  const handleTimeExpired = async () => {
    if (isTransitioning) return; // Prevent multiple calls
    
    setTimeRemaining(0);
    showAlert('Time expired! Moving to next chart...', 'Time Expired', 'warning');
    setTimeout(async () => {
      hideModal();
      await continueExam();
    }, 2000);
  };

  // Handle focus warning timeout (reset exam)
  const handleFocusTimeout = async () => {
    if (isTransitioning) return; // Prevent multiple calls
    
    setShowFocusWarning(false);
    setIsTimerPaused(false);
    showAlert('You were away too long! Exam progress has been reset. Moving to next chart...', 'Focus Lost', 'warning');
    setTimeout(async () => {
      hideModal();
      await continueExam();
    }, 2500);
  };

  // Handle return from focus warning
  const handleReturnToExam = () => {
    setShowFocusWarning(false);
    setIsTimerPaused(false);
    setFocusWarningTime(60); // Reset warning timer
  };

  // Fetch chart data with improved data processing
  const fetchChartData = async (forceRefresh = false) => {
    // Prevent fetching new chart data during an active session unless explicitly forced
    if ((sessionStarted && timeRemaining > 0 && !forceRefresh) || (loading && !forceRefresh)) {
      logger.log('Prevented chart refresh during active session or loading');
      return;
    }
    
    setLoading(true);
    setSessionStarted(false);
    try {
      const response = await fetch(`/api/charting-exam/fetch-chart?examType=${examType}&assetType=${assetType || ''}`);
      const data = await response.json();
      
      if (data.chart_data && data.chart_data.length > 0) {
        // Process the chart data to ensure it's in a consistent format
        const processedData = data.chart_data.map(candle => {
          // Ensure we have a numeric timestamp
          let timeValue = candle.time;
          if (!timeValue && candle.date) {
            try {
              timeValue = Math.floor(new Date(candle.date).getTime() / 1000);
            } catch (e) {
              console.error('Invalid date format:', candle.date);
              timeValue = Math.floor(Date.now() / 1000) - (86400 * 30);
            }
          }
          
          return {
            time: timeValue,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            // Include the original date if it exists
            date: candle.date || new Date(timeValue * 1000).toISOString()
          };
        }).sort((a, b) => a.time - b.time); // Ensure sorted by time
        
        setChartData(processedData);
        setSymbol(data.symbol || 'Unknown');
        setTimeframe(data.timeframe || '1h');
        
        // Store the chart data in session storage for backup
        try {
          await storage.setItem('current_chart_data', JSON.stringify(processedData));
        } catch (e) {
          console.warn('Failed to store chart data in session storage:', e);
        }
      } else {
        // Handle error
        console.error('Failed to fetch valid chart data');
        // Try to load from session storage as backup
        const savedData = await storage.getItem('current_chart_data');
        if (savedData) {
          try {
            setChartData(JSON.parse(savedData));
          } catch (e) {
            console.error('Failed to parse saved chart data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Validate user drawings with chart data included in payload
  const validateDrawings = async () => {
    // Prevent multiple submissions
    if (submitting) {
      logger.log("Already submitting, ignoring duplicate request");
      return;
    }
    
    logger.log("Validating drawings:", drawings);
  
    // Check if there are drawings to validate
    if (drawings.length === 0 || (!drawings[0]?.no_fvgs_found && !drawings[0]?.no_swings_found && drawings.length === 0)) {
      showAlert('Please mark at least one point before submitting.', 'Missing Input', 'warning');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const validationEndpoints = {
        'swing-analysis': '/api/charting-exam/validate-swing',
        'fibonacci-retracement': '/api/charting-exam/validate-fibonacci',
        'fair-value-gaps': '/api/charting-exam/validate-fvg'
      };
      
      const endpoint = validationEndpoints[examType];
      
      if (!endpoint) {
        throw new Error(`Unknown exam type: ${examType}`);
      }
      
      // Get auth token from storage
      const token = await storage.getItem('auth_token');
      
      // Include auth token in request headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          drawings,
          chartData,
          chartCount,
          part: examType === 'fibonacci-retracement' ? part : 
                examType === 'fair-value-gaps' ? part : null,
          timeframe: timeframe // Pass the timeframe for adaptive gap sizing
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Handle validation failures more gracefully
      if (data.error || !response.ok) {
        console.error('Validation error:', data.error, data.message);
        
        // Handle time expiry specifically
        if (data.code === 'TIME_LIMIT_EXCEEDED') {
          showAlert('Time limit exceeded for this chart. Moving to next chart...', 'Time Limit Exceeded', 'warning');
          setTimeout(async () => {
            hideModal();
            await continueExam();
          }, 2000);
          return;
        }
        
        showError(`Validation error: ${data.message || 'Something went wrong during submission. Please try again.'}`);
        setSubmitting(false);
        return;
      }
      
      // Update time remaining from response
      if (data.timeRemaining !== undefined) {
        setTimeRemaining(data.timeRemaining);
      }
      
      // Update scores - FIXED: Store totalExpectedPoints for accurate percentage calculation
      if (examType === 'swing-analysis') {
        setScores([...scores, { 
          score: data.score, 
          totalPoints: data.totalExpectedPoints 
        }]);
      } else if (examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') {
        if (part === 1) {
          // Start new score entry
          setScores([...scores, { 
            part1: data.score,
            part1TotalPoints: data.totalExpectedPoints
          }]);
        } else {
          // Update last score entry
          const updatedScores = [...scores];
          updatedScores[updatedScores.length - 1].part2 = data.score;
          updatedScores[updatedScores.length - 1].part2TotalPoints = data.totalExpectedPoints;
          setScores(updatedScores);
        }
      }
      
      // Log validation results for debugging
      logger.log(`Validation results: ${data.score}/${data.totalExpectedPoints} points`);
      
      // Set results and show panel
      setResults(data);
      setShowResults(true);
      
      // Stop the timer after successful submission to allow free analysis
      setIsTimerPaused(true);
      
    } catch (error) {
      console.error('Error validating drawings:', error);
      
      if (error.name === 'AbortError') {
        showError('Submission timed out. Please check your connection and try again.', 'Timeout Error');
      } else {
        showError('Error validating your submission. Please try again.', 'Validation Error');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const saveResultsAndRedirect = async (finalScores, examType) => {
    setSubmitting(true);
    try {
      // Store results in storage
      const resultData = {
        scores: finalScores,
        examType: examType,
        timestamp: new Date().toISOString(),
      };
      
      // Save to storage
      await storage.setItem('chartExamResults', JSON.stringify(resultData));
      
      // Build URL with fallback query parameters in case sessionStorage isn't available later
      const queryParams = new URLSearchParams({
        examType: examType,
        scores: JSON.stringify(finalScores)
      }).toString();
      
      // Redirect to results page
      router.push(`/chart-exam/results?${queryParams}`);
    } catch (error) {
      console.error('Error saving results:', error);
      // Fallback to direct navigation if storage fails
      router.push('/chart-exam/results');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Continue to next part or chart
  const continueExam = async () => {
    // Prevent multiple calls while already transitioning
    if (loading || isTransitioning) {
      return;
    }
    
    setIsTransitioning(true);
    setShowResults(false);
    setResults(null);
    setDrawings([]);
    
    // Resume timer for the next chart/part
    setIsTimerPaused(false);
    
    // Check if we need to go to part 2 or next chart
    if ((examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') && 
        part === 1 && results?.next_part === 2) {
      // Go to part 2 (same chart)
      setPart(2);
      setTimeRemaining(null);
      setSessionStarted(false);
      setIsTransitioning(false);
      // Session will be restarted automatically when part state updates
    } else {
      // Finish the current chart
      setTimeRemaining(null);
      setSessionStarted(false);
      
      // Check if we've completed all charts
      if (chartCount >= 5) {
        // Calculate total score - FIXED: Use actual stored totalPoints
        const { totalScore, totalPossible } = scores.reduce((acc, scoreItem) => {
          if (examType === 'swing-analysis') {
            // New format: { score: X, totalPoints: Y }
            acc.totalScore += (scoreItem.score || 0);
            acc.totalPossible += (scoreItem.totalPoints || 10); // Fallback for safety
          } else {
            // Fibonacci/FVG format: { part1: X, part1TotalPoints: Y, part2: Z, part2TotalPoints: W }
            acc.totalScore += (scoreItem.part1 || 0) + (scoreItem.part2 || 0);
            acc.totalPossible += (scoreItem.part1TotalPoints || 2) + (scoreItem.part2TotalPoints || 2); // Fallback for safety
          }
          return acc;
        }, { totalScore: 0, totalPossible: 0 });
        
        // Instead of alert, save results and redirect
        await saveResultsAndRedirect(scores, examType);
        setIsTransitioning(false);
        return;
      }
      
      // Move to the next chart
      setChartCount(chartCount + 1);
      setPart(1);
      setTimeRemaining(null);
      setSessionStarted(false);
      await fetchChartData(true); // Force refresh for new chart
      setIsTransitioning(false);
    }
  };
  
  // Handle drawings update from child components
 // In components/charting_exam/ChartExam.jsx - only the updated function needed
const handleDrawingsUpdate = (newDrawings) => {
  logger.log("Drawings update received:", newDrawings);

  // Store drawings without causing unnecessary rerenders
  setDrawings(prevDrawings => {
    // Only update if drawings have actually changed
    if (JSON.stringify(prevDrawings) !== JSON.stringify(newDrawings)) {
      return newDrawings;
    }
    return prevDrawings;
  });
};
// Removed problematic useEffect that was causing random chart updates
  // Fetch initial chart data
  useEffect(() => {
    fetchChartData(true); // Force refresh for initial load
  }, [examType, assetType]);
  
  // Restart session when part changes (for fibonacci/fvg exams) - but only after tour is completed
  useEffect(() => {
    if (!loading && chartData.length > 0 && !sessionStarted && timeRemaining === null && !isTransitioning && tourCompleted) {
      startChartSession();
    }
  }, [part, loading, sessionStarted, isTransitioning, tourCompleted]);
  
  // Focus detection - pause timer when user switches tabs/browsers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionStarted && timeRemaining > 0 && !isTimerPaused) {
        // User switched away from tab during active session
        setIsTimerPaused(true);
        setShowFocusWarning(true);
        setFocusWarningTime(60); // Reset to 60 seconds
        logger.log('User left tab during active session - pausing timer');
      } else if (!document.hidden && showFocusWarning) {
        // User returned to tab - don't auto-resume, let them click button
        logger.log('User returned to tab');
      }
    };

    const handleBeforeUnload = (e) => {
      if (sessionStarted && timeRemaining > 0) {
        e.preventDefault();
        e.returnValue = 'Your exam progress will be lost if you leave this page. Are you sure?';
        return 'Your exam progress will be lost if you leave this page. Are you sure?';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionStarted, timeRemaining, showFocusWarning]);
  
  // Get instructions based on exam type and part
  const getInstructions = () => {
    if (examType === 'swing-analysis') {
      return 'Identify all significant swing highs and lows on the chart by clicking on the candlestick wicks.';
    } else if (examType === 'fibonacci-retracement') {
      return part === 1 
        ? 'Part 1: Draw an uptrend Fibonacci retracement (swing low to swing high).'
        : 'Part 2: Draw a downtrend Fibonacci retracement (swing high to swing low).';
    } else if (examType === 'fair-value-gaps') {
      return part === 1
        ? 'Part 1: Identify Bullish Fair Value Gaps (gaps above price where price has yet to return).'
        : 'Part 2: Identify Bearish Fair Value Gaps (gaps below price where price has yet to return).';
    }
    return 'Examine the chart and complete the required analysis.';
  };
  
  // Render the appropriate exam component
  const renderExamComponent = () => {
    logger.log("Rendering exam component:", examType);

    const props = {
      chartData,
      onDrawingsUpdate: handleDrawingsUpdate,
      isDarkMode: darkMode,
      chartCount,
      // Pass the validation results if they exist
      validationResults: results
    };
    
    if (examType === 'swing-analysis') {
      return <SwingAnalysis {...props} />;
    } else if (examType === 'fibonacci-retracement') {
      return <FibonacciRetracement {...props} part={part} />;
    } else if (examType === 'fair-value-gaps') {
      return <FairValueGaps {...props} part={part} />;
    }
    
    return <div>Unknown exam type</div>;
  };
  
  return (
    <ExamContainer>
      <ExamHeader>
        {startTour && (
          <HelpButton
            $isDarkMode={darkMode}
            onClick={startTour}
            title="Take guided tour"
            className="help-button"
          >
            ?
          </HelpButton>
        )}
        
        <Title $isDarkMode={darkMode}>
          {examType === 'swing-analysis' ? 'Swing Analysis' :
           examType === 'fibonacci-retracement' ? 'Fibonacci Retracement' :
           examType === 'fair-value-gaps' ? 'Fair Value Gaps' : 'Chart Exam'}
        </Title>
        <Subtitle $isDarkMode={darkMode}>Symbol: {symbol} ({timeframe})</Subtitle>
        <Instructions $isDarkMode={darkMode}>{getInstructions()}</Instructions>
      </ExamHeader>
      
      <ExamProgress 
        chartCount={chartCount} 
        maxCharts={5} 
        part={part}
        hasParts={examType === 'fibonacci-retracement' || examType === 'fair-value-gaps'}
      />
      
      {sessionStarted && timeRemaining !== null && (
        <CountdownTimer
          timeRemaining={timeRemaining}
          examType={examType === 'swing-analysis' ? 'swing' : 
                    examType === 'fibonacci-retracement' ? 'fibonacci' : 'fvg'}
          onTimeExpired={handleTimeExpired}
          isDarkMode={darkMode}
          isPaused={isTimerPaused}
        />
      )}
      
      <ChartContainer>
        {loading ? (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <CryptoLoader />
          </div>
        ) : (
          renderExamComponent()
        )}
      </ChartContainer>
      
      <ControlPanel>
        <Button 
          onClick={validateDrawings} 
          disabled={loading || submitting || timeRemaining === 0}
          $isDarkMode={darkMode}
        >
          Submit Answer
        </Button>
      </ControlPanel>
      
      {showResults && (
        <ResultsPanel 
          results={results} 
          onContinue={continueExam} 
          examType={examType}
          part={part}
          chartCount={chartCount}
          isDarkMode={darkMode}
        />
      )}
      
      {submitting && (
        <LoadingOverlay $isDarkMode={darkMode}>
          <div>
            <CryptoLoader />
            <p>Analyzing your answers...</p>
          </div>
        </LoadingOverlay>
      )}

      <FocusWarningModal
        isVisible={showFocusWarning}
        onReturn={handleReturnToExam}
        onTimeout={handleFocusTimeout}
        isDarkMode={darkMode}
        warningSeconds={focusWarningTime}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={hideModal}
        {...modalProps}
      />
    </ExamContainer>
  );
};

export default ChartExam;
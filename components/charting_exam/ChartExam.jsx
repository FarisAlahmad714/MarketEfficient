import React, { useState, useEffect ,useRef} from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import SwingAnalysis from './SwingAnalysis';
import FibonacciRetracement from './FibonacciRetracement';
import FairValueGaps from './FairValueGaps';
import ExamProgress from './common/ExamProgress';
import ResultsPanel from './common/ResultsPanel';
import { ThemeContext } from '../../contexts/ThemeContext';

// Styled components with $-prefixed props to prevent DOM forwarding
const ExamContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
`;

const ExamHeader = styled.div`
  margin-bottom: 20px;
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
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  
  & > div {
    background-color: ${props => props.$isDarkMode ? '#262626' : 'white'};
    padding: 20px 30px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const Spinner = styled.div`
  border: 4px solid ${props => props.$isDarkMode ? '#555' : '#f3f3f3'};
  border-top: 4px solid ${props => props.$isDarkMode ? '#3f51b5' : '#2196F3'};
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ChartExam = ({ examType }) => {
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
  const chartRef = useRef(null);
  // Fetch chart data with improved data processing
  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/charting-exam/fetch-chart');
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
          sessionStorage.setItem('current_chart_data', JSON.stringify(processedData));
        } catch (e) {
          console.warn('Failed to store chart data in session storage:', e);
        }
      } else {
        // Handle error
        console.error('Failed to fetch valid chart data');
        // Try to load from session storage as backup
        const savedData = sessionStorage.getItem('current_chart_data');
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
    console.log("Validating drawings:", drawings);

    // Check if there are drawings to validate
    if (drawings.length === 0 && !drawings[0]?.no_fvgs_found && !drawings[0]?.no_swings_found) {
      alert('Please mark at least one point before submitting.');
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
      
      // IMPORTANT: Include chartData in the request payload
      // This ensures backend validation uses the same data as frontend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          drawings,
          chartData, // Send chart data to backend for validation
          chartCount,
          part: examType === 'fibonacci-retracement' ? part : 
                examType === 'fair-value-gaps' ? part : null
        })
      });
      
      const data = await response.json();
      
      // Handle validation failures more gracefully
      if (data.error) {
        console.error('Validation error:', data.error, data.message);
        alert(`Validation error: ${data.message || 'Something went wrong'}`);
        setSubmitting(false);
        return;
      }
      
      // Update scores
      if (examType === 'swing-analysis') {
        setScores([...scores, data.score]);
      } else if (examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') {
        if (part === 1) {
          // Start new score entry
          setScores([...scores, { part1: data.score }]);
        } else {
          // Update last score entry
          const updatedScores = [...scores];
          updatedScores[updatedScores.length - 1].part2 = data.score;
          setScores(updatedScores);
        }
      }
      
      // Log validation results for debugging
      console.log(`Validation results: ${data.score}/${data.totalExpectedPoints} points`);
      
      // Set results and show panel
      setResults(data);
      setShowResults(true);
      
    } catch (error) {
      console.error('Error validating drawings:', error);
      alert('Error validating your submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const saveResultsAndRedirect = (finalScores, examType) => {
    try {
      // Store results in sessionStorage
      const resultData = {
        scores: finalScores,
        examType: examType,
        timestamp: new Date().toISOString(),
      };
      
      // Save to sessionStorage
      sessionStorage.setItem('chartExamResults', JSON.stringify(resultData));
      
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
    }
  };
  
  // Continue to next part or chart
  const continueExam = async () => {
    setShowResults(false);
    setResults(null);
    setDrawings([]);
    
    // Check if we need to go to part 2 or next chart
    if ((examType === 'fibonacci-retracement' || examType === 'fair-value-gaps') && 
        part === 1 && results?.next_part === 2) {
      // Go to part 2 (same chart)
      setPart(2);
    } else {
      // Finish the current chart
      
      // Check if we've completed all charts
      if (chartCount >= 5) {
        // Calculate total score
        const totalScore = scores.reduce((sum, score) => {
          if (typeof score === 'number') {
            return sum + score;
          } else {
            return sum + (score.part1 || 0) + (score.part2 || 0);
          }
        }, 0);
        
        const totalPossible = scores.length * (
          examType === 'swing-analysis' ? 10 : 
          examType === 'fibonacci-retracement' ? 4 : 
          examType === 'fair-value-gaps' ? 10 : 0
        );
        
        // Instead of alert, save results and redirect
        saveResultsAndRedirect(scores, examType);
        return;
      }
      
      // Move to the next chart
      setChartCount(chartCount + 1);
      setPart(1);
      await fetchChartData();
    }
  };
  
  // Handle drawings update from child components
 // In components/charting_exam/ChartExam.jsx - only the updated function needed
const handleDrawingsUpdate = (newDrawings) => {
  console.log("Drawings update received:", newDrawings);

  // Store drawings without causing unnecessary rerenders
  setDrawings(prevDrawings => {
    // Only update if drawings have actually changed
    if (JSON.stringify(prevDrawings) !== JSON.stringify(newDrawings)) {
      return newDrawings;
    }
    return prevDrawings;
  });
};
useEffect(() => {
  // Only recreate chart when absolutely necessary
  if (chartRef.current && chartData) {
    try {
      // Update data without recreating chart
      const chart = chartRef.current.getChart();
      if (chart && chart.series && chart.series[0]) {
        // Update data without triggering view reset
        const currentExtremes = {
          xAxis: chart.xAxis[0].getExtremes(),
          yAxis: chart.yAxis[0].getExtremes()
        };
        
        // Update data
        chart.series[0].setData(chartData, false);
        
        // Restore view
        chart.xAxis[0].setExtremes(
          currentExtremes.xAxis.min,
          currentExtremes.xAxis.max, 
          false
        );
        chart.yAxis[0].setExtremes(
          currentExtremes.yAxis.min,
          currentExtremes.yAxis.max,
          false
        );
        
        chart.redraw(false);
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }
}, [chartData]);
  // Fetch initial chart data
  useEffect(() => {
    fetchChartData();
  }, []);
  
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
    console.log("Rendering exam component:", examType);

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
      
      <ChartContainer>
        {loading ? (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Spinner $isDarkMode={darkMode} />
            <p>Loading chart data...</p>
          </div>
        ) : (
          renderExamComponent()
        )}
      </ChartContainer>
      
      <ControlPanel>
        <Button 
          onClick={validateDrawings} 
          disabled={loading || submitting}
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
            <Spinner $isDarkMode={darkMode} />
            <p>Analyzing your answers...</p>
          </div>
        </LoadingOverlay>
      )}
    </ExamContainer>
  );
};

export default ChartExam;
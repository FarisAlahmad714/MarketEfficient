import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from 'styled-components';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';
import dynamic from 'next/dynamic';

// Dynamically import the chart components to avoid SSR issues
const ChartComponent = dynamic(
  () => import('../../components/charts/PlotlyChart'),
  { ssr: false, loading: () => <div>Loading Chart...</div> }
);

// Exam configurations
const EXAM_CONFIGS = {
  'swing-analysis': {
    title: 'Swing Point Analysis',
    instructions: 'Identify key swing points (highs and lows) in the chart. These are critical pivot areas where price direction changed.',
    minDrawings: 1,
    maxDrawings: 10,
    asset: 'btc',
    timeframe: 'daily'
  },
  'fibonacci-retracement': {
    title: 'Fibonacci Retracement',
    instructions: 'Draw Fibonacci retracement levels by selecting the swing high and swing low. Part 1: Draw an uptrend Fibonacci retracement (from a low to a high). Part 2: Draw a downtrend retracement (from a high to a low).',
    minDrawings: 1,
    maxDrawings: 3,
    asset: 'eth',
    timeframe: 'daily',
    parts: 2
  },
  'fair-value-gaps': {
    title: 'Fair Value Gaps',
    instructions: 'Identify Fair Value Gaps - areas where price makes a significant move leaving an imbalance that often gets filled later. Part 1: Identify Bullish FVGs. Part 2: Identify Bearish FVGs.',
    minDrawings: 0, // Can be 0 if no FVGs exist
    maxDrawings: 5,
    asset: 'sol',
    timeframe: 'daily',
    parts: 2
  }
};

// Styled components using your existing style approach
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const InstructionsPanel = styled.div`
  background-color: ${props => props.theme.darkMode ? '#1e1e1e' : '#f5f5f5'};
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: ${props => props.theme.darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
`;

const InstructionsTitle = styled.h2`
  font-size: 1.3rem;
  margin-bottom: 10px;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const InstructionsText = styled.p`
  color: ${props => props.theme.darkMode ? '#b0b0b0' : '#555'};
  margin-bottom: 15px;
`;

const RequirementsBox = styled.div`
  margin-top: 15px;
  padding: 10px;
  background-color: ${props => props.theme.darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'};
  border-radius: 4px;
`;

const ProgressBar = styled.div`
  background-color: ${props => props.theme.darkMode ? '#333' : '#e0e0e0'};
  height: 8px;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  background-color: ${props => props.complete ? '#4CAF50' : '#2196F3'};
  height: 100%;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ChartContainer = styled.div`
  background-color: ${props => props.theme.darkMode ? '#262626' : 'white'};
  padding: 20px;
  border-radius: 8px;
  box-shadow: ${props => props.theme.darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
  margin-bottom: 30px;
  position: relative;
  min-height: 600px;
`;

const StatsContainer = styled.div`
  background-color: ${props => props.theme.darkMode ? '#1e1e1e' : '#f8f9fa'};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const BackButton = styled.a`
  padding: 12px 25px;
  background-color: ${props => props.theme.darkMode ? '#333' : '#e0e0e0'};
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  padding: 12px 25px;
  background-color: ${props => props.disabled ? '#ccc' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: bold;
  opacity: ${props => props.submitted ? 0.7 : 1};
`;

// Dynamic import for each exam type
const FibonacciRetracement = dynamic(() => import('../../components/charting-exam/FibonacciRetracement'), { ssr: false });
const SwingAnalysis = dynamic(() => import('../../components/charting-exam/SwingAnalysis'), { ssr: false });
const FairValueGaps = dynamic(() => import('../../components/charting-exam/FairValueGaps'), { ssr: false });

const ChartExamPage = () => {
  const router = useRouter();
  const { examType } = router.query;
  const { darkMode } = useContext(ThemeContext);
  
  // State
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [chartCount, setChartCount] = useState(1);
  
  const cryptoLoaderRef = useRef(null);
  
  // Load exam configuration and initial chart data
  useEffect(() => {
    if (!router.isReady || !examType) return;
    
    const config = EXAM_CONFIGS[examType];
    if (!config) {
      setError('Invalid exam type');
      setLoading(false);
      return;
    }
    
    setExamConfig(config);
    
    // Function to fetch chart data
    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        // Construct the API endpoint based on exam type
        let endpoint = `/api/charting-exam/fetch-chart?examType=${examType}&part=${currentPart}&chart=${chartCount}`;
        
        // For now, we'll mock this with a simplified API call
        // In the full implementation, this would connect to your backend
        const response = await axios.get(endpoint);
        
        if (response.data && response.data.chartData) {
          setChartData(response.data.chartData);
        } else {
          // Fallback to mock data if needed
          setChartData(generateMockChartData(config.asset));
        }
        
        // Set a small timeout to simulate loading
        setTimeout(() => {
          setLoading(false);
          if (cryptoLoaderRef.current) {
            cryptoLoaderRef.current.hideLoader();
          }
        }, 1500);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [router.isReady, examType, currentPart, chartCount]);
  
  // Handle drawing updates
  const handleDrawingsUpdate = (newDrawings) => {
    setDrawings(newDrawings);
    
    // Update progress based on the requirements
    if (examConfig) {
      const minRequired = examConfig.minDrawings;
      const currentCount = newDrawings.length;
      
      // If minDrawings is 0, then any drawing counts as progress
      const calculatedProgress = minRequired === 0 ? 
        (currentCount > 0 ? 100 : 0) : 
        Math.min(100, Math.round((currentCount / minRequired) * 100));
      
      setProgress(calculatedProgress);
    }
  };
  
  // Handle exam submission
  const handleSubmit = async () => {
    if (!examConfig) return;
    
    // For exams with minimum required drawings
    if (examConfig.minDrawings > 0 && drawings.length < examConfig.minDrawings) {
      setFeedback({
        type: 'warning',
        message: `Please add at least ${examConfig.minDrawings} drawings to complete this exam.`
      });
      return;
    }
    
    // Mark the exam as submitted
    setSubmitted(true);
    
    try {
      // Submit drawings to the backend for validation
      const response = await axios.post(`/api/charting-exam/validate-${examType}`, {
        drawings,
        part: currentPart,
        chartCount
      });
      
      // Process the response
      if (response.data) {
        const { success, message, score, expected, totalExpectedPoints, next_part } = response.data;
        
        // Update feedback
        setFeedback({
          type: success ? 'success' : 'error',
          message: message || (success ? 'Exam completed successfully!' : 'Submission failed.'),
          score,
          totalPoints: totalExpectedPoints,
          expected
        });
        
        // Check if there's a next part
        if (next_part) {
          setTimeout(() => {
            setCurrentPart(next_part);
            setDrawings([]);
            setProgress(0);
            setSubmitted(false);
            setFeedback(null);
          }, 3000);
        } else if (chartCount < 5) {
          // Move to next chart
          setTimeout(() => {
            setChartCount(chartCount + 1);
            setCurrentPart(1);
            setDrawings([]);
            setProgress(0);
            setSubmitted(false);
            setFeedback(null);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      setFeedback({
        type: 'error',
        message: 'Failed to submit exam. Please try again.'
      });
      setSubmitted(false);
    }
  };
  
  // Helper function to generate mock chart data if needed
  const generateMockChartData = (asset) => {
    const basePrice = asset === 'btc' ? 60000 : asset === 'eth' ? 3000 : 100;
    const data = [];
    
    for (let i = 0; i < 100; i++) {
      const time = new Date();
      time.setDate(time.getDate() - (100 - i));
      
      const randomChange = (Math.random() - 0.5) * basePrice * 0.02;
      const open = i === 0 ? basePrice : data[i-1].close;
      const close = open + randomChange;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.01;
      
      data.push({
        date: time.toISOString(),
        time: Math.floor(time.getTime() / 1000),
        open,
        high,
        low,
        close
      });
    }
    
    return data;
  };
  
  // Render the appropriate exam component based on type
  const renderExamComponent = () => {
    if (!chartData || !examConfig) return null;
    
    switch (examType) {
      case 'swing-analysis':
        return (
          <SwingAnalysis 
            chartData={chartData} 
            onDrawingsUpdate={handleDrawingsUpdate}
            chartCount={chartCount}
            isDarkMode={darkMode}
          />
        );
      case 'fibonacci-retracement':
        return (
          <FibonacciRetracement 
            chartData={chartData} 
            onDrawingsUpdate={handleDrawingsUpdate}
            part={currentPart}
            chartCount={chartCount}
            isDarkMode={darkMode}
          />
        );
      case 'fair-value-gaps':
        return (
          <FairValueGaps 
            chartData={chartData} 
            onDrawingsUpdate={handleDrawingsUpdate}
            part={currentPart}
            chartCount={chartCount}
            isDarkMode={darkMode}
          />
        );
      default:
        return <div>Unsupported exam type</div>;
    }
  };
  
  // Loading screen
  if (loading) {
    return (
      <Container>
        <CryptoLoader 
          ref={cryptoLoaderRef} 
          message="Loading your chart exam..." 
          height="400px" 
          minDisplayTime={1500} 
        />
      </Container>
    );
  }
  
  // Error screen
  if (error) {
    return (
      <Container>
        <div style={{ 
          backgroundColor: darkMode ? '#3a181a' : '#ffebee', 
          padding: '20px', 
          borderRadius: '8px', 
          textAlign: 'center',
          color: darkMode ? '#ff8a80' : '#d32f2f' 
        }}>
          <p>{error}</p>
          <a
            href="/chart-exam"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginTop: '10px',
            }}
          >
            Back to Exam Selection
          </a>
        </div>
      </Container>
    );
  }
  
  return (
    <Container theme={{ darkMode }}>
      <Title theme={{ darkMode }}>{examConfig?.title} Exam</Title>
      
      {/* Instructions Panel */}
      <InstructionsPanel theme={{ darkMode }}>
        <InstructionsTitle theme={{ darkMode }}>Instructions</InstructionsTitle>
        <InstructionsText theme={{ darkMode }}>{examConfig?.instructions}</InstructionsText>
        
        {examConfig?.parts > 1 && (
          <div style={{ marginBottom: '10px', color: darkMode ? '#4CAF50' : '#388E3C' }}>
            <strong>Current Part: {currentPart}/2</strong> - 
            {currentPart === 1 && examType === 'fibonacci-retracement' && ' Draw uptrend Fibonacci retracement'}
            {currentPart === 2 && examType === 'fibonacci-retracement' && ' Draw downtrend Fibonacci retracement'}
            {currentPart === 1 && examType === 'fair-value-gaps' && ' Identify Bullish Fair Value Gaps'}
            {currentPart === 2 && examType === 'fair-value-gaps' && ' Identify Bearish Fair Value Gaps'}
          </div>
        )}
        
        <div style={{ marginBottom: '10px', color: darkMode ? '#03A9F4' : '#0288D1' }}>
          <strong>Chart: {chartCount}/5</strong>
        </div>
        
        <RequirementsBox theme={{ darkMode }}>
          <p style={{ margin: 0, color: darkMode ? '#b0b0b0' : '#555' }}>
            <strong>Requirements:</strong> {examConfig?.minDrawings === 0 ? 
              'Mark all the pattern instances you can find. Use the "No Patterns Found" button if none exist.' : 
              `Add at least ${examConfig?.minDrawings} and up to ${examConfig?.maxDrawings} drawings to the chart.`}
          </p>
        </RequirementsBox>
      </InstructionsPanel>
      
      {/* Progress Bar */}
      <ProgressBar theme={{ darkMode }}>
        <ProgressFill progress={progress} complete={progress >= 100} />
      </ProgressBar>
      
      {/* Main Chart Area */}
      <ChartContainer theme={{ darkMode }}>
        {renderExamComponent()}
        
        {/* Feedback overlay when submitted */}
        {submitted && feedback && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            padding: '30px',
            zIndex: 10,
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{
                color: feedback.type === 'success' ? '#4CAF50' : 
                       feedback.type === 'warning' ? '#FF9800' : '#F44336',
                marginBottom: '20px'
              }}>
                {feedback.type === 'success' ? 'Great Job!' : 
                 feedback.type === 'warning' ? 'Warning' : 'Error'}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                marginBottom: '15px',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                {feedback.message}
              </p>
              {feedback.score !== undefined && (
                <div style={{ marginBottom: '20px' }}>
                  <p>Score: <strong>{feedback.score}/{feedback.totalPoints}</strong></p>
                  <div style={{ 
                    backgroundColor: darkMode ? '#333' : '#e0e0e0', 
                    height: '10px', 
                    borderRadius: '5px', 
                    overflow: 'hidden',
                    margin: '10px 0'
                  }}>
                    <div style={{
                      backgroundColor: '#4CAF50',
                      height: '100%',
                      width: `${(feedback.score / feedback.totalPoints) * 100}%`
                    }}></div>
                  </div>
                </div>
              )}
              
              {examConfig?.parts > 1 && currentPart === 1 ? (
                <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                  Moving to Part 2 in a moment...
                </p>
              ) : chartCount < 5 ? (
                <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                  Moving to next chart in a moment...
                </p>
              ) : (
                <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                  Exam complete! Great job practicing your technical analysis skills.
                </p>
              )}
            </div>
          </div>
        )}
      </ChartContainer>
      
      {/* Drawing Stats */}
      <StatsContainer theme={{ darkMode }}>
        <h3 style={{
          fontSize: '1.1rem',
          marginBottom: '10px',
          color: darkMode ? '#e0e0e0' : 'inherit'
        }}>
          Drawing Statistics
        </h3>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Drawings: </span>
            <span style={{ 
              fontWeight: 'bold', 
              color: examConfig?.minDrawings === 0 || drawings.length >= examConfig?.minDrawings 
                ? '#4CAF50' 
                : '#FF9800' 
            }}>
              {drawings.length} {examConfig?.minDrawings > 0 ? `/ ${examConfig?.minDrawings} required` : ''}
            </span>
          </div>
          <div>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Status: </span>
            <span style={{
              fontWeight: 'bold',
              color: examConfig?.minDrawings === 0 || drawings.length >= examConfig?.minDrawings 
                ? '#4CAF50' 
                : '#FF9800'
            }}>
              {examConfig?.minDrawings === 0 || drawings.length >= examConfig?.minDrawings 
                ? 'Ready to submit' 
                : 'More drawings needed'}
            </span>
          </div>
        </div>
      </StatsContainer>
      
      {/* Actions */}
      <ActionButtons>
        <BackButton 
          href="/chart-exam"
          theme={{ darkMode }}
        >
          Back to Exam Selection
        </BackButton>
        
        <SubmitButton
          onClick={handleSubmit}
          disabled={(examConfig?.minDrawings > 0 && drawings.length < examConfig?.minDrawings) || submitted}
          submitted={submitted}
          theme={{ darkMode }}
        >
          {submitted ? 'Submitted' : 'Submit Exam'}
        </SubmitButton>
      </ActionButtons>
      
      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </Container>
  );
};

export default ChartExam;
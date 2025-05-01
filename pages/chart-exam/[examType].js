// pages/chart-exam/[examType].js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';

// Import Highcharts components dynamically to avoid SSR issues
const HighchartsChart = dynamic(
  () => import('../../components/charts/HighchartsChart'),
  { ssr: false }
);

const HighchartsDrawingTools = dynamic(
  () => import('../../components/charts/HighchartsDrawingTools'),
  { ssr: false }
);

// Map exam types to their configurations
const EXAM_CONFIGS = {
  'swing-points': {
    title: 'Swing Point Analysis',
    instructions: 'Identify key swing points (highs and lows) in the chart. These are critical pivot areas where price direction changed.',
    tools: ['pointer', 'swingPoint'],
    minDrawings: 3,
    maxDrawings: 10,
    asset: 'btc', // Default asset
    timeframe: 'daily' // Default timeframe
  },
  'fibonacci': {
    title: 'Fibonacci Retracement',
    instructions: 'Draw Fibonacci retracement levels between significant price moves. Identify key support and resistance levels based on Fibonacci ratios.',
    tools: ['pointer', 'fibonacci'],
    minDrawings: 1,
    maxDrawings: 3,
    asset: 'eth',
    timeframe: 'daily'
  },
  'fvg': {
    title: 'Fair Value Gaps (FVG)',
    instructions: 'Identify Fair Value Gaps - areas where price makes a significant move leaving an imbalance that often gets filled later.',
    tools: ['pointer', 'fvg'],
    minDrawings: 2,
    maxDrawings: 5,
    asset: 'sol',
    timeframe: 'daily'
  }
};

const ChartExam = () => {
  const router = useRouter();
  const { examType } = router.query;
  const { darkMode } = useContext(ThemeContext);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [examConfig, setExamConfig] = useState(null);
  const [progress, setProgress] = useState(0); // 0-100%
  const [feedback, setFeedback] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  const cryptoLoaderRef = useRef(null);
  
  // Initialize exam based on the examType
  useEffect(() => {
    if (!router.isReady || !examType) return;
    
    // Get the config for this exam type
    const config = EXAM_CONFIGS[examType];
    if (!config) {
      setError('Invalid exam type');
      setLoading(false);
      return;
    }
    
    setExamConfig(config);
    
    // Fetch chart data for the exam
    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        // Get proper asset data for this exam
        const asset = config.asset;
        const timeframe = config.timeframe;
        
        console.log(`Fetching chart data for ${asset} with timeframe ${timeframe}`);
        
        // Use the API to fetch OHLC data
        const response = await axios.get(`/api/test/${asset}?timeframe=${timeframe}&random=${Math.random()}`);
        
        if (response.data && response.data.questions && response.data.questions.length > 0) {
          // Use first question's data for the exam
          const chartData = response.data.questions[0].ohlc_data;
          setChartData(chartData);
          console.log("Chart data loaded:", chartData.length, "candles");
        } else {
          throw new Error('No valid chart data received');
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
  }, [router.isReady, examType, router.query]);
  
  // Handle drawing changes
  const handleDrawingChange = (newDrawings) => {
    setDrawings(newDrawings);
    
    // Update progress based on number of drawings vs requirements
    if (examConfig) {
      const minRequired = examConfig.minDrawings;
      const currentCount = newDrawings.length;
      
      // Calculate progress - scale from 0 to 100%
      const newProgress = Math.min(100, Math.round((currentCount / minRequired) * 100));
      setProgress(newProgress);
    }
  };
  
  // Handle chart creation
  const handleChartCreated = (chart) => {
    console.log("Chart instance created:", chart);
    
    // Ensure proper initialization of chart instance
    if (chart) {
      // Initialize annotations array if it doesn't exist
      if (!chart.annotations) {
        chart.annotations = [];
      }
      
      // Pass chart instance to state for use in other components
      setChartInstance(chart);
    }
  };
  
  // Handle exam submission
  const handleSubmit = () => {
    // Check if minimum requirements met
    if (drawings.length < examConfig.minDrawings) {
      setFeedback({
        type: 'warning',
        message: `Please add at least ${examConfig.minDrawings} drawings to complete this exam.`
      });
      return;
    }
    
    // Log submission details for debugging
    console.log(`Submitting exam with ${drawings.length} drawings:`);
    drawings.forEach((drawing, index) => {
      console.log(`Drawing ${index + 1}: ${drawing.type} with ${drawing.points.length} points`);
    });
    
    // Process submission
    setSubmitted(true);
  
    const generateFeedback = () => {
      switch (examType) {
        case 'swing-points':
          return {
            type: 'success',
            message: `Great job identifying ${drawings.length} key swing points! These areas often act as support and resistance levels in future price action.`,
            details: 'Swing points mark important areas where market sentiment shifted. Understanding these points helps with future trade planning.'
          };
        case 'fibonacci':
          return {
            type: 'success',
            message: `Well done applying Fibonacci retracement levels to this chart! These levels can help identify potential reversal zones.`,
            details: 'The key Fibonacci levels (0.382, 0.5, 0.618, 0.786) often coincide with areas where price consolidates or reverses.'
          };
        case 'fvg':
          return {
            type: 'success',
            message: `Good identification of Fair Value Gaps! These imbalances often get filled in future price movements.`,
            details: 'FVGs represent inefficiency in price discovery that the market tends to correct. They can be valuable for identifying future price targets.'
          };
        default:
          return {
            type: 'success',
            message: 'Exam completed successfully!'
          };
      }
    };
    
    // Set feedback with slight delay for animation
    setTimeout(() => {
      const feedback = generateFeedback();
      console.log('Setting feedback:', feedback);
      setFeedback(feedback);
    }, 800);
  };
  
  // Handle retaking the exam
  const handleRetry = () => {
    // Clear all annotations from chart
    if (chartInstance) {
      try {
        // Remove all annotations from the chart
        while (chartInstance.annotations && chartInstance.annotations.length > 0) {
          chartInstance.annotations[0].destroy();
        }
      } catch (err) {
        console.error("Error clearing annotations:", err);
      }
    }
    
    // Reset state
    setDrawings([]);
    setProgress(0);
    setFeedback(null);
    setSubmitted(false);
  };
  
  // If loading, show crypto loader
  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <CryptoLoader 
          ref={cryptoLoaderRef} 
          message="Loading your chart exam..." 
          height="400px" 
          minDisplayTime={1500} 
        />
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: darkMode ? '#3a181a' : '#ffebee', padding: '20px', borderRadius: '8px', color: darkMode ? '#ff8a80' : '#d32f2f' }}>
          <p>{error}</p>
          <Link
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
          </Link>
        </div>
      </div>
    );
  }
  
  // If no exam config or chart data, show error
  if (!examConfig || !chartData) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: darkMode ? '#332d10' : '#fff9c4', padding: '20px', borderRadius: '8px', color: darkMode ? '#ffee58' : '#f57f17' }}>
          <p>Exam data not available. Please return to the exam selection page.</p>
          <Link
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
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px', 
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: darkMode ? '#e0e0e0' : 'inherit'
      }}>
        {examConfig.title} Exam
      </h1>
      
      {/* Instructions Panel */}
      <div style={{ 
        backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '1.3rem', 
          marginBottom: '10px',
          color: darkMode ? '#e0e0e0' : 'inherit'
        }}>
          Instructions
        </h2>
        <p style={{ color: darkMode ? '#b0b0b0' : '#555' }}>
          {examConfig.instructions}
        </p>
        
        {/* Requirements */}
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', 
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, color: darkMode ? '#b0b0b0' : '#555' }}>
            <strong>Requirements:</strong> Add at least {examConfig.minDrawings} and up to {examConfig.maxDrawings} drawings to the chart.
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={{ 
        backgroundColor: darkMode ? '#333' : '#e0e0e0', 
        height: '8px', 
        borderRadius: '4px', 
        marginBottom: '20px',
        overflow: 'hidden'
      }}>
        <div 
          style={{ 
            backgroundColor: progress >= 100 ? '#4CAF50' : '#2196F3', 
            height: '100%', 
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      
      {/* Main Chart Area */}
      <div style={{ 
        backgroundColor: darkMode ? '#262626' : 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)', 
        marginBottom: '30px',
        position: 'relative',
        minHeight: '600px'
      }}>
        {/* Chart and Drawing Tools */}
        {chartData && chartData.length > 0 ? (
          <>
            {/* Drawing Tools Component */}
            {chartInstance && (
              <HighchartsDrawingTools
                chart={chartInstance}
                onDrawingChange={handleDrawingChange}
              />
            )}
            
            {/* HighchartsChart Component */}
            <HighchartsChart 
              data={chartData} 
              height={500}
              onChartCreated={handleChartCreated}
            />
          </>
        ) : (
          <div style={{ 
            height: '500px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: darkMode ? '#b0b0b0' : '#666' 
          }}>
            No chart data available
          </div>
        )}
        
        {/* Feedback Overlay for Submitted Exam */}
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
                color: feedback.type === 'success' ? '#4CAF50' : '#F44336',
                marginBottom: '20px'
              }}>
                {feedback.type === 'success' ? 'Exam Completed!' : 'Warning'}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                marginBottom: '15px',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                {feedback.message}
              </p>
              {feedback.details && (
                <p style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  marginBottom: '20px'
                }}>
                  {feedback.details}
                </p>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                marginTop: '20px'
              }}>
                <button
                  onClick={handleRetry}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Try Again
                </button>
                <Link
                  href="/chart-exam"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  Next Exam
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Drawing Stats */}
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
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
            <span style={{ fontWeight: 'bold', color: drawings.length >= examConfig.minDrawings ? '#4CAF50' : '#FF9800' }}>
              {drawings.length} / {examConfig.minDrawings} required
            </span>
          </div>
          <div>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Status: </span>
            <span style={{
              fontWeight: 'bold',
              color: drawings.length >= examConfig.minDrawings ? '#4CAF50' : '#FF9800'
            }}>
              {drawings.length >= examConfig.minDrawings ? 'Ready to submit' : 'More drawings needed'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <Link
          href="/chart-exam"
          style={{
            padding: '12px 25px',
            backgroundColor: darkMode ? '#333' : '#e0e0e0',
            color: darkMode ? '#e0e0e0' : '#333',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Back to Exam Selection
        </Link>
        
        <button
          onClick={handleSubmit}
          disabled={drawings.length < examConfig.minDrawings || submitted}
          style={{
            padding: '12px 25px',
            backgroundColor: drawings.length >= examConfig.minDrawings ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: drawings.length >= examConfig.minDrawings && !submitted ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            opacity: submitted ? 0.7 : 1
          }}
        >
          {submitted ? 'Submitted' : 'Submit Exam'}
        </button>
      </div>
      
      {/* Add a global style for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChartExam;
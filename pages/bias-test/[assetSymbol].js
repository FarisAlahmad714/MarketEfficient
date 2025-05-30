// pages/bias-test/[assetSymbol].js
import { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import CryptoLoader from '../../components/CryptoLoader';
import { ThemeContext } from '../../contexts/ThemeContext';

// Import CandlestickChart with SSR disabled
const CandlestickChart = dynamic(
  () => import('../../components/charts/CandlestickChart'),
  { ssr: false }
);

// Import VolumeChart with SSR disabled
const VolumeChart = dynamic(
  () => import('../../components/charts/VolumeChart'),
  { 
    ssr: false,
    loading: ({ height }) => (
      <div style={{ 
        height: height || '120px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        color: '#888',
        fontSize: '14px',
        borderRadius: '4px'
      }}>
        Loading volume data...
      </div>
    )
  }
);

export default function AssetTestPage() {
  const router = useRouter();
  const { assetSymbol, timeframe } = router.query;
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasoningInputs, setReasoningInputs] = useState({}); // Store reasoning inputs
  const [validationError, setValidationError] = useState(""); // For validation messages
  const [showVolume, setShowVolume] = useState(true); // State to toggle volume display
  const cryptoLoaderRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  // Helper function to format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper functions for volume display
  const getVolumeTimeframeLabel = (timeframe) => {
    switch(timeframe) {
      case '4h': return 'Volume(4h)';
      case 'daily': return 'Volume(1d)';
      case 'weekly': return 'Volume(1w)';
      case 'monthly': return 'Volume(1m)';
      default: return 'Volume';
    }
  };

  const getVolumeTooltip = (timeframe) => {
    switch(timeframe) {
      case '4h': return 'Trading volume during this 4-hour period';
      case 'daily': return 'Trading volume for this 24-hour period';
      case 'weekly': return 'Total trading volume for this week';
      case 'monthly': return 'Total trading volume for this month';
      default: return 'Trading volume for this period';
    }
  };

  useEffect(() => {
    // Add FontAwesome script if it's not already present
    if (!document.querySelector('#fontawesome-script')) {
      const script = document.createElement('script');
      script.id = 'fontawesome-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js';
      script.integrity = 'sha512-Tn2m0TIpgVyTzzvmxLNuqbSJH3JP8jm+Cy3hvHrW7ndTDcJ1w5mBiksqDBb8GpE2ksktFvDB/ykZ0mDpsZj20w==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!assetSymbol || !timeframe) {
      return;
    }

    const fetchTestData = async () => {
      try {
        setLoading(true);
        setChartsLoading(true);
        const response = await axios.get(`/api/test/${assetSymbol}?timeframe=${timeframe}`);
        setTestData(response.data);
        // Initialize userAnswers and reasoningInputs with empty values
        const initialAnswers = {};
        const initialReasoning = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
          initialReasoning[q.id] = '';
        });
        setUserAnswers(initialAnswers);
        setReasoningInputs(initialReasoning);
        setLoading(false);
        
        // Set a small timeout to simulate charts loading
        // This allows the CryptoLoader to display properly
        setTimeout(() => {
          setChartsLoading(false);
          if (cryptoLoaderRef.current) {
            cryptoLoaderRef.current.hideLoader();
          }
        }, 1500);
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError('Failed to load test data. Please try again later.');
        setLoading(false);
        setChartsLoading(false);
      }
    };

    fetchTestData();
  }, [assetSymbol, timeframe]);

  const handleAnswerSelect = (questionId, prediction) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: prediction
    }));
  };

  // Handle reasoning input changes
  const handleReasoningChange = (questionId, reasoning) => {
    setReasoningInputs(prev => ({
      ...prev,
      [questionId]: reasoning
    }));
  };

  // Toggle volume display
  const toggleVolumeDisplay = () => {
    setShowVolume(!showVolume);
  };

  // Validate all answers before submission
  const validateAnswers = () => {
    let isValid = true;
    let message = "";

    // Check if all questions have been answered with predictions
    for (const questionId in userAnswers) {
      if (!userAnswers[questionId]) {
        isValid = false;
        message = "Please answer all questions with Bullish or Bearish.";
        break;
      }
    }

    // If predictions are valid, check if all have reasoning
    if (isValid) {
      for (const questionId in reasoningInputs) {
        if (!reasoningInputs[questionId].trim()) {
          isValid = false;
          message = "Please provide reasoning for all your predictions.";
          break;
        }
      }
    }

    setValidationError(message);
    return isValid;
  };

  const handleSubmitTest = async () => {
    // Validate answers and reasoning
    if (!validateAnswers()) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
  
    setIsSubmitting(true);
    
    if (typeof window !== 'undefined' && window.showGlobalLoader) {
      window.showGlobalLoader();
    }
    
    try {
      // Format answers data
      const formattedAnswers = Object.keys(userAnswers).map(testId => ({
        test_id: parseInt(testId, 10),
        prediction: userAnswers[testId],
        reasoning: reasoningInputs[testId]
      }));
      
      // Get auth token from localStorage - JUST LIKE CHARTING EXAM
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.post(`/api/test/${assetSymbol}?session_id=${testData.session_id}`, {
        answers: formattedAnswers,
        chartData: testData.questions.reduce((acc, q) => {
          acc[q.id] = q.ohlc_data;
          return acc;
        }, {})
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/results/${assetSymbol}?session_id=${testData.session_id}`);
    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit test. Please try again.');
      
      setIsSubmitting(false);
      if (typeof window !== 'undefined' && window.hideGlobalLoader) {
        window.hideGlobalLoader();
      }
    }
  };

  // During initial loading, show crypto loader
  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <CryptoLoader 
          ref={cryptoLoaderRef} 
          message="Loading your test data..." 
          height="400px" 
          minDisplayTime={1500} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: darkMode ? '#3a181a' : '#ffebee', padding: '20px', borderRadius: '8px', color: darkMode ? '#ff8a80' : '#d32f2f' }}>
          <p>{error}</p>
          <Link
            href="/bias-test"
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
            Back to Asset Selection
          </Link>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: darkMode ? '#332d10' : '#fff9c4', padding: '20px', borderRadius: '8px', color: darkMode ? '#ffee58' : '#f57f17' }}>
          <p>Test data not available. Please return to the asset selection page.</p>
          <Link
            href="/bias-test"
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
            Back to Asset Selection
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to safely get the last candle data
  const getLastCandle = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    return data[data.length - 1];
  };

  // Check if any data has volume information
  const hasAnyVolumeData = testData.questions.some(question => 
    question.ohlc_data && 
    question.ohlc_data.some(candle => candle.volume > 0)
  );

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px', 
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: darkMode ? '#e0e0e0' : 'inherit'
      }}>
        {testData.asset_name} Bias Test - {testData.selected_timeframe.toUpperCase()} Timeframe
      </h1>
      
      <div style={{ 
        backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ 
          textAlign: 'center', 
          fontWeight: 'bold', 
          fontSize: '18px', 
          marginBottom: '10px',
          color: darkMode ? '#e0e0e0' : '#333'
        }}>
          Instructions
        </p>
        <p style={{ 
          textAlign: 'center',
          color: darkMode ? '#b0b0b0' : '#555'
        }}>
          For each chart below, analyze the price pattern and predict if the market will be Bullish or Bearish after the last candle shown.
          Provide your reasoning for each prediction. After submitting, you'll receive an AI analysis of your trading decisions.
        </p>
        
        {/* Volume Toggle Button - only show if we have volume data */}
        {hasAnyVolumeData && (
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              onClick={toggleVolumeDisplay}
              style={{
                padding: '8px 16px',
                backgroundColor: darkMode ? '#333' : '#e0e0e0',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className={`fas ${showVolume ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
              {showVolume ? 'Hide Volume' : 'Show Volume'}
            </button>
          </div>
        )}
      </div>
      
      {/* Validation Error Message */}
      {validationError && (
        <div style={{ 
          backgroundColor: darkMode ? '#3f1f1f' : '#ffebee', 
          color: darkMode ? '#ff8a80' : '#c62828', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          textAlign: 'center', 
          fontWeight: '500' 
        }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
          {validationError}
        </div>
      )}
      
      {testData.questions.map((question, index) => {
        const lastCandle = getLastCandle(question.ohlc_data);
        // Check if this question has volume data
        const hasVolumeData = question.ohlc_data && question.ohlc_data.some(candle => candle.volume > 0);
        
        return (
          <div key={question.id} style={{ 
            backgroundColor: darkMode ? '#262626' : 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)', 
            marginBottom: '30px' 
          }}>
            <h2 style={{ 
              marginBottom: '20px',
              color: darkMode ? '#e0e0e0' : '#333',
              borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`,
              paddingBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Chart {index + 1}</span>
              {hasVolumeData && (
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'normal',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#333' : '#f0f0f0',
                  color: showVolume ? (darkMode ? '#81c784' : '#4caf50') : (darkMode ? '#bbbbbb' : '#888888')
                }}>
                  <i className={`fas fa-chart-bar`} style={{ marginRight: '5px' }}></i>
                  Volume: {showVolume ? 'Visible' : 'Hidden'}
                </span>
              )}
            </h2>
            
            <div style={{ 
              marginBottom: '20px', 
              position: 'relative'
            }}>
              {chartsLoading ? (
                <CryptoLoader 
                  ref={cryptoLoaderRef} 
                  message="Loading chart data..." 
                  height="400px" 
                  minDisplayTime={1000} 
                />
              ) : (
                question.ohlc_data && question.ohlc_data.length > 0 ? (
                  <>
                    {/* Add ID to chart container for possible screenshot capture */}
                    <div id={`chart-${question.id}`}>
                      {/* Main price chart */}
                      <CandlestickChart 
                        data={question.ohlc_data} 
                        height={400} 
                      />
                      
                      {/* Separate volume chart */}
                      {showVolume && hasVolumeData && (
                        <VolumeChart 
                          data={question.ohlc_data} 
                          height={120} 
                        />
                      )}
                    </div>
                    
                    {/* Last Candle OHLC Data with volume */}
                    {lastCandle && (
                      <div style={{ 
                        marginTop: '15px',
                        backgroundColor: darkMode ? '#1a2e1a' : '#e8f5e9',
                        padding: '15px',
                        borderRadius: '8px',
                        border: `1px solid ${darkMode ? '#265426' : '#c8e6c9'}`
                      }}>
                        <p style={{ 
                          fontWeight: 'bold', 
                          marginBottom: '10px',
                          color: darkMode ? '#81c784' : '#2e7d32'
                        }}>
                          Last Candle Data ({formatDate(lastCandle.date)}):
                        </p>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                          gap: '10px'
                        }}>
                          <div style={{ 
                            backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px',
                            color: darkMode ? '#e0e0e0' : 'inherit'
                          }}>
                            <strong>Open:</strong> {lastCandle.open.toFixed(2)}
                          </div>
                          <div style={{ 
                            backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px',
                            color: darkMode ? '#e0e0e0' : 'inherit'
                          }}>
                            <strong>High:</strong> {lastCandle.high.toFixed(2)}
                          </div>
                          <div style={{ 
                            backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px',
                            color: darkMode ? '#e0e0e0' : 'inherit'
                          }}>
                            <strong>Low:</strong> {lastCandle.low.toFixed(2)}
                          </div>
                          <div style={{ 
                            backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px',
                            color: darkMode ? '#e0e0e0' : 'inherit'
                          }}>
                            <strong>Close:</strong> {lastCandle.close.toFixed(2)}
                          </div>
                          {lastCandle.volume > 0 && (
                            <div 
                              style={{ 
                                backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                padding: '8px', 
                                borderRadius: '4px',
                                color: darkMode ? '#e0e0e0' : 'inherit',
                                position: 'relative',
                                cursor: 'help'
                              }}
                              title={getVolumeTooltip(question.timeframe)}
                            >
                              <strong>{getVolumeTimeframeLabel(question.timeframe)}:</strong> {lastCandle.volume.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    height: '400px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: darkMode ? '#888' : '#666',
                    backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    No chart data available
                  </div>
                )
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              gap: '15px', 
              marginTop: '20px'
            }}>
              <button
                onClick={() => handleAnswerSelect(question.id, 'Bullish')}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: userAnswers[question.id] === 'Bullish' 
                    ? '#4CAF50' 
                    : (darkMode ? '#333' : '#f5f5f5'),
                  color: userAnswers[question.id] === 'Bullish' 
                    ? 'white' 
                    : (darkMode ? '#e0e0e0' : '#333'),
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-chart-line" style={{ marginRight: '8px' }}></i>
                Bullish
              </button>
              
              <button
                onClick={() => handleAnswerSelect(question.id, 'Bearish')}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: userAnswers[question.id] === 'Bearish' 
                    ? '#F44336' 
                    : (darkMode ? '#333' : '#f5f5f5'),
                  color: userAnswers[question.id] === 'Bearish' 
                    ? 'white' 
                    : (darkMode ? '#e0e0e0' : '#333'),
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-chart-line fa-flip-vertical" style={{ marginRight: '8px' }}></i>
                Bearish
              </button>
            </div>
            
            {/* Add reasoning input after making a prediction */}
            {userAnswers[question.id] && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  marginBottom: '10px',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}>
                  Why do you think the market will be {userAnswers[question.id]}?
                </h3>
                
                <textarea
                  value={reasoningInputs[question.id]}
                  onChange={(e) => handleReasoningChange(question.id, e.target.value)}
                  placeholder="Explain your analysis and reasoning..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    backgroundColor: darkMode ? '#333' : 'white',
                    color: darkMode ? '#e0e0e0' : '#333',
                    height: '100px',
                    resize: 'vertical',
                    marginBottom: '10px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                />
                
                {/* Small hint for users */}
                <p style={{ 
                  fontSize: '12px', 
                  color: darkMode ? '#999' : '#666',
                  marginTop: '5px'
                }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                  Your reasoning will be analyzed by AI after submission to help improve your trading skills.
                </p>
              </div>
            )}
          </div>
        );
      })}
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <button
          onClick={handleSubmitTest}
          disabled={isSubmitting}
          style={{
            padding: '15px 40px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isSubmitting ? 'default' : 'pointer',
            fontWeight: 'bold',
            fontSize: '18px',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answers & Get Analysis'}
        </button>
      </div>
    </div>
  );
}
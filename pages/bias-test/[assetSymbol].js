// pages/bias-test/[assetSymbol].js
import { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import LoadingScreen from '../../components/LoadingScreen';
import CryptoLoader from '../../components/CryptoLoader';
import { ThemeContext } from '../../contexts/ThemeContext';
import TradingAnalysis from '../../components/TradingAnalysis'; // Import the TradingAnalysis component

// Import CandlestickChart with SSR disabled
const CandlestickChart = dynamic(
  () => import('../../components/charts/CandlestickChart'),
  { ssr: false }
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
  const cryptoLoaderRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

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
        // Initialize userAnswers with empty values
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setUserAnswers(initialAnswers);
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

  const handleSubmitTest = async () => {
    // Show loader
    setIsSubmitting(true);
    
    // Use the global method if it exists
    if (typeof window !== 'undefined' && window.showGlobalLoader) {
      window.showGlobalLoader();
    }
    
    try {
      // Format the answers data from the userAnswers state
      const formattedAnswers = Object.entries(userAnswers).map(([testId, prediction]) => ({
        test_id: parseInt(testId, 10),
        prediction: prediction
      }));
      
      const response = await axios.post(`/api/test/${assetSymbol}?session_id=${testData.session_id}`, formattedAnswers);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to results
      router.push(`/results/${assetSymbol}?session_id=${testData.session_id}`);
    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit test. Please try again.');
      
      // Hide loader
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
        </p>
      </div>
      
      {testData.questions.map((question, index) => {
        const lastCandle = getLastCandle(question.ohlc_data);
        
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
              paddingBottom: '10px'
            }}>
              Chart {index + 1}
            </h2>
            
            <div style={{ 
              marginBottom: '20px', 
              position: 'relative', 
              minHeight: '400px'
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
                    {/* Add ID to chart container for screenshot capture */}
                    <div id={`chart-${question.id}`}>
                      <CandlestickChart data={question.ohlc_data} height={400} />
                    </div>
                    
                    {/* Last Candle OHLC Data */}
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
                          Last Candle OHLC Data:
                        </p>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
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
            
            {/* Add Trading Analysis Component - only shows after user makes a selection */}
            {userAnswers[question.id] && (
              <TradingAnalysis 
                chartData={question.ohlc_data}
                prediction={userAnswers[question.id]}
                questionId={question.id}
              />
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
          {isSubmitting ? 'Submitting...' : 'Submit Answers'}
        </button>
      </div>
    </div>
  );
}
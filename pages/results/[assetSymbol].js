// pages/results/[assetSymbol].js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';

// Import CandlestickChart with SSR disabled
const CandlestickChart = dynamic(
  () => import('../../components/charts/CandlestickChart'),
  { ssr: false }
);

const Results = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const { assetSymbol, session_id } = router.query;
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;
    
    // Log router query params
    console.log("Router query parameters:", router.query);
    
    // Check if we have required parameters
    if (!assetSymbol || !session_id) {
      console.warn("Missing required parameters:", { assetSymbol, session_id });
      setDebugInfo({ 
        message: "Missing required parameters",
        assetSymbol, 
        session_id,
        routerQuery: router.query
      });
      setLoading(false);
      return;
    }
    
    const fetchResults = async () => {
      try {
        console.log(`Fetching results for ${assetSymbol} with session ${session_id}`);
        
        // Make the API request
        const response = await axios.get(`/api/test/${assetSymbol}?session_id=${session_id}`);
        console.log('Raw API response:', response);
        
        if (!response.data || Object.keys(response.data).length === 0) {
          setError('No results data found for this session');
          setDebugInfo({
            message: "Empty response data",
            status: response.status,
            statusText: response.statusText
          });
          return;
        }
        
        console.log('Results data:', response.data);
        setResults(response.data);
        
        // Check if answers array exists
        if (!Array.isArray(response.data.answers) || response.data.answers.length === 0) {
          console.warn("No answers found in results data");
          setDebugInfo({
            message: "No answers in results data",
            resultsKeys: Object.keys(response.data)
          });
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        setError(`Failed to load results: ${err.message}`);
        setDebugInfo({
          message: "API request failed",
          error: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          responseData: err.response?.data
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [router.isReady, assetSymbol, session_id, router.query]);

  const handleTakeAnotherTest = () => {
    // Force a new test by using a random query parameter
    router.push(`/bias-test/${assetSymbol}?timeframe=daily&random=${Math.random()}`);
  };

  // Show fancy crypto loader while loading
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <CryptoLoader message="Loading your test results..." />
      </div>
    );
  }

  // Show debug info if available (in development)
  if (debugInfo && process.env.NODE_ENV !== 'production') {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px',
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
        color: darkMode ? '#e0e0e0' : '#333',
        borderRadius: '8px'
      }}>
        <h2>Debug Information</h2>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          overflowX: 'auto', 
          padding: '15px',
          backgroundColor: darkMode ? '#121212' : '#fff',
          color: darkMode ? '#e0e0e0' : '#333',
          borderRadius: '4px'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        
        <div style={{ marginTop: '20px' }}>
          <Link
            href="/bias-test"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Back to Asset Selection
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          backgroundColor: darkMode ? '#3a181a' : '#ffebee', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ff8a80' : '#d32f2f' 
        }}>
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

  if (!results) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          backgroundColor: darkMode ? '#332d10' : '#fff9c4', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ffee58' : '#f57f17' 
        }}>
          <p>No results found for this session.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            Session ID: {session_id || 'Not available'}
          </p>
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

  // Check if answers array exists and has items
  const hasAnswers = Array.isArray(results.answers) && results.answers.length > 0;
  const score = results.score || 0;
  const total = results.total || 0;
  
  // Helper function to format dates for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper function to get the percentage change between setup and outcome
  const getPercentageChange = (setupData, outcomeData) => {
    if (!setupData || !setupData.length || !outcomeData || !outcomeData.length) {
      return { value: 0, isPositive: false };
    }
    
    const setupClose = setupData[setupData.length - 1].close;
    const outcomeClose = outcomeData[outcomeData.length - 1].close;
    const percentChange = ((outcomeClose - setupClose) / setupClose) * 100;
    
    return {
      value: Math.abs(percentChange.toFixed(2)),
      isPositive: percentChange >= 0
    };
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: darkMode ? '#e0e0e0' : 'inherit'
      }}>
        {results.asset_name} Bias Test Results
      </h1>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            fontSize: '18px', 
            marginBottom: '10px',
            color: darkMode ? '#b0b0b0' : 'inherit'
          }}>Your score:</p>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold',
            color: '#2196F3'
          }}>
            {score} / {total}
          </div>
          <div style={{ 
            backgroundColor: darkMode ? '#0d47a1' : '#e3f2fd', 
            padding: '5px 15px', 
            borderRadius: '20px',
            display: 'inline-block',
            marginTop: '10px',
            color: darkMode ? '#90caf9' : '#0d47a1'
          }}>
            {total > 0 ? Math.round((score / total) * 100) : 0}%
          </div>
        </div>
      </div>
      
      {hasAnswers ? (
        <>
          <h2 style={{ 
            borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, 
            paddingBottom: '10px', 
            marginBottom: '20px',
            color: darkMode ? '#e0e0e0' : 'inherit'
          }}>
            Review Your Answers
          </h2>
          
          {results.answers.map((answer, index) => {
            const change = getPercentageChange(answer.ohlc_data, answer.outcome_data);
            
            // Get the last candle date from setup data
            const lastSetupCandleDate = answer.ohlc_data && answer.ohlc_data.length > 0 ? 
              formatDate(answer.ohlc_data[answer.ohlc_data.length - 1].date) : 'N/A';
            
            // Get the first outcome candle date
            const firstOutcomeCandleDate = answer.outcome_data && answer.outcome_data.length > 0 ? 
              formatDate(answer.outcome_data[0].date) : 'N/A';
            
            // Get the last setup candle OHLC data
            const lastSetupCandle = answer.ohlc_data && answer.ohlc_data.length > 0 ? 
              answer.ohlc_data[answer.ohlc_data.length - 1] : null;
            
            // Get the first outcome candle OHLC data
            const firstOutcomeCandle = answer.outcome_data && answer.outcome_data.length > 0 ? 
              answer.outcome_data[0] : null;
            
            return (
              <div 
                key={answer.test_id || index} 
                style={{ 
                  marginBottom: '30px',
                  backgroundColor: darkMode
                    ? (answer.is_correct ? '#1b3620' : '#3a181a')
                    : (answer.is_correct ? '#e8f5e9' : '#ffebee'),
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: darkMode 
                    ? '0 2px 8px rgba(0,0,0,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: answer.is_correct 
                    ? '5px solid #4CAF50' 
                    : '5px solid #F44336',
                  transition: 'all 0.3s ease'
                }}
              >
                <h3 style={{ 
                  marginBottom: '15px',
                  color: darkMode ? '#e0e0e0' : 'inherit'
                }}>
                  Question {index + 1}
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 'normal', 
                    color: darkMode ? '#b0b0b0' : '#666', 
                    marginLeft: '10px' 
                  }}>
                    - {answer.timeframe || 'Unknown'} Timeframe
                  </span>
                </h3>
                
                {/* Rest of your answer rendering code with dark mode support */}
                {/* ... */}
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ 
          backgroundColor: darkMode ? '#332d10' : '#fff9c4', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ffee58' : '#f57f17',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <p>Detailed results are not available for this test session.</p>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
        <button 
          onClick={handleTakeAnotherTest}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Take Another Test
        </button>
        <Link 
          href="/bias-test"
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Back to Asset Selection
        </Link>
      </div>
    </div>
  );
};

export default Results;
// pages/results/[assetSymbol].js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';
import TrackedPage from '../../components/TrackedPage';
import logger from '../../lib/logger'; // Adjust path to your logger utility
// Import CandlestickChart with SSR disabled
const CandlestickChart = dynamic(
  () => import('../../components/charts/CandlestickChart'),
  { ssr: false }
);

const Results = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [hasLoadedResults, setHasLoadedResults] = useState(false); // State to prevent refetching

  useEffect(() => {
    // Wait for router to be ready and prevent duplicate fetches
    if (!router.isReady || hasLoadedResults) return;
    
    const { assetSymbol, session_id } = router.query;
    
    // Log router query params
    logger.log("Router query parameters:", router.query);
    
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
        logger.log(`Fetching results for ${assetSymbol} with session ${session_id}`);
        
        // First try to get results from in-memory session
        let response = await axios.get(`/api/test/${assetSymbol}?session_id=${session_id}`);
        
        // If session data exists and has answers, use it
        if (response.data && response.data.answers && response.data.answers.length > 0) {
          logger.log('Results found in memory session');
          setResults(response.data);
          setHasLoadedResults(true); 
          setLoading(false);
          return;
        }
        
        // If memory session failed or has incomplete data, try database
        logger.log('Memory session had incomplete or no data, trying database...');
        
        // First check if database has results using check-results endpoint
        const checkResponse = await axios.get(`/api/bias-test/check-results?session_id=${session_id}`);
        
        if (checkResponse.data && checkResponse.data.ready) {
          logger.log('Database has results, retrieving full data');
          
          try {
            // Request full results from database via the test endpoint with source=db parameter
            const dbResponse = await axios.get(`/api/test/${assetSymbol}?session_id=${session_id}&source=db`);
            
            if (dbResponse.data && dbResponse.data.answers) {
              logger.log('Successfully retrieved results from database');
              setResults(dbResponse.data);
              setHasLoadedResults(true);
              setLoading(false);
              return;
            }
          } catch (dbError) {
            console.error('Error fetching from database via test endpoint:', dbError);
            
            // If the test endpoint with db source fails, try our dedicated get-results endpoint
            try {
              const directDbResponse = await axios.get(`/api/bias-test/get-results?session_id=${session_id}`);
              
              if (directDbResponse.data) {
                logger.log('Successfully retrieved results from direct database endpoint');
                setResults(directDbResponse.data);
                setHasLoadedResults(true);
                setLoading(false);
                return;
              }
            } catch (directDbError) {
              console.error('Error fetching from direct database endpoint:', directDbError);
              // Continue to error handling below
            }
          }
        }
        
        // If we reach here, neither source had complete data
        setError('Could not retrieve complete test results. Try taking the test again.');
        setDebugInfo({
          message: "No complete results found in any source",
          session_check: Boolean(response.data),
          db_check: Boolean(checkResponse?.data?.ready),
          session_id
        });
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
  }, [router.isReady, router.query, hasLoadedResults]);

  // Debug logging for AI analysis
  useEffect(() => {
    if (results && results.answers && results.answers.length > 0) {
      // Check if any answers have AI analysis
      const hasAiAnalysis = results.answers.some(answer => answer.ai_analysis);
      logger.log('Has AI analysis:', hasAiAnalysis);
      
      // Log the first answer structure 
      logger.log('First answer structure:', results.answers[0]);
      
      // Log all properties of each answer for debugging
      results.answers.forEach((answer, index) => {
        logger.log(`Answer ${index + 1} properties:`, Object.keys(answer));
        logger.log(`Answer ${index + 1} has ai_analysis:`, Boolean(answer.ai_analysis));
        if (answer.ai_analysis) {
          // Check if AI analysis has HTML structure
          const hasHtml = answer.ai_analysis.includes('<h3>') || 
                         answer.ai_analysis.includes('<p>') || 
                         answer.ai_analysis.includes('<ul>');
          logger.log(`Answer ${index + 1} has HTML formatting:`, hasHtml);
        }
      });
    }
  }, [results]);

  const handleTakeAnotherTest = () => {
    // Clear the loaded state before taking a new test
    setHasLoadedResults(false);
    
    const { assetSymbol } = router.query;
    // Force a new test by using a random query parameter
    // Include timeframe parameter to ensure proper test generation
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
            Session ID: {router.query.session_id || 'Not available'}
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
      // Format as: "Jan 5, 2024 at 3:30 PM"
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper function to safely get percentage change between setup and outcome
  const getPercentageChange = (setupData, outcomeData) => {
    try {
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
    } catch (error) {
      console.error('Error calculating percentage change:', error);
      return { value: 0, isPositive: false };
    }
  };

  return (
    <TrackedPage>
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px', 
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: darkMode ? '#e0e0e0' : 'inherit'
      }}>
        {results.asset_name} Bias Test Results
      </h1>
      
      {/* Source indicator for debugging */}
      {results.source && (
        <div style={{
          textAlign: 'center',
          marginBottom: '10px',
          backgroundColor: darkMode ? '#2c4f4f' : '#e0f7fa',
          padding: '5px 10px',
          borderRadius: '4px',
          display: 'inline-block',
          fontSize: '14px',
          color: darkMode ? '#80deea' : '#006064'
        }}>
          Results from: {results.source}
        </div>
      )}
      
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
            // Safely handle potential missing data
            const ohlcData = Array.isArray(answer.ohlc_data) ? answer.ohlc_data : [];
            const outcomeData = Array.isArray(answer.outcome_data) ? answer.outcome_data : [];
            
            const change = getPercentageChange(ohlcData, outcomeData);
            
            // Safely get the last candle date from setup data
            const lastSetupCandleDate = ohlcData.length > 0 ? 
              formatDate(ohlcData[ohlcData.length - 1].date) : 'N/A';
            
            // Safely get the first outcome candle date
            const firstOutcomeCandleDate = outcomeData.length > 0 ? 
              formatDate(outcomeData[0].date) : 'N/A';
            
            // Safely get the last setup candle OHLC data
            const lastSetupCandle = ohlcData.length > 0 ? 
              ohlcData[ohlcData.length - 1] : null;
            
            // Safely get the first outcome candle OHLC data
            const firstOutcomeCandle = outcomeData.length > 0 ? 
              outcomeData[0] : null;
            
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
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  {/* Setup Chart with last candle date and data */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '10px', 
                      borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, 
                      paddingBottom: '5px',
                      color: darkMode ? '#e0e0e0' : 'inherit'
                    }}>
                      Setup Chart
                    </h4>
                    <div style={{ 
                      backgroundColor: darkMode ? '#262626' : '#fff', 
                      padding: '15px', 
                      borderRadius: '8px'
                    }}>
                      {ohlcData.length > 0 ? (
                        <>
                          <CandlestickChart data={ohlcData} height={250} />
                          <div style={{ 
                            textAlign: 'center', 
                            fontWeight: 'bold',
                            backgroundColor: darkMode ? '#1a2e1a' : '#e8f5e9', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '10px',
                            border: `1px solid ${darkMode ? '#265426' : '#c8e6c9'}`,
                            color: darkMode ? '#81c784' : 'inherit'
                          }}>
                            Last Candle Date: {lastSetupCandleDate}
                          </div>
                          
                          {/* Last Setup Candle OHLC Data */}
                          {lastSetupCandle && (
                            <div style={{ marginTop: '15px' }}>
                              <p style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                fontSize: '14px',
                                color: darkMode ? '#e0e0e0' : 'inherit'
                              }}>
                                Last Candle OHLC Data:
                              </p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>Open:</strong> {lastSetupCandle.open.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>High:</strong> {lastSetupCandle.high.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>Low:</strong> {lastSetupCandle.low.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>Close:</strong> {lastSetupCandle.close.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ 
                          height: '250px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: darkMode ? '#b0b0b0' : '#666',
                          flexDirection: 'column'
                        }}>
                          <div style={{ marginBottom: '10px' }}>Chart data not available</div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: darkMode ? '#999' : '#888',
                            maxWidth: '200px',
                            textAlign: 'center' 
                          }}>
                            (Results from database may not include chart data)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Outcome Chart with first candle date and data */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '10px', 
                      borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, 
                      paddingBottom: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: darkMode ? '#e0e0e0' : 'inherit'
                    }}>
                      <span>Outcome Chart</span>
                      {outcomeData.length > 0 && (
                        <span style={{
                          backgroundColor: change.isPositive 
                            ? (darkMode ? '#1a2e1a' : '#e8f5e9') 
                            : (darkMode ? '#3a181a' : '#ffebee'),
                          color: change.isPositive 
                            ? (darkMode ? '#81c784' : '#388e3c') 
                            : (darkMode ? '#ef9a9a' : '#d32f2f'),
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {change.isPositive ? '+' : '-'}{change.value}%
                        </span>
                      )}
                    </h4>
                    <div style={{ 
                      backgroundColor: darkMode ? '#262626' : '#fff', 
                      padding: '15px', 
                      borderRadius: '8px'
                    }}>
                      {outcomeData.length > 0 ? (
                        <>
                          <CandlestickChart data={outcomeData} height={250} />
                          <div style={{ 
                            textAlign: 'center', 
                            fontWeight: 'bold',
                            backgroundColor: darkMode ? '#4d3308' : '#fff3e0', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '10px',
                            border: `1px solid ${darkMode ? '#855600' : '#ffe0b2'}`,
                            color: darkMode ? '#ffcc80' : 'inherit'
                          }}>
                            First Outcome Candle Date: {firstOutcomeCandleDate}
                          </div>
                          
                          {/* First Outcome Candle OHLC Data */}
                          {firstOutcomeCandle && (
                            <div style={{ marginTop: '15px' }}>
                              <p style={{ 
                                fontWeight: 'bold', 
                                marginBottom: '8px', 
                                fontSize: '14px',
                                color: darkMode ? '#e0e0e0' : 'inherit'
                              }}>
                                First Outcome Candle OHLC Data:
                              </p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>Open:</strong> {firstOutcomeCandle.open.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>High:</strong> {firstOutcomeCandle.high.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>Low:</strong> {firstOutcomeCandle.low.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  <strong>Close:</strong> {firstOutcomeCandle.close.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ 
                          height: '250px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: darkMode ? '#b0b0b0' : '#666',
                          flexDirection: 'column'
                        }}>
                          <div style={{ marginBottom: '10px' }}>Outcome data not available</div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: darkMode ? '#999' : '#888',
                            maxWidth: '200px',
                            textAlign: 'center' 
                          }}>
                            (Results from database may not include chart data)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: darkMode ? '#262626' : '#fff', 
                  padding: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    flexWrap: 'wrap', 
                    gap: '10px'
                  }}>
                    <p>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: darkMode ? '#e0e0e0' : 'inherit'
                      }}>Your Prediction:</span> 
                      <span style={{ 
                        display: 'inline-block',
                        marginLeft: '5px',
                        padding: '3px 10px',
                        backgroundColor: answer.user_prediction === 'Bullish' 
                          ? (darkMode ? '#1a2e1a' : '#e8f5e9') 
                          : (darkMode ? '#3a181a' : '#ffebee'),
                        borderRadius: '4px',
                        color: answer.user_prediction === 'Bullish' 
                          ? (darkMode ? '#81c784' : '#388e3c') 
                          : (darkMode ? '#ef9a9a' : '#d32f2f')
                      }}>
                        {answer.user_prediction || 'N/A'}
                      </span>
                    </p>
                    <p>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: darkMode ? '#e0e0e0' : 'inherit'
                      }}>Correct Answer:</span>
                      <span style={{ 
                        display: 'inline-block',
                        marginLeft: '5px',
                        padding: '3px 10px',
                        backgroundColor: answer.correct_answer === 'Bullish' 
                          ? (darkMode ? '#1a2e1a' : '#e8f5e9') 
                          : (darkMode ? '#3a181a' : '#ffebee'),
                        borderRadius: '4px',
                        color: answer.correct_answer === 'Bullish' 
                          ? (darkMode ? '#81c784' : '#388e3c') 
                          : (darkMode ? '#ef9a9a' : '#d32f2f')
                      }}>
                        {answer.correct_answer || 'N/A'}
                      </span>
                    </p>
                    <p style={{ 
                      fontWeight: 'bold',
                      color: answer.is_correct 
                        ? (darkMode ? '#81c784' : '#4CAF50') 
                        : (darkMode ? '#ef9a9a' : '#F44336')
                    }}>
                      {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                  </div>
                </div>
                
                {/* Your Reasoning Section */}
                {answer.user_reasoning && (
                  <div style={{ 
                    backgroundColor: darkMode ? '#262626' : '#fff', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginTop: '15px'
                  }}>
                    <h4 style={{ 
                      marginBottom: '10px', 
                      color: darkMode ? '#e0e0e0' : '#333',
                      borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                      paddingBottom: '5px'
                    }}>
                      Your Reasoning
                    </h4>
                    <p style={{ 
                      whiteSpace: 'pre-line', 
                      color: darkMode ? '#b0b0b0' : '#555',
                      padding: '5px'
                    }}>
                      {answer.user_reasoning}
                    </p>
                  </div>
                )}
                
                {/* AI Analysis Section - UPDATED TO RENDER HTML PROPERLY */}
                {(answer.ai_analysis) ? (
                  <div style={{ 
                    backgroundColor: darkMode ? '#0a1929' : '#f0f7ff', 
                    padding: '25px', 
                    borderRadius: '12px',
                    marginTop: '20px',
                    border: `2px solid ${darkMode ? '#1565c0' : '#2196f3'}`,
                    maxWidth: '100%',
                    margin: '20px auto',
                    boxShadow: darkMode 
                      ? '0 4px 20px rgba(21, 101, 192, 0.2)' 
                      : '0 4px 20px rgba(33, 150, 243, 0.1)'
                  }}>
                    <h4 style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '20px', 
                      color: darkMode ? '#90caf9' : '#1976d2',
                      borderBottom: `2px solid ${darkMode ? '#1565c0' : '#90caf9'}`,
                      paddingBottom: '12px',
                      textAlign: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '600'
                    }}>
                      <i className="fas fa-brain" style={{ marginRight: '12px', fontSize: '24px' }}></i>
                      AI Trading Analysis
                    </h4>
                    <div 
                      className="ai-analysis-content"
                      style={{ 
                        color: darkMode ? '#e0e0e0' : '#1a1a1a',
                        lineHeight: '1.8',
                        fontSize: '16px'
                      }}
                      dangerouslySetInnerHTML={{ __html: answer.ai_analysis }}
                    />
                  </div>
                ) : (
                  answer.user_reasoning && (
                    <div style={{ 
                      backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                      padding: '15px', 
                      borderRadius: '8px',
                      marginTop: '15px',
                      fontStyle: 'italic',
                      color: darkMode ? '#999' : '#666',
                      textAlign: 'center'
                    }}>
                      <p>AI analysis unavailable for this prediction.</p>
                    </div>
                  )
                )}
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
      
      {/* Additional styles for AI analysis HTML content */}
      <style jsx global>{`
        .ai-analysis-content h3 {
          color: ${darkMode ? '#90caf9' : '#1565c0'};
          margin-top: 28px;
          margin-bottom: 16px;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid ${darkMode ? '#2a3f5f' : '#e3f2fd'};
        }
        
        .ai-analysis-content h3:first-child {
          margin-top: 0;
        }
        
        .ai-analysis-content p {
          margin-bottom: 16px;
          text-align: justify;
          font-size: 15px;
          line-height: 1.8;
        }
        
        .ai-analysis-content ul {
          padding-left: 24px;
          margin-bottom: 20px;
        }
        
        .ai-analysis-content li {
          margin-bottom: 12px;
          line-height: 1.7;
          list-style-type: none;
          position: relative;
          padding-left: 24px;
        }
        
        .ai-analysis-content li:before {
          content: "▸";
          position: absolute;
          left: 0;
          color: ${darkMode ? '#90caf9' : '#2196f3'};
          font-weight: bold;
          font-size: 16px;
        }
        
        .ai-analysis-content li strong {
          color: ${darkMode ? '#81c784' : '#2e7d32'};
          font-weight: 600;
          display: inline-block;
          margin-right: 8px;
        }
        
        .ai-analysis-content li strong:after {
          content: "";
        }
        
        /* Highlight quoted text */
        .ai-analysis-content p:has(> ""),
        .ai-analysis-content li:has(> "") {
          background-color: ${darkMode ? 'rgba(144, 202, 249, 0.08)' : 'rgba(33, 150, 243, 0.08)'};
          padding: 12px;
          border-left: 3px solid ${darkMode ? '#90caf9' : '#2196f3'};
          border-radius: 4px;
          margin: 12px 0;
        }
        
        /* Style for the key takeaway section */
        .ai-analysis-content h3:last-of-type + p {
          background-color: ${darkMode ? 'rgba(129, 199, 132, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
          padding: 16px;
          border-radius: 8px;
          border: 1px solid ${darkMode ? '#388e3c' : '#81c784'};
          font-weight: 500;
          margin-top: 12px;
        }
      `}</style>
    </div>
    </TrackedPage>
  );
};

export default Results;
// pages/results/[assetSymbol].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import CandlestickChart with SSR disabled
const CandlestickChart = dynamic(
  () => import('../../components/charts/CandlestickChart'),
  { ssr: false }
);

const Results = () => {
  const router = useRouter();
  const { assetSymbol } = router.query;
  const sessionId = router.query.session_id;
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetSymbol || !sessionId) {
      return;
    }
    
    const fetchResults = async () => {
      try {
        console.log(`Fetching results for ${assetSymbol} with session ${sessionId}`);
        const response = await axios.get(`/api/test/${assetSymbol}?session_id=${sessionId}`);
        console.log('Results data:', response.data);
        setResults(response.data);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [assetSymbol, sessionId]);

  const handleTakeAnotherTest = () => {
    // Force a new test by using a random query parameter
    router.push(`/bias-test/${assetSymbol}?random=${Math.random()}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
        Loading results...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', color: '#d32f2f' }}>
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
        <div style={{ backgroundColor: '#fff9c4', padding: '20px', borderRadius: '8px', color: '#f57f17' }}>
          <p>No results found for this session.</p>
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
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>{results.asset_name} Bias Test Results</h1>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>Your score:</p>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold',
            color: '#2196F3'
          }}>
            {score} / {total}
          </div>
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '5px 15px', 
            borderRadius: '20px',
            display: 'inline-block',
            marginTop: '10px',
            color: '#0d47a1'
          }}>
            {total > 0 ? Math.round((score / total) * 100) : 0}%
          </div>
        </div>
      </div>
      
      {hasAnswers ? (
        <>
          <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
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
                  backgroundColor: answer.is_correct ? '#e8f5e9' : '#ffebee',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: answer.is_correct ? '5px solid #4CAF50' : '5px solid #F44336'
                }}
              >
                <h3 style={{ marginBottom: '15px' }}>
                  Question {index + 1}
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 'normal', 
                    color: '#666', 
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
                    <h4 style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                      Setup Chart
                    </h4>
                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px' }}>
                      {answer.ohlc_data && answer.ohlc_data.length > 0 ? (
                        <>
                          <CandlestickChart data={answer.ohlc_data} height={250} />
                          <div style={{ 
                            textAlign: 'center', 
                            fontWeight: 'bold',
                            backgroundColor: '#e8f5e9', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '10px',
                            border: '1px solid #c8e6c9'
                          }}>
                            Last Candle Date: {lastSetupCandleDate}
                          </div>
                          
                          {/* Last Setup Candle OHLC Data */}
                          {lastSetupCandle && (
                            <div style={{ marginTop: '15px' }}>
                              <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                                Last Candle OHLC Data:
                              </p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>Open:</strong> {lastSetupCandle.open.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>High:</strong> {lastSetupCandle.high.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>Low:</strong> {lastSetupCandle.low.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>Close:</strong> {lastSetupCandle.close.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          No chart data available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Outcome Chart with first candle date and data */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '10px', 
                      borderBottom: '1px solid #eee', 
                      paddingBottom: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Outcome Chart</span>
                      <span style={{
                        backgroundColor: change.isPositive ? '#e8f5e9' : '#ffebee',
                        color: change.isPositive ? '#388e3c' : '#d32f2f',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {change.isPositive ? '+' : '-'}{change.value}%
                      </span>
                    </h4>
                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px' }}>
                      {answer.outcome_data && answer.outcome_data.length > 0 ? (
                        <>
                          <CandlestickChart data={answer.outcome_data} height={250} />
                          <div style={{ 
                            textAlign: 'center', 
                            fontWeight: 'bold',
                            backgroundColor: '#fff3e0', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '10px',
                            border: '1px solid #ffe0b2'
                          }}>
                            First Outcome Candle Date: {firstOutcomeCandleDate}
                          </div>
                          
                          {/* First Outcome Candle OHLC Data */}
                          {firstOutcomeCandle && (
                            <div style={{ marginTop: '15px' }}>
                              <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                                First Outcome Candle OHLC Data:
                              </p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>Open:</strong> {firstOutcomeCandle.open.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>High:</strong> {firstOutcomeCandle.high.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>Low:</strong> {firstOutcomeCandle.low.toFixed(2)}
                                </div>
                                <div style={{ 
                                  backgroundColor: '#f5f5f5', 
                                  padding: '6px', 
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}>
                                  <strong>Close:</strong> {firstOutcomeCandle.close.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          No outcome data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <p>
                      <span style={{ fontWeight: 'bold' }}>Your Prediction:</span> 
                      <span style={{ 
                        display: 'inline-block',
                        marginLeft: '5px',
                        padding: '3px 10px',
                        backgroundColor: answer.user_prediction === 'Bullish' ? '#e8f5e9' : '#ffebee',
                        borderRadius: '4px',
                        color: answer.user_prediction === 'Bullish' ? '#388e3c' : '#d32f2f'
                      }}>
                        {answer.user_prediction || 'N/A'}
                      </span>
                    </p>
                    <p>
                      <span style={{ fontWeight: 'bold' }}>Correct Answer:</span>
                      <span style={{ 
                        display: 'inline-block',
                        marginLeft: '5px',
                        padding: '3px 10px',
                        backgroundColor: answer.correct_answer === 'Bullish' ? '#e8f5e9' : '#ffebee',
                        borderRadius: '4px',
                        color: answer.correct_answer === 'Bullish' ? '#388e3c' : '#d32f2f'
                      }}>
                        {answer.correct_answer || 'N/A'}
                      </span>
                    </p>
                    <p style={{ 
                      fontWeight: 'bold',
                      color: answer.is_correct ? '#4CAF50' : '#F44336'
                    }}>
                      {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ 
          backgroundColor: '#fff9c4', 
          padding: '20px', 
          borderRadius: '8px', 
          color: '#f57f17',
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
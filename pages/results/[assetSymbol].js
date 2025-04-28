// pages/results/[assetSymbol].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

export default function ResultsPage() {
  const router = useRouter();
  const { assetSymbol, session_id } = router.query;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch results once assetSymbol and session_id are available
    if (!assetSymbol || !session_id) return;

    const fetchResults = async () => {
      try {
        // In a real implementation, you would call your API to get results
        // For now, we'll use mock data
        const mockResults = {
          asset_name: assetSymbol === 'btc' ? 'Bitcoin' : 
                     assetSymbol === 'eth' ? 'Ethereum' :
                     assetSymbol === 'sol' ? 'Solana' :
                     assetSymbol === 'nvda' ? 'Nvidia' :
                     assetSymbol === 'aapl' ? 'Apple' : 'Random Mix',
          score: 3,
          total: 5,
          answers: [
            {
              test_id: 1,
              user_prediction: 'Bullish',
              correct_answer: 'Bullish',
              is_correct: true,
              date: '2023-09-01',
              timeframe: 'daily',
              ohlc: { open: 40000, high: 41000, low: 39500, close: 40500 },
              outcome_ohlc: { open: 40500, high: 42000, low: 40000, close: 41500 }
            },
            {
              test_id: 2,
              user_prediction: 'Bearish',
              correct_answer: 'Bearish',
              is_correct: true,
              date: '2023-08-31',
              timeframe: 'daily',
              ohlc: { open: 40500, high: 41000, low: 39800, close: 40100 },
              outcome_ohlc: { open: 40100, high: 40300, low: 39000, close: 39200 }
            },
            {
              test_id: 3,
              user_prediction: 'Bullish',
              correct_answer: 'Bearish',
              is_correct: false,
              date: '2023-08-30',
              timeframe: '4h',
              ohlc: { open: 40200, high: 40800, low: 40000, close: 40600 },
              outcome_ohlc: { open: 40600, high: 40700, low: 39900, close: 40000 }
            },
            {
              test_id: 4,
              user_prediction: 'Bearish',
              correct_answer: 'Bullish',
              is_correct: false,
              date: '2023-08-29',
              timeframe: 'weekly',
              ohlc: { open: 39800, high: 40500, low: 39500, close: 40000 },
              outcome_ohlc: { open: 40000, high: 41500, low: 39800, close: 41300 }
            },
            {
              test_id: 5,
              user_prediction: 'Bullish',
              correct_answer: 'Bullish',
              is_correct: true,
              date: '2023-08-28',
              timeframe: 'daily',
              ohlc: { open: 39500, high: 40200, low: 39400, close: 40000 },
              outcome_ohlc: { open: 40000, high: 40500, low: 39800, close: 40400 }
            }
          ]
        };

        setResults(mockResults);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results. Please try again later.');
        setLoading(false);
      }
    };

    fetchResults();
  }, [assetSymbol, session_id]);

  const getTimeframeLabel = (tf) => {
    const labels = {
      '4h': '4-Hour',
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'random': 'Mixed'
    };
    return labels[tf] || 'Unknown';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Loading results...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', color: '#d32f2f' }}>
          <p>{error}</p>
          <Link 
            href="/bias-test" 
            style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', textDecoration: 'none', borderRadius: '4px', marginTop: '10px' }}
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
          <p>No results found. Please try taking the test again.</p>
          <Link 
            href="/bias-test" 
            style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', textDecoration: 'none', borderRadius: '4px', marginTop: '10px' }}
          >
            Back to Asset Selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>{results.asset_name} Bias Test Results</h1>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#e8f5e9', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <p style={{ margin: 0, fontSize: '18px' }}>Your score: {results.score} / {results.total}</p>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: '#ffffff', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          color: '#2e7d32'
        }}>
          {Math.round((results.score / results.total) * 100)}%
        </div>
      </div>

      <h2 style={{ marginBottom: '20px' }}>Review Your Answers</h2>

      {results.answers.map((answer, index) => (
        <div 
          key={answer.test_id} 
          style={{ 
            marginBottom: '30px', 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${answer.is_correct ? '#4caf50' : '#f44336'}`
          }}
        >
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
            Question {index + 1}
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>
              - {getTimeframeLabel(answer.timeframe)} Timeframe
            </span>
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px', 
            marginBottom: '20px' 
          }}>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '15px', 
              textAlign: 'center' 
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Setup Chart:</p>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                [Setup Chart would be displayed here]
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '15px', 
              textAlign: 'center' 
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Outcome Chart:</p>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                [Outcome Chart would be displayed here]
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '15px' 
          }}>
            <p style={{ marginTop: 0, fontWeight: 'bold' }}>Setup OHLC for {new Date(answer.date).toLocaleDateString()}:</p>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Open: {answer.ohlc.open.toFixed(2)}
              </li>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                High: {answer.ohlc.high.toFixed(2)}
              </li>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Low: {answer.ohlc.low.toFixed(2)}
              </li>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Close: {answer.ohlc.close.toFixed(2)}
              </li>
            </ul>
          </div>

          <div style={{ 
            backgroundColor: '#fff8e1', 
            borderLeft: '3px solid #ffc107', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '15px' 
          }}>
            <p style={{ marginTop: 0, fontWeight: 'bold' }}>Outcome OHLC:</p>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Open: {answer.outcome_ohlc.open.toFixed(2)}
              </li>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                High: {answer.outcome_ohlc.high.toFixed(2)}
              </li>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Low: {answer.outcome_ohlc.low.toFixed(2)}
              </li>
              <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Close: {answer.outcome_ohlc.close.toFixed(2)}
              </li>
            </ul>
          </div>

          <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '8px', 
                      marginBottom: '15px' 
                    }}>
                      <p>Your Prediction: <strong>{answer.user_prediction}</strong></p>
                      <p>Correct Answer: <strong>{answer.correct_answer}</strong></p>
                      <p style={{ 
                        marginTop: '10px', 
                        fontWeight: 'bold', 
                        color: answer.is_correct ? '#4caf50' : '#f44336' 
                      }}>
                        {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                      </p>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
                  <Link 
                    href={`/bias-test/${assetSymbol}`} 
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#4CAF50', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '4px', 
                      fontWeight: 'bold' 
                    }}
                  >
                    Take Another Test
                  </Link>

                  <Link 
                    href="/bias-test" 
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#2196F3', 
                      color: 'white', 
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
          }
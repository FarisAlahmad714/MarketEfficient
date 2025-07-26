// pages/bias-test/custom.js
import { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import CryptoLoader from '../../components/CryptoLoader';
import { ThemeContext } from '../../contexts/ThemeContext';
import storage from '../../lib/storage';
import AppModal from '../../components/common/AppModal';
import { useModal } from '../../lib/useModal';
import { filterContent, quickValidate } from '../../lib/contentFilter';

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

export default function CustomDateTestPage() {
  const router = useRouter();
  const { asset, timeframe, date, session_id, mode } = router.query;
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasoningInput, setReasoningInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showVolume, setShowVolume] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState(50);
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeData, setOutcomeData] = useState(null);

  const cryptoLoaderRef = useRef(null);
  const isFetchingRef = useRef(false);
  const { darkMode } = useContext(ThemeContext);
  const { isOpen: modalOpen, modalProps, hideModal, showAlert, showError } = useModal();

  // Fetch custom date test data
  useEffect(() => {
    if (!asset || !timeframe || !date || !session_id) return;

    const fetchCustomTestData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // Call the custom test API endpoint
        const response = await axios.get('/api/test/custom', {
          params: {
            asset,
            timeframe,
            date,
            session_id
          }
        });

        if (response.data.success) {
          setTestData(response.data.data);
          setChartsLoading(false);
        } else {
          throw new Error(response.data.error || 'Failed to fetch test data');
        }
      } catch (err) {
        console.error('Error fetching custom test data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load test data');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchCustomTestData();
  }, [asset, timeframe, date, session_id]);

  const handleSubmit = async () => {
    if (!userAnswer) {
      setValidationError('Please select a prediction');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      // Fetch outcome data
      const response = await axios.post('/api/test/custom-outcome', {
        session_id,
        asset,
        timeframe,
        date,
        prediction: userAnswer,
        reasoning: reasoningInput,
        confidence: confidenceLevel
      });

      if (response.data.success) {
        setOutcomeData(response.data.outcomeData);
        setShowOutcome(true);
        
        // Track the test completion
        if (window.gtag) {
          window.gtag('event', 'custom_date_test_completed', {
            asset,
            timeframe,
            date,
            prediction: userAnswer,
            confidence: confidenceLevel
          });
        }
      } else {
        throw new Error(response.data.error || 'Failed to submit test');
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      showError(err.response?.data?.error || 'Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <CryptoLoader 
        ref={cryptoLoaderRef}
        height="100vh" 
        message="Loading custom date test..." 
      />
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode ? '#121212' : '#f5f7fa',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: darkMode ? '#1e1e1e' : '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#ff4d4d', marginBottom: '20px' }}>Error Loading Test</h2>
          <p style={{ color: darkMode ? '#ccc' : '#666', marginBottom: '30px' }}>{error}</p>
          <Link href="/bias-test" style={{
            padding: '12px 30px',
            backgroundColor: '#00c4ff',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            Back to Asset Selection
          </Link>
        </div>
      </div>
    );
  }

  if (!testData) return null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#121212' : '#f5f7fa',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '40px 20px',
          backgroundColor: darkMode ? '#1e1e1e' : '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '10px',
            color: darkMode ? '#fff' : '#1a1a1a'
          }}>
            Custom Date Analysis
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: darkMode ? '#a0a0a0' : '#666',
            marginBottom: '20px'
          }}>
            {testData.assetName} • {timeframe.toUpperCase()} • {formatDate(date)}
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#00c4ff'
          }}>
            Analyze the setup period and predict the outcome
          </p>
        </div>

        {/* Chart Section */}
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : '#fff',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            marginBottom: '20px',
            color: darkMode ? '#fff' : '#1a1a1a'
          }}>
            Setup Period: {formatDate(testData.setupStart)} - {formatDate(testData.setupEnd)}
          </h3>
          
          {!chartsLoading && testData.setupData && (
            <>
              <CandlestickChart
                data={testData.setupData}
                height={400}
                timeframe={timeframe}
              />
              
              {showVolume && testData.volumeData && (
                <div style={{ marginTop: '20px' }}>
                  <VolumeChart
                    data={testData.volumeData}
                    height={120}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Prediction Section */}
        {!showOutcome && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              marginBottom: '20px',
              color: darkMode ? '#fff' : '#1a1a1a'
            }}>
              What will happen in the outcome period?
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setUserAnswer('bullish')}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: userAnswer === 'bullish' ? '#00ff88' : darkMode ? '#2a2a2a' : '#f0f0f0',
                    color: userAnswer === 'bullish' ? '#000' : darkMode ? '#fff' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: userAnswer === 'bullish' ? 'bold' : 'normal',
                    transition: 'all 0.3s ease'
                  }}
                >
                  📈 Bullish (Price Up)
                </button>
                <button
                  onClick={() => setUserAnswer('bearish')}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: userAnswer === 'bearish' ? '#ff4d4d' : darkMode ? '#2a2a2a' : '#f0f0f0',
                    color: userAnswer === 'bearish' ? '#fff' : darkMode ? '#fff' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: userAnswer === 'bearish' ? 'bold' : 'normal',
                    transition: 'all 0.3s ease'
                  }}
                >
                  📉 Bearish (Price Down)
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Confidence Level: {confidenceLevel}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(e.target.value)}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, #00c4ff 0%, #00c4ff ${confidenceLevel}%, ${darkMode ? '#2a2a2a' : '#e0e0e0'} ${confidenceLevel}%, ${darkMode ? '#2a2a2a' : '#e0e0e0'} 100%)`
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Reasoning (Optional):
                </label>
                <textarea
                  value={reasoningInput}
                  onChange={(e) => setReasoningInput(e.target.value)}
                  placeholder="Explain your prediction..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                    color: darkMode ? '#fff' : '#333',
                    border: `1px solid ${darkMode ? '#3a3a3a' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    resize: 'vertical',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {validationError && (
                <p style={{
                  color: '#ff4d4d',
                  marginBottom: '10px',
                  fontSize: '0.9rem'
                }}>
                  {validationError}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !userAnswer}
                style={{
                  width: '100%',
                  padding: '18px',
                  backgroundColor: userAnswer ? '#00c4ff' : '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: userAnswer ? 'pointer' : 'not-allowed',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {isSubmitting ? 'Revealing Outcome...' : 'Reveal Outcome'}
              </button>
              
              {/* Loading overlay when submitting */}
              {isSubmitting && (
                <CryptoLoader 
                  height="300px" 
                  message="Analyzing outcome period..." 
                  minDisplayTime={1500}
                />
              )}
            </div>
          </div>
        )}

        {/* Outcome Section */}
        {showOutcome && outcomeData && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              marginBottom: '20px',
              color: darkMode ? '#fff' : '#1a1a1a'
            }}>
              Outcome Period Results
            </h3>

            {/* Outcome Chart */}
            {outcomeData.outcomeCandles && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{
                  marginBottom: '15px',
                  color: darkMode ? '#fff' : '#1a1a1a',
                  fontSize: '1.2rem'
                }}>
                  Outcome Period: {formatDate(testData.setupEnd)} - {formatDate(testData.outcomeEnd)}
                </h4>
                <CandlestickChart
                  data={outcomeData.outcomeCandles}
                  height={400}
                  timeframe={timeframe}
                />
              </div>
            )}
            
            <div style={{
              padding: '20px',
              backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{
                fontSize: '1.2rem',
                marginBottom: '10px',
                color: darkMode ? '#fff' : '#333'
              }}>
                Actual Movement: <span style={{
                  color: outcomeData.actualMovement > 0 ? '#00ff88' : '#ff4d4d',
                  fontWeight: 'bold'
                }}>
                  {outcomeData.actualMovement > 0 ? '+' : ''}{outcomeData.actualMovement.toFixed(2)}%
                </span>
              </p>
              <p style={{
                fontSize: '1.1rem',
                color: darkMode ? '#ccc' : '#666'
              }}>
                Your Prediction: <span style={{
                  color: userAnswer === 'bullish' ? '#00ff88' : '#ff4d4d',
                  fontWeight: 'bold'
                }}>
                  {userAnswer === 'bullish' ? 'Bullish' : 'Bearish'}
                </span>
              </p>
              <p style={{
                fontSize: '1.1rem',
                color: darkMode ? '#ccc' : '#666'
              }}>
                Result: <span style={{
                  color: outcomeData.correct ? '#00ff88' : '#ff4d4d',
                  fontWeight: 'bold'
                }}>
                  {outcomeData.correct ? 'Correct!' : 'Incorrect'}
                </span>
              </p>
            </div>

            {outcomeData.aiAnalysis && (
              <div style={{
                padding: '20px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                borderRadius: '8px'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: outcomeData.aiAnalysis }}
                  style={{
                    color: darkMode ? '#ccc' : '#666',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            )}

            <div style={{
              marginTop: '30px',
              display: 'flex',
              gap: '10px'
            }}>
              <Link href="/bias-test" style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#00c4ff',
                color: '#fff',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'block'
              }}>
                Try Another Test
              </Link>
              <button
                onClick={() => router.reload()}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0',
                  color: darkMode ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                Test Different Date
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && <AppModal {...modalProps} />}
    </div>
  );
}
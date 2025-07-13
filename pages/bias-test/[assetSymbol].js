// pages/bias-test/[assetSymbol].js
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
import GuidedTour from '../../components/common/GuidedTour';
import { getTourSteps } from '../../lib/tourSteps';

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
  const { assetSymbol, timeframe, session_id } = router.query;
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsProgress, setNewsProgress] = useState({ completed: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const [isKickedOut, setIsKickedOut] = useState(false);
  const [reasoningInputs, setReasoningInputs] = useState({}); // Store reasoning inputs
  const [validationError, setValidationError] = useState(""); // For validation messages
  const [showVolume, setShowVolume] = useState(true); // State to toggle volume display
  const [questionTimestamps, setQuestionTimestamps] = useState({}); // Track time spent per question
  const [confidenceLevels, setConfidenceLevels] = useState({}); // Track confidence per question
  const [contentWarnings, setContentWarnings] = useState({}); // Track content validation warnings
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  
  // Tour state
  const [showTour, setShowTour] = useState(false);
  const [tourSteps] = useState(getTourSteps('bias-test'));
  
  const cryptoLoaderRef = useRef(null);
  const isFetchingRef = useRef(false); // Prevent duplicate API calls
  const { darkMode } = useContext(ThemeContext);
  const { isOpen: modalOpen, modalProps, hideModal, showAlert, showError } = useModal();

  // Helper function to format dates with timezone information
  const formatDate = (dateString, timeframe, assetSymbol) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const hours = date.getUTCHours();
      
      // Determine if this is crypto or traditional market
      const cryptoSymbols = ['btc', 'eth', 'sol', 'bnb'];
      const isCrypto = cryptoSymbols.includes(assetSymbol?.toLowerCase());
      
      // Determine timezone based on time and asset type
      let timezone = 'EST';
      if (isCrypto) {
        // For crypto: midnight UTC shows as UTC, 4 PM EST shows as EST
        if (hours === 0) {
          timezone = 'UTC';
        } else if (hours === 21) {
          timezone = 'EST';
        } else {
          timezone = 'UTC'; // Default for 4h periods
        }
      } else {
        // For stocks/commodities: always EST
        timezone = 'EST';
      }
      
      const baseFormat = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return `${baseFormat.replace(' at ', ' at ')} ${timezone}`;
    } catch (e) {
      return dateString;
    }
  };


  // Analyze volume profile
  const analyzeVolumeProfile = (ohlcData) => {
    if (!ohlcData || ohlcData.length === 0) return null;
    
    const volumes = ohlcData
      .filter(candle => candle.volume > 0)
      .map(candle => candle.volume);
    
    if (volumes.length === 0) return null;

    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const recentVolumes = volumes.slice(-5); // Last 5 candles
    const earlierVolumes = volumes.slice(0, -5);
    
    let volumeTrend = 'stable';
    if (recentVolumes.length > 0 && earlierVolumes.length > 0) {
      const recentAvg = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
      const earlierAvg = earlierVolumes.reduce((sum, vol) => sum + vol, 0) / earlierVolumes.length;
      
      if (recentAvg > earlierAvg * 1.2) volumeTrend = 'increasing';
      else if (recentAvg < earlierAvg * 0.8) volumeTrend = 'decreasing';
    }

    // Count volume spikes (2x average or more)
    const volumeSpikes = volumes.filter(vol => vol > avgVolume * 2).length;

    return {
      avgVolume: Math.round(avgVolume),
      volumeTrend,
      volumeSpikes
    };
  };

  // Detect market condition from OHLC data
  const detectMarketCondition = (ohlcData) => {
    if (!ohlcData || ohlcData.length < 5) return 'unknown';
    
    const closes = ohlcData.map(candle => candle.close);
    const highs = ohlcData.map(candle => candle.high);
    const lows = ohlcData.map(candle => candle.low);
    
    // Calculate volatility (average true range)
    let totalRange = 0;
    for (let i = 1; i < ohlcData.length; i++) {
      const trueHigh = Math.max(highs[i], closes[i-1]);
      const trueLow = Math.min(lows[i], closes[i-1]);
      totalRange += trueHigh - trueLow;
    }
    const avgTrueRange = totalRange / (ohlcData.length - 1);
    const avgClose = closes.reduce((sum, close) => sum + close, 0) / closes.length;
    const volatilityRatio = avgTrueRange / avgClose;

    // Calculate trend strength
    const firstClose = closes[0];
    const lastClose = closes[closes.length - 1];
    const trendStrength = Math.abs((lastClose - firstClose) / firstClose);

    if (volatilityRatio > 0.02) return 'volatile';
    if (trendStrength > 0.05) return 'trending';
    return 'sideways';
  };

  // Extract technical factors from reasoning text
  const extractTechnicalFactors = (reasoning) => {
    const factors = [];
    const reasoningLower = reasoning.toLowerCase();
    
    const technicalTerms = [
      'support', 'resistance', 'trend', 'bullish', 'bearish',
      'breakout', 'breakdown', 'volume', 'macd', 'rsi',
      'moving average', 'fibonacci', 'pattern', 'candlestick',
      'momentum', 'oversold', 'overbought', 'divergence'
    ];
    
    technicalTerms.forEach(term => {
      if (reasoningLower.includes(term)) {
        factors.push(term);
      }
    });
    
    return factors;
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

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Only set up if window is available (client-side)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!assetSymbol || !timeframe) {
      return;
    }

    // Don't refetch if we already have test data with the same session
    if (testData && testData.session_id && session_id && testData.session_id === session_id) {
      return;
    }

    // Prevent duplicate API calls
    if (isFetchingRef.current) {
      return;
    }

    const fetchTestData = async () => {
      try {
        isFetchingRef.current = true;
        setLoading(true);
        setChartsLoading(true);
        // Include session_id if available to get existing test data
        const params = new URLSearchParams({ timeframe });
        if (session_id) {
          params.append('session_id', session_id);
        }
        const response = await axios.get(`/api/test/${assetSymbol}?${params.toString()}`);
        setTestData(response.data);
        // Initialize userAnswers and reasoningInputs with empty values
        const initialAnswers = {};
        const initialReasoning = {};
        const initialTimestamps = {};
        const initialConfidence = {};
        const initialWarnings = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
          initialReasoning[q.id] = '';
          initialTimestamps[q.id] = Date.now(); // Start tracking time for each question
          initialConfidence[q.id] = 5; // Default confidence level
          initialWarnings[q.id] = null; // No warnings initially
        });
        setUserAnswers(initialAnswers);
        setReasoningInputs(initialReasoning);
        setQuestionTimestamps(initialTimestamps);
        setConfidenceLevels(initialConfidence);
        setContentWarnings(initialWarnings);
        setLoading(false);
        
        // Set a small timeout to simulate charts loading
        // This allows the CryptoLoader to display properly
        setTimeout(() => {
          setChartsLoading(false);
          if (cryptoLoaderRef.current) {
            cryptoLoaderRef.current.hideLoader();
          }
          
          // Initialize tour for first-time users
          const hasSeenTour = localStorage.getItem('tour-completed-bias-test-exam');
          const tourSkipped = localStorage.getItem('tour-skipped-bias-test-exam');
          
          if (!hasSeenTour && !tourSkipped) {
            setTimeout(() => {
              setShowTour(true);
            }, 2000);
          }
        }, 1500);
      } catch (err) {
        setError('Failed to load test data. Please try again later.');
        setLoading(false);
        setChartsLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchTestData();
  }, [assetSymbol, timeframe, session_id]);

  // Progressive news loading useEffect
  useEffect(() => {
    if (!testData || !testData.session_id) {
      return;
    }

    // Check if any questions have news loading flag
    const hasNewsLoading = testData.questions.some(q => q.news_loading);
    if (!hasNewsLoading) {
      return;
    }

    setNewsLoading(true);
    setNewsProgress({ completed: 0, total: testData.questions.length });

    let pollInterval;
    
    const pollNewsStatus = async () => {
      try {
        const response = await axios.get(`/api/test/news-status/${testData.session_id}`);
        const newsStatus = response.data;

        // Update progress
        setNewsProgress({
          completed: newsStatus.completed_questions,
          total: newsStatus.total_questions
        });

        // If we have updated questions with news, update the test data
        if (newsStatus.updated_questions && newsStatus.updated_questions.length > 0) {
          setTestData(prevTestData => {
            const updatedQuestions = [...prevTestData.questions];
            
            // Update questions that have new news data
            newsStatus.updated_questions.forEach(updatedQuestion => {
              const questionIndex = updatedQuestions.findIndex(q => q.id === updatedQuestion.id);
              if (questionIndex !== -1) {
                updatedQuestions[questionIndex] = {
                  ...updatedQuestions[questionIndex],
                  news_annotations: updatedQuestion.news_annotations,
                  news_loading: false
                };
              }
            });

            return {
              ...prevTestData,
              questions: updatedQuestions
            };
          });
        }

        // Stop polling when all news is loaded
        if (newsStatus.all_complete) {
          setNewsLoading(false);
          clearInterval(pollInterval);
        }

      } catch (error) {
        // Continue polling on error - don't break the process
      }
    };

    // Start polling every 2 seconds
    pollInterval = setInterval(pollNewsStatus, 2000);
    
    // Initial poll
    pollNewsStatus();

    // Cleanup on unmount or when testData changes
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };

  }, [testData?.session_id]);

  // Focus detection for test integrity
  useEffect(() => {
    if (!testData || isSubmitting || isKickedOut) return;

    let countdownInterval;

    // Create audio context for sound alerts
    const playWarningSound = () => {
      try {
        // Create AudioContext for beeping sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a more urgent warning sound pattern
        const playBeep = (frequency, duration, delay = 0) => {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          }, delay);
        };
        
        // Play urgent beep pattern (high-low-high)
        playBeep(800, 0.2, 0);    // High beep
        playBeep(400, 0.2, 250);  // Low beep  
        playBeep(800, 0.3, 500);  // High beep (longer)
        
      } catch (error) {
        // Fallback: try to vibrate on mobile
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 400]);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        // User left the tab - show warning modal with countdown and play sound
        setShowFocusWarning(true);
        setWarningCountdown(60);
        playWarningSound();
        
        countdownInterval = setInterval(() => {
          setWarningCountdown(prev => {
            if (prev <= 1) {
              // Time's up - kick them out
              clearInterval(countdownInterval);
              setIsKickedOut(true);
              setShowFocusWarning(false);
              return 0;
            }
            // Play sound every 10 seconds as reminder
            if (prev % 10 === 0 && prev > 1) {
              playWarningSound();
            }
            return prev - 1;
          });
        }, 1000);
      } else if (!document.hidden && document.visibilityState === 'visible') {
        // User came back - clear countdown but keep modal until they click continue
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }
    };

    const handleWindowBlur = () => {
      // User switched to another window/app
      if (!document.hidden) {
        setShowFocusWarning(true);
        setWarningCountdown(60);
        playWarningSound();
        
        countdownInterval = setInterval(() => {
          setWarningCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setIsKickedOut(true);
              setShowFocusWarning(false);
              return 0;
            }
            // Play sound every 10 seconds as reminder
            if (prev % 10 === 0 && prev > 1) {
              playWarningSound();
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    const handleWindowFocus = () => {
      // User came back to window - clear countdown
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [testData, isSubmitting, isKickedOut]);

  const handleContinueTest = () => {
    setShowFocusWarning(false);
    setWarningCountdown(60);
  };

  // Tour handlers
  const handleTourComplete = () => {
    localStorage.setItem('tour-completed-bias-test-exam', 'true');
    setShowTour(false);
  };

  const handleTourSkip = () => {
    setShowTour(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  const handleAnswerSelect = async (questionId, prediction) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: prediction
    }));
  };

  // Handle reasoning input changes with content filtering
  const handleReasoningChange = (questionId, reasoning) => {
    setReasoningInputs(prev => ({
      ...prev,
      [questionId]: reasoning
    }));
    
    // Real-time content validation
    const validation = quickValidate(reasoning);
    setContentWarnings(prev => ({
      ...prev,
      [questionId]: validation.warning
    }));
  };

  // Handle confidence level changes
  const handleConfidenceChange = (questionId, confidence) => {
    setConfidenceLevels(prev => ({
      ...prev,
      [questionId]: confidence
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

    // If predictions are valid, check if all have reasoning and content is appropriate
    if (isValid) {
      for (const questionId in reasoningInputs) {
        const reasoning = reasoningInputs[questionId].trim();
        if (!reasoning) {
          isValid = false;
          message = "Please provide reasoning for all your predictions.";
          break;
        }
        
        // Content filtering validation
        const contentCheck = filterContent(reasoning, { strictMode: false });
        if (!contentCheck.isValid) {
          isValid = false;
          message = `Question ${questionId}: ${contentCheck.reason}`;
          break;
        }
      }
    }

    // Validate confidence levels are properly set
    if (isValid) {
      for (const questionId in userAnswers) {
        const confidence = confidenceLevels[questionId];
        if (!confidence || confidence < 1 || confidence > 10) {
          isValid = false;
          message = "Please set confidence levels for all your predictions.";
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
      // Format answers data with enhanced metadata
      const formattedAnswers = Object.keys(userAnswers).map(testId => {
        const question = testData.questions.find(q => q.id === parseInt(testId));
        const timeSpent = Math.round((Date.now() - questionTimestamps[testId]) / 1000);
        
        return {
          test_id: parseInt(testId, 10),
          prediction: userAnswers[testId],
          reasoning: reasoningInputs[testId],
          // Enhanced metadata
          confidenceLevel: confidenceLevels[testId] || 5,
          timeSpent: timeSpent,
          marketCondition: detectMarketCondition(question?.ohlc_data),
          volumeProfile: analyzeVolumeProfile(question?.ohlc_data),
          technicalFactors: extractTechnicalFactors(reasoningInputs[testId] || ''),
          submittedAt: new Date()
        };
      });
      
      // Get auth token from storage - AWAIT THE ASYNCHRONOUS CALL
      const token = await storage.getItem('auth_token');
      
      // Check if the token was retrieved successfully
      if (!token) {
        showError('Authentication error. Please log in again.', 'Authentication Required');
        setIsSubmitting(false);
        if (typeof window !== 'undefined' && window.hideGlobalLoader) {
          window.hideGlobalLoader();
        }
        // Potentially redirect to login or show a more specific error
        return;
      }
      
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

      // Update state with results and feedback
      setTestData(prevData => ({
        ...prevData,
        results: response.data.results,
        feedback: response.data.feedback,
        scores: response.data.scores
      }));
    } catch (err) {
      showError('Failed to submit test. Please try again.', 'Submission Error');
      
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

  // Show kicked out screen
  if (isKickedOut) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: darkMode ? '#2d1b1b' : '#ffebee',
          border: `2px solid ${darkMode ? '#d32f2f' : '#e57373'}`,
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ 
            color: darkMode ? '#ff5252' : '#d32f2f',
            marginBottom: '20px',
            fontSize: '24px'
          }}>
            Test Session Terminated
          </h2>
          <p style={{ 
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Your test session has been terminated due to leaving the test environment. 
            For test integrity, switching tabs or windows is not permitted during the bias test.
          </p>
          <Link
            href="/bias-test"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: darkMode ? '#1976d2' : '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            Start New Test
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
      fontFamily: "'Roboto', sans-serif",
      color: darkMode ? '#EAEAEA' : '#333',
    }}>
      
      {/* Page Title */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={startTour}
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: darkMode ? '#ffffff' : '#1a1a1a',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          title="Take guided tour"
          className="help-button"
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          ?
        </button>
        
        <h1 style={{ 
          color: darkMode ? '#e0e0e0' : 'inherit',
          margin: 0
        }}>
          {testData.asset_name} Bias Test - {testData.selected_timeframe.toUpperCase()} Timeframe
        </h1>
      </div>
      
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
          Look for news markers (📰) on the charts - hover over them to see relevant news events that occurred during that time period.
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
              <i className={`fas ${showVolume ? 'fa-toggle-on' : 'fa-toggle-off'}`} style={{ fontSize: '14px' }}></i>
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
          <div key={question.id} className="chart-container" style={{ 
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
              <span>
                Chart {index + 1}
                {question.asset_name && (
                  <span style={{ 
                    color: darkMode ? '#4CAF50' : '#2E7D32',
                    fontWeight: '600',
                    marginLeft: '8px'
                  }}>
                    - {question.asset_name}
                  </span>
                )}
                {question.timeframe && (
                  <span style={{ 
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontWeight: 'normal',
                    marginLeft: '8px',
                    fontSize: '16px'
                  }}>
                    ({question.timeframe})
                  </span>
                )}
              </span>
              {hasVolumeData && (
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'normal',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#333' : '#f0f0f0',
                  color: showVolume ? (darkMode ? '#81c784' : '#4caf50') : (darkMode ? '#bbbbbb' : '#888888')
                }}>
                  <i className={`fas fa-chart-bar`} style={{ 
                    marginRight: '5px',
                    fontSize: '12px'
                  }}></i>
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
                    <div style={{ 
                      marginBottom: '12px', 
                      padding: '10px', 
                      backgroundColor: darkMode ? '#1a1a1a' : '#f0f8ff',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                      fontSize: '14px',
                      color: darkMode ? '#b0b0b0' : '#666'
                    }}>
                      <strong>📈 Chart Analysis Context:</strong> {question.ohlc_data.length} candles of historical data for comprehensive market analysis
                      {question.news_annotations && question.news_annotations.length > 0 && (
                        <span style={{ 
                          marginLeft: '10px',
                          padding: '2px 6px',
                          backgroundColor: darkMode ? '#2e4132' : '#e8f5e9',
                          color: darkMode ? '#81c784' : '#2e7d32',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          📰 {question.news_annotations.length} News Event{question.news_annotations.length !== 1 ? 's' : ''} Available
                        </span>
                      )}
                      {question.news_loading && (
                        <span style={{ 
                          marginLeft: '10px',
                          padding: '2px 6px',
                          backgroundColor: darkMode ? '#2d3748' : '#fff3cd',
                          color: darkMode ? '#fbbf24' : '#856404',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ 
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            border: '1px solid currentColor',
                            borderTop: '1px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></span>
                          🔄 Loading news...
                        </span>
                      )}
                    </div>
                    <div>
                      {/* Main price chart */}
                      <CandlestickChart 
                        data={question.ohlc_data} 
                        height={450}
                        timeframe={question.timeframe || timeframe || 'daily'}
                        newsAnnotations={question.news_annotations || []}
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
                          Last Candle Data ({formatDate(lastCandle.date, question.timeframe, testData?.asset_symbol)}):
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
            
            <div className="prediction-buttons" style={{ 
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
                  className="reasoning-textarea"
                  value={reasoningInputs[question.id]}
                  onChange={(e) => handleReasoningChange(question.id, e.target.value)}
                  placeholder="Explain your analysis and reasoning..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${contentWarnings[question.id] ? '#ff5722' : (darkMode ? '#444' : '#ddd')}`,
                    backgroundColor: darkMode ? '#333' : 'white',
                    color: darkMode ? '#e0e0e0' : '#333',
                    height: '100px',
                    resize: 'vertical',
                    marginBottom: contentWarnings[question.id] ? '5px' : '10px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                />
                
                {/* Content Warning Message */}
                {contentWarnings[question.id] && (
                  <div style={{
                    backgroundColor: darkMode ? '#2d1b1e' : '#ffebee',
                    color: darkMode ? '#ff8a80' : '#c62828',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '12px' }}></i>
                    {contentWarnings[question.id]}
                  </div>
                )}
                
                {/* Confidence Level Slider */}
                <div className="confidence-slider" style={{ marginTop: '15px' }}>
                  <label style={{ 
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}>
                    Confidence Level: {confidenceLevels[question.id]}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={confidenceLevels[question.id]}
                    onChange={(e) => handleConfidenceChange(question.id, parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: darkMode ? '#333' : '#ddd',
                      outline: 'none',
                      WebkitAppearance: 'none'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: darkMode ? '#999' : '#666',
                    marginTop: '5px'
                  }}>
                    <span>Low Confidence</span>
                    <span>High Confidence</span>
                  </div>
                </div>

                {/* Small hint for users */}
                <p style={{ 
                  fontSize: '12px', 
                  color: darkMode ? '#999' : '#666',
                  marginTop: '15px'
                }}>
                  Your reasoning will be analyzed by AI after submission to help improve your trading skills.
                </p>
              </div>
            )}
          </div>
        );
      })}
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <button
          className="submit-button"
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

      <AppModal
        isOpen={modalOpen}
        onClose={hideModal}
        {...modalProps}
      />

      {/* Focus Warning Modal */}
      {showFocusWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            border: `3px solid ${darkMode ? '#ff9800' : '#ff6f00'}`,
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ 
              color: darkMode ? '#ff9800' : '#ff6f00',
              marginBottom: '20px',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Return to Test!
            </h2>
            <p style={{ 
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '30px',
              lineHeight: '1.6',
              fontSize: '18px'
            }}>
              You have left the test environment. Please return to the test immediately.
            </p>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: darkMode ? '#ff5252' : '#d32f2f',
              marginBottom: '30px',
              fontFamily: 'monospace'
            }}>
              {warningCountdown}s
            </div>
            <button
              onClick={handleContinueTest}
              style={{
                padding: '16px 32px',
                backgroundColor: darkMode ? '#4caf50' : '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              Continue Test
            </button>
          </div>
        </div>
      )}

      <GuidedTour
        steps={tourSteps}
        isOpen={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        tourId="bias-test-exam"
      />
    </div>
  );
}
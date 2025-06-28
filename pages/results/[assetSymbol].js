// pages/results/[assetSymbol].js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import DOMPurify from 'isomorphic-dompurify';

// Function to clean and format AI analysis
const cleanAIAnalysis = (analysis) => {
  if (!analysis) return '';
  
  // Remove any potential encoding issues
  let cleaned = analysis
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Ensure proper HTML structure
  cleaned = cleaned.replace(/```html\s*/gi, '').replace(/```\s*$/, '');
  
  return cleaned;
};
import Confetti from 'react-confetti';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';
import TrackedPage from '../../components/TrackedPage';
import storage from '../../lib/storage';
import logger from '../../lib/logger';
import styles from '../../styles/BiasTestResults.module.css';
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
  const [outcomeImagesCaptured, setOutcomeImagesCaptured] = useState({}); // Track captured outcome images
  const [setupImagesCaptured, setSetupImagesCaptured] = useState({}); // Track captured setup images
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle window resize for confetti
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

  // Confetti is now triggered directly in the data loading logic above

  // Capture setup chart images
  const captureSetupChartImage = async (questionId, sessionId) => {
    try {
      const setupChartElement = document.getElementById(`setup-chart-${questionId}`);
      if (!setupChartElement) {
        console.log(`Setup chart element not found for question ${questionId}`);
        return null;
      }

      console.log(`Capturing setup chart for question ${questionId}`);

      // Use html2canvas to capture the setup chart
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(setupChartElement, {
        backgroundColor: darkMode ? '#262626' : '#ffffff',
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.8);

      // Upload to server
      try {
        const token = await storage.getItem('auth_token');
        if (token && sessionId) {
          const uploadResponse = await axios.post('/api/bias-test/upload-chart-image', {
            imageBlob: dataUrl,
            sessionId: sessionId,
            questionId: questionId,
            imageType: 'setup'
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (uploadResponse.data.success) {
            console.log(`Setup chart uploaded for question ${questionId}`);
            return {
              url: uploadResponse.data.imageUrl,
              gcsPath: uploadResponse.data.gcsPath
            };
          }
        }
      } catch (uploadError) {
        console.error('Error uploading setup chart:', uploadError);
      }

      return null;
    } catch (error) {
      console.error('Error capturing setup chart:', error);
      return null;
    }
  };

  // Capture outcome chart images
  const captureOutcomeChartImage = async (questionId, sessionId) => {
    try {
      const outcomeChartElement = document.getElementById(`outcome-chart-${questionId}`);
      if (!outcomeChartElement) {
        console.log(`Outcome chart element not found for question ${questionId}`);
        return null;
      }

      console.log(`Capturing outcome chart for question ${questionId}`);

      // Use html2canvas to capture the outcome chart
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(outcomeChartElement, {
        backgroundColor: darkMode ? '#262626' : '#ffffff',
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.8);

      // Upload to server
      try {
        const token = await storage.getItem('auth_token');
        if (token && sessionId) {
          const uploadResponse = await axios.post('/api/bias-test/upload-chart-image', {
            imageBlob: dataUrl,
            sessionId: sessionId,
            questionId: questionId,
            imageType: 'outcome'
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (uploadResponse.data.success) {
            console.log(`Outcome chart uploaded for question ${questionId}`);
            return {
              url: uploadResponse.data.imageUrl,
              gcsPath: uploadResponse.data.gcsPath
            };
          }
        }
      } catch (uploadError) {
        console.error('Error uploading outcome chart:', uploadError);
      }

      return null;
    } catch (error) {
      console.error('Error capturing outcome chart:', error);
      return null;
    }
  };

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
          
          // Trigger confetti after a short delay to ensure UI is ready
          setTimeout(() => {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 15000);
          }, 500);
          
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
              
              // Trigger confetti after a short delay to ensure UI is ready
              setTimeout(() => {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 15000);
              }, 500);
              
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
                
                // Trigger confetti after a short delay to ensure UI is ready
                setTimeout(() => {
                  setShowConfetti(true);
                  setTimeout(() => setShowConfetti(false), 15000);
                }, 500);
                
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

  // Capture both setup and outcome charts after results load
  useEffect(() => {
    if (results && results.answers && results.answers.length > 0 && router.query.session_id) {
      // Add a delay to ensure charts are fully rendered
      const captureTimer = setTimeout(async () => {
        try {
          const setupImages = [];
          const outcomeImages = [];
          
          for (const answer of results.answers) {
            const questionId = answer.test_id;

            // Check if setup image needs to be captured
            if (questionId && !answer.setup_chart_image_url && !setupImagesCaptured[questionId]) {
              setTimeout(async () => {
                console.log(`Delaying setup chart capture for ${questionId}`);
                const imageInfo = await captureSetupChartImage(questionId, router.query.session_id);
                if (imageInfo) {
                  setSetupImagesCaptured(prev => ({ ...prev, [questionId]: true }));
                }
              }, 16000); // Wait for confetti to finish (15s duration + 1s buffer)
            }

            // Check if outcome image needs to be captured
            if (questionId && !answer.outcome_chart_image_url && !outcomeImagesCaptured[questionId]) {
              setTimeout(async () => {
                console.log(`Delaying outcome chart capture for ${questionId}`);
                const imageInfo = await captureOutcomeChartImage(questionId, router.query.session_id);
                if (imageInfo) {
                  setOutcomeImagesCaptured(prev => ({ ...prev, [questionId]: true }));
                }
              }, 16500); // Stagger outcome chart capture after confetti ends
            }
          }
          
          // Update database with both setup and outcome image URLs if any were captured
          if (setupImages.length > 0 || outcomeImages.length > 0) {
            try {
              const token = await storage.getItem('auth_token');
              if (token) {
                const updateRequests = [];
                
                // Update setup images if captured
                if (setupImages.length > 0) {
                  updateRequests.push(
                    axios.post('/api/bias-test/update-chart-images', {
                      sessionId: router.query.session_id,
                      chartImages: setupImages,
                      imageType: 'setup'
                    }, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  );
                }
                
                // Update outcome images if captured
                if (outcomeImages.length > 0) {
                  updateRequests.push(
                    axios.post('/api/bias-test/update-outcome-images', {
                      sessionId: router.query.session_id,
                      outcomeImages: outcomeImages
                    }, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  );
                }
                
                const responses = await Promise.all(updateRequests);
                responses.forEach((response, index) => {
                  if (response.data.success) {
                    const imageType = index === 0 && setupImages.length > 0 ? 'setup' : 'outcome';
                    console.log(`Updated ${response.data.updatedCount} ${imageType} images in database`);
                  }
                });
              }
            } catch (updateError) {
              console.error('Error updating chart images in database:', updateError);
            }
          }
        } catch (error) {
          console.error('Error during chart capture:', error);
        }
      }, 2000); // 2 second delay to ensure charts are rendered

      return () => clearTimeout(captureTimer);
    }
  }, [results, router.query.session_id, setupImagesCaptured, outcomeImagesCaptured]);

  const handleTakeAnotherTest = () => {
    // Clear the loaded state before taking a new test
    setHasLoadedResults(false);
    
    const { assetSymbol } = router.query;
    // Get the original timeframe from the current results
    const originalTimeframe = results?.answers?.[0]?.timeframe || 'daily';
    // Force a new test by using a random query parameter
    // Include original timeframe parameter to preserve user's selection
    router.push(`/bias-test/${assetSymbol}?timeframe=${originalTimeframe}&random=${Math.random()}`);
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

  // Asset mapping for confetti (crypto + equities)
  const getAssetSymbolAndColors = (assetSymbol) => {
    const upperAssetSymbol = assetSymbol?.toUpperCase();
    const assetMap = {
      // Cryptocurrencies
      'BTC': { symbol: '₿', colors: ['#f7931a', '#ffb84d', '#ff9500'], name: 'Bitcoin', type: 'crypto' },
      'ETH': { symbol: 'Ξ', colors: ['#627eea', '#8a9df7', '#4169e1'], name: 'Ethereum', type: 'crypto' },
      'ADA': { symbol: '₳', colors: ['#0033ad', '#3468d1', '#1976d2'], name: 'Cardano', type: 'crypto' },
      'SOL': { symbol: '◎', colors: ['#9945ff', '#b366ff', '#8e2de2'], name: 'Solana', type: 'crypto' },
      'DOT': { symbol: '●', colors: ['#e6007a', '#ff4da6', '#e91e63'], name: 'Polkadot', type: 'crypto' },
      'MATIC': { symbol: 'Ⓜ', colors: ['#8247e5', '#9c59f7', '#7b1fa2'], name: 'Polygon', type: 'crypto' },
      'AVAX': { symbol: '▲', colors: ['#e84142', '#ff6b6b', '#f44336'], name: 'Avalanche', type: 'crypto' },
      'LINK': { symbol: '🔗', colors: ['#2a5ada', '#4285f4', '#1976d2'], name: 'Chainlink', type: 'crypto' },
      'UNI': { symbol: '🦄', colors: ['#ff007a', '#ff4da6', '#e91e63'], name: 'Uniswap', type: 'crypto' },
      'LTC': { symbol: 'Ł', colors: ['#bfbbbb', '#d4d4d4', '#9e9e9e'], name: 'Litecoin', type: 'crypto' },
      'XRP': { symbol: '✕', colors: ['#23292f', '#525252', '#616161'], name: 'Ripple', type: 'crypto' },
      'DOGE': { symbol: 'Ð', colors: ['#c2a633', '#d4af37', '#fdd835'], name: 'Dogecoin', type: 'crypto' },
      'SHIB': { symbol: '🐕', colors: ['#ffa800', '#ffb74d', '#ff9800'], name: 'Shiba Inu', type: 'crypto' },
      'BNB': { symbol: 'Ⓑ', colors: ['#f3ba2f', '#ffc107', '#ffb300'], name: 'Binance Coin', type: 'crypto' },
      'TRX': { symbol: '◊', colors: ['#ff0013', '#f44336', '#d32f2f'], name: 'TRON', type: 'crypto' },
      'TON': { symbol: '💎', colors: ['#0088cc', '#29b6f6', '#03a9f4'], name: 'Toncoin', type: 'crypto' },
      'ALGO': { symbol: '◢', colors: ['#000000', '#424242', '#616161'], name: 'Algorand', type: 'crypto' },
      'ATOM': { symbol: '⚛', colors: ['#2e3148', '#5c6bc0', '#3f51b5'], name: 'Cosmos', type: 'crypto' },
      'FTM': { symbol: '👻', colors: ['#1969ff', '#2196f3', '#1976d2'], name: 'Fantom', type: 'crypto' },
      'NEAR': { symbol: 'Ⓝ', colors: ['#00ec97', '#4caf50', '#388e3c'], name: 'NEAR Protocol', type: 'crypto' },
      
      // Major Tech Stocks
      'AAPL': { symbol: '', colors: ['#007aff', '#5ac8fa', '#34aadc'], name: 'Apple', type: 'equity' },
      'GOOGL': { symbol: 'G', colors: ['#4285f4', '#34a853', '#ea4335'], name: 'Google', type: 'equity' },
      'GOOG': { symbol: 'G', colors: ['#4285f4', '#34a853', '#ea4335'], name: 'Google', type: 'equity' },
      'MSFT': { symbol: '⊞', colors: ['#00bcf2', '#0078d4', '#106ebe'], name: 'Microsoft', type: 'equity' },
      'AMZN': { symbol: '📦', colors: ['#ff9900', '#ffb84d', '#ff8f00'], name: 'Amazon', type: 'equity' },
      'TSLA': { symbol: '⚡', colors: ['#cc0000', '#e53935', '#f44336'], name: 'Tesla', type: 'equity' },
      'META': { symbol: 'f', colors: ['#1877f2', '#42a5f5', '#2196f3'], name: 'Meta', type: 'equity' },
      'NVDA': { symbol: '🎮', colors: ['#76b900', '#8bc34a', '#689f38'], name: 'NVIDIA', type: 'equity' },
      'NFLX': { symbol: '🎬', colors: ['#e50914', '#f44336', '#d32f2f'], name: 'Netflix', type: 'equity' },
      'AMD': { symbol: '🔥', colors: ['#ed1c24', '#f44336', '#d32f2f'], name: 'AMD', type: 'equity' },
      
      // Financial Stocks
      'JPM': { symbol: '🏦', colors: ['#0066cc', '#1976d2', '#1565c0'], name: 'JPMorgan', type: 'equity' },
      'BAC': { symbol: '🏛️', colors: ['#e31837', '#f44336', '#d32f2f'], name: 'Bank of America', type: 'equity' },
      'WFC': { symbol: '🐎', colors: ['#d71e2b', '#f44336', '#d32f2f'], name: 'Wells Fargo', type: 'equity' },
      'GS': { symbol: '💰', colors: ['#0066cc', '#1976d2', '#1565c0'], name: 'Goldman Sachs', type: 'equity' },
      'V': { symbol: '💳', colors: ['#1a1f71', '#3f51b5', '#303f9f'], name: 'Visa', type: 'equity' },
      'MA': { symbol: '🔴', colors: ['#eb001b', '#f44336', '#d32f2f'], name: 'Mastercard', type: 'equity' },
      
      // Consumer & Retail
      'WMT': { symbol: '🛒', colors: ['#0071ce', '#1976d2', '#1565c0'], name: 'Walmart', type: 'equity' },
      'PG': { symbol: '🧼', colors: ['#003da5', '#1976d2', '#1565c0'], name: 'Procter & Gamble', type: 'equity' },
      'KO': { symbol: '🥤', colors: ['#f40009', '#f44336', '#d32f2f'], name: 'Coca-Cola', type: 'equity' },
      'PEP': { symbol: '🥤', colors: ['#004b93', '#1976d2', '#1565c0'], name: 'PepsiCo', type: 'equity' },
      'NKE': { symbol: '👟', colors: ['#ff6900', '#ff9800', '#f57c00'], name: 'Nike', type: 'equity' },
      'MCD': { symbol: '🍟', colors: ['#ffc72c', '#ffc107', '#ff8f00'], name: 'McDonald\'s', type: 'equity' },
      
      // Healthcare & Pharma
      'JNJ': { symbol: '💊', colors: ['#cc0000', '#f44336', '#d32f2f'], name: 'Johnson & Johnson', type: 'equity' },
      'PFE': { symbol: '💉', colors: ['#0093d0', '#2196f3', '#1976d2'], name: 'Pfizer', type: 'equity' },
      'UNH': { symbol: '🏥', colors: ['#002677', '#1976d2', '#1565c0'], name: 'UnitedHealth', type: 'equity' },
      
      // Industrial & Energy
      'XOM': { symbol: '⛽', colors: ['#ff1744', '#f44336', '#d32f2f'], name: 'ExxonMobil', type: 'equity' },
      'CVX': { symbol: '🛢️', colors: ['#1f4e79', '#1976d2', '#1565c0'], name: 'Chevron', type: 'equity' },
      'BA': { symbol: '✈️', colors: ['#5090d3', '#2196f3', '#1976d2'], name: 'Boeing', type: 'equity' },
      'CAT': { symbol: '🚜', colors: ['#ffcd11', '#ffc107', '#ff8f00'], name: 'Caterpillar', type: 'equity' },
      
      // Popular ETFs
      'SPY': { symbol: '📊', colors: ['#1f4e79', '#1976d2', '#1565c0'], name: 'SPDR S&P 500', type: 'etf' },
      'QQQ': { symbol: '📈', colors: ['#4caf50', '#66bb6a', '#388e3c'], name: 'Invesco QQQ', type: 'etf' },
      'IWM': { symbol: '📉', colors: ['#ff9800', '#ffb74d', '#f57c00'], name: 'iShares Russell 2000', type: 'etf' },
      'VTI': { symbol: '🌍', colors: ['#1976d2', '#42a5f5', '#1565c0'], name: 'Vanguard Total Stock', type: 'etf' }
    };

    // Default fallback for unknown assets
    const result = assetMap[upperAssetSymbol] || { 
      symbol: upperAssetSymbol?.charAt(0) || '?', 
      colors: ['#2196f3', '#42a5f5', '#1976d2'], 
      name: upperAssetSymbol || 'Unknown',
      type: 'unknown'
    };
    
    return result;
  };

  // Fixed: Generate size inside draw function to avoid hydration issues

  // Fast brand logo drawers using simple shapes + Unicode (like Bitcoin!)
  const drawAppleLogo = (ctx, colors, size) => {
    // Simple circle with bite (fast geometric shapes)
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Apple bite (simple circle cutout)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawGoogleLogo = (ctx, colors, size) => {
    // Google "G" with geometric shapes
    ctx.fillStyle = colors[0];
    ctx.font = `bold ${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', 0, 0);
  };

  const drawTeslaLogo = (ctx, colors, size) => {
    // Tesla "T" stylized
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', 0, 0);
  };

  const drawNvidiaLogo = (ctx, colors, size) => {
    // NVIDIA eye shape (simple geometric)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Custom asset shape drawer (crypto coins, stock symbols, ETF badges)
  const drawAssetShape = (ctx, assetSymbol) => {
    const asset = getAssetSymbolAndColors(assetSymbol);
    const pieceSize = Math.random() * 8 + 8; // Generate size only during drawing (client-side)
    
    ctx.save();
    
    if (asset.type === 'crypto') {
      // Optimized crypto coin drawing
      const gradient = ctx.createRadialGradient(-pieceSize * 0.3, -pieceSize * 0.3, 0, 0, 0, pieceSize);
      gradient.addColorStop(0, asset.colors[1]);
      gradient.addColorStop(0.6, asset.colors[0]);
      gradient.addColorStop(1, asset.colors[2]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, pieceSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Optimized border
      ctx.strokeStyle = asset.colors[2];
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw crypto symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${pieceSize * 0.7}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(asset.symbol, 0, 0);
      
    } else if (asset.type === 'equity') {
      // Draw background circle/shape first
      const gradient = ctx.createRadialGradient(-pieceSize * 0.3, -pieceSize * 0.3, 0, 0, 0, pieceSize);
      gradient.addColorStop(0, asset.colors[1]);
      gradient.addColorStop(1, asset.colors[0]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, pieceSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = asset.colors[2];
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Special brand logo handling
      if (assetSymbol === 'AAPL') {
        drawAppleLogo(ctx, asset.colors, pieceSize);
      } else if (assetSymbol === 'GOOGL' || assetSymbol === 'GOOG') {
        drawGoogleLogo(ctx, asset.colors, pieceSize);
      } else if (assetSymbol === 'TSLA') {
        drawTeslaLogo(ctx, asset.colors, pieceSize);
      } else if (assetSymbol === 'NVDA') {
        drawNvidiaLogo(ctx, asset.colors, pieceSize);
      } else {
        // Default symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${pieceSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(asset.symbol, 0, 0);
      }
      
    } else if (asset.type === 'etf') {
      // Optimized ETF hexagon
      const radius = pieceSize;
      const sides = 6;
      
      const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
      gradient.addColorStop(0, asset.colors[1]);
      gradient.addColorStop(1, asset.colors[0]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Border
      ctx.strokeStyle = asset.colors[2];
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${pieceSize * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(asset.symbol, 0, 0);
      
    } else {
      // Default optimized shape
      ctx.fillStyle = asset.colors[0];
      ctx.beginPath();
      ctx.arc(0, 0, pieceSize, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${pieceSize * 0.7}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(asset.symbol, 0, 0);
    }
    
    ctx.restore();
  };


  return (
    <TrackedPage pageName="BiasTestResults" eventProperties={{ asset: router.query.assetSymbol, timeframe: results.timeframe }}>
      {showConfetti && typeof window !== 'undefined' && results && windowSize.width && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={120}
          gravity={0.08}
          wind={0.005}
          friction={0.996}
          initialVelocityX={5}
          initialVelocityY={10}
          recycle={true}
          tweenDuration={12000}
          drawShape={(ctx) => {
            try {
              const assetSymbol = router.query.assetSymbol;
              drawAssetShape(ctx, assetSymbol);
            } catch (error) {
              console.error('Error drawing confetti shape:', error);
              // Fallback
              ctx.fillStyle = '#2196f3';
              ctx.beginPath();
              ctx.arc(0, 0, 6, 0, 2 * Math.PI);
              ctx.fill();
            }
          }}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
        />
      )}
      <div className={styles.resultsContainer} style={{ 
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
        
        <div className={styles.scoreContainer} style={{ 
          backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <p className={styles.scoreText} style={{ 
              color: darkMode ? '#b0b0b0' : 'inherit'
            }}>Your score:</p>
            <div className={styles.scoreNumber}>
              {score} / {total}
            </div>
            <div className={styles.scorePercentage} style={{ 
              backgroundColor: darkMode ? '#0d47a1' : '#e3f2fd', 
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
                  className={styles.questionContainer}
                  style={{ 
                    backgroundColor: darkMode
                      ? (answer.is_correct ? '#1b3620' : '#3a181a')
                      : (answer.is_correct ? '#e8f5e9' : '#ffebee'),
                    boxShadow: darkMode 
                      ? '0 2px 8px rgba(0,0,0,0.2)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeftColor: answer.is_correct 
                      ? '#4CAF50' 
                      : '#F44336'
                  }}
                >
                  <h3 className={styles.questionTitle} style={{ 
                    color: darkMode ? '#e0e0e0' : 'inherit'
                  }}>
                    Question {index + 1}
                    {answer.asset_name && (
                      <span className={styles.questionAsset} style={{ 
                        color: darkMode ? '#4CAF50' : '#2E7D32',
                        fontWeight: '600'
                      }}>
                        - {answer.asset_name}
                      </span>
                    )}
                    <span className={styles.questionTimeframe} style={{ 
                      color: darkMode ? '#b0b0b0' : '#666'
                    }}>
                      - {answer.timeframe || 'Unknown'} Timeframe
                    </span>
                  </h3>
                  
                  <div className={styles.chartsGrid}>
                    {/* Setup Chart with last candle date and data */}
                    <div>
                      <h4 className={styles.chartHeader} style={{ 
                        borderBottomColor: darkMode ? '#333' : '#eee',
                        color: darkMode ? '#e0e0e0' : 'inherit'
                      }}>
                        Setup Chart
                      </h4>
                      <div 
                        id={`setup-chart-${answer.test_id}`}
                        className={styles.chartContainer}
                        style={{ 
                          backgroundColor: darkMode ? '#262626' : '#fff'
                        }}
                      >
                        {ohlcData.length > 0 ? (
                          <>
                            <CandlestickChart data={ohlcData} height={350} />
                            <div className={styles.lastCandleInfo} style={{ 
                              backgroundColor: darkMode ? '#1a2e1a' : '#e8f5e9', 
                              borderColor: darkMode ? '#265426' : '#c8e6c9',
                              color: darkMode ? '#81c784' : 'inherit'
                            }}>
                              Last Candle Date: {lastSetupCandleDate}
                            </div>
                            
                            {/* Last Setup Candle OHLC Data */}
                            {lastSetupCandle && (
                              <div className={styles.ohlcData}>
                                <p className={styles.ohlcTitle} style={{ 
                                  color: darkMode ? '#e0e0e0' : 'inherit'
                                }}>
                                  Last Candle OHLC Data:
                                </p>
                                <div className={styles.ohlcGrid}>
                                  <div className={styles.ohlcItem} style={{ 
                                    backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                    color: darkMode ? '#e0e0e0' : 'inherit'
                                  }}>
                                    <strong>Open:</strong> {lastSetupCandle.open.toFixed(2)}
                                  </div>
                                  <div className={styles.ohlcItem} style={{ 
                                    backgroundColor: darkMode ? '#333' : '#f5f5f5',
                                    color: darkMode ? '#e0e0e0' : 'inherit'
                                  }}>
                                    <strong>High:</strong> {lastSetupCandle.high.toFixed(2)}
                                  </div>
                                  <div className={styles.ohlcItem} style={{ 
                                    backgroundColor: darkMode ? '#333' : '#f5f5f5', 
                                    color: darkMode ? '#e0e0e0' : 'inherit'
                                  }}>
                                    <strong>Low:</strong> {lastSetupCandle.low.toFixed(2)}
                                  </div>
                                  <div className={styles.ohlcItem} style={{ 
                                    backgroundColor: darkMode ? '#333' : '#f5f5f5', 
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
                      <div 
                        id={`outcome-chart-${answer.test_id}`}
                        style={{ 
                          backgroundColor: darkMode ? '#262626' : '#fff', 
                          padding: '15px', 
                          borderRadius: '8px'
                        }}
                      >
                        {outcomeData.length > 0 ? (
                          <>
                            <CandlestickChart data={outcomeData} height={350} />
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
                        className={styles.aiAnalysisContent}
                        style={{ 
                          color: darkMode ? '#e0e0e0' : '#1a1a1a',
                          lineHeight: '1.8',
                          fontSize: '16px'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(cleanAIAnalysis(answer.ai_analysis), {
                            ALLOWED_TAGS: ['h3', 'h4', 'p', 'ul', 'li', 'strong', 'em', 'br'],
                            ALLOWED_ATTR: []
                          })
                        }}
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
        
        <div className={styles.navigationButtons}>
          <button 
            onClick={handleTakeAnotherTest}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Take Another Test
          </button>
          <Link 
            href="/bias-test"
            className={`${styles.button} ${styles.primaryButton}`}
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
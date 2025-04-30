import React, { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';
import PlotlyChart from '../../components/charts/PlotlyChart';
import DrawingToolsOverlay from '../../components/charts/DrawingToolsOverlay';
import { fetchCoinGeckoOHLC } from '../../lib/data-service';

// Exam type configuration
const examConfigs = {
  'swing-points': {
    title: 'Swing Point Analysis Exam',
    description: 'Identify important swing highs and swing lows on the chart. These are key turning points that determine market structure.',
    instructions: 'Use the drawing tools to mark significant swing points on the chart. Mark at least 3 major swing highs and 3 major swing lows.',
    cryptoAssets: ['bitcoin', 'ethereum', 'ripple', 'cardano'],
    timeframes: [7, 14, 30, 90],
    defaultTimeframe: 30,
    defaultCrypto: 'bitcoin'
  },
  'fibonacci': {
    title: 'Fibonacci Retracements Exam',
    description: 'Apply Fibonacci retracement levels to identify potential support and resistance zones.',
    instructions: 'Select a significant trend, then draw Fibonacci retracement levels from the start to the end of the trend. Identify key levels at 0.236, 0.382, 0.618, and 0.786.',
    cryptoAssets: ['bitcoin', 'ethereum', 'solana', 'polkadot'],
    timeframes: [14, 30, 90, 180],
    defaultTimeframe: 90,
    defaultCrypto: 'ethereum'
  },
  'fvg': {
    title: 'Fair Value Gaps (FVG) Exam',
    description: 'Identify Fair Value Gaps - areas where price makes a significant move, leaving an imbalance that often gets filled later.',
    instructions: 'Mark Fair Value Gaps on the chart by identifying areas where price has made a rapid move, creating an imbalance that is likely to be filled in the future.',
    cryptoAssets: ['bitcoin', 'ethereum', 'binancecoin', 'avalanche-2'],
    timeframes: [1, 7, 14, 30],
    defaultTimeframe: 7,
    defaultCrypto: 'binancecoin'
  }
};

export default function ChartExam() {
  const router = useRouter();
  const { examType } = router.query;
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState(0);
  const [error, setError] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [chartInitialized, setChartInitialized] = useState(false);
  const plotlyRef = useRef(null);
  const cryptoLoaderRef = useRef(null);

  // Initialize exam configuration based on the examType
  useEffect(() => {
    if (!examType || !examConfigs[examType]) {
      if (router.isReady) {
        setError('Invalid exam type selected');
        setLoading(false);
      }
      return;
    }

    // Set defaults from config
    const config = examConfigs[examType];
    setSelectedCrypto(config.defaultCrypto);
    setSelectedTimeframe(config.defaultTimeframe);
    
    // Simulate loading time and then hide loader
    const timer = setTimeout(() => {
      setLoading(false);
      if (cryptoLoaderRef.current) {
        cryptoLoaderRef.current.hideLoader();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [examType, router.isReady]);

  const handleCryptoChange = (e) => {
    setSelectedCrypto(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setSelectedTimeframe(parseInt(e.target.value, 10));
  };

  const handleStartExam = async () => {
    try {
      setLoading(true);
      
      // Fetch actual data from CoinGecko using our service
      const data = await fetchCoinGeckoOHLC(selectedCrypto, selectedTimeframe);
      setChartData(data);
      
      // Reset drawings when starting a new exam
      setDrawings([]);
      
      // Simulate loading time and then hide loader
      setTimeout(() => {
        setLoading(false);
        if (cryptoLoaderRef.current) {
          cryptoLoaderRef.current.hideLoader();
        }
      }, 1500);
    } catch (err) {
      setError(`Failed to load chart data: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDrawingComplete = (drawing) => {
    console.log('Drawing completed:', drawing);
  };

  const handleDrawingChange = (allDrawings) => {
    setDrawings(allDrawings);
  };

  const handleChartInitialized = (figure) => {
    plotlyRef.current = figure;
    setChartInitialized(true);
  };

  const handleSubmitAnalysis = () => {
    // Validate that the user has made the required drawings based on the exam type
    if (drawings.length === 0) {
      alert('Please add at least one drawing to the chart before submitting.');
      return;
    }

    // Count drawing types to validate against exam requirements
    const drawingTypes = drawings.reduce((counts, drawing) => {
      counts[drawing.type] = (counts[drawing.type] || 0) + 1;
      return counts;
    }, {});

    // Check specific requirements for each exam type
    if (examType === 'swing-points' && (!drawingTypes.swingPoint || drawingTypes.swingPoint < 6)) {
      alert('Please mark at least 6 swing points (3 highs and 3 lows) before submitting.');
      return;
    }

    if (examType === 'fibonacci' && (!drawingTypes.fibonacci || drawingTypes.fibonacci < 1)) {
      alert('Please draw at least one Fibonacci retracement before submitting.');
      return;
    }

    if (examType === 'fvg' && (!drawingTypes.fvg || drawingTypes.fvg < 2)) {
      alert('Please identify at least 2 Fair Value Gaps before submitting.');
      return;
    }

    // If validation passes, we would submit the drawings to the backend
    alert('Analysis submitted successfully! Your results will be available soon.');
    
    // In a real implementation, you would send the drawings to the server
    // and redirect to a results page
  };

  if (!examType || !examConfigs[examType]) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '40px 20px', 
        textAlign: 'center',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        <div style={{ 
          backgroundColor: darkMode ? '#332d10' : '#fff9c4', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ffee58' : '#f57f17' 
        }}>
          <p>Invalid exam type selected. Please return to the exam selection page.</p>
          <Link
            href="/chart-exam"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              marginTop: '15px',
              fontWeight: 'bold'
            }}
          >
            Back to Exam Selection
          </Link>
        </div>
      </div>
    );
  }

  // Get exam config for the selected exam type
  const config = examConfigs[examType];

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      color: darkMode ? '#e0e0e0' : '#333'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        {config.title}
      </h1>

      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <p style={{ 
          marginBottom: '15px',
          lineHeight: '1.6',
          color: darkMode ? '#b0b0b0' : '#555'
        }}>
          {config.description}
        </p>
        <div style={{
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '15px',
          borderLeft: '4px solid #2196F3'
        }}>
          <p style={{
            color: darkMode ? '#e0e0e0' : '#333',
            fontWeight: 'bold',
            marginBottom: '5px'
          }}>Instructions:</p>
          <p style={{
            color: darkMode ? '#b0b0b0' : '#555',
          }}>
            {config.instructions}
          </p>
        </div>
      </div>

      {!chartData && (
        <div style={{
          backgroundColor: darkMode ? '#262626' : 'white',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '1.3rem'
          }}>
            Select Chart Settings
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div>
              <label 
                htmlFor="cryptoSelect" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: darkMode ? '#b0b0b0' : '#555',
                  fontWeight: '500'
                }}
              >
                Cryptocurrency:
              </label>
              <select 
                id="cryptoSelect"
                value={selectedCrypto}
                onChange={handleCryptoChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: darkMode ? '#333' : 'white',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                {config.cryptoAssets.map(asset => (
                  <option key={asset} value={asset}>
                    {asset.charAt(0).toUpperCase() + asset.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label 
                htmlFor="timeframeSelect" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: darkMode ? '#b0b0b0' : '#555',
                  fontWeight: '500'
                }}
              >
                Timeframe (Days):
              </label>
              <select 
                id="timeframeSelect"
                value={selectedTimeframe}
                onChange={handleTimeframeChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: darkMode ? '#333' : 'white',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                {config.timeframes.map(days => (
                  <option key={days} value={days}>
                    {days} Days
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleStartExam}
              style={{
                padding: '15px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Start Exam
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ marginBottom: '30px' }}>
          <CryptoLoader 
            ref={cryptoLoaderRef} 
            message="Loading chart data..." 
            height="500px" 
            minDisplayTime={1500}
          />
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: darkMode ? '#3a181a' : '#ffebee', 
          padding: '20px', 
          borderRadius: '8px', 
          color: darkMode ? '#ff8a80' : '#d32f2f',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '4px',
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: '15px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {chartData && !loading && (
        <div style={{
          backgroundColor: darkMode ? '#262626' : 'white',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          position: 'relative',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '1.3rem'
          }}>
            Chart Analysis
          </h2>
          
          <div style={{ position: 'relative' }}>
            <PlotlyChart 
              data={chartData}
              height={600}
              onInitialized={handleChartInitialized}
            />
            {chartInitialized && (
              <DrawingToolsOverlay 
                plotlyNode={plotlyRef.current} 
                onDrawingComplete={handleDrawingComplete}
                onDrawingChange={handleDrawingChange}
              />
            )}
          </div>
          
          <div style={{ 
            marginTop: '30px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            padding: '15px',
            borderRadius: '8px',
          }}>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#555',
              marginBottom: '15px'
            }}>
              <span style={{ fontWeight: 'bold', color: darkMode ? '#e0e0e0' : '#333' }}>Drawing Count:</span> {drawings.length} {drawings.length === 1 ? 'drawing' : 'drawings'} added
            </p>
            
            {examType === 'swing-points' && (
              <div style={{ 
                backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p style={{ color: darkMode ? '#81c784' : '#388e3c' }}>
                  <strong>Required:</strong> Mark at least 6 swing points (3 highs and 3 lows)
                </p>
                <p style={{ color: darkMode ? '#81c784' : '#388e3c', marginTop: '5px' }}>
                  <strong>Current:</strong> {drawings.filter(d => d.type === 'swingPoint').length} swing points marked
                </p>
              </div>
            )}
            
            {examType === 'fibonacci' && (
              <div style={{ 
                backgroundColor: darkMode ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p style={{ color: darkMode ? '#ce93d8' : '#7b1fa2' }}>
                  <strong>Required:</strong> Draw at least 1 Fibonacci retracement from a significant low to high (or high to low)
                </p>
                <p style={{ color: darkMode ? '#ce93d8' : '#7b1fa2', marginTop: '5px' }}>
                  <strong>Current:</strong> {drawings.filter(d => d.type === 'fibonacci').length} Fibonacci retracements drawn
                </p>
              </div>
            )}
            
            {examType === 'fvg' && (
              <div style={{ 
                backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p style={{ color: darkMode ? '#ffb74d' : '#ef6c00' }}>
                  <strong>Required:</strong> Identify at least 2 Fair Value Gaps
                </p>
                <p style={{ color: darkMode ? '#ffb74d' : '#ef6c00', marginTop: '5px' }}>
                  <strong>Current:</strong> {drawings.filter(d => d.type === 'fvg').length} Fair Value Gaps identified
                </p>
              </div>
            )}
          </div>
          
          <div style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleSubmitAnalysis}
              style={{
                padding: '15px 40px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Submit Analysis
            </button>
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '30px'
      }}>
        <Link
          href="/chart-exam"
          style={{
            padding: '12px 25px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: darkMode ? '#e0e0e0' : '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: '500'
          }}
        >
          Back to Exam Selection
        </Link>
      </div>
    </div>
  );
} 
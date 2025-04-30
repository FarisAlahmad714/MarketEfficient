// pages/bias-test/[assetSymbol].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import LoadingScreen from '../../components/LoadingScreen';

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
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const response = await axios.get(`/api/test/${assetSymbol}?timeframe=${timeframe}`);
        setTestData(response.data);
        // Initialize userAnswers with empty values
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setUserAnswers(initialAnswers);
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError('Failed to load test data. Please try again later.');
      } finally {
        setLoading(false);
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
    
    // Display the global loader directly (optional - if needed for longer operations)
    document.getElementById('global-loader').style.display = 'flex';
    
    try {
      // Your code to submit the test
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
      document.getElementById('global-loader').style.display = 'none';
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading test data..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
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

  if (!testData) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fff9c4', padding: '20px', borderRadius: '8px', color: '#f57f17' }}>
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        {testData.asset_name} Bias Test - {testData.selected_timeframe.toUpperCase()} Timeframe
      </h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
          Instructions
        </p>
        <p style={{ textAlign: 'center' }}>
          For each chart below, analyze the price pattern and predict if the market will be Bullish or Bearish after the last candle shown.
        </p>
      </div>
      
      {testData.questions.map((question, index) => (
        <div key={question.id} style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
          marginBottom: '30px' 
        }}>
          <h2 style={{ marginBottom: '20px' }}>Chart {index + 1}</h2>
          
          <div style={{ marginBottom: '20px' }}>
            {question.ohlc_data && question.ohlc_data.length > 0 ? (
              <CandlestickChart data={question.ohlc_data} height={400} />
            ) : (
              <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                No chart data available
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px' }}>
            <button
              onClick={() => handleAnswerSelect(question.id, 'Bullish')}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: userAnswers[question.id] === 'Bullish' ? '#4CAF50' : '#f5f5f5',
                color: userAnswers[question.id] === 'Bullish' ? 'white' : '#333',
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
                backgroundColor: userAnswers[question.id] === 'Bearish' ? '#F44336' : '#f5f5f5',
                color: userAnswers[question.id] === 'Bearish' ? 'white' : '#333',
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
        </div>
      ))}
      
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
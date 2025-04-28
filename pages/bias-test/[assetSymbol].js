// pages/bias-test/[assetSymbol].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import CandlestickChart from '../../components/charts/CandlestickChart';

export default function BiasTestPage() {
  const router = useRouter();
  const { assetSymbol } = router.query;

  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Only fetch data once assetSymbol is available (after hydration)
    if (!assetSymbol) return;

    const fetchTest = async () => {
      try {
        console.log(`Fetching test for asset: ${assetSymbol}`);
        const response = await axios.get(`/api/test/${assetSymbol}`);
        console.log("Test data:", response.data);
        setTestData(response.data);
        setSessionId(response.data.session_id);
      } catch (err) {
        console.error('Error fetching test:', err);
        setError(`Failed to load test. Please try again later.`);
      }
    };

    fetchTest();
  }, [assetSymbol]);

  const handleAnswerChange = (questionId, prediction) => {
    console.log(`Selecting ${prediction} for question ${questionId}`);
    setAnswers(prev => ({
      ...prev,
      [questionId]: prediction
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting answers:", answers);

    // Check if all questions are answered
    const questionsCount = testData?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;

    console.log(`Answered ${answeredCount} of ${questionsCount} questions`);

    if (answeredCount < questionsCount) {
      alert(`Please answer all questions before submitting. You've answered ${answeredCount} of ${questionsCount}.`);
      return;
    }

    try {
      setSubmitting(true);

      // Convert answers to array format expected by API
      const answersArray = Object.entries(answers).map(([testId, prediction]) => ({
        test_id: parseInt(testId, 10),
        prediction
      }));

      console.log("Sending answers to API:", answersArray);

      const response = await axios.post(`/api/test/${assetSymbol}?session_id=${sessionId}`, answersArray);
      console.log("Submission response:", response.data);

      // Navigate to results page
      router.push(`/results/${assetSymbol}?session_id=${sessionId}`);
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError(`Failed to submit test answers. Please try again.`);
      setSubmitting(false);
    }
  };

  // Get a human-readable timeframe label
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

  // Show error message
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

  // Show loading indicator
  if (!testData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
        Loading test data...
      </div>
    );
  }

  // Show "no questions" message
  if (!testData.questions || testData.questions.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fff9c4', padding: '20px', borderRadius: '8px', color: '#f57f17' }}>
          <p>No test questions available for this asset.</p>
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

  // Log current answers state for debugging
  console.log("Current answers:", answers);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>{testData.asset_name} Bias Test</h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <span style={{ display: 'inline-block', backgroundColor: '#2196F3', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '14px' }}>
          {testData.selected_timeframe === 'random' ? 'Mixed Timeframes' : `${getTimeframeLabel(testData.selected_timeframe)} Timeframe`}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {testData.questions.map((question, index) => (
          <div key={question.id} style={{ marginBottom: '30px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
              Question {index + 1}
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>
                - {getTimeframeLabel(question.timeframe)} Timeframe
              </span>
            </h3>

            <div style={{ marginBottom: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              {question.ohlc_data ? (
                <CandlestickChart 
                  data={question.ohlc_data} 
                  title={`Chart for ${testData.asset_name} - ${getTimeframeLabel(question.timeframe)}`}
                  height={300}
                />
              ) : (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  No chart data available
                </div>
              )}
            </div>

            <div style={{ marginBottom: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <p style={{ marginTop: 0, fontWeight: 'bold' }}>OHLC for {new Date(question.date).toLocaleDateString()}:</p>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  Open: {question.ohlc?.open?.toFixed(2) || 'N/A'}
                </li>
                <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  High: {question.ohlc?.high?.toFixed(2) || 'N/A'}
                </li>
                <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  Low: {question.ohlc?.low?.toFixed(2) || 'N/A'}
                </li>
                <li style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  Close: {question.ohlc?.close?.toFixed(2) || 'N/A'}
                </li>
              </ul>
            </div>

            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Predict the next {question.timeframe} sentiment:</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  padding: '10px 15px', 
                  backgroundColor: answers[question.id] === "Bullish" ? '#e8f5e9' : '#f8f9fa', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  border: answers[question.id] === "Bullish" ? '1px solid #4CAF50' : '1px solid transparent'
                }}>
                  <input
                    type="radio"
                    name={`prediction_${question.id}`}
                    value="Bullish"
                    checked={answers[question.id] === "Bullish"}
                    onChange={() => handleAnswerChange(question.id, "Bullish")}
                    style={{ marginRight: '8px' }}
                  />
                  Bullish
                </label>
                <label style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  padding: '10px 15px', 
                  backgroundColor: answers[question.id] === "Bearish" ? '#ffebee' : '#f8f9fa', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  border: answers[question.id] === "Bearish" ? '1px solid #F44336' : '1px solid transparent'
                }}>
                  <input
                    type="radio"
                    name={`prediction_${question.id}`}
                    value="Bearish"
                    checked={answers[question.id] === "Bearish"}
                    onChange={() => handleAnswerChange(question.id, "Bearish")}
                    style={{ marginRight: '8px' }}
                  />
                  Bearish
                </label>
              </div>
            </div>
          </div>
        ))}

        <button 
          type="submit" 
          disabled={submitting} 
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '15px', 
            backgroundColor: submitting ? '#cccccc' : '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '16px', 
            fontWeight: 'bold', 
            cursor: submitting ? 'not-allowed' : 'pointer' 
          }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
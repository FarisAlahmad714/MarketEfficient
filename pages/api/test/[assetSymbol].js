// pages/test/[assetSymbol].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import CandlestickChart from '../../../components/CandlestickChart';

const BiasTest = () => {
  const router = useRouter();
  const { assetSymbol } = router.query;
  const timeframe = router.query.timeframe || 'daily';
  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!assetSymbol) return;
    const fetchTest = async () => {
      try {
        const response = await axios.get(`/api/test/${assetSymbol}?timeframe=${timeframe}`);
        setTestData(response.data);
      } catch (err) {
        setError('Failed to load test.');
      }
    };
    fetchTest();
  }, [assetSymbol, timeframe]);

  const handleAnswerChange = (questionId, prediction) => {
    setAnswers(prev => ({ ...prev, [questionId]: prediction }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([testId, prediction]) => ({
        test_id: parseInt(testId),
        prediction,
      }));
      await axios.post(`/api/test/${assetSymbol}`, answersArray, {
        params: { session_id: testData.session_id },
      });
      router.push(`/results/${assetSymbol}?session_id=${testData.session_id}`);
    } catch (err) {
      setError('Failed to submit test.');
      setSubmitting(false);
    }
  };

  if (error) return <div>{error}</div>;
  if (!testData) return <div>Loading...</div>;

  return (
    <div>
      <h1>{testData.asset_name} Bias Test</h1>
      <form onSubmit={handleSubmit}>
        {testData.questions.map((question, index) => (
          <div key={question.id}>
            <h3>Question {index + 1} - {question.timeframe} Timeframe</h3>
            <CandlestickChart data={question.ohlc_data} height={400} />
            <div>
              <label>
                <input
                  type="radio"
                  name={`prediction_${question.id}`}
                  value="Bullish"
                  onChange={() => handleAnswerChange(question.id, 'Bullish')}
                />
                Bullish
              </label>
              <label>
                <input
                  type="radio"
                  name={`prediction_${question.id}`}
                  value="Bearish"
                  onChange={() => handleAnswerChange(question.id, 'Bearish')}
                />
                Bearish
              </label>
            </div>
          </div>
        ))}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default BiasTest;
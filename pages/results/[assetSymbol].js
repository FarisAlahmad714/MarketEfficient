// pages/results/[assetSymbol].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import CandlestickChart from '../../components/CandlestickChart';

const Results = () => {
  const router = useRouter();
  const { assetSymbol } = router.query;
  const sessionId = router.query.session_id;
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found.');
      setLoading(false);
      return;
    }
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/test/${assetSymbol}?session_id=${sessionId}`);
        setResults(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load results.');
        setLoading(false);
      }
    };
    fetchResults();
  }, [assetSymbol, sessionId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>{results.asset_name} Bias Test Results</h1>
      <div>
        <p>Your score: {results.score} / {results.total}</p>
        <div>{Math.round((results.score / results.total) * 100)}%</div>
      </div>
      <h2>Review Your Answers</h2>
      {results.answers.map((answer, index) => (
        <div key={answer.test_id} className={answer.is_correct ? 'correct' : 'incorrect'}>
          <h3>Question {index + 1} - {answer.timeframe} Timeframe</h3>
          <div>
            <div>
              <p>Setup Chart:</p>
              <CandlestickChart data={answer.ohlc_data} height={400} />
            </div>
            <div>
              <p>Outcome Chart:</p>
              <CandlestickChart data={answer.outcome_data} height={400} />
            </div>
          </div>
          <div>
            <p>Your Prediction: <strong>{answer.user_prediction}</strong></p>
            <p>Correct Answer: <strong>{answer.correct_answer}</strong></p>
            <p>{answer.is_correct ? '✓ Correct' : '✗ Incorrect'}</p>
          </div>
        </div>
      ))}
      <div>
        <button onClick={() => router.push(`/test/${assetSymbol}`)}>Take Another Test</button>
        <button onClick={() => router.push('/')}>Back to Asset Selection</button>
      </div>
    </div>
  );
};

export default Results;
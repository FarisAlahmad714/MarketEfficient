// pages/debug-test-results.js
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function DebugTestResults() {
  const { user, loading } = useAuth();
  const [debugData, setDebugData] = useState(null);
  const [targetUser, setTargetUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDebugData = async (userId = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = userId ? 
        `/api/debug/test-results?userId=${encodeURIComponent(userId)}` : 
        '/api/debug/test-results';
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch debug data');
      }
      
      setDebugData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchDebugData();
    }
  }, [user, loading]);

  if (loading) {
    return <Layout><div className="loading">Loading...</div></Layout>;
  }

  if (!user) {
    return <Layout><div>Please log in to access debug tools.</div></Layout>;
  }

  const handleDebugUser = (e) => {
    e.preventDefault();
    fetchDebugData(targetUser);
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>🔍 Test Results Debugger</h1>
        
        {user?.isAdmin && (
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Admin: Debug Any User</h3>
            <form onSubmit={handleDebugUser} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                placeholder="Enter user email, username, or ID"
                style={{ flex: 1, padding: '8px' }}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Debug User'}
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => fetchDebugData()} 
          disabled={isLoading}
          style={{ marginBottom: '20px', padding: '10px 20px' }}
        >
          {isLoading ? 'Loading...' : 'Refresh My Results'}
        </button>

        {error && (
          <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '5px', marginBottom: '20px' }}>
            ❌ Error: {error}
          </div>
        )}

        {debugData && (
          <div>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
              <h2>👤 User Information</h2>
              <p><strong>Email:</strong> {debugData.user.email}</p>
              <p><strong>Username:</strong> {debugData.user.username}</p>
              <p><strong>User ID:</strong> {debugData.user.id}</p>
              <p><strong>Created:</strong> {new Date(debugData.user.createdAt).toLocaleString()}</p>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e6f3ff', borderRadius: '5px' }}>
              <h2>📊 Statistics Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <strong>Total Tests:</strong> {debugData.analysis.statistics.totalTests}
                </div>
                <div>
                  <strong>Test Types:</strong> {debugData.analysis.statistics.testTypes}
                </div>
                <div>
                  <strong>Weighted Average:</strong> {debugData.analysis.averages.weightedAverage}%
                </div>
                <div>
                  <strong>Simple Average:</strong> {debugData.analysis.averages.simpleAverage}%
                </div>
                <div>
                  <strong>Duplicates:</strong> {debugData.analysis.statistics.duplicateEntries}
                </div>
                <div>
                  <strong>Data Issues:</strong> {debugData.analysis.statistics.dataIssues}
                </div>
              </div>
              
              {debugData.analysis.averages.discrepancy && (
                <div style={{ color: 'red', marginTop: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '3px' }}>
                  ⚠️ <strong>Average Discrepancy Detected!</strong> There's a significant difference between weighted and simple averages.
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h2>📈 By Test Type</h2>
              {Object.entries(debugData.analysis.byTestType).map(([testType, data]) => (
                <div key={testType} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <h3>{testType}</h3>
                  <p><strong>Count:</strong> {data.count} | <strong>Average:</strong> {data.averagePercentage}%</p>
                  <p><strong>Recent Scores:</strong> {data.recent.map(r => `${r.percentage}%`).join(', ')}</p>
                </div>
              ))}
            </div>

            {debugData.analysis.issues.duplicates.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                <h2>⚠️ Duplicate Entries</h2>
                {debugData.analysis.issues.duplicates.map((dup, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>{dup.key}:</strong> {dup.count} entries
                    <ul style={{ marginLeft: '20px' }}>
                      {dup.entries.map(entry => (
                        <li key={entry.id}>{entry.id} - {new Date(entry.completedAt).toLocaleString()}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {debugData.analysis.issues.dataIntegrity.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
                <h2>❌ Data Integrity Issues</h2>
                {debugData.analysis.issues.dataIntegrity.map((issue, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>Result {issue.resultId}:</strong>
                    <ul style={{ marginLeft: '20px' }}>
                      {issue.issues.map((prob, i) => <li key={i}>{prob}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h2>📋 All Test Results</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Asset</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Score</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Percentage</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.analysis.scores.map((score, index) => (
                      <tr key={score.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {new Date(score.completedAt).toLocaleDateString()}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {score.testType}{score.subType ? ` (${score.subType})` : ''}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{score.assetSymbol}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {score.score}/{score.totalPoints}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{score.percentage}%</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{score.status}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {score.details?.questionCount || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
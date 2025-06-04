import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import storage from '../../lib/storage'; // Adjust the path to your storage utility

export default function CronTestPage() {
  const { darkMode } = useContext(ThemeContext);
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState('weekly-metrics');

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const runTest = async (testType) => {
    setIsRunning(true);
    setTestResults(null);
    
    try {
      const response = await fetch('/api/admin/test-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storage.getItem('auth_token')}`
        },
        body: JSON.stringify({ type: testType })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResults(data);
      } else {
        setTestResults({ error: data.error || 'Test failed' });
      }
    } catch (error) {
      setTestResults({ error: 'Network error: ' + error.message });
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !user.isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <>
      <Head>
        <title>Cron Job Testing - Admin</title>
      </Head>
      
      <div style={{
        maxWidth: '1000px',
        margin: '40px auto',
        padding: '30px',
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '30px',
          fontSize: '28px'
        }}>
          🕐 Cron Job Testing
        </h1>

        <div style={{
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '15px'
          }}>
            📅 Current Cron Schedule:
          </h3>
          <ul style={{
            color: darkMode ? '#b0b0b0' : '#666',
            lineHeight: '1.8'
          }}>
            <li><strong>Weekly Metrics:</strong> Sundays at 9:00 AM</li>
            <li><strong>Monthly Metrics:</strong> 1st of month at 9:00 AM</li>
            <li><strong>Inactive Reminders:</strong> Mondays at 10:00 AM</li>
          </ul>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => runTest('weekly-metrics')}
            disabled={isRunning}
            style={{
              padding: '20px',
              backgroundColor: isRunning ? (darkMode ? '#1b5e20' : '#a5d6a7') : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isRunning ? 'default' : 'pointer',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            📊 Test Weekly Metrics
          </button>

          <button
            onClick={() => runTest('monthly-metrics')}
            disabled={isRunning}
            style={{
              padding: '20px',
              backgroundColor: isRunning ? (darkMode ? '#1565c0' : '#90caf9') : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isRunning ? 'default' : 'pointer',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            📈 Test Monthly Metrics
          </button>

          <button
            onClick={() => runTest('inactive-reminders')}
            disabled={isRunning}
            style={{
              padding: '20px',
              backgroundColor: isRunning ? (darkMode ? '#e65100' : '#ffcc80') : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isRunning ? 'default' : 'pointer',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            📧 Test Inactive Reminders
          </button>
        </div>

        {isRunning && (
          <div style={{
            padding: '20px',
            backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : '#e3f2fd',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              color: darkMode ? '#90caf9' : '#1976d2',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              🔄 Running test... Please wait
            </div>
          </div>
        )}

        {testResults && (
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '15px'
            }}>
              📋 Test Results:
            </h3>

            {testResults.error ? (
              <div style={{
                padding: '15px',
                backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
                color: '#f44336',
                borderRadius: '4px'
              }}>
                ❌ Error: {testResults.error}
              </div>
            ) : (
              <div>
                <div style={{
                  color: darkMode ? '#4caf50' : '#2e7d32',
                  fontWeight: '500',
                  marginBottom: '15px'
                }}>
                  ✅ {testResults.message}
                </div>

                {testResults.results && (
                  <div style={{
                    backgroundColor: darkMode ? '#1e1e1e' : 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
                  }}>
                    <h4 style={{
                      color: darkMode ? '#e0e0e0' : '#333',
                      marginBottom: '10px'
                    }}>
                      Results:
                    </h4>
                    
                    {testResults.results.map((result, index) => (
                      <div key={index} style={{
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                        borderRadius: '4px',
                        borderLeft: `4px solid ${
                          result.status === 'sent' ? '#4caf50' :
                          result.status === 'skipped' ? '#ff9800' : '#f44336'
                        }`
                      }}>
                        <div style={{
                          color: darkMode ? '#e0e0e0' : '#333',
                          fontWeight: '500'
                        }}>
                          {result.email}
                        </div>
                        <div style={{
                          color: result.status === 'sent' ? '#4caf50' :
                                result.status === 'skipped' ? '#ff9800' : '#f44336',
                          fontSize: '14px',
                          marginTop: '5px'
                        }}>
                          Status: {result.status}
                          {result.reason && ` - ${result.reason}`}
                          {result.error && ` - ${result.error}`}
                        </div>
                        {result.metrics && (
                          <div style={{
                            color: darkMode ? '#b0b0b0' : '#666',
                            fontSize: '12px',
                            marginTop: '5px'
                          }}>
                            Tests: {result.metrics.testsTaken}, 
                            Avg Score: {result.metrics.averageScore.toFixed(1)}%, 
                            Improvement: {result.metrics.improvement > 0 ? '+' : ''}{result.metrics.improvement.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {testResults.totalInactive !== undefined && (
                  <div style={{
                    marginTop: '15px',
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontSize: '14px'
                  }}>
                    Total inactive users: {testResults.totalInactive}, 
                    Eligible for reminders: {testResults.eligible}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : '#fff3e0',
          borderRadius: '8px',
          border: `1px solid #ff9800`
        }}>
          <h4 style={{
            color: '#f57c00',
            marginBottom: '10px'
          }}>
            ⚠️ Testing Notes:
          </h4>
          <ul style={{
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li>Tests are limited to 5 users maximum for safety</li>
            <li>Only verified users with email notifications enabled will receive emails</li>
            <li>Metrics emails are only sent to users who have taken tests in the period</li>
            <li>Check your email service logs for delivery status</li>
          </ul>
        </div>
      </div>
    </>
  );
} 
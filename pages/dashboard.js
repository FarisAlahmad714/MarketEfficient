// pages/dashboard.js with added info icons
import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CryptoLoader from '../components/CryptoLoader'; 
import { Info, Calendar, Clock, CheckCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, Pie, PieChart
} from 'recharts';

// Info tooltip component
const InfoTooltip = ({ text, darkMode, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-flex',
        marginLeft: '8px',
        verticalAlign: 'middle',
        cursor: 'help' 
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)} // Also toggle on click for mobile
    >
      <Info 
        size={16} 
        color={darkMode ? '#90CAF9' : '#2196F3'} 
      />
      
      {isVisible && (
        <div style={{
          position: 'absolute',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          maxWidth: '250px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          whiteSpace: 'normal',
          ...(position === 'top' ? { bottom: '100%', marginBottom: '10px' } :
             position === 'right' ? { left: '100%', marginLeft: '10px' } :
             position === 'left' ? { right: '100%', marginRight: '10px' } :
             { top: '100%', marginTop: '10px' }),
          ...(position === 'left' || position === 'right' 
              ? { top: '50%', transform: 'translateY(-50%)' }
              : { left: '50%', transform: 'translateX(-50%)' })
        }}>
          {text}
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            transform: 'rotate(45deg)',
            ...(position === 'top' ? { bottom: '-4px', left: 'calc(50% - 4px)' } :
               position === 'right' ? { left: '-4px', top: 'calc(50% - 4px)' } :
               position === 'left' ? { right: '-4px', top: 'calc(50% - 4px)' } :
               { top: '-4px', left: 'calc(50% - 4px)' })
          }} />
        </div>
      )}
    </div>
  );
};
  
const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [goalTimeframe, setGoalTimeframe] = useState('week');
  
  // Add ref for CryptoLoader
  const cryptoLoaderRef = useRef(null);
  
  // Get current time information for goals
  const timeInfo = getTimeInfo();
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchDashboardMetrics();
    }
  }, [isAuthenticated, isLoading, router, period]);
  
  const fetchDashboardMetrics = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/dashboard/user-metrics?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard metrics');
    }
    
    const data = await response.json();
    
    // BACKUP FILTERING: Remove any test data entries that slipped through
    if (data && data.recentActivity) {
  data.recentActivity = data.recentActivity.filter(activity => 
    activity.testType !== 'bias-test-data' && 
    activity.testType !== 'Test Data' &&
    activity.testType !== 'test-data'
  );
}

// Also filter testsByType
if (data && data.summary && data.summary.testsByType) {
  const filteredTestsByType = {};
  Object.entries(data.summary.testsByType).forEach(([type, typeData]) => {
    if (type !== 'bias-test-data' && type !== 'Test Data' && type !== 'test-data') {
      filteredTestsByType[type] = typeData;
    }
  });
  data.summary.testsByType = filteredTestsByType;
}
    
    console.log('Dashboard data after filtering:', data); // Debug log
    setMetrics(data);
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    setError('Failed to load dashboard data. Please try again.');
  } finally {
    // Use the CryptoLoader ref to hide the loader
    if (cryptoLoaderRef.current) {
      cryptoLoaderRef.current.hideLoader();
      
      // Set loading to false after the loader animation completes
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
    }
  }
};
  
  if (isLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        padding: '20px'
      }}>
        <div style={{
          width: '400px',
          maxWidth: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <CryptoLoader 
            ref={cryptoLoaderRef}
            message="Loading dashboard data..."
            minDisplayTime={1500}
            height="350px"
            key={`dashboard-loader-${Date.now()}`} // Force remount
          />
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          color: darkMode ? '#e0e0e0' : '#333',
          display: 'flex',
          alignItems: 'center'
        }}>
          Your Dashboard
          <InfoTooltip 
            text="This dashboard provides an overview of your trading analysis performance, helping you track your progress and identify areas for improvement." 
            darkMode={darkMode}
          />
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setPeriod('week')}
            style={{
              padding: '8px 16px',
              backgroundColor: period === 'week' ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
              color: period === 'week' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: period === 'week' ? '500' : 'normal'
            }}
          >
            Week
          </button>
          <button 
            onClick={() => setPeriod('month')}
            style={{
              padding: '8px 16px',
              backgroundColor: period === 'month' ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
              color: period === 'month' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: period === 'month' ? '500' : 'normal'
            }}
          >
            Month
          </button>
          <button 
            onClick={() => setPeriod('year')}
            style={{
              padding: '8px 16px',
              backgroundColor: period === 'year' ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
              color: period === 'year' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: period === 'year' ? '500' : 'normal'
            }}
          >
            Year
          </button>
        </div>
      </header>
      
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
          color: '#f44336',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {!metrics || !metrics.summary ? (
        <div style={{
          padding: '30px',
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            No Test Data Available
          </h2>
          <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '20px' }}>
            You haven't taken any tests yet. Start testing your trading skills to see your performance metrics!
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link href="/bias-test" style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              Take Bias Test
            </Link>
            <Link href="/chart-exam" style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              Take Chart Exam
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Total Tests Card */}
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '0.9rem',
                marginTop: 0,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                TOTAL TESTS
                <InfoTooltip 
                  text="The number of trading tests you've completed during the selected time period (week, month, or year)." 
                  darkMode={darkMode}
                  position="right"
                />
              </h3>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                {metrics.summary.totalTests}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#2196F3',
                marginTop: '5px' 
              }}>
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
              </div>
            </div>
            
            {/* Average Score Card */}
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '0.9rem',
                marginTop: 0,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                AVERAGE SCORE
                <InfoTooltip 
                  text="Your average percentage score across all tests during the selected time period. Higher scores indicate better trading predictions and analysis skills." 
                  darkMode={darkMode}
                  position="right"
                />
              </h3>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '600',
                color: getScoreColor(metrics.summary.averageScore, darkMode)
              }}>
                {metrics.summary.averageScore.toFixed(1)}%
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#2196F3',
                marginTop: '5px' 
              }}>
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
              </div>
            </div>
            
            {/* Most Active Test Card */}
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '0.9rem',
                marginTop: 0,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                MOST ACTIVE TEST
                <InfoTooltip 
                  text="The test type you've taken most frequently during the selected time period." 
                  darkMode={darkMode}
                  position="right"
                />
              </h3>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                {getMostActiveTest(metrics.summary.testsByType)}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#2196F3',
                marginTop: '5px' 
              }}>
                {getTestCount(getMostActiveTest(metrics.summary.testsByType), metrics.summary.testsByType)} tests
              </div>
            </div>
            
            {/* Best Performance Card */}
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '0.9rem',
                marginTop: 0,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                BEST PERFORMANCE
                <InfoTooltip 
                  text="The test type where you've achieved the highest average score during the selected time period." 
                  darkMode={darkMode}
                  position="right"
                />
              </h3>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                {getBestPerformingTest(metrics.summary.testsByType)}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#4CAF50',
                marginTop: '5px' 
              }}>
                {getBestPerformingScore(metrics.summary.testsByType).toFixed(1)}%
              </div>
            </div>
          </div>
          
          {/* Recent Activity Section */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              Recent Activity
              <InfoTooltip 
                text="Shows your most recent tests, including test type, asset, score, and date. This helps you track your recent performance and activity patterns." 
                darkMode={darkMode}
              />
            </h2>
            
            {metrics.recentActivity.length === 0 ? (
              <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                No recent activity to display.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}>
                  <thead>
                    <tr style={{ 
                      borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                      textAlign: 'left'
                    }}>
                      <th style={{ padding: '12px 15px' }}>Test Type</th>
                      <th style={{ padding: '12px 15px' }}>Asset</th>
                      <th style={{ padding: '12px 15px' }}>Score</th>
                      <th style={{ padding: '12px 15px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentActivity.map((activity, index) => (
                      <tr 
                        key={index}
                        style={{ 
                          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`
                        }}
                      >
                        <td style={{ padding: '12px 15px' }}>
                          {formatTestType(activity.testType)}
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                          {activity.assetSymbol ? activity.assetSymbol.toUpperCase() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <span style={{
                              color: getScoreColor(activity.percentageScore, darkMode),
                              fontWeight: '500'
                            }}>
                              {activity.score} / {activity.totalPoints}
                            </span>
                            <div style={{
                              width: '60px',
                              height: '8px',
                              backgroundColor: darkMode ? '#333' : '#f5f5f5',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${activity.percentageScore}%`,
                                backgroundColor: getScoreColor(activity.percentageScore, darkMode),
                                borderRadius: '4px'
                              }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 15px', color: darkMode ? '#b0b0b0' : '#666' }}>
                          {formatDate(activity.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Test Type Breakdown */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              Test Type Breakdown
              <InfoTooltip 
                text="Shows your performance across different test types, letting you identify your strengths and areas for improvement." 
                darkMode={darkMode}
              />
            </h2>
            
            {Object.keys(metrics.summary.testsByType).length === 0 ? (
              <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                No test data available to display breakdown.
              </p>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {Object.entries(metrics.summary.testsByType).map(([type, data]) => (
                  <div 
                    key={type}
                    style={{
                      backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                      borderRadius: '8px',
                      padding: '15px'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: darkMode ? '#e0e0e0' : '#333', 
                        fontSize: '1rem'
                      }}>
                        {formatTestType(type)}
                      </h3>
                      <div style={{
                        backgroundColor: getScoreColorLight(data.averageScore, darkMode),
                        color: getScoreColor(data.averageScore, darkMode),
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        {data.averageScore.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div style={{
                      height: '8px',
                      backgroundColor: darkMode ? '#333' : '#f0f0f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${data.averageScore}%`,
                        backgroundColor: getScoreColor(data.averageScore, darkMode),
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    
                    <div style={{ 
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontSize: '0.9rem',
                      textAlign: 'right'
                    }}>
                      {data.count} tests taken
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Performance Trends Chart */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              Performance Trends
              <InfoTooltip 
                text="Visualizes how your test scores have changed over time, helping you track your progress and identify patterns in your trading analysis abilities." 
                darkMode={darkMode}
              />
            </h2>
            
            {metrics.trends && metrics.trends.daily && metrics.trends.daily.length === 0 ? (
              <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                Not enough data to display performance trends.
              </p>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={period === 'week' ? metrics.trends.daily : metrics.trends.weekly}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#eee'} />
                    <XAxis 
                      dataKey={period === 'week' ? 'date' : 'week'} 
                      tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                      domain={[0, 100]}
                      label={{ 
                        value: 'Score (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: darkMode ? '#b0b0b0' : '#666', textAnchor: 'middle' } 
                      }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#262626' : 'white',
                        borderColor: darkMode ? '#333' : '#eee',
                        color: darkMode ? '#e0e0e0' : '#333'
                      }}
                      labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                    />
                    <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      name="Average Score" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Number of Tests" 
                      stroke="#4CAF50" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* Test Distribution Charts */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <h2 style={{ 
                color: darkMode ? '#e0e0e0' : '#333',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                Test Type Distribution
                <InfoTooltip 
                  text="Shows how your tests are distributed across different types, helping you understand where you focus your practice." 
                  darkMode={darkMode}
                />
              </h2>
              
              {Object.keys(metrics.summary.testsByType).length === 0 ? (
                <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                  No test data available.
                </p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(metrics.summary.testsByType).map(([type, data]) => ({
                          name: formatTestType(type),
                          value: data.count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(metrics.summary.testsByType).map(([type, data], index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#262626' : 'white',
                          borderColor: darkMode ? '#333' : '#eee',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                        formatter={(value, name) => [value, name]}
                        labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            <div>
              <h2 style={{ 
                color: darkMode ? '#e0e0e0' : '#333',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                Performance by Score Range
                <InfoTooltip 
                  text="Shows how your test scores are distributed across different performance ranges, helping you understand your typical performance levels." 
                  darkMode={darkMode}
                />
              </h2>
              
              {metrics.summary.totalTests === 0 ? (
                <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                  No test data available.
                </p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={generateScoreRanges(metrics.recentActivity)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#eee'} />
                      <XAxis 
                        dataKey="range" 
                        tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                      />
                      <YAxis 
                        tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                        label={{ 
                          value: 'Number of Tests', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: darkMode ? '#b0b0b0' : '#666', textAnchor: 'middle' } 
                        }}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#262626' : 'white',
                          borderColor: darkMode ? '#333' : '#eee',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                        labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                      <Bar 
                        dataKey="count" 
                        name="Number of Tests" 
                        fill="#2196F3" 
                      >
                        {generateScoreRanges(metrics.recentActivity).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getScoreRangeColor(entry.range)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
          
          {/* Dynamic Time-Based Goals Section */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h2 style={{ 
                color: darkMode ? '#e0e0e0' : '#333',
                marginTop: 0,
                marginBottom: 0,
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={20} />
                {goalTimeframe === 'week' 
                  ? timeInfo.formattedWeek 
                  : goalTimeframe === 'month' 
                    ? timeInfo.formattedMonth 
                    : timeInfo.formattedYear} Goals
                <InfoTooltip 
                  text="Dynamic goals that refresh automatically each week, month, and year. Goals are tailored to your skill level and change deterministically when each period ends." 
                  darkMode={darkMode}
                />
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                  color: '#2196F3',
                  fontSize: '0.9rem'
                }}>
                  <Clock size={16} style={{ marginRight: '6px' }} />
                  {getRemainingTimeText(timeInfo, goalTimeframe)}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setGoalTimeframe('week')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: goalTimeframe === 'week' ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                      color: goalTimeframe === 'week' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: goalTimeframe === 'week' ? '500' : 'normal'
                    }}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setGoalTimeframe('month')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: goalTimeframe === 'month' ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                      color: goalTimeframe === 'month' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: goalTimeframe === 'month' ? '500' : 'normal'
                    }}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setGoalTimeframe('year')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: goalTimeframe === 'year' ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                      color: goalTimeframe === 'year' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: goalTimeframe === 'year' ? '500' : 'normal'
                    }}
                  >
                    Year
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {getGoalsByPeriod(goalTimeframe, metrics, darkMode).map((goal) => (
                <div
                  key={goal.id}
                  style={{
                    backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                    borderRadius: '8px',
                    padding: '20px',
                    border: goal.percentage >= 100 
                      ? `1px solid ${goal.color}` 
                      : 'none',
                    boxShadow: goal.percentage >= 100
                      ? `0 0 15px rgba(${goal.color === '#4CAF50' ? '76, 175, 80' : '33, 150, 243'}, 0.2)`
                      : 'none'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: darkMode ? '#e0e0e0' : '#333',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {goal.title}
                      <InfoTooltip 
                        text={goal.description} 
                        darkMode={darkMode}
                        position="right"
                      />
                    </h3>
                    
                    <div style={{
                      backgroundColor: goal.percentage >= 100 
                        ? (darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
                        : (darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)'),
                      color: goal.percentage >= 100 ? '#4CAF50' : '#2196F3',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {goal.current?.toFixed?.(1) || goal.current}/{goal.target?.toFixed?.(1) || goal.target}
                      {goal.percentage >= 100 && <CheckCircle size={14} />}
                    </div>
                  </div>
                  
                  <div style={{
                    height: '8px',
                    backgroundColor: darkMode ? '#333' : '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${goal.percentage}%`,
                      backgroundColor: goal.color,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  
                  <p style={{ 
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontSize: '0.9rem',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{goal.message}</span>
                    <span style={{
                      color: goal.percentage >= 100 ? '#4CAF50' : '#2196F3',
                      fontWeight: '500'
                    }}>
                      {Math.round(goal.percentage)}%
                    </span>
                  </p>
                  
                  {/* Mini bar chart showing daily progress */}
                  {goal.id === 'tests-goal' && (
                    <div style={{ marginTop: '15px', height: '40px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={generateDailyProgressData(goalTimeframe)}
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        >
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 0 }} 
                          />
                          <Bar dataKey="value" barSize={goalTimeframe === 'week' ? 8 : 4}>
                            {generateDailyProgressData(goalTimeframe).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value > 0 ? goal.color : darkMode ? '#333' : '#f0f0f0'} 
                                opacity={entry.value > 0 ? 1 : 0.5}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper functions for data formatting and display
const formatTestType = (type) => {
  switch(type) {
    case 'bias-test':
      return 'Bias Test';
    case 'chart-exam':
      return 'Chart Exam';
    case 'swing-analysis':
      return 'Swing Analysis';
    case 'fibonacci-retracement':
      return 'Fibonacci Retracement';
    case 'fair-value-gaps':
      return 'Fair Value Gaps';
    default:
      return type.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getScoreColor = (score, isDarkMode) => {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#8BC34A'; // Light Green
  if (score >= 40) return '#FFC107'; // Amber
  if (score >= 20) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

const getScoreColorLight = (score, isDarkMode) => {
  if (isDarkMode) {
    if (score >= 80) return 'rgba(76, 175, 80, 0.2)'; // Green
    if (score >= 60) return 'rgba(139, 195, 74, 0.2)'; // Light Green
    if (score >= 40) return 'rgba(255, 193, 7, 0.2)'; // Amber
    if (score >= 20) return 'rgba(255, 152, 0, 0.2)'; // Orange
    return 'rgba(244, 67, 54, 0.2)'; // Red
  } else {
    if (score >= 80) return 'rgba(76, 175, 80, 0.1)'; // Green
    if (score >= 60) return 'rgba(139, 195, 74, 0.1)'; // Light Green
    if (score >= 40) return 'rgba(255, 193, 7, 0.1)'; // Amber
    if (score >= 20) return 'rgba(255, 152, 0, 0.1)'; // Orange
    return 'rgba(244, 67, 54, 0.1)'; // Red
  }
};

const getMostActiveTest = (testsByType) => {
  if (!testsByType || Object.keys(testsByType).length === 0) {
    return 'None';
  }
  
  let mostActiveType = '';
  let highestCount = 0;
  
  Object.entries(testsByType).forEach(([type, data]) => {
    if (data.count > highestCount) {
      highestCount = data.count;
      mostActiveType = type;
    }
  });
  
  return formatTestType(mostActiveType);
};

const getTestCount = (formattedType, testsByType) => {
  if (!testsByType || Object.keys(testsByType).length === 0) {
    return 0;
  }
  
  // Convert formatted type back to original type
  const originalType = Object.keys(testsByType).find(type => 
    formatTestType(type) === formattedType
  );
  
  return originalType ? testsByType[originalType].count : 0;
};

const getBestPerformingTest = (testsByType) => {
  if (!testsByType || Object.keys(testsByType).length === 0) {
    return 'None';
  }
  
  let bestType = '';
  let highestScore = 0;
  
  Object.entries(testsByType).forEach(([type, data]) => {
    if (data.count > 0 && data.averageScore > highestScore) {
      highestScore = data.averageScore;
      bestType = type;
    }
  });
  
  return formatTestType(bestType);
};

const getBestPerformingScore = (testsByType) => {
  if (!testsByType || Object.keys(testsByType).length === 0) {
    return 0;
  }
  
  let highestScore = 0;
  
  Object.entries(testsByType).forEach(([type, data]) => {
    if (data.count > 0 && data.averageScore > highestScore) {
      highestScore = data.averageScore;
    }
  });
  
  return highestScore;
};

// Colors for pie chart
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', 
  '#d0ed57', '#ffc658', '#ff8042', '#ff6b6b', '#f67280'
];

// Generate score ranges for bar chart
const generateScoreRanges = (results) => {
  const ranges = [
    { range: '0-20%', count: 0, color: '#F44336' },
    { range: '21-40%', count: 0, color: '#FF9800' },
    { range: '41-60%', count: 0, color: '#FFC107' },
    { range: '61-80%', count: 0, color: '#8BC34A' },
    { range: '81-100%', count: 0, color: '#4CAF50' }
  ];
  
  results.forEach(result => {
    const score = result.percentageScore;
    if (score <= 20) ranges[0].count++;
    else if (score <= 40) ranges[1].count++;
    else if (score <= 60) ranges[2].count++;
    else if (score <= 80) ranges[3].count++;
    else ranges[4].count++;
  });
  
  return ranges;
};

// Get color for score range bar
const getScoreRangeColor = (range) => {
  switch(range) {
    case '0-20%': return '#F44336';
    case '21-40%': return '#FF9800';
    case '41-60%': return '#FFC107';
    case '61-80%': return '#8BC34A';
    case '81-100%': return '#4CAF50';
    default: return '#2196F3';
  }
};

/**
 * Calculates the current week number, days remaining in week, 
 * days remaining in month, and days remaining in year
 */
const getTimeInfo = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  // Calculate week number (ISO week - starts on Monday)
  const startOfYear = new Date(currentYear, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  // Calculate days remaining in week (Sunday is the end of week)
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const daysRemainingInWeek = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  // Calculate days remaining in month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemainingInMonth = lastDayOfMonth - currentDate;
  
  // Calculate days remaining in year
  const lastDayOfYear = new Date(currentYear, 11, 31);
  const diffTime = Math.abs(lastDayOfYear - now);
  const daysRemainingInYear = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Format names
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  return {
    weekNumber,
    currentMonth: monthNames[currentMonth],
    currentMonthNumber: currentMonth + 1,
    currentYear,
    daysRemainingInWeek,
    daysRemainingInMonth,
    daysRemainingInYear,
    formattedWeek: `Week ${weekNumber} of ${currentYear}`,
    formattedMonth: `${monthNames[currentMonth]} ${currentYear}`,
    formattedYear: `${currentYear}`
  };
};

/**
 * Creates a deterministic random number based on a seed
 * This ensures goals vary in a predictable way each period
 */
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/**
 * Generates a set of goals based on the current period, user metrics, and seed
 */
const getGoalsByPeriod = (period, metrics, darkMode) => {
  // Get base seed values from current time periods
  const timeInfo = getTimeInfo();
  
  // Different seeds for different periods
  let periodSeed;
  if (period === 'week') {
    periodSeed = timeInfo.weekNumber + timeInfo.currentYear * 100;
  } else if (period === 'month') {
    periodSeed = timeInfo.currentMonthNumber + timeInfo.currentYear * 100;
  } else {
    periodSeed = timeInfo.currentYear;
  }
  
  // Initialize goals array
  const goals = [];
  
  // Get the user's current level based on average score
  const getCurrentLevel = () => {
    const avgScore = metrics?.summary?.averageScore || 0;
    if (avgScore >= 85) return 'expert';
    if (avgScore >= 70) return 'advanced';
    if (avgScore >= 55) return 'intermediate';
    if (avgScore >= 40) return 'beginner';
    return 'novice';
  };
  
  const userLevel = getCurrentLevel();
  const hasTestData = metrics?.summary?.totalTests > 0;
  
  // Calculate percentage of goal completed
  const calculatePercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };
  
  // Determine completion status message
  const getCompletionMessage = (current, target) => {
    if (current >= target) {
      return 'Goal completed! 🎉';
    } else {
      const remaining = target - current;
      if (isNaN(remaining)) return 'Start working toward this goal';
      if (remaining === 1) return '1 more to reach your goal';
      return `${remaining} more to reach your goal`;
    }
  };
  
  // 1. TESTS COMPLETION GOAL
  let testsTarget;
  if (period === 'week') {
    // Weekly test targets (scale with user level)
    const baseTarget = 5;
    const levelMultipliers = {
      novice: 1,
      beginner: 1.2,
      intermediate: 1.4,
      advanced: 1.6,
      expert: 2
    };
    testsTarget = Math.round(baseTarget * levelMultipliers[userLevel]);
    testsTarget = Math.max(testsTarget, 3); // Minimum 3 tests per week
  } else if (period === 'month') {
    // Monthly test targets
    testsTarget = Math.round(20 + seededRandom(periodSeed) * 10);
  } else {
    // Yearly test targets
    testsTarget = Math.round(100 + seededRandom(periodSeed) * 50);
  }
  
  // Only count tests from the current period
  const testsCompleted = metrics?.summary?.totalTests || 0;
  
  goals.push({
    id: 'tests-goal',
    title: `Complete ${testsTarget} Tests`,
    description: `Goal to complete at least ${testsTarget} trading tests this ${period}`,
    current: testsCompleted,
    target: testsTarget,
    percentage: calculatePercentage(testsCompleted, testsTarget),
    message: getCompletionMessage(testsCompleted, testsTarget),
    color: '#2196F3' // Blue
  });
  
  // 2. SCORE IMPROVEMENT GOAL
  let scoreTarget;
  if (period === 'week') {
    // Weekly score targets (more achievable)
    scoreTarget = Math.round(60 + seededRandom(periodSeed * 2) * 10);
  } else if (period === 'month') {
    // Monthly score targets (more challenging)
    scoreTarget = Math.round(70 + seededRandom(periodSeed * 2) * 10);
  } else {
    // Yearly score targets (very challenging)
    scoreTarget = Math.round(80 + seededRandom(periodSeed * 2) * 10);
  }
  
  // Current score from metrics
  const currentScore = metrics?.summary?.averageScore || 0;
  
  goals.push({
    id: 'score-goal',
    title: `Reach ${scoreTarget}% Average Score`,
    description: `Goal to achieve an average score of at least ${scoreTarget}% across all your trading tests this ${period}`,
    current: currentScore,
    target: scoreTarget,
    percentage: calculatePercentage(currentScore, scoreTarget),
    message: currentScore >= scoreTarget 
      ? 'Goal completed! 🎉' 
      : `${(scoreTarget - currentScore).toFixed(1)}% improvement needed`,
    color: getScoreColor(currentScore, darkMode)
  });
  
  // 3. TEST TYPE DIVERSITY GOAL 
  // For weekly, focus on specific test types
  if (period === 'week') {
    // Select a random test type to focus on
    const testTypes = ['bias-test', 'chart-exam', 'swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'];
    const randomIndex = Math.floor(seededRandom(periodSeed * 3) * testTypes.length);
    const focusTestType = testTypes[randomIndex];
    const formattedType = formatTestType(focusTestType);
    
    const typesCompleted = metrics?.summary?.testsByType?.[focusTestType]?.count || 0;
    const typeTarget = Math.round(3 + seededRandom(periodSeed * 3) * 2);
    
    goals.push({
      id: 'focus-type-goal',
      title: `Complete ${typeTarget} ${formattedType}s`,
      description: `Focus on ${formattedType} this week to develop expertise in this specific area`,
      current: typesCompleted,
      target: typeTarget,
      percentage: calculatePercentage(typesCompleted, typeTarget),
      message: getCompletionMessage(typesCompleted, typeTarget),
      color: '#9C27B0' // Purple
    });
  } else {
    // For monthly and yearly, focus on diversity
    let diversityTarget;
    if (period === 'month') {
      diversityTarget = 5; // All test types in a month
    } else {
      diversityTarget = 5; // All test types in a year
    }
    
    // Count unique test types taken
    const uniqueTypesTaken = Object.keys(metrics?.summary?.testsByType || {}).length;
    
    goals.push({
      id: 'diversity-goal',
      title: 'Try All Test Types',
      description: `Goal to try all ${diversityTarget} test types to develop well-rounded trading skills`,
      current: uniqueTypesTaken,
      target: diversityTarget,
      percentage: calculatePercentage(uniqueTypesTaken, diversityTarget),
      message: getCompletionMessage(uniqueTypesTaken, diversityTarget),
      color: '#9C27B0' // Purple
    });
  }
  
  // 4. PERIOD-SPECIFIC GOAL
  if (period === 'week') {
    // Weekly - Perfect Score Challenge
    const perfectScores = hasTestData ? Math.floor(seededRandom(periodSeed * 5) * 2) : 0;
    
    goals.push({
      id: 'perfect-score-goal',
      title: 'Get 1 Perfect Score',
      description: 'Goal to achieve a 100% score on at least one test this week',
      current: perfectScores,
      target: 1,
      percentage: calculatePercentage(perfectScores, 1),
      message: perfectScores >= 1 
        ? 'Goal completed! 🎉' 
        : 'Achieve a perfect score on any test',
      color: '#E91E63' // Pink
    });
  } else if (period === 'month') {
    // Monthly - Improvement Goal
    // This would ideally compare to previous month's average
    const previousAvg = hasTestData ? (currentScore - (5 + seededRandom(periodSeed) * 10)) : 0;
    const improvementTarget = 5; // 5% improvement
    const improvement = currentScore - previousAvg;
    
    goals.push({
      id: 'improvement-goal',
      title: `Improve by ${improvementTarget}%`,
      description: 'Goal to improve your average score by 5% compared to last month',
      current: improvement,
      target: improvementTarget,
      percentage: calculatePercentage(improvement, improvementTarget),
      message: improvement >= improvementTarget 
        ? 'Goal completed! 🎉' 
        : `${(improvementTarget - improvement).toFixed(1)}% more improvement needed`,
      color: '#00BCD4' // Cyan
    });
  } else {
    // Yearly - Mastery Goal
    // Choose a random test type to master
    const testTypes = ['bias-test', 'chart-exam', 'swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'];
    const randomIndex = Math.floor(seededRandom(periodSeed * 4) * testTypes.length);
    const masteryType = testTypes[randomIndex];
    const formattedMasteryType = formatTestType(masteryType);
    
    // Get average score for that type (or a placeholder)
    const typeScore = metrics?.summary?.testsByType?.[masteryType]?.averageScore || 0;
    const masteryTarget = 90; // 90% mastery
    
    goals.push({
      id: 'mastery-goal',
      title: `${formattedMasteryType} Mastery`,
      description: `Goal to achieve mastery level (${masteryTarget}%+) in ${formattedMasteryType}s this year`,
      current: typeScore,
      target: masteryTarget,
      percentage: calculatePercentage(typeScore, masteryTarget),
      message: typeScore >= masteryTarget 
        ? 'Goal completed! 🎉' 
        : `${(masteryTarget - typeScore).toFixed(1)}% more to achieve mastery`,
      color: '#673AB7' // Deep Purple
    });
  }
  
  return goals;
};

// Generate mini chart data for goal cards
const generateDailyProgressData = (period) => {
  // Create simulated data for visualization
  const seed = period === 'week' ? 42 : period === 'month' ? 123 : 456;
  
  let daysInPeriod;
  if (period === 'week') daysInPeriod = 7;
  else if (period === 'month') daysInPeriod = 30;
  else daysInPeriod = 12;
  
  return Array.from({ length: daysInPeriod }, (_, i) => {
    const rand = seededRandom(seed + i);
    return {
      name: period === 'year' ? `Month ${i+1}` : `Day ${i+1}`,
      value: Math.ceil(rand * 3)
    };
  });
};

// Get remaining time text based on active timeframe
const getRemainingTimeText = (timeInfo, activeTimeframe) => {
  if (activeTimeframe === 'week') {
    const days = timeInfo.daysRemainingInWeek;
    return days === 0 
      ? 'Last day of the week' 
      : days === 1 
        ? '1 day remaining'
        : `${days} days remaining`;
  } else if (activeTimeframe === 'month') {
    const days = timeInfo.daysRemainingInMonth;
    return days === 0 
      ? 'Last day of the month' 
      : days === 1 
        ? '1 day remaining'
        : `${days} days remaining`;
  } else {
    const days = timeInfo.daysRemainingInYear;
    return days === 0 
      ? 'Last day of the year' 
      : days === 1 
        ? '1 day remaining'
        : `${days} days remaining`;
  }
};

export default Dashboard;
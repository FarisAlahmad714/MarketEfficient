// pages/dashboard.js
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, Pie, PieChart
} from 'recharts';
  
const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  
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
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (isLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh' 
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: `4px solid ${darkMode ? '#333' : '#f3f3f3'}`,
          borderTop: '4px solid #2196F3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
        <h1 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
          Your Dashboard
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
                marginBottom: '10px'
              }}>
                TOTAL TESTS
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
                marginBottom: '10px'
              }}>
                AVERAGE SCORE
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
                marginBottom: '10px'
              }}>
                MOST ACTIVE TEST
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
                marginBottom: '10px'
              }}>
                BEST PERFORMANCE
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
              fontSize: '1.5rem'
            }}>
              Recent Activity
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
              fontSize: '1.5rem'
            }}>
              Test Type Breakdown
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
              fontSize: '1.5rem'
            }}>
              Performance Trends
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
          
          {/* Skills Radar Chart */}
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
              fontSize: '1.5rem'
            }}>
              Skills Breakdown
            </h2>
            
            {!metrics.testTypeBreakdown || metrics.testTypeBreakdown.length < 2 ? (
              <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                Take more test types to see your skills breakdown.
              </p>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="80%" 
                    data={metrics.testTypeBreakdown.map(item => ({
                      subject: formatTestType(item.type),
                      score: item.averagePercentage,
                      fullMark: 100
                    }))}
                  >
                    <PolarGrid stroke={darkMode ? '#333' : '#eee'} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                    />
                    <Radar 
                      name="Performance" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                    <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#262626' : 'white',
                        borderColor: darkMode ? '#333' : '#eee',
                        color: darkMode ? '#e0e0e0' : '#333'
                      }}
                      labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                    />
                  </RadarChart>
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
                fontSize: '1.5rem'
              }}>
                Test Type Distribution
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
                fontSize: '1.5rem'
              }}>
                Performance by Score Range
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
          
          {/* Monthly Goal Progress */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '1.5rem'
            }}>
              Monthly Goals
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {/* Tests Completed Goal */}
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                borderRadius: '8px',
                padding: '20px'
              }}>
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
                    Complete 20 Tests
                  </h3>
                  
                  <div style={{
                    backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                    color: '#2196F3',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {metrics.summary.totalTests}/20
                  </div>
                </div>
                
                <div style={{
                  height: '8px',
                  backgroundColor: darkMode ? '#333' : '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(metrics.summary.totalTests / 20 * 100, 100)}%`,
                    backgroundColor: '#2196F3',
                    borderRadius: '4px'
                  }}></div>
                </div>
                
                <p style={{ 
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '0.9rem',
                  marginTop: '10px'
                }}>
                  {metrics.summary.totalTests >= 20 
                    ? 'Goal completed! 🎉' 
                    : `${20 - metrics.summary.totalTests} more tests to reach your goal`}
                </p>
              </div>
              
              {/* Average Score Goal */}
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                borderRadius: '8px',
                padding: '20px'
              }}>
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
                    Reach 70% Average Score
                  </h3>
                  
                  <div style={{
                    backgroundColor: getScoreColorLight(metrics.summary.averageScore, darkMode),
                    color: getScoreColor(metrics.summary.averageScore, darkMode),
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {metrics.summary.averageScore.toFixed(1)}%
                  </div>
                </div>
                
                <div style={{
                  height: '8px',
                  backgroundColor: darkMode ? '#333' : '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(metrics.summary.averageScore / 70 * 100, 100)}%`,
                    backgroundColor: getScoreColor(metrics.summary.averageScore, darkMode),
                    borderRadius: '4px'
                  }}></div>
                </div>
                
                <p style={{ 
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '0.9rem',
                  marginTop: '10px'
                }}>
                  {metrics.summary.averageScore >= 70 
                    ? 'Goal completed! 🎉' 
                    : `${(70 - metrics.summary.averageScore).toFixed(1)}% improvement needed`}
                </p>
              </div>
              
              {/* Test Diversity Goal */}
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                borderRadius: '8px',
                padding: '20px'
              }}>
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
                    Try All Test Types
                  </h3>
                  
                  <div style={{
                    backgroundColor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                    color: '#9C27B0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {Object.keys(metrics.summary.testsByType).length}/5
                  </div>
                </div>
                
                <div style={{
                  height: '8px',
                  backgroundColor: darkMode ? '#333' : '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(Object.keys(metrics.summary.testsByType).length / 5 * 100, 100)}%`,
                    backgroundColor: '#9C27B0',
                    borderRadius: '4px'
                  }}></div>
                </div>
                
                <p style={{ 
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '0.9rem',
                  marginTop: '10px'
                }}>
                  {Object.keys(metrics.summary.testsByType).length >= 5 
                    ? 'Goal completed! 🎉' 
                    : `${5 - Object.keys(metrics.summary.testsByType).length} more test types to try`}
                </p>
              </div>
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

export default Dashboard;
// pages/dashboard.js with added info icons
import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CryptoLoader from '../components/CryptoLoader'; 
import { Info, Calendar, Clock, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Create a dynamic dashboard charts component to reduce initial bundle
const DashboardCharts = dynamic(() => import('../components/dashboard/DashboardCharts'), { 
  ssr: false,
  loading: () => <CryptoLoader height="400px" message="Loading dashboard charts..." />
});
import TrackedPage from '../components/TrackedPage';
import logging from '../lib/logger'; // Import your logging utility
import storage from '../lib/storage';
import { generateGoalsForPeriod, getRemainingTimeText } from '../lib/goal-service';

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
    
    const token = await storage.getItem('auth_token');

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
    
    logging.log('Dashboard data after filtering:', data); // Debug log
    setMetrics(data);
  } catch (err) {
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
    <TrackedPage>
    <>
      <div className={`dashboard-page ${darkMode ? 'dark' : 'light'}`}>
        <div className="dashboard-hero">
          {/* Header background inspired by footer's skewed design */}
          <div className="hero-background">
            {/* Skewed background section like footer but inverted */}
            <div className="skewed-overlay"></div>
            
            {/* Beautiful grid pattern matching footer */}
            {darkMode && (
              <div className="grid-pattern"></div>
            )}
            
            {/* Decorative radial gradients like footer */}
            <div className="decorative-circle circle-1"></div>
            <div className="decorative-circle circle-2"></div>
            <div className="decorative-circle circle-3"></div>
            
            {/* Animated shimmer line */}
            <div className="shimmer-divider">
              <div className="shimmer-animation"></div>
            </div>
          </div>
          
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="gradient-text">Your</span>
              <span className="outline-text">Dashboard</span>
            </h1>
            
            <p className="hero-subtitle">
              Track your trading analysis performance and <span className="highlight">identify areas for improvement</span>
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
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
          
          {/* Charts Section */}
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <DashboardCharts 
              metrics={metrics}
              darkMode={darkMode}
              period={period}
              goalTimeframe={goalTimeframe}
            />
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
                  {getRemainingTimeText(goalTimeframe)}
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
              {generateGoalsForPeriod(goalTimeframe, metrics).map((goal) => (
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
                  
                  {/* Mini bar chart showing daily progress - handled by DashboardCharts component */}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: calc(100vh - 140px);
          overflow-x: hidden;
        }
        
        .dashboard-hero {
          position: relative;
          margin-top: -100px;
          padding: 100px 20px 80px;
          overflow: hidden;
        }
        
        /* Hero background - inspired by footer's design */
        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        /* Skewed overlay - inverted version of footer's skew */
        .skewed-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120%;
          transform: skewY(-3deg);
          transform-origin: top right;
          background: ${darkMode ? '#1a1a1a' : '#f8f9fa'};
          z-index: -1;
        }
        
        /* Grid pattern - exact match to footer's grid */
        .grid-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          z-index: 0;
        }
        
        /* Decorative circles - matching footer's radial gradients */
        .decorative-circle {
          position: absolute;
          border-radius: 50%;
          z-index: 0;
        }
        
        .circle-1 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0) 70%);
          top: 20%;
          right: 5%;
        }
        
        .circle-2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0) 70%);
          bottom: 10%;
          left: 10%;
        }
        
        .circle-3 {
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0) 70%);
          top: 60%;
          left: 70%;
        }
        
        /* Shimmer divider - matching footer's animated line */
        .shimmer-divider {
          position: absolute;
          top: 70%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.2) 50%, transparent 100%);
          overflow: hidden;
        }
        
        .shimmer-animation {
          position: absolute;
          width: 100px;
          height: 100%;
          background: linear-gradient(90deg, transparent, #2196F3, transparent);
          animation: shimmer 3s infinite;
          left: -100px;
        }
        
        @keyframes shimmer {
          0% { left: -100px; }
          100% { left: 100%; }
        }
        
        /* Hero content */
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        
        
        /* Hero title */
        .hero-title {
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 900;
          line-height: 1.1;
          margin: 0 0 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2em;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        
        .outline-text {
          color: transparent;
          -webkit-text-stroke: 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .dark .outline-text {
          -webkit-text-stroke-color: rgba(255, 255, 255, 0.2);
        }
        
        .light .outline-text {
          -webkit-text-stroke-color: rgba(0, 0, 0, 0.1);
        }
        
        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          line-height: 1.6;
          margin: 0 auto 40px;
          max-width: 600px;
        }
        
        .dark .hero-subtitle {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .hero-subtitle {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .highlight {
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        @media (max-width: 768px) {
          .dashboard-hero {
            padding: 80px 16px 60px;
            margin-top: -80px;
          }
          
          .hero-title {
            font-size: clamp(2.5rem, 10vw, 4rem);
          }
        }
      `}</style>
    </>
    </TrackedPage>
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

// Goals are now generated using the shared goal service


// Time remaining text is now provided by the shared goal service

export default Dashboard;
// pages/admin/visual-analytics.js - ULTIMATE TRADING PSYCHOLOGY DASHBOARD
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import TrackedPage from '../../components/TrackedPage';
import CryptoLoader from '../../components/CryptoLoader';
import storage from '../../lib/storage';

const VisualAnalyticsDashboard = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    timeframe: 'month',
    testType: '',
    includeImages: true,
    limit: 50
  });

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated && !user?.isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch analytics data
  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetchAnalytics();
    }
  }, [isAuthenticated, user, filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = storage.getItem('auth_token');
      const queryParams = new URLSearchParams({
        timeframe: filters.timeframe,
        includeImages: filters.includeImages.toString(),
        limit: filters.limit.toString(),
        ...(filters.testType && { testType: filters.testType })
      });

      const response = await fetch(`/api/admin/visual-analytics?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Force immediate data refresh when filters change
    setTimeout(() => {
      fetchAnalytics();
    }, 100);
  };

  if (loading) {
    return (
      <TrackedPage>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <CryptoLoader />
          <p style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px' }}>
            🔥 Loading your trading psychology goldmine...
          </p>
        </div>
      </TrackedPage>
    );
  }

  if (error) {
    return (
      <TrackedPage>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
            color: '#f44336',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>⚠️ Analytics Error</h3>
            <p>{error}</p>
            <button 
              onClick={fetchAnalytics}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </TrackedPage>
    );
  }

  return (
    <TrackedPage>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        
        {/* 🔥 HEADER */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            color: darkMode ? '#e0e0e0' : '#333', 
            marginBottom: '10px',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            🧠 Trading Psychology Analytics
          </h1>
          <p style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '16px' }}>
            Visual insights combining user psychology with chart analysis data
          </p>
        </div>

        {/* 🔥 FILTERS */}
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                📅 Timeframe
              </label>
              <select
                value={filters.timeframe}
                onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                🧪 Test Type
              </label>
              <select
                value={filters.testType}
                onChange={(e) => handleFilterChange('testType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}
              >
                <option value="">All Test Types</option>
                <option value="bias-test">Bias Testing</option>
                <option value="chart-exam">Chart Exams</option>
                <option value="fibonacci-retracement">Fibonacci</option>
                <option value="fair-value-gaps">Fair Value Gaps</option>
                <option value="swing-analysis">Swing Analysis</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                📊 Results Limit
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}
              >
                <option value="25">25 Results</option>
                <option value="50">50 Results</option>
                <option value="100">100 Results</option>
                <option value="200">200 Results</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="includeImages"
                checked={filters.includeImages}
                onChange={(e) => handleFilterChange('includeImages', e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <label 
                htmlFor="includeImages" 
                style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🖼️ Include Images
              </label>
            </div>
          </div>
        </div>

        {/* 🔥 QUICK STATS */}
        {data && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="🧠 Psychology Tests"
              value={data.business_metrics?.overview?.total_tests_completed || 0}
              subtitle="Completed tests"
              darkMode={darkMode}
            />
            <StatCard
              title="🖼️ Visual Data"
              value={data.business_metrics?.overview?.total_images_uploaded || 0}
              subtitle="Chart images"
              darkMode={darkMode}
            />
            <StatCard
              title="📊 Avg Performance"
              value={`${(data.business_metrics?.overview?.average_score || 0).toFixed(1)}%`}
              subtitle="Success rate"
              darkMode={darkMode}
            />
            <StatCard
              title="💎 Data Value"
              value={`$${data.business_metrics?.monetization?.estimated_research_value || 0}`}
              subtitle="Research value"
              darkMode={darkMode}
            />
          </div>
        )}

        {/* 🔥 TABS */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            borderBottom: `2px solid ${darkMode ? '#333' : '#eee'}`,
            marginBottom: '20px'
          }}>
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'visual-data', label: '🖼️ Visual Data', icon: '🖼️' },
              { id: 'psychology', label: '🧠 Psychology', icon: '🧠' },
              { id: 'insights', label: '💡 Insights', icon: '💡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === tab.id 
                    ? (darkMode ? '#2196F3' : '#2196F3') 
                    : 'transparent',
                  color: activeTab === tab.id 
                    ? 'white' 
                    : (darkMode ? '#e0e0e0' : '#333'),
                  border: 'none',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🔥 TAB CONTENT */}
        {data && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {activeTab === 'overview' && <OverviewTab data={data} darkMode={darkMode} />}
            {activeTab === 'visual-data' && <VisualDataTab data={data} darkMode={darkMode} />}
            {activeTab === 'psychology' && <PsychologyTab data={data} darkMode={darkMode} />}
            {activeTab === 'insights' && <InsightsTab data={data} darkMode={darkMode} />}
          </div>
        )}

      </div>
    </TrackedPage>
  );
};

// 🔥 STAT CARD COMPONENT
const StatCard = ({ title, value, subtitle, darkMode }) => (
  <div style={{
    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
  }}>
    <h3 style={{ 
      color: darkMode ? '#e0e0e0' : '#333', 
      margin: '0 0 10px 0',
      fontSize: '14px',
      fontWeight: '600'
    }}>
      {title}
    </h3>
    <div style={{ 
      fontSize: '28px', 
      fontWeight: '700', 
      color: '#2196F3',
      margin: '10px 0'
    }}>
      {value}
    </div>
    <p style={{ 
      color: darkMode ? '#b0b0b0' : '#666', 
      margin: 0,
      fontSize: '12px'
    }}>
      {subtitle}
    </p>
  </div>
);

// 🔥 OVERVIEW TAB - Enhanced with Real Business Intelligence
const OverviewTab = ({ data, darkMode }) => {
  const totalValue = data.business_metrics?.monetization?.estimated_research_value || 0;
  const totalTests = data.business_metrics?.overview?.total_tests_completed || 0;
  const totalImages = data.business_metrics?.overview?.total_images_uploaded || 0;
  
  return (
    <div>
      <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
        📊 Trading Psychology Data Overview
      </h2>
      
      {/* Revenue & Value Metrics */}
      <div style={{
        backgroundColor: darkMode ? '#1a2332' : '#f0f7ff',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        border: `2px solid ${darkMode ? '#2196F3' : '#b3d9ff'}`
      }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px' }}>
          💰 Data Monetization Analytics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3', marginBottom: '8px' }}>
              ${totalValue.toLocaleString()}
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Total Research Value
            </div>
            <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
              Psychology Tests: ${(totalTests * 15).toLocaleString()} + Visual Data: ${(totalImages * 25).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50', marginBottom: '8px' }}>
              ${((totalValue / Math.max(totalTests + totalImages, 1))).toFixed(0)}
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Value Per Data Point
            </div>
            <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
              Industry benchmark: $20-40
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#FF9800', marginBottom: '8px' }}>
              {data.business_metrics?.overview?.data_richness_score || 0}
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Data Quality Score
            </div>
            <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
              Out of 1000 (Premium: 800+)
            </div>
          </div>
        </div>
      </div>
    
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Data Sources & Quality */}
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            🔗 Data Infrastructure
          </h3>
          <div style={{ 
            backgroundColor: darkMode ? '#333' : '#f5f5f5',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Psychology Database (MongoDB)</strong>
                <span style={{ 
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {data.data_sources?.mongodb_records || 0} records
                </span>
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>
                Test results, user responses, confidence levels, reasoning data
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Visual Assets (Google Cloud)</strong>
                <span style={{ 
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {data.data_sources?.gcs_metadata_files || 0} files
                </span>
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>
                Chart images, metadata, timestamps, behavioral analytics
              </div>
            </div>
            
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: data.data_sources?.images_available ? 
                (darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9') : 
                (darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee'),
              borderRadius: '6px',
              fontSize: '14px',
              color: data.data_sources?.images_available ? '#4CAF50' : '#f44336'
            }}>
              {data.data_sources?.images_available ? 
                '✅ Full visual dataset available for research' : 
                '⚠️ Visual data limited - enable image collection'
              }
            </div>
          </div>
        </div>

        {/* Research Insights */}
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            🧠 Research Intelligence
          </h3>
          <div style={{ 
            backgroundColor: darkMode ? '#333' : '#f5f5f5',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>User Engagement</span>
                <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                  {data.business_metrics?.engagement?.completion_rate?.toFixed(1) || 0}%
                </span>
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>
                Test completion rate indicates data quality
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>Psychological Insights</span>
                <span style={{ color: '#2196F3', fontWeight: '600' }}>
                  {data.business_metrics?.monetization?.psychological_insights_count || 0}
                </span>
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>
                Detailed responses with confidence and reasoning
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>Avg Questions/Test</span>
                <span style={{ color: '#FF9800', fontWeight: '600' }}>
                  {data.business_metrics?.engagement?.average_questions_per_test?.toFixed(1) || 0}
                </span>
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>
                Data depth indicator for research value
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Type Performance */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
          📈 Test Performance by Category
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '20px' 
        }}>
          {Object.entries(data.business_metrics?.engagement?.tests_by_type || {}).map(([type, count]) => {
            const valuePerType = count * 15; // $15 per test
            const percentage = totalTests > 0 ? (count / totalTests * 100) : 0;
            
            return (
              <div key={type} style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#2196F3', marginBottom: '8px' }}>
                  {count}
                </div>
                <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px', marginBottom: '8px' }}>
                  {percentage.toFixed(1)}% of tests
                </div>
                <div style={{ 
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ${valuePerType.toLocaleString()} value
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 🔥 VISUAL DATA TAB - Enhanced with User-Centric Organization and Timeline
const VisualDataTab = ({ data, darkMode }) => {
  // Group data by user for better organization
  const groupedByUser = React.useMemo(() => {
    if (!data.combined_analytics) return {};
    
    const grouped = {};
    data.combined_analytics
      .filter(item => item.gcs_images && item.gcs_images.length > 0)
      .forEach(item => {
        const userId = item.mongodb_data.user_email || item.mongodb_data.user_name || 'Unknown User';
        if (!grouped[userId]) {
          grouped[userId] = {
            user_info: {
              name: item.mongodb_data.user_name,
              email: item.mongodb_data.user_email
            },
            tests: [],
            total_images: 0,
            total_score: 0,
            total_possible: 0,
            avg_confidence: 0,
            test_dates: []
          };
        }
        
        grouped[userId].tests.push(item);
        grouped[userId].total_images += item.gcs_images.length;
        grouped[userId].total_score += item.mongodb_data.score || 0;
        grouped[userId].total_possible += item.mongodb_data.total_points || 0;
        grouped[userId].avg_confidence += item.psychological_insights.confidence_avg || 0;
        grouped[userId].test_dates.push(new Date(item.mongodb_data.completed_at));
      });
    
    // Calculate averages and sort dates
    Object.values(grouped).forEach(userGroup => {
      userGroup.avg_confidence = userGroup.avg_confidence / userGroup.tests.length;
      userGroup.test_dates.sort((a, b) => a - b); // Sort dates chronologically
      userGroup.date_range = {
        first_test: userGroup.test_dates[0],
        latest_test: userGroup.test_dates[userGroup.test_dates.length - 1],
        span_days: Math.ceil((userGroup.test_dates[userGroup.test_dates.length - 1] - userGroup.test_dates[0]) / (1000 * 60 * 60 * 24))
      };
    });
    
    return grouped;
  }, [data.combined_analytics]);

  return (
    <div>
      <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
        👥 User Journey & Visual Analytics
      </h2>
      
      {Object.keys(groupedByUser).length > 0 ? (
        <div style={{ display: 'grid', gap: '30px' }}>
          {Object.entries(groupedByUser).map(([userId, userGroup], index) => (
            <div key={index} style={{
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
              borderRadius: '16px',
              padding: '30px',
              border: `2px solid ${darkMode ? '#333' : '#e0e0e0'}`,
              boxShadow: darkMode ? '0 8px 25px rgba(0,0,0,0.3)' : '0 8px 25px rgba(0,0,0,0.1)'
            }}>
              
              {/* 🔥 USER HEADER WITH STATS */}
              <div style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '25px',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 5px 0', fontSize: '20px' }}>
                      👤 {userGroup.user_info.name || 'Anonymous User'}
                    </h3>
                    <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0, fontSize: '14px' }}>
                      📧 {userGroup.user_info.email || 'No email provided'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      backgroundColor: '#2196F3',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      {userGroup.tests.length} Tests Completed
                    </div>
                    <div style={{ 
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {userGroup.total_images} Images
                    </div>
                  </div>
                </div>

                {/* 🔥 TIMELINE & PERFORMANCE SUMMARY */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{
                    backgroundColor: darkMode ? '#333' : '#fff',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#2196F3', marginBottom: '5px' }}>
                      {((userGroup.total_score / userGroup.total_possible) * 100).toFixed(1)}%
                    </div>
                    <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                      Overall Accuracy
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: darkMode ? '#333' : '#fff',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#FF9800', marginBottom: '5px' }}>
                      {userGroup.avg_confidence.toFixed(1)}/10
                    </div>
                    <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                      Avg Confidence
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: darkMode ? '#333' : '#fff',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#9C27B0', marginBottom: '5px' }}>
                      {userGroup.date_range.span_days}
                    </div>
                    <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                      Days Active
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: darkMode ? '#333' : '#fff',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#607D8B', marginBottom: '5px' }}>
                      {userGroup.date_range.first_test.toLocaleDateString()}
                    </div>
                    <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                      First Test
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔥 CHRONOLOGICAL TEST TIMELINE */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px', fontSize: '16px' }}>
                  📅 Test Timeline (Chronological Order)
                </h4>
                <div style={{ position: 'relative' }}>
                  {/* Timeline Line */}
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '20px',
                    bottom: '20px',
                    width: '2px',
                    backgroundColor: darkMode ? '#444' : '#ddd'
                  }}></div>
                  
                  {/* Timeline Items */}
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {userGroup.tests
                      .sort((a, b) => new Date(a.mongodb_data.completed_at) - new Date(b.mongodb_data.completed_at))
                      .map((test, testIndex) => (
                        <div key={testIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                          {/* Timeline Dot */}
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            marginTop: '8px',
                            zIndex: 1,
                            border: `3px solid ${darkMode ? '#1a1a1a' : '#ffffff'}`
                          }}></div>
                          
                          {/* Test Content */}
                          <div style={{
                            backgroundColor: darkMode ? '#333' : '#f8f9fa',
                            borderRadius: '8px',
                            padding: '15px',
                            flex: 1,
                            border: `1px solid ${darkMode ? '#555' : '#ddd'}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h5 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0, fontSize: '14px' }}>
                                🧪 {test.mongodb_data.test_type.replace('-', ' ').toUpperCase()} - {test.mongodb_data.asset_symbol}
                              </h5>
                              <span style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                                {new Date(test.mongodb_data.completed_at).toLocaleString()}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                              <span style={{
                                backgroundColor: test.mongodb_data.score / test.mongodb_data.total_points >= 0.7 ? '#4CAF50' : '#FF9800',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                Score: {test.mongodb_data.score}/{test.mongodb_data.total_points}
                              </span>
                              <span style={{
                                backgroundColor: '#607D8B',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                Confidence: {test.psychological_insights.confidence_avg.toFixed(1)}/10
                              </span>
                              <span style={{
                                backgroundColor: '#9C27B0',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {test.gcs_images.length} Images
                              </span>
                            </div>
                            
                            {/* 🔥 MINI IMAGE PREVIEW */}
                            {test.gcs_images.length > 0 && (
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                                gap: '8px',
                                marginTop: '10px'
                              }}>
                                {test.gcs_images.slice(0, 4).map((image, imgIndex) => (
                                  <div key={imgIndex} style={{ position: 'relative' }}>
                                    {image.signed_url ? (
                                      <img 
                                        src={image.signed_url}
                                        alt={`Chart ${imgIndex + 1}`}
                                        style={{
                                          width: '100%',
                                          height: '60px',
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                          border: `1px solid ${darkMode ? '#666' : '#ccc'}`,
                                          cursor: 'pointer'
                                        }}
                                        title={`${image.image_analytics?.image_type || 'Image'} - ${new Date(image.image_analytics?.upload_timestamp || '').toLocaleString()}`}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '100%',
                                        height: '60px',
                                        backgroundColor: darkMode ? '#444' : '#e0e0e0',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        color: darkMode ? '#888' : '#999'
                                      }}>
                                        📷
                                      </div>
                                    )}
                                    
                                    {/* Image Type Badge */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '2px',
                                      left: '2px',
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                      color: 'white',
                                      padding: '1px 4px',
                                      borderRadius: '2px',
                                      fontSize: '8px',
                                      fontWeight: '600'
                                    }}>
                                      {(image.image_analytics?.image_type || 'img').toUpperCase().slice(0,3)}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Show more indicator */}
                                {test.gcs_images.length > 4 && (
                                  <div style={{
                                    width: '100%',
                                    height: '60px',
                                    backgroundColor: darkMode ? '#444' : '#e0e0e0',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    color: darkMode ? '#ccc' : '#666',
                                    fontWeight: '600'
                                  }}>
                                    +{test.gcs_images.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* 🔥 USER INSIGHTS SUMMARY */}
              <div style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#f0f7ff',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${darkMode ? '#444' : '#b3d9ff'}`
              }}>
                <h5 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 10px 0', fontSize: '14px' }}>
                  💡 User Journey Insights
                </h5>
                <div style={{ fontSize: '13px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  {userGroup.tests.length === 1 
                    ? `New user with their first test completed.`
                    : `Engaged user with ${userGroup.tests.length} tests over ${userGroup.date_range.span_days} days. `
                  }
                  {userGroup.avg_confidence >= 7 
                    ? 'Shows high confidence in predictions.' 
                    : userGroup.avg_confidence >= 5 
                    ? 'Moderate confidence levels.' 
                    : 'Lower confidence, may benefit from additional guidance.'
                  }
                  {(userGroup.total_score / userGroup.total_possible) >= 0.7 
                    ? ' Strong performance overall.' 
                    : ' Room for improvement in accuracy.'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: darkMode ? '#b0b0b0' : '#666'
        }}>
          <h3>👥 No User Data Available</h3>
          <p>Enable "Include Images" filter and ensure users have uploaded chart images to see their individual journeys.</p>
        </div>
      )}
    </div>
  );
};

// 🔥 PSYCHOLOGY TAB - Deep Behavioral Analytics
const PsychologyTab = ({ data, darkMode }) => {
  const totalPredictions = data.visual_insights?.user_behavior?.confidence_accuracy_correlation?.length || 0;
  const avgConfidence = totalPredictions > 0 ? 
    data.visual_insights.user_behavior.confidence_accuracy_correlation.reduce((sum, item) => sum + item.confidence, 0) / totalPredictions : 0;
  const overallAccuracy = totalPredictions > 0 ? 
    (data.visual_insights.user_behavior.confidence_accuracy_correlation.filter(item => item.correct).length / totalPredictions) * 100 : 0;
  
  return (
    <div>
      <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
        🧠 Trading Psychology Deep Dive
      </h2>
      
      {/* Psychology Overview */}
      <div style={{
        backgroundColor: darkMode ? '#1a2332' : '#f0f7ff',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        border: `2px solid ${darkMode ? '#2196F3' : '#b3d9ff'}`
      }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px' }}>
          🎯 Behavioral Performance Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3', marginBottom: '8px' }}>
              {avgConfidence.toFixed(1)}/10
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Average User Confidence
            </div>
            <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
              {avgConfidence >= 7 ? 'High confidence traders' : avgConfidence >= 5 ? 'Moderate confidence' : 'Conservative traders'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4CAF50', marginBottom: '8px' }}>
              {overallAccuracy.toFixed(1)}%
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Overall Accuracy Rate
            </div>
            <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
              Across {totalPredictions} total predictions
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FF9800', marginBottom: '8px' }}>
              {Math.abs(avgConfidence * 10 - overallAccuracy).toFixed(1)}
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Confidence-Reality Gap
            </div>
            <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
              {Math.abs(avgConfidence * 10 - overallAccuracy) < 10 ? 'Well calibrated' : 'Overconfident traders'}
            </div>
          </div>
        </div>
      </div>
    
      <div style={{ display: 'grid', gap: '30px' }}>
        
        {/* Confidence vs Accuracy - Enhanced */}
        {data.visual_insights?.user_behavior?.confidence_accuracy_correlation && (
          <div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
              📊 Confidence Calibration Analysis
            </h3>
            <div style={{
              backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '12px',
              padding: '25px',
              border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
            }}>
              <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '20px', fontSize: '16px' }}>
                Analyzing how trader confidence correlates with actual performance across {totalPredictions} predictions:
              </p>
              
              {/* Enhanced visualization */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px', marginBottom: '15px' }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(confidence => {
                    const predictions = data.visual_insights.user_behavior.confidence_accuracy_correlation.filter(
                      item => item.confidence === confidence
                    );
                    const accuracy = predictions.length > 0 
                      ? (predictions.filter(p => p.correct).length / predictions.length) * 100 
                      : 0;
                    const height = Math.max(accuracy * 1.5, 15);
                    const isOverconfident = accuracy < confidence * 10;
                    
                    return (
                      <div key={confidence} style={{ textAlign: 'center' }}>
                        <div style={{
                          height: `${height}px`,
                          backgroundColor: isOverconfident ? '#f44336' : accuracy > 70 ? '#4CAF50' : '#FF9800',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center'
                        }}>
                          {predictions.length > 0 && (
                            <span style={{ 
                              color: 'white', 
                              fontSize: '10px', 
                              fontWeight: '600',
                              marginBottom: '2px'
                            }}>
                              {predictions.length}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666', fontWeight: '600' }}>
                          {confidence}
                        </div>
                        <div style={{ fontSize: '10px', color: darkMode ? '#888' : '#999' }}>
                          {accuracy.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  <span>Confidence Level (1-10)</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#4CAF50', borderRadius: '2px' }}></div>
                      <span>Well Calibrated</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#FF9800', borderRadius: '2px' }}></div>
                      <span>Moderate</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#f44336', borderRadius: '2px' }}></div>
                      <span>Overconfident</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Key Insights */}
              <div style={{
                backgroundColor: darkMode ? '#333' : '#ffffff',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${darkMode ? '#555' : '#ddd'}`
              }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 10px 0', fontSize: '14px' }}>
                  🔍 Psychological Insights
                </h4>
                <ul style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '5px' }}>
                    Traders show {avgConfidence >= 7 ? 'high' : avgConfidence >= 5 ? 'moderate' : 'low'} confidence levels on average
                  </li>
                  <li style={{ marginBottom: '5px' }}>
                    {overallAccuracy >= 70 ? 'Strong' : overallAccuracy >= 50 ? 'Moderate' : 'Weak'} predictive accuracy overall
                  </li>
                  <li style={{ marginBottom: '5px' }}>
                    {Math.abs(avgConfidence * 10 - overallAccuracy) < 10 ? 
                      'Well-calibrated confidence (realistic self-assessment)' : 
                      'Overconfidence bias detected (confidence exceeds actual performance)'
                    }
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* High Confidence Scenarios - Enhanced */}
        {data.visual_insights?.test_patterns?.highest_confidence_scenarios && (
          <div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
              🎯 Peak Confidence Trading Scenarios
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {data.visual_insights.test_patterns.highest_confidence_scenarios.slice(0, 6).map((scenario, index) => (
                <div key={index} style={{
                  backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                  borderRadius: '12px',
                  padding: '20px',
                  border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                  borderLeft: `4px solid ${scenario.correct ? '#4CAF50' : '#f44336'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600', fontSize: '16px' }}>
                        📈 {scenario.asset}
                      </span>
                      <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginTop: '4px' }}>
                        Trading Psychology Case Study #{index + 1}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {scenario.confidence}/10 Confidence
                      </span>
                      <span style={{
                        backgroundColor: scenario.correct ? '#4CAF50' : '#f44336',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {scenario.correct ? '✅ Accurate' : '❌ Incorrect'}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                    {scenario.reasoning}
                  </p>
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: scenario.correct ? 
                      (darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9') : 
                      (darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee'),
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: scenario.correct ? '#4CAF50' : '#f44336'
                  }}>
                    {scenario.correct ? 
                      '💡 High confidence + correct prediction = optimal trading psychology' :
                      '⚠️ High confidence + wrong prediction = overconfidence bias'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning Quality - Enhanced */}
        {data.visual_insights?.user_behavior?.reasoning_complexity && (
          <div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
              📝 Decision-Making Quality Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {Object.entries(data.visual_insights.user_behavior.reasoning_complexity).map(([level, count]) => {
                const totalReasons = Object.values(data.visual_insights.user_behavior.reasoning_complexity).reduce((sum, c) => sum + c, 0);
                const percentage = totalReasons > 0 ? (count / totalReasons * 100) : 0;
                const valuePerReason = level === 'detailed' ? 8 : level === 'moderate' ? 5 : 2;
                
                return (
                  <div key={level} style={{
                    backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                    borderRadius: '12px',
                    padding: '25px',
                    textAlign: 'center',
                    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '36px', fontWeight: '700', color: '#2196F3', marginBottom: '10px' }}>
                      {count}
                    </div>
                    <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>
                      {level.charAt(0).toUpperCase() + level.slice(1)} Reasoning
                    </div>
                    <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px', marginBottom: '12px' }}>
                      {level === 'detailed' ? '200+ characters' : level === 'moderate' ? '100-200 characters' : 'Under 100 characters'}
                    </div>
                    <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px', marginBottom: '8px' }}>
                      {percentage.toFixed(1)}% of responses
                    </div>
                    <div style={{ 
                      backgroundColor: level === 'detailed' ? '#4CAF50' : level === 'moderate' ? '#FF9800' : '#f44336',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ${(count * valuePerReason).toLocaleString()} research value
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: darkMode ? '#333' : '#f5f5f5',
              borderRadius: '8px',
              fontSize: '14px',
              color: darkMode ? '#b0b0b0' : '#666'
            }}>
              💡 <strong>Research Value:</strong> Detailed reasoning provides deeper insights into trader psychology and decision-making patterns, making it more valuable for behavioral finance research.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🔥 INSIGHTS TAB - Advanced Market Intelligence
const InsightsTab = ({ data, darkMode }) => {
  const totalTests = data.business_metrics?.overview?.total_tests_completed || 0;
  const totalImages = data.business_metrics?.overview?.total_images_uploaded || 0;
  const avgScore = data.business_metrics?.overview?.average_score || 0;
  
  return (
    <div>
      <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
        💡 Advanced Trading Intelligence
      </h2>
      
      {/* Market Intelligence Summary */}
      <div style={{
        backgroundColor: darkMode ? '#1a2332' : '#f0f7ff',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        border: `2px solid ${darkMode ? '#2196F3' : '#b3d9ff'}`
      }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px' }}>
          🎯 Market Psychology Intelligence Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`
          }}>
            <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 15px 0', fontSize: '14px' }}>
              🧠 Cognitive Bias Detection
            </h4>
            <ul style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                {avgScore >= 70 ? 'Strong analytical skills detected' : avgScore >= 50 ? 'Moderate bias present' : 'Significant cognitive biases identified'}
              </li>
              <li style={{ marginBottom: '8px' }}>
                Overconfidence bias: {data.visual_insights?.user_behavior?.confidence_accuracy_correlation ? 'Analyzed' : 'Needs more data'}
              </li>
              <li style={{ marginBottom: '8px' }}>
                Pattern recognition: {totalTests >= 50 ? 'Reliable sample' : 'Expanding dataset'}
              </li>
            </ul>
          </div>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`
          }}>
            <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 15px 0', fontSize: '14px' }}>
              📊 Research Applications
            </h4>
            <ul style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                Behavioral finance research: Premium dataset
              </li>
              <li style={{ marginBottom: '8px' }}>
                Trading algorithm training: {totalImages > 0 ? 'Visual + psychological data' : 'Psychological data only'}
              </li>
              <li style={{ marginBottom: '8px' }}>
                Academic publications: {totalTests >= 100 ? 'Publication-ready' : 'Building sample size'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    
      <div style={{ display: 'grid', gap: '30px' }}>
        
        {/* Asset Difficulty Analysis - Enhanced */}
        {data.visual_insights?.test_patterns?.most_challenging_assets && (
          <div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
              📉 Market Complexity Analysis
            </h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {data.visual_insights.test_patterns.most_challenging_assets.map((asset, index) => {
                const difficultyLevel = asset.avg_score < 0.4 ? 'Extremely Challenging' : 
                                      asset.avg_score < 0.6 ? 'Challenging' : 
                                      asset.avg_score < 0.8 ? 'Moderate' : 'Accessible';
                const researchValue = asset.test_count * (1 - asset.avg_score) * 20; // Higher value for more challenging assets
                
                return (
                  <div key={index} style={{
                    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                    borderLeft: `4px solid ${asset.avg_score < 0.5 ? '#f44336' : asset.avg_score < 0.7 ? '#ff9800' : '#4CAF50'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600', fontSize: '18px' }}>
                            📈 {asset.asset}
                          </span>
                          <span style={{
                            backgroundColor: asset.avg_score < 0.5 ? '#f44336' : asset.avg_score < 0.7 ? '#ff9800' : '#4CAF50',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {difficultyLevel}
                          </span>
                        </div>
                        <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
                          {asset.test_count} traders analyzed • {(asset.avg_score * 100).toFixed(1)}% success rate
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#2196F3', fontWeight: '600', fontSize: '16px' }}>
                          ${researchValue.toFixed(0)}
                        </div>
                        <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px' }}>
                          Research Value
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      backgroundColor: darkMode ? '#333' : '#ffffff',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '13px',
                      color: darkMode ? '#b0b0b0' : '#666'
                    }}>
                      💡 <strong>Intelligence:</strong> {asset.avg_score < 0.5 ? 
                        'This asset reveals significant market psychology challenges, making it valuable for studying cognitive biases and behavioral patterns.' :
                        asset.avg_score < 0.7 ?
                        'Moderate difficulty suggests this asset tests intermediate trading psychology skills.' :
                        'High success rates indicate this asset pattern is well-understood by traders.'
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Behavioral Patterns - Enhanced */}
        {data.visual_insights?.test_patterns?.common_mistake_patterns && (
          <div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
              🧠 Cognitive Bias Patterns
            </h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {data.visual_insights.test_patterns.common_mistake_patterns.map((mistake, index) => {
                const biasType = mistake.mistake.includes('bull') ? 'Bullish Bias' :
                               mistake.mistake.includes('bear') ? 'Bearish Bias' :
                               mistake.mistake.includes('up') ? 'Optimism Bias' :
                               mistake.mistake.includes('down') ? 'Pessimism Bias' : 'Pattern Bias';
                const severity = mistake.count > 10 ? 'High' : mistake.count > 5 ? 'Moderate' : 'Low';
                
                return (
                  <div key={index} style={{
                    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                    borderLeft: `4px solid ${mistake.count > 10 ? '#f44336' : mistake.count > 5 ? '#ff9800' : '#4CAF50'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600', fontSize: '16px' }}>
                            {biasType}
                          </span>
                          <span style={{
                            backgroundColor: mistake.count > 10 ? '#f44336' : mistake.count > 5 ? '#ff9800' : '#4CAF50',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {severity} Frequency
                          </span>
                        </div>
                        <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
                          Pattern: {mistake.mistake.replace('_vs_', ' → ').replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#f44336', fontWeight: '600', fontSize: '18px' }}>
                          {mistake.count}
                        </div>
                        <div style={{ color: darkMode ? '#888' : '#999', fontSize: '12px' }}>
                          Occurrences
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      backgroundColor: darkMode ? '#333' : '#ffffff',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '13px',
                      color: darkMode ? '#b0b0b0' : '#666'
                    }}>
                      💡 <strong>Research Value:</strong> This bias pattern indicates {mistake.count > 10 ? 
                        'systematic cognitive errors that could be valuable for behavioral finance research and bias correction algorithms.' :
                        mistake.count > 5 ?
                        'moderate bias tendencies worth monitoring for trading psychology insights.' :
                        'occasional bias occurrences within normal trading psychology variance.'
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Intelligence - Enhanced */}
        {data.visual_insights?.upload_patterns?.peak_activity_hours && (
          <div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
              ⏰ Behavioral Timing Intelligence
            </h3>
            <div style={{
              backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '12px',
              padding: '25px',
              border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
            }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 15px 0', fontSize: '16px' }}>
                  Trading Activity Patterns
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '4px', marginBottom: '15px' }}>
                  {Array.from({length: 24}, (_, hour) => {
                    const hourData = data.visual_insights.upload_patterns.peak_activity_hours.find(h => h.hour === hour);
                    const uploads = hourData?.uploads || 0;
                    const maxUploads = Math.max(...data.visual_insights.upload_patterns.peak_activity_hours.map(h => h.uploads));
                    const height = maxUploads > 0 ? Math.max((uploads / maxUploads) * 80, 5) : 5;
                    const isMarketHours = hour >= 9 && hour <= 16;
                    const isPeakActivity = uploads === maxUploads && uploads > 0;
                    
                    return (
                      <div key={hour} style={{ textAlign: 'center' }}>
                        <div style={{
                          height: `${height}px`,
                          backgroundColor: isPeakActivity ? '#f44336' : isMarketHours ? '#2196F3' : '#999',
                          borderRadius: '2px',
                          marginBottom: '8px',
                          position: 'relative'
                        }} title={`${hour}:00 - ${uploads} activities`}>
                        </div>
                        <div style={{ fontSize: '9px', color: darkMode ? '#b0b0b0' : '#666', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                          {hour.toString().padStart(2, '0')}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666', marginBottom: '20px' }}>
                  <span>Trading Activity by Hour (24h)</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#2196F3', borderRadius: '2px' }}></div>
                      <span>Market Hours</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#f44336', borderRadius: '2px' }}></div>
                      <span>Peak Activity</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Insights */}
              <div style={{
                backgroundColor: darkMode ? '#333' : '#ffffff',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${darkMode ? '#555' : '#ddd'}`
              }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 10px 0', fontSize: '14px' }}>
                  🔍 Behavioral Intelligence
                </h4>
                <ul style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '5px' }}>
                    Peak trading psychology activity occurs during {data.visual_insights.upload_patterns.peak_activity_hours[0]?.hour || 'unknown'} hour
                  </li>
                  <li style={{ marginBottom: '5px' }}>
                    Activity patterns suggest {'market hours correlation' || 'after-hours analysis preference'}
                  </li>
                  <li style={{ marginBottom: '5px' }}>
                    Behavioral timing data valuable for understanding trader engagement cycles
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualAnalyticsDashboard;
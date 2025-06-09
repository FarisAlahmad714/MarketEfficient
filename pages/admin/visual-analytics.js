// pages/admin/visual-analytics.js - ULTIMATE TRADING PSYCHOLOGY DASHBOARD
import { useState, useEffect, useContext } from 'react';
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

// 🔥 OVERVIEW TAB
const OverviewTab = ({ data, darkMode }) => (
  <div>
    <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
      📊 Analytics Overview
    </h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
      
      {/* Data Sources */}
      <div>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
          🔗 Data Sources
        </h3>
        <div style={{ 
          backgroundColor: darkMode ? '#333' : '#f5f5f5',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>MongoDB Records:</strong>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666', marginLeft: '10px' }}>
              {data.data_sources?.mongodb_records || 0}
            </span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>GCS Metadata Files:</strong>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666', marginLeft: '10px' }}>
              {data.data_sources?.gcs_metadata_files || 0}
            </span>
          </div>
          <div>
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Images Available:</strong>
            <span style={{ 
              color: data.data_sources?.images_available ? '#4CAF50' : '#f44336',
              marginLeft: '10px',
              fontWeight: '600'
            }}>
              {data.data_sources?.images_available ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
          💼 Business Metrics
        </h3>
        <div style={{ 
          backgroundColor: darkMode ? '#333' : '#f5f5f5',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Data Richness Score:</strong>
            <span style={{ color: '#2196F3', marginLeft: '10px', fontWeight: '600' }}>
              {data.business_metrics?.overview?.data_richness_score || 0}/1000
            </span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Completion Rate:</strong>
            <span style={{ color: '#4CAF50', marginLeft: '10px' }}>
              {data.business_metrics?.engagement?.completion_rate?.toFixed(1) || 0}%
            </span>
          </div>
          <div>
            <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Premium Data Points:</strong>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666', marginLeft: '10px' }}>
              {data.business_metrics?.monetization?.premium_data_points || 0}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Test Distribution */}
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
        📈 Test Type Distribution
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px' 
      }}>
        {Object.entries(data.business_metrics?.engagement?.tests_by_type || {}).map(([type, count]) => (
          <div key={type} style={{
            backgroundColor: darkMode ? '#333' : '#f5f5f5',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#2196F3' }}>
              {count}
            </div>
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
              {type.replace('-', ' ').toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 🔥 VISUAL DATA TAB
const VisualDataTab = ({ data, darkMode }) => (
  <div>
    <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
      🖼️ Visual Data Gallery
    </h2>
    
    {data.combined_analytics && data.combined_analytics.length > 0 ? (
      <div style={{ display: 'grid', gap: '20px' }}>
        {data.combined_analytics
          .filter(item => item.gcs_images && item.gcs_images.length > 0)
          .slice(0, 10) // Show first 10 entries with images
          .map((item, index) => (
            <div key={index} style={{
              backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
            }}>
              {/* Test Info */}
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: '0 0 5px 0' }}>
                  👤 {item.mongodb_data.user_name} - {item.mongodb_data.test_type.toUpperCase()}
                </h4>
                <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0, fontSize: '14px' }}>
                  📈 {item.mongodb_data.asset_symbol} | 
                  🎯 Score: {item.mongodb_data.score}/{item.mongodb_data.total_points} |
                  🧠 Confidence: {item.psychological_insights.confidence_avg.toFixed(1)}/10
                </p>
              </div>

              {/* Images Gallery */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '15px' 
              }}>
                {item.gcs_images.map((image, imgIndex) => (
                  <div key={imgIndex} style={{
                    backgroundColor: darkMode ? '#333' : '#fff',
                    borderRadius: '8px',
                    padding: '10px',
                    border: `1px solid ${darkMode ? '#555' : '#ddd'}`
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ 
                        backgroundColor: '#2196F3',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {image.image_analytics?.image_type || 'Unknown'}
                      </span>
                    </div>
                    
                    {image.signed_url ? (
                      <div>
                        <img 
                          src={image.signed_url}
                          alt={`${image.image_analytics?.image_type || 'Chart'} image`}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: `1px solid ${darkMode ? '#555' : '#ddd'}`
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{ 
                          display: 'none',
                          padding: '20px',
                          textAlign: 'center',
                          color: darkMode ? '#b0b0b0' : '#666',
                          backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                          borderRadius: '6px'
                        }}>
                          🖼️ Image temporarily unavailable
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '20px',
                        textAlign: 'center',
                        color: darkMode ? '#b0b0b0' : '#666',
                        backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                        borderRadius: '6px'
                      }}>
                        🔗 No signed URL available
                      </div>
                    )}
                    
                    <div style={{ marginTop: '10px', fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666' }}>
                      📅 {new Date(image.image_analytics?.upload_timestamp || '').toLocaleString()}
                      <br />
                      📁 {(image.storage_details?.file_size_mb || 0)} MB
                    </div>
                  </div>
                ))}
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
        <h3>🖼️ No Visual Data Available</h3>
        <p>Enable "Include Images" filter and ensure users have uploaded chart images.</p>
      </div>
    )}
  </div>
);

// 🔥 PSYCHOLOGY TAB
const PsychologyTab = ({ data, darkMode }) => (
  <div>
    <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
      🧠 Psychological Insights
    </h2>
    
    <div style={{ display: 'grid', gap: '30px' }}>
      
      {/* High Confidence Scenarios */}
      {data.visual_insights?.test_patterns?.highest_confidence_scenarios && (
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            🎯 High Confidence Predictions
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.visual_insights.test_patterns.highest_confidence_scenarios.slice(0, 5).map((scenario, index) => (
              <div key={index} style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600' }}>
                    📈 {scenario.asset}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{
                      backgroundColor: '#2196F3',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Confidence: {scenario.confidence}/10
                    </span>
                    <span style={{
                      backgroundColor: scenario.correct ? '#4CAF50' : '#f44336',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {scenario.correct ? '✅ Correct' : '❌ Wrong'}
                    </span>
                  </div>
                </div>
                <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0, fontSize: '14px' }}>
                  {scenario.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence vs Accuracy */}
      {data.visual_insights?.user_behavior?.confidence_accuracy_correlation && (
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            📊 Confidence vs Accuracy Analysis
          </h3>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
          }}>
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '15px' }}>
              Analysis of {data.visual_insights.user_behavior.confidence_accuracy_correlation.length} predictions:
            </p>
            
            {/* Simple visualization */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '5px', marginBottom: '15px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(confidence => {
                const predictions = data.visual_insights.user_behavior.confidence_accuracy_correlation.filter(
                  item => item.confidence === confidence
                );
                const accuracy = predictions.length > 0 
                  ? (predictions.filter(p => p.correct).length / predictions.length) * 100 
                  : 0;
                
                return (
                  <div key={confidence} style={{ textAlign: 'center' }}>
                    <div style={{
                      height: `${Math.max(accuracy, 10)}px`,
                      backgroundColor: accuracy > 50 ? '#4CAF50' : '#f44336',
                      borderRadius: '2px',
                      marginBottom: '5px'
                    }}></div>
                    <div style={{ fontSize: '10px', color: darkMode ? '#b0b0b0' : '#666' }}>
                      {confidence}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px', margin: 0 }}>
              Confidence Level (1-10) vs Accuracy Rate
            </p>
          </div>
        </div>
      )}

      {/* Reasoning Complexity */}
      {data.visual_insights?.user_behavior?.reasoning_complexity && (
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            📝 Reasoning Quality Distribution
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {Object.entries(data.visual_insights.user_behavior.reasoning_complexity).map(([level, count]) => (
              <div key={level} style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3', marginBottom: '5px' }}>
                  {count}
                </div>
                <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600', marginBottom: '5px' }}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </div>
                <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                  {level === 'detailed' ? '200+ chars' : level === 'moderate' ? '100-200 chars' : '< 100 chars'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// 🔥 INSIGHTS TAB
const InsightsTab = ({ data, darkMode }) => (
  <div>
    <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px' }}>
      💡 Advanced Insights
    </h2>
    
    <div style={{ display: 'grid', gap: '30px' }}>
      
      {/* Most Challenging Assets */}
      {data.visual_insights?.test_patterns?.most_challenging_assets && (
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            📉 Most Challenging Assets
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.visual_insights.test_patterns.most_challenging_assets.map((asset, index) => (
              <div key={index} style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600' }}>
                    📈 {asset.asset}
                  </span>
                  <span style={{ color: darkMode ? '#b0b0b0' : '#666', marginLeft: '10px' }}>
                    ({asset.test_count} tests)
                  </span>
                </div>
                <div style={{
                  backgroundColor: asset.avg_score < 0.5 ? '#f44336' : asset.avg_score < 0.7 ? '#ff9800' : '#4CAF50',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {(asset.avg_score * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {data.visual_insights?.test_patterns?.common_mistake_patterns && (
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            ❌ Common Mistake Patterns
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.visual_insights.test_patterns.common_mistake_patterns.map((mistake, index) => (
              <div key={index} style={{
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                  {mistake.mistake.replace('_vs_', ' → ')}
                </span>
                <div style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {mistake.count} times
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Patterns */}
      {data.visual_insights?.upload_patterns?.peak_activity_hours && (
        <div>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px' }}>
            ⏰ Peak Activity Hours
          </h3>
          <div style={{
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '5px', marginBottom: '15px' }}>
              {data.visual_insights.upload_patterns.peak_activity_hours.slice(0, 12).map((hour, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{
                    height: `${Math.max((hour.uploads / Math.max(...data.visual_insights.upload_patterns.peak_activity_hours.map(h => h.uploads))) * 60, 5)}px`,
                    backgroundColor: '#2196F3',
                    borderRadius: '2px',
                    marginBottom: '5px'
                  }}></div>
                  <div style={{ fontSize: '10px', color: darkMode ? '#b0b0b0' : '#666' }}>
                    {hour.hour}h
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px', margin: 0 }}>
              Upload activity by hour of day
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default VisualAnalyticsDashboard;
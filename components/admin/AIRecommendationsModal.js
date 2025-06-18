import { useState, useEffect } from 'react';
import CryptoLoader from '../CryptoLoader';
import storage from '../../lib/storage';

const AIRecommendationsModal = ({ recommendation, darkMode, onClose, onEmailCampaign }) => {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDetailData();
  }, [recommendation]);

  const fetchDetailData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = storage.getItem('auth_token');
      
      let endpoint = '';
      switch (recommendation.type) {
        case 'inactive_users':
          endpoint = '/api/admin/recommendations/inactive-users';
          break;
        case 'revenue_change':
          endpoint = '/api/admin/recommendations/revenue-details';
          break;
        case 'timezone_analysis':
          endpoint = '/api/admin/recommendations/timezone-analysis';
          break;
        default:
          throw new Error('Unknown recommendation type');
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch detail data');
      const data = await response.json();
      setDetailData(data);
    } catch (err) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const renderInactiveUsersContent = () => {
    if (!detailData) return null;

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'overview' ? '#2196F3' : 'transparent',
                color: activeTab === 'overview' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'overview' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'users' ? '#2196F3' : 'transparent',
                color: activeTab === 'users' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'users' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              User List ({detailData.inactiveUsers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'analytics' ? '#2196F3' : 'transparent',
                color: activeTab === 'analytics' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'analytics' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#F44336' }}>
                  {detailData.summary?.totalInactive || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Total Inactive Users
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#FF9800' }}>
                  {detailData.summary?.avgDaysInactive || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Avg Days Inactive
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3' }}>
                  {detailData.summary?.withSubscriptions || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  With Active Subscriptions
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>Recommended Actions</h4>
              <ul style={{ color: darkMode ? '#b0b0b0' : '#666', paddingLeft: '20px' }}>
                <li>Send re-engagement email campaign to inactive users</li>
                <li>Offer limited-time discount to users with active subscriptions</li>
                <li>Create personalized content based on their previous test results</li>
                <li>Send educational content about trading psychology</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Days Inactive</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Subscription</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {detailData.inactiveUsers?.map((user, index) => (
                  <tr key={user._id} style={{ 
                    borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                  }}>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>{user.name}</td>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>{user.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>
                      {user.daysInactive}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {user.subscription ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: user.subscription.status === 'active' ? '#28a745' : '#6c757d',
                          color: 'white'
                        }}>
                          {user.subscription.status}
                        </span>
                      ) : (
                        <span style={{ color: darkMode ? '#888' : '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#b0b0b0' : '#666' }}>
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>Inactivity Breakdown</h4>
                {detailData.analytics?.inactivityBreakdown?.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>{item.range}</span>
                    <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>{item.count}</span>
                  </div>
                ))}
              </div>
              
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>Subscription Status</h4>
                {detailData.analytics?.subscriptionBreakdown?.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>{item.status}</span>
                    <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={() => onEmailCampaign('inactive_users', detailData.inactiveUsers)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📧 Create Email Campaign
          </button>
        </div>
      </div>
    );
  };

  const renderTimezoneAnalysisContent = () => {
    if (!detailData) return null;

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'overview' ? '#2196F3' : 'transparent',
                color: activeTab === 'overview' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'overview' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timezones')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'timezones' ? '#2196F3' : 'transparent',
                color: activeTab === 'timezones' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'timezones' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Timezone Data
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#4CAF50' }}>
                  {detailData.topTimezone?.name || 'UTC'}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Top Timezone
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3' }}>
                  {detailData.topTimezone?.userCount || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Users in Top Zone
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#FF9800' }}>
                  {detailData.topTimezone?.avgTestsPerUser || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Avg Tests Per User
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>Timezone-Based Insights</h4>
              <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '10px' }}>
                Users in <strong>{detailData.topTimezone?.name}</strong> show the highest engagement with an average of {detailData.topTimezone?.avgTestsPerUser} tests per user.
              </p>
              <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                Consider scheduling educational content and market analysis during peak hours for this timezone to maximize engagement.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'timezones' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Timezone</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Users</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Total Tests</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Avg Tests/User</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Engagement Score</th>
                </tr>
              </thead>
              <tbody>
                {detailData.timezoneStats?.map((tz, index) => (
                  <tr key={index} style={{ 
                    borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                  }}>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>{tz.timezone}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{tz.userCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{tz.totalTests}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>
                      {tz.avgTestsPerUser.toFixed(1)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '8px',
                        backgroundColor: darkMode ? '#333' : '#ddd',
                        borderRadius: '4px',
                        margin: '0 auto',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${Math.min(100, (tz.avgTestsPerUser / 10) * 100)}%`,
                          height: '100%',
                          backgroundColor: '#4CAF50',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderRevenueContent = () => {
    if (!detailData) return null;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: detailData.revenueChange >= 0 ? '#4CAF50' : '#F44336' }}>
              {detailData.revenueChange >= 0 ? '+' : ''}{detailData.revenueChange}%
            </div>
            <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
              Revenue Change
            </div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3' }}>
              ${detailData.currentRevenue?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
              Current Month
            </div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#FF9800' }}>
              ${detailData.previousRevenue?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
              Previous Month
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>
            {detailData.revenueChange >= 0 ? 'Revenue Growth Analysis' : 'Revenue Decline Analysis'}
          </h4>
          <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
            {detailData.revenueChange >= 0 
              ? `Revenue has increased by ${detailData.revenueChange}% this month. This positive trend suggests successful user acquisition and retention strategies.`
              : `Revenue has decreased by ${Math.abs(detailData.revenueChange)}% this month. Consider implementing retention campaigns and reviewing pricing strategies.`
            }
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <CryptoLoader message="Loading recommendation details..." />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
          color: '#f44336',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      );
    }

    switch (recommendation.type) {
      case 'inactive_users':
        return renderInactiveUsersContent();
      case 'timezone_analysis':
        return renderTimezoneAnalysisContent();
      case 'revenue_change':
        return renderRevenueContent();
      default:
        return <div>Unknown recommendation type</div>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0 }}>
            🤖 {recommendation.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: darkMode ? '#e0e0e0' : '#333',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationsModal;
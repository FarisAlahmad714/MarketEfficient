import { useState, useEffect } from 'react';
import CryptoLoader from '../CryptoLoader';
import storage from '../../lib/storage';

const getFlagEmoji = (countryCode) => {
  const flags = {
    'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹',
    'ES': '🇪🇸', 'NL': '🇳🇱', 'AU': '🇦🇺', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳',
    'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 'RU': '🇷🇺', 'SG': '🇸🇬', 'CH': '🇨🇭'
  };
  return flags[countryCode] || '🌍';
};

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
        case 'geographic_analysis':
          endpoint = '/api/admin/recommendations/geographic-analysis';
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

  const renderGeographicAnalysisContent = () => {
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
              onClick={() => setActiveTab('countries')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'countries' ? '#2196F3' : 'transparent',
                color: activeTab === 'countries' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'countries' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Top Markets
            </button>
            <button
              onClick={() => setActiveTab('regions')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'regions' ? '#2196F3' : 'transparent',
                color: activeTab === 'regions' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'regions' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Regional Data
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'insights' ? '#2196F3' : 'transparent',
                color: activeTab === 'insights' ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: `1px solid ${activeTab === 'insights' ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Business Insights
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
                  {detailData.summary?.topMarket?.country || 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Top Market
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3' }}>
                  {detailData.summary?.totalCountries || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Countries
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#FF9800' }}>
                  {detailData.summary?.totalUsers || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Total Users
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#9C27B0' }}>
                  {detailData.summary?.totalRegions || 0}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  Regions
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>Geographic Distribution Overview</h4>
              <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '10px' }}>
                Your user base spans <strong>{detailData.summary?.totalCountries || 0} countries</strong> across <strong>{detailData.summary?.totalRegions || 0} major regions</strong>.
                {detailData.summary?.topMarket && (
                  <span> <strong>{detailData.summary.topMarket.country}</strong> is your largest market with {detailData.summary.topMarket.percentage}% of users.</span>
                )}
              </p>
              <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                Use this data to guide product localization, regulatory compliance, and market expansion strategies.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'countries' && (
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
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Rank</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Country</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Users</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Share</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Growth Trend</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Market Penetration</th>
                </tr>
              </thead>
              <tbody>
                {detailData.topMarkets?.map((market, index) => (
                  <tr key={index} style={{ 
                    borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                  }}>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600' }}>#{market.rank}</td>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{getFlagEmoji(market.countryCode)}</span>
                        {market.country}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{market.userCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{market.percentage}%</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: market.growthTrend === 'High Growth' ? '#4CAF50' : 
                                       market.growthTrend === 'Growing' ? '#FF9800' : 
                                       market.growthTrend === 'Moderate Growth' ? '#2196F3' : '#757575',
                        color: 'white'
                      }}>
                        {market.growthTrend}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: market.marketPenetration === 'High' ? '#4CAF50' : 
                                       market.marketPenetration === 'Medium' ? '#FF9800' : '#F44336',
                        color: 'white'
                      }}>
                        {market.marketPenetration}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'regions' && (
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
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Region</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Users</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Top Country</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Countries</th>
                </tr>
              </thead>
              <tbody>
                {detailData.regionalDistribution?.map((region, index) => (
                  <tr key={index} style={{ 
                    borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                  }}>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333', fontWeight: '600' }}>{region.region}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{region.userCount}</td>
                    <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                      {region.topCountry.name} ({region.topCountry.userCount})
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{region.countries.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            {detailData.businessInsights?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {detailData.businessInsights.map((insight, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${insight.priority === 'high' ? '#F44336' : insight.priority === 'medium' ? '#FF9800' : '#4CAF50'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        backgroundColor: insight.priority === 'high' ? '#F44336' : insight.priority === 'medium' ? '#FF9800' : '#4CAF50',
                        color: 'white'
                      }}>
                        {insight.priority.toUpperCase()}
                      </span>
                      <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0 }}>{insight.title}</h4>
                    </div>
                    <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '12px' }}>
                      {insight.description}
                    </p>
                    <div style={{ marginTop: '12px' }}>
                      <h5 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '8px' }}>Recommended Actions:</h5>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {insight.actionItems.map((action, actionIndex) => (
                          <li key={actionIndex} style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '4px' }}>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: darkMode ? '#b0b0b0' : '#666'
              }}>
                <p>No specific business insights available yet.</p>
                <p>Insights will appear as your user base grows and geographic patterns emerge.</p>
              </div>
            )}
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
      case 'geographic_analysis':
        return renderGeographicAnalysisContent();
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
        maxHeight: '75vh',
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
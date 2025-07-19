//pages/admin/index.js
import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import AIRecommendationsModal from '../../components/admin/AIRecommendationsModal';
import EmailCampaignModal from '../../components/admin/EmailCampaignModal';
import TrackedPage from '../../components/TrackedPage';
import storage from '../../lib/storage'; // Adjust the path to your storage utility

const AdminPanel = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();

  // Define linkStyle for navigation items
  const linkStyle = {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit', // Inherit color from parent, can be overridden by nested styles
  };

  // Define toolItemStyle for the container of each admin tool link
  const toolItemStyle = {
    padding: '15px 20px',
    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
    borderRadius: '8px',
    border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const cryptoLoaderRef = useRef(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showEmailCampaignModal, setShowEmailCampaignModal] = useState(false);
  const [emailCampaignData, setEmailCampaignData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineStats, setOnlineStats] = useState(null);
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);

  // Define tools for the admin panel
  const tools = [
    { name: 'User Management', description: 'View, edit, and manage users', link: '/admin/users', icon: '👥' },
    { name: 'Sandbox Performance', description: 'Monitor user trading performance and balances', link: '/admin/sandbox-performance', icon: '📊' },
    { name: 'Visual Analytics', description: 'Trading psychology insights with chart data', link: '/admin/visual-analytics', icon: '🧠' },
    { name: 'Financial Analytics', description: 'Monitor revenue and subscriptions', link: '/admin/financial-analytics', icon: '💰' },
    { name: 'Promo Codes', description: 'Create and manage promo codes', link: '/admin/promo-codes', icon: '🎫' },
    { name: 'Feedback Management', description: 'View and respond to user feedback', link: '/admin/feedback', icon: '💬' },
    { name: 'Security Monitoring', description: 'Monitor security events and logs', link: '/admin/security-monitoring', icon: '🛡️' },
    { name: 'Email Automation', description: 'Test and manage cron jobs for emails', link: '/admin/cron-test', icon: '🕐' }
  ];

  // Fetch users
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated && !user?.isAdmin) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
       const token = storage.getItem('auth_token');
        const response = await fetch(`/api/admin/users?page=${page}&search=${search}&includePromoUsage=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setTimeout(() => {
          if (cryptoLoaderRef.current) cryptoLoaderRef.current.hideLoader();
          setTimeout(() => setLoading(false), 500);
        }, 1000);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isAuthenticated, user, router, page, search, refreshKey]);

  // Fetch AI insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setInsightsLoading(true);
        setInsightsError(null);
        const token = storage.getItem('auth_token');
        const response = await fetch('/api/admin/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch insights');
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        setInsightsError(err.message || 'An error occurred');
      } finally {
        setInsightsLoading(false);
      }
    };
    if (isAuthenticated && user?.isAdmin) fetchInsights();
  }, [isAuthenticated, user]);

  // Fetch online users
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      if (!isAuthenticated || !user?.isAdmin) return;
      
      try {
        setOnlineUsersLoading(true);
        const token = storage.getItem('auth_token');
        const response = await fetch('/api/admin/online-users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch online users');
        const data = await response.json();
        setOnlineUsers(data.onlineUsers || []);
        setOnlineStats(data.stats || null);
      } catch (err) {
        console.error('Error fetching online users:', err);
      } finally {
        setOnlineUsersLoading(false);
      }
    };

    fetchOnlineUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Generate AI recommendations based on insights
  const generateRecommendations = (insights) => {
    const recommendations = [];
    if (insights.inactiveUsers > 0) {
      recommendations.push({
        type: 'inactive_users',
        title: 'Re-engage Inactive Users',
        description: `There are ${insights.inactiveUsers} users who haven't logged in for over 30 days. Consider sending a reminder email or offering a special promotion to bring them back.`,
        action: 'View Details',
        actionType: 'modal'
      });
    }
    if (insights.revenueChange < 0) {
      recommendations.push({
        type: 'revenue_change',
        title: 'Address Revenue Decline',
        description: `Revenue has decreased by ${Math.abs(insights.revenueChange)}% compared to last month. Review your pricing strategy or consider offering limited-time discounts to boost sales.`,
        action: 'View Details',
        actionType: 'modal'
      });
    } else if (insights.revenueChange > 0) {
      recommendations.push({
        type: 'revenue_change',
        title: 'Capitalize on Revenue Growth',
        description: `Revenue has increased by ${insights.revenueChange}% compared to last month. Consider investing in marketing or expanding your offerings to maintain this momentum.`,
        action: 'View Details',
        actionType: 'modal'
      });
    }
    // Geographic audience analysis for business intelligence
    if (insights.totalUsers > 0) {
      recommendations.push({
        type: 'geographic_analysis',
        title: 'Geographic Audience Intelligence',
        description: `Analyze your user base by country and region to identify market opportunities, expansion targets, and localization needs.`,
        action: 'View Analysis',
        actionType: 'modal'
      });
    }
    return recommendations;
  };

  const recommendations = insights ? generateRecommendations(insights) : [];

  // Handlers for user actions
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const token = storage.getItem('auth_token');
      const response = await fetch(`/api/admin/users?userId=${userToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setDeleteError(err.message || 'An error occurred while deleting the user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleUserDetailsUpdate = () => {
    setRefreshKey(prev => prev + 1);
    setShowUserDetailsModal(false);
  };

  // Fetch audit trail data
  const fetchAuditTrail = async (page = 1) => {
    try {
      setAuditLoading(true);
      const token = storage.getItem('auth_token');
      const response = await fetch(`/api/admin/audit-trail?page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch audit trail');
      const data = await response.json();
      setAuditData(data);
      setAuditPage(page);
    } catch (err) {
    } finally {
      setAuditLoading(false);
    }
  };

  const handleShowAuditTrail = () => {
    setShowAuditTrail(true);
    if (!auditData) {
      fetchAuditTrail(1);
    }
  };

  // Handle recommendation modal
  const handleRecommendationClick = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowRecommendationModal(true);
  };

  // Handle email campaign creation
  const handleEmailCampaign = (campaignType, targetUsers) => {
    setEmailCampaignData({ campaignType, targetUsers });
    setShowEmailCampaignModal(true);
  };

  // Handle campaign success
  const handleCampaignSuccess = (result) => {
    setShowEmailCampaignModal(false);
    setEmailCampaignData(null);
    // Optionally show a success message
    alert(`Campaign "${result.campaign.name}" created successfully!`);
  };

  return (
    <TrackedPage>
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '30px' }}>Admin Panel</h1>

      {/* Online Users Section */}
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px' }}>
          🟢 User Activity {onlineStats && `(${onlineStats.totalActiveToday} active today)`}
        </h3>
        
        {onlineUsersLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CryptoLoader message="Loading user activity..." />
          </div>
        ) : onlineUsers.length > 0 ? (
          <>
            {/* Group users by activity level */}
            {['active_now', 'active', 'recently_active'].map(statusGroup => {
              const groupUsers = onlineUsers.filter(u => u.status === statusGroup);
              if (groupUsers.length === 0) return null;
              
              const groupLabel = statusGroup === 'active_now' ? '🟢 Active Now' :
                                statusGroup === 'active' ? '🔵 Active Last Hour' :
                                '🟠 Active Today';
              
              return (
                <div key={statusGroup} style={{ marginBottom: '25px' }}>
                  <h4 style={{ 
                    color: darkMode ? '#e0e0e0' : '#333', 
                    fontSize: '14px',
                    marginBottom: '12px',
                    fontWeight: '600'
                  }}>
                    {groupLabel} ({groupUsers.length})
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px'
                  }}>
                    {groupUsers.slice(0, statusGroup === 'recently_active' ? 20 : 10).map((user) => (
                <div key={user._id} style={{
                  padding: '12px 15px',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                  borderRadius: '8px',
                  border: `1px solid ${
                    user.status === 'active_now' ? '#4caf50' :
                    user.status === 'active' ? '#2196f3' : 
                    user.status === 'recently_active' ? '#ff9800' : '#9e9e9e'
                  }`,
                  borderLeft: `4px solid ${
                    user.status === 'active_now' ? '#4caf50' :
                    user.status === 'active' ? '#2196f3' : 
                    user.status === 'recently_active' ? '#ff9800' : '#9e9e9e'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: user.status === 'active_now' ? '#4caf50' :
                                    user.status === 'active' ? '#2196f3' : 
                                    user.status === 'recently_active' ? '#ff9800' : '#9e9e9e',
                    flexShrink: 0
                  }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: darkMode ? '#e0e0e0' : '#333',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.name}
                      {user.isAdmin && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          backgroundColor: '#6f42c1',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>ADMIN</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: darkMode ? '#b0b0b0' : '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: user.status === 'active_now' ? '#4caf50' :
                           user.status === 'active' ? '#2196f3' : 
                           user.status === 'recently_active' ? '#ff9800' : '#9e9e9e',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.statusDisplay}
                  </div>
                </div>
                    ))}
                    {groupUsers.length > (statusGroup === 'recently_active' ? 20 : 10) && (
                      <div style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: darkMode ? '#b0b0b0' : '#666',
                        fontSize: '12px',
                        gridColumn: '1 / -1'
                      }}>
                        +{groupUsers.length - (statusGroup === 'recently_active' ? 20 : 10)} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {false && (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '14px'
              }}>
                And {onlineUsers.length - 12} more users active...
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: darkMode ? '#b0b0b0' : '#666'
          }}>
            No users active in the last 24 hours
          </div>
        )}
        
        {onlineStats && (
          <div style={{
            marginTop: '15px',
            padding: '10px 15px',
            backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : '#e3f2fd',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#2196f3',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📊</span>
            <span>
              {onlineStats.totalOnline} online now • {onlineStats.totalActiveLastHour} active in last hour • {onlineStats.totalActiveToday} active today
            </span>
          </div>
        )}
      </div>

      {/* AI Recommendations Section */}
      {insightsLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <CryptoLoader message="Generating AI insights..." />
        </div>
      ) : insightsError ? (
        <div style={{
          padding: '20px',
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
          color: '#f44336',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {insightsError}
        </div>
      ) : recommendations.length > 0 ? (
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px' }}>
            🤖 AI Recommendations
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{
                padding: '15px',
                backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
              }}>
                <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px', fontSize: '16px' }}>{rec.title}</h4>
                <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '15px', fontSize: '14px' }}>{rec.description}</p>
                {rec.action && (
                  <button
                    onClick={() => handleRecommendationClick(rec)}
                    style={{
                      display: 'inline-block',
                      padding: '8px 15px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {rec.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
          color: darkMode ? '#e0e0e0' : '#333',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          No AI recommendations available at this time.
        </div>
      )}

      {/* Admin Navigation */}
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px' }}>
          🛠️ Admin Tools
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {tools.map((tool, index) => (
            <Link href={tool.link} key={index} style={linkStyle}>
              <div 
                style={{
                  ...toolItemStyle,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#e9ecef';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>{tool.icon}</div>
                <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>{tool.name}</div>
                <p style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666', margin: 0 }}>{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Cron Job Status */}
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '15px', fontSize: '18px' }}>
          📧 Email Automation Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid #4caf50`,
            borderLeft: `4px solid #4caf50`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50', marginRight: '8px' }}></div>
              <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>Weekly Metrics</span>
            </div>
            <div style={{ fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666' }}>Sundays at 9:00 AM</div>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid #2196f3`,
            borderLeft: `4px solid #2196f3`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2196f3', marginRight: '8px' }}></div>
              <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>Monthly Metrics</span>
            </div>
            <div style={{ fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666' }}>1st of month at 9:00 AM</div>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid #ff9800`,
            borderLeft: `4px solid #ff9800`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9800', marginRight: '8px' }}></div>
              <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>Inactive Reminders</span>
            </div>
            <div style={{ fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666' }}>Mondays at 10:00 AM</div>
          </div>
        </div>
        <div style={{
          marginTop: '15px',
          padding: '10px 15px',
          backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#4caf50'
        }}>
          ✅ All automated email jobs are active and scheduled
        </div>
      </div>

      {/* User Management Section */}
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            👥 User Management
          </h3>
          <button
            onClick={handleShowAuditTrail}
            style={{
              padding: '8px 16px',
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 View Audit Trail
          </button>
        </div>
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{
                flex: 1,
                padding: '10px 15px',
                borderRadius: '4px',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333'
              }}
            />
            <button type="submit" style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Search
            </button>
          </form>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <CryptoLoader ref={cryptoLoaderRef} />
          </div>
        ) : error ? (
          <div style={{
            padding: '20px',
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
            color: '#f44336',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: darkMode ? '#1e1e1e' : 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <thead>
                  <tr style={{ backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5', borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}` }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Name</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Email</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Verified</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Admin</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Subscription</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Plan</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Joined</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: darkMode ? '#b0b0b0' : '#666' }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id} style={{ borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}` }}>
                        <td style={{ padding: '15px', color: darkMode ? '#e0e0e0' : '#333' }}>{user.name}</td>
                        <td style={{ padding: '15px', color: darkMode ? '#e0e0e0' : '#333' }}>{user.email}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: user.isVerified ? '#4CAF50' : '#F44336' }}></span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: user.isAdmin ? '#4CAF50' : '#F44336' }}></span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {user.subscription ? (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: user.subscription.status === 'active' ? '#28a745' :
                                              user.subscription.status === 'trialing' ? '#17a2b8' :
                                              user.subscription.status === 'past_due' ? '#ffc107' :
                                              user.subscription.status === 'cancelled' ? '#dc3545' :
                                              user.subscription.status === 'admin_access' ? '#6f42c1' : '#6c757d',
                              color: 'white'
                            }}>
                              {user.subscription.status}
                            </span>
                          ) : (
                            <span style={{ color: darkMode ? '#888' : '#999' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>{user.subscription?.plan || '-'}</td>
                        <td style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#b0b0b0' : '#666' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                            <button style={{
                              padding: '5px 10px',
                              backgroundColor: darkMode ? '#333' : '#f5f5f5',
                              color: darkMode ? '#e0e0e0' : '#333',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }} onClick={() => handleViewUserDetails(user)}>
                              View
                            </button>
                            {!user.isAdmin && (
                              <button style={{
                                padding: '5px 10px',
                                backgroundColor: darkMode ? '#3A1A1A' : '#ffebee',
                                color: '#F44336',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                              }} onClick={() => handleDeleteClick(user)}>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{
                  padding: '8px 15px',
                  backgroundColor: page === 1 ? (darkMode ? '#333' : '#e0e0e0') : (darkMode ? '#2a2a2a' : '#f5f5f5'),
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'default' : 'pointer',
                  opacity: page === 1 ? 0.7 : 1
                }}>
                  Previous
                </button>
                {[...Array(totalPages).keys()].map(i => (
                  <button key={i + 1} onClick={() => setPage(i + 1)} style={{
                    padding: '8px 15px',
                    backgroundColor: page === i + 1 ? '#2196F3' : (darkMode ? '#2a2a2a' : '#f5f5f5'),
                    color: page === i + 1 ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === i + 1 ? 'default' : 'pointer'
                  }}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{
                  padding: '8px 15px',
                  backgroundColor: page === totalPages ? (darkMode ? '#333' : '#e0e0e0') : (darkMode ? '#2a2a2a' : '#f5f5f5'),
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  opacity: page === totalPages ? 0.7 : 1
                }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginTop: 0, marginBottom: '20px' }}>Confirm User Deletion</h3>
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', marginBottom: '20px' }}>
              Are you sure you want to delete the user <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>{userToDelete.name}</strong> with email <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>{userToDelete.email}</strong>?
            </p>
            <p style={{ color: '#F44336', marginBottom: '30px', fontWeight: 500 }}>
              This action cannot be undone. All user data will be permanently deleted.
            </p>
            {deleteError && (
              <div style={{
                padding: '10px 15px',
                backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
                color: '#f44336',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{
                padding: '10px 20px',
                backgroundColor: darkMode ? '#333' : '#e0e0e0',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteLoading} style={{
                padding: '10px 20px',
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: deleteLoading ? 'default' : 'pointer',
                opacity: deleteLoading ? 0.7 : 1
              }}>
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          darkMode={darkMode}
          onClose={() => setShowUserDetailsModal(false)}
          onUpdate={handleUserDetailsUpdate}
        />
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && (
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
            maxWidth: '1200px',
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
              <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0 }}>📋 Admin Audit Trail</h2>
              <button
                onClick={() => setShowAuditTrail(false)}
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
              {auditLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <CryptoLoader message="Loading audit trail..." />
                </div>
              ) : auditData ? (
                <>
                  {/* Summary Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#22C55E' }}>
                        {auditData.summary.total}
                      </div>
                      <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                        Total Actions
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#3B82F6' }}>
                        {auditData.summary.successRate}%
                      </div>
                      <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                        Success Rate
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#F59E0B' }}>
                        {auditData.recentCriticalActions.length}
                      </div>
                      <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                        Critical (24h)
                      </div>
                    </div>
                  </div>

                  {/* Recent Actions Table */}
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
                          <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Time</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Admin</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Action</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Target</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditData.auditTrail.map((action, index) => (
                          <tr key={action._id} style={{ 
                            borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                            backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                          }}>
                            <td style={{ padding: '12px', color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                              {action.timeAgo}
                              <br />
                              <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                {new Date(action.createdAt).toLocaleString()}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                              {action.adminUserId?.name || 'Unknown'}
                              <br />
                              <span style={{ fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666' }}>
                                {action.adminUserId?.email}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                              {action.displayText}
                              {action.description && (
                                <div style={{ fontSize: '12px', color: darkMode ? '#b0b0b0' : '#666', marginTop: '4px' }}>
                                  {action.description}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                backgroundColor: darkMode ? '#333' : '#f0f0f0',
                                textTransform: 'capitalize'
                              }}>
                                {action.targetType}
                              </span>
                              {action.targetIdentifier && (
                                <div style={{ fontSize: '11px', marginTop: '2px', color: darkMode ? '#b0b0b0' : '#666' }}>
                                  {action.targetIdentifier}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: action.success ? '#22C55E' : '#EF4444'
                              }}></span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                backgroundColor: 
                                  action.severity === 'critical' ? '#EF4444' :
                                  action.severity === 'high' ? '#F59E0B' :
                                  action.severity === 'medium' ? '#3B82F6' : '#6B7280',
                                color: 'white'
                              }}>
                                {action.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {auditData.pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                      <button 
                        onClick={() => fetchAuditTrail(auditPage - 1)} 
                        disabled={!auditData.pagination.hasPrev}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: auditData.pagination.hasPrev ? '#8B5CF6' : '#6B7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: auditData.pagination.hasPrev ? 'pointer' : 'default'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ 
                        padding: '8px 12px', 
                        color: darkMode ? '#e0e0e0' : '#333',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        Page {auditData.pagination.currentPage} of {auditData.pagination.totalPages}
                      </span>
                      <button 
                        onClick={() => fetchAuditTrail(auditPage + 1)} 
                        disabled={!auditData.pagination.hasNext}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: auditData.pagination.hasNext ? '#8B5CF6' : '#6B7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: auditData.pagination.hasNext ? 'pointer' : 'default'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#b0b0b0' : '#666' }}>
                  No audit trail data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showRecommendationModal && selectedRecommendation && (
        <AIRecommendationsModal
          recommendation={selectedRecommendation}
          darkMode={darkMode}
          onClose={() => setShowRecommendationModal(false)}
          onEmailCampaign={handleEmailCampaign}
        />
      )}

      {/* Email Campaign Modal */}
      {showEmailCampaignModal && emailCampaignData && (
        <EmailCampaignModal
          campaignType={emailCampaignData.campaignType}
          targetUsers={emailCampaignData.targetUsers}
          darkMode={darkMode}
          onClose={() => {
            setShowEmailCampaignModal(false);
            setEmailCampaignData(null);
          }}
          onSuccess={handleCampaignSuccess}
        />
      )}
    </div>
    </TrackedPage>
  );
};

export default AdminPanel;
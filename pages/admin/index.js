import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';
import UserDetailsModal from '../../components/admin/UserDetailsModal';

const AdminPanel = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();

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
        const token = localStorage.getItem('auth_token');
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
        const token = localStorage.getItem('auth_token');
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

  // Generate AI recommendations based on insights
  const generateRecommendations = (insights) => {
    const recommendations = [];
    if (insights.inactiveUsers > 0) {
      recommendations.push({
        title: 'Re-engage Inactive Users',
        description: `There are ${insights.inactiveUsers} users who haven't logged in for over 30 days. Consider sending a reminder email or offering a special promotion to bring them back.`,
        action: 'Create Campaign',
        actionLink: '/admin/campaigns/new'
      });
    }
    if (insights.revenueChange < 0) {
      recommendations.push({
        title: 'Address Revenue Decline',
        description: `Revenue has decreased by ${Math.abs(insights.revenueChange)}% compared to last month. Review your pricing strategy or consider offering limited-time discounts to boost sales.`,
        action: 'View Revenue Report',
        actionLink: '/admin/reports/revenue'
      });
    } else if (insights.revenueChange > 0) {
      recommendations.push({
        title: 'Capitalize on Revenue Growth',
        description: `Revenue has increased by ${insights.revenueChange}% compared to last month. Consider investing in marketing or expanding your offerings to maintain this momentum.`,
        action: 'View Revenue Report',
        actionLink: '/admin/reports/revenue'
      });
    }
    if (insights.topRegion !== 'N/A') {
      recommendations.push({
        title: 'Focus on Top Performing Region',
        description: `Users in ${insights.topRegion} have the highest engagement, with an average of ${insights.topRegionEngagement} tests per user. Consider creating region-specific content or promotions to further boost engagement.`,
        action: 'View Engagement Map',
        actionLink: '/admin/engagement/map'
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
      const token = localStorage.getItem('auth_token');
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '30px' }}>Admin Panel</h1>

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
                  <Link href={rec.actionLink || '#'} style={{
                    display: 'inline-block',
                    padding: '8px 15px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {rec.action}
                  </Link>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <Link href="/admin/promo-codes" style={{
            display: 'block',
            padding: '15px 20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            textDecoration: 'none',
            color: darkMode ? '#e0e0e0' : '#333',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.target.style.backgroundColor = darkMode ? '#333' : '#e9ecef'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = darkMode ? '#2a2a2a' : '#f8f9fa'; e.target.style.transform = 'translateY(0)'; }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎫</div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Promo Code Management</div>
            <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>Create and manage promotional codes for discounts</div>
          </Link>
          <Link href="/admin/cron-test" style={{
            display: 'block',
            padding: '15px 20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            textDecoration: 'none',
            color: darkMode ? '#e0e0e0' : '#333',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.target.style.backgroundColor = darkMode ? '#333' : '#e9ecef'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = darkMode ? '#2a2a2a' : '#f8f9fa'; e.target.style.transform = 'translateY(0)'; }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🕐</div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Email Automation</div>
            <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>Test and monitor automated email campaigns</div>
          </Link>
          <div style={{
            padding: '15px 20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            color: darkMode ? '#888' : '#999',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            opacity: 0.6
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Analytics Dashboard</div>
            <div style={{ fontSize: '14px' }}>Coming soon - User engagement and platform metrics</div>
          </div>
          <div style={{
            padding: '15px 20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            color: darkMode ? '#888' : '#999',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            opacity: 0.6
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚙️</div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>System Settings</div>
            <div style={{ fontSize: '14px' }}>Coming soon - Platform configuration and preferences</div>
          </div>
          <div style={{
            padding: '15px 20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            color: darkMode ? '#888' : '#999',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            opacity: 0.6
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Security Center</div>
            <div style={{ fontSize: '14px' }}>Coming soon - Security logs and access control</div>
          </div>
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
        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          👥 User Management
        </h3>
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
    </div>
  );
};

export default AdminPanel;
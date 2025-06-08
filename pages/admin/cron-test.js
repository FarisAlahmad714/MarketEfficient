import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
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
  const [showEmailManagement, setShowEmailManagement] = useState(false);
  const [emailData, setEmailData] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    message: '',
    userGroup: 'all',
    scheduledFor: '',
    templateId: '',
    customRecipients: []
  });
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [dryRun, setDryRun] = useState(true);

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
        body: JSON.stringify({ type: testType, dryRun })
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

  const fetchEmailData = async () => {
    try {
      setEmailLoading(true);
      const response = await fetch('/api/admin/email-management', {
        headers: {
          'Authorization': `Bearer ${storage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmailData(data);
      }
    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setEmailLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates', {
        headers: {
          'Authorization': `Bearer ${storage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        filter: 'verified'
      });
      
      const response = await fetch(`/api/admin/users-list?${params}`, {
        headers: {
          'Authorization': `Bearer ${storage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUsersPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleShowEmailManagement = () => {
    setShowEmailManagement(true);
    if (!emailData) {
      fetchEmailData();
    }
    if (templates.length === 0) {
      fetchTemplates();
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBulkEmailData({
        ...bulkEmailData,
        templateId,
        subject: template.subject,
        message: template.message
      });
    } else {
      setBulkEmailData({
        ...bulkEmailData,
        templateId: '',
        subject: '',
        message: ''
      });
    }
  };

  const handleShowUserSelector = () => {
    setShowUserSelector(true);
    if (users.length === 0) {
      fetchUsers();
    }
  };

  const handleUserSelect = (userId) => {
    const updatedUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    setSelectedUsers(updatedUsers);
    setBulkEmailData({
      ...bulkEmailData,
      customRecipients: updatedUsers,
      userGroup: updatedUsers.length > 0 ? 'custom' : 'all'
    });
  };

  const handleSearchUsers = (query) => {
    setUserSearchQuery(query);
    fetchUsers(1, query);
  };

  const sendBulkEmail = async () => {
    try {
      setEmailLoading(true);
      const response = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storage.getItem('auth_token')}`
        },
        body: JSON.stringify(bulkEmailData)
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`Email sent successfully to ${result.sentCount} users`);
        setBulkEmailData({ 
          subject: '', 
          message: '', 
          userGroup: 'all', 
          scheduledFor: '',
          templateId: '',
          customRecipients: []
        });
        setSelectedUsers([]);
        fetchEmailData(); // Refresh email data to show recent activity
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setEmailLoading(false);
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
        <title>Email Automation & Management - Admin</title>
      </Head>
      
      <div style={{
        maxWidth: '1000px',
        margin: '40px auto',
        padding: '30px',
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '28px',
            margin: 0
          }}>
            📧 Email Automation & Management
          </h1>
          <div>
            <Link href="/admin" legacyBehavior>
                <a style={{
                  padding: '10px 20px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  marginRight: '10px'
                }}>
                  ← Back to Admin
                </a>
            </Link>
            <button
              onClick={handleShowEmailManagement}
              style={{
                padding: '10px 20px',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📊 Manage User Emails
            </button>
          </div>
        </div>

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

        {/* Dry Run Toggle */}
        <div style={{
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              margin: '0 0 5px 0'
            }}>
              🧪 Test Mode
            </h4>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              margin: 0,
              fontSize: '14px'
            }}>
              {dryRun ? 'Dry run enabled - no emails will be sent' : 'Live mode - emails will be sent to users'}
            </p>
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span style={{
              color: darkMode ? '#e0e0e0' : '#333',
              fontWeight: '500'
            }}>
              Dry Run
            </span>
          </label>
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

        {/* Email Management Modal */}
        {showEmailManagement && (
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
              maxWidth: '800px',
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
                <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0 }}>📧 User Email Management</h2>
                <button
                  onClick={() => setShowEmailManagement(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
                {emailLoading && !emailData ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Loading email data...</div>
                  </div>
                ) : (
                  <>
                    {/* Email Statistics */}
                    {emailData && (
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
                            {emailData.stats?.totalUsers || 0}
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
                          <div style={{ fontSize: '24px', fontWeight: '600', color: '#3B82F6' }}>
                            {emailData.stats?.verifiedUsers || 0}
                          </div>
                          <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                            Verified Users
                          </div>
                        </div>
                        <div style={{
                          padding: '16px',
                          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '24px', fontWeight: '600', color: '#F59E0B' }}>
                            {emailData.stats?.activeSubscribers || 0}
                          </div>
                          <div style={{ fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                            Active Subscribers
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bulk Email Form */}
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}>
                      <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '16px' }}>
                        📤 Send Bulk Email
                      </h3>
                      
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {/* Email Template Selection */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontWeight: '500'
                          }}>
                            📧 Email Template:
                          </label>
                          <select
                            value={bulkEmailData.templateId}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                              backgroundColor: darkMode ? '#333' : '#fff',
                              color: darkMode ? '#e0e0e0' : '#333'
                            }}
                          >
                            <option value="">Custom Message (No Template)</option>
                            {templates.map(template => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.category})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontWeight: '500'
                          }}>
                            🎯 Target Group:
                          </label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select
                              value={bulkEmailData.userGroup}
                              onChange={(e) => setBulkEmailData({...bulkEmailData, userGroup: e.target.value})}
                              style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '6px',
                                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                                backgroundColor: darkMode ? '#333' : '#fff',
                                color: darkMode ? '#e0e0e0' : '#333'
                              }}
                            >
                              <option value="all">All Verified Users</option>
                              <option value="subscribers">Active Subscribers</option>
                              <option value="free">Free Users</option>
                              <option value="inactive">Inactive Users (30+ days)</option>
                              <option value="custom">Custom Recipients ({selectedUsers.length})</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleShowUserSelector}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              👥 Select Users
                            </button>
                          </div>
                          {selectedUsers.length > 0 && (
                            <div style={{ 
                              marginTop: '8px', 
                              fontSize: '12px', 
                              color: darkMode ? '#b0b0b0' : '#666' 
                            }}>
                              {selectedUsers.length} custom recipient{selectedUsers.length !== 1 ? 's' : ''} selected
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontWeight: '500'
                          }}>
                            Subject:
                          </label>
                          <input
                            type="text"
                            value={bulkEmailData.subject}
                            onChange={(e) => setBulkEmailData({...bulkEmailData, subject: e.target.value})}
                            placeholder="Email subject line"
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                              backgroundColor: darkMode ? '#333' : '#fff',
                              color: darkMode ? '#e0e0e0' : '#333'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontWeight: '500'
                          }}>
                            Message:
                          </label>
                          <textarea
                            value={bulkEmailData.message}
                            onChange={(e) => setBulkEmailData({...bulkEmailData, message: e.target.value})}
                            placeholder="Email message content"
                            rows="6"
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                              backgroundColor: darkMode ? '#333' : '#fff',
                              color: darkMode ? '#e0e0e0' : '#333',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        <button
                          onClick={sendBulkEmail}
                          disabled={!bulkEmailData.subject || !bulkEmailData.message || emailLoading}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: (!bulkEmailData.subject || !bulkEmailData.message || emailLoading) ? '#6B7280' : '#22C55E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: (!bulkEmailData.subject || !bulkEmailData.message || emailLoading) ? 'default' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {emailLoading ? 'Sending...' : '📤 Send Email'}
                        </button>
                      </div>
                    </div>

                    {/* Recent Email Activity */}
                    {emailData?.recentEmails && (
                      <div>
                        <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '16px' }}>
                          📋 Recent Email Activity
                        </h3>
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
                                <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Type</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Recipients</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emailData.recentEmails.map((email, index) => (
                                <tr key={index} style={{ 
                                  borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` 
                                }}>
                                  <td style={{ padding: '12px', color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                                    {new Date(email.sentAt).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                                    {email.type}
                                  </td>
                                  <td style={{ padding: '12px', color: darkMode ? '#e0e0e0' : '#333' }}>
                                    {email.recipientCount}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: '500',
                                      backgroundColor: email.status === 'sent' ? '#22C55E' : '#EF4444',
                                      color: 'white'
                                    }}>
                                      {email.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Selector Modal */}
        {showUserSelector && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.2)'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px',
                borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0 }}>👥 Select Recipients</h3>
                <button
                  onClick={() => setShowUserSelector(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    backgroundColor: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}
                />
              </div>

              {/* Users List */}
              <div style={{ 
                padding: '20px', 
                maxHeight: '400px', 
                overflowY: 'auto' 
              }}>
                {users.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {users.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                          backgroundColor: selectedUsers.includes(user.id)
                            ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                            : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontWeight: '500'
                          }}>
                            {user.name}
                          </div>
                          <div style={{
                            color: darkMode ? '#b0b0b0' : '#666',
                            fontSize: '12px'
                          }}>
                            {user.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {user.isAdmin && (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: '#22C55E',
                              color: 'white'
                            }}>
                              Admin
                            </span>
                          )}
                          {selectedUsers.includes(user.id) && (
                            <span style={{ color: '#3B82F6', fontSize: '16px' }}>✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: darkMode ? '#b0b0b0' : '#666',
                    padding: '40px'
                  }}>
                    No users found
                  </div>
                )}

                {/* Pagination */}
                {usersPagination.totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`
                  }}>
                    <button
                      onClick={() => fetchUsers(usersPagination.currentPage - 1, userSearchQuery)}
                      disabled={!usersPagination.hasPrev}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                        backgroundColor: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#e0e0e0' : '#333',
                        cursor: usersPagination.hasPrev ? 'pointer' : 'default',
                        opacity: usersPagination.hasPrev ? 1 : 0.5
                      }}
                    >
                      Previous
                    </button>
                    <span style={{
                      padding: '6px 12px',
                      color: darkMode ? '#b0b0b0' : '#666'
                    }}>
                      {usersPagination.currentPage} / {usersPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchUsers(usersPagination.currentPage + 1, userSearchQuery)}
                      disabled={!usersPagination.hasNext}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                        backgroundColor: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#e0e0e0' : '#333',
                        cursor: usersPagination.hasNext ? 'pointer' : 'default',
                        opacity: usersPagination.hasNext ? 1 : 0.5
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '20px',
                borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '14px'
                }}>
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </div>
                <button
                  onClick={() => setShowUserSelector(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#22C55E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 
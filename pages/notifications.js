// pages/notifications.js
import React, { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import storage from '../lib/storage';
import { FaBell, FaUser, FaNewspaper, FaTrophy, FaCheckCircle, FaUsers, FaChartLine, FaFilter, FaCheck, FaEllipsisH } from 'react-icons/fa';

const NotificationsPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchNotifications();
  }, [user, filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await storage.getItem('auth_token');
      
      const params = new URLSearchParams({
        type: filter,
        page: page.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || {});
        setUnreadCount(data.unreadCount || 0);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await storage.getItem('auth_token');
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Notify navbar to update notification count
        window.dispatchEvent(new CustomEvent('notificationUpdate'));
      }
    } catch (error) {
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const token = await storage.getItem('auth_token');
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAll: true })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
        
        // Notify navbar to update notification count
        window.dispatchEvent(new CustomEvent('notificationUpdate'));
      }
    } catch (error) {
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow': return FaUser;
      case 'unfollow': return FaUser;
      case 'content_shared': return FaNewspaper;
      case 'achievement_unlocked': return FaTrophy;
      case 'test_milestone': return FaChartLine;
      case 'leaderboard_position': return FaTrophy;
      default: return FaBell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'follow': return '#2196F3';
      case 'content_shared': return '#4CAF50';
      case 'achievement_unlocked': return '#FF9800';
      case 'test_milestone': return '#9C27B0';
      case 'leaderboard_position': return '#F44336';
      default: return '#2196F3';
    }
  };

  const filters = [
    { id: 'all', label: 'All', icon: FaBell },
    { id: 'follow', label: 'Followers', icon: FaUsers },
    { id: 'content_shared', label: 'Content', icon: FaNewspaper },
    { id: 'achievement_unlocked', label: 'Achievements', icon: FaTrophy },
    { id: 'test_milestone', label: 'Tests', icon: FaChartLine }
  ];

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Notifications - ChartSense</title>
        <meta name="description" content="Stay updated with your trading community" />
      </Head>

      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FaBell size={24} style={{ color: '#2196F3' }} />
              <h1 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <div style={{
                  backgroundColor: '#F44336',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {unreadCount}
                </div>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAllRead}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: markingAllRead ? 'not-allowed' : 'pointer',
                  opacity: markingAllRead ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaCheck size={12} />
                {markingAllRead ? 'Marking...' : 'Mark All Read'}
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {filters.map(filterOption => {
              const Icon = filterOption.icon;
              return (
                <button
                  key={filterOption.id}
                  onClick={() => {
                    setFilter(filterOption.id);
                    setPage(1);
                  }}
                  style={{
                    backgroundColor: filter === filterOption.id 
                      ? '#2196F3' 
                      : (darkMode ? '#333' : '#f5f5f5'),
                    color: filter === filterOption.id 
                      ? 'white' 
                      : (darkMode ? '#e0e0e0' : '#333'),
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Icon size={12} />
                  {filterOption.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              color: darkMode ? '#888' : '#666',
              fontSize: '16px'
            }}>
              Loading notifications...
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <FaBell size={48} style={{ 
              color: darkMode ? '#555' : '#999', 
              marginBottom: '16px' 
            }} />
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '12px',
              fontSize: '18px'
            }}>
              No notifications yet
            </h3>
            <p style={{
              color: darkMode ? '#888' : '#666',
              fontSize: '16px',
              margin: 0
            }}>
              {filter === 'all' 
                ? "You'll see notifications here when you start following traders and they share content."
                : `No ${filter.replace('_', ' ')} notifications found.`
              }
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {notifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '20px',
                    borderBottom: index < notifications.length - 1 
                      ? `1px solid ${darkMode ? '#333' : '#f0f0f0'}` 
                      : 'none',
                    cursor: notification.actionUrl ? 'pointer' : 'default',
                    backgroundColor: notification.isRead 
                      ? 'transparent' 
                      : (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)'),
                    transition: 'background-color 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.actionUrl) {
                      e.currentTarget.style.backgroundColor = darkMode ? '#262626' : '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.isRead 
                      ? 'transparent' 
                      : (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)');
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start'
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={20} color="white" />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '600',
                        color: darkMode ? '#e0e0e0' : '#333',
                        fontSize: '16px',
                        marginBottom: '4px'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        color: darkMode ? '#b0b0b0' : '#666',
                        fontSize: '14px',
                        marginBottom: '8px',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: darkMode ? '#888' : '#999'
                      }}>
                        {notification.timeAgo}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#2196F3',
                        flexShrink: 0,
                        marginTop: '8px'
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrevPage}
              style={{
                backgroundColor: darkMode ? '#333' : '#f5f5f5',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                opacity: pagination.hasPrevPage ? 1 : 0.5
              }}
            >
              Previous
            </button>
            
            <span style={{
              color: darkMode ? '#e0e0e0' : '#333',
              padding: '8px 16px',
              fontSize: '14px'
            }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={!pagination.hasNextPage}
              style={{
                backgroundColor: darkMode ? '#333' : '#f5f5f5',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                opacity: pagination.hasNextPage ? 1 : 0.5
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPage;
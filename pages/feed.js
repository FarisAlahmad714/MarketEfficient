// pages/feed.js
import React, { useState, useEffect, useContext, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import storage from '../lib/storage';
import { FaNewspaper, FaSearch, FaUsers, FaArrowUp, FaArrowDown, FaChartLine, FaHeart, FaComment, FaUserPlus, FaUserCheck, FaSync, FaTimes, FaCheck, FaChevronDown, FaChevronUp, FaBrain, FaUser, FaTrash, FaTrophy, FaStar } from 'react-icons/fa';
import ProfileAvatar from '../components/ProfileAvatar';
import LikeButton from '../components/LikeButton';
import CommentSection from '../components/CommentSection';
import { useLeaderboardImages } from '../lib/useLeaderboardImages';

const SocialFeedPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [feedContent, setFeedContent] = useState([]);
  const [userContent, setUserContent] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Get profile images for feed users (same as leaderboard) - memoized to prevent infinite updates
  const feedUsersForImages = useMemo(() => {
    const currentContent = activeTab === 'feed' ? feedContent : userContent;
    const feedUsers = currentContent.map(item => ({
      userId: item.userId,
      profileImageGcsPath: item.profileImageGcsPath || null
    }));
    
    // Also include followed users for the stacked avatars (avoid duplicates)
    const followedUsersForImages = followedUsers
      .filter(user => !feedUsers.some(feedUser => feedUser.userId === user._id))
      .map(user => ({
        userId: user._id,
        profileImageGcsPath: user.profileImageGcsPath || null
      }));
    
    return [...feedUsers, ...followedUsersForImages];
  }, [feedContent, userContent, activeTab, followedUsers]);
  const { imageUrls } = useLeaderboardImages(feedUsersForImages);


  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchSocialFeed();
  }, [user]);

  const fetchSocialFeed = async () => {
    try {
      setLoading(true);
      const token = await storage.getItem('auth_token');
      
      const response = await fetch('/api/feed/social', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Remove duplicates based on shareId
        const uniqueFeedContent = data.feedContent ? data.feedContent.filter((item, index, self) => 
          index === self.findIndex(t => t.shareId === item.shareId)
        ) : [];
        setFeedContent(uniqueFeedContent);
        setFollowedUsers(data.followedUsers || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContent = async () => {
    try {
      setUserLoading(true);
      const token = await storage.getItem('auth_token');
      
      const response = await fetch('/api/feed/user-content', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserContent(data.userContent || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
    } finally {
      setUserLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await fetchSocialFeed();
    } else {
      await fetchUserContent();
    }
    setRefreshing(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'user' && userContent.length === 0) {
      fetchUserContent();
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const token = await storage.getItem('auth_token');
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      }
    } catch (error) {
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      setTimeout(() => {
        searchUsers(query);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleFollowUser = async (userId, currentlyFollowing) => {
    try {
      const token = await storage.getItem('auth_token');
      const action = currentlyFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`/api/follow/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update search results
        setSearchResults(prev => 
          prev.map(user => 
            user._id === userId 
              ? { ...user, isFollowing: !currentlyFollowing }
              : user
          )
        );

        // Show success message with custom modal
        const message = currentlyFollowing ? 'Unfollowed successfully!' : 'Now following!';
        setNotificationMessage(message);
        setNotificationType('success');
        setShowNotificationModal(true);
        
        // Auto hide after 3 seconds
        setTimeout(() => {
          setShowNotificationModal(false);
        }, 3000);
      }
    } catch (error) {
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const toggleAnalysis = (shareId, analysisType) => {
    const key = `${shareId}_${analysisType}`;
    setExpandedAnalysis(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleQuestion = (shareId, questionNum) => {
    const key = `${shareId}_question_${questionNum}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const openDeleteModal = (shareId) => {
    setPostToDelete(shareId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const token = await storage.getItem('auth_token');
      
      const response = await fetch(`/api/share/delete/${postToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from current content
        if (activeTab === 'feed') {
          setFeedContent(prev => prev.filter(item => item.shareId !== postToDelete));
        } else {
          setUserContent(prev => prev.filter(item => item.shareId !== postToDelete));
        }
        
        showNotification('Post deleted successfully', 'success');
        closeDeleteModal();
      } else {
        showNotification('Failed to delete post', 'error');
      }
    } catch (error) {
      showNotification('Failed to delete post', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationModal(true);
  };



  const NotificationModal = () => {
    if (!showNotificationModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: notificationType === 'success' ? '#4CAF50' : '#F44336',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '500',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {notificationType === 'success' ? <FaCheck size={16} /> : <FaTimes size={16} />}
        {notificationMessage}
        <button
          onClick={() => setShowNotificationModal(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            marginLeft: '8px',
            padding: '2px'
          }}
        >
          <FaTimes size={12} />
        </button>
        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#F44336',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaTrash size={16} color="white" />
            </div>
            <div>
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Delete Post
              </h3>
              <p style={{
                color: darkMode ? '#888' : '#666',
                margin: 0,
                fontSize: '14px'
              }}>
                This action cannot be undone
              </p>
            </div>
          </div>

          {/* Content */}
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '14px',
            lineHeight: '1.5',
            margin: '0 0 24px 0'
          }}>
            Are you sure you want to delete this post? This will permanently remove it from the social feed and cannot be recovered.
          </p>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={closeDeleteModal}
              style={{
                backgroundColor: 'transparent',
                color: darkMode ? '#e0e0e0' : '#333',
                border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeletePost}
              style={{
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaTrash size={12} />
              Delete Post
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFeedItem = (item) => {
    if (item.type === 'trading_highlight') {
      return renderTradingCard(item);
    } else if (item.type === 'test_result') {
      return renderBiasTestCard(item);
    } else if (item.type === 'badge') {
      return renderBadgeCard(item);
    } else if (item.type === 'achievement') {
      // Check if it's a goal achievement or milestone achievement
      if (item.data.period || item.data.rarity === 'goal') {
        return renderGoalAchievementCard(item);
      } else {
        return renderMilestoneAchievementCard(item);
      }
    }
    return renderGenericCard(item);
  };

  const renderTradingCard = (item) => {
    const trade = item.data;
    const isProfit = trade.return >= 0;
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[item.userId]}
            name={item.name}
            size={40}
            borderRadius="50%"
          />
          <div>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '14px'
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{item.username} • {formatDate(item.createdAt)}
            </div>
          </div>
        </div>

        {/* Trade Content */}
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
            <div style={{
              backgroundColor: isProfit ? '#4CAF50' : '#F44336',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {isProfit ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
              {trade.symbol} {trade.side.toUpperCase()}
            </div>
            {trade.leverage > 1 && (
              <div style={{
                backgroundColor: '#FF9800',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {trade.leverage}x
              </div>
            )}
          </div>
          
          <div style={{
            backgroundColor: isProfit ? '#4CAF50' : '#F44336',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            {formatPercentage(trade.return)}
          </div>
        </div>

        {/* Trade Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>Entry</div>
            <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
              ${trade.entryPrice?.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>Exit</div>
            <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
              ${trade.exitPrice?.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>Duration</div>
            <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
              {trade.duration}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>P&L</div>
            <div style={{ 
              fontWeight: '600', 
              color: isProfit ? '#4CAF50' : '#F44336'
            }}>
              ${trade.pnl?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* User Analysis */}
        {trade.userAnalysis && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <button
              onClick={() => toggleAnalysis(item.shareId, 'user')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expandedAnalysis[`${item.shareId}_user`] ? '8px' : 0
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FaUser size={12} />
                User Analysis
              </div>
              {expandedAnalysis[`${item.shareId}_user`] ? 
                <FaChevronUp size={12} color={darkMode ? '#888' : '#666'} /> : 
                <FaChevronDown size={12} color={darkMode ? '#888' : '#666'} />
              }
            </button>
            {expandedAnalysis[`${item.shareId}_user`] && (
              <div style={{
                fontSize: '14px',
                color: darkMode ? '#e0e0e0' : '#333',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {trade.userAnalysis}
              </div>
            )}
          </div>
        )}

        {/* Entry Reasoning (Legacy) */}
        {trade.entryReason && !trade.userAnalysis && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#2196F3',
              marginBottom: '6px'
            }}>
              📝 Entry Reasoning
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#e0e0e0' : '#333',
              lineHeight: '1.4'
            }}>
              {trade.entryReason}
            </div>
          </div>
        )}

        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
        }}>
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            <LikeButton
              shareId={item.shareId}
              targetType="shared_content"
              targetId={item.shareId}
            />
            <CommentSection
              shareId={item.shareId}
            />
            {user && user.id === item.userId && (
              <button
                onClick={() => openDeleteModal(item.shareId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '4px'
                }}
                title="Delete post"
              >
                <FaTrash size={12} />
                Delete
              </button>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#888' : '#666'
          }}>
            Confidence: {trade.confidenceLevel || 'N/A'}/10
          </div>
        </div>
      </div>
    );
  };

  const renderBiasTestCard = (item) => {
    const test = item.data;
    
    const getScoreColor = (percentage) => {
      if (percentage >= 80) return '#4CAF50'; // Green
      if (percentage >= 60) return '#FF9800'; // Orange  
      return '#F44336'; // Red
    };

    const getScoreLabel = (percentage) => {
      if (percentage >= 80) return 'Excellent';
      if (percentage >= 60) return 'Good';
      return 'Needs Improvement';
    };
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: `2px solid ${getScoreColor(test.percentage)}33`,
        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header Gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${getScoreColor(test.percentage)}, ${getScoreColor(test.percentage)}aa)`
        }} />

        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[item.userId]}
            name={item.name}
            size={48}
            borderRadius="50%"
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: '700',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '16px',
              marginBottom: '2px'
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: '13px',
              color: darkMode ? '#888' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>@{item.username}</span>
              <span>•</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaBrain size={14} color="#9C27B0" />
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333'
            }}>
              Bias Test
            </span>
          </div>
        </div>

        {/* Test Header */}
        <div style={{
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: `1px solid ${getScoreColor(test.percentage)}33`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '20px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaChartLine size={20} color={getScoreColor(test.percentage)} />
                {test.assetName} Analysis
              </h3>
              <div style={{
                fontSize: '14px',
                color: darkMode ? '#b0b0b0' : '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>📊 {test.timeframe}</span>
                <span>❓ {test.questionsCount} questions</span>
                <span>⏱️ {test.duration || 'N/A'}</span>
              </div>
            </div>
            
            {/* Score Circle */}
            <div style={{
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: getScoreColor(test.percentage),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: `0 4px 16px ${getScoreColor(test.percentage)}44`
              }}>
                <span style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '800'
                }}>
                  {test.percentage}%
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: getScoreColor(test.percentage),
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {getScoreLabel(test.percentage)}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            paddingTop: '16px',
            borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: getScoreColor(test.percentage),
                marginBottom: '4px'
              }}>
                {test.score}
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#888' : '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Score
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#4CAF50',
                marginBottom: '4px'
              }}>
                {test.correctAnswers}
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#888' : '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Correct
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#F44336',
                marginBottom: '4px'
              }}>
                {test.questionsCount - test.correctAnswers}
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#888' : '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Incorrect
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Chart Analysis */}
        {test.questionsWithCharts?.length > 0 && (
          <div style={{
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h4 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '18px',
                fontWeight: '800',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2196F3, #9C27B0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}>
                  <FaChartLine size={16} color="white" />
                </div>
                Question Analysis
              </h4>
              <div style={{
                backgroundColor: darkMode ? '#262626' : '#f0f8ff',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#2196F3',
                border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
              }}>
                {test.questionsWithCharts.length} Questions
              </div>
            </div>
            
            {/* Individual Questions */}
            {test.questionsWithCharts.map((question, index) => {
              const isExpanded = expandedQuestions[`${item.shareId}_question_${question.questionNumber}`];
              const hasCharts = question.setupImage || question.outcomeImage;
              const hasAnalysis = question.userReasoning || question.aiAnalysis;
              
              return (
                <div key={index} style={{
                  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                  borderRadius: '16px',
                  border: `2px solid ${question.isCorrect ? '#4CAF50' : '#F44336'}33`,
                  marginBottom: '16px',
                  overflow: 'hidden',
                  boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.08)'
                }}>
                  {/* Question Header - Always Visible */}
                  <button
                    onClick={() => toggleQuestion(item.shareId, question.questionNumber)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: darkMode ? '#262626' : '#f8f9fa',
                      borderBottom: isExpanded ? `1px solid ${darkMode ? '#333' : '#e0e0e0'}` : 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: question.isCorrect ? '#4CAF50' : '#F44336',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'white'
                      }}>
                        {question.questionNumber}
                      </div>
                      <div style={{
                        textAlign: 'left',
                        flex: 1
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: darkMode ? '#e0e0e0' : '#333',
                          marginBottom: '4px'
                        }}>
                          Question {question.questionNumber}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: darkMode ? '#888' : '#666',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{
                            color: question.isCorrect ? '#4CAF50' : '#F44336',
                            fontWeight: '600'
                          }}>
                            {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                          {hasCharts && (
                            <span>📊 Charts Available</span>
                          )}
                          {hasAnalysis && (
                            <span>💡 Analysis Available</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      color: darkMode ? '#888' : '#666',
                      transition: 'transform 0.2s ease'
                    }}>
                      {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </div>
                  </button>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ padding: '20px' }}>
                      {/* Charts Section - Setup vs Outcome Side by Side */}
                      {hasCharts && (
                        <div style={{ marginBottom: hasAnalysis ? '20px' : '0' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: question.setupImage && question.outcomeImage ? '1fr 1fr' : '1fr',
                            gap: '16px'
                          }}>
                            {/* Setup Chart */}
                            {question.setupImage && (
                              <div style={{
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: `2px solid #2196F333`,
                                backgroundColor: darkMode ? '#1a2a3e' : '#f0f8ff'
                              }}>
                                <div style={{
                                  padding: '12px 16px',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#2196F3',
                                  backgroundColor: darkMode ? '#1e2a3a' : '#f8fafb',
                                  borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  📊 Setup Chart
                                  <span style={{
                                    fontSize: '10px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}>
                                    BEFORE
                                  </span>
                                </div>
                                <img 
                                  src={question.setupImage.url} 
                                  alt={`Setup Chart Question ${question.questionNumber}`}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Outcome Chart */}
                            {question.outcomeImage && (
                              <div style={{
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: `2px solid ${question.isCorrect ? '#4CAF50' : '#F44336'}33`,
                                backgroundColor: darkMode ? '#2a1e32' : '#faf5ff'
                              }}>
                                <div style={{
                                  padding: '12px 16px',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: question.isCorrect ? '#4CAF50' : '#F44336',
                                  backgroundColor: darkMode ? '#2a1e32' : '#faf5ff',
                                  borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  🎯 Outcome Chart
                                  <span style={{
                                    fontSize: '10px',
                                    backgroundColor: question.isCorrect ? '#4CAF50' : '#F44336',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}>
                                    RESULT
                                  </span>
                                </div>
                                <img 
                                  src={question.outcomeImage.url} 
                                  alt={`Outcome Chart Question ${question.questionNumber}`}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Analysis Section - Tied to This Specific Question */}
                      {hasAnalysis && (
                        <div style={{
                          backgroundColor: darkMode ? '#1a2332' : '#f8fafb',
                          borderRadius: '12px',
                          border: `2px solid ${question.isCorrect ? '#4CAF50' : '#F44336'}33`,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '16px 20px',
                            borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #4CAF50, #9C27B0)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FaBrain size={12} color="white" />
                            </div>
                            <h6 style={{
                              margin: 0,
                              color: darkMode ? '#e0e0e0' : '#333',
                              fontSize: '14px',
                              fontWeight: '700'
                            }}>
                              Question {question.questionNumber} Analysis
                            </h6>
                          </div>
                          <div style={{ padding: '16px 20px' }}>
                            {question.userReasoning && (
                              <div style={{ marginBottom: question.aiAnalysis ? '16px' : '0' }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#2196F3',
                                  marginBottom: '8px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  💭 Personal Analysis
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  lineHeight: '1.5',
                                  color: darkMode ? '#e0e0e0' : '#333',
                                  backgroundColor: darkMode ? '#262626' : '#ffffff',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
                                }}>
                                  {question.userReasoning}
                                </div>
                              </div>
                            )}
                            {question.aiAnalysis && (
                              <div>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#9C27B0',
                                  marginBottom: '8px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  🤖 AI Pattern Analysis
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  lineHeight: '1.5',
                                  color: darkMode ? '#e0e0e0' : '#333',
                                  backgroundColor: darkMode ? '#262626' : '#ffffff',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
                                }}>
                                  {Array.isArray(question.aiAnalysis) ? question.aiAnalysis.join(' ') : question.aiAnalysis}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}



        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
        }}>
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            <LikeButton
              shareId={item.shareId}
              targetType="shared_content"
              targetId={item.shareId}
            />
            <CommentSection
              shareId={item.shareId}
            />
            {user && user.id === item.userId && (
              <button
                onClick={() => openDeleteModal(item.shareId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '4px'
                }}
                title="Delete post"
              >
                <FaTrash size={12} />
                Delete
              </button>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#888' : '#666'
          }}>
            Performance: {test.percentage >= 80 ? 'Excellent' : test.percentage >= 60 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
      </div>
    );
  };

  const renderBadgeCard = (item) => {
    const badge = item.data;
    
    const getRarityGlow = (rarity) => {
      const glows = {
        common: '0 0 15px rgba(255, 255, 255, 0.2)',
        rare: '0 0 15px rgba(52, 152, 219, 0.4)',
        epic: '0 0 20px rgba(155, 89, 182, 0.5)',
        legendary: '0 0 25px rgba(255, 215, 0, 0.6)',
        mythic: '0 0 30px rgba(231, 76, 60, 0.7)'
      };
      return glows[rarity] || glows.common;
    };
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `2px solid ${badge.color || '#FFD700'}`,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px',
        position: 'relative'
      }}>
        {/* Badge Glow Effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '12px',
          boxShadow: getRarityGlow(badge.rarity),
          pointerEvents: 'none'
        }} />
        
        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[item.userId]}
            name={item.name}
            size={40}
            borderRadius="50%"
          />
          <div>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '14px'
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{item.username} • {formatDate(item.createdAt)}
            </div>
          </div>
        </div>

        {/* Badge Content */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Badge Icon */}
          <div style={{
            fontSize: '48px',
            marginBottom: '12px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}>
            {badge.icon || '🏆'}
          </div>
          
          {/* Badge Title */}
          <h3 style={{
            color: badge.color || '#FFD700',
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {badge.title}
          </h3>
          
          {/* Rarity */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: badge.color || '#FFD700',
              color: 'white',
              textTransform: 'uppercase',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              {badge.rarity || 'rare'}
            </span>
            <FaStar size={12} color={badge.color || '#FFD700'} />
          </div>
          
          {/* Description */}
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '14px',
            lineHeight: '1.4',
            margin: '0 0 12px 0'
          }}>
            {badge.description}
          </p>
          
          {/* Achievement Message */}
          <div style={{
            fontSize: '12px',
            color: '#4CAF50',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <FaTrophy size={12} />
            Badge Earned!
          </div>
        </div>

        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            <LikeButton
              shareId={item.shareId}
              targetType="shared_content"
              targetId={item.shareId}
            />
            <CommentSection
              shareId={item.shareId}
            />
            {user && user.id === item.userId && (
              <button
                onClick={() => openDeleteModal(item.shareId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '4px'
                }}
                title="Delete post"
              >
                <FaTrash size={12} />
                Delete
              </button>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#888' : '#666'
          }}>
            Category: {badge.category || 'Achievement'}
          </div>
        </div>
      </div>
    );
  };

  const renderGoalAchievementCard = (item) => {
    const achievement = item.data;
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `2px solid #FF6B35`,
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Goal Achievement Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #FF6B35, #F7931E)'
        }} />
        
        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[item.userId]}
            name={item.name}
            size={40}
            borderRadius="50%"
          />
          <div>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '14px'
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{item.username} • {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Goal Achievement Content */}
        <div style={{
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {/* Goal Icon */}
          <div style={{
            fontSize: '48px',
            marginBottom: '12px'
          }}>
            🎯
          </div>
          
          {/* Achievement Title */}
          <h3 style={{
            color: '#FF6B35',
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            {achievement.title}
          </h3>
          
          {/* Achievement Description */}
          <p style={{
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '14px',
            lineHeight: '1.4',
            margin: '0 0 12px 0'
          }}>
            {achievement.description}
          </p>
          
          {/* Goal Period Badge */}
          <div style={{
            display: 'inline-block',
            backgroundColor: '#FF6B35',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {achievement.period ? `${achievement.period} Goal` : 'Goal Completed'}
          </div>
        </div>

        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
        }}>
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            <LikeButton
              shareId={item.shareId}
              targetType="shared_content"
              targetId={item.shareId}
            />
            <CommentSection
              shareId={item.shareId}
            />
            {user && user.id === item.userId && (
              <button
                onClick={() => openDeleteModal(item.shareId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '4px'
                }}
                title="Delete post"
              >
                <FaTrash size={12} />
                Delete
              </button>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#FF6B35',
            fontWeight: '600'
          }}>
            🎯 Goal Achievement
          </div>
        </div>
      </div>
    );
  };

  const renderMilestoneAchievementCard = (item) => {
    const achievement = item.data;
    
    const getRarityColor = (rarity) => {
      switch (rarity) {
        case 'legendary': return '#FFD700';
        case 'epic': return '#9B59B6';
        case 'rare': return '#3498DB';
        case 'common': return '#95A5A6';
        default: return '#95A5A6';
      }
    };

    const getRarityGlow = (rarity) => {
      switch (rarity) {
        case 'legendary': return '0 0 20px rgba(255, 215, 0, 0.6)';
        case 'epic': return '0 0 15px rgba(155, 89, 182, 0.6)';
        case 'rare': return '0 0 10px rgba(52, 152, 219, 0.6)';
        default: return 'none';
      }
    };
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `2px solid ${getRarityColor(achievement.rarity)}`,
        boxShadow: `${darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'}, ${getRarityGlow(achievement.rarity)}`,
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Milestone Achievement Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${getRarityColor(achievement.rarity)}, ${getRarityColor(achievement.rarity)}aa)`
        }} />
        
        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[item.userId]}
            name={item.name}
            size={40}
            borderRadius="50%"
          />
          <div>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '14px'
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{item.username} • {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Milestone Achievement Content */}
        <div style={{
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Achievement Icon */}
          <div style={{
            fontSize: '48px',
            marginBottom: '12px',
            filter: achievement.rarity === 'legendary' ? 'drop-shadow(0 0 10px gold)' : 'none'
          }}>
            {achievement.icon || '🏆'}
          </div>
          
          {/* Achievement Title */}
          <h3 style={{
            color: getRarityColor(achievement.rarity),
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            {achievement.title}
          </h3>
          
          {/* Achievement Description */}
          <p style={{
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '14px',
            lineHeight: '1.4',
            margin: '0 0 12px 0'
          }}>
            {achievement.description}
          </p>
          
          {/* Rarity Badge */}
          <div style={{
            display: 'inline-block',
            backgroundColor: getRarityColor(achievement.rarity),
            color: 'white',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {achievement.rarity} Achievement
          </div>
        </div>

        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
        }}>
          <div style={{
            display: 'flex',
            gap: '16px'
          }}>
            <LikeButton
              shareId={item.shareId}
              targetType="shared_content"
              targetId={item.shareId}
            />
            <CommentSection
              shareId={item.shareId}
            />
            {user && user.id === item.userId && (
              <button
                onClick={() => openDeleteModal(item.shareId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '4px'
                }}
                title="Delete post"
              >
                <FaTrash size={12} />
                Delete
              </button>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: getRarityColor(achievement.rarity),
            fontWeight: '600'
          }}>
            🏆 {achievement.rarity} Milestone
          </div>
        </div>
      </div>
    );
  };

  const renderGenericCard = (item) => {
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[item.userId]}
            name={item.name}
            size={40}
            borderRadius="50%"
          />
          <div>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '14px'
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{item.username} • {formatDate(item.createdAt)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          fontSize: '14px',
          color: darkMode ? '#e0e0e0' : '#333',
          lineHeight: '1.4'
        }}>
          Shared {item.type.replace('_', ' ')} content
        </div>

        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
        }}>
          <LikeButton
            shareId={item.shareId}
            targetType="shared_content"
            targetId={item.shareId}
          />
          <CommentSection
            shareId={item.shareId}
          />
        </div>
      </div>
    );
  };


  if (!user) return null;

  return (
    <>
      <Head>
        <title>Social Feed - ChartSense</title>
        <meta name="description" content="Connect with fellow traders and see their latest insights" />
      </Head>
      
      <NotificationModal />
      <DeleteModal />

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
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FaNewspaper size={24} style={{ color: '#2196F3' }} />
              <h1 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Social Feed
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaSync size={12} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '20px',
            borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
          }}>
            <button
              onClick={() => handleTabChange('feed')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'feed' ? '2px solid #2196F3' : '2px solid transparent',
                color: activeTab === 'feed' ? '#2196F3' : (darkMode ? '#888' : '#666'),
                fontSize: '14px',
                fontWeight: activeTab === 'feed' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Social Feed
            </button>
            <button
              onClick={() => handleTabChange('user')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'user' ? '2px solid #2196F3' : '2px solid transparent',
                color: activeTab === 'user' ? '#2196F3' : (darkMode ? '#888' : '#666'),
                fontSize: '14px',
                fontWeight: activeTab === 'user' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Shared by You
            </button>
          </div>

          {/* User Search */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              marginBottom: '12px'
            }}>
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: darkMode ? '#888' : '#666',
                fontSize: '14px'
              }} />
              <input
                type="text"
                placeholder="Search for traders..."
                value={searchQuery}
                onChange={handleSearchInput}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: darkMode ? '#262626' : 'white',
                  color: darkMode ? '#e0e0e0' : '#333',
                  outline: 'none'
                }}
              />
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: darkMode ? '#1e1e1e' : 'white',
                border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                borderRadius: '8px',
                boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {searchLoading ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: darkMode ? '#888' : '#666'
                  }}>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(searchUser => (
                    <div
                      key={searchUser._id}
                      style={{
                        padding: '16px',
                        borderBottom: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                        onClick={() => router.push(`/u/${searchUser.username}`)}
                      >
                        <ProfileAvatar
                          imageUrl={imageUrls[searchUser._id]}
                          name={searchUser.name}
                          size={40}
                          borderRadius="50%"
                        />
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontSize: '14px'
                          }}>
                            {searchUser.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#888' : '#666'
                          }}>
                            @{searchUser.username}
                          </div>
                        </div>
                      </div>
                      
                      {!searchUser.isCurrentUser && (
                        <button
                          onClick={() => handleFollowUser(searchUser._id, searchUser.isFollowing)}
                          style={{
                            backgroundColor: searchUser.isFollowing ? '#4CAF50' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {searchUser.isFollowing ? <FaUserCheck size={12} /> : <FaUserPlus size={12} />}
                          {searchUser.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: darkMode ? '#888' : '#666'
                  }}>
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Following Status */}
        {followedUsers.length > 0 && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <FaUsers size={16} style={{ color: '#2196F3' }} />
              <span style={{
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Following {followedUsers.length} traders
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {followedUsers.slice(0, 8).map((followedUser, index) => (
                <div
                  key={followedUser._id}
                  onClick={() => router.push(`/u/${followedUser.username}`)}
                  style={{
                    position: 'relative',
                    zIndex: 8 - index,
                    marginLeft: index > 0 ? '-16px' : '0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.zIndex = '100';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = 8 - index;
                  }}
                  title={`@${followedUser.username}`}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: `2px solid ${darkMode ? '#1e1e1e' : 'white'}`,
                    overflow: 'hidden',
                    backgroundColor: darkMode ? '#333' : '#f0f0f0'
                  }}>
                    <ProfileAvatar
                      imageUrl={imageUrls[followedUser._id]}
                      name={followedUser.name || followedUser.username}
                      size={32}
                      borderRadius="50%"
                    />
                  </div>
                </div>
              ))}
              {followedUsers.length > 8 && (
                <div style={{
                  marginLeft: '-16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#333' : '#e0e0e0',
                  border: `2px solid ${darkMode ? '#1e1e1e' : 'white'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: darkMode ? '#e0e0e0' : '#666',
                  cursor: 'pointer',
                  zIndex: '0'
                }}
                title={`+${followedUsers.length - 8} more traders`}
                >
                  +{followedUsers.length - 8}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feed Content */}
        {activeTab === 'feed' ? (
          loading ? (
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
                Loading social feed...
              </div>
            </div>
          ) : feedContent.length === 0 ? (
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <FaNewspaper size={48} style={{ 
                color: darkMode ? '#555' : '#999', 
                marginBottom: '16px' 
              }} />
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                marginBottom: '12px',
                fontSize: '18px'
              }}>
                Your feed is empty
              </h3>
              <p style={{
                color: darkMode ? '#888' : '#666',
                fontSize: '16px',
                margin: '0 0 20px 0'
              }}>
                Start following traders to see their shared content here.
              </p>
              <div style={{
                color: darkMode ? '#888' : '#666',
                fontSize: '14px'
              }}>
                Use the search bar above to find traders to follow!
              </div>
            </div>
          ) : (
            <div>
              {feedContent.map(item => renderFeedItem(item))}
            </div>
          )
        ) : (
          // User Content Tab
          userLoading ? (
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
                Loading your shared content...
              </div>
            </div>
          ) : userContent.length === 0 ? (
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <FaNewspaper size={48} style={{ 
                color: darkMode ? '#555' : '#999', 
                marginBottom: '16px' 
              }} />
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                marginBottom: '12px',
                fontSize: '18px'
              }}>
                No shared content yet
              </h3>
              <p style={{
                color: darkMode ? '#888' : '#666',
                fontSize: '16px',
                margin: '0 0 20px 0'
              }}>
                Share your trading achievements, test results, or insights to see them here.
              </p>
            </div>
          ) : (
            <div>
              {userContent.map(item => renderFeedItem(item))}
            </div>
          )
        )}
      </div>
    </>
  );
};

export default SocialFeedPage;
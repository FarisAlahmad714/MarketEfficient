// components/profile/FollowModal.js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaUser, FaTimes, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import ProfileAvatar from '../ProfileAvatar';

const FollowModal = ({ isOpen, onClose, targetUserId, initialType = 'followers', username }) => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialType);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    if (isOpen && targetUserId) {
      setActiveTab(initialType);
      fetchFollowLists();
    }
  }, [isOpen, targetUserId, initialType]);

  // Fetch profile images when lists change
  useEffect(() => {
    const allUsers = [...followers, ...following];
    allUsers.forEach(user => {
      if (user._id && user.profileImageGcsPath && !imageUrls[user._id]) {
        fetchProfileImage(user._id);
      }
    });
  }, [followers, following]);

  const fetchProfileImage = async (userId) => {
    try {
      const response = await fetch(`/api/profile/user-image/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          setImageUrls(prev => ({ ...prev, [userId]: data.imageUrl }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const fetchFollowLists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both followers and following
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follow/list?targetUserId=${targetUserId}&type=followers`),
        fetch(`/api/follow/list?targetUserId=${targetUserId}&type=following`)
      ]);

      if (followersRes.ok && followingRes.ok) {
        const followersData = await followersRes.json();
        const followingData = await followingRes.json();
        
        setFollowers(followersData.users || []);
        setFollowing(followingData.users || []);
      } else {
        throw new Error('Failed to fetch follow lists');
      }
    } catch (error) {
      setError('Failed to load follow lists');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    onClose();
    router.push(`/u/${user.username}`);
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;

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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '16px',
        padding: '0',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px 0 24px'
        }}>
          <h2 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            margin: 0,
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {username ? `@${username}` : 'User'} Connections
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: darkMode ? '#888' : '#666',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '8px'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
          margin: '16px 24px 0 24px'
        }}>
          <button
            onClick={() => setActiveTab('followers')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '12px 16px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              color: activeTab === 'followers' ? '#2196F3' : (darkMode ? '#888' : '#666'),
              borderBottom: activeTab === 'followers' ? '2px solid #2196F3' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '12px 16px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              color: activeTab === 'following' ? '#2196F3' : (darkMode ? '#888' : '#666'),
              borderBottom: activeTab === 'following' ? '2px solid #2196F3' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px 24px 24px',
          minHeight: '200px'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: darkMode ? '#888' : '#666'
            }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#F44336'
            }}>
              <div style={{ marginBottom: '12px' }}>{error}</div>
              <button
                onClick={fetchFollowLists}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : currentList.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: darkMode ? '#888' : '#666',
              textAlign: 'center'
            }}>
              <FaUser size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                No {activeTab} yet
              </div>
              <div style={{ fontSize: '14px' }}>
                {activeTab === 'followers' 
                  ? "This user doesn't have any followers yet."
                  : "This user isn't following anyone yet."
                }
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {currentList.map(user => (
                <div
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#262626' : '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#262626' : '#f8f9fa';
                  }}
                >
                  {/* Avatar */}
                  <ProfileAvatar
                    imageUrl={imageUrls[user._id]}
                    name={user.name}
                    size={48}
                    borderRadius="50%"
                  />

                  {/* User Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: darkMode ? '#e0e0e0' : '#333',
                      fontSize: '15px'
                    }}>
                      {user.name || 'Unknown User'}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: darkMode ? '#888' : '#666'
                    }}>
                      @{user.username || 'unknown'}
                    </div>
                  </div>

                  {/* Follow Status Indicator */}
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    View Profile
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;
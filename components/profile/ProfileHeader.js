// components/profile/ProfileHeader.js
import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaUser, FaCamera, FaTwitter, FaLinkedin, FaInstagram, FaShare, FaCog, FaCalendarAlt, FaEye, FaEyeSlash, FaEdit, FaTrophy, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import storage from '../../lib/storage';
import BadgeModal from '../BadgeModal';
import FollowModal from './FollowModal';

const ProfileHeader = ({ 
  profile, 
  isOwnProfile = false, 
  onShare = null,
  onProfileUpdate = null,
  showActionButtons = true // New prop to control button visibility
}) => {
  const { darkMode } = useContext(ThemeContext);
  const { user, refreshUserData } = useContext(AuthContext);
  const router = useRouter();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [profileImage, setProfileImage] = useState(profile?.profileImageUrl || '');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [leaderboardRank, setLeaderboardRank] = useState(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    followerCount: 0,
    followingCount: 0,
    isOwnProfile: false
  });
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');

  const [formData, setFormData] = useState({
    username: profile?.username || '',
    name: profile?.name || '',
    bio: profile?.bio || '',
    socialLinks: {
      twitter: profile?.socialLinks?.twitter || '',
      linkedin: profile?.socialLinks?.linkedin || '',
      instagram: profile?.socialLinks?.instagram || ''
    },
    profileVisibility: 'public', // All profiles are public
    shareResults: true // All users share results
  });

  // Update profile image when profile prop changes
  useEffect(() => {
    if (profile?.profileImageUrl && profile.profileImageUrl !== profileImage) {
      // Add cache-busting parameter to ensure fresh load
      const imageUrl = profile.profileImageUrl.includes('?') 
        ? `${profile.profileImageUrl}&v=${Date.now()}`
        : `${profile.profileImageUrl}?v=${Date.now()}`;
      setProfileImage(imageUrl);
      setImageError(false); // Reset error state when new URL is provided
    }
  }, [profile?.profileImageUrl]);

  // Fetch leaderboard rank
  const fetchLeaderboardRank = async () => {
    if (!profile?.username) return;
    
    try {
      setRankLoading(true);
      const response = await fetch(`/api/leaderboard/user-rank?username=${profile.username}&testType=all&period=month`);
      
      if (response.ok) {
        const rankData = await response.json();
        setLeaderboardRank(rankData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard rank:', error);
    } finally {
      setRankLoading(false);
    }
  };

  // Fetch follow status
  const fetchFollowStatus = async () => {
    if (!profile?._id) return;
    
    try {
      const response = await fetch(`/api/follow/status?targetUserId=${profile._id}`);
      
      if (response.ok) {
        const data = await response.json();
        setFollowStatus(data);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  // Sync form data when profile prop changes
  React.useEffect(() => {
    console.log('ProfileHeader received profile:', profile);
    if (profile) {
      setFormData({
        username: profile.username || '',
        name: profile.name || '',
        bio: profile.bio || '',
        socialLinks: {
          twitter: profile.socialLinks?.twitter || '',
          linkedin: profile.socialLinks?.linkedin || '',
          instagram: profile.socialLinks?.instagram || ''
        },
        profileVisibility: 'public', // All profiles are public
        shareResults: true // All users share results
      });
      
      // Always update the profile image when profile prop changes
      console.log('Setting profile image from prop:', profile.profileImageUrl);
      setProfileImage(profile.profileImageUrl || '');
      
      // Fetch leaderboard rank and follow status
      fetchLeaderboardRank();
      fetchFollowStatus();
    }
  }, [profile]);

  // Legacy username generation - should not be needed for new users
  const generateUsernameIfMissing = async () => {
    if (!formData.username && isOwnProfile) {
      try {
        const token = storage.getItem('auth_token');
        const response = await fetch('/api/user/generate-username', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            username: data.username
          }));
        }
      } catch (error) {
        console.error('Error generating username:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('socialLinks.')) {
      const platform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [platform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        saveProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileImage = async (imageData) => {
    try {
      setLoading(true);
      const token = storage.getItem('auth_token');
      
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileImage: imageData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile image');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Trigger navbar refresh
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error) {
      console.error('Error saving profile image:', error);
      setSaveError(error.message);
      setTimeout(() => setSaveError(null), 5000);
      setProfileImage(profile?.profileImageUrl || '');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveError(null);
    
    try {
      const token = storage.getItem('auth_token');
      
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          bio: formData.bio,
          socialLinks: formData.socialLinks,
          profileVisibility: formData.profileVisibility,
          shareResults: formData.shareResults
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh user data in AuthContext to update navbar
      console.log('Calling refreshUserData after profile save...');
      if (refreshUserData) {
        const refreshSuccess = await refreshUserData();
        console.log('RefreshUserData result:', refreshSuccess);
      }
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error.message);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getProfileUrl = () => {
    if (formData.username) {
      // Use production domain for sharing
      const domain = process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : window.location.origin;
      return `${domain}/u/${formData.username}`;
    }
    return null;
  };

  const handleFollowToggle = async () => {
    console.log('Follow button clicked!');
    console.log('User:', user);
    console.log('Profile:', profile);
    console.log('Profile._id:', profile?._id);
    
    if (!user || !profile?._id) {
      console.log('Missing user or profile._id, returning early');
      return;
    }
    
    setFollowLoading(true);
    try {
      const token = await storage.getItem('auth_token');
      const action = followStatus.isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`/api/follow/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId: profile._id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setFollowStatus(prev => ({
          ...prev,
          isFollowing: data.isFollowing,
          followerCount: data.isFollowing 
            ? prev.followerCount + 1 
            : prev.followerCount - 1
        }));

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 10000;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        successDiv.textContent = data.message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(error.message || 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Success/Error Messages */}
      {saveSuccess && (
        <div style={{
          backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
          color: '#4CAF50',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center'
        }}>
          ✓ Profile updated successfully!
        </div>
      )}
      
      {saveError && (
        <div style={{
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
          color: '#F44336',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {saveError}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        flexWrap: 'wrap'
      }}>
        {/* Profile Picture */}
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: darkMode ? '#333' : '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `3px solid ${darkMode ? '#555' : '#e0e0e0'}`,
          flexShrink: 0
        }}>
          {profileImage && !imageError ? (
            <Image
              src={profileImage}
              alt={profile?.name || 'Profile'}
              fill
              style={{ 
                objectFit: 'cover', 
                borderRadius: '50%'
              }}
              sizes="120px"
              onError={(e) => {
                console.log('Profile image failed to load:', profileImage);
                setImageError(true);
                // Hide the broken image
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                setImageError(false);
              }}
              priority={isOwnProfile}
            />
          ) : (
            <FaUser size={50} color={darkMode ? '#666' : '#999'} />
          )}
          
          {isOwnProfile && (
            <label 
              htmlFor="profile-image-upload" 
              style={{
                position: 'absolute',
                bottom: '-5px',
                right: '-5px',
                backgroundColor: darkMode ? '#1976D2' : '#2196F3',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: `3px solid ${darkMode ? '#1e1e1e' : 'white'}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.backgroundColor = darkMode ? '#1565C0' : '#1976D2';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = darkMode ? '#1976D2' : '#2196F3';
              }}
            >
              <FaCamera color="white" size={16} />
              <input 
                type="file" 
                id="profile-image-upload" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          )}
        </div>

        {/* Profile Info */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            marginBottom: '10px',
            flexWrap: 'wrap'
          }}>
            <h1 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              margin: 0,
              fontSize: '28px'
            }}>
              {profile?.name || 'Your Name'}
            </h1>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* View Badges Button - Available for everyone */}
              <button
                onClick={() => setShowBadgeModal(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaTrophy size={14} />
                View Badges
              </button>

              {isOwnProfile && showActionButtons && (
                <>
                  <button
                    onClick={() => router.push('/profile')}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: darkMode ? '#e0e0e0' : '#333',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FaCog size={14} />
                    Settings
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (!showSettings) {
                        await generateUsernameIfMissing();
                      }
                      setShowSettings(!showSettings);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: darkMode ? '#e0e0e0' : '#333',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FaEdit size={14} />
                    Edit
                  </button>
                </>
              )}

              {/* Follow Button - show only for other users' profiles */}
              {!isOwnProfile && user && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    backgroundColor: followStatus.isFollowing ? 'transparent' : '#2196F3',
                    border: `1px solid ${followStatus.isFollowing ? (darkMode ? '#555' : '#ddd') : '#2196F3'}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: followStatus.isFollowing ? (darkMode ? '#e0e0e0' : '#333') : 'white',
                    cursor: followLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    opacity: followLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {followLoading ? (
                    '...'
                  ) : followStatus.isFollowing ? (
                    <>
                      <FaUserMinus size={14} />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <FaUserPlus size={14} />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
            
            {onShare && (
              <button
                onClick={onShare}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaShare size={14} />
                Share
              </button>
            )}
          </div>
          
          {profile?.username && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              margin: '0 0 15px 0',
              flexWrap: 'wrap'
            }}>
              <p style={{
                color: darkMode ? '#b0b0b0' : '#666',
                margin: 0,
                fontSize: '16px'
              }}>
                @{profile.username}
              </p>

              {/* Follower/Following Counts */}
              <div style={{
                display: 'flex',
                gap: '15px',
                fontSize: '14px'
              }}>
                <button
                  onClick={() => {
                    setFollowModalType('followers');
                    setShowFollowModal(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '0',
                    color: darkMode ? '#b0b0b0' : '#666',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#2196F3';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = darkMode ? '#b0b0b0' : '#666';
                  }}
                >
                  <span style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
                    {followStatus.followerCount}
                  </span> followers
                </button>
                <button
                  onClick={() => {
                    setFollowModalType('following');
                    setShowFollowModal(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '0',
                    color: darkMode ? '#b0b0b0' : '#666',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#2196F3';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = darkMode ? '#b0b0b0' : '#666';
                  }}
                >
                  <span style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
                    {followStatus.followingCount}
                  </span> following
                </button>
              </div>
              
              {/* Leaderboard Badge */}
              {leaderboardRank && leaderboardRank.rank && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: leaderboardRank.rankBadge?.color || '#2196F3',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '@media (max-width: 600px)': {
                      fontSize: '12px',
                      padding: '4px 8px'
                    }
                  }}
                  title={`Ranked #${leaderboardRank.rank} (Top ${leaderboardRank.percentile}%) • Score: ${leaderboardRank.userScore}% • Tests: ${leaderboardRank.testsTaken}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                  }}
                  onClick={() => router.push('/#leaderboard')}
                >
                  <span style={{ fontSize: '16px' }}>
                    {leaderboardRank.rankBadge?.icon || '🏆'}
                  </span>
                  <span>
                    #{leaderboardRank.rank} • {leaderboardRank.rankBadge?.label || `Rank ${leaderboardRank.rank}`}
                  </span>
                </div>
              )}
              
              {rankLoading && (
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: darkMode ? '#888' : '#666'
                }}>
                  Loading rank...
                </div>
              )}
            </div>
          )}

          {profile?.bio && (
            <p style={{
              color: darkMode ? '#e0e0e0' : '#333',
              margin: '0 0 15px 0',
              lineHeight: '1.5'
            }}>
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {(profile?.socialLinks?.twitter || profile?.socialLinks?.linkedin || profile?.socialLinks?.instagram) && (
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '15px'
            }}>
              {profile.socialLinks.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1DA1F2',
                    fontSize: '20px'
                  }}
                >
                  <FaTwitter />
                </a>
              )}
              {profile.socialLinks.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#0077B5',
                    fontSize: '20px'
                  }}
                >
                  <FaLinkedin />
                </a>
              )}
              {profile.socialLinks.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#E4405F',
                    fontSize: '20px'
                  }}
                >
                  <FaInstagram />
                </a>
              )}
            </div>
          )}

          {/* Pokemon-Style Badge Showcase */}
          {(() => {
            console.log('ProfileHeader: earnedBadges:', profile?.earnedBadges);
            return profile?.earnedBadges && profile.earnedBadges.length > 0;
          })() && (
            <div style={{
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(25, 30, 45, 0.95) 0%, rgba(35, 40, 55, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              border: `2px solid ${darkMode ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.4)'}`,
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: darkMode 
                ? '0 8px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 215, 0, 0.2)'
                : '0 8px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 215, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated background effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)',
                animation: 'badgeShimmer 3s ease-in-out infinite'
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaTrophy 
                    size={18} 
                    style={{ 
                      color: '#FFD700',
                      filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))'
                    }} 
                  />
                  <span style={{
                    color: darkMode ? '#FFD700' : '#B8860B',
                    fontWeight: '700',
                    fontSize: '16px',
                    textShadow: darkMode ? '0 0 8px rgba(255, 215, 0, 0.5)' : '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}>
                    Badge Collection
                  </span>
                  <span style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {profile.earnedBadges.length}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {profile.earnedBadges.slice(0, 6).map((badge, index) => {
                    const getRarityGlow = (rarity) => {
                      switch (rarity) {
                        case 'mythic':
                          return '0 0 15px rgba(231, 76, 60, 0.8), 0 0 30px rgba(231, 76, 60, 0.4)';
                        case 'legendary':
                          return '0 0 12px rgba(255, 215, 0, 0.8), 0 0 24px rgba(255, 215, 0, 0.4)';
                        case 'epic':
                          return '0 0 10px rgba(155, 89, 182, 0.6)';
                        case 'rare':
                          return '0 0 8px rgba(52, 152, 219, 0.5)';
                        default:
                          return 'none';
                      }
                    };

                    const getRarityBorder = (rarity) => {
                      switch (rarity) {
                        case 'mythic':
                          return '3px solid #E74C3C';
                        case 'legendary':
                          return '3px solid #FFD700';
                        case 'epic':
                          return '2px solid #9B59B6';
                        case 'rare':
                          return '2px solid #3498DB';
                        default:
                          return '2px solid #BDC3C7';
                      }
                    };

                    return (
                      <div
                        key={badge.id || index}
                        style={{
                          position: 'relative',
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: `radial-gradient(circle at 30% 30%, ${badge.color || '#FFD700'}, color-mix(in srgb, ${badge.color || '#FFD700'} 70%, black))`,
                          border: getRarityBorder(badge.rarity),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: `${getRarityGlow(badge.rarity)}, inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)`,
                          opacity: 0,
                          animation: `badgeAppear 0.6s ease-out ${index * 0.1}s forwards`,
                          '@media (hover: hover)': {
                            ':hover': {
                              transform: 'scale(1.15) rotateZ(10deg)',
                              zIndex: 10
                            }
                          }
                        }}
                        title={`${badge.title} - ${badge.description}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.15) rotateZ(10deg)';
                          e.currentTarget.style.zIndex = '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotateZ(0deg)';
                          e.currentTarget.style.zIndex = '1';
                        }}
                      >
                        <div style={{
                          fontSize: '18px',
                          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                          position: 'relative',
                          zIndex: 3
                        }}>
                          {badge.icon}
                        </div>
                        
                        {/* Legendary sparkle effect */}
                        {badge.rarity === 'legendary' && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none'
                          }}>
                            {['✨'].map((sparkle, sparkleIndex) => (
                              <div
                                key={sparkleIndex}
                                style={{
                                  position: 'absolute',
                                  fontSize: '8px',
                                  color: '#FFD700',
                                  animation: `sparkle 2s ease-in-out infinite`,
                                  animationDelay: `${sparkleIndex * 0.7}s`,
                                  top: sparkleIndex === 0 ? '2px' : sparkleIndex === 1 ? 'auto' : '50%',
                                  right: sparkleIndex === 0 ? '2px' : sparkleIndex === 1 ? '2px' : 'auto',
                                  bottom: sparkleIndex === 1 ? '2px' : 'auto',
                                  left: sparkleIndex === 2 ? '2px' : 'auto',
                                  transform: sparkleIndex === 2 ? 'translateY(-50%)' : 'none'
                                }}
                              >
                                {sparkle}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Mythic flame effect */}
                        {badge.rarity === 'mythic' && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none'
                          }}>
                            {['🔥', '🔥'].map((flame, flameIndex) => (
                              <div
                                key={flameIndex}
                                style={{
                                  position: 'absolute',
                                  fontSize: '8px',
                                  animation: `flameFlicker 1.5s ease-in-out infinite`,
                                  animationDelay: `${flameIndex * 0.5}s`,
                                  top: flameIndex === 0 ? '-2px' : 'auto',
                                  bottom: flameIndex === 1 ? '-2px' : 'auto',
                                  left: '50%',
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                {flame}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {profile.earnedBadges.length > 6 && (
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      border: `2px dashed ${darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      +{profile.earnedBadges.length - 6}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Member Since / Profile Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {profile?.stats?.memberSince && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: darkMode ? '#888' : '#666',
                fontSize: '14px'
              }}>
                <FaCalendarAlt size={12} />
                Member since {new Date(profile.stats.memberSince).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Settings Panel (only for own profile) */}
      {isOwnProfile && showSettings && (
        <div style={{
          marginTop: '30px',
          paddingTop: '30px',
          borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`
        }}>
          <h3 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginTop: 0,
            marginBottom: '20px'
          }}>
            Profile Settings
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Basic Info */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#b0b0b0' : '#666',
                fontWeight: '500'
              }}>
                Username
              </label>
              <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="your_username"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '15px'
                }}
              />

              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#b0b0b0' : '#666',
                fontWeight: '500'
              }}>
                Display Name
              </label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '15px'
                }}
              />

              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#b0b0b0' : '#666',
                fontWeight: '500'
              }}>
                Bio
              </label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  height: '80px',
                  resize: 'vertical'
                }}
                placeholder="Tell the world about yourself..."
              />
            </div>

            {/* Social Links & Privacy */}
            <div>
              <h4 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                marginTop: 0,
                marginBottom: '15px'
              }}>
                Social Links
              </h4>
              
              <input 
                type="url"
                name="socialLinks.twitter"
                value={formData.socialLinks.twitter}
                onChange={handleInputChange}
                placeholder="https://twitter.com/username"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '10px'
                }}
              />
              
              <input 
                type="url"
                name="socialLinks.linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/username"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '10px'
                }}
              />
              
              <input 
                type="url"
                name="socialLinks.instagram"
                value={formData.socialLinks.instagram}
                onChange={handleInputChange}
                placeholder="https://instagram.com/username"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '20px'
                }}
              />

              {/* Public Profile URL - Always show since all profiles are public */}
              {formData.username && (
                <div style={{
                  backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                  padding: '15px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <h5 style={{
                    color: darkMode ? '#e0e0e0' : '#333',
                    margin: '0 0 10px 0'
                  }}>
                    Your Public Profile URL:
                  </h5>
                  <a
                    href={getProfileUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#2196F3',
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                  >
                    {getProfileUrl()}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px'
          }}>
            <button 
              onClick={handleSaveProfile}
              disabled={loading}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button 
              onClick={() => setShowSettings(false)}
              style={{
                backgroundColor: 'transparent',
                color: darkMode ? '#e0e0e0' : '#333',
                border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        userBadges={profile?.earnedBadges || []}
        isOwnProfile={isOwnProfile}
        profileUrl={getProfileUrl()}
      />

      {/* Follow Modal */}
      <FollowModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        targetUserId={profile?._id}
        initialType={followModalType}
        username={profile?.username}
      />

      {/* Pokemon Badge Animations */}
      <style jsx>{`
        @keyframes badgeShimmer {
          0%, 100% { left: -100%; opacity: 0; }
          50% { left: 100%; opacity: 1; }
        }

        @keyframes badgeAppear {
          from {
            opacity: 0;
            transform: scale(0.3) rotateY(180deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes flameFlicker {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileHeader;
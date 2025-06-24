// components/profile/ProfileHeader.js
import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaUser, FaCamera, FaTwitter, FaLinkedin, FaInstagram, FaShare, FaCog, FaCalendarAlt, FaEye, FaEyeSlash, FaEdit } from 'react-icons/fa';
import storage from '../../lib/storage';

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
  const [profileImage, setProfileImage] = useState(profile?.profileImageUrl || '');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

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
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={profile?.name || 'Profile'}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '50%',
                display: 'block'
              }} 
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
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              margin: '0 0 15px 0',
              fontSize: '16px'
            }}>
              @{profile.username}
            </p>
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
    </div>
  );
};

export default ProfileHeader;
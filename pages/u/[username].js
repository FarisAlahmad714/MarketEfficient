// pages/u/[username].js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { FaUser, FaTwitter, FaLinkedin, FaInstagram, FaShare, FaCalendarAlt } from 'react-icons/fa';
import CryptoLoader from '../../components/CryptoLoader';
import ProfileHeader from '../../components/profile/ProfileHeader';
import AchievementGrid from '../../components/profile/AchievementGrid';
import AchievementGallery from '../../components/profile/AchievementGallery';
import TestResultsCards from '../../components/profile/TestResultsCards';
import TradingHighlights from '../../components/profile/TradingHighlights';
import SocialShareModal from '../../components/profile/SocialShareModal';

const PublicProfilePage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { username } = router.query;
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [showGoalAchievementsModal, setShowGoalAchievementsModal] = useState(false);
  const [showLifetimeAchievementsModal, setShowLifetimeAchievementsModal] = useState(false);

  useEffect(() => {
    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/profile/${username}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Profile not found or private');
        } else {
          setError('Failed to load profile');
        }
        return;
      }
      
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    setShareData({
      type: 'profile',
      name: profile.name,
      username: profile.username
    });
    setShowShareModal(true);
  };

  const handleShareAchievement = (achievement) => {
    setShareData({
      type: 'achievement',
      ...achievement
    });
    setShowShareModal(true);
  };

  const handleShareResult = (result) => {
    setShareData({
      type: 'test_result',
      ...result
    });
    setShowShareModal(true);
  };

  const handleShareTrade = (trade) => {
    setShareData({
      type: 'trading_highlight',
      ...trade
    });
    setShowShareModal(true);
  };

  const getProductionUrl = () => {
    const domain = process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${domain}/u/${profile?.username || ''}`;
  };

  const copyProfileUrl = () => {
    const url = getProductionUrl();
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  };

  const shareToSocial = (platform) => {
    const url = getProductionUrl();
    const text = `Check out ${profile.name}'s trading profile on MarketEfficient!`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Check if this is the user's own profile
  const isOwnProfile = user && user.username === profile?.username;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        padding: '20px'
      }}>
        <div style={{
          width: '400px',
          maxWidth: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <CryptoLoader 
            message="Loading profile..."
            minDisplayTime={1000}
            height="350px"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '80px auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <Head>
          <title>Profile Not Found - MarketEfficient</title>
        </Head>
        
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            🔍
          </div>
          <h1 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '15px'
          }}>
            Profile Not Found
          </h1>
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            marginBottom: '30px'
          }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.name} (@{profile.username}) - MarketEfficient</title>
        <meta name="description" content={`${profile.name}'s trading profile on MarketEfficient. ${profile.bio}`} />
        
        {/* Open Graph meta tags for social sharing */}
        <meta property="og:title" content={`${profile.name} (@${profile.username}) - MarketEfficient`} />
        <meta property="og:description" content={profile.bio || `Check out ${profile.name}'s trading performance on MarketEfficient!`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={getProductionUrl()} />
        <meta property="og:site_name" content="MarketEfficient" />
        
        {/* Open Graph image */}
        <meta property="og:image" content="https://www.chartsense.trade/images/banner.png?v=2" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:alt" content={`${profile.name}'s MarketEfficient trading profile`} />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@chartsense" />
        <meta name="twitter:title" content={`${profile.name} (@${profile.username}) - MarketEfficient`} />
        <meta name="twitter:description" content={profile.bio || `Check out ${profile.name}'s trading performance on MarketEfficient!`} />
        <meta name="twitter:image" content="https://www.chartsense.trade/images/banner.png?v=2" />
      </Head>

      <div style={{
        maxWidth: '1000px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Profile Header */}
        <ProfileHeader 
          profile={{
            ...profile,
            earnedBadges: profile?.earnedBadgeObjects || []
          }}
          isOwnProfile={isOwnProfile}
          onShare={handleShare}
        />

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#2196F3',
              marginBottom: '5px'
            }}>
              {profile.stats.testsCompleted}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '14px'
            }}>
              Tests Completed
            </div>
          </div>

          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getScoreColor(profile.stats.averageScore),
              marginBottom: '5px'
            }}>
              {profile.stats.averageScore}%
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '14px'
            }}>
              Average Score
            </div>
          </div>

          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#FF9800',
              marginBottom: '5px'
            }}>
              {profile.stats.achievements}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '14px'
            }}>
              Achievements
            </div>
          </div>

          {profile.tradingStats && (
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: profile.tradingStats.winRate >= 50 ? '#4CAF50' : '#F44336',
                marginBottom: '5px'
              }}>
                {profile.tradingStats.winRate}%
              </div>
              <div style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '14px'
              }}>
                Win Rate
              </div>
            </div>
          )}
        </div>

        {/* Goal Achievements Section */}
        {profile.achievements?.goals && profile.achievements.goals.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '24px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: 0
              }}>
                🎯 Recent Goal Completions
                
              </h3>
              <button
                onClick={() => setShowGoalAchievementsModal(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                View All Goals →
              </button>
            </div>
            <AchievementGrid 
              achievements={profile.achievements.goals.slice(0, 6)}
              darkMode={darkMode}
              isOwnProfile={isOwnProfile}
              onShareAchievement={handleShareAchievement}
            />
          </div>
        )}

        {/* Lifetime Achievements Section */}
        {profile.achievements?.lifetime && profile.achievements.lifetime.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '24px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: 0
              }}>
                🏆 Milestone Achievements
                <span style={{
                  fontSize: '14px',
                  color: darkMode ? '#888' : '#666',
                  fontWeight: '400',
                  padding: '4px 8px',
                  backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)',
                  borderRadius: '12px'
                }}>
                  Lifetime
                </span>
              </h3>
              <button
                onClick={() => setShowLifetimeAchievementsModal(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                View All Milestones →
              </button>
            </div>
            <AchievementGrid 
              achievements={profile.achievements.lifetime.slice(0, 6)}
              darkMode={darkMode}
              isOwnProfile={isOwnProfile}
              onShareAchievement={handleShareAchievement}
            />
          </div>
        )}

        {/* Fallback for old achievement structure */}
        {(!profile.achievements?.goals && !profile.achievements?.lifetime) && profile.achievements && Array.isArray(profile.achievements) && (
          <AchievementGrid 
            achievements={profile.achievements}
            darkMode={darkMode}
            isOwnProfile={isOwnProfile}
            onShareAchievement={handleShareAchievement}
          />
        )}

        {/* Trading Highlights */}
        <TradingHighlights 
          tradingStats={profile.tradingStats}
          bestTrades={profile.bestTrades || []}
          darkMode={darkMode}
          isOwnProfile={isOwnProfile}
          onShareTrade={handleShareTrade}
        />

        {/* Test Results by Type */}
        {profile.testsByType && (
          <>
            {/* Bias Test Results */}
            {profile.testsByType.biasTests.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '20px',
                  fontSize: '24px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  🧠 Bias Test Results
                </h3>
                <TestResultsCards 
                  testResults={profile.testsByType.biasTests}
                  darkMode={darkMode}
                  isOwnProfile={isOwnProfile}
                  onShareResult={handleShareResult}
                />
              </div>
            )}

            {/* Chart Exam Results */}
            {profile.testsByType.chartExams.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '20px',
                  fontSize: '24px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  📈 Chart Exam Results
                </h3>
                <TestResultsCards 
                  testResults={profile.testsByType.chartExams}
                  darkMode={darkMode}
                  isOwnProfile={isOwnProfile}
                  onShareResult={handleShareResult}
                />
              </div>
            )}
          </>
        )}

        {/* Fallback: Show mixed results if sectioned data not available */}
        {(!profile.testsByType || (profile.testsByType.biasTests.length === 0 && profile.testsByType.chartExams.length === 0)) && (
          <TestResultsCards 
            testResults={profile.recentTests}
            darkMode={darkMode}
            isOwnProfile={isOwnProfile}
            onShareResult={handleShareResult}
          />
        )}

        {/* No Public Data Message */}
        {profile.recentTests.length === 0 && profile.achievements.length === 0 && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '10px'
            }}>
              Private Profile
            </h3>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              margin: 0
            }}>
              This user hasn't enabled result sharing yet.
            </p>
          </div>
        )}
      </div>

      {/* Social Share Modal */}
      <SocialShareModal 
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareData(null);
        }}
        shareData={shareData}
        darkMode={darkMode}
        profileUrl={getProductionUrl()}
      />

      {/* Goal Achievements Modal */}
      {showGoalAchievementsModal && (
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
            padding: '25px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '75vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '28px'
              }}>
                🎯 Goal Achievement Gallery
              </h2>
              <button
                onClick={() => setShowGoalAchievementsModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: darkMode ? '#888' : '#666',
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              >
                ✕
              </button>
            </div>
            <AchievementGallery
              achievements={profile?.achievements?.goals || []}
              availableAchievements={profile?.achievements?.allAvailable?.goals || []}
              darkMode={darkMode}
              isOwnProfile={isOwnProfile}
              onShareAchievement={handleShareAchievement}
              type="goals"
              userMetrics={profile?.stats}
            />
          </div>
        </div>
      )}

      {/* Lifetime Achievements Modal */}
      {showLifetimeAchievementsModal && (
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
            padding: '25px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '75vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '28px'
              }}>
                🏆 Milestone Achievement Gallery
              </h2>
              <button
                onClick={() => setShowLifetimeAchievementsModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: darkMode ? '#888' : '#666',
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              >
                ✕
              </button>
            </div>
            <AchievementGallery
              achievements={profile?.achievements?.lifetime || []}
              availableAchievements={profile?.achievements?.allAvailable?.lifetime || []}
              darkMode={darkMode}
              isOwnProfile={isOwnProfile}
              onShareAchievement={handleShareAchievement}
              type="lifetime"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to get score color
const getScoreColor = (score) => {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#8BC34A'; // Light Green
  if (score >= 40) return '#FFC107'; // Amber
  if (score >= 20) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

export default PublicProfilePage;
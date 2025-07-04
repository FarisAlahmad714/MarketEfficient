import React, { useState, useEffect, useContext, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import storage from '../../lib/storage';
import { FaArrowLeft, FaArrowUp, FaArrowDown, FaChartLine, FaChevronDown, FaChevronUp, FaBrain, FaUser, FaTrophy, FaStar } from 'react-icons/fa';
import ProfileAvatar from '../../components/ProfileAvatar';
import LikeButton from '../../components/LikeButton';
import CommentSection from '../../components/CommentSection';
import { useLeaderboardImages } from '../../lib/useLeaderboardImages';

const PostDetailPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { shareId } = router.query;
  
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState({});

  // Get profile image for post author
  const postUsersForImages = useMemo(() => 
    postData ? [{
      userId: postData.userId,
      profileImageGcsPath: postData.profileImageGcsPath || null
    }] : [], [postData]
  );
  const { imageUrls } = useLeaderboardImages(postUsersForImages);

  useEffect(() => {
    if (shareId) {
      fetchPostData();
    }
  }, [shareId]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      const token = await storage.getItem('auth_token');
      
      const response = await fetch(`/api/post/${shareId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setPostData(data.post);
      } else if (response.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
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

  const toggleAnalysis = (analysisType) => {
    setExpandedAnalysis(prev => ({
      ...prev,
      [analysisType]: !prev[analysisType]
    }));
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const renderPostContent = () => {
    if (!postData) return null;

    if (postData.type === 'trading_highlight') {
      const trade = postData.data;
      const isProfit = trade.return >= 0;
      
      return (
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          {/* User Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <ProfileAvatar
              imageUrl={imageUrls[postData.userId]}
              name={postData.name}
              size={50}
              borderRadius="50%"
            />
            <div>
              <div style={{
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px'
              }}>
                {postData.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: darkMode ? '#888' : '#666'
              }}>
                @{postData.username} • {formatDate(postData.createdAt)}
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
                fontSize: '16px'
              }}>
                {isProfit ? <FaArrowUp size={14} /> : <FaArrowDown size={14} />}
                {trade.symbol} {trade.side.toUpperCase()}
              </div>
              {trade.leverage > 1 && (
                <div style={{
                  backgroundColor: '#FF9800',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {trade.leverage}x
                </div>
              )}
            </div>
            
            <div style={{
              backgroundColor: isProfit ? '#4CAF50' : '#F44336',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '18px'
            }}>
              {formatPercentage(trade.return)}
            </div>
          </div>

          {/* Trade Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '14px', color: darkMode ? '#888' : '#666', marginBottom: '4px' }}>Entry Price</div>
              <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333', fontSize: '16px' }}>
                ${trade.entryPrice?.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: darkMode ? '#888' : '#666', marginBottom: '4px' }}>Exit Price</div>
              <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333', fontSize: '16px' }}>
                ${trade.exitPrice?.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: darkMode ? '#888' : '#666', marginBottom: '4px' }}>Duration</div>
              <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333', fontSize: '16px' }}>
                {trade.duration}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: darkMode ? '#888' : '#666', marginBottom: '4px' }}>P&L</div>
              <div style={{ 
                fontWeight: '600', 
                color: isProfit ? '#4CAF50' : '#F44336',
                fontSize: '16px'
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
              padding: '16px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => toggleAnalysis('user')}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: expandedAnalysis.user ? '12px' : 0
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaUser size={14} />
                  User Analysis
                </div>
                {expandedAnalysis.user ? 
                  <FaChevronUp size={14} color={darkMode ? '#888' : '#666'} /> : 
                  <FaChevronDown size={14} color={darkMode ? '#888' : '#666'} />
                }
              </button>
              {expandedAnalysis.user && (
                <div style={{
                  fontSize: '15px',
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
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                📝 Entry Reasoning
              </div>
              <div style={{
                fontSize: '15px',
                color: darkMode ? '#e0e0e0' : '#333',
                lineHeight: '1.5'
              }}>
                {trade.entryReason}
              </div>
            </div>
          )}

          {/* Engagement Actions */}
          <div style={{
            display: 'flex',
            gap: '20px',
            paddingTop: '16px',
            borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
          }}>
            <LikeButton
              shareId={postData.shareId}
              targetType="shared_content"
              targetId={postData.shareId}
              size={16}
            />
          </div>
        </div>
      );
    }

    if (postData.type === 'badge') {
      const badge = postData.data;
      
      const getRarityGlow = (rarity) => {
        const glows = {
          common: '0 0 20px rgba(255, 255, 255, 0.3)',
          rare: '0 0 20px rgba(52, 152, 219, 0.4)',
          epic: '0 0 25px rgba(155, 89, 182, 0.5)',
          legendary: '0 0 30px rgba(255, 215, 0, 0.6)',
          mythic: '0 0 35px rgba(231, 76, 60, 0.7)'
        };
        return glows[rarity] || glows.common;
      };
      
      return (
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: `3px solid ${badge.color || '#FFD700'}`,
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
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
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1
          }}>
            <ProfileAvatar
              imageUrl={imageUrls[postData.userId]}
              name={postData.name}
              size={50}
              borderRadius="50%"
            />
            <div>
              <div style={{
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px'
              }}>
                {postData.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: darkMode ? '#888' : '#666'
              }}>
                @{postData.username} • {formatDate(postData.createdAt)}
              </div>
            </div>
          </div>

          {/* Badge Content */}
          <div style={{
            textAlign: 'center',
            padding: '30px',
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '12px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Badge Icon */}
            <div style={{
              fontSize: '80px',
              marginBottom: '16px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}>
              {badge.icon || '🏆'}
            </div>
            
            {/* Badge Title */}
            <h2 style={{
              color: badge.color || '#FFD700',
              margin: '0 0 12px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              {badge.title}
            </h2>
            
            {/* Rarity */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: badge.color || '#FFD700',
                color: 'white',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '1px'
              }}>
                {badge.rarity || 'rare'}
              </span>
              <FaStar size={16} color={badge.color || '#FFD700'} />
            </div>
            
            {/* Description */}
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 16px 0'
            }}>
              {badge.description}
            </p>
            
            {/* Achievement Message */}
            <div style={{
              fontSize: '14px',
              color: '#4CAF50',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <FaTrophy size={14} />
              Badge Earned!
            </div>
          </div>

          {/* Engagement Actions */}
          <div style={{
            display: 'flex',
            gap: '20px',
            paddingTop: '16px',
            borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
            position: 'relative',
            zIndex: 1
          }}>
            <LikeButton
              shareId={postData.shareId}
              targetType="shared_content"
              targetId={postData.shareId}
              size={16}
            />
          </div>
        </div>
      );
    }

    if (postData.type === 'test_result') {
      const testData = postData.data;
      
      return (
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          {/* User Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <ProfileAvatar
              imageUrl={imageUrls[postData.userId]}
              name={postData.name}
              size={50}
              borderRadius="50%"
            />
            <div>
              <div style={{
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px'
              }}>
                {postData.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: darkMode ? '#888' : '#666'
              }}>
                @{postData.username} • {formatDate(postData.createdAt)}
              </div>
            </div>
          </div>

          {/* Test Result Content */}
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <FaChartLine size={24} color="#2196F3" />
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}>
                  {testData?.asset || 'Test Result'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#888' : '#666'
                }}>
                  Bias Test Result
                </div>
              </div>
            </div>

            {testData?.score !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: testData.score >= 70 ? '#4CAF50' : testData.score >= 50 ? '#FF9800' : '#F44336',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '24px',
                  fontWeight: '600'
                }}>
                  {testData.score}%
                </div>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}>
                    Final Score
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: darkMode ? '#888' : '#666'
                  }}>
                    {testData.score >= 70 ? 'Excellent' : testData.score >= 50 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
              </div>
            )}

            {testData?.description && (
              <div style={{
                fontSize: '15px',
                color: darkMode ? '#e0e0e0' : '#333',
                lineHeight: '1.5'
              }}>
                {testData.description}
              </div>
            )}
          </div>

          {/* User Analysis */}
          {testData?.userAnalysis && (
            <div style={{
              backgroundColor: darkMode ? '#262626' : '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => toggleAnalysis('user')}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: expandedAnalysis.user ? '12px' : 0
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaUser size={14} />
                  User Analysis
                </div>
                {expandedAnalysis.user ? 
                  <FaChevronUp size={14} color={darkMode ? '#888' : '#666'} /> : 
                  <FaChevronDown size={14} color={darkMode ? '#888' : '#666'} />
                }
              </button>
              {expandedAnalysis.user && (
                <div style={{
                  fontSize: '15px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {testData.userAnalysis}
                </div>
              )}
            </div>
          )}

          {/* AI Analysis */}
          {testData?.aiAnalysis && (
            <div style={{
              backgroundColor: darkMode ? '#262626' : '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => toggleAnalysis('ai')}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: expandedAnalysis.ai ? '12px' : 0
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#9C27B0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaBrain size={14} />
                  AI Analysis
                </div>
                {expandedAnalysis.ai ? 
                  <FaChevronUp size={14} color={darkMode ? '#888' : '#666'} /> : 
                  <FaChevronDown size={14} color={darkMode ? '#888' : '#666'} />
                }
              </button>
              {expandedAnalysis.ai && (
                <div style={{
                  fontSize: '15px',
                  color: darkMode ? '#e0e0e0' : '#333',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {testData.aiAnalysis}
                </div>
              )}
            </div>
          )}

          {/* Engagement Actions */}
          <div style={{
            display: 'flex',
            gap: '20px',
            paddingTop: '16px',
            borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
          }}>
            <LikeButton
              shareId={postData.shareId}
              targetType="shared_content"
              targetId={postData.shareId}
              size={16}
            />
          </div>
        </div>
      );
    }

    // Add other post types here (achievement, badge, profile, etc.)
    return (
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <ProfileAvatar
            imageUrl={imageUrls[postData.userId]}
            name={postData.name}
            size={50}
            borderRadius="50%"
          />
          <div>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '16px'
            }}>
              {postData.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{postData.username} • {formatDate(postData.createdAt)}
            </div>
          </div>
        </div>

        {/* Generic Content */}
        <div style={{
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '16px',
            color: darkMode ? '#e0e0e0' : '#333',
            textAlign: 'center'
          }}>
            {postData.type.replace('_', ' ')} content
          </div>
        </div>

        {/* Engagement Actions */}
        <div style={{
          display: 'flex',
          gap: '20px',
          paddingTop: '16px',
          borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
        }}>
          <LikeButton
            shareId={postData.shareId}
            targetType="shared_content"
            targetId={postData.shareId}
            size={16}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Post - MarketEfficient</title>
        </Head>
        <div style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '0 20px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            Loading post...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Post Not Found - MarketEfficient</title>
        </Head>
        <div style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '0 20px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '16px' }}>
              {error}
            </h2>
            <button
              onClick={() => router.push('/feed')}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Back to Feed
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          {postData ? `${postData.name}'s ${postData.type.replace('_', ' ')} - MarketEfficient` : 'Post - MarketEfficient'}
        </title>
        <meta name="description" content={postData ? `View ${postData.name}'s shared ${postData.type.replace('_', ' ')}` : 'View post'} />
      </Head>
      
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            color: darkMode ? '#e0e0e0' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}
        >
          <FaArrowLeft size={12} />
          Back
        </button>

        {/* Post Content */}
        {renderPostContent()}

        {/* Comments Section */}
        {postData && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '16px',
              fontSize: '18px'
            }}>
              Comments
            </h3>
            <CommentSection shareId={postData.shareId} />
          </div>
        )}
      </div>
    </>
  );
};

export default PostDetailPage;
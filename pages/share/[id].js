// pages/share/[id].js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';

const SharePage = ({ shareData: initialShareData, shareId }) => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  // Use server-side data, no need for client-side fetching
  const shareData = initialShareData;
  const id = shareId;
  const loading = !shareData; // Only show loading if no data
  const error = null;

  // Debug logging

  const getShareUrl = () => {
    const domain = process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${domain}/share/${id}`;
  };

  const getMetaTitle = () => {
    if (!shareData) return 'Shared Achievement - ChartSense';
    
    try {
      if (shareData.type === 'achievement') {
        return `${shareData.username} earned "${shareData.title}" - ChartSense`;
      } else if (shareData.type === 'badge') {
        return `${shareData.username} earned the "${shareData.title}" badge - ChartSense`;
      } else if (shareData.type === 'test_result') {
        return `${shareData.username} scored ${shareData.percentage}% on ${shareData.testType} - ChartSense`;
      } else if (shareData.type === 'trading_highlight') {
        const returnText = shareData.return > 0 ? `+${shareData.return.toFixed(1)}%` : `${shareData.return.toFixed(1)}%`;
        return `${shareData.username}'s ${shareData.symbol} trade: ${returnText} - ChartSense`;
      }
      return 'Shared Achievement - ChartSense';
    } catch (error) {
      return 'Shared Achievement - ChartSense';
    }
  };

  const getMetaDescription = () => {
    if (!shareData) return 'Check out this achievement on ChartSense!';
    
    try {
      if (shareData.type === 'achievement') {
        return `${shareData.username} earned "${shareData.title}" on ChartSense! ${shareData.description}`;
      } else if (shareData.type === 'badge') {
        return `${shareData.username} earned the "${shareData.title}" badge on ChartSense! ${shareData.description} (${shareData.rarity} rarity)`;
      } else if (shareData.type === 'test_result') {
        return `${shareData.username} scored ${shareData.percentage}% on ${shareData.testType}. Score: ${shareData.score}/${shareData.totalPoints}`;
      } else if (shareData.type === 'trading_highlight') {
        const returnText = shareData.return > 0 ? `+${shareData.return.toFixed(1)}%` : `${shareData.return.toFixed(1)}%`;
        return `${shareData.username} achieved ${returnText} return on ${shareData.symbol} trade on ChartSense!`;
      }
      return 'Check out this achievement on ChartSense!';
    } catch (error) {
      return 'Check out this achievement on ChartSense!';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#8BC34A'; // Light Green
    if (score >= 40) return '#FFC107'; // Amber
    if (score >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

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
            message="Loading shared content..."
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
          <title>Content Not Found - ChartSense</title>
          <meta name="description" content="The shared content you're looking for was not found." />
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
            Content Not Found
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
        <title>{getMetaTitle()}</title>
        <meta name="description" content={getMetaDescription()} />
        
        {/* Open Graph meta tags for social sharing */}
        <meta property="og:title" content={getMetaTitle()} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={getShareUrl()} />
        <meta property="og:site_name" content="ChartSense" />
        <meta property="og:image" content={
          shareData?.type === 'badge' 
            ? `${process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000'}/api/og/share-badge?title=${encodeURIComponent(shareData.title || '')}&description=${encodeURIComponent(shareData.description || '')}&username=${encodeURIComponent(shareData.username || '')}&icon=${encodeURIComponent(shareData.icon || '🏆')}&color=${encodeURIComponent(shareData.color || '#2196F3')}&rarity=${encodeURIComponent(shareData.rarity || 'Badge')}`
            : "https://www.chartsense.trade/images/banner.png?v=2"
        } />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:alt" content={getMetaTitle()} />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@chartsense" />
        <meta name="twitter:title" content={getMetaTitle()} />
        <meta name="twitter:description" content={getMetaDescription()} />
        <meta name="twitter:image" content={
          shareData?.type === 'badge' 
            ? `${process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000'}/api/og/share-badge?title=${encodeURIComponent(shareData.title || '')}&description=${encodeURIComponent(shareData.description || '')}&username=${encodeURIComponent(shareData.username || '')}&icon=${encodeURIComponent(shareData.icon || '🏆')}&color=${encodeURIComponent(shareData.color || '#2196F3')}&rarity=${encodeURIComponent(shareData.rarity || 'Badge')}`
            : "https://www.chartsense.trade/images/banner.png?v=2"
        } />
      </Head>

      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            fontSize: '28px',
            marginBottom: '10px'
          }}>
            🎉 Shared Achievement
          </h1>
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '16px'
          }}>
            Check out what {shareData?.username} accomplished on ChartSense!
          </p>
        </div>

        {/* Achievement Card */}
        {shareData && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: shareData.type === 'badge' 
              ? `0 8px 24px rgba(0,0,0,0.3), 0 0 30px ${shareData.color || '#2196F3'}40`
              : (darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.15)'),
            border: `2px solid ${shareData.type === 'badge' ? (shareData.color || '#2196F3') : '#2196F3'}`,
            marginBottom: '30px'
          }}>
            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}>
                {shareData.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  margin: '0 0 5px 0',
                  fontSize: '18px'
                }}>
                  {shareData.name || shareData.username}
                </h3>
                <p style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  margin: 0,
                  fontSize: '14px'
                }}>
                  @{shareData.username}
                </p>
              </div>
            </div>

            {/* Achievement Content */}
            {shareData.type === 'achievement' && (
              <div style={{
                textAlign: 'center',
                padding: '20px 0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                  {shareData.icon || '🏆'}
                </div>
                <h2 style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  {shareData.title}
                </h2>
                <p style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}>
                  {shareData.description}
                </p>
              </div>
            )}

            {shareData.type === 'badge' && (
              <div style={{
                textAlign: 'center',
                padding: '20px 0'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '15px' }}>
                  {shareData.icon || '🏆'}
                </div>
                <h2 style={{
                  color: shareData.color || (darkMode ? '#e0e0e0' : '#333'),
                  marginBottom: '10px',
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}>
                  {shareData.title}
                </h2>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '15px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    backgroundColor: shareData.color || '#2196F3',
                    color: 'white',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    letterSpacing: '1px'
                  }}>
                    ⭐ {shareData.rarity || 'Badge'}
                  </span>
                </div>
                <p style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  marginBottom: '20px'
                }}>
                  {shareData.description}
                </p>
                <div style={{
                  backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                  borderRadius: '8px',
                  padding: '15px',
                  fontSize: '14px',
                  color: darkMode ? '#888' : '#666'
                }}>
                  🎯 This badge represents dedication and skill in trading education
                </div>
              </div>
            )}

            {shareData.type === 'test_result' && (
              <div style={{
                textAlign: 'center',
                padding: '20px 0'
              }}>
                <div style={{
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: getScoreColor(shareData.percentage),
                  marginBottom: '10px'
                }}>
                  {shareData.percentage}%
                </div>
                <h2 style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  {shareData.testType}
                </h2>
                <p style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '16px'
                }}>
                  Score: {shareData.score}/{shareData.totalPoints}
                </p>
                {shareData.completedAt && (
                  <p style={{
                    color: darkMode ? '#888' : '#999',
                    fontSize: '14px',
                    marginTop: '10px'
                  }}>
                    Completed {new Date(shareData.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {shareData.type === 'trading_highlight' && (
              <div style={{
                textAlign: 'center',
                padding: '20px 0'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '15px'
                }}>
                  📈
                </div>
                <h2 style={{
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  {shareData.side.toUpperCase()} {shareData.symbol}
                </h2>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: shareData.return >= 0 ? '#4CAF50' : '#F44336',
                  marginBottom: '10px'
                }}>
                  {shareData.return > 0 ? '+' : ''}{shareData.return.toFixed(1)}%
                </div>
                <p style={{
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '16px'
                }}>
                  Trading Return
                </p>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div style={{
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '15px'
          }}>
            Want to improve your trading skills?
          </h3>
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            marginBottom: '20px'
          }}>
            Join ChartSense to test your market knowledge, track your progress, and share your achievements!
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </>
  );
};

// Server-side rendering for proper meta tags
export async function getServerSideProps(context) {
  const { id } = context.params;
  
  try {
    // Fetch share data on the server
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    const response = await fetch(`${baseUrl}/api/share/${id}`);
    
    if (!response.ok) {
      return {
        notFound: true
      };
    }
    
    const shareData = await response.json();
    
    return {
      props: {
        shareData,
        shareId: id
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
}

export default SharePage;
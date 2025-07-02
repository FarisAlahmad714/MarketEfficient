// components/profile/SocialShareModal.js
import React, { useState, useEffect } from 'react';
import { FaTwitter, FaLinkedin, FaInstagram, FaFacebook, FaCopy, FaTimes, FaShare } from 'react-icons/fa';

const SocialShareModal = ({ 
  isOpen = false,
  onClose,
  shareData,
  darkMode = false,
  profileUrl = ''
}) => {
  const [shareText, setShareText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [shareUrl, setShareUrl] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  useEffect(() => {
    if (shareData && isOpen) {
      if (shareData.type !== 'profile') {
        createShareableLink();
      } else {
        generateShareText();
      }
    }
  }, [shareData, isOpen]);

  const createShareableLink = async () => {
    if (!shareData || shareData.type === 'profile') return;
    
    setIsCreatingShare(true);
    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: shareData.type,
          data: shareData
        })
      });

      if (response.ok) {
        const { shareUrl: newShareUrl } = await response.json();
        setShareUrl(newShareUrl);
        generateShareText(newShareUrl);
      } else {
        console.error('Failed to create shareable link');
        // Fallback to profile URL
        setShareUrl(profileUrl);
        generateShareText(profileUrl);
      }
    } catch (error) {
      console.error('Error creating shareable link:', error);
      // Fallback to profile URL
      setShareUrl(profileUrl);
      generateShareText(profileUrl);
    } finally {
      setIsCreatingShare(false);
    }
  };

  const getBaseText = (shareData) => {
    if (!shareData) return '';

    if (shareData.type === 'achievement') {
      return `🏆 Earned "${shareData.title}" on MarketEfficient! ${shareData.description}`;
    } else if (shareData.type === 'badge') {
      return `🏆 Earned the "${shareData.title}" badge on MarketEfficient! ${shareData.description}`;
    } else if (shareData.type === 'test_result') {
      return `📊 Scored ${shareData.percentage}% on ${shareData.testType} 🎯`;
    } else if (shareData.type === 'trading_highlight') {
      const returnText = shareData.return > 0 ? `+${shareData.return.toFixed(1)}%` : `${shareData.return.toFixed(1)}%`;
      return `📈 ${shareData.side.toUpperCase()} ${shareData.symbol} trade: ${returnText} return on MarketEfficient! 💪`;
    } else if (shareData.type === 'profile') {
      return `Check out my trading profile on MarketEfficient! 📊`;
    }
    return '';
  };

  const generateShareText = (customUrl = null) => {
    if (!shareData) return;

    const baseText = getBaseText(shareData);
    const hashtags = '';
    const linkToUse = customUrl || shareUrl || profileUrl;
    const profileLink = linkToUse ? `\n\n${linkToUse}` : '';
    
    setShareText(baseText + hashtags + profileLink);
  };

  const getPlatformSpecificText = (platform) => {
    if (!shareData) return shareText;

    const baseText = getBaseText(shareData);
    const linkToUse = shareUrl || profileUrl;
    
    if (platform === 'twitter') {
      const hashtags = '';
      const profileLink = linkToUse ? `\n\n${linkToUse}` : '';
      return baseText + hashtags + profileLink;
      
    } else if (platform === 'linkedin') {
      let linkedinText = '';
      if (shareData.type === 'achievement') {
        linkedinText = `Excited to share that I've earned the "${shareData.title}" achievement on MarketEfficient! ${shareData.description}\n\nContinuing to develop my trading and market analysis skills through structured learning and practice.`;
      } else if (shareData.type === 'badge') {
        linkedinText = `Proud to share that I've earned the "${shareData.title}" badge on MarketEfficient! ${shareData.description}\n\nThis ${shareData.rarity} badge represents my commitment to mastering trading skills and market psychology.`;
      } else if (shareData.type === 'test_result') {
        linkedinText = `Achieved ${shareData.percentage}% on a ${shareData.testType} assessment on MarketEfficient. Continuing to sharpen my market analysis skills through systematic testing and learning.`;
      } else {
        linkedinText = baseText;
      }
      const linkText = shareData.type === 'profile' ? 'View my profile:' : 'Check it out:';
      return linkedinText + (linkToUse ? `\n\n${linkText} ${linkToUse}` : '');
      
    } else if (platform === 'instagram') {
      return baseText;
    }

    return shareText;
  };

  const shareToSocial = async (platform) => {
    const text = getPlatformSpecificText(platform);
    const encodedText = encodeURIComponent(text);
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank', 'width=600,height=400');
    } else if (platform === 'facebook') {
      const linkToUse = shareUrl || profileUrl;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkToUse)}`;
      window.open(facebookUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'linkedin') {
      const linkedinText = getPlatformSpecificText('linkedin');
      copyToClipboard(linkedinText);
      window.open('https://www.linkedin.com/feed/', '_blank');
      alert('📋 Text copied! Create a new LinkedIn post and paste the content.');
    } else if (platform === 'instagram') {
      copyToClipboard(text);
      alert('📋 Caption copied! Share this on Instagram with your own image.');
    }
    
    if (!selectedPlatforms.includes(platform)) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const copyToClipboard = (textToCopy = shareText) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (!isOpen) return null;

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
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '75vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaShare style={{ color: '#2196F3' }} />
            Share Your Success
          </h2>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: darkMode ? '#888' : '#666',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Loading State */}
        {isCreatingShare && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f9f9f9',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            border: '1px solid #2196F3',
            textAlign: 'center'
          }}>
            <div style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '10px'
            }}>
              🔗 Creating shareable link...
            </div>
          </div>
        )}

        {/* Preview Section */}
        {shareData && !isCreatingShare && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f9f9f9',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            border: '1px solid #2196F3'
          }}>
            <h4 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginTop: 0,
              marginBottom: '10px'
            }}>
              Share Preview
              {shareUrl && shareData.type !== 'profile' && (
                <span style={{
                  marginLeft: '10px',
                  fontSize: '12px',
                  color: '#4CAF50',
                  backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  ✓ Public Link Created
                </span>
              )}
            </h4>
            
            {shareData.type === 'achievement' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '32px' }}>
                  {shareData.icon}
                </div>
                <div>
                  <h5 style={{
                    color: darkMode ? '#e0e0e0' : '#333',
                    margin: '0 0 5px 0'
                  }}>
                    {shareData.title}
                  </h5>
                  <p style={{
                    color: darkMode ? '#b0b0b0' : '#666',
                    margin: 0,
                    fontSize: '14px'
                  }}>
                    {shareData.description}
                  </p>
                </div>
              </div>
            )}
            
            {shareData.type === 'test_result' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: shareData.percentage >= 80 ? '#4CAF50' : '#2196F3'
                }}>
                  {shareData.percentage}%
                </div>
                <div>
                  <h5 style={{
                    color: darkMode ? '#e0e0e0' : '#333',
                    margin: '0 0 5px 0'
                  }}>
                    {shareData.testType}
                  </h5>
                  <p style={{
                    color: darkMode ? '#b0b0b0' : '#666',
                    margin: 0,
                    fontSize: '14px'
                  }}>
                    Score: {shareData.score}/{shareData.totalPoints}
                  </p>
                </div>
              </div>
            )}
            
            <div style={{
              backgroundColor: darkMode ? '#333' : '#fff',
              borderRadius: '8px',
              padding: '15px',
              fontSize: '14px',
              color: darkMode ? '#e0e0e0' : '#333',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {shareText}
            </div>
          </div>
        )}

        {/* Platform Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => shareToSocial('twitter')}
            style={{
              backgroundColor: '#000000',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
            }}
            title="Share on X"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
          
          <button
            onClick={() => shareToSocial('facebook')}
            style={{
              backgroundColor: '#1877F2',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(24, 119, 242, 0.4)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 20px rgba(24, 119, 242, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.4)';
            }}
            title="Share on Facebook"
          >
            <FaFacebook size={18} />
          </button>
          
          <button
            onClick={() => shareToSocial('linkedin')}
            style={{
              backgroundColor: '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 119, 181, 0.4)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 119, 181, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.4)';
            }}
            title="Share on LinkedIn"
          >
            <FaLinkedin size={18} />
          </button>
          
          <button
            onClick={() => shareToSocial('instagram')}
            style={{
              background: 'linear-gradient(45deg, #E4405F, #F77737, #FFDC80)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(228, 64, 95, 0.4)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 20px rgba(228, 64, 95, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(228, 64, 95, 0.4)';
            }}
            title="Share on Instagram"
          >
            <FaInstagram size={18} />
          </button>
        </div>

        {/* Custom Text Editor */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Customize your message:
          </label>
          <textarea
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            style={{
              width: '100%',
              height: '120px',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#e0e0e0' : '#333',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            placeholder="Customize your share message..."
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => copyToClipboard()}
            style={{
              backgroundColor: copySuccess ? '#4CAF50' : (darkMode ? '#333' : '#f5f5f5'),
              color: copySuccess ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaCopy size={12} />
            {copySuccess ? 'Copied!' : 'Copy Text'}
          </button>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: darkMode ? '#e0e0e0' : '#333',
              border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: 'auto'
            }}
          >
            Close
          </button>
        </div>

        {/* Success tracking */}
        {selectedPlatforms.length > 0 && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#4CAF50',
            textAlign: 'center'
          }}>
            ✅ Shared to: {selectedPlatforms.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialShareModal;
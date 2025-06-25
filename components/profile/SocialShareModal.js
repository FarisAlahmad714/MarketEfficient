// components/profile/SocialShareModal.js
import React, { useState, useEffect } from 'react';
import { FaTwitter, FaLinkedin, FaInstagram, FaCopy, FaTimes, FaDownload, FaShare, FaImage } from 'react-icons/fa';
import { SocialImageGenerator } from '../../lib/imageGenerator';

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
  const [generatedImages, setGeneratedImages] = useState({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerator, setImageGenerator] = useState(null);

  useEffect(() => {
    if (shareData && isOpen) {
      generateShareText();
      // Initialize image generator
      if (!imageGenerator) {
        setImageGenerator(new SocialImageGenerator());
      }
    }
  }, [shareData, isOpen]);

  useEffect(() => {
    if (imageGenerator && shareData && isOpen) {
      // Pre-generate images for all platforms
      generateImagesForAllPlatforms();
    }
  }, [imageGenerator, shareData, isOpen]);

  const generateImagesForAllPlatforms = async () => {
    if (!shareData) return;

    setIsGeneratingImage(true);
    const platforms = ['twitter', 'linkedin', 'instagram'];
    const images = {};

    try {
      for (const platform of platforms) {
        try {
          // Generate URL for server-side image generation
          if (shareData.type === 'test_result') {
            const params = new URLSearchParams({
              platform,
              type: 'test_result',
              testType: shareData.testType || shareData.type,
              percentage: shareData.percentage || 0,
              score: shareData.score || 0,
              asset: shareData.asset || '',
              completedAt: shareData.completedAt || new Date().toISOString()
            });
            
            images[platform] = `/api/og-image?${params.toString()}`;
          } else {
            // For other types, generate a simple branded image
            const params = new URLSearchParams({
              platform,
              type: shareData.type,
              title: shareData.title || 'MarketEfficient',
              description: shareData.description || 'Trading Skills & Market Analysis'
            });
            
            images[platform] = `/api/og-image?${params.toString()}`;
          }
        } catch (error) {
          console.error(`Error generating ${platform} image URL:`, error);
          images[platform] = null;
        }
      }
      setGeneratedImages(images);
    } catch (error) {
      console.error('Error generating image URLs:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getBaseText = (shareData) => {
    if (!shareData) return '';

    if (shareData.type === 'achievement') {
      return `🏆 Earned "${shareData.title}" on MarketEfficient! ${shareData.description}`;
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

  const generateShareText = () => {
    if (!shareData) return;

    // Generate Twitter-style text as the default preview
    const baseText = getBaseText(shareData);
    const hashtags = '\n\n#TradingSkills #MarketAnalysis';
    const shareUrl = getShareUrl();
    const profileLink = shareUrl ? `\n\n${shareUrl}` : '';
    
    setShareText(baseText + hashtags + profileLink);
  };

  const getPlatformSpecificText = (platform) => {
    if (!shareData) return shareText;

    const baseText = getBaseText(shareData);
    
    // Platform-specific optimizations
    if (platform === 'twitter') {
      // Twitter: concise with hashtags and URL
      const hashtags = '\n\n#TradingSkills #MarketAnalysis';
      const profileLink = profileUrl ? `\n\n${profileUrl}` : '';
      return baseText + hashtags + profileLink;
      
    } else if (platform === 'linkedin') {
      // LinkedIn: more professional tone
      let linkedinText = '';
      if (shareData.type === 'achievement') {
        linkedinText = `Excited to share that I've earned the "${shareData.title}" achievement on MarketEfficient! ${shareData.description}\n\nContinuing to develop my trading and market analysis skills through structured learning and practice.\n\n#TradingEducation #ProfessionalDevelopment #MarketAnalysis`;
      } else if (shareData.type === 'test_result') {
        linkedinText = `Achieved ${shareData.percentage}% on a ${shareData.testType} assessment on MarketEfficient. Continuing to sharpen my market analysis skills through systematic testing and learning.\n\n#TradingEducation #MarketAnalysis #SkillDevelopment`;
      } else {
        linkedinText = baseText + '\n\n#TradingEducation #ProfessionalDevelopment #MarketAnalysis';
      }
      return linkedinText + (profileUrl ? `\n\nView my profile: ${profileUrl}` : '');
      
    } else if (platform === 'instagram') {
      // Instagram: visual and casual
      return baseText + '\n\n📸 #TradingJourney #MarketLearning #FinanceEducation #TradingLife';
    }

    // Default: return the base preview text
    return shareText;
  };

  const getShareUrl = () => {
    if (shareData.type === 'test_result') {
      // Create a dynamic URL for test results that will show the card image
      const resultData = {
        testType: shareData.testType,
        percentage: shareData.percentage,
        score: shareData.score,
        totalPoints: shareData.totalPoints,
        asset: shareData.asset,
        completedAt: shareData.completedAt
      };
      
      const encodedData = encodeURIComponent(JSON.stringify(resultData));
      const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      return `${baseUrl}/share/result/${encodedData}`;
    }
    
    // Fallback to profile URL
    return profileUrl || (typeof window !== 'undefined' ? window.location.href : 'https://chartsense.trade');
  };

  const shareToSocial = async (platform) => {
    const text = getPlatformSpecificText(platform);
    const encodedText = encodeURIComponent(text);
    const shareUrl = getShareUrl();
    
    if (platform === 'twitter') {
      // Twitter with URL - will show Open Graph card if URL has proper meta tags
      const twitterUrl = shareUrl ? 
        `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodeURIComponent(shareUrl)}` :
        `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'linkedin') {
      // LinkedIn with URL
      const linkedinUrl = shareUrl ?
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` :
        'https://www.linkedin.com/feed/';
      window.open(linkedinUrl, '_blank');
    } else if (platform === 'instagram') {
      // Instagram: Copy text (no URL sharing)
      copyToClipboard(text);
      alert('📋 Caption copied! Share this on Instagram with your own image.');
    }
    
    // Track platform selection
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

  const downloadPlatformImage = async (platform) => {
    if (!generatedImages[platform]) {
      alert(`No image available for ${platform}. Generating...`);
      return;
    }

    try {
      // Fetch the image from our API
      const response = await fetch(generatedImages[platform]);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      
      // Platform-specific filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const type = shareData?.testType || shareData?.type || 'share';
      const score = shareData?.percentage ? `-${shareData.percentage}pct` : '';
      link.download = `marketefficient-${type}${score}-${platform}-${timestamp}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
      return false;
    }
  };

  const downloadAsImage = async () => {
    if (isGeneratingImage) {
      alert('Images are still being generated. Please wait a moment...');
      return;
    }

    if (Object.keys(generatedImages).length === 0) {
      alert('No images available. Please try refreshing the modal.');
      return;
    }

    // Download all platform images
    const platforms = Object.keys(generatedImages);
    let downloaded = 0;
    
    for (const platform of platforms) {
      if (generatedImages[platform]) {
        const success = await downloadPlatformImage(platform);
        if (success) downloaded++;
      }
    }

    if (downloaded > 0) {
      alert(`✅ Downloaded ${downloaded} optimized image${downloaded > 1 ? 's' : ''} for social sharing!`);
    } else {
      alert('Failed to download images. Please try again.');
    }
  };

  // Clean up generated image URLs when modal closes
  useEffect(() => {
    return () => {
      Object.values(generatedImages).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
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

        {/* Image Preview Section */}
        {(isGeneratingImage || Object.keys(generatedImages).length > 0) && (
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
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaImage style={{ color: '#2196F3' }} />
              Platform-Optimized Images
              {isGeneratingImage && (
                <span style={{
                  fontSize: '12px',
                  color: '#2196F3',
                  fontWeight: 'normal'
                }}>
                  Generating...
                </span>
              )}
            </h4>

            {isGeneratingImage ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: darkMode ? '#888' : '#666'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderTop: '2px solid #2196F3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '10px'
                }} />
                Creating optimized images for all platforms...
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {Object.entries(generatedImages).map(([platform, imageUrl]) => (
                  imageUrl && (
                    <div key={platform} style={{
                      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: darkMode ? '#333' : '#fff'
                    }}>
                      <img
                        src={imageUrl}
                        alt={`${platform} preview`}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <div style={{
                        padding: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          color: darkMode ? '#e0e0e0' : '#333',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          marginBottom: '5px'
                        }}>
                          {platform}
                        </div>
                        <div style={{
                          color: darkMode ? '#888' : '#666',
                          fontSize: '10px'
                        }}>
                          {platform === 'twitter' && '1200×675 (16:9)'}
                          {platform === 'linkedin' && '1200×627 (1.91:1)'}
                          {platform === 'instagram' && '1080×1080 (1:1)'}
                        </div>
                        <button
                          onClick={() => downloadPlatformImage(platform)}
                          style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            marginTop: '5px'
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview Section */}
        {shareData && (
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
              Text Preview
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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '25px'
        }}>
          <button
            onClick={() => shareToSocial('twitter')}
            style={{
              backgroundColor: '#1DA1F2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1991db'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1DA1F2'}
          >
            <FaTwitter />
            Twitter
            {generatedImages.twitter && (
              <FaImage size={10} style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px',
                backgroundColor: '#4CAF50',
                borderRadius: '2px',
                padding: '1px'
              }} />
            )}
          </button>
          
          <button
            onClick={() => shareToSocial('linkedin')}
            style={{
              backgroundColor: '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#006fa3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0077B5'}
          >
            <FaLinkedin />
            LinkedIn
            {generatedImages.linkedin && (
              <FaImage size={10} style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px',
                backgroundColor: '#4CAF50',
                borderRadius: '2px',
                padding: '1px'
              }} />
            )}
          </button>
          
          <button
            onClick={() => shareToSocial('instagram')}
            style={{
              background: 'linear-gradient(45deg, #E4405F, #F77737, #FFDC80)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <FaInstagram />
            Instagram
            {generatedImages.instagram && (
              <FaImage size={10} style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px',
                backgroundColor: '#4CAF50',
                borderRadius: '2px',
                padding: '1px'
              }} />
            )}
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
            onClick={downloadAsImage}
            disabled={isGeneratingImage}
            style={{
              backgroundColor: isGeneratingImage ? '#666' : (darkMode ? '#333' : '#f5f5f5'),
              color: isGeneratingImage ? '#ccc' : (darkMode ? '#e0e0e0' : '#333'),
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: isGeneratingImage ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              opacity: isGeneratingImage ? 0.7 : 1
            }}
          >
            <FaDownload size={12} />
            {isGeneratingImage ? 'Generating...' : 'Download All Images'}
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

        {/* Platform-specific tips */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.05)',
          borderRadius: '8px',
          fontSize: '12px',
          color: darkMode ? '#FFD54F' : '#F57C00'
        }}>
          <strong>⚠️ Development Mode:</strong>
          <p style={{ margin: '8px 0', lineHeight: '1.4' }}>
            Social platforms can't show images from localhost URLs. For the full experience with auto-generated cards, you'll need to deploy to a public domain.
          </p>
          <p style={{ margin: '8px 0', lineHeight: '1.4' }}>
            <strong>Current options:</strong>
          </p>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
            <li><strong>Download images</strong> and manually attach to your posts</li>
            <li><strong>Deploy to production</strong> for automatic card generation</li>
            <li><strong>Text sharing</strong> works immediately</li>
          </ul>
          {Object.keys(generatedImages).length > 0 && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px', 
              backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#4CAF50'
            }}>
              ✨ Images ready for download - perfect replicas of your test result cards!
            </div>
          )}
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
    </>
  );
};

export default SocialShareModal;
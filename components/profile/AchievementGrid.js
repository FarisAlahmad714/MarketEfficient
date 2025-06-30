// components/profile/AchievementGrid.js
import React, { useState } from 'react';
import { FaShare, FaTrophy } from 'react-icons/fa';

const AchievementGrid = ({ 
  achievements = [], 
  darkMode = false, 
  isOwnProfile = false,
  onShareAchievement = null
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  if (achievements.length === 0) {
    return (
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏆</div>
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '10px'
        }}>
          No Achievements Yet
        </h3>
        <p style={{
          color: darkMode ? '#b0b0b0' : '#666',
          margin: 0
        }}>
          {isOwnProfile 
            ? "Complete tests and trades to earn your first achievement!"
            : "This user hasn't earned any achievements yet."
          }
        </p>
      </div>
    );
  }

  const getRarityGradient = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'linear-gradient(135deg, #FFD700, #FFA500)';
      case 'rare':
        return 'linear-gradient(135deg, #9C27B0, #673AB7)';
      case 'common':
        return 'linear-gradient(135deg, #2196F3, #4CAF50)';
      default:
        return 'linear-gradient(135deg, #666, #888)';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return '2px solid #FFD700';
      case 'rare':
        return '2px solid #9C27B0';
      case 'common':
        return '2px solid #2196F3';
      default:
        return '2px solid #666';
    }
  };

  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleShare = (achievement, e) => {
    e.stopPropagation();
    if (onShareAchievement) {
      onShareAchievement(achievement);
    }
  };

  return (
    <>
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginTop: 0,
            marginBottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaTrophy style={{ color: '#FFD700' }} />
            Achievements
          </h2>
          
          <div style={{
            backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
            color: '#2196F3',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {achievements.length} Earned
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement)}
              style={{
                backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                border: getRarityBorder(achievement.rarity),
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = darkMode 
                  ? '0 8px 20px rgba(0,0,0,0.4)' 
                  : '0 8px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Rarity Background Gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: getRarityGradient(achievement.rarity)
              }} />
              
              {/* Icon */}
              <div style={{
                fontSize: '32px',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: achievement.color + '20',
                flexShrink: 0
              }}>
                {achievement.icon}
              </div>
              
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '5px'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {achievement.title}
                  </h4>
                  
                  {isOwnProfile && onShareAchievement && (
                    <button
                      onClick={(e) => handleShare(achievement, e)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: darkMode ? '#888' : '#666',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Share achievement"
                    >
                      <FaShare size={12} />
                    </button>
                  )}
                </div>
                
                <p style={{
                  margin: '0 0 8px 0',
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {achievement.description}
                </p>
                
                {/* Rarity Badge */}
                <div style={{
                  display: 'inline-block',
                  backgroundColor: achievement.color + '20',
                  color: achievement.color,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {achievement.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more link if there are many achievements */}
        {achievements.length > 6 && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <button style={{
              backgroundColor: 'transparent',
              color: '#2196F3',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}>
              View All Achievements ({achievements.length})
            </button>
          </div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
              position: 'relative',
              border: getRarityBorder(selectedAchievement.rarity)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rarity Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: getRarityGradient(selectedAchievement.rarity),
              borderRadius: '16px 16px 0 0'
            }} />
            
            {/* Large Icon */}
            <div style={{
              fontSize: '80px',
              marginBottom: '20px',
              filter: selectedAchievement.rarity === 'legendary' ? 'drop-shadow(0 0 20px gold)' : 'none'
            }}>
              {selectedAchievement.icon}
            </div>
            
            {/* Title */}
            <h2 style={{
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '10px',
              fontSize: '24px'
            }}>
              {selectedAchievement.title}
            </h2>
            
            {/* Rarity */}
            <div style={{
              display: 'inline-block',
              background: getRarityGradient(selectedAchievement.rarity),
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '20px'
            }}>
              {selectedAchievement.rarity}
            </div>
            
            {/* Description */}
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '30px'
            }}>
              {selectedAchievement.description}
            </p>
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              {isOwnProfile && onShareAchievement && (
                <button
                  onClick={() => {
                    onShareAchievement(selectedAchievement);
                    setSelectedAchievement(null);
                  }}
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaShare size={12} />
                  Share Achievement
                </button>
              )}
              
              <button
                onClick={() => setSelectedAchievement(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AchievementGrid;
// components/profile/AchievementGallery.js
import React, { useState } from 'react';
import { FaShare, FaTrophy, FaLock, FaCheck, FaCalendarAlt } from 'react-icons/fa';

const AchievementGallery = ({ 
  achievements = [], 
  availableAchievements = [],
  darkMode = false, 
  isOwnProfile = false,
  onShareAchievement = null,
  type = 'lifetime', // 'lifetime' or 'goals'
  userMetrics = null // User metrics for goal generation
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'earned', 'unearned'
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'year' for goals

  // Generate mock goals for different timeframes (simplified approach)
  const generateTimeframeGoals = (period) => {
    const baseGoals = [
      {
        id: `${period}_tests`,
        title: `Complete ${period === 'week' ? '5' : period === 'month' ? '20' : '100'} Tests`,
        description: `Complete tests this ${period}`,
        icon: '📝',
        color: '#2196F3',
        rarity: 'goal',
        period: period
      },
      {
        id: `${period}_score`,
        title: `Reach ${period === 'week' ? '70' : period === 'month' ? '75' : '80'}% Average Score`,
        description: `Achieve average score this ${period}`,
        icon: '🎯',
        color: '#FF6B35',
        rarity: 'goal',
        period: period
      },
      {
        id: `${period}_bias`,
        title: `Complete ${period === 'week' ? '3' : period === 'month' ? '8' : '20'} Bias Tests`,
        description: `Complete bias tests this ${period}`,
        icon: '🧠',
        color: '#9B59B6',
        rarity: 'goal',
        period: period
      }
    ];

    if (period === 'week') {
      baseGoals.push({
        id: 'week_perfect',
        title: 'Get 1 Perfect Score',
        description: 'Achieve a perfect score this week',
        icon: '💎',
        color: '#FFD700',
        rarity: 'goal',
        period: 'week'
      });
    }

    return baseGoals;
  };

  // Create a map of earned achievements by ID
  const earnedAchievementIds = new Set(achievements.map(a => a.id));

  // For goals type, generate goals for timeframe; for lifetime, use availableAchievements
  const baseAchievements = type === 'goals' ? generateTimeframeGoals(timeframe) : availableAchievements;

  // Merge available achievements with earned status
  const allAchievements = baseAchievements.map(available => {
    const earned = achievements.find(a => a.id.includes(available.id.split('_')[1]) || a.id === available.id);
    return {
      ...available,
      earned: !!earned,
      completedAt: earned?.completedAt,
      progress: earned?.progress || 0
    };
  });

  // Apply filter
  const filteredAchievements = allAchievements.filter(achievement => {
    if (filter === 'earned') return achievement.earned;
    if (filter === 'unearned') return !achievement.earned;
    return true;
  });

  const getRarityGradient = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'linear-gradient(135deg, #FFD700, #FFA500)';
      case 'rare':
        return 'linear-gradient(135deg, #9C27B0, #673AB7)';
      case 'common':
        return 'linear-gradient(135deg, #2196F3, #4CAF50)';
      case 'goal':
        return 'linear-gradient(135deg, #FF6B35, #F7931E)';
      default:
        return 'linear-gradient(135deg, #666, #888)';
    }
  };

  const getRarityBorder = (rarity, earned) => {
    if (!earned) {
      return '2px solid rgba(128, 128, 128, 0.3)';
    }
    switch (rarity) {
      case 'legendary':
        return '2px solid #FFD700';
      case 'rare':
        return '2px solid #9C27B0';
      case 'common':
        return '2px solid #2196F3';
      case 'goal':
        return '2px solid #FF6B35';
      default:
        return '2px solid #666';
    }
  };

  const getProgressColor = (type, earned) => {
    if (earned) return '#4CAF50';
    if (type === 'goals') return '#FF6B35';
    return '#2196F3';
  };

  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleShare = (achievement, e) => {
    e.stopPropagation();
    if (onShareAchievement && achievement.earned) {
      onShareAchievement(achievement);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        {/* Timeframe Selector (Goals Only) */}
        {type === 'goals' && (
          <>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {['week', 'month', 'year'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  style={{
                    backgroundColor: timeframe === period ? '#4CAF50' : (darkMode ? '#333' : '#f5f5f5'),
                    color: timeframe === period ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                    border: 'none',
                    borderRadius: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaCalendarAlt size={12} />
                  {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
                </button>
              ))}
            </div>
            
            {/* Days Remaining Display */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              padding: '8px 16px',
              backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
              borderRadius: '20px',
              color: '#2196F3',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-block',
              margin: '0 auto 20px auto'
            }}>
              <FaCalendarAlt size={12} style={{ marginRight: '6px' }} />
              {(() => {
                const now = new Date();
                if (timeframe === 'week') {
                  const daysRemaining = 7 - now.getDay();
                  return daysRemaining === 0 ? 'Last day of the week' : 
                         daysRemaining === 1 ? '1 day remaining' : 
                         `${daysRemaining} days remaining`;
                } else if (timeframe === 'month') {
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const daysRemaining = lastDay - now.getDate();
                  return daysRemaining === 0 ? 'Last day of the month' : 
                         daysRemaining === 1 ? '1 day remaining' : 
                         `${daysRemaining} days remaining`;
                } else {
                  const lastDay = new Date(now.getFullYear(), 11, 31);
                  const daysRemaining = Math.ceil((lastDay - now) / (1000 * 60 * 60 * 24));
                  return daysRemaining === 0 ? 'Last day of the year' : 
                         daysRemaining === 1 ? '1 day remaining' : 
                         `${daysRemaining} days remaining`;
                }
              })()}
            </div>
          </>
        )}

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '25px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {['all', 'earned', 'unearned'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              style={{
                backgroundColor: filter === filterType ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                color: filter === filterType ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {filterType} ({filterType === 'all' ? allAchievements.length : 
                         filterType === 'earned' ? allAchievements.filter(a => a.earned).length :
                         allAchievements.filter(a => !a.earned).length})
            </button>
          ))}
        </div>

        {/* Achievement Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#4CAF50',
              marginBottom: '5px'
            }}>
              {allAchievements.filter(a => a.earned).length}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Earned
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#FF9800',
              marginBottom: '5px'
            }}>
              {allAchievements.filter(a => !a.earned).length}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Available
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2196F3',
              marginBottom: '5px'
            }}>
              {Math.round((allAchievements.filter(a => a.earned).length / allAchievements.length) * 100)}%
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Progress
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#FFD700',
              marginBottom: '5px'
            }}>
              {allAchievements.filter(a => a.earned && a.rarity === 'legendary').length}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Legendary
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievement Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {filteredAchievements.map(achievement => (
          <div
            key={achievement.id}
            onClick={() => handleAchievementClick(achievement)}
            style={{
              backgroundColor: achievement.earned 
                ? (darkMode ? '#262626' : '#f9f9f9')
                : (darkMode ? 'rgba(38, 38, 38, 0.5)' : 'rgba(249, 249, 249, 0.5)'),
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              border: getRarityBorder(achievement.rarity, achievement.earned),
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              opacity: achievement.earned ? 1 : 0.7
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
              background: achievement.earned ? getRarityGradient(achievement.rarity) : 'rgba(128, 128, 128, 0.3)'
            }} />
            
            {/* Lock/Check Overlay for unearned achievements */}
            {!achievement.earned && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(128, 128, 128, 0.8)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaLock size={12} color="white" />
              </div>
            )}
            
            {achievement.earned && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaCheck size={12} color="white" />
              </div>
            )}
            
            {/* Icon */}
            <div style={{
              fontSize: '32px',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: achievement.earned 
                ? (achievement.color + '20')
                : 'rgba(128, 128, 128, 0.2)',
              flexShrink: 0,
              filter: achievement.earned ? 'none' : 'grayscale(1)'
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
                  color: achievement.earned 
                    ? (darkMode ? '#e0e0e0' : '#333')
                    : (darkMode ? '#888' : '#666'),
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {achievement.title}
                </h4>
                
                {isOwnProfile && onShareAchievement && achievement.earned && (
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
                color: achievement.earned 
                  ? (darkMode ? '#b0b0b0' : '#666')
                  : (darkMode ? '#777' : '#888'),
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {achievement.description}
              </p>
              
              {/* Progress/Status Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px'
              }}>
                {/* Rarity Badge */}
                <div style={{
                  display: 'inline-block',
                  backgroundColor: achievement.earned 
                    ? (achievement.color + '20')
                    : 'rgba(128, 128, 128, 0.2)',
                  color: achievement.earned ? achievement.color : '#888',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {achievement.rarity}
                </div>

                {/* Completion Date or Target Info */}
                {achievement.earned && achievement.completedAt ? (
                  <div style={{
                    fontSize: '11px',
                    color: darkMode ? '#888' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FaCheck size={10} />
                    {new Date(achievement.completedAt).toLocaleDateString()}
                  </div>
                ) : type === 'goals' && achievement.daysRemaining !== undefined ? (
                  <div style={{
                    fontSize: '11px',
                    color: achievement.daysRemaining <= 1 ? '#F44336' : (darkMode ? '#888' : '#666'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: achievement.daysRemaining <= 1 ? '600' : '400'
                  }}>
                    <FaCalendarAlt size={10} />
                    {achievement.daysRemaining === 0 
                      ? 'Last day!' 
                      : achievement.daysRemaining === 1 
                        ? '1 day left' 
                        : `${achievement.daysRemaining} days left`
                    }
                  </div>
                ) : type === 'goals' && achievement.target ? (
                  <div style={{
                    fontSize: '11px',
                    color: darkMode ? '#888' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FaTrophy size={10} />
                    Target: {achievement.target}
                  </div>
                ) : achievement.requirement ? (
                  <div style={{
                    fontSize: '11px',
                    color: darkMode ? '#888' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FaTrophy size={10} />
                    Need: {achievement.requirement}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
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
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
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
              border: getRarityBorder(selectedAchievement.rarity, selectedAchievement.earned)
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
              background: selectedAchievement.earned 
                ? getRarityGradient(selectedAchievement.rarity)
                : 'rgba(128, 128, 128, 0.3)',
              borderRadius: '16px 16px 0 0'
            }} />
            
            {/* Status Icon */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: selectedAchievement.earned ? '#4CAF50' : '#888',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedAchievement.earned ? 
                <FaCheck size={16} color="white" /> : 
                <FaLock size={16} color="white" />
              }
            </div>
            
            {/* Large Icon */}
            <div style={{
              fontSize: '80px',
              marginBottom: '20px',
              filter: selectedAchievement.earned 
                ? (selectedAchievement.rarity === 'legendary' ? 'drop-shadow(0 0 20px gold)' : 'none')
                : 'grayscale(1) opacity(0.7)'
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
            
            {/* Status Badge */}
            <div style={{
              display: 'inline-block',
              background: selectedAchievement.earned 
                ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                : 'linear-gradient(135deg, #888, #666)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '20px'
            }}>
              {selectedAchievement.earned ? 'EARNED' : 'LOCKED'}
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
            
            {/* Additional Info */}
            {selectedAchievement.earned && selectedAchievement.completedAt && (
              <div style={{
                backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                color: '#4CAF50',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <FaCalendarAlt size={14} />
                Completed on {new Date(selectedAchievement.completedAt).toLocaleDateString()}
              </div>
            )}
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              {isOwnProfile && onShareAchievement && selectedAchievement.earned && (
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

export default AchievementGallery;
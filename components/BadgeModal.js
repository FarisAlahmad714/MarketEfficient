// components/BadgeModal.js
import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { X, Trophy, Lock, Star, Share2 } from 'lucide-react';
import SocialShareModal from './profile/SocialShareModal';

const BadgeModal = ({ isOpen, onClose, userBadges = [], isOwnProfile = false, profileUrl = '' }) => {
  const { darkMode } = useContext(ThemeContext);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  

  // Share badge functionality using SocialShareModal
  const shareBadge = (badge) => {
    setShareData({
      type: 'badge',
      id: badge.id,
      title: badge.title,
      description: badge.description,
      rarity: badge.rarity,
      icon: badge.icon,
      color: badge.color,
      category: badge.category
    });
    setShowShareModal(true);
  };

  // All possible badges in the system
  const allBadges = [
    // Initiation
    {
      id: 'market_awakening',
      title: 'Market Awakening',
      description: 'Taken your first step into the trading matrix',
      icon: '🌅',
      color: '#FF6B35',
      rarity: 'common',
      category: 'initiation',
      requirement: '1+ test completed'
    },

    // Technical Mastery
    {
      id: 'chart_whisperer',
      title: 'Chart Whisperer',
      description: '95%+ average with 50+ tests - You see what others miss',
      icon: '🔮',
      color: '#8E44AD',
      rarity: 'mythic',
      category: 'mastery',
      requirement: '95%+ avg score with 50+ tests'
    },
    {
      id: 'pattern_prophet',
      title: 'Pattern Prophet',
      description: '90%+ average with 30+ tests - Predicting market moves',
      icon: '🧙‍♂️',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '90%+ avg score with 30+ tests'
    },
    {
      id: 'technical_sage',
      title: 'Technical Sage',
      description: '85%+ average with 20+ tests - True understanding',
      icon: '📜',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'mastery',
      requirement: '85%+ avg score with 20+ tests'
    },
    {
      id: 'trend_hunter',
      title: 'Trend Hunter',
      description: '75%+ average with 15+ tests - Tracking the flow',
      icon: '🎯',
      color: '#3498DB',
      rarity: 'rare',
      category: 'mastery',
      requirement: '75%+ avg score with 15+ tests'
    },

    // Psychology
    {
      id: 'bias_destroyer',
      title: 'Bias Destroyer',
      description: '25+ bias tests with 80%+ avg - Mind over emotions',
      icon: '🧠',
      color: '#E74C3C',
      rarity: 'legendary',
      category: 'psychology',
      requirement: '25+ bias tests with 80%+ avg'
    },
    {
      id: 'emotional_warrior',
      title: 'Emotional Warrior',
      description: '15+ bias tests with 70%+ avg - Conquering fear & greed',
      icon: '⚔️',
      color: '#9B59B6',
      rarity: 'epic',
      category: 'psychology',
      requirement: '15+ bias tests with 70%+ avg'
    },
    {
      id: 'self_aware',
      title: 'Self-Aware',
      description: '10+ bias tests - Know thy trading self',
      icon: '🪞',
      color: '#F39C12',
      rarity: 'rare',
      category: 'psychology',
      requirement: '10+ bias tests'
    },

    // Perfection
    {
      id: 'flawless_legend',
      title: 'Flawless Legend',
      description: '20+ perfect scores - Absolute market precision',
      icon: '💎',
      color: '#1ABC9C',
      rarity: 'mythic',
      category: 'perfection',
      requirement: '20+ perfect scores'
    },
    {
      id: 'precision_master',
      title: 'Precision Master',
      description: '10+ perfect scores - Surgical accuracy',
      icon: '🎯',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'perfection',
      requirement: '10+ perfect scores'
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: '5+ perfect scores - Demanding excellence',
      icon: '✨',
      color: '#3498DB',
      rarity: 'epic',
      category: 'perfection',
      requirement: '5+ perfect scores'
    },

    // Dedication
    {
      id: 'market_obsessed',
      title: 'Market Obsessed',
      description: '200+ tests - Markets are your life',
      icon: '🔥',
      color: '#E74C3C',
      rarity: 'mythic',
      category: 'dedication',
      requirement: '200+ tests completed'
    },
    {
      id: 'chart_addict',
      title: 'Chart Addict',
      description: '100+ tests - Can\'t stop analyzing',
      icon: '📊',
      color: '#9B59B6',
      rarity: 'legendary',
      category: 'dedication',
      requirement: '100+ tests completed'
    },
    {
      id: 'committed_student',
      title: 'Committed Student',
      description: '50+ tests - Serious about learning',
      icon: '📚',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'dedication',
      requirement: '50+ tests completed'
    },
    {
      id: 'dedicated_learner',
      title: 'Dedicated Learner',
      description: '25+ tests - Building knowledge',
      icon: '🎓',
      color: '#F39C12',
      rarity: 'rare',
      category: 'dedication',
      requirement: '25+ tests completed'
    },

    // Consistency
    {
      id: 'market_maniac',
      title: 'Market Maniac',
      description: '15+ tests in one week - Unstoppable momentum',
      icon: '⚡',
      color: '#E74C3C',
      rarity: 'legendary',
      category: 'consistency',
      requirement: '15+ tests in one week'
    },
    {
      id: 'weekly_warrior',
      title: 'Weekly Warrior',
      description: '10+ tests in one week - Intense focus',
      icon: '🗡️',
      color: '#9B59B6',
      rarity: 'epic',
      category: 'consistency',
      requirement: '10+ tests in one week'
    },
    {
      id: 'monthly_grinder',
      title: 'Monthly Grinder',
      description: '20+ tests this month - Steady progress',
      icon: '⚙️',
      color: '#3498DB',
      rarity: 'rare',
      category: 'consistency',
      requirement: '20+ tests this month'
    },

    // Versatility
    {
      id: 'market_polymath',
      title: 'Market Polymath',
      description: 'Master of all trading disciplines',
      icon: '🎭',
      color: '#8E44AD',
      rarity: 'legendary',
      category: 'versatility',
      requirement: '4+ test types with 40+ tests'
    },
    {
      id: 'well_rounded_trader',
      title: 'Well-Rounded Trader',
      description: 'Skilled across multiple test types',
      icon: '⚖️',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'versatility',
      requirement: '3+ test types with 20+ tests'
    },

    // Trading
    {
      id: 'cherry_popped',
      title: 'Cherry Popped',
      description: 'Your first trade - Welcome to the game',
      icon: '🍒',
      color: '#FF6B9D',
      rarity: 'common',
      category: 'trading',
      requirement: '1+ sandbox trade'
    },
    {
      id: 'risk_master',
      title: 'Risk Master',
      description: '85%+ win rate with 50+ trades - Calculated precision',
      icon: '🛡️',
      color: '#1ABC9C',
      rarity: 'mythic',
      category: 'trading',
      requirement: '85%+ win rate with 50+ trades'
    },
    {
      id: 'money_magnet',
      title: 'Money Magnet',
      description: '75%+ win rate with 30+ trades - Profits flow to you',
      icon: '🧲',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'trading',
      requirement: '75%+ win rate with 30+ trades'
    },
    {
      id: 'wealth_builder',
      title: 'Wealth Builder',
      description: '200%+ returns - Compounding genius',
      icon: '🏰',
      color: '#2ECC71',
      rarity: 'legendary',
      category: 'trading',
      requirement: '200%+ returns with 25+ trades'
    },
    {
      id: 'profit_hunter',
      title: 'Profit Hunter',
      description: '100%+ returns - Doubling down',
      icon: '🏹',
      color: '#F39C12',
      rarity: 'epic',
      category: 'trading',
      requirement: '100%+ returns with 15+ trades'
    },
    {
      id: 'trade_machine',
      title: 'Trade Machine',
      description: '500+ trades - Relentless execution',
      icon: '🤖',
      color: '#95A5A6',
      rarity: 'mythic',
      category: 'trading',
      requirement: '500+ sandbox trades'
    },
    {
      id: 'execution_expert',
      title: 'Execution Expert',
      description: '250+ trades - Trading is your craft',
      icon: '⚡',
      color: '#9B59B6',
      rarity: 'legendary',
      category: 'trading',
      requirement: '250+ sandbox trades'
    },
    {
      id: 'active_trader',
      title: 'Active Trader',
      description: '100+ trades - Building experience',
      icon: '📈',
      color: '#3498DB',
      rarity: 'epic',
      category: 'trading',
      requirement: '100+ sandbox trades'
    },

    // Ultimate
    {
      id: 'trading_god',
      title: 'Trading God',
      description: 'Ultimate mastery - 90%+ avg, 10+ perfects, 50+ tests',
      icon: '👑',
      color: '#FFD700',
      rarity: 'mythic',
      category: 'ultimate',
      requirement: '90%+ avg, 10+ perfects, 50+ tests'
    },
    {
      id: 'complete_trader',
      title: 'Complete Trader',
      description: 'Theory + Practice mastery - The full package',
      icon: '🎯',
      color: '#8E44AD',
      rarity: 'mythic',
      category: 'ultimate',
      requirement: '100+ tests, 200+ trades, 70%+ win rate'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Badges', icon: '🏆' },
    { id: 'initiation', name: 'Initiation', icon: '🌅' },
    { id: 'mastery', name: 'Technical Mastery', icon: '🧙‍♂️' },
    { id: 'psychology', name: 'Psychology', icon: '🧠' },
    { id: 'perfection', name: 'Perfection', icon: '💎' },
    { id: 'dedication', name: 'Dedication', icon: '📚' },
    { id: 'consistency', name: 'Consistency', icon: '⚡' },
    { id: 'versatility', name: 'Versatility', icon: '🎭' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'ultimate', name: 'Ultimate', icon: '👑' }
  ];

  const rarities = [
    { id: 'all', name: 'All Rarities', color: '#95A5A6' },
    { id: 'common', name: 'Common', color: '#BDC3C7' },
    { id: 'rare', name: 'Rare', color: '#3498DB' },
    { id: 'epic', name: 'Epic', color: '#9B59B6' },
    { id: 'legendary', name: 'Legendary', color: '#FFD700' },
    { id: 'mythic', name: 'Mythic', color: '#E74C3C' }
  ];

  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case 'mythic': return '0 0 20px rgba(231, 76, 60, 0.6)';
      case 'legendary': return '0 0 15px rgba(255, 215, 0, 0.6)';
      case 'epic': return '0 0 10px rgba(155, 89, 182, 0.6)';
      case 'rare': return '0 0 8px rgba(52, 152, 219, 0.6)';
      default: return 'none';
    }
  };

  const filteredBadges = allBadges.filter(badge => {
    const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  // Handle both array of strings (earnedBadges) and array of objects (achievements)
  const earnedBadgeIds = Array.isArray(userBadges) 
    ? userBadges.map(badge => typeof badge === 'string' ? badge : badge.id)
    : [];
  const earnedCount = earnedBadgeIds.length;
  const totalCount = allBadges.length;

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '10px',
        overflowY: 'auto'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '75vh',
          overflow: 'hidden',
          boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.3)',
          margin: 'auto'
        }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Trophy size={28} color={darkMode ? '#FFD700' : '#FFD700'} />
            <div>
              <h2 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '18px'
              }}>
                Badge Collection
              </h2>
              <p style={{
                color: darkMode ? '#888' : '#666',
                margin: '2px 0 0 0',
                fontSize: '11px'
              }}>
                {earnedCount} of {totalCount} badges earned
                {isOwnProfile && (
                  <span style={{ marginLeft: '10px' }}>
                    ({Math.round((earnedCount / totalCount) * 100)}% complete)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: darkMode ? '#888' : '#666',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div style={{
          padding: '8px 20px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: selectedCategory === category.id ? '#2196F3' : darkMode ? '#333' : '#f5f5f5',
                  color: selectedCategory === category.id ? 'white' : darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '14px' }}>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Rarity Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {rarities.map(rarity => (
              <button
                key={rarity.id}
                onClick={() => setSelectedRarity(rarity.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: selectedRarity === rarity.id ? rarity.color : darkMode ? '#333' : '#f5f5f5',
                  color: selectedRarity === rarity.id ? 'white' : darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                {rarity.name}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Grid */}
        <div style={{
          padding: '20px',
          maxHeight: 'calc(75vh - 180px)',
          overflowY: 'auto',
          scrollBehavior: 'smooth'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px'
          }}>
            {filteredBadges.map(badge => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              
              return (
                <div
                  key={badge.id}
                  style={{
                    backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                    borderRadius: '12px',
                    padding: '16px',
                    border: isEarned ? `2px solid ${badge.color}` : `2px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                    opacity: isEarned ? 1 : 0.6,
                    position: 'relative',
                    boxShadow: isEarned ? getRarityGlow(badge.rarity) : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Badge Icon */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '32px',
                      filter: isEarned ? 'none' : 'grayscale(100%)'
                    }}>
                      {isEarned ? badge.icon : '🔒'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: isEarned ? badge.color : darkMode ? '#666' : '#999',
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {badge.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: badge.color,
                          color: 'white',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          {badge.rarity}
                        </span>
                        {isEarned && (
                          <Star size={12} color={badge.color} fill={badge.color} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    color: darkMode ? '#b0b0b0' : '#666',
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {badge.description}
                  </p>

                  {/* Requirement/Share Section */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px'
                  }}>
                    <p style={{
                      color: darkMode ? '#888' : '#999',
                      margin: 0,
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      {isEarned ? '✅ Earned!' : `Requirement: ${badge.requirement}`}
                    </p>
                    
                    {/* Share Button - Only show for earned badges */}
                    {isEarned && isOwnProfile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareBadge(badge);
                          }}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${badge.color}`,
                            borderRadius: '4px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: badge.color,
                            fontSize: '10px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = badge.color;
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = badge.color;
                          }}
                          title="Share this badge"
                        >
                          <Share2 size={10} />
                          Share
                        </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: darkMode ? '#888' : '#666'
            }}>
              No badges found for the selected filters.
            </div>
          )}
        </div>
      </div>
      
      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
        }}
        shareData={shareData}
        darkMode={darkMode}
        profileUrl={profileUrl}
      />
    </div>
  );
};

export default BadgeModal;
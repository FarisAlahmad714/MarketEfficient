// pages/badge/[badgeId].js
import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeContext } from '../../contexts/ThemeContext';
import Navbar from '../../components/Navbar';
import { Trophy, Star, Award } from 'lucide-react';

const BadgeSharePage = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const { badgeId } = router.query;

  // All badge definitions (same as BadgeModal)
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
    // Add more badges as needed...
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
      id: 'market_obsessed',
      title: 'Market Obsessed',
      description: '200+ tests - Markets are your life',
      icon: '🔥',
      color: '#E74C3C',
      rarity: 'mythic',
      category: 'dedication',
      requirement: '200+ tests'
    }
  ];

  const badge = allBadges.find(b => b.id === badgeId);

  if (!badge) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0a0a0a' : '#f5f5f5',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          textAlign: 'center'
        }}>
          <h1>Badge not found</h1>
        </div>
      </div>
    );
  }

  const getRarityGlow = (rarity) => {
    const glows = {
      common: '0 0 20px rgba(255, 255, 255, 0.3)',
      rare: '0 0 20px rgba(52, 152, 219, 0.5)',
      epic: '0 0 25px rgba(155, 89, 182, 0.6)',
      legendary: '0 0 30px rgba(255, 215, 0, 0.7)',
      mythic: '0 0 35px rgba(231, 76, 60, 0.8)'
    };
    return glows[rarity] || glows.common;
  };

  return (
    <>
      <Head>
        <title>{badge.title} Badge - ChartSense</title>
        <meta name="description" content={`Check out this ${badge.rarity} badge: ${badge.description}`} />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={`${badge.title} Badge - ChartSense`} />
        <meta property="og:description" content={badge.description} />
        <meta property="og:image" content={`${process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000'}/api/og/badge?id=${badge.id}`} />
        <meta property="og:url" content={`${process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000'}/badge/${badge.id}`} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${badge.title} Badge - ChartSense`} />
        <meta name="twitter:description" content={badge.description} />
        <meta name="twitter:image" content={`${process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000'}/api/og/badge?id=${badge.id}`} />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0a0a0a' : '#f5f5f5',
        color: darkMode ? '#e0e0e0' : '#333'
      }}>
        <Navbar />
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.2)',
            border: `3px solid ${badge.color}`,
            position: 'relative'
          }}>
            {/* Badge Glow Effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '20px',
              boxShadow: getRarityGlow(badge.rarity),
              pointerEvents: 'none'
            }} />
            
            {/* Badge Icon */}
            <div style={{
              fontSize: '80px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}>
              {badge.icon}
            </div>
            
            {/* Badge Title */}
            <h1 style={{
              color: badge.color,
              margin: '0 0 10px 0',
              fontSize: '32px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {badge.title}
            </h1>
            
            {/* Rarity */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <span style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: badge.color,
                color: 'white',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '1px'
              }}>
                {badge.rarity}
              </span>
              <Star size={16} color={badge.color} fill={badge.color} />
            </div>
            
            {/* Description */}
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '18px',
              lineHeight: '1.6',
              marginBottom: '30px'
            }}>
              {badge.description}
            </p>
            
            {/* Requirement */}
            <div style={{
              backgroundColor: darkMode ? '#262626' : '#f9f9f9',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '30px'
            }}>
              <p style={{
                color: darkMode ? '#888' : '#666',
                margin: 0,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Award size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Requirement: {badge.requirement}
              </p>
            </div>
            
            {/* Call to Action */}
            <div style={{
              borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`,
              paddingTop: '20px'
            }}>
              <p style={{
                color: darkMode ? '#888' : '#666',
                margin: '0 0 15px 0',
                fontSize: '16px'
              }}>
                Think you can earn this badge?
              </p>
              <button
                onClick={() => router.push('/')}
                style={{
                  backgroundColor: badge.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
              >
                <Trophy size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Start Trading Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BadgeSharePage;
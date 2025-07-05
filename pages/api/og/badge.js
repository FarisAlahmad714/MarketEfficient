// pages/api/og/badge.js
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const badgeId = searchParams.get('id');

    // All badge definitions (same as BadgeModal)
    const allBadges = [
      {
        id: 'market_awakening',
        title: 'Market Awakening',
        description: 'Taken your first step into the trading matrix',
        icon: '🌅',
        color: '#FF6B35',
        rarity: 'common',
        category: 'initiation'
      },
      {
        id: 'chart_whisperer',
        title: 'Chart Whisperer',
        description: '95%+ average with 50+ tests - You see what others miss',
        icon: '🔮',
        color: '#8E44AD',
        rarity: 'mythic',
        category: 'mastery'
      },
      {
        id: 'pattern_prophet',
        title: 'Pattern Prophet',
        description: '90%+ average with 30+ tests - Predicting market moves',
        icon: '🧙‍♂️',
        color: '#FFD700',
        rarity: 'legendary',
        category: 'mastery'
      },
      {
        id: 'technical_sage',
        title: 'Technical Sage',
        description: '85%+ average with 20+ tests - True understanding',
        icon: '📜',
        color: '#2ECC71',
        rarity: 'epic',
        category: 'mastery'
      },
      {
        id: 'trend_hunter',
        title: 'Trend Hunter',
        description: '75%+ average with 15+ tests - Tracking the flow',
        icon: '🎯',
        color: '#3498DB',
        rarity: 'rare',
        category: 'mastery'
      },
      {
        id: 'bias_destroyer',
        title: 'Bias Destroyer',
        description: '25+ bias tests with 80%+ avg - Mind over emotions',
        icon: '🧠',
        color: '#E74C3C',
        rarity: 'legendary',
        category: 'psychology'
      },
      {
        id: 'emotional_warrior',
        title: 'Emotional Warrior',
        description: '15+ bias tests with 70%+ avg - Conquering fear & greed',
        icon: '⚔️',
        color: '#9B59B6',
        rarity: 'epic',
        category: 'psychology'
      },
      {
        id: 'self_aware',
        title: 'Self-Aware',
        description: '10+ bias tests - Know thy trading self',
        icon: '🪞',
        color: '#F39C12',
        rarity: 'rare',
        category: 'psychology'
      },
      {
        id: 'flawless_legend',
        title: 'Flawless Legend',
        description: '20+ perfect scores - Absolute market precision',
        icon: '💎',
        color: '#1ABC9C',
        rarity: 'mythic',
        category: 'perfection'
      },
      {
        id: 'precision_master',
        title: 'Precision Master',
        description: '10+ perfect scores - Surgical accuracy',
        icon: '🎯',
        color: '#FFD700',
        rarity: 'legendary',
        category: 'perfection'
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: '5+ perfect scores - Demanding excellence',
        icon: '✨',
        color: '#3498DB',
        rarity: 'epic',
        category: 'perfection'
      },
      {
        id: 'market_obsessed',
        title: 'Market Obsessed',
        description: '200+ tests - Markets are your life',
        icon: '🔥',
        color: '#E74C3C',
        rarity: 'mythic',
        category: 'dedication'
      },
      {
        id: 'chart_addict',
        title: 'Chart Addict',
        description: '100+ tests - Can\'t stop analyzing',
        icon: '📊',
        color: '#9B59B6',
        rarity: 'legendary',
        category: 'dedication'
      },
      {
        id: 'committed_student',
        title: 'Committed Student',
        description: '50+ tests - Serious about learning',
        icon: '📚',
        color: '#2ECC71',
        rarity: 'epic',
        category: 'dedication'
      },
      {
        id: 'dedicated_learner',
        title: 'Dedicated Learner',
        description: '25+ tests - Building knowledge',
        icon: '🎓',
        color: '#F39C12',
        rarity: 'rare',
        category: 'dedication'
      },
      {
        id: 'market_maniac',
        title: 'Market Maniac',
        description: '15+ tests in one week - Unstoppable momentum',
        icon: '⚡',
        color: '#E74C3C',
        rarity: 'legendary',
        category: 'consistency'
      },
      {
        id: 'weekly_warrior',
        title: 'Weekly Warrior',
        description: '10+ tests in one week - Intense focus',
        icon: '🗡️',
        color: '#9B59B6',
        rarity: 'epic',
        category: 'consistency'
      },
      {
        id: 'monthly_grinder',
        title: 'Monthly Grinder',
        description: '20+ tests this month - Steady progress',
        icon: '⚙️',
        color: '#3498DB',
        rarity: 'rare',
        category: 'consistency'
      }
    ];

    const badge = allBadges.find(b => b.id === badgeId);

    if (!badge) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              textAlign: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              flexWrap: 'nowrap',
              backgroundColor: '#1a1a1a',
              color: 'white',
            }}
          >
            <div style={{ fontSize: 60 }}>❌</div>
            <div style={{ fontSize: 40 }}>Badge Not Found</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            backgroundColor: '#1a1a1a',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #2a2a2a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #2a2a2a 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        >
          {/* Badge Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '30px',
              padding: '60px',
              border: `4px solid ${badge.color}`,
              boxShadow: `0 0 100px ${badge.color}40`,
            }}
          >
            {/* Badge Icon */}
            <div style={{ fontSize: 120, marginBottom: 20 }}>
              {badge.icon}
            </div>
            
            {/* Badge Title */}
            <div
              style={{
                fontSize: 50,
                fontWeight: 'bold',
                color: badge.color,
                marginBottom: 15,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {badge.title}
            </div>
            
            {/* Rarity Badge */}
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'white',
                backgroundColor: badge.color,
                padding: '8px 20px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: 20,
              }}
            >
              ⭐ {badge.rarity}
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: 28,
                color: '#e0e0e0',
                maxWidth: '800px',
                lineHeight: 1.3,
                marginBottom: 30,
              }}
            >
              {badge.description}
            </div>
            
            {/* ChartSense Branding */}
            <div
              style={{
                fontSize: 24,
                color: '#888',
                fontWeight: 500,
              }}
            >
              🏆 ChartSense Badge Achievement
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
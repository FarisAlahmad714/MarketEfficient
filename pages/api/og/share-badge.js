// pages/api/og/share-badge.js
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Badge Achievement';
    const description = searchParams.get('description') || 'Earned a badge on ChartSense!';
    const username = searchParams.get('username') || 'User';
    const icon = searchParams.get('icon') || '🏆';
    const color = searchParams.get('color') || '#2196F3';
    const rarity = searchParams.get('rarity') || 'Badge';

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
              padding: '50px',
              border: `4px solid ${color}`,
              boxShadow: `0 0 100px ${color}40`,
              position: 'relative',
            }}
          >
            {/* Username Badge */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: color,
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              @{username}
            </div>
            
            {/* Badge Icon */}
            <div style={{ fontSize: '100px', marginBottom: 20 }}>
              {icon}
            </div>
            
            {/* Badge Title */}
            <div
              style={{
                fontSize: 45,
                fontWeight: 'bold',
                color: color,
                marginBottom: 15,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                maxWidth: '800px',
              }}
            >
              {title}
            </div>
            
            {/* Rarity Badge */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                backgroundColor: color,
                padding: '6px 16px',
                borderRadius: '15px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 20,
              }}
            >
              ⭐ {rarity}
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: 24,
                color: '#e0e0e0',
                maxWidth: '700px',
                lineHeight: 1.3,
                marginBottom: 30,
              }}
            >
              {description}
            </div>
            
            {/* Achievement Banner */}
            <div
              style={{
                fontSize: 20,
                color: '#888',
                fontWeight: 500,
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '10px 20px',
                borderRadius: '10px',
              }}
            >
              🏆 Badge earned on ChartSense
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
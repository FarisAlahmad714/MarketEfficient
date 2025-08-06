import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Award, Zap, ChevronRight } from 'lucide-react';

const VideoFeatureCard = ({ darkMode, icon, title, description, link, linkText, color, accentColor, benefits, videoTitle }) => {
  const IconComponent = icon;
  const videoRef = React.useRef(null);
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const handleMouseEnter = () => {
    if (!isMobile && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const getVideoFile = (title) => {
    const videoMap = {
      'Study Hub': 'EARTH',
      'Comprehensive Study Hub': 'EARTH',
      'AI Bias Test': 'FIRE',
      'AI-Powered Bias Test': 'FIRE',
      'Chart Analysis Exam': 'RAIN',
      'Hands-On Charting Exams': 'RAIN',
      'Comprehensive Analytics Hub': 'SNOW',
      'Analytics Hub': 'SNOW',
      'Trading Sandbox': 'DNA',
      'Sandbox Trading Environment': 'DNA'
    };
    return videoMap[title] || 'EARTH';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 45 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: darkMode
          ? `linear-gradient(145deg, rgba(15, 15, 15, 0.95), rgba(25, 25, 25, 0.9)), radial-gradient(circle at 30% 30%, ${color}15, transparent 70%)`
          : `linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9)), radial-gradient(circle at 30% 30%, ${color}08, transparent 70%)`,
        borderRadius: '24px',
        border: darkMode 
          ? `1px solid rgba(255, 255, 255, 0.1)` 
          : `1px solid rgba(0, 0, 0, 0.05)`,
        boxShadow: darkMode
          ? `0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px ${accentColor}20, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : `0 25px 60px rgba(0, 0, 0, 0.15), 0 0 40px ${accentColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
        transformStyle: 'preserve-3d',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backdropFilter: 'blur(20px)',
      }}
      whileHover={{
        y: -8,
        rotateY: 2,
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
    >
      {/* Floating Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: accentColor,
              borderRadius: '50%',
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div style={{ padding: 'clamp(20px, 4vw, 30px)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 2 }}>
        
        {/* Actual Video Section */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            borderRadius: '20px',
            padding: '0',
            marginBottom: '25px',
            border: `2px solid ${accentColor}60`,
            position: 'relative',
            overflow: 'hidden',
            minHeight: '120px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <video
            ref={videoRef}
            autoPlay={isMobile}
            muted
            loop
            playsInline
            preload="auto"
            style={{
              width: '100%',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '18px',
            }}
          >
            <source src={`/videos/${getVideoFile(title)}.mp4`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Video Title Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '8px',
            padding: '8px 12px',
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.2,
            }}>
              {videoTitle || title}
            </span>
          </div>
        </motion.div>

        {/* Feature Header with Enhanced Design */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            style={{
              padding: '14px',
              background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}40)`,
              borderRadius: '16px',
              border: `2px solid ${accentColor}60`,
              marginRight: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(45deg, transparent, ${accentColor}30, transparent)`,
              transform: 'translateX(-100%)',
              animation: 'shimmer 2s infinite',
            }} />
            <IconComponent size={28} color={accentColor} style={{ position: 'relative', zIndex: 1 }} />
          </motion.div>
          <div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: darkMode ? '#F5F5F5' : '#1A1A1A',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}>{title}</h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
            }}>
              <Sparkles size={14} color={accentColor} />
              <span style={{
                fontSize: '12px',
                color: accentColor,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Premium Feature
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Description */}
        <p style={{
          fontSize: '14px',
          color: darkMode ? '#C0C0C0' : '#555',
          lineHeight: '1.6',
          marginBottom: '20px',
          letterSpacing: '0.2px',
        }}>{description}</p>

        {/* Benefits with Progress Indicators */}
        {benefits && benefits.length > 0 && (
          <div style={{ marginBottom: '25px', flexGrow: 1 }}>
            <h4 style={{
              fontSize: '13px',
              fontWeight: 700,
              color: darkMode ? '#888' : '#666',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Award size={14} color={accentColor} />
              Key Benefits
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {benefits.map((benefit, index) => (
                <motion.li 
                  key={index} 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <Zap size={14} color={accentColor} style={{ marginRight: '10px', flexShrink: 0 }} />
                  <span style={{ 
                    fontSize: '13px',
                    color: darkMode ? '#B0B0B0' : '#666',
                    lineHeight: 1.4,
                  }}>{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Enhanced CTA Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href={link} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 24px',
            background: `linear-gradient(135deg, ${color}, ${accentColor})`,
            color: '#FFFFFF',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '14px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            boxShadow: `0 8px 25px ${accentColor}40`,
            border: `1px solid ${accentColor}80`,
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = `0 12px 35px ${accentColor}60`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = `0 8px 25px ${accentColor}40`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <span>{linkText}</span>
            <ChevronRight size={16} />
          </Link>
        </motion.div>
      </div>
      
      {/* Shimmer Animation CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </motion.div>
  );
};

export default VideoFeatureCard;
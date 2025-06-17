// pages/index.js
import Link from 'next/link';
import { useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import Leaderboard from '../components/Leaderboard';
import { ShieldCheck, BarChart2, Users, Zap, Brain, LineChart as LucideLineChart, BookOpen, TrendingUp, Play, Clock, Target, TrendingDown, Award, Star, Eye, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import TrackedPage from '../components/TrackedPage';
import logger from '../lib/logger';
import heroStyles from '../styles/Hero.module.css';

// Enhanced FeatureCard Component with Clean Design
const FeatureCard = ({ darkMode, icon, title, description, link, linkText, color, accentColor, benefits, videoTitle }) => {
  const IconComponent = icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 45 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
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
        
        {/* Clean Video Section */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))`,
            borderRadius: '20px',
            padding: '0',
            marginBottom: '25px',
            border: `2px solid ${accentColor}60`,
            position: 'relative',
            overflow: 'hidden',
            minHeight: '120px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            background: `linear-gradient(45deg, ${color}40, ${accentColor}60)`,
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Play Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
            </motion.div>

            {/* Video Title */}
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
                {videoTitle}
              </span>
            </div>
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

export default function HomePage() {
  const { darkMode } = useContext(ThemeContext);
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    logger.log('Home page loaded');
  }, []);

  return (
    <TrackedPage>
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '0 clamp(15px, 4vw, 40px) 60px',
      fontFamily: "'Poppins', sans-serif",
      background: darkMode ? '#121212' : '#F8FAFC',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      {/* Enhanced Hero Section */}
  <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        textAlign: 'center',
        padding: '120px 20px',
        marginBottom: '80px',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: darkMode 
          ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.3)' 
          : '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 20px rgba(34, 197, 94, 0.3)',
        border: darkMode 
          ? '1px solid rgba(59, 130, 246, 0.4)' 
          : '1px solid rgba(34, 197, 94, 0.4)',
      }}
    >
      <div className={`${heroStyles.heroBackground} ${darkMode ? heroStyles.dark : heroStyles.light}`}>
        <div className={heroStyles.animatedGradient}></div>
        <ul className={heroStyles.particles}>
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className={heroStyles.particle}></li>
          ))}
        </ul>
      </div>
      <motion.div
        style={{ position: 'relative', zIndex: 2 }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
      >
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '20px',
            lineHeight: 1.1,
            textShadow: darkMode 
              ? '0 6px 15px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(59, 130, 246, 0.4)' 
              : '0 6px 15px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(34, 197, 94, 0.4)',
            letterSpacing: '0.5px',
          }}
        >
          Unleash Your Trading Potential with ChartSense
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
            color: '#E5E7EB',
            marginBottom: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: 500,
            textShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
          }}
        >
          Master the markets with cutting-edge AI, hands-on practice, and deep analytics. Your journey to trading greatness starts here.
        </motion.p>
        <motion.div
          style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7, ease: 'easeOut' }}
        >
          {isAuthenticated ? (
            <Link 
              href="/dashboard" 
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '1.2rem',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.5), 0 0 15px rgba(34, 197, 94, 0.3)',
              }}
            >
              Dive into Your Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/learn-more"
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 20px rgba(34, 197, 94, 0.5), 0 0 15px rgba(34, 197, 94, 0.3)',
                }}
              >
                Learn More
              </Link>
              <Link 
                href="/auth/register" 
                style={{
                  padding: '16px 40px',
                  background: 'transparent',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  border: '2px solid #FFFFFF',
                }}
              >
                Register Now!
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.section>

      {/* Feature Cards Section */}
      <section style={{ marginBottom: '80px' }}>
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '60px',
            textShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
            letterSpacing: '-1px',
          }}
        >
          Master the Markets with Premium Features
        </motion.h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
          gap: 'clamp(20px, 3vw, 35px)',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <FeatureCard
            darkMode={darkMode}
            icon={BookOpen}
            title="Comprehensive Study Hub"
            description="Access a curated library of essential trading knowledge designed to accelerate your learning curve. From fundamental market mechanics to advanced trading strategies, our study materials combine theoretical depth with practical application. Each module includes interactive elements, real-world case studies, and progressive assessments to ensure knowledge retention. Whether you're building foundational understanding or diving into sophisticated concepts like market microstructure and algorithmic trading patterns, the study hub provides structured learning paths tailored to your experience level and trading goals."
            benefits={[
              "Structured learning paths from beginner to advanced levels",
              "Interactive modules with real-world case studies",
              "Essential market mechanics and trading strategy coverage",
              "Progressive assessments to ensure knowledge retention",
              "Advanced topics including market microstructure analysis"
            ]}
            link="/study"
            linkText="Expand Your Knowledge"
            color="#8B5CF6"
            accentColor="#A78BFA"
            videoTitle="Accelerate Your Learning"
          />
          <FeatureCard
            darkMode={darkMode}
            icon={Brain}
            title="AI-Powered Bias Test"
            description="Transform your trading psychology with cutting-edge AI analysis. Every day, confront real market scenarios that expose your hidden biases and cognitive traps. Submit your predictions with detailed reasoning, then receive personalized AI feedback that dissects your decision-making patterns. This revolutionary approach combines behavioral finance with machine learning to create a mirror for your trading mind—revealing blind spots, confirming strengths, and building the mental resilience needed to consistently profit in volatile markets."
            benefits={[
              "Expose and eliminate unconscious trading biases",
              "Receive personalized AI analysis of your reasoning patterns", 
              "Build mental resilience through daily psychological challenges",
              "Track bias reduction progress with detailed metrics",
              "Develop consistent decision-making under market pressure"
            ]}
            link="/bias-test"
            linkText="Confront Your Biases"
            color="#22C55E"
            accentColor="#4ADE80"
            videoTitle="Master Your Trading Psychology"
          />
          <FeatureCard
            darkMode={darkMode}
            icon={LucideLineChart}
            title="Hands-On Charting Exams"
            description="Enter the ultimate technical analysis training ground where theory meets practice. Master three critical charting skills through interactive, gamified exams: precise swing point identification for trend analysis, strategic Fibonacci retracement placement for entry/exit timing, and fair value gap recognition for institutional-level market reading. Each exam uses real market data with progressive difficulty levels, from beginner-friendly scenarios to expert-level challenges that mirror actual trading conditions. Perfect your chart reading skills in a risk-free environment before applying them to live markets."
            benefits={[
              "Master swing points for accurate trend identification",
              "Perfect Fibonacci retracements for optimal entry/exit timing",
              "Identify fair value gaps like institutional traders",
              "Practice on real historical market data scenarios", 
              "Progressive difficulty from beginner to expert level"
            ]}
            link="/chart-exam"
            linkText="Sharpen Your Skills"
            color="#3B82F6"
            accentColor="#60A5FA"
            videoTitle="Master Technical Analysis"
          />
          <FeatureCard
            darkMode={darkMode}
            icon={BarChart2}
            title="Comprehensive Analytics Hub"
            description="Your personal trading performance command center powered by advanced analytics and AI insights. Track every aspect of your learning journey with precision: bias test scores, charting accuracy rates, improvement trends, and detailed breakdowns of your strongest and weakest areas. The dashboard doesn't just show numbers—it tells the story of your trading evolution through interactive charts, heat maps, and AI-generated insights that pinpoint exactly where to focus your efforts next. Set goals, monitor streaks, and compare your progress against other traders to maintain momentum and competitive edge."
            benefits={[
              "Comprehensive performance tracking across all features",
              "AI-powered insights identifying improvement opportunities", 
              "Interactive charts and visualizations of your progress",
              "Detailed accuracy breakdowns by test type and market condition",
              "Goal setting and achievement tracking with streak monitoring"
            ]}
            link="/dashboard"
            linkText="Analyze Your Edge"
            color="#F59E0B"
            accentColor="#FBBF24"
            videoTitle="Track Your Trading Evolution"
          />
          <FeatureCard
            darkMode={darkMode}
            icon={TrendingUp}
            title="Sandbox Trading Environment"
            description="Step into a realistic virtual trading environment where you can test strategies, practice execution, and build confidence without risking real capital. Our sandbox simulates live market conditions with real-time data feeds, realistic slippage, and authentic market dynamics. Practice position sizing, risk management, and order execution while tracking your virtual P&L. The environment includes various market conditions—trending, ranging, and volatile scenarios—allowing you to experience how your strategies perform across different market cycles. Unlock access by demonstrating competency in bias tests and charting exams."
            benefits={[
              "Risk-free trading practice with realistic market simulation",
              "Real-time data feeds with authentic market dynamics",
              "Practice position sizing and risk management strategies",
              "Experience various market conditions and volatility scenarios",
              "Unlock access through demonstrated skill progression"
            ]}
            link="/sandbox"
            linkText="Practice Trading"
            color="#EF4444"
            accentColor="#F87171"
            videoTitle="Practice Risk-Free Trading"
          />
        </div>
      </section>

      {/* Leaderboard Section */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 800,
          color: darkMode ? '#F5F5F5' : '#1E293B',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}>
          <Users size={40} color={darkMode ? '#FCD34D' : '#F59E0B'} />
          Community Leaderboard
          <Users size={40} color={darkMode ? '#FCD34D' : '#F59E0B'} />
        </h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            background: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Leaderboard />
          <p style={{
            textAlign: 'center',
            color: darkMode ? '#B0B0B0' : '#6B7280',
            marginTop: '20px',
            fontSize: '1.1rem',
          }}>
            See where you stand among the best. Climb the ranks and claim your spot!
          </p>
        </motion.div>
      </section>
    </div>
    </TrackedPage>
  );
}
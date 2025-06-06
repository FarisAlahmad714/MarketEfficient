// pages/index.js
import Link from 'next/link';
import { useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import Leaderboard from '../components/Leaderboard';
import { ShieldCheck, BarChart2, Users, Zap, Brain, LineChart as LucideLineChart } from 'lucide-react';
import { motion } from 'framer-motion';
import TrackedPage from '../components/TrackedPage';
import logger from '../lib/logger';

// FeatureCard Component with Enhanced Design and Information
const FeatureCard = ({ darkMode, icon, title, description, link, linkText, color, accentColor, benefits }) => {
  const IconComponent = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true }}
      style={{
        background: darkMode
          ? `linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95)), ${color}22`
          : `linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.95)), ${color}11`,
        borderRadius: '20px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode
          ? `0 15px 40px rgba(0, 0, 0, 0.4), inset 0 0 2px ${accentColor}33`
          : `0 15px 40px rgba(0, 0, 0, 0.1), inset 0 0 2px ${accentColor}22`,
        transformStyle: 'preserve-3d',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '35px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateZ(20px) scale(1.05)';
        e.currentTarget.style.boxShadow = darkMode
          ? `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px ${accentColor}66`
          : `0 25px 50px rgba(0, 0, 0, 0.15), 0 0 30px ${accentColor}44`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateZ(0) scale(1)';
        e.currentTarget.style.boxShadow = darkMode
          ? `0 15px 40px rgba(0, 0, 0, 0.4), inset 0 0 2px ${accentColor}33`
          : `0 15px 40px rgba(0, 0, 0, 0.1), inset 0 0 2px ${accentColor}22`;
      }}
    >
      {/* Dynamic Background Element */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at 20% 20%, ${accentColor}11 0%, transparent 50%)`,
        opacity: darkMode ? 0.6 : 0.4,
        zIndex: 0,
        transform: 'rotate(10deg)',
      }}></div>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
          {IconComponent && (
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              style={{
                padding: '15px',
                background: `${accentColor}33`,
                borderRadius: '12px',
                border: `1px solid ${accentColor}88`,
                marginRight: '20px',
              }}
            >
              <IconComponent size={35} color={accentColor} />
            </motion.div>
          )}
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: darkMode ? '#F5F5F5' : '#1A1A1A',
            margin: 0,
            lineHeight: 1.2,
          }}>{title}</h2>
        </div>
        <p style={{
          fontSize: '16px',
          color: darkMode ? '#D0D0D0' : '#4A4A4A',
          lineHeight: '1.8',
          marginBottom: '20px',
        }}>{description}</p>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 30px 0',
          color: darkMode ? '#B0B0B0' : '#5A5A5A',
          fontSize: '15px',
          lineHeight: '1.7',
          flexGrow: 1,
        }}>
          {benefits.map((benefit, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <Zap size={18} color={accentColor} style={{ marginRight: '12px' }} />
              {benefit}
            </li>
          ))}
        </ul>
        <Link href={link} style={{
          display: 'inline-block',
          padding: '14px 30px',
          background: `linear-gradient(90deg, ${color}, ${accentColor})`,
          color: '#FFFFFF',
          textDecoration: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '16px',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          marginTop: 'auto',
          boxShadow: `0 6px 15px ${accentColor}66`,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 8px 20px ${accentColor}99`;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 6px 15px ${accentColor}66`;
        }}
        >
          {linkText}
        </Link>
      </div>
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
      padding: '0 20px 60px',
      fontFamily: "'Poppins', sans-serif",
      background: darkMode ? '#121212' : '#F8FAFC',
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
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: darkMode 
            ? 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 25%, #1e40af 50%, #7c3aed 75%, #1e1b4b 100%)' 
            : 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 25%, #1d4ed8 50%, #8b5cf6 75%, #dbeafe 100%)',
          zIndex: 1,
        }}
      />
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
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(34, 197, 94, 0.7), 0 0 20px rgba(34, 197, 94, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.5), 0 0 15px rgba(34, 197, 94, 0.3)';
              }}
            >
              Dive into Your Dashboard
            </Link>
          ) : (
            <Link 
              href="/auth/register" 
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '1.2rem',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              Begin Your Epic Journey
            </Link>
          )}
          <Link 
            href="auth/register" 
            style={{
              padding: '16px 40px',
              background: 'transparent',
              border: `2px solid ${darkMode ? '#FFFFFF' : '#FFFFFF'}`,
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '1.2rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FFFFFF33';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.2)';
            }}
          >
           Register Now!
          </Link>
        </motion.div>
      </motion.div>
    </motion.section>

      {/* Feature Cards Section */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: 800,
          color: darkMode ? '#F5F5F5' : '#1E293B',
          marginBottom: '50px',
          textShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
        }}>
          Power Up Your Trading Arsenal
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '40px',
        }}>
          <FeatureCard
            darkMode={darkMode}
            icon={Brain}
            title="AI-Powered Bias Test"
            description="Dive into daily challenges that expose your hidden market biases. Submit predictions and reasoning based on real historical data, then get a personalized AI breakdown of your decision-making. This isn’t just a test—it’s a mirror to sharpen your instincts and dominate the markets."
            benefits={[
              "Reveal unconscious trading blind spots",
              "Boost decision-making precision with AI insights",
              "Build confidence for live trading scenarios",
            ]}
            link="/bias-test"
            linkText="Confront Your Biases"
            color="#22C55E"
            accentColor="#4ADE80"
          />
          <FeatureCard
            darkMode={darkMode}
            icon={LucideLineChart}
            title="Hands-On Charting Exams"
            description="Step into the ultimate charting dojo. Practice spotting swing points, drawing Fibonacci levels, and identifying fair value gaps on interactive, simulated charts. It’s like a gym for your technical analysis skills—train hard, trade smart."
            benefits={[
              "Master advanced charting techniques",
              "Develop razor-sharp pattern recognition",
              "Simulate real-world trading without the risk",
            ]}
            link="/chart-exam"
            linkText="Sharpen Your Skills"
            color="#3B82F6"
            accentColor="#60A5FA"
          />
          <FeatureCard
            darkMode={darkMode}
            icon={BarChart2}
            title="Comprehensive Analytics Hub"
            description="Unlock the full story of your trading evolution. Dive into detailed stats—scores, accuracy, pitfalls, and AI-analyzed reasoning trends. This is your command center to spot weaknesses, double down on strengths, and rise above the competition."
            benefits={[
              "Track your growth with precision",
              "Pinpoint and fix trading flaws fast",
              "Compare your stats with top traders",
            ]}
            link="/dashboard"
            linkText="Analyze Your Edge"
            color="#F59E0B"
            accentColor="#FBBF24"
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
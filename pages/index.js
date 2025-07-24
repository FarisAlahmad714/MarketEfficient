// pages/index.js
import Link from 'next/link';
import Head from 'next/head';
import React, { useEffect, useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import Leaderboard from '../components/Leaderboard';
import { ShieldCheck, BarChart2, Users, Zap, Brain, LineChart as LucideLineChart, BookOpen, TrendingUp, Play, Clock, Target, TrendingDown, Award, Star, Eye, ChevronRight, Sparkles, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import TrackedPage from '../components/TrackedPage';
import logger from '../lib/logger';
import heroStyles from '../styles/Hero.module.css';

// Streamlined FeatureCard Component
const FeatureCard = ({ darkMode, icon, title, description, link, linkText, color, accentColor, benefits, step }) => {
  const IconComponent = icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        border: darkMode 
          ? `1px solid rgba(255, 255, 255, 0.1)` 
          : `1px solid rgba(0, 0, 0, 0.08)`,
        boxShadow: darkMode
          ? '0 10px 30px rgba(0, 0, 0, 0.3)'
          : '0 10px 30px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        padding: 'clamp(24px, 4vw, 32px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      whileHover={{
        y: -4,
        boxShadow: darkMode
          ? '0 15px 40px rgba(0, 0, 0, 0.4)'
          : '0 15px 40px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Step Badge */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: `${color}20`,
        color: color,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        border: `1px solid ${color}40`,
      }}>
        Step {step}
      </div>

      {/* Icon and Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: `${color}15`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <IconComponent size={24} color={color} />
        </div>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: darkMode ? '#F5F5F5' : '#1E293B',
          marginBottom: '12px',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h3>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.95rem',
        color: darkMode ? '#94A3B8' : '#64748B',
        lineHeight: '1.7',
        marginBottom: '24px',
      }}>
        {description}
      </p>

      {/* Key Benefits */}
      <div style={{ marginBottom: '24px', flexGrow: 1 }}>
        <h4 style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: darkMode ? '#CBD5E1' : '#475569',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          What You'll Get
        </h4>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {benefits.slice(0, 3).map((benefit, index) => (
            <li 
              key={index} 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                <Star size={12} color={color} fill={color} />
              </div>
              <span style={{ 
                fontSize: '0.9rem',
                color: darkMode ? '#94A3B8' : '#64748B',
                lineHeight: 1.5,
              }}>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <Link href={link} style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: color,
        color: '#FFFFFF',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        width: '100%',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 20px ${color}40`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <span>{linkText}</span>
        <ChevronRight size={16} />
      </Link>
    </motion.div>
  );
};

// Export getStaticProps to ensure server-side rendering of meta tags
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 3600 // Revalidate every hour
  };
}

// Helper function to map feature titles to video files
const getVideoFile = (title) => {
  const videoMap = {
    'Comprehensive Study Hub': 'EARTH',
    'AI-Powered Bias Test': 'FIRE', 
    'Hands-On Charting Exams': 'RAIN',
    'Comprehensive Analytics Hub': 'SNOW',
    'Sandbox Trading Environment': 'DNA'
  };
  return videoMap[title] || 'EARTH';
};

export default function HomePage() {
  const { darkMode } = useContext(ThemeContext);
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    logger.log('Home page loaded');
  }, []);

  return (
    <TrackedPage>
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '0 clamp(16px, 4vw, 40px) 60px',
      fontFamily: "'Poppins', sans-serif",
      background: darkMode ? '#121212' : '#F8FAFC',
      minHeight: '100vh',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      
      {/* Hero Section - Clear Value Proposition */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          padding: 'clamp(60px, 10vw, 80px) 20px clamp(40px, 8vw, 60px)',
          marginBottom: 'clamp(40px, 8vw, 60px)',
          position: 'relative',
        }}
      >
        {/* Trust Badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: darkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
            borderRadius: '20px',
            marginBottom: '24px',
            border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
          }}
        >
          <ShieldCheck size={16} color="#22C55E" />
          <span style={{
            fontSize: '14px',
            color: '#22C55E',
            fontWeight: 600,
          }}>
            The Only Complete Trading Education Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '24px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: '900px',
            margin: '0 auto 24px',
          }}
        >
          Stop Jumping Between Courses.
          <br />
          <span style={{ color: '#22C55E' }}>Start Actually Trading.</span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
            color: darkMode ? '#B0B0B0' : '#64748B',
            marginBottom: '40px',
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: '1.6',
            fontWeight: 500,
          }}
        >
          ChartSense is the first platform that takes you from psychological assessment to confident execution. 
          No more static videos or useless quizzes—just real skills, real practice, real results.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '32px',
            padding: '0 16px',
          }}
        >
          {isAuthenticated ? (
            <Link 
              href="/dashboard" 
              style={{
                padding: '14px 32px',
                background: '#22C55E',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.25)';
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                style={{
                  padding: '14px 32px',
                  background: '#22C55E',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.25)';
                }}
              >
                Start Free Trial
              </Link>
              <Link 
                href="#how-it-works" 
                style={{
                  padding: '14px 32px',
                  background: 'transparent',
                  color: darkMode ? '#F5F5F5' : '#1E293B',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: `2px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#22C55E';
                  e.currentTarget.style.color = '#22C55E';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#374151' : '#E5E7EB';
                  e.currentTarget.style.color = darkMode ? '#F5F5F5' : '#1E293B';
                }}
              >
                See How It Works
              </Link>
            </>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            marginTop: '40px',
            padding: '0 16px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22C55E' }}>5-Step</div>
            <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Learning Pipeline</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3B82F6' }}>3 Unique</div>
            <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Practice Modes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>AI-Powered</div>
            <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Bias Analysis</div>
          </div>
        </motion.div>
      </motion.section>

      {/* The Problem Section */}
      <section style={{ marginBottom: '80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '24px',
            letterSpacing: '-0.02em',
          }}>
            Why 90% of Traders Fail
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            lineHeight: '1.7',
            marginBottom: '40px',
          }}>
            Traditional trading education is broken. You watch videos, read PDFs, maybe take a quiz—then you're thrown into the markets with no practical experience. 
            It's like learning to swim from a textbook.
          </p>
          
          {/* Comparison Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '60px',
            padding: '0 16px',
          }}>
            <motion.div
              whileHover={{ y: -4 }}
              style={{
                padding: '24px',
                background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '12px',
                textAlign: 'left',
              }}
            >
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#EF4444',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <TrendingDown size={20} />
                Other Platforms
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                color: darkMode ? '#C0C0C0' : '#6B7280',
                fontSize: '0.95rem',
                lineHeight: '1.8',
              }}>
                <li>❌ Static video courses</li>
                <li>❌ No practice environment</li>
                <li>❌ No psychological training</li>
                <li>❌ Basic multiple-choice quizzes</li>
                <li>❌ Learn in isolation</li>
              </ul>
            </motion.div>
            
            <motion.div
              whileHover={{ y: -4 }}
              style={{
                padding: '24px',
                background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
                borderRadius: '12px',
                textAlign: 'left',
              }}
            >
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#22C55E',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <TrendingUp size={20} />
                ChartSense
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                color: darkMode ? '#C0C0C0' : '#6B7280',
                fontSize: '0.95rem',
                lineHeight: '1.8',
              }}>
                <li>✅ Interactive skill-building</li>
                <li>✅ Risk-free trading sandbox</li>
                <li>✅ AI bias detection & training</li>
                <li>✅ Hands-on chart analysis</li>
                <li>✅ Complete learning pipeline</li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works - Pipeline Visualization */}
      <section id="how-it-works" style={{ marginBottom: '80px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}>
            Your Journey to Trading Success
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Follow our proven 5-step pipeline—the only complete path from beginner to confident trader
          </p>
        </motion.div>

        {/* Pipeline Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          padding: '0 16px',
        }}>
          {[
            { icon: BookOpen, title: 'Learn Fundamentals', desc: 'Master core concepts', color: '#8B5CF6' },
            { icon: Brain, title: 'Fix Your Biases', desc: 'AI psychological training', color: '#22C55E' },
            { icon: LucideLineChart, title: 'Practice Charts', desc: 'Hands-on technical analysis', color: '#3B82F6' },
            { icon: TrendingUp, title: 'Trade Risk-Free', desc: 'Sandbox environment', color: '#F59E0B' },
            { icon: BarChart2, title: 'Track Progress', desc: 'Analytics & insights', color: '#EF4444' },
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={{
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Step Number */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '30px',
                height: '30px',
                background: step.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                zIndex: 2,
              }}>
                {index + 1}
              </div>
              
              {/* Step Card */}
              <div style={{
                padding: '32px 20px 24px',
                background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
                height: '100%',
              }}>
                <step.icon size={32} color={step.color} style={{ marginBottom: '12px' }} />
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: darkMode ? '#F5F5F5' : '#1E293B',
                  marginBottom: '8px',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#94A3B8' : '#64748B',
                  margin: 0,
                }}>
                  {step.desc}
                </p>
              </div>
              
              {/* Connector Line - Hide on mobile */}
              {index < 4 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  width: '100%',
                  height: '2px',
                  background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  zIndex: 1,
                  display: window.innerWidth < 768 ? 'none' : 'block',
                }} />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Cards Section */}
      <section style={{ marginBottom: '80px' }}>
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '60px',
            letterSpacing: '-0.02em',
          }}
        >
          Everything You Need in One Platform
        </motion.h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
          gap: '24px',
          width: '100%',
        }}>
          <FeatureCard
            darkMode={darkMode}
            icon={BookOpen}
            title="Study Hub"
            description="Build your foundation with structured lessons covering everything from market basics to advanced strategies. Interactive modules and real-world case studies ensure you actually understand the concepts, not just memorize them."
            benefits={[
              "Interactive lessons that adapt to your level",
              "Real market examples and case studies",
              "Progress tracking with knowledge checks"
            ]}
            link="/study"
            linkText="Start Learning"
            color="#8B5CF6"
            step={1}
          />
          <FeatureCard
            darkMode={darkMode}
            icon={Brain}
            title="AI Bias Detection"
            description="Discover and eliminate the psychological biases killing your profits. Our AI analyzes your trading decisions, exposes hidden patterns, and provides personalized feedback to rewire your trading mindset."
            benefits={[
              "Daily scenarios that expose hidden biases",
              "AI analysis of your decision patterns",
              "Track improvement over time"
            ]}
            link="/bias-test"
            linkText="Test Your Mind"
            color="#22C55E"
            step={2}
          />
          <FeatureCard
            darkMode={darkMode}
            icon={LucideLineChart}
            title="Chart Mastery"
            description="Practice reading charts like a pro with hands-on exams. Master swing points, Fibonacci levels, and fair value gaps using real market data. No theory—just practical skills you'll use every day."
            benefits={[
              "Three core technical analysis skills",
              "Practice on real historical charts",
              "Instant feedback on accuracy"
            ]}
            link="/chart-exam"
            linkText="Practice Charts"
            color="#3B82F6"
            step={3}
          />
          <FeatureCard
            darkMode={darkMode}
            icon={TrendingUp}
            title="Trading Sandbox"
            description="Put it all together in our risk-free trading environment. Practice with virtual capital, test strategies, and build confidence before risking real money. Unlock by proving your skills in tests."
            benefits={[
              "10,000 SENSES starting capital",
              "Real market conditions simulation",
              "Track wins, losses, and metrics"
            ]}
            link="/sandbox"
            linkText="Start Trading"
            color="#EF4444"
            step={4}
          />
          <FeatureCard
            darkMode={darkMode}
            icon={BarChart2}
            title="Performance Analytics"
            description="See exactly where you stand with comprehensive tracking. Monitor bias scores, chart accuracy, sandbox performance, and get AI insights on what to improve next."
            benefits={[
              "Complete performance dashboard",
              "AI-powered improvement tips",
              "Compare with other traders"
            ]}
            link="/dashboard"
            linkText="View Analytics"
            color="#F59E0B"
            step={5}
          />
        </div>
      </section>

      {/* Social Proof Section */}
      <section style={{ marginBottom: '80px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '40px',
            letterSpacing: '-0.02em',
          }}>
            Join Traders Who Are Actually Succeeding
          </h2>
          
          {/* Success Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            maxWidth: '800px',
            margin: '0 auto 60px',
            padding: '0 16px',
          }}>
            <div style={{
              padding: '24px',
              background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22C55E', marginBottom: '4px' }}>87%</div>
              <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Complete the full pipeline</div>
            </div>
            <div style={{
              padding: '24px',
              background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3B82F6', marginBottom: '4px' }}>3.2x</div>
              <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Faster skill development</div>
            </div>
            <div style={{
              padding: '24px',
              background: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F59E0B', marginBottom: '4px' }}>94%</div>
              <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Feel more confident trading</div>
            </div>
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              maxWidth: '700px',
              margin: '0 auto 40px',
              padding: '32px',
              background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '24px',
              fontSize: '3rem',
              color: '#22C55E',
              opacity: 0.3,
            }}>"</div>
            <p style={{
              fontSize: '1.1rem',
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.8',
              fontStyle: 'italic',
              marginBottom: '16px',
            }}>
              After years of jumping between courses and YouTube videos, ChartSense finally gave me a structured path. 
              The bias tests revealed patterns I never knew I had. Now I'm consistently profitable for the first time.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: darkMode ? '#374151' : '#E5E7EB',
              }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: darkMode ? '#F5F5F5' : '#1E293B' }}>Sarah Chen</div>
                <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Full-time Trader, 2 years</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Leaderboard Section */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(2rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: darkMode ? '#F5F5F5' : '#1E293B',
          marginBottom: '40px',
          letterSpacing: '-0.02em',
        }}>
          Top Performers This Week
        </h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <Leaderboard />
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section style={{ marginBottom: '80px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            padding: '60px 40px',
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))' 
              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.03))',
            borderRadius: '24px',
            border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
            margin: '0 16px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}>
            Ready to Actually Learn Trading?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
          }}>
            Stop wasting time on fragmented courses. Start your complete trading education today.
          </p>
          {!isAuthenticated && (
            <Link
              href="/auth/register"
              style={{
                display: 'inline-block',
                padding: '16px 48px',
                background: '#22C55E',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.2rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.3)';
              }}
            >
              Start Your Free Trial →
            </Link>
          )}
        </motion.div>
      </section>
    </div>
    </TrackedPage>
  );
}
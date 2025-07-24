// pages/index.js
import Link from 'next/link';
import Head from 'next/head';
import React, { useEffect, useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import Leaderboard from '../components/Leaderboard';
import { ShieldCheck, BarChart2, Users, Zap, Brain, LineChart as LucideLineChart, BookOpen, TrendingUp, Play, Clock, Target, TrendingDown, Award, Star, Eye, ChevronRight, Sparkles, Menu, X } from 'lucide-react';
import { BiHomeAlt } from 'react-icons/bi';
import { TbScale, TbChartLine } from 'react-icons/tb';
import { FaTachometerAlt, FaGraduationCap } from 'react-icons/fa';
import { RiExchangeLine } from 'react-icons/ri';
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    logger.log('Home page loaded');
    
    const handleResize = () => {
      setWindowWidth(windowWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
          display: 'grid',
          gridTemplateColumns: windowWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
          gap: windowWidth > 768 ? '48px' : '32px',
          alignItems: 'center',
          padding: 'clamp(40px, 8vw, 80px) 20px clamp(40px, 8vw, 60px)',
          marginBottom: 'clamp(40px, 8vw, 60px)',
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Left Column - Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: windowWidth > 768 ? 'flex-start' : 'center',
          textAlign: windowWidth > 768 ? 'left' : 'center',
          order: 1,
        }}>
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

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: windowWidth > 768 ? 'clamp(2.5rem, 5vw, 3.5rem)' : 'clamp(2rem, 8vw, 2.5rem)',
              fontWeight: 800,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              maxWidth: '600px',
            }}
          >
            Stop Jumping Between Courses.
            <br />
            <span style={{ color: '#22C55E' }}>Master Your Senses.</span>
          </motion.h1>
          
          {/* Description */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: windowWidth > 768 ? 'clamp(1.1rem, 2vw, 1.3rem)' : 'clamp(1rem, 3vw, 1.1rem)',
              color: darkMode ? '#B0B0B0' : '#64748B',
              maxWidth: '500px',
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
              flexDirection: 'row',
              gap: '16px',
              flexWrap: 'wrap',
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
                Register Now
              </Link>
              <Link 
                href="/learn-more" 
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
                Learn About Us
              </Link>
            </>
          )}
          </motion.div>
        </div>

        {/* Right Column - Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: windowWidth > 768 ? 20 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: windowWidth > 768 ? 'grid' : 'flex',
            gridTemplateColumns: '1fr',
            flexDirection: windowWidth > 768 ? undefined : 'row',
            gap: windowWidth > 768 ? '20px' : '16px',
            padding: windowWidth > 768 ? '20px' : '0',
            order: 2,
            justifyContent: windowWidth > 768 ? undefined : 'center',
            flexWrap: windowWidth > 768 ? undefined : 'wrap',
          }}
        >
          <div style={{ 
            padding: windowWidth > 768 ? '32px' : '20px',
            background: darkMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.03)',
            borderRadius: '20px',
            border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'}`,
            transition: 'all 0.3s ease',
            transform: windowWidth > 768 ? 'translateX(20px)' : 'none',
            minWidth: windowWidth > 768 ? 'auto' : '140px',
            flex: windowWidth > 768 ? undefined : '1',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: windowWidth > 768 ? '3rem' : '2rem', fontWeight: 800, color: '#22C55E', marginBottom: '8px' }}>5-Step</div>
            <div style={{ fontSize: windowWidth > 768 ? '1.1rem' : '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Learning Pipeline</div>
          </div>
          <div style={{ 
            padding: windowWidth > 768 ? '32px' : '20px',
            background: darkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
            borderRadius: '20px',
            border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
            transition: 'all 0.3s ease',
            minWidth: windowWidth > 768 ? 'auto' : '140px',
            flex: windowWidth > 768 ? undefined : '1',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: windowWidth > 768 ? '3rem' : '2rem', fontWeight: 800, color: '#3B82F6', marginBottom: '8px' }}>3 Unique</div>
            <div style={{ fontSize: windowWidth > 768 ? '1.1rem' : '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Practice Modes</div>
          </div>
          <div style={{ 
            padding: windowWidth > 768 ? '32px' : '20px',
            background: darkMode ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.03)',
            borderRadius: '20px',
            border: `1px solid ${darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'}`,
            transition: 'all 0.3s ease',
            transform: windowWidth > 768 ? 'translateX(20px)' : 'none',
            minWidth: windowWidth > 768 ? 'auto' : '140px',
            flex: windowWidth > 768 ? undefined : '1',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: windowWidth > 768 ? '3rem' : '2rem', fontWeight: 800, color: '#F59E0B', marginBottom: '8px' }}>AI-Powered</div>
            <div style={{ fontSize: windowWidth > 768 ? '1.1rem' : '0.9rem', color: darkMode ? '#94A3B8' : '#64748B' }}>Bias Analysis</div>
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
            gridTemplateColumns: windowWidth > 768 ? '3fr 1fr 3fr' : '1fr',
            gap: windowWidth > 768 ? '40px' : '20px',
            alignItems: 'center',
            marginBottom: '60px',
            padding: '0 16px',
            maxWidth: '1000px',
            margin: '0 auto 60px',
          }}>
            <motion.div
              whileHover={{ y: -4 }}
              style={{
                padding: '32px',
                background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '16px',
                textAlign: 'left',
                height: '100%',
              }}
            >
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#EF4444',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <TrendingDown size={24} />
                Other Platforms
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                color: darkMode ? '#C0C0C0' : '#6B7280',
                fontSize: '1rem',
                lineHeight: '2.2',
              }}>
                <li>❌ Static video courses</li>
                <li>❌ No practice environment</li>
                <li>❌ No psychological training</li>
                <li>❌ Basic multiple-choice quizzes</li>
                <li>❌ Learn in isolation</li>
              </ul>
            </motion.div>
            
            {/* VS Divider */}
            <div style={{
              display: windowWidth > 768 ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: darkMode ? '#1E1E1E' : '#FFFFFF',
                border: `2px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: darkMode ? '#9CA3AF' : '#6B7280',
                boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
              }}>
                VS
              </div>
            </div>
            
            <motion.div
              whileHover={{ y: -4 }}
              style={{
                padding: '32px',
                background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
                borderRadius: '16px',
                textAlign: 'left',
                height: '100%',
              }}
            >
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#22C55E',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <TrendingUp size={24} />
                ChartSense
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                color: darkMode ? '#C0C0C0' : '#6B7280',
                fontSize: '1rem',
                lineHeight: '2.2',
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
          gridTemplateColumns: windowWidth > 768 ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(auto-fit, minmax(150px, 1fr))',
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
              {index < 4 && windowWidth > 768 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  width: '100%',
                  height: '2px',
                  background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  zIndex: 1,
                }} />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Cards Section - Revolutionary Bento Grid */}
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
        
        {/* Bento Grid Layout */}
        <style jsx>{`
          @media (max-width: 768px) {
            .bento-grid {
              grid-template-columns: 1fr !important;
              grid-template-rows: auto !important;
            }
            .bento-grid > * {
              grid-column: span 1 !important;
              grid-row: span 1 !important;
              min-height: 200px;
            }
          }
          @media (min-width: 769px) and (max-width: 1024px) {
            .bento-grid {
              grid-template-columns: repeat(6, 1fr) !important;
            }
            .study-hub { grid-column: span 6 !important; }
            .bias-test { grid-column: span 3 !important; }
            .stats-box { grid-column: span 3 !important; }
            .chart-exam { grid-column: span 6 !important; }
            .sandbox { grid-column: span 3 !important; }
            .dashboard { grid-column: span 3 !important; }
            .community { grid-column: span 6 !important; }
          }
        `}</style>
        <div 
          className="bento-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'repeat(6, minmax(120px, 1fr))',
            gap: '20px',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 16px',
          }}>
          {/* Study Hub - Large Feature Box */}
          <motion.div
            className="study-hub"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              gridColumn: 'span 5',
              gridRow: 'span 3',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' 
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
              borderRadius: '24px',
              padding: '40px',
              border: `1px solid ${darkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            whileHover={{
              y: -4,
              boxShadow: darkMode 
                ? '0 20px 40px rgba(139, 92, 246, 0.3)' 
                : '0 20px 40px rgba(139, 92, 246, 0.15)',
            }}
            onClick={() => window.location.href = '/study'}
          >
            <div style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8B5CF6',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              Step 1
            </div>
            
            <FaGraduationCap size={48} color="#8B5CF6" style={{ marginBottom: '20px' }} />
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}>
              Study Hub
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              Build your foundation with structured lessons. Interactive modules and real-world case studies ensure you actually understand the concepts.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#8B5CF6',
              fontWeight: 600,
            }}>
              Start Learning <ChevronRight size={20} />
            </div>
          </motion.div>

          {/* AI Bias Test - Medium Box */}
          <motion.div
            className="bias-test"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              gridColumn: 'span 4',
              gridRow: 'span 2',
              background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            whileHover={{
              y: -4,
              boxShadow: darkMode 
                ? '0 20px 40px rgba(34, 197, 94, 0.3)' 
                : '0 20px 40px rgba(34, 197, 94, 0.15)',
              borderColor: 'rgba(34, 197, 94, 0.3)',
            }}
            onClick={() => window.location.href = '/bias-test'}
          >
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22C55E',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              Step 2
            </div>
            
            <TbScale size={40} color="#22C55E" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '12px',
            }}>
              AI Bias Detection
            </h3>
            <p style={{
              fontSize: '0.95rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: 1.5,
            }}>
              Discover hidden psychological patterns killing your profits
            </p>
          </motion.div>

          {/* Quick Stats Box */}
          <motion.div
            className="stats-box"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              gridColumn: 'span 3',
              gridRow: 'span 2',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)' 
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #3B82F6, #22C55E, #F59E0B, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: darkMode ? '#0F0F0F' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#3B82F6',
              }}>
                100%
              </div>
            </motion.div>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '8px',
            }}>
              Complete Pipeline
            </h4>
            <p style={{
              fontSize: '0.9rem',
              color: darkMode ? '#94A3B8' : '#64748B',
            }}>
              From psychology to profits
            </p>
          </motion.div>

          {/* Chart Exam - Wide Box */}
          <motion.div
            className="chart-exam"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              gridColumn: 'span 7',
              gridRow: 'span 2',
              background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
            }}
            whileHover={{
              y: -4,
              boxShadow: darkMode 
                ? '0 20px 40px rgba(59, 130, 246, 0.3)' 
                : '0 20px 40px rgba(59, 130, 246, 0.15)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
            }}
            onClick={() => window.location.href = '/chart-exam'}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
              }}>
                Step 3
              </div>
              
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: darkMode ? '#F5F5F5' : '#1E293B',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <TbChartLine size={36} color="#3B82F6" />
                Chart Mastery
              </h3>
              <p style={{
                fontSize: '1rem',
                color: darkMode ? '#94A3B8' : '#64748B',
                lineHeight: 1.5,
              }}>
                Practice reading charts like a pro. Master swing points, Fibonacci levels, and fair value gaps using real market data.
              </p>
            </div>
            
            {/* Visual Chart Animation */}
            <div style={{
              width: '200px',
              height: '100px',
              position: 'relative',
            }}>
              <svg width="200" height="100" style={{ position: 'absolute', top: 0, left: 0 }}>
                <motion.path
                  d="M0,80 L40,60 L80,70 L120,30 L160,50 L200,20"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </svg>
            </div>
          </motion.div>

          {/* Trading Sandbox - Large Interactive Box */}
          <motion.div
            className="sandbox"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{
              gridColumn: 'span 5',
              gridRow: 'span 3',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' 
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
              borderRadius: '24px',
              padding: '40px',
              border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            whileHover={{
              y: -4,
              boxShadow: darkMode 
                ? '0 20px 40px rgba(239, 68, 68, 0.3)' 
                : '0 20px 40px rgba(239, 68, 68, 0.15)',
            }}
            onClick={() => window.location.href = '/sandbox'}
          >
            <div style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              Step 4
            </div>
            
            <RiExchangeLine size={48} color="#EF4444" style={{ marginBottom: '20px' }} />
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}>
              Trading Sandbox
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              Risk-free trading environment with real market conditions. Test strategies and build confidence before risking real money.
            </p>
            
            <div style={{
              background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: darkMode ? '#94A3B8' : '#64748B',
                marginBottom: '8px',
              }}>
                Starting Capital
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#EF4444',
              }}>
                10,000 SENSES
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#EF4444',
              fontWeight: 600,
            }}>
              Start Trading <ChevronRight size={20} />
            </div>
          </motion.div>

          {/* Performance Dashboard - Animated Stats */}
          <motion.div
            className="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              gridColumn: 'span 4',
              gridRow: 'span 2',
              background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            whileHover={{
              y: -4,
              boxShadow: darkMode 
                ? '0 20px 40px rgba(245, 158, 11, 0.3)' 
                : '0 20px 40px rgba(245, 158, 11, 0.15)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
            onClick={() => window.location.href = '/dashboard'}
          >
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              Step 5
            </div>
            
            <FaTachometerAlt size={40} color="#F59E0B" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '12px',
            }}>
              Performance Analytics
            </h3>
            <p style={{
              fontSize: '0.95rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}>
              Track progress with AI-powered insights
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {[
                { label: 'Win Rate', value: '68%', color: '#22C55E' },
                { label: 'Avg Return', value: '+2.3%', color: '#3B82F6' },
              ].map((stat, index) => (
                <div 
                  key={index}
                  style={{
                    background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '0.8rem',
                    color: darkMode ? '#94A3B8' : '#64748B',
                    marginBottom: '4px',
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: stat.color,
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Community Box */}
          <motion.div
            className="community"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{
              gridColumn: 'span 3',
              gridRow: 'span 1',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)' 
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <div>
              <Users size={32} color="#22C55E" style={{ marginBottom: '12px' }} />
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: darkMode ? '#F5F5F5' : '#1E293B',
                marginBottom: '4px',
              }}>
                Active Community
              </h4>
              <p style={{
                fontSize: '0.9rem',
                color: darkMode ? '#94A3B8' : '#64748B',
              }}>
                Learn with 1000+ traders
              </p>
            </div>
          </motion.div>
        </div>
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
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.3)';
              }}
            >
              Get Started Free
            </Link>
          )}
        </motion.div>
      </section>
    </div>
    </TrackedPage>
  );
}
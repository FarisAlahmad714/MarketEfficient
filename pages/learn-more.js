import React, { useContext, useState } from 'react';
import { Target, Award, Clock, ArrowRight, Sparkles, Zap, Shield, Users } from 'lucide-react';
import { FaGraduationCap } from 'react-icons/fa';
import { TbScale, TbChartLine } from 'react-icons/tb';
import { RiExchangeLine } from 'react-icons/ri';
import Link from 'next/link';
import { ThemeContext } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const LearnMorePage = () => {
  const { darkMode } = useContext(ThemeContext);
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '0 clamp(16px, 4vw, 40px) 60px',
      fontFamily: "'Poppins', sans-serif",
      background: darkMode ? '#0F0F0F' : '#FFFFFF',
      minHeight: '100vh',
    }}>
      {/* Hero Section - Clean Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        padding: 'clamp(80px, 10vw, 120px) 0',
        alignItems: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            gridColumn: 'span 7',
          }}
        >
          <h1 style={{
            fontSize: 'clamp(3rem, 5vw, 4.5rem)',
            fontWeight: 900,
            color: darkMode ? '#FFFFFF' : '#000000',
            lineHeight: 1.1,
            marginBottom: '32px',
          }}>
            Stop losing money to your
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #22C55E 0%, #10B981 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              own psychology
            </span>
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: darkMode ? '#A0A0A0' : '#666666',
            lineHeight: 1.6,
            marginBottom: '40px',
          }}>
            We lost $127,000 before figuring out the real problem wasn't our strategy—it was our brain. 
            So we built something that actually works.
          </p>
          <Link
            href="/auth/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 40px',
              background: '#22C55E',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(34, 197, 94, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Start Free
            <ArrowRight size={20} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            gridColumn: 'span 5',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            height: '400px',
          }}
        >
          <div style={{
            gridColumn: 'span 1',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                background: darkMode ? '#1A1A1A' : '#F8F8F8',
                borderRadius: '16px',
                padding: '24px',
                border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
                flex: 1,
              }}
            >
              <TbScale size={32} color="#22C55E" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: darkMode ? '#FFFFFF' : '#000000', fontSize: '1.1rem', marginBottom: '8px' }}>
                Bias Test
              </h3>
              <p style={{ color: darkMode ? '#A0A0A0' : '#666666', fontSize: '0.9rem' }}>
                Identify and overcome psychological biases
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                background: darkMode ? '#1A1A1A' : '#F8F8F8',
                borderRadius: '16px',
                padding: '24px',
                border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
                flex: 1,
              }}
            >
              <TbChartLine size={32} color="#3B82F6" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: darkMode ? '#FFFFFF' : '#000000', fontSize: '1.1rem' }}>
                Chart Exam
              </h3>
            </motion.div>
          </div>
          <div style={{
            gridColumn: 'span 1',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '40px',
          }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                borderRadius: '16px',
                padding: '32px',
                border: `1px solid rgba(34, 197, 94, 0.2)`,
                flex: 1.5,
              }}
            >
              <RiExchangeLine size={40} color="#22C55E" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: darkMode ? '#FFFFFF' : '#000000', fontSize: '1.3rem', marginBottom: '12px' }}>
                Live Trading Sandbox
              </h3>
              <p style={{ color: darkMode ? '#A0A0A0' : '#666666' }}>
                Trade with virtual money in real market conditions
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                background: darkMode ? '#1A1A1A' : '#F8F8F8',
                borderRadius: '16px',
                padding: '24px',
                border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
                flex: 1,
              }}
            >
              <FaGraduationCap size={32} color="#8B5CF6" style={{ marginBottom: '8px' }} />
              <h3 style={{ color: darkMode ? '#FFFFFF' : '#000000', fontSize: '1.1rem' }}>
                Study Materials
              </h3>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Problem Section - Bento Grid */}
      <section style={{ marginBottom: '120px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: 800,
            color: darkMode ? '#FFFFFF' : '#000000',
            marginBottom: '24px',
          }}>
            The real problem with trading
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: darkMode ? '#A0A0A0' : '#666666',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            It's not about finding the perfect strategy. It's about controlling the person executing it.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(3, 180px)',
          gap: '24px',
        }}>
          {/* Large card - Main problem */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => setHoveredCard('main')}
            onHoverEnd={() => setHoveredCard(null)}
            style={{
              gridColumn: 'span 8',
              gridRow: 'span 2',
              background: darkMode 
                ? 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)' 
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8F8F8 100%)',
              borderRadius: '24px',
              padding: '48px',
              border: hoveredCard === 'main' 
                ? '2px solid #22C55E' 
                : `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: darkMode ? '#FFFFFF' : '#000000',
                marginBottom: '20px',
              }}>
                95% of traders lose money
              </h3>
              <p style={{
                fontSize: '1.1rem',
                color: darkMode ? '#A0A0A0' : '#666666',
                lineHeight: 1.7,
                marginBottom: '32px',
              }}>
                Not because they can't analyze charts. Because they can't control their emotions when real money is on the line.
                Fear, greed, and ego override every rational decision.
              </p>
              <div style={{
                display: 'flex',
                gap: '40px',
              }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#EF4444' }}>73%</div>
                  <div style={{ color: darkMode ? '#A0A0A0' : '#666666' }}>Revenge trade</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F59E0B' }}>81%</div>
                  <div style={{ color: darkMode ? '#A0A0A0' : '#666666' }}>Hold losers too long</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3B82F6' }}>92%</div>
                  <div style={{ color: darkMode ? '#A0A0A0' : '#666666' }}>FOMO into trades</div>
                </div>
              </div>
            </div>
            {hoveredCard === 'main' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.1 }}
                style={{
                  position: 'absolute',
                  right: '-100px',
                  bottom: '-100px',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: '#22C55E',
                }}
              />
            )}
          </motion.div>

          {/* Small cards */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            style={{
              gridColumn: 'span 4',
              background: darkMode ? '#1A1A1A' : '#F8F8F8',
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
              cursor: 'pointer',
            }}
          >
            <TbScale size={40} color="#22C55E" style={{ marginBottom: '16px' }} />
            <h4 style={{
              fontSize: '1.3rem',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#000000',
              marginBottom: '12px',
            }}>
              Cognitive Biases
            </h4>
            <p style={{
              color: darkMode ? '#A0A0A0' : '#666666',
              fontSize: '0.95rem',
            }}>
              Your brain is wired to lose money in markets
            </p>
          </motion.div>

          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            style={{
              gridColumn: 'span 4',
              background: darkMode ? '#1A1A1A' : '#F8F8F8',
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
              cursor: 'pointer',
            }}
          >
            <Shield size={40} color="#3B82F6" style={{ marginBottom: '16px' }} />
            <h4 style={{
              fontSize: '1.3rem',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#000000',
              marginBottom: '12px',
            }}>
              No Practice Arena
            </h4>
            <p style={{
              color: darkMode ? '#A0A0A0' : '#666666',
              fontSize: '0.95rem',
            }}>
              Can't improve without risking real money
            </p>
          </motion.div>

          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            style={{
              gridColumn: 'span 4',
              gridRow: 'span 1',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              cursor: 'pointer',
            }}
          >
            <Zap size={40} color="#EF4444" style={{ marginBottom: '16px' }} />
            <h4 style={{
              fontSize: '1.3rem',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#000000',
              marginBottom: '12px',
            }}>
              Emotional Decisions
            </h4>
            <p style={{
              color: darkMode ? '#A0A0A0' : '#666666',
              fontSize: '0.95rem',
            }}>
              Fear and greed override logic every time
            </p>
          </motion.div>

          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            style={{
              gridColumn: 'span 8',
              background: darkMode ? '#1A1A1A' : '#F8F8F8',
              borderRadius: '20px',
              padding: '32px',
              border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            <Target size={48} color="#F59E0B" />
            <div>
              <h4 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: darkMode ? '#FFFFFF' : '#000000',
                marginBottom: '8px',
              }}>
                No Feedback Loop
              </h4>
              <p style={{
                color: darkMode ? '#A0A0A0' : '#666666',
                fontSize: '0.95rem',
              }}>
                Most traders never know why they're failing. We show you exactly what's holding you back.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section - Feature Grid */}
      <section style={{ marginBottom: '120px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: 800,
            color: darkMode ? '#FFFFFF' : '#000000',
            marginBottom: '24px',
          }}>
            Train like an athlete, trade like a pro
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: darkMode ? '#A0A0A0' : '#666666',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Stop learning theory. Start building muscle memory with real market scenarios.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
        }}>
          {[
            {
              title: 'Study Trading Concepts',
              description: 'Master essential trading concepts with structured lessons and real examples',
              icon: FaGraduationCap,
              color: '#8B5CF6',
              features: ['Interactive lessons', 'Real market examples', 'Progress tracking']
            },
            {
              title: 'Bias Test Assessment',
              description: 'Identify your psychological biases and learn to overcome them with AI insights',
              icon: TbScale,
              color: '#22C55E',
              features: ['AI-powered analysis', 'Personalized feedback', 'Bias recognition']
            },
            {
              title: 'Chart Analysis Exam',
              description: 'Test your chart reading skills on real market data with instant feedback',
              icon: TbChartLine,
              color: '#3B82F6',
              features: ['Pattern recognition', 'Technical analysis', 'Skill assessment']
            },
            {
              title: 'Trading Sandbox',
              description: 'Practice trading with $10,000 virtual money in real market conditions',
              icon: RiExchangeLine,
              color: '#F59E0B',
              features: ['Virtual portfolio', 'Real market data', 'Risk-free practice']
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              style={{
                background: darkMode ? '#1A1A1A' : '#FFFFFF',
                borderRadius: '24px',
                padding: '40px',
                border: `1px solid ${darkMode ? '#2A2A2A' : '#E5E5E5'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: darkMode 
                  ? '0 4px 24px rgba(0, 0, 0, 0.4)' 
                  : '0 4px 24px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: `${feature.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}>
                <feature.icon size={32} color={feature.color} />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: darkMode ? '#FFFFFF' : '#000000',
                marginBottom: '16px',
              }}>
                {feature.title}
              </h3>
              <p style={{
                color: darkMode ? '#A0A0A0' : '#666666',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}>
                {feature.description}
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {feature.features.map((item, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    color: darkMode ? '#A0A0A0' : '#666666',
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: feature.color,
                      flexShrink: 0,
                    }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>


      {/* CTA Section */}
      <section style={{ 
        marginBottom: '120px',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: 800,
            color: darkMode ? '#FFFFFF' : '#000000',
            marginBottom: '24px',
          }}>
            Ready to stop losing?
          </h2>
          <Link
            href="/auth/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 48px',
              background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '1.2rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.3)';
            }}
          >
            Master Your Senses & Register Now
            <ArrowRight size={24} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default LearnMorePage;
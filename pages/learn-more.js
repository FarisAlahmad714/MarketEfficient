import React, { useContext } from 'react';
import { ShieldCheck, BarChart2, Users, Zap, Brain, LineChart as LucideLineChart, BookOpen, TrendingUp, Target, Award, Clock, ArrowRight, CheckCircle, XCircle, AlertCircle, Sparkles, Play, DollarSign, TrendingDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { ThemeContext } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const LearnMorePage = () => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '0 clamp(16px, 4vw, 40px) 60px',
      fontFamily: "'Poppins', sans-serif",
      background: darkMode ? '#121212' : '#F8FAFC',
      minHeight: '100vh',
    }}>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          padding: 'clamp(60px, 10vw, 80px) 20px clamp(40px, 8vw, 60px)',
          marginBottom: '60px',
        }}
      >
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
          }}
        >
          Look, we get it.
          <br />
          <span style={{ color: '#22C55E' }}>Trading is hard as hell.</span>
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
          We blew up our accounts. Multiple times. Then we figured out why—and built something to fix it.
        </motion.p>
      </motion.section>

      {/* Our Mission Section */}
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
            Here's what nobody tells you
          </h2>
          
          <div style={{
            background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '40px',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '1.2rem',
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.8',
              marginBottom: '24px',
            }}>
              You know that sick feeling when you watch a trade go against you? When you <em>know</em> you should cut losses but you don't? 
              When you revenge trade and blow up a week's profits in 10 minutes?
            </p>
            <p style={{
              fontSize: '1.2rem',
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.8',
              marginBottom: '24px',
            }}>
              <strong>That's not a strategy problem. That's your brain screwing you over.</strong>
            </p>
            <p style={{
              fontSize: '1.1rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: '1.8',
            }}>
              We lost $127,000 combined before we figured this out. Yeah, it sucked. But it led us to build ChartSense—because 
              watching another YouTube guru draw triangles on charts wasn't going to fix our real problem.
            </p>
          </div>
        </motion.div>
      </section>

      {/* What Makes Us Different */}
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
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}>
            So we said "screw it" and built our own thing
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            Not another $997 course with recycled content. Something that actually addresses why you keep sabotaging yourself.
          </p>
        </motion.div>

        {/* The Problem With Everything Else */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto 80px',
          padding: '0 20px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '40px',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '24px',
            }}>
              "I spent 3 years looking for something that didn't exist"
            </h3>
            
            <p style={{
              fontSize: '1.15rem',
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              Every trading "education" platform was the same garbage wrapped in different colors:
            </p>

            <ul style={{
              listStyle: 'none',
              padding: '0 0 0 20px',
              margin: '0 0 24px 0',
              fontSize: '1.1rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: '2',
            }}>
              <li>📺 <strong>YouTube University:</strong> "Here's how I turned $100 into $1M" (sure buddy)</li>
              <li>💸 <strong>$2,997 Courses:</strong> Same recycled crap from 2015 with a new landing page</li>
              <li>🤖 <strong>AI "Traders":</strong> "Our bot predicts with 97% accuracy!" (then why aren't they billionaires?)</li>
              <li>📱 <strong>Signal Groups:</strong> "Just copy our trades!" (and lose money together)</li>
            </ul>

            <p style={{
              fontSize: '1.15rem',
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              <strong>But here's what pissed me off the most:</strong> There was NOTHING where you could actually practice. 
              No way to test if you really understood what you learned. No hands-on experience without risking real money.
            </p>

            <p style={{
              fontSize: '1.15rem',
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.8',
              marginBottom: '20px',
            }}>
              It's like learning to drive by watching Fast & Furious movies. Then they hand you the keys to a Lambo and say "good luck!"
            </p>

            <div style={{
              background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
              borderRadius: '12px',
              padding: '24px',
              marginTop: '32px',
            }}>
              <p style={{
                fontSize: '1.2rem',
                color: darkMode ? '#F5F5F5' : '#1E293B',
                lineHeight: '1.8',
                margin: 0,
                fontWeight: 600,
              }}>
                So I built what I wished existed: A place where you can fail safely, practice endlessly, 
                and actually KNOW if you're getting better—not just hope you are. With fresh market data 
                every day and thousands of historical scenarios, you'll never run out of real situations to master.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Unique Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '60px',
        }}>
          <motion.div
            whileHover={{ y: -4 }}
            style={{
              padding: '32px',
              background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
              borderRadius: '16px',
            }}
          >
            <Brain size={32} color="#22C55E" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '12px',
            }}>
              Your brain is lying to you
            </h3>
            <p style={{
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.7',
              marginBottom: '16px',
            }}>
              Our AI catches you red-handed when you're about to do something stupid:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.95rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: '1.8',
            }}>
              <li>😤 "This HAS to bounce here!" (spoiler: it won't)</li>
              <li>🎯 "I called the top perfectly!" (you got lucky, mate)</li>
              <li>💸 "Just one more trade to break even" (how's that working out?)</li>
              <li>😰 "I can't close at a loss" (yes you can, and you should)</li>
            </ul>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            style={{
              padding: '32px',
              background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
              borderRadius: '16px',
            }}
          >
            <LucideLineChart size={32} color="#3B82F6" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '12px',
            }}>
              Actually practice on real charts
            </h3>
            <p style={{
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.7',
              marginBottom: '16px',
            }}>
              No more "I would've caught that move" BS. Prove it on real market data:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.95rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: '1.8',
            }}>
              <li>📍 Mark swing points while the candles are forming</li>
              <li>📐 Draw fibs that actually make sense (harder than it looks)</li>
              <li>🕳️ Spot those juicy gaps before they get filled</li>
              <li>📊 Get brutally honest scores (no participation trophies)</li>
              <li>🔄 <strong>NEW data every single day</strong> - no memorizing old patterns</li>
              <li>📈 Years of historical charts for endless practice scenarios</li>
            </ul>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            style={{
              padding: '32px',
              background: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
              borderRadius: '16px',
            }}
          >
            <TrendingUp size={32} color="#F59E0B" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: darkMode ? '#F5F5F5' : '#1E293B',
              marginBottom: '12px',
            }}>
              Trade without losing your shirt
            </h3>
            <p style={{
              color: darkMode ? '#CBD5E1' : '#475569',
              lineHeight: '1.7',
              marginBottom: '16px',
            }}>
              10,000 fake dollars to blow up as many times as you need:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.95rem',
              color: darkMode ? '#94A3B8' : '#64748B',
              lineHeight: '1.8',
            }}>
              <li>💥 Blow up your account? Who cares, it's not real</li>
              <li>📈 Test that "foolproof" strategy (spoiler: it's not)</li>
              <li>🎮 Feels like real trading, minus the therapy bills</li>
              <li>🔒 Gotta pass the tests first (we're not running a casino)</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* The Journey Section */}
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
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}>
            How long before you stop sucking?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Real talk: about 9 weeks if you actually do the work. Here's the roadmap:
          </p>
        </motion.div>

        {/* Timeline */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
        }}>
          {/* Vertical Line */}
          <div style={{
            position: 'absolute',
            left: '30px',
            top: '40px',
            bottom: '40px',
            width: '2px',
            background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }} />

          {[
            {
              week: 'Week 1-2',
              title: "Finding out you're an idiot",
              description: "Take our bias tests. Fail spectacularly. Realize you've been trading on pure emotion. It's humbling.",
              icon: Brain,
              color: '#8B5CF6'
            },
            {
              week: 'Week 3-4',
              title: 'Learning actual skills',
              description: "No more YouTube University. Real lessons that make sense. You'll finally understand why that triangle thingy matters.",
              icon: BookOpen,
              color: '#22C55E'
            },
            {
              week: 'Week 5-6',
              title: 'Getting your ass kicked',
              description: "Live charts don't care about your feelings. You'll miss swings, butcher fibs, and question your life choices.",
              icon: Target,
              color: '#3B82F6'
            },
            {
              week: 'Week 7-8',
              title: 'Fake money, real lessons',
              description: "Trade with play money. Make all the mistakes. Learn why 'diamond hands' is usually code for 'I'm too stubborn to take a loss.'",
              icon: TrendingUp,
              color: '#F59E0B'
            },
            {
              week: 'Week 9+',
              title: "Holy shit, it's working",
              description: "You're catching moves, managing risk, and your bias scores don't suck. You might actually make it.",
              icon: Award,
              color: '#EF4444'
            }
          ].map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={{
                display: 'flex',
                gap: '24px',
                marginBottom: '40px',
                position: 'relative',
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: phase.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 2,
              }}>
                <phase.icon size={28} color="#FFFFFF" />
              </div>
              <div style={{
                flex: 1,
                padding: '24px',
                background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: phase.color,
                  fontWeight: 600,
                  marginBottom: '8px',
                }}>
                  {phase.week}
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: darkMode ? '#F5F5F5' : '#1E293B',
                  marginBottom: '8px',
                }}>
                  {phase.title}
                </h3>
                <p style={{
                  color: darkMode ? '#94A3B8' : '#64748B',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {phase.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Success Stories */}
      <section style={{ marginBottom: '80px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '40px',
            letterSpacing: '-0.02em',
          }}>
            The numbers don't lie
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Average improvements from traders who actually completed the program:
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {[
            {
              metric: 'Bias Score Improvement',
              before: '32%',
              after: '87%',
              timeframe: 'After 30 days',
              color: '#22C55E'
            },
            {
              metric: 'Chart Accuracy',
              before: '41%',
              after: '78%',
              timeframe: 'After 45 days',
              color: '#3B82F6'
            },
            {
              metric: 'Profitable Trades',
              before: '28%',
              after: '64%',
              timeframe: 'After 60 days',
              color: '#F59E0B'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              style={{
                padding: '32px',
                background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
              }}
            >
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: darkMode ? '#F5F5F5' : '#1E293B',
                marginBottom: '20px',
              }}>
                {stat.metric}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B', marginBottom: '4px' }}>Before</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EF4444' }}>{stat.before}</div>
                </div>
                <ArrowRight size={24} color={darkMode ? '#94A3B8' : '#64748B'} />
                <div>
                  <div style={{ fontSize: '0.9rem', color: darkMode ? '#94A3B8' : '#64748B', marginBottom: '4px' }}>After</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.after}</div>
                </div>
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: stat.color,
                fontWeight: 600,
              }}>
                {stat.timeframe}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
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
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 800,
            color: darkMode ? '#F5F5F5' : '#1E293B',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}>
            Ready to stop being a statistic?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: darkMode ? '#94A3B8' : '#64748B',
            marginBottom: '32px',
            maxWidth: '700px',
            margin: '0 auto 32px',
          }}>
            Look, we can't make you profitable. But we can show you exactly why you're not. 
            The rest is up to you.
          </p>
          <Link
            href="/auth/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              background: '#22C55E',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
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
            Master Your Senses
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default LearnMorePage; 
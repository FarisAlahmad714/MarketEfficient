import React, { useContext, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { ThemeContext } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const LearnMorePage = () => {
  const { darkMode } = useContext(ThemeContext);
  const [expandedSection, setExpandedSection] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const features = [
    {
      title: 'Study Hub',
      tagline: 'Build Your Foundation',
      overview: 'Our Study Hub isn\'t just another collection of trading videos. It\'s a carefully engineered learning system that adapts to your pace and ensures deep understanding. Each module builds on the previous one, creating a solid foundation that prevents the knowledge gaps that cause 90% of traders to fail. We cover everything from basic market mechanics to advanced institutional strategies, with interactive exercises and real-world examples throughout.',
      forBeginners: {
        title: 'Perfect Starting Point',
        points: [
          'Start with Module 1: Market Fundamentals - Learn what actually moves prices beyond simple supply and demand. Understand how central banks, institutional flows, and market sentiment create the opportunities you\'ll trade. We break down complex concepts like liquidity, market makers, and order flow into digestible lessons with visual examples.',
          'Module 2: Risk Management Mastery - Before you learn to make money, learn not to lose it. Master position sizing formulas, understand the mathematics of risk/reward, and learn why even profitable strategies fail without proper risk management. Includes interactive calculators and real account blow-up case studies.',
          'Module 3: Technical Analysis Foundation - Go beyond memorizing patterns. Understand the psychology behind support/resistance, why certain patterns form, and how to read price action in context. Each pattern is taught with 10+ real chart examples showing both successful and failed setups.',
          'Progress Tracking System - Our AI monitors your learning pace, quiz scores, and concept retention. It identifies weak areas and automatically serves review content before letting you advance. No more realizing you missed something crucial three modules later.'
        ]
      },
      forAdvanced: {
        title: 'Refine Your Edge',
        points: [
          'Market Microstructure Deep Dive - Understand how orders actually get filled, why slippage occurs, and how to read Level 2 data like a market maker. Learn about dark pools, order routing, and how HFT algorithms impact your trades. This knowledge helps you get better fills and avoid common execution traps.',
          'Portfolio Theory & Advanced Position Sizing - Move beyond basic 1-2% risk rules. Learn Kelly Criterion, correlation-based position sizing, and how to build a portfolio that maximizes returns while minimizing drawdowns. Includes Excel templates and Python code for automated calculations.',
          'Institutional Order Flow Analysis - Learn to identify when big money is accumulating or distributing. Understand COT reports, option flow, and unusual volume patterns. We teach you to think like the institutions that move markets, not react to them.',
          'Strategy Development & Backtesting - Stop trading hunches. Learn to develop, test, and refine strategies systematically. We provide frameworks for hypothesis testing, walk-forward analysis, and Monte Carlo simulations. Includes access to 10 years of tick data for major markets.'
        ]
      },
      keyBenefit: 'Unlike scattered YouTube videos or expensive courses that dump information on you, our curriculum is scientifically sequenced based on cognitive load theory. Each concept is introduced exactly when your brain is ready to absorb it, with prerequisite knowledge already in place. You literally cannot access Module 5 until you\'ve demonstrated mastery of Modules 1-4 through our assessment system.',
      color: '#8B5CF6'
    },
    {
      title: 'AI Bias Test',
      tagline: 'Know Your Enemy: Yourself',
      overview: 'Trading psychology isn\'t about motivational quotes - it\'s about identifying and eliminating the specific cognitive biases that make you lose money. Our proprietary AI system analyzes your trading patterns across multiple dimensions: timing, position sizing, asset selection, and exit decisions. It then creates a personalized "bias profile" showing exactly which psychological weaknesses are costing you the most. This isn\'t a one-time personality test - it continuously learns from your behavior and adapts its recommendations as you improve.',
      forBeginners: {
        title: 'Prevent Bad Habits Early',
        points: [
          'Initial Assessment - Take our 50-question diagnostic that presents you with real trading scenarios. Unlike generic psych tests, these are actual market situations designed to trigger specific biases. The AI analyzes not just what you choose, but how long you take to decide, which options you hover over, and patterns across questions.',
          'The "Big 5" Trader Killers - We focus on the five biases that cause 80% of losses: Revenge Trading (doubling down after losses), FOMO (entering late after big moves), Confirmation Bias (only seeing evidence that supports your position), Loss Aversion (holding losers too long), and Overconfidence (sizing too big after wins). You\'ll get a score for each with specific examples from your test.',
          'Personalized Training Regimen - Based on your bias profile, the AI creates daily exercises. If you score high on FOMO, you\'ll practice sitting out of fast-moving markets. High on revenge trading? You\'ll work through simulations where you must accept losses gracefully. These aren\'t just mental exercises - they\'re interactive scenarios using real market data.',
          'Weekly Bias Reports - Every Sunday, receive a detailed analysis of how your biases affected your trading that week. The AI identifies moments where bias likely influenced decisions, calculates the cost in dollars, and shows your improvement over time. It\'s like having a trading psychologist watching every trade.'
        ]
      },
      forAdvanced: {
        title: 'Break Through Plateaus',
        points: [
          'Deep Pattern Analysis - The AI digs into your entire trading history, analyzing thousands of data points. It finds subtle patterns like "tends to overtrade on Thursdays" or "becomes risk-averse after two winning days." These micro-biases are invisible to human analysis but can significantly impact performance.',
          'Emotional State Correlation - By analyzing your trading behavior patterns, the AI identifies your emotional states and their profit impact. It learns to recognize when you\'re tilted, overconfident, or fearful based on subtle changes in your trading patterns - often before you realize it yourself.',
          'Pressure Testing - Advanced traders get access to stress scenarios designed to trigger specific biases under pressure. Trade through flash crashes, squeeze scenarios, and high-volatility events while the AI monitors your decision quality. Learn to maintain objectivity when everyone else is panicking.',
          'Bias-Adjusted Strategy Optimization - The AI doesn\'t just identify biases - it helps you build strategies that account for them. If you consistently exit winners too early, it might suggest mechanical trailing stops. If you average down too aggressively, it could recommend position sizing rules that prevent this. Your strategies become psychologically optimized for YOUR specific tendencies.'
        ]
      },
      keyBenefit: 'Traditional trading education pretends everyone has the same psychological weaknesses. Our AI recognizes that your biases are as unique as your fingerprint. By analyzing thousands of micro-decisions, it creates a personalized improvement plan that addresses YOUR specific psychological leaks. One user discovered he lost $12,000 annually just from revenge trading on Fridays after bad weeks - a pattern he never noticed over 3 years of trading.',
      color: '#22C55E'
    },
    {
      title: 'Chart Analysis Exam',
      tagline: 'Practice Like You Trade',
      overview: 'Reading charts isn\'t about memorizing patterns - it\'s about understanding market context and making decisions under uncertainty. Our Chart Analysis Exam presents you with real historical charts (with future price action hidden) and asks you to make the same decisions you\'d face in live trading. You\'ll draw support/resistance levels, identify patterns, set stop losses, and choose entry points. The system then reveals what actually happened and provides detailed feedback on your analysis. With over 10,000 historical scenarios from forex, stocks, and crypto, you\'ll see every market condition imaginable.',
      forBeginners: {
        title: 'Build Pattern Recognition',
        points: [
          'Interactive Support & Resistance Training - Start with clear trending markets where S/R levels are obvious. Draw your lines directly on the chart, then see how price actually reacted. Learn why some levels hold and others break, understanding the difference between minor and major levels. Each exercise includes a detailed explanation of what clues you should have noticed.',
          'Context-Based Pattern Recognition - Learn to spot head and shoulders, triangles, and flags - but more importantly, understand when they matter. Our system presents the same pattern in different contexts (trending vs ranging, high volume vs low volume) so you learn that a triangle at resistance means something very different than a triangle in no-man\'s land.',
          'Candlestick Patterns That Actually Work - Forget memorizing 50 different candlestick patterns. We focus on the 8 that actually have statistical edge, teaching you to read them in context. A hammer at support with high volume is tradeable; a hammer in the middle of a range is noise. Learn the difference through hundreds of real examples.',
          'Progressive Difficulty System - Start with clean, obvious setups and gradually progress to messier, more realistic charts. The AI tracks your accuracy and automatically adjusts difficulty. If you\'re struggling with triangles, you\'ll get more triangle practice. Crushing double tops? Time for more advanced patterns. Your training adapts to your needs.'
        ]
      },
      forAdvanced: {
        title: 'Master Complex Setups',
        points: [
          'Multi-Timeframe Confluence Mastery - Practice aligning daily structure with 4-hour patterns and 1-hour entries. You\'ll analyze the same setup across three timeframes, marking key levels on each, then see how they interact. Learn why a 4-hour breakout failing at daily resistance creates high-probability reversals.',
          'Advanced Pattern Recognition - Move beyond basic patterns to complex structures like three-drive patterns, Wyckoff accumulation/distribution, and harmonic patterns. But here\'s the key: you\'ll see both successful and failed patterns, learning to identify which have edge in current market conditions. A Gartley pattern in a strong trend is different from one in a range.',
          'Volume Profile & Market Structure - Learn to read the story volume tells. Practice identifying high volume nodes (where price wants to go) and low volume nodes (where price moves fast). Combine this with market structure to find optimal entries. You\'ll work through examples showing how volume confirms or invalidates traditional technical analysis.',
          'Pressure Scenarios - Trade the chart as it develops in accelerated real-time. You have 30 seconds to analyze and make decisions as candles form. This simulates the pressure of live trading where you can\'t spend an hour analyzing. Learn to quickly identify key levels and make decisions with incomplete information - just like real trading.'
        ]
      },
      keyBenefit: 'Most traders fail because they learn patterns in textbooks but can\'t apply them in the chaos of live markets. Our exam system bridges this gap by presenting thousands of real scenarios where patterns work, fail, and evolve. You\'re not memorizing - you\'re building intuition through repetition. One user improved their chart reading accuracy from 45% to 78% after just 500 practice scenarios, translating to a 3x improvement in their trading win rate.',
      color: '#3B82F6'
    },
    {
      title: 'Trading Sandbox',
      tagline: 'Risk-Free Reality',
      overview: 'Theory without practice is worthless in trading. Our Trading Sandbox provides a hyper-realistic trading environment using real-time market data, complete with spread variations, slippage, and latency - just like real brokers. Start with 10,000 SENSES (our virtual currency) and experience every aspect of trading: the anxiety of watching positions move against you, the temptation to revenge trade after losses, and the overconfidence after winning streaks. Every psychological challenge of real trading, with none of the financial risk. The sandbox connects to live price feeds from major exchanges, ensuring you\'re trading actual market conditions, not simplified simulations.',
      forBeginners: {
        title: 'Learn by Doing Safely',
        points: [
          'Realistic Trading Environment - Experience true market conditions including gap opens, news spikes, and low-liquidity periods. Your orders face real spreads that widen during volatility. Market orders slip during fast moves. Stop losses gap through levels during news. This isn\'t a game - it\'s training for reality. Learn these harsh lessons with virtual money, not your life savings.',
          'Position Sizing Boot Camp - Start with simple exercises: risk exactly 1% per trade on different position sizes. Sounds easy? Wait until you\'re calculating position size on GBPJPY with a 47-pip stop. Our calculator helps initially, but you\'ll learn to do it intuitively. Practice scaling - enter 1/3 position, add on confirmation, take partial profits. Learn why position sizing is the difference between survival and failure.',
          'Emotional Conditioning - Experience the full emotional cycle safely. Feel the dopamine hit of five wins in a row, then learn to stay disciplined. Experience a six-trade losing streak and learn it\'s statistically normal. Watch a position go 100 pips in profit, then return to breakeven - learn to take partial profits. These emotional experiences are invaluable and usually cost traders thousands to learn.',
          'Graduated Challenge System - Start with trending markets and clear setups. As you prove consistency, face harder challenges: choppy ranges, news events, overnight gaps. Each level introduces new difficulties. Level 10 throws everything at you: correlating pairs, major news, end-of-day position management. By the time you\'re consistently profitable at Level 10, you\'re ready for real money.'
        ]
      },
      forAdvanced: {
        title: 'Test New Strategies',
        points: [
          'Strategy Testing Laboratory - Test any strategy in accelerated time. Run a day trading strategy through six months of data in an hour. See how it performs in trends, ranges, and volatility spikes. But here\'s the key: you\'re actually trading it, not just backtesting. You\'ll experience the drawdowns, the consecutive losses, the temptation to break rules. This reveals whether you can actually trade the strategy, not just if it works on paper.',
          'Market Condition Simulator - Practice specific scenarios on demand. Want to test your strategy during the 2020 COVID crash? Trade it. Curious how you\'d handle the 2015 Swiss Franc flash crash? Experience it. We\'ve captured thousands of significant market events. Learn how your strategy and psychology hold up during black swan events when correlations break and volatility explodes.',
          'Advanced Execution Practice - Master complex order types and execution strategies. Practice iceberg orders, bracket orders, and OCO (one-cancels-other) setups. Learn to scale into positions during pullbacks without getting stopped out prematurely. Practice managing multiple correlated positions during news events. These advanced skills separate retail traders from professionals.',
          'Custom Scenario Builder - Create specific situations to practice weaknesses. If you struggle with news trading, create high-impact news scenarios. Bad at managing winners? Set up scenarios where positions go immediately in profit. The AI tracks your performance across different scenario types, showing exactly which market conditions you excel in and which need work. One trader discovered he was profitable in trends but lost everything in ranges - this targeted practice helped him develop range-specific strategies.'
        ]
      },
      keyBenefit: 'Paper trading on most platforms is a joke - perfect fills, no emotions, no consequences. Our sandbox is different. By simulating real trading conditions including slippage, spread widening, and psychological pressure, you experience authentic trading. Users average 1,000+ practice trades before going live, experiencing every market condition imaginable. This translates to years of experience compressed into months. One user said: "I blew up 3 sandbox accounts before finding my strategy. Those failures would have cost me $30,000 in real money."',
      color: '#F59E0B'
    },
    {
      title: 'Performance Analytics',
      tagline: 'Data-Driven Improvement',
      overview: 'You can\'t improve what you don\'t measure. Our Performance Analytics dashboard goes far beyond basic win/loss tracking. Every click, every decision, every hesitation is logged and analyzed. The system tracks 50+ metrics across all platform activities: how long you spend analyzing charts before making decisions, which setups you recognize fastest, where your psychological biases cost you money, and how your performance varies by market condition, time of day, and even your recent trading results. This isn\'t just a report card - it\'s a comprehensive diagnostic tool that shows exactly where to focus your improvement efforts.',
      forBeginners: {
        title: 'Understand Your Progress',
        points: [
          'Core Performance Metrics - Start with the fundamentals clearly visualized. See your win rate, but more importantly, understand why it matters less than your risk/reward ratio. Track average win vs average loss - many profitable traders have 40% win rates but 3:1 reward/risk ratios. Watch your profit factor evolve as you improve. Visual charts show trends over time, helping you see if that losing week was an anomaly or a developing problem.',
          'Learning Progress Tracking - See your advancement through every platform feature. Heatmaps show which study modules you\'ve mastered and which need review. Track your chart analysis accuracy over time - are you getting better at spotting patterns? Monitor bias test improvements - is your revenge trading score decreasing? This comprehensive view ensures balanced development across all trading skills.',
          'Weakness Identification System - The AI automatically identifies your three biggest improvement opportunities each week. Maybe you\'re great at entries but terrible at exits. Perhaps you trade well in trends but lose in ranges. Or you might nail technical analysis but ignore risk management. These insights are backed by data from hundreds of decisions, not hunches.',
          'Achievement & Milestone System - Celebrate progress with meaningful milestones. Not participation trophies, but real accomplishments: "First week with proper position sizing on every trade," "Identified 10 head-and-shoulders patterns correctly," "Survived a 5-trade losing streak without revenge trading." These achievements map to real trading skills and boost motivation during tough periods.'
        ]
      },
      forAdvanced: {
        title: 'Optimize Your Edge',
        points: [
          'Professional-Grade Metrics - Access the same analytics hedge funds use. Calculate Sharpe ratio to understand risk-adjusted returns. Monitor maximum drawdown and recovery time. Track Calmar ratios, win rate by setup type, and average hold time by market condition. Export everything to Excel for custom analysis. These metrics reveal whether you have a true edge or just got lucky.',
          'Multi-Dimensional Performance Attribution - Understand WHY you make or lose money. The system breaks down performance by: strategy type (breakout vs reversal), market condition (trending vs ranging), time of day, day of week, volatility level, and even your recent performance (do you trade worse after big wins?). One trader discovered he lost money every Monday - turns out he was overtrading from weekend analysis paralysis.',
          'Trade Correlation Analysis - Discover hidden patterns in your trading. The AI analyzes correlations between trades, revealing tendencies like: "After losing on EURUSD, 73% likely to revenge trade GBPUSD within 2 hours" or "Win rate drops 30% when taking more than 3 trades per day." These insights are impossible to see manually but obvious once revealed. Use them to create rules that prevent predictable mistakes.',
          'Predictive Performance Modeling - Based on your historical data, the AI predicts future performance under different scenarios. What happens to your returns if you cut position size by 20%? How would eliminating Monday trading affect annual returns? What if you stopped trading during high-impact news? Run "what-if" scenarios to optimize your trading plan before risking real money. The model even accounts for your psychological tendencies, showing how rule changes might affect your discipline.'
        ]
      },
      keyBenefit: 'Most traders keep a basic journal if anything. They have no idea why they succeed or fail beyond vague hunches. Our analytics transform those hunches into actionable data. One user discovered that 67% of his losses came from trades taken in the last hour of the session when he was tired. Another found that her win rate on breakouts was 62% but only 31% on reversals - she doubled her profitability by focusing on her strength. This isn\'t just tracking - it\'s optimization through data.',
      color: '#EF4444'
    }
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px 60px',
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: darkMode ? '#0A0A0A' : '#FFFFFF',
      minHeight: '100vh',
    }}>
      {/* Header Section */}
      <section style={{
        padding: windowWidth > 768 ? '80px 0 60px' : '60px 0 40px',
        borderBottom: `1px solid ${darkMode ? '#1F1F1F' : '#F0F0F0'}`,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={{
            fontSize: windowWidth > 768 ? '3.5rem' : '2.5rem',
            fontWeight: 800,
            color: darkMode ? '#FFFFFF' : '#000000',
            lineHeight: 1.2,
            marginBottom: '24px',
            letterSpacing: '-0.03em',
          }}>
            How ChartSense Works
          </h1>
          <p style={{
            fontSize: windowWidth > 768 ? '1.4rem' : '1.2rem',
            color: darkMode ? '#888888' : '#666666',
            lineHeight: 1.6,
            maxWidth: '800px',
          }}>
            Five interconnected tools that transform how you learn, practice, and master trading. 
            Each feature is designed to solve a specific problem traders face.
          </p>
        </motion.div>
      </section>

      {/* Features Deep Dive */}
      <section style={{ padding: '60px 0' }}>
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            style={{
              marginBottom: '40px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: darkMode ? '#111111' : '#FAFAFA',
              border: `1px solid ${darkMode ? '#1F1F1F' : '#E5E5E5'}`,
            }}
          >
            {/* Feature Header */}
            <div 
              style={{
                padding: windowWidth > 768 ? '40px' : '30px 20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setExpandedSection(expandedSection === index ? null : index)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '8px',
                  }}>
                    <h2 style={{
                      fontSize: windowWidth > 768 ? '2rem' : '1.5rem',
                      fontWeight: 700,
                      color: darkMode ? '#FFFFFF' : '#000000',
                      margin: 0,
                    }}>
                      {feature.title}
                    </h2>
                    <div style={{
                      padding: '4px 12px',
                      background: `${feature.color}20`,
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: feature.color,
                    }}>
                      {feature.tagline}
                    </div>
                  </div>
                  <p style={{
                    fontSize: windowWidth > 768 ? '1.1rem' : '1rem',
                    color: darkMode ? '#999999' : '#666666',
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {feature.overview}
                  </p>
                </div>
                <div style={{
                  marginLeft: '20px',
                  color: darkMode ? '#666666' : '#999999',
                }}>
                  {expandedSection === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedSection === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  borderTop: `1px solid ${darkMode ? '#1F1F1F' : '#E5E5E5'}`,
                }}
              >
                <div style={{
                  display: windowWidth > 768 ? 'grid' : 'flex',
                  gridTemplateColumns: windowWidth > 768 ? '1fr 1fr' : undefined,
                  flexDirection: windowWidth > 768 ? undefined : 'column',
                  gap: windowWidth > 768 ? '40px' : '30px',
                  padding: windowWidth > 768 ? '40px' : '30px 20px',
                }}>
                  {/* For Beginners */}
                  <div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 600,
                      color: darkMode ? '#FFFFFF' : '#000000',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22C55E',
                      }} />
                      {feature.forBeginners.title}
                    </h3>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                    }}>
                      {feature.forBeginners.points.map((point, i) => (
                        <li key={i} style={{
                          marginBottom: '16px',
                          paddingLeft: '24px',
                          position: 'relative',
                          color: darkMode ? '#B0B0B0' : '#555555',
                          lineHeight: 1.6,
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: 0,
                            top: '8px',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: darkMode ? '#444444' : '#CCCCCC',
                          }} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* For Advanced */}
                  <div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 600,
                      color: darkMode ? '#FFFFFF' : '#000000',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                      }} />
                      {feature.forAdvanced.title}
                    </h3>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                    }}>
                      {feature.forAdvanced.points.map((point, i) => (
                        <li key={i} style={{
                          marginBottom: '16px',
                          paddingLeft: '24px',
                          position: 'relative',
                          color: darkMode ? '#B0B0B0' : '#555555',
                          lineHeight: 1.6,
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: 0,
                            top: '8px',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: darkMode ? '#444444' : '#CCCCCC',
                          }} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Benefit */}
                <div style={{
                  padding: windowWidth > 768 ? '30px 40px' : '20px',
                  background: darkMode ? '#0A0A0A' : '#FFFFFF',
                  borderTop: `1px solid ${darkMode ? '#1F1F1F' : '#E5E5E5'}`,
                }}>
                  <p style={{
                    fontSize: '1.05rem',
                    color: feature.color,
                    fontWeight: 500,
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    "{feature.keyBenefit}"
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section style={{
        textAlign: 'center',
        padding: '60px 0',
        borderTop: `1px solid ${darkMode ? '#1F1F1F' : '#F0F0F0'}`,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{
            fontSize: windowWidth > 768 ? '2.5rem' : '2rem',
            fontWeight: 700,
            color: darkMode ? '#FFFFFF' : '#000000',
            marginBottom: '20px',
          }}>
            Ready to Start Your Journey?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: darkMode ? '#999999' : '#666666',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
          }}>
            Join thousands of traders who are finally seeing consistent results.
          </p>
          <Link
            href="/auth/register"
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: '#22C55E',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Start Free Today
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default LearnMorePage;
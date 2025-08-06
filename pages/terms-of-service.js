import React, { useContext } from 'react';
import Head from 'next/head';
import { ThemeContext } from '../contexts/ThemeContext';

const TermsOfService = () => {
  const { darkMode } = useContext(ThemeContext);

  const containerStyle = {
    background: darkMode 
      ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const heroStyle = {
    background: darkMode
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
    padding: '80px 20px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const sectionStyle = {
    marginBottom: '40px',
    padding: '32px',
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(10px)',
    boxShadow: darkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
      : '0 8px 32px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const headingStyle = {
    color: darkMode ? '#ffffff' : '#1e293b',
    marginBottom: '24px',
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  };

  const subHeadingStyle = {
    color: darkMode ? '#e2e8f0' : '#334155',
    marginBottom: '16px',
    fontSize: '20px',
    fontWeight: '600',
    marginTop: '32px',
    letterSpacing: '-0.01em',
  };

  const textStyle = {
    color: darkMode ? '#cbd5e1' : '#475569',
    lineHeight: '1.7',
    marginBottom: '16px',
    fontSize: '16px',
  };

  const listStyle = {
    color: darkMode ? '#cbd5e1' : '#475569',
    lineHeight: '1.7',
    paddingLeft: '0',
    listStyle: 'none',
    fontSize: '16px',
  };

  const listItemStyle = {
    position: 'relative',
    paddingLeft: '28px',
    marginBottom: '12px',
  };

  const bulletStyle = {
    position: 'absolute',
    left: '0',
    top: '0.4em',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: darkMode ? '#60a5fa' : '#3b82f6',
  };

  const warningBoxStyle = {
    background: darkMode 
      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%)',
    border: `2px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    position: 'relative',
  };

  const infoBoxStyle = {
    background: darkMode 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)',
    border: `2px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    position: 'relative',
  };

  return (
    <>
      <Head>
        <title>Terms of Service - ChartSense</title>
        <meta name="description" content="ChartSense Terms of Service - User agreements, responsibilities, and platform usage guidelines." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div style={containerStyle}>
        {/* Hero Section */}
        <div style={heroStyle}>
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          }}></div>

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
            }}>
              Terms of Service
            </h1>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
              padding: '12px 24px',
              borderRadius: '50px',
              backdropFilter: 'blur(10px)',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
              }}></div>
              <span style={{
                color: darkMode ? '#e2e8f0' : '#475569',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                Last updated: January 6, 2025
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 20px 80px',
        }}>

        <div style={sectionStyle} className="section-hover">
          <h2 style={headingStyle}>1. Agreement to Terms</h2>
          <p style={textStyle}>
            Welcome to ChartSense! These Terms of Service ("Terms") govern your use of our trading psychology testing platform and related services operated by <strong>Mithril Labs LLC</strong> ("Company", "we", "us", or "our"). By accessing or using ChartSense, you agree to be bound by these Terms and our Privacy Policy.
          </p>
          <div style={infoBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#3b82f6' : '#2563eb',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              ℹ️ Important
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              If you do not agree to these Terms, please do not use our services. Your continued use of ChartSense constitutes acceptance of any updates to these Terms.
            </p>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>2. Description of Service</h2>
          
          <h3 style={subHeadingStyle}>2.1 Platform Overview</h3>
          <p style={textStyle}>
            ChartSense is an educational platform designed to help traders improve their decision-making through psychology-based testing and analysis. Our services include:
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}><div style={bulletStyle}></div>Trading bias detection tests and assessments</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Chart analysis examinations (Fibonacci, Fair Value Gaps, Swing Analysis)</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Performance tracking and progress analytics</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Educational content and personalized insights</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>AI-powered trading psychology analysis</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Paper trading simulation environment</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Historical market data analysis tools</li>
          </ul>

          <h3 style={subHeadingStyle}>2.2 Simulation Environment Only</h3>
          <div style={warningBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#ef4444' : '#dc2626',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              ⚠️ Critical Notice
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              <strong style={{color: darkMode ? '#fef2f2' : '#7f1d1d'}}>SIMULATION ENVIRONMENT ONLY:</strong> ChartSense operates exclusively as a SIMULATION and EDUCATIONAL environment. All trading activities, portfolio management, and market interactions are conducted using simulated (paper) money and historical market data. No real money, securities, or financial instruments are involved in any transactions on our platform.
            </p>
          </div>

          <h3 style={subHeadingStyle}>2.3 No Financial Advice</h3>
          <div style={warningBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#ef4444' : '#dc2626',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              🚫 No Financial Advice
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              <strong style={{color: darkMode ? '#fef2f2' : '#7f1d1d'}}>NO FINANCIAL ADVICE:</strong> ChartSense does not provide, and nothing on this platform constitutes:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Financial, investment, or trading advice</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Investment recommendations or suggestions</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Buy, sell, or hold recommendations</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Portfolio management services</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Tax, legal, or accounting advice</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Predictions about future market performance</li>
            </ul>
            <p style={{...textStyle, fontWeight: '600', color: darkMode ? '#fef2f2' : '#7f1d1d'}}>
              All content is for educational and testing purposes only. You should consult with qualified financial professionals before making any real investment decisions.
            </p>
          </div>

          <h3 style={subHeadingStyle}>2.4 Historical Data Usage</h3>
          <p style={textStyle}>
            Our platform uses historical market data for educational purposes. This data is provided for analysis and learning only. Past performance does not predict or guarantee future results in real trading scenarios.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. User Accounts and Registration</h2>
          
          <h3 style={subHeadingStyle}>3.1 Account Creation</h3>
          <p style={textStyle}>To use ChartSense, you must:</p>
          <ul style={listStyle}>
            <li style={listItemStyle}><div style={bulletStyle}></div>Be at least 13 years old (users 13-17 require parental consent)</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Provide accurate and complete registration information</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Verify your email address</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Create a secure password</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Maintain the confidentiality of your account credentials</li>
          </ul>

          <h3 style={subHeadingStyle}>3.2 Account Responsibilities</h3>
          <p style={textStyle}>You are responsible for:</p>
          <ul style={listStyle}>
            <li style={listItemStyle}><div style={bulletStyle}></div>All activities that occur under your account</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Maintaining the security of your login credentials</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Immediately notifying us of any unauthorized account access</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Providing accurate and up-to-date profile information</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Subscription Plans and Payments</h2>
          
          <h3 style={subHeadingStyle}>4.1 Subscription Options</h3>
          <p style={textStyle}>ChartSense offers the following subscription plans:</p>
          <ul style={listStyle}>
            <li style={listItemStyle}><div style={bulletStyle}></div><strong>Free Tier:</strong> Limited access to basic features</li>
            <li style={listItemStyle}><div style={bulletStyle}></div><strong>Monthly Subscription ($39/month):</strong> Full platform access</li>
            <li style={listItemStyle}><div style={bulletStyle}></div><strong>Annual Subscription ($360/year):</strong> Full access with savings</li>
          </ul>

          <h3 style={subHeadingStyle}>4.2 Payment Terms</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}><div style={bulletStyle}></div>All payments are processed securely through Stripe</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Subscriptions automatically renew unless cancelled</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>You can cancel your subscription at any time</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Refunds are subject to our refund policy (Section 4.4)</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>We reserve the right to change pricing with 30 days notice</li>
          </ul>

          <h3 style={subHeadingStyle}>4.3 Billing and Renewals</h3>
          <ul style={listStyle}>
            <li>Monthly subscriptions bill every 30 days</li>
            <li>Annual subscriptions bill every 365 days</li>
            <li>Failed payments may result in service suspension</li>
            <li>You will receive billing notifications before each renewal</li>
          </ul>

          <h3 style={subHeadingStyle}>4.4 Refund Policy</h3>
          <div style={infoBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#22c55e' : '#16a34a',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              🔄 Refund Policy
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              We offer a 14-day money-back guarantee for new subscriptions. Refunds are processed back to the original payment method within 5-10 business days.
            </p>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>5. Acceptable Use Policy</h2>
          
          <h3 style={subHeadingStyle}>5.1 Permitted Uses</h3>
          <p style={textStyle}>You may use ChartSense for:</p>
          <ul style={listStyle}>
            <li>Personal education and skill development</li>
            <li>Trading psychology assessment and improvement</li>
            <li>Learning and practicing chart analysis techniques</li>
            <li>Tracking your progress and performance</li>
          </ul>

          <h3 style={subHeadingStyle}>5.2 Prohibited Activities</h3>
          <p style={textStyle}>You agree not to:</p>
          <ul style={listStyle}>
            <li>Share your account credentials with others</li>
            <li>Use automated tools, bots, or scripts to access our services</li>
            <li>Attempt to reverse engineer or extract our algorithms</li>
            <li>Upload malicious content or attempt to hack our systems</li>
            <li>Use our platform for any illegal or unauthorized purposes</li>
            <li>Resell or redistribute our content without permission</li>
            <li>Create multiple accounts to circumvent limitations</li>
            <li>Misrepresent simulation results as real trading performance</li>
            <li>Use our educational content to provide financial advice to others</li>
            <li>Copy, modify, or distribute our proprietary trading simulations</li>
            <li>Attempt to connect real trading accounts or real money to our platform</li>
            <li>Market or advertise real trading services using our simulation results</li>
          </ul>

          <h3 style={subHeadingStyle}>5.3 Simulation Environment Rules</h3>
          <p style={textStyle}>When using our trading simulation features, you must understand and agree that:</p>
          <ul style={listStyle}>
            <li>All transactions are simulated using virtual currency only</li>
            <li>No real financial instruments are bought, sold, or traded</li>
            <li>Simulation results cannot be used as evidence of trading skill for regulatory compliance</li>
            <li>You cannot withdraw, transfer, or convert simulated funds to real money</li>
            <li>Our simulation may not reflect real-world trading costs, slippage, or market conditions</li>
            <li>Results are for educational assessment and cannot guarantee real trading success</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Regulatory Compliance and Licensing</h2>
          
          <h3 style={subHeadingStyle}>6.1 Not a Licensed Financial Service</h3>
          <div style={warningBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#ef4444' : '#dc2626',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              🏛️ Regulatory Notice
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              <strong style={{color: darkMode ? '#fef2f2' : '#7f1d1d'}}>REGULATORY NOTICE:</strong> ChartSense and its operators are NOT:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>A licensed investment advisor or financial advisor</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>A registered broker-dealer or securities firm</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>A commodity trading advisor (CTA) or commodity pool operator (CPO)</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>A licensed financial planning service</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div>Subject to SEC, CFTC, FINRA, or other financial regulatory oversight</li>
            </ul>
            <p style={textStyle}>
              <strong>We operate exclusively as an educational technology platform providing simulation-based learning tools.</strong>
            </p>
          </div>

          <h3 style={subHeadingStyle}>6.2 No Investment Management</h3>
          <p style={textStyle}>
            ChartSense does not:
          </p>
          <ul style={listStyle}>
            <li>Manage, advise on, or have custody of any real investment accounts</li>
            <li>Execute real trades or transactions on behalf of users</li>
            <li>Provide personalized investment recommendations based on individual financial situations</li>
            <li>Offer investment management or asset allocation services</li>
            <li>Hold, transfer, or manage any real money or securities</li>
          </ul>

          <h3 style={subHeadingStyle}>6.3 User Responsibility for Compliance</h3>
          <p style={textStyle}>
            Users are solely responsible for:
          </p>
          <ul style={listStyle}>
            <li>Complying with all applicable laws and regulations in their jurisdiction</li>
            <li>Obtaining proper licenses if they intend to use knowledge gained for professional trading</li>
            <li>Understanding the regulatory requirements for any real trading activities they may pursue</li>
            <li>Consulting with licensed professionals before making financial decisions</li>
            <li>Not representing ChartSense simulation results as professional trading credentials</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Intellectual Property Rights</h2>
          
          <h3 style={subHeadingStyle}>6.1 ChartSense Content</h3>
          <p style={textStyle}>
            All content on ChartSense, including but not limited to text, graphics, logos, algorithms, software, and educational materials, is owned by Mithril Labs LLC and protected by intellectual property laws.
          </p>

          <h3 style={subHeadingStyle}>6.2 User Content</h3>
          <p style={textStyle}>
            By uploading content to ChartSense (such as chart analyses or profile information), you grant us a non-exclusive, worldwide, royalty-free license to use, display, and analyze such content for the purpose of providing our services and conducting research.
          </p>

          <h3 style={subHeadingStyle}>6.3 Research Data</h3>
          <p style={textStyle}>
            Your anonymized test results and performance data may be used for research purposes to improve our platform and advance trading psychology research. Personal identifying information is never included in research data.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Privacy and Data Protection</h2>
          <p style={textStyle}>
            Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand how we handle your data.
          </p>
          <p style={textStyle}>
            Key privacy commitments:
          </p>
          <ul style={listStyle}>
            <li>We never sell your personal data</li>
            <li>All data is encrypted and securely stored</li>
            <li>You can delete your account and data at any time</li>
            <li>We comply with GDPR, CCPA, and other privacy regulations</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>8. Risk Disclosure and Trading Disclaimers</h2>
          
          <h3 style={subHeadingStyle}>8.1 Simulation vs. Real Trading</h3>
          <div style={warningBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#ef4444' : '#dc2626',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              ⚠️ Risk Disclosure
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              <strong style={{color: darkMode ? '#fef2f2' : '#7f1d1d'}}>IMPORTANT RISK DISCLOSURE:</strong> Trading simulations like ChartSense cannot fully replicate the psychological and financial pressures of real trading. Key differences include:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div><strong>No Real Financial Risk:</strong> Simulated losses don't affect your actual financial situation</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div><strong>Perfect Execution:</strong> Our simulation assumes perfect order fills at displayed prices, which may not occur in real markets</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div><strong>No Slippage or Spreads:</strong> Real trading involves costs and execution delays not present in simulations</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div><strong>Emotional Impact:</strong> Real money trading involves significant emotional stress that simulations cannot replicate</li>
              <li style={listItemStyle}><div style={{...bulletStyle, backgroundColor: '#ef4444'}}></div><strong>Market Conditions:</strong> Historical data may not represent future market conditions or liquidity</li>
            </ul>
            <p style={textStyle}>
              <strong>Success in our simulation does not guarantee success in real trading. Real trading involves substantial risk of loss.</strong>
            </p>
          </div>

          <h3 style={subHeadingStyle}>8.2 No Performance Guarantees</h3>
          <div style={infoBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#3b82f6' : '#2563eb',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              📊 Performance
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              <strong>Performance Disclaimer:</strong> Any performance results shown in our platform, whether hypothetical or based on historical data:
            </p>
            <ul style={listStyle}>
              <li>Do not represent actual trading results</li>
              <li>Cannot guarantee future performance</li>
              <li>May not reflect the impact of material economic and market factors</li>
              <li>Are based on assumptions that may not be realized in actual trading</li>
              <li>Do not account for transaction costs, taxes, or other fees</li>
            </ul>
          </div>

          <h3 style={subHeadingStyle}>8.3 Educational Purpose Only</h3>
          <p style={textStyle}>
            ChartSense is designed exclusively for educational purposes. We strongly recommend that before engaging in real trading, you:
          </p>
          <ul style={listStyle}>
            <li>Consult with qualified financial advisors</li>
            <li>Understand the risks involved in trading financial instruments</li>
            <li>Only trade with money you can afford to lose</li>
            <li>Obtain proper training and education from licensed professionals</li>
            <li>Practice with small amounts of real capital before increasing position sizes</li>
          </ul>

          <h3 style={subHeadingStyle}>8.4 Data Accuracy Disclaimer</h3>
          <p style={textStyle}>
            While we strive to provide accurate historical market data, we cannot guarantee the accuracy, completeness, or timeliness of any data presented. Market data may contain errors, delays, or omissions, and should not be relied upon for actual trading decisions.
          </p>

          <h3 style={subHeadingStyle}>8.5 Service Availability</h3>
          <p style={textStyle}>
            While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. We may experience downtime for maintenance, updates, or due to circumstances beyond our control.
          </p>

          <h3 style={subHeadingStyle}>8.6 Limitation of Liability</h3>
          <div style={warningBoxStyle}>
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: '24px',
              background: darkMode ? '#ef4444' : '#dc2626',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              🛡️ Liability Limit
            </div>
            <p style={{...textStyle, marginTop: '16px', fontWeight: '500'}}>
              <strong style={{color: darkMode ? '#fef2f2' : '#7f1d1d'}}>Liability Limitation:</strong> To the maximum extent permitted by law, Mithril Labs LLC and its operators shall not be liable for:
            </p>
            <ul style={listStyle}>
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Any loss of profits, data, or business opportunities</li>
              <li>Any financial losses resulting from real trading decisions influenced by our educational content</li>
              <li>Any claims related to the accuracy or performance of historical data</li>
              <li>Any technical issues, system failures, or service interruptions</li>
            </ul>
            <p style={textStyle}>
              <strong>Your total liability is limited to the amount you have paid for our services in the past 12 months.</strong>
            </p>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>9. Account Termination</h2>
          
          <h3 style={subHeadingStyle}>9.1 Termination by You</h3>
          <ul style={listStyle}>
            <li>You may cancel your subscription at any time</li>
            <li>You may delete your account through your profile settings</li>
            <li>Cancellation takes effect at the end of your current billing period</li>
          </ul>

          <h3 style={subHeadingStyle}>9.2 Termination by Us</h3>
          <p style={textStyle}>We may suspend or terminate your account if you:</p>
          <ul style={listStyle}>
            <li>Violate these Terms of Service</li>
            <li>Engage in fraudulent or illegal activities</li>
            <li>Fail to pay subscription fees</li>
            <li>Abuse our platform or other users</li>
          </ul>

          <h3 style={subHeadingStyle}>9.3 Effect of Termination</h3>
          <p style={textStyle}>
            Upon termination, your access to ChartSense will cease, and your data will be deleted according to our data retention policy, except where required by law.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>10. Dispute Resolution</h2>
          
          <h3 style={subHeadingStyle}>10.1 Governing Law</h3>
          <p style={textStyle}>
            These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.
          </p>

          <h3 style={subHeadingStyle}>10.2 Dispute Resolution Process</h3>
          <p style={textStyle}>Before pursuing legal action, we encourage you to:</p>
          <ul style={listStyle}>
            <li>Contact our support team to resolve issues</li>
            <li>Attempt good faith negotiation</li>
            <li>Consider mediation if direct negotiation fails</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>11. Changes to Terms</h2>
          <p style={textStyle}>
            We may update these Terms from time to time. When we make material changes, we will:
          </p>
          <ul style={listStyle}>
            <li>Post the updated Terms on our website</li>
            <li>Send you an email notification</li>
            <li>Provide at least 30 days notice for significant changes</li>
          </ul>
          <p style={textStyle}>
            Your continued use of ChartSense after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>12. Contact Information</h2>
          <p style={textStyle}>
            If you have questions about these Terms or need support, please contact us:
          </p>
          <ul style={listStyle}>
            <li style={listItemStyle}><div style={bulletStyle}></div>Company: Mithril Labs LLC</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Email: support@chartsense.trade</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Legal inquiries: legal@chartsense.trade</li>
            <li style={listItemStyle}><div style={bulletStyle}></div>Address: Mithril Labs LLC, California, USA</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>13. Severability</h2>
          <p style={textStyle}>
            If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
          </p>
        </div>

        <div style={{
          ...sectionStyle,
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
          textAlign: 'center',
          marginTop: '60px',
          border: darkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            padding: '8px 20px',
            borderRadius: '50px',
          }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <span style={{
              color: darkMode ? '#60a5fa' : '#3b82f6',
              fontWeight: '600',
              fontSize: '16px',
            }}>
              Thank You
            </span>
          </div>
          <p style={{...textStyle, fontSize: '18px', marginBottom: '16px'}}>
            Thank you for using ChartSense. We're committed to providing you with the best trading psychology education platform while protecting your rights and privacy.
          </p>
          <p style={{...textStyle, fontStyle: 'italic', opacity: 0.8}}>
            By using ChartSense, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
        
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .section-hover:hover {
            transform: translateY(-2px);
            box-shadow: ${darkMode 
              ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
              : '0 12px 40px rgba(0, 0, 0, 0.12)'};
          }
        }
        
        .section-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .section-hover:hover {
          transform: translateY(-4px);
          box-shadow: ${darkMode 
            ? '0 16px 48px rgba(0, 0, 0, 0.4)' 
            : '0 16px 48px rgba(0, 0, 0, 0.12)'};
        }
      `}</style>
    </>
  );
};

export default TermsOfService;
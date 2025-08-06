import React, { useContext } from 'react';
import Head from 'next/head';
import { ThemeContext } from '../contexts/ThemeContext';

const PrivacyPolicy = () => {
  const { darkMode } = useContext(ThemeContext);

  const sectionStyle = {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '8px',
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
  };

  const headingStyle = {
    color: darkMode ? '#ffffff' : '#333333',
    marginBottom: '16px',
    fontSize: '24px',
    fontWeight: '600',
  };

  const subHeadingStyle = {
    color: darkMode ? '#e0e0e0' : '#444444',
    marginBottom: '12px',
    fontSize: '18px',
    fontWeight: '500',
    marginTop: '20px',
  };

  const textStyle = {
    color: darkMode ? '#b0b0b0' : '#666666',
    lineHeight: '1.6',
    marginBottom: '12px',
  };

  const listStyle = {
    color: darkMode ? '#b0b0b0' : '#666666',
    lineHeight: '1.6',
    paddingLeft: '20px',
  };

  const linkStyle = {
    color: '#2196F3',
    textDecoration: 'none',
  };

  return (
    <>
      <Head>
        <title>Privacy Policy - ChartSense</title>
        <meta name="description" content="ChartSense Privacy Policy - How we collect, use, and protect your personal information and trading data." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
        minHeight: '100vh',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}>
            Privacy Policy
          </h1>
          <p style={textStyle}>
            Last updated: January 6, 2025
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>1. Introduction</h2>
          <p style={textStyle}>
            Welcome to ChartSense ("we," "our," or "us"), operated by <strong>Mithril Labs LLC</strong>. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading psychology testing platform and related services.
          </p>
          <p style={textStyle}>
            By using ChartSense, you consent to the data practices described in this policy. If you do not agree with the practices described in this Privacy Policy, please do not use our services.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>2. Information We Collect</h2>
          
          <h3 style={subHeadingStyle}>2.1 Personal Information</h3>
          <p style={textStyle}>We collect the following personal information:</p>
          <ul style={listStyle}>
            <li>Name and email address (required for account creation)</li>
            <li>Password (encrypted and stored securely)</li>
            <li>Profile information including bio and profile picture</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Subscription and billing details</li>
          </ul>

          <h3 style={subHeadingStyle}>2.2 Trading Psychology Data</h3>
          <p style={textStyle}>We collect comprehensive trading psychology research data including:</p>
          <ul style={listStyle}>
            <li>Chart analysis responses and trading decisions</li>
            <li>Test results, scores, and performance metrics</li>
            <li>Chart images with your analysis annotations</li>
            <li>Bias detection test responses</li>
            <li>Learning progress and improvement patterns</li>
            <li>Time spent on different test types</li>
          </ul>

          <h3 style={subHeadingStyle}>2.3 Technical Information</h3>
          <p style={textStyle}>We automatically collect:</p>
          <ul style={listStyle}>
            <li>Device information and browser type</li>
            <li>IP address and general location data</li>
            <li>Usage patterns and feature interactions</li>
            <li>Error logs and performance data (via Sentry)</li>
            <li>Session duration and frequency of use</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. How We Use Your Information</h2>
          
          <h3 style={subHeadingStyle}>3.1 Service Provision</h3>
          <ul style={listStyle}>
            <li>Create and manage your account</li>
            <li>Provide personalized trading psychology assessments</li>
            <li>Track your learning progress and performance</li>
            <li>Generate insights and recommendations</li>
            <li>Process payments and manage subscriptions</li>
          </ul>

          <h3 style={subHeadingStyle}>3.2 Research and Analytics</h3>
          <ul style={listStyle}>
            <li>Conduct trading psychology research (anonymized data)</li>
            <li>Improve our algorithms and assessment methods</li>
            <li>Analyze user behavior patterns to enhance our platform</li>
            <li>Generate aggregated insights for educational content</li>
          </ul>

          <h3 style={subHeadingStyle}>3.3 Communication</h3>
          <ul style={listStyle}>
            <li>Send account verification and security notifications</li>
            <li>Provide weekly and monthly performance reports</li>
            <li>Share educational content and platform updates</li>
            <li>Send subscription and billing notifications</li>
            <li>Respond to your inquiries and support requests</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Data Storage and Security</h2>
          
          <h3 style={subHeadingStyle}>4.1 Storage Locations</h3>
          <p style={textStyle}>Your data is stored securely using industry-standard practices:</p>
          <ul style={listStyle}>
            <li>User accounts and test results: MongoDB Atlas (encrypted)</li>
            <li>Chart images and research data: Google Cloud Storage</li>
            <li>Payment information: Stripe (PCI DSS compliant)</li>
            <li>Application data: Firebase (Google Cloud)</li>
          </ul>

          <h3 style={subHeadingStyle}>4.2 Security Measures</h3>
          <ul style={listStyle}>
            <li>End-to-end encryption for all data transmission</li>
            <li>Bcrypt password hashing with salt</li>
            <li>Account lockout protection against brute force attacks</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure API endpoints with rate limiting</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>5. Third-Party Services</h2>
          <p style={textStyle}>We use the following trusted third-party services:</p>
          <ul style={listStyle}>
            <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
            <li><strong>Mailjet:</strong> Email delivery services</li>
            <li><strong>Google Cloud:</strong> Data storage and infrastructure</li>
            <li><strong>Firebase:</strong> Authentication and real-time features</li>
            <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
            <li><strong>OpenAI:</strong> AI-powered analysis features</li>
          </ul>
          <p style={textStyle}>
            Each service operates under their own privacy policies and security standards. We carefully vet all third-party providers to ensure they meet our security requirements.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Data Sharing and Disclosure</h2>
          
          <h3 style={subHeadingStyle}>6.1 We Do Not Sell Your Data</h3>
          <p style={textStyle}>
            We never sell, rent, or trade your personal information to third parties for marketing purposes.
          </p>

          <h3 style={subHeadingStyle}>6.2 Limited Sharing</h3>
          <p style={textStyle}>We may share your information only in these specific circumstances:</p>
          <ul style={listStyle}>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations or court orders</li>
            <li>To protect our rights, property, or safety</li>
            <li>In connection with a business transfer or merger</li>
            <li>Anonymized data for research purposes</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Your Rights and Choices</h2>
          
          <h3 style={subHeadingStyle}>7.1 Access and Control</h3>
          <p style={textStyle}>You have the right to:</p>
          <ul style={listStyle}>
            <li>Access your personal data and download your information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Delete your account and associated data</li>
            <li>Export your test results and performance data</li>
            <li>Opt out of marketing communications</li>
            <li>Restrict certain data processing activities</li>
          </ul>

          <h3 style={subHeadingStyle}>7.2 Communication Preferences</h3>
          <p style={textStyle}>You can manage your email preferences including:</p>
          <ul style={listStyle}>
            <li>Weekly and monthly performance reports</li>
            <li>Educational content and tips</li>
            <li>Platform updates and new features</li>
            <li>Promotional offers and announcements</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>8. International Data Transfers</h2>
          <p style={textStyle}>
            ChartSense is operated by Mithril Labs LLC and based in California, USA. If you are accessing our services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States and other countries where our service providers operate.
          </p>
          <p style={textStyle}>
            We ensure that all international data transfers comply with applicable data protection laws, including GDPR for European users and CCPA for California residents.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>9. Data Retention</h2>
          <p style={textStyle}>We retain your information for as long as necessary to:</p>
          <ul style={listStyle}>
            <li>Provide our services and maintain your account</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
            <li>Conduct legitimate research (anonymized data)</li>
          </ul>
          <p style={textStyle}>
            When you delete your account, we will permanently delete your personal information within 30 days, except where required by law to retain certain records.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>10. Children's Privacy</h2>
          <p style={textStyle}>
            ChartSense is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. Users between 13-17 years of age may use our educational platform with parental consent. If you are a parent or guardian and believe your child under 13 has provided us with personal information, please contact us immediately.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>11. Changes to This Privacy Policy</h2>
          <p style={textStyle}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by:
          </p>
          <ul style={listStyle}>
            <li>Posting the updated policy on our website</li>
            <li>Sending you an email notification</li>
            <li>Displaying a prominent notice in our application</li>
          </ul>
          <p style={textStyle}>
            Your continued use of ChartSense after any changes indicates your acceptance of the updated Privacy Policy.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>12. Contact Information</h2>
          <p style={textStyle}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <ul style={listStyle}>
            <li>Company: Mithril Labs LLC</li>
            <li>Email: support@chartsense.trade</li>
            <li>Privacy Inquiries: privacy@chartsense.trade</li>
            <li>Address: Mithril Labs LLC Privacy Team, California, USA</li>
          </ul>
          <p style={textStyle}>
            For GDPR-related inquiries, please use the subject line "GDPR Request" in your email.
          </p>
        </div>

        <div style={{
          ...sectionStyle,
          borderTop: darkMode ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          marginTop: '40px',
        }}>
          <p style={textStyle}>
            Thank you for trusting ChartSense with your trading education journey. We are committed to protecting your privacy and providing you with the best possible trading psychology insights.
          </p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
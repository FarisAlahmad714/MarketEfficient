import React, { useContext } from 'react';
import Head from 'next/head';
import { ThemeContext } from '../contexts/ThemeContext';

const TermsOfService = () => {
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

  const importantBoxStyle = {
    backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.1)',
    border: '1px solid #FFC107',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
  };

  return (
    <>
      <Head>
        <title>Terms of Service - ChartSense</title>
        <meta name="description" content="ChartSense Terms of Service - User agreements, responsibilities, and platform usage guidelines." />
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
            Terms of Service
          </h1>
          <p style={textStyle}>
            Last updated: January 6, 2025
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>1. Agreement to Terms</h2>
          <p style={textStyle}>
            Welcome to ChartSense! These Terms of Service ("Terms") govern your use of our trading psychology testing platform and related services. By accessing or using ChartSense, you agree to be bound by these Terms and our Privacy Policy.
          </p>
          <div style={importantBoxStyle}>
            <p style={textStyle}>
              <strong>Important:</strong> If you do not agree to these Terms, please do not use our services. Your continued use of ChartSense constitutes acceptance of any updates to these Terms.
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
            <li>Trading bias detection tests and assessments</li>
            <li>Chart analysis examinations (Fibonacci, Fair Value Gaps, Swing Analysis)</li>
            <li>Performance tracking and progress analytics</li>
            <li>Educational content and personalized insights</li>
            <li>AI-powered trading psychology analysis</li>
          </ul>

          <h3 style={subHeadingStyle}>2.2 Educational Purpose</h3>
          <div style={importantBoxStyle}>
            <p style={textStyle}>
              <strong>Disclaimer:</strong> ChartSense is an educational platform only. We do not provide financial advice, investment recommendations, or trading signals. All content is for educational purposes and should not be considered as financial or investment advice.
            </p>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. User Accounts and Registration</h2>
          
          <h3 style={subHeadingStyle}>3.1 Account Creation</h3>
          <p style={textStyle}>To use ChartSense, you must:</p>
          <ul style={listStyle}>
            <li>Be at least 13 years old (users 13-17 require parental consent)</li>
            <li>Provide accurate and complete registration information</li>
            <li>Verify your email address</li>
            <li>Create a secure password</li>
            <li>Maintain the confidentiality of your account credentials</li>
          </ul>

          <h3 style={subHeadingStyle}>3.2 Account Responsibilities</h3>
          <p style={textStyle}>You are responsible for:</p>
          <ul style={listStyle}>
            <li>All activities that occur under your account</li>
            <li>Maintaining the security of your login credentials</li>
            <li>Immediately notifying us of any unauthorized account access</li>
            <li>Providing accurate and up-to-date profile information</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Subscription Plans and Payments</h2>
          
          <h3 style={subHeadingStyle}>4.1 Subscription Options</h3>
          <p style={textStyle}>ChartSense offers the following subscription plans:</p>
          <ul style={listStyle}>
            <li><strong>Free Tier:</strong> Limited access to basic features</li>
            <li><strong>Monthly Subscription ($39/month):</strong> Full platform access</li>
            <li><strong>Annual Subscription ($360/year):</strong> Full access with savings</li>
          </ul>

          <h3 style={subHeadingStyle}>4.2 Payment Terms</h3>
          <ul style={listStyle}>
            <li>All payments are processed securely through Stripe</li>
            <li>Subscriptions automatically renew unless cancelled</li>
            <li>You can cancel your subscription at any time</li>
            <li>Refunds are subject to our refund policy (Section 4.4)</li>
            <li>We reserve the right to change pricing with 30 days notice</li>
          </ul>

          <h3 style={subHeadingStyle}>4.3 Billing and Renewals</h3>
          <ul style={listStyle}>
            <li>Monthly subscriptions bill every 30 days</li>
            <li>Annual subscriptions bill every 365 days</li>
            <li>Failed payments may result in service suspension</li>
            <li>You will receive billing notifications before each renewal</li>
          </ul>

          <h3 style={subHeadingStyle}>4.4 Refund Policy</h3>
          <div style={importantBoxStyle}>
            <p style={textStyle}>
              <strong>Refund Policy:</strong> We offer a 14-day money-back guarantee for new subscriptions. Refunds are processed back to the original payment method within 5-10 business days.
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
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Intellectual Property Rights</h2>
          
          <h3 style={subHeadingStyle}>6.1 ChartSense Content</h3>
          <p style={textStyle}>
            All content on ChartSense, including but not limited to text, graphics, logos, algorithms, software, and educational materials, is owned by ChartSense and protected by intellectual property laws.
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
          <h2 style={headingStyle}>8. Disclaimers and Limitations</h2>
          
          <h3 style={subHeadingStyle}>8.1 Educational Disclaimer</h3>
          <div style={importantBoxStyle}>
            <p style={textStyle}>
              <strong>Important Disclaimer:</strong> ChartSense is for educational purposes only. We do not provide financial advice, investment recommendations, or trading signals. Past performance does not guarantee future results. Trading involves risk of loss.
            </p>
          </div>

          <h3 style={subHeadingStyle}>8.2 Service Availability</h3>
          <p style={textStyle}>
            While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. We may experience downtime for maintenance, updates, or due to circumstances beyond our control.
          </p>

          <h3 style={subHeadingStyle}>8.3 Limitation of Liability</h3>
          <p style={textStyle}>
            To the maximum extent permitted by law, ChartSense shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of our services.
          </p>
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
            <li>Email: support@chartsense.trade</li>
            <li>Legal inquiries: support@chartsense.trade</li>
            <li>Address: ChartSense, California, USA</li>
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
          borderTop: darkMode ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          marginTop: '40px',
        }}>
          <p style={textStyle}>
            Thank you for using ChartSense. We're committed to providing you with the best trading psychology education platform while protecting your rights and privacy.
          </p>
          <p style={{...textStyle, fontStyle: 'italic'}}>
            By using ChartSense, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
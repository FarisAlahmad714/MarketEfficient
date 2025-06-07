import React from 'react';
import { ShieldCheck, BarChart2, Users, Zap, Brain, LineChart as LucideLineChart } from 'lucide-react';
import Link from 'next/link';

const LearnMorePage = () => {
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", color: '#333' }}>
      <header style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', margin: '0' }}>Discover ChartSense</h1>
        <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>The ultimate platform for mastering the art and science of trading.</p>
      </header>
      <main style={{ padding: '4rem 2rem' }}>
        <section style={{ maxWidth: '800px', margin: '0 auto 4rem auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Why ChartSense?</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            In today's volatile markets, success requires more than just intuition. It demands data-driven insights, rigorous practice, and a deep understanding of market psychology. ChartSense provides a comprehensive suite of tools designed to elevate your trading skills, whether you're a novice investor or a seasoned professional.
          </p>
        </section>
        <section style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>Core Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <Feature icon={BarChart2} title="Bias Testing" description="Identify and overcome your cognitive biases with our proprietary bias testing tools. Understand how your subconscious tendencies affect your trading decisions." />
            <Feature icon={LucideLineChart} title="Chart Exams" description="Test your chart-reading skills with real historical data. Get detailed performance breakdowns and identify areas for improvement." />
            <Feature icon={Brain} title="AI-Powered Analytics" description="Leverage our advanced AI to analyze your trading patterns. Receive personalized feedback and actionable insights to refine your strategies." />
            <Feature icon={Users} title="Community & Leaderboards" description="Engage with a community of like-minded traders. Compete on leaderboards, share insights, and learn from the best." />
            <Feature icon={ShieldCheck} title="Risk Management" description="Learn and apply effective risk management techniques. Our platform helps you understand position sizing, stop-loss strategies, and portfolio diversification." />
            <Feature icon={Zap} title="Continuous Learning" description="Stay ahead of the curve with our constantly updated content and features, designed to reflect the ever-changing market landscape." />
          </div>
        </section>
        <section style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem' }}>Ready to Get Started?</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Join thousands of traders who are sharpening their edge with ChartSense.</p>
          <Link href="/auth/register" style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            backgroundColor: '#1e3a8a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: '600',
            transition: 'background-color 0.3s'
          }}>
            Sign Up Now
          </Link>
        </section>
      </main>
    </div>
  );
};

const Feature = ({ icon: Icon, title, description }) => (
  <div style={{
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s'
  }}>
    <div style={{
      backgroundColor: '#dbeafe',
      borderRadius: '50%',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem auto'
    }}>
      <Icon size={40} color="#1e3a8a" />
    </div>
    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h3>
    <p style={{ lineHeight: '1.6' }}>{description}</p>
  </div>
);

export default LearnMorePage; 
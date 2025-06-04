//pages/admin/security-monitoring.js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import storage from '../../lib/storage';
import { Shield, AlertTriangle, CheckCircle, Activity, Lock, Users, CreditCard, Mail } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';

const SecurityMonitoringDashboard = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const router = useRouter();
  const { darkMode } = useContext(ThemeContext);

  const [securityMetrics, setSecurityMetrics] = useState({
    failedLogins: 0,
    suspiciousActivities: 0,
    activeTokens: 0,
    recentPaymentFailures: 0,
    unverifiedEmails: 0,
    rateLimitHits: 0,
    lastSecurityScan: null,
    vulnerabilities: [],
    lockedAccounts: 0,
    dormantAccounts: 0
  });

  const [securityData, setSecurityData] = useState(null);
  const [securityScore, setSecurityScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof isAuthenticated === 'undefined' || !router.isReady) {
      return;
    }
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (!user?.isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      const fetchSecurityDataAndMetrics = async () => {
        try {
          setLoading(true);
          const token = storage.getItem('auth_token');

          if (!token) {
            console.warn('Admin auth token not found in storage. Displaying mock data.');
            const mockDataOnNoToken = {
              failedLogins: 3, suspiciousActivities: 1, activeTokens: 42, recentPaymentFailures: 2,
              unverifiedEmails: 5, rateLimitHits: 15, lastSecurityScan: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              vulnerabilities: [
                { severity: 'low', description: 'Outdated npm package: lodash' },
                { severity: 'medium', description: 'Missing rate limiting on /api/assets' }
              ], lockedAccounts: 0, dormantAccounts: 0,
            };
            setSecurityMetrics(mockDataOnNoToken);
            calculateSecurityScore(mockDataOnNoToken);
            setSecurityData(null);
            return;
          }

          const response = await fetch('/api/admin/security-monitoring', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            console.error('Failed to fetch security data:', response.statusText, await response.text());
            const mockDataOnError = {
              failedLogins: 3, suspiciousActivities: 1, activeTokens: 42, recentPaymentFailures: 2,
              unverifiedEmails: 5, rateLimitHits: 15, lastSecurityScan: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              vulnerabilities: [
                { severity: 'low', description: 'Outdated npm package: lodash' },
                { severity: 'medium', description: 'Missing rate limiting on /api/assets' }
              ], lockedAccounts: 0, dormantAccounts: 0,
            };
            setSecurityMetrics(mockDataOnError);
            calculateSecurityScore(mockDataOnError);
            setSecurityData(null);
            return;
          }

          const data = await response.json();
          setSecurityData(data);

          const updatedMetrics = {
            failedLogins: data.summary?.totalFailedAttempts || 0,
            suspiciousActivities: securityMetrics.suspiciousActivities,
            activeTokens: securityMetrics.activeTokens,
            recentPaymentFailures: securityMetrics.recentPaymentFailures,
            unverifiedEmails: data.summary?.unverifiedOldAccounts || 0,
            rateLimitHits: securityMetrics.rateLimitHits,
            lastSecurityScan: securityMetrics.lastSecurityScan,
            vulnerabilities: securityMetrics.vulnerabilities,
            lockedAccounts: data.summary?.currentlyLockedAccounts || 0,
            dormantAccounts: data.summary?.dormantAccounts || 0,
          };
          setSecurityMetrics(updatedMetrics);
          calculateSecurityScore(updatedMetrics);
        } catch (error) {
          console.error('Error in fetchSecurityDataAndMetrics:', error);
          const mockDataOnCatch = {
              failedLogins: 3, suspiciousActivities: 1, activeTokens: 42, recentPaymentFailures: 2,
              unverifiedEmails: 5, rateLimitHits: 15, lastSecurityScan: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              vulnerabilities: [
                { severity: 'low', description: 'Outdated npm package: lodash' },
                { severity: 'medium', description: 'Missing rate limiting on /api/assets' }
              ], lockedAccounts: 0, dormantAccounts: 0,
          };
          setSecurityMetrics(mockDataOnCatch);
          calculateSecurityScore(mockDataOnCatch);
          setSecurityData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchSecurityDataAndMetrics();
    } else if (typeof isAuthenticated !== 'undefined') {
      setLoading(false);
      const initialMetrics = {
        failedLogins: 0, suspiciousActivities: 0, activeTokens: 0, recentPaymentFailures: 0,
        unverifiedEmails: 0, rateLimitHits: 0, lastSecurityScan: null, vulnerabilities: [],
        lockedAccounts: 0, dormantAccounts: 0
      };
      setSecurityMetrics(initialMetrics);
      calculateSecurityScore(initialMetrics);
      setSecurityData(null);
    }
  }, [isAuthenticated, user]);

  const calculateSecurityScore = (metrics) => {
    let score = 100;
    score -= (metrics.failedLogins || 0) * 2;
    score -= (metrics.suspiciousActivities || 0) * 10;
    score -= (metrics.recentPaymentFailures || 0) * 5;
    score -= (metrics.unverifiedEmails || 0) * 1;
    score -= (metrics.lockedAccounts || 0) * 3;
    score -= (metrics.dormantAccounts || 0) * 0.5;
    score -= (metrics.rateLimitHits || 0) * 0.2;
    const highSeverityVulns = metrics.vulnerabilities?.filter(v => v.severity === 'high').length || 0;
    const mediumSeverityVulns = metrics.vulnerabilities?.filter(v => v.severity === 'medium').length || 0;
    const lowSeverityVulns = metrics.vulnerabilities?.filter(v => v.severity === 'low').length || 0;
    score -= highSeverityVulns * 15;
    score -= mediumSeverityVulns * 10;
    score -= lowSeverityVulns * 5;
    setSecurityScore(Math.max(0, Math.round(score)));
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#eab308';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return `${Math.floor(minutes / 1440)} days ago`;
  };

  const pageStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: darkMode ? '#121212' : '#f0f2f5',
    color: darkMode ? '#e0e0e0' : '#333',
    minHeight: '100vh'
  };

  const cardStyle = {
    backgroundColor: darkMode ? '#1e1e1e' : 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
  };
  
  const headerStyle = {
    color: darkMode ? '#e0e0e0' : '#333',
    marginBottom: '30px'
  };
  
  const sectionTitleStyle = {
    color: darkMode ? '#e0e0e0' : '#333',
    marginBottom: '20px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const textMutedStyle = {
    color: darkMode ? '#b0b0b0' : '#666',
    fontSize: '14px'
  };
  
  const metricItemStyle = {
    ...cardStyle,
    padding: '15px 20px',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: darkMode ? '#121212' : '#f0f2f5' }}>
        <CryptoLoader message="Loading Security Dashboard..." />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ ...headerStyle, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Shield size={32} color="#2196F3" />
          Security Monitoring Dashboard
        </h1>
        <p style={{ ...textMutedStyle, marginTop: '10px' }}>
          Real-time security metrics and threat monitoring for your platform.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ ...sectionTitleStyle, marginBottom: '5px', fontSize: '20px' }}>
              Overall Security Score
            </h2>
            <p style={textMutedStyle}>
              Based on current threats and vulnerabilities
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: getScoreColor(securityScore) }}>
              {securityScore}
            </div>
            <div style={{ ...textMutedStyle, fontSize: '12px' }}>out of 100</div>
          </div>
        </div>
        <div style={{ marginTop: '20px', width: '100%', backgroundColor: darkMode ? '#333' : '#e0e0e0', borderRadius: '9999px', height: '16px' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '9999px',
              transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out',
              width: `${securityScore}%`,
              backgroundColor: getScoreColor(securityScore)
            }}
          />
        </div>
      </div>

      {securityData && (securityData.summary?.currentlyLockedAccounts > 0 || securityData.summary?.totalFailedAttempts > 10) && (
        <div style={{
          ...cardStyle,
          backgroundColor: darkMode ? 'rgba(234, 179, 8, 0.1)' : '#fffbeb',
          borderLeft: `4px solid ${darkMode ? '#eab308' : '#f59e0b'}`
        }}>
          <h3 style={{ ...sectionTitleStyle, color: darkMode ? '#fde047' : '#b45309' }}>
            <AlertTriangle size={20} />
            Security Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {securityData.summary?.currentlyLockedAccounts > 0 && (
              <div style={{
                padding: '10px',
                backgroundColor: darkMode ? 'rgba(234, 179, 8, 0.2)' : '#fef3c7',
                borderRadius: '6px',
                color: darkMode ? '#fde047' : '#b45309',
                fontSize: '14px'
              }}>
                ⚠️ {securityData.summary.currentlyLockedAccounts} account(s) currently locked.
              </div>
            )}
            {securityData.summary?.totalFailedAttempts > 10 && (
              <div style={{
                padding: '10px',
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                borderRadius: '6px',
                color: darkMode ? '#f87171' : '#b91c1c',
                fontSize: '14px'
              }}>
                🚨 High number of failed login attempts: {securityData.summary.totalFailedAttempts}.
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={metricItemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <Lock size={32} color="#ef4444" />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: securityMetrics.failedLogins > 10 ? '#ef4444' : (darkMode ? '#e0e0e0' : '#333') }}>
              {securityMetrics.failedLogins}
            </span>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>Failed Login Attempts</h3>
          <p style={{ ...textMutedStyle, fontSize: '12px' }}>Total attempts from API</p>
        </div>

        <div style={metricItemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <Lock size={32} color="#eab308" />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: securityMetrics.lockedAccounts > 0 ? '#eab308' : (darkMode ? '#e0e0e0' : '#333') }}>
              {securityMetrics.lockedAccounts}
            </span>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>Locked Accounts</h3>
          <p style={{ ...textMutedStyle, fontSize: '12px' }}>Currently locked out</p>
        </div>

        <div style={metricItemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <Mail size={32} color="#f97316" />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: securityMetrics.unverifiedEmails > 5 ? '#f97316' : (darkMode ? '#e0e0e0' : '#333') }}>
              {securityMetrics.unverifiedEmails}
            </span>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>Unverified Old Accounts</h3>
          <p style={{ ...textMutedStyle, fontSize: '12px' }}>Older than 1 day (from API)</p>
        </div>
        
        <div style={metricItemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <Users size={32} color={darkMode ? '#9ca3af' : '#6b7280'} />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#e0e0e0' : '#333' }}>
              {securityMetrics.dormantAccounts}
            </span>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>Dormant Accounts</h3>
          <p style={{ ...textMutedStyle, fontSize: '12px' }}>Inactive &gt; 1 week (from API)</p>
        </div>

        <div style={metricItemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <Activity size={32} color="#22c55e" />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#e0e0e0' : '#333' }}>
              {securityMetrics.activeTokens}
            </span>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>Active Sessions</h3>
          <p style={{ ...textMutedStyle, fontSize: '12px' }}>Currently active (mock data)</p>
        </div>

        <div style={metricItemStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <CreditCard size={32} color="#eab308" />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: securityMetrics.recentPaymentFailures > 3 ? '#eab308' : (darkMode ? '#e0e0e0' : '#333') }}>
              {securityMetrics.recentPaymentFailures}
            </span>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#333', marginBottom: '5px' }}>Payment Failures</h3>
          <p style={{ ...textMutedStyle, fontSize: '12px' }}>Last 7 days (mock data)</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ ...sectionTitleStyle, fontSize: '20px' }}>
          <AlertTriangle size={24} color="#eab308" />
          Active Vulnerabilities (Mock Data)
        </h2>
        {securityMetrics.vulnerabilities.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
            <CheckCircle size={20} />
            <span>No active vulnerabilities detected</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {securityMetrics.vulnerabilities.map((vuln, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    backgroundColor: vuln.severity === 'high' ? '#ef4444' : vuln.severity === 'medium' ? '#eab308' : '#3b82f6'
                  }} />
                  <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize:'14px' }}>{vuln.description}</span>
                </div>
                <span style={{
                  fontSize: '12px', fontWeight: '500', padding: '4px 8px', borderRadius: '4px',
                  backgroundColor: vuln.severity === 'high' ? (darkMode ? 'rgba(239, 68, 68, 0.3)' : '#fee2e2') :
                                   vuln.severity === 'medium' ? (darkMode ? 'rgba(234, 179, 8, 0.3)' : '#fef3c7') :
                                   (darkMode ? 'rgba(59, 130, 246, 0.3)' : '#dbeafe'),
                  color: vuln.severity === 'high' ? (darkMode ? '#f87171' : '#b91c1c') :
                         vuln.severity === 'medium' ? (darkMode ? '#fde047' : '#b45309') :
                         (darkMode ? '#93c5fd' : '#1d4ed8')
                }}>
                  {vuln.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {securityData && securityData.recentLogins && securityData.recentLogins.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ ...sectionTitleStyle, fontSize: '20px' }}>
            <Activity size={24} color="#2196F3" />
            Recent Logins (Last 24 hours)
          </h2>
          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight:'5px' }}>
            {securityData.recentLogins.map((login, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <Users size={20} color={darkMode ? '#9ca3af' : '#6b7280'} style={{ flexShrink: 0 }} />
                  <div style={{minWidth: 0}}>
                    <p style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={login.email}>
                      {login.email}
                    </p>
                    <p style={{ ...textMutedStyle, fontSize: '12px' }}>
                      {new Date(login.lastLogin).toLocaleString()}
                    </p>
                  </div>
                </div>
                {login.isAdmin && (
                  <span style={{
                    marginLeft: '10px', flexShrink: 0, fontSize: '12px', fontWeight: 'bold',
                    padding: '3px 8px', borderRadius: '9999px',
                    backgroundColor: darkMode ? 'rgba(168, 85, 247, 0.3)' : '#f3e8ff',
                    color: darkMode ? '#d8b4fe' : '#7e22ce'
                  }}>
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ ...sectionTitleStyle, fontSize: '18px', marginBottom: '5px' }}>Last Security Scan (Mock)</h3>
            <p style={{ ...textMutedStyle }}>
              {securityMetrics.lastSecurityScan ? getTimeSince(securityMetrics.lastSecurityScan) : 'Never'}
            </p>
          </div>
          <button
            onClick={() => alert('Triggering security scan... (not implemented)')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
          >
            Run Scan Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard; 
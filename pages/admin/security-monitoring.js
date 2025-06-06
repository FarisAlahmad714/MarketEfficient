//pages/admin/security-monitoring.js - Enhanced Real Security Monitoring
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AuthContext } from '../../contexts/AuthContext';
import { Shield, AlertTriangle, CheckCircle, Activity, Lock, Users, CreditCard, Mail, TrendingUp, Eye, RefreshCw, Server, Database, Globe, Cpu } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';

const SecurityMonitoringDashboard = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const router = useRouter();
  const { darkMode } = useContext(ThemeContext);

  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect non-admin users
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

  const fetchSecurityData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/admin/security-monitoring', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch security data: ${response.status}`);
      }
      
      const data = await response.json();
      setSecurityData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Security monitoring error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetchSecurityData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => fetchSecurityData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const SecurityCard = ({ icon: Icon, title, value, status, description, color, trend }) => (
    <div 
      style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div 
          style={{
            background: `${color}22`,
            padding: '12px',
            borderRadius: '12px',
            marginRight: '16px'
          }}
        >
          <Icon size={24} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: darkMode ? '#F5F5F5' : '#1A1A1A'
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: darkMode ? '#B0B0B0' : '#666',
            marginTop: '4px'
          }}>
            {description}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          color: color
        }}>
          {value}
        </div>
        <div 
          style={{
            background: status === 'safe' ? '#10B98122' : 
                       status === 'warning' ? '#F59E0B22' : '#EF444422',
            color: status === 'safe' ? '#10B981' : 
                   status === 'warning' ? '#F59E0B' : '#EF4444',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#eab308';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getThreatColor = (level) => {
    switch(level) {
      case 'LOW': return '#22c55e';
      case 'MEDIUM': return '#eab308';
      case 'HIGH': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading && !securityData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: darkMode ? '#121212' : '#f0f2f5'
      }}>
        <CryptoLoader message="Loading Security Dashboard..." />
      </div>
    );
  }

  if (error && !securityData) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: darkMode ? '#121212' : '#f0f2f5',
        minHeight: '100vh'
      }}>
        <div style={{
          background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          border: '1px solid #EF4444',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <AlertTriangle size={32} color="#EF4444" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#EF4444', margin: '0 0 8px 0' }}>Security Dashboard Error</h3>
          <p style={{ color: darkMode ? '#F5F5F5' : '#1A1A1A', margin: 0 }}>{error}</p>
          <button
            onClick={() => fetchSecurityData()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      backgroundColor: darkMode ? '#121212' : '#f0f2f5',
      color: darkMode ? '#e0e0e0' : '#333',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Shield size={32} color="#3B82F6" style={{ marginRight: '12px' }} />
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: darkMode ? '#F5F5F5' : '#1A1A1A'
              }}>
                Security Monitoring Dashboard
              </h1>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: darkMode ? '#B0B0B0' : '#666',
                marginTop: '4px'
              }}>
                Real-time security metrics and threat detection
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/admin" legacyBehavior>
              <a style={{
                background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                ← Back to Admin
              </a>
            </Link>
            {lastUpdate && (
              <div style={{
                background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                border: '1px solid #22C55E',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#22C55E'
              }}>
                Last Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            
            <button
              onClick={() => fetchSecurityData(true)}
              disabled={isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isRefreshing ? 0.7 : 1
              }}
            >
              <RefreshCw size={16} style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
              }} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Score Overview */}
      <div style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: darkMode ? '#F5F5F5' : '#1A1A1A'
            }}>
              Overall Security Score
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: darkMode ? '#B0B0B0' : '#666',
              marginTop: '4px'
            }}>
              Based on real-time threat assessment
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: 'bold', 
                color: getScoreColor(securityData?.securityScore || 0) 
              }}>
                {securityData?.securityScore || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkMode ? '#B0B0B0' : '#666' }}>
                Security Score
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getThreatColor(securityData?.threatLevel) 
              }}>
                {securityData?.threatLevel || 'UNKNOWN'}
              </div>
              <div style={{ fontSize: '12px', color: darkMode ? '#B0B0B0' : '#666' }}>
                Threat Level
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          width: '100%', 
          backgroundColor: darkMode ? '#333' : '#e0e0e0', 
          borderRadius: '9999px', 
          height: '12px' 
        }}>
          <div
            style={{
              height: '100%',
              borderRadius: '9999px',
              transition: 'width 0.5s ease-in-out',
              width: `${securityData?.securityScore || 0}%`,
              backgroundColor: getScoreColor(securityData?.securityScore || 0)
            }}
          />
        </div>
      </div>

      {/* Security Alerts */}
      {securityData?.alerts && securityData.alerts.length > 0 && (
        <div style={{
          background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          border: '1px solid #EF4444',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={20} />
            Security Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {securityData.alerts.map((alert, index) => (
              <div key={index} style={{
                padding: '12px',
                background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '14px'
              }}>
                🚨 {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <SecurityCard
          icon={AlertTriangle}
          title="Failed Login Attempts"
          value={securityData?.failedLoginAttempts || 0}
          status={
            (securityData?.failedLoginAttempts || 0) > 20 ? 'critical' : 
            (securityData?.failedLoginAttempts || 0) > 10 ? 'warning' : 'safe'
          }
          description="Total failed login attempts"
          color="#EF4444"
        />
        
        <SecurityCard
          icon={Lock}
          title="Locked Accounts"
          value={securityData?.lockedAccounts || 0}
          status={
            (securityData?.lockedAccounts || 0) > 5 ? 'critical' : 
            (securityData?.lockedAccounts || 0) > 0 ? 'warning' : 'safe'
          }
          description="Currently locked user accounts"
          color="#F59E0B"
        />
        
        <SecurityCard
          icon={Users}
          title="Active Users"
          value={(securityData?.totalUsers || 0) - (securityData?.inactiveUsers || 0)}
          status="safe"
          description="Currently active verified users"
          color="#22C55E"
        />
        
        <SecurityCard
          icon={Eye}
          title="Dormant Accounts"
          value={securityData?.dormantAccounts || 0}
          status={(securityData?.dormantAccounts || 0) > 50 ? 'warning' : 'safe'}
          description="Inactive for 30+ days"
          color="#6B7280"
        />
        
        <SecurityCard
          icon={TrendingUp}
          title="Recent Signups"
          value={securityData?.recentSignups || 0}
          status="safe"
          description="New registrations (last 7 days)"
          color="#3B82F6"
        />
        
        <SecurityCard
          icon={CreditCard}
          title="Payment Security"
          value={`${securityData?.successfulPayments || 0}/${securityData?.failedPayments || 0}`}
          status={
            (securityData?.failedPayments || 0) > (securityData?.successfulPayments || 0) ? 'warning' : 'safe'
          }
          description="Success/Failed (last 7 days)"
          color="#8B5CF6"
        />
      </div>

      {/* System Health Monitoring */}
      <div style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: 600,
          color: darkMode ? '#F5F5F5' : '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Server size={24} color="#3B82F6" />
          System Health Monitor
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <SecurityCard
            icon={Database}
            title="Database Status"
            value={securityData?.systemHealth?.database?.status || 'Unknown'}
            status={securityData?.systemHealth?.database?.status === 'Connected' ? 'safe' : 'critical'}
            description={`Response time: ${securityData?.systemHealth?.database?.responseTime || 'N/A'}`}
            color={securityData?.systemHealth?.database?.status === 'Connected' ? '#22C55E' : '#EF4444'}
          />
          
          <SecurityCard
            icon={Globe}
            title="API Health"
            value={`${securityData?.systemHealth?.api?.healthyEndpoints || 0}/${securityData?.systemHealth?.api?.totalEndpoints || 0}`}
            status={
              (securityData?.systemHealth?.api?.healthyEndpoints || 0) === (securityData?.systemHealth?.api?.totalEndpoints || 0) ? 'safe' :
              (securityData?.systemHealth?.api?.healthyEndpoints || 0) > (securityData?.systemHealth?.api?.totalEndpoints || 0) * 0.8 ? 'warning' : 'critical'
            }
            description="Healthy endpoints"
            color="#3B82F6"
          />
          
          <SecurityCard
            icon={Activity}
            title="Uptime"
            value={securityData?.systemHealth?.uptime?.percentage || '0%'}
            status={
              parseFloat(securityData?.systemHealth?.uptime?.percentage || 0) >= 99 ? 'safe' :
              parseFloat(securityData?.systemHealth?.uptime?.percentage || 0) >= 95 ? 'warning' : 'critical'
            }
            description={`Since: ${securityData?.systemHealth?.uptime?.since || 'Unknown'}`}
            color="#22C55E"
          />
          
          <SecurityCard
            icon={Cpu}
            title="Response Time"
            value={`${securityData?.systemHealth?.performance?.avgResponseTime || 0}ms`}
            status={
              (securityData?.systemHealth?.performance?.avgResponseTime || 0) < 200 ? 'safe' :
              (securityData?.systemHealth?.performance?.avgResponseTime || 0) < 500 ? 'warning' : 'critical'
            }
            description="Average API response"
            color="#8B5CF6"
          />
        </div>

        {/* Error Logs */}
        {securityData?.systemHealth?.errors && securityData.systemHealth.errors.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#EF4444'
            }}>
              Recent System Errors
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {securityData.systemHealth.errors.slice(0, 5).map((error, index) => (
                <div key={index} style={{
                  padding: '8px 12px',
                  marginBottom: '8px',
                  background: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderLeft: '3px solid #EF4444',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#EF4444', fontWeight: '500' }}>
                    {error.timestamp} - {error.type}
                  </div>
                  <div style={{ color: darkMode ? '#B0B0B0' : '#666', marginTop: '2px' }}>
                    {error.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Data Indicator */}
      <div style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: darkMode ? '#F5F5F5' : '#1A1A1A'
            }}>
              ✅ Real-time Security Monitoring Active
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: darkMode ? '#B0B0B0' : '#666',
              marginTop: '4px'
            }}>
              All metrics are pulled from live database • Auto-refresh every 30 seconds
            </p>
          </div>
          
          <div style={{
            background: '#22C55E22',
            color: '#22C55E',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            LIVE DATA
          </div>
        </div>
        
        {securityData?.dataSource && (
          <div style={{
            marginTop: '16px',
            fontSize: '12px',
            color: darkMode ? '#B0B0B0' : '#666'
          }}>
            Data Source: {securityData.dataSource} • Last Updated: {securityData.lastUpdated ? new Date(securityData.lastUpdated).toLocaleString() : 'Unknown'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard;
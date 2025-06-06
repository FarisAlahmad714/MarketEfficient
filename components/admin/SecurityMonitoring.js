// components/admin/SecurityMonitoring.js - Real Security Monitoring Dashboard
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock, Activity, Eye, TrendingUp } from 'lucide-react';

const SecurityMonitoring = ({ darkMode }) => {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/admin/security-monitoring', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch security data');
      }
      
      const data = await response.json();
      setSecurityData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const SecurityCard = ({ icon: Icon, title, value, status, description, color }) => (
    <div 
      style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
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
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: darkMode ? '#F5F5F5' : '#1A1A1A'
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: darkMode ? '#B0B0B0' : '#666',
            marginTop: '4px'
          }}>
            {description}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontSize: '32px',
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
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: darkMode ? '#F5F5F5' : '#1A1A1A'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${darkMode ? '#333' : '#ddd'}`,
            borderTop: '3px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading Security Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
          onClick={fetchSecurityData}
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
    );
  }

  return (
    <div style={{ padding: '24px' }}>
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
                Security Monitoring
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
          <div style={{
            background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
            border: '1px solid #22C55E',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            color: '#22C55E'
          }}>
            Last Updated: {lastUpdate?.toLocaleTimeString()}
          </div>
        </div>
      </div>

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
          status={securityData?.failedLoginAttempts > 10 ? 'critical' : 
                  securityData?.failedLoginAttempts > 5 ? 'warning' : 'safe'}
          description="Total failed login attempts across all users"
          color="#EF4444"
        />
        
        <SecurityCard
          icon={Lock}
          title="Locked Accounts"
          value={securityData?.lockedAccounts || 0}
          status={securityData?.lockedAccounts > 5 ? 'critical' : 
                  securityData?.lockedAccounts > 0 ? 'warning' : 'safe'}
          description="Currently locked user accounts"
          color="#F59E0B"
        />
        
        <SecurityCard
          icon={Activity}
          title="Active Users"
          value={securityData?.totalUsers - (securityData?.inactiveUsers || 0)}
          status="safe"
          description="Currently active verified users"
          color="#22C55E"
        />
        
        <SecurityCard
          icon={Eye}
          title="Inactive Users"
          value={securityData?.inactiveUsers || 0}
          status={securityData?.inactiveUsers > 50 ? 'warning' : 'safe'}
          description="Users inactive for 30+ days"
          color="#6B7280"
        />
        
        <SecurityCard
          icon={TrendingUp}
          title="Recent Signups"
          value={securityData?.recentSignups || 0}
          status="safe"
          description="New registrations in last 30 days"
          color="#3B82F6"
        />
        
        <SecurityCard
          icon={Shield}
          title="Active Subscriptions"
          value={securityData?.activeSubscriptions || 0}
          status="safe"
          description="Currently active paid subscriptions"
          color="#8B5CF6"
        />
      </div>

      {/* Security Status Summary */}
      <div style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '20px',
          fontWeight: 600,
          color: darkMode ? '#F5F5F5' : '#1A1A1A'
        }}>
          Security Status Summary
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h4 style={{ color: '#22C55E', margin: '0 0 8px 0' }}>✅ Security Strengths</h4>
            <ul style={{ color: darkMode ? '#B0B0B0' : '#666', lineHeight: '1.6' }}>
              <li>CSRF protection active on payment endpoints</li>
              <li>Rate limiting implemented</li>
              <li>JWT token validation in place</li>
              <li>Encrypted client-side storage</li>
              <li>Account lockout protection active</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#F59E0B', margin: '0 0 8px 0' }}>⚠️ Monitoring Alerts</h4>
            <ul style={{ color: darkMode ? '#B0B0B0' : '#666', lineHeight: '1.6' }}>
              {securityData?.failedLoginAttempts > 10 && <li>High number of failed login attempts</li>}
              {securityData?.lockedAccounts > 0 && <li>{securityData.lockedAccounts} accounts currently locked</li>}
              {securityData?.inactiveUsers > 50 && <li>High number of inactive users</li>}
              {(!securityData?.failedLoginAttempts || securityData.failedLoginAttempts <= 10) && 
               (!securityData?.lockedAccounts || securityData.lockedAccounts === 0) && 
               (!securityData?.inactiveUsers || securityData.inactiveUsers <= 50) && 
               <li>No current security alerts</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoring;
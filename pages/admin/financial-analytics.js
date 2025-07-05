//pages/admin/financial-analytics.js - Comprehensive Financial Dashboard
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard, 
  BarChart2, PieChart, Target, Gift, AlertCircle, RefreshCw 
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';

const FinancialAnalyticsDashboard = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const router = useRouter();
  const { darkMode } = useContext(ThemeContext);

  const [financialData, setFinancialData] = useState(null);
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

  const fetchFinancialData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/admin/financial-analytics', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch financial data: ${response.status}`);
      }
      
      const data = await response.json();
      setFinancialData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetchFinancialData();
    }
  }, [isAuthenticated, user]);

  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color, bgColor }) => (
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
            background: bgColor || `${color}22`,
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
            fontSize: '14px',
            fontWeight: 500,
            color: darkMode ? '#B0B0B0' : '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </h3>
        </div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          color: darkMode ? '#F5F5F5' : '#1A1A1A'
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '14px',
            color: darkMode ? '#B0B0B0' : '#666',
            marginTop: '4px'
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          color: trend.value >= 0 ? '#22C55E' : '#EF4444'
        }}>
          {trend.value >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span style={{ marginLeft: '4px' }}>
            {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && !financialData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: darkMode ? '#121212' : '#f0f2f5'
      }}>
        <CryptoLoader message="Loading Financial Analytics..." />
      </div>
    );
  }

  if (error && !financialData) {
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
          <AlertCircle size={32} color="#EF4444" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#EF4444', margin: '0 0 8px 0' }}>Financial Analytics Error</h3>
          <p style={{ color: darkMode ? '#F5F5F5' : '#1A1A1A', margin: 0 }}>{error}</p>
          <button
            onClick={() => fetchFinancialData()}
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
      maxWidth: '1400px',
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
            <DollarSign size={32} color="#22C55E" style={{ marginRight: '12px' }} />
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: darkMode ? '#F5F5F5' : '#1A1A1A'
              }}>
                Financial Analytics Dashboard
              </h1>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: darkMode ? '#B0B0B0' : '#666',
                marginTop: '4px'
              }}>
                Comprehensive money flow and business metrics
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
              onClick={() => fetchFinancialData(true)}
              disabled={isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#22C55E',
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
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <MetricCard
          icon={DollarSign}
          title="Current Month Revenue"
          value={formatCurrency(financialData?.revenue?.currentMonth || 0)}
          subtitle={`${financialData?.revenue?.totalTransactions || 0} total transactions`}
          trend={{
            value: financialData?.revenue?.monthOverMonthGrowth || 0,
            label: 'vs last month'
          }}
          color="#22C55E"
        />
        
        <MetricCard
          icon={TrendingUp}
          title="Total Revenue"
          value={formatCurrency(financialData?.revenue?.totalRevenue || 0)}
          subtitle="All-time revenue"
          color="#3B82F6"
        />
        
        <MetricCard
          icon={BarChart2}
          title="Average Order Value"
          value={formatCurrency(financialData?.revenue?.avgOrderValue || 0)}
          subtitle="Per transaction"
          color="#8B5CF6"
        />
        
        <MetricCard
          icon={Users}
          title="Customer Conversion"
          value={`${financialData?.customers?.conversionRate || 0}%`}
          subtitle={`${financialData?.customers?.paying || 0} of ${financialData?.customers?.total || 0} users`}
          color="#F59E0B"
        />
      </div>

      {/* Revenue Trend Chart */}
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
          color: darkMode ? '#F5F5F5' : '#1A1A1A'
        }}>
          Revenue Trend (Last 7 Days)
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '16px'
        }}>
          {financialData?.revenue?.last7DaysTrend?.map((day, index) => (
            <div key={index} style={{
              textAlign: 'center',
              padding: '16px',
              background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '12px'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#22C55E',
                marginBottom: '4px'
              }}>
                {formatCurrency(day.revenue)}
              </div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#B0B0B0' : '#666',
                marginBottom: '4px'
              }}>
                {day.transactions} transactions
              </div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#888' : '#999'
              }}>
                {new Date(day.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )) || []}
        </div>
      </div>

      {/* Subscription & Promo Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Subscription Breakdown */}
        <div style={{
          background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: darkMode ? '#F5F5F5' : '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CreditCard size={20} color="#3B82F6" />
            Active Subscriptions
          </h3>
          
          {financialData?.subscriptions?.breakdown?.map((sub, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: index < financialData.subscriptions.breakdown.length - 1 
                ? `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` 
                : 'none'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: darkMode ? '#F5F5F5' : '#1A1A1A',
                  textTransform: 'capitalize'
                }}>
                  {sub.plan} Plan
                </div>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#B0B0B0' : '#666'
                }}>
                  {sub.count} subscribers
                </div>
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#22C55E'
              }}>
                {formatCurrency(sub.revenue)}
              </div>
            </div>
          )) || []}
        </div>

        {/* Promo Code Performance */}
        <div style={{
          background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: darkMode ? '#F5F5F5' : '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Gift size={20} color="#F59E0B" />
            Top Promo Codes
          </h3>
          
          {financialData?.promos?.topPerforming?.slice(0, 5).map((promo, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: index < 4 
                ? `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` 
                : 'none'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: darkMode ? '#F5F5F5' : '#1A1A1A'
                }}>
                  {promo.code}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#B0B0B0' : '#666'
                }}>
                  {promo.used} uses • {promo.utilizationRate}% utilized
                </div>
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#EF4444'
              }}>
                -{formatCurrency(promo.estimatedDiscount)}
              </div>
            </div>
          )) || []}
        </div>
      </div>

      {/* Customer Insights */}
      <div style={{
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
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
          <Target size={24} color="#8B5CF6" />
          Customer Insights
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#22C55E',
              marginBottom: '8px'
            }}>
              {formatCurrency(financialData?.customers?.avgLifetimeValue || 0)}
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#B0B0B0' : '#666'
            }}>
              Average Lifetime Value
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#3B82F6',
              marginBottom: '8px'
            }}>
              {financialData?.customers?.avgTransactionsPerUser || 0}
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#B0B0B0' : '#666'
            }}>
              Avg Transactions per User
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#F59E0B',
              marginBottom: '8px'
            }}>
              {financialData?.customers?.conversionRate || 0}%
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#B0B0B0' : '#666'
            }}>
              Conversion Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalyticsDashboard;
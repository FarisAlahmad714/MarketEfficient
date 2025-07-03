// pages/admin/sandbox-performance.js
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';
import TrackedPage from '../../components/TrackedPage';
import storage from '../../lib/storage';

const SandboxPerformancePage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();

  const [performanceData, setPerformanceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('realTradingReturn');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterUnlocked, setFilterUnlocked] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (isAuthenticated && !user?.isAdmin) {
      router.push('/');
      return;
    }

    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = storage.getItem('auth_token');
        const response = await fetch('/api/admin/sandbox-performance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch performance data');
        const data = await response.json();
        setPerformanceData(data.performanceData);
        setSummary(data.summary);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [isAuthenticated, user, router]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percent) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getReturnColor = (returnPercent) => {
    if (returnPercent > 0) return '#4CAF50';
    if (returnPercent < 0) return '#F44336';
    return darkMode ? '#888' : '#666';
  };

  const sortData = (data, field, order) => {
    return [...data].sort((a, b) => {
      let aVal, bVal;
      
      if (field.includes('.')) {
        const keys = field.split('.');
        aVal = keys.reduce((obj, key) => obj?.[key], a);
        bVal = keys.reduce((obj, key) => obj?.[key], b);
      } else {
        aVal = a[field];
        bVal = b[field];
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredData = performanceData.filter(user => {
    if (filterUnlocked === 'unlocked') return user.portfolio.unlocked;
    if (filterUnlocked === 'locked') return !user.portfolio.unlocked;
    return true;
  });

  const sortedData = sortData(filteredData, sortBy, sortOrder);

  if (loading) {
    return (
      <TrackedPage>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <CryptoLoader message="Loading sandbox performance data..." />
        </div>
      </TrackedPage>
    );
  }

  if (error) {
    return (
      <TrackedPage>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
            color: '#f44336',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        </div>
      </TrackedPage>
    );
  }

  return (
    <TrackedPage>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>
              📊 Sandbox Performance Dashboard
            </h1>
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0 }}>
              Monitor user trading performance and sandbox metrics
            </p>
          </div>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px',
              backgroundColor: darkMode ? '#333' : '#f5f5f5',
              color: darkMode ? '#e0e0e0' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              ← Back to Admin Panel
            </button>
          </Link>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3', marginBottom: '10px' }}>
                {summary.totalUsers}
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>Total Users</div>
            </div>

            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '10px' }}>
                {summary.unlockedUsers}
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>Unlocked Users</div>
            </div>

            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', marginBottom: '10px' }}>
                {summary.activeTraders}
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>Active Traders</div>
            </div>

            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '10px' }}>
                {formatCurrency(summary.totalBalance)}
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>Total Balance</div>
            </div>

            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: getReturnColor(summary.averageReturn), 
                marginBottom: '10px' 
              }}>
                {formatPercentage(summary.averageReturn)}
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>Avg Return</div>
            </div>

            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#607D8B', marginBottom: '10px' }}>
                {formatCurrency(summary.totalQuarterlyDeposits)}
              </div>
              <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>Quarterly Deposits</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ color: darkMode ? '#e0e0e0' : '#333', marginRight: '10px' }}>
                Filter by Status:
              </label>
              <select
                value={filterUnlocked}
                onChange={(e) => setFilterUnlocked(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: darkMode ? '#333' : 'white',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                  borderRadius: '4px'
                }}
              >
                <option value="all">All Users</option>
                <option value="unlocked">Unlocked Only</option>
                <option value="locked">Locked Only</option>
              </select>
            </div>
            
            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
              Showing {sortedData.length} of {performanceData.length} users
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '1000px'
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${darkMode ? '#444' : '#eee'}` }}>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'left', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('userInfo.name')}
                >
                  User {sortBy === 'userInfo.name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'center', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('portfolio.unlocked')}
                >
                  Status {sortBy === 'portfolio.unlocked' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'right', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('portfolio.balance')}
                >
                  Balance {sortBy === 'portfolio.balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'right', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('portfolio.realTradingReturn')}
                >
                  Real Return {sortBy === 'portfolio.realTradingReturn' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'center', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('trading.totalTrades')}
                >
                  Trades {sortBy === 'trading.totalTrades' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'center', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('trading.winRate')}
                >
                  Win Rate {sortBy === 'trading.winRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    padding: '15px 10px', 
                    textAlign: 'right', 
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('portfolio.topUpCount')}
                >
                  Top-ups {sortBy === 'portfolio.topUpCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '15px 10px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((user, index) => (
                <tr 
                  key={user.userId} 
                  style={{ 
                    borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                  }}
                >
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>
                      {user.userInfo.name}
                    </div>
                    <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '12px' }}>
                      {user.userInfo.email}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: user.portfolio.unlocked ? '#4CAF50' : '#F44336',
                      color: 'white'
                    }}>
                      {user.portfolio.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    textAlign: 'right',
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontWeight: '500'
                  }}>
                    {formatCurrency(user.portfolio.balance)}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    textAlign: 'right',
                    color: getReturnColor(user.portfolio.realTradingReturn || 0),
                    fontWeight: '600'
                  }}>
                    {formatPercentage(user.portfolio.realTradingReturn || 0)}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    textAlign: 'center',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}>
                    {user.trading.totalTrades}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    textAlign: 'center',
                    color: getReturnColor(user.trading.winRate - 50),
                    fontWeight: '500'
                  }}>
                    {user.trading.winRate ? `${user.trading.winRate.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    textAlign: 'right',
                    color: darkMode ? '#b0b0b0' : '#666'
                  }}>
                    {user.portfolio.topUpCount || 0}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    textAlign: 'center',
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontSize: '12px'
                  }}>
                    {user.trading.lastTradeAt 
                      ? new Date(user.trading.lastTradeAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedData.length === 0 && (
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
            <h3 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>
              No Users Found
            </h3>
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0 }}>
              No users match the current filter criteria.
            </p>
          </div>
        )}
      </div>
    </TrackedPage>
  );
};

export default SandboxPerformancePage;
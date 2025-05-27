import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';

const EnhancedPromoCodeManagement = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  const [promoCodes, setPromoCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    code: '',
    type: 'custom',
    discountType: 'fixed_amount',
    discountValue: '',
    finalPrice: '',
    description: '',
    maxUses: 1,
    validUntil: '',
    applicablePlans: ['both']
  });
  
  const [generateData, setGenerateData] = useState({
    suffix: '',
    quantity: 1,
    maxUses: 1,
    validUntil: '',
    description: ''
  });
  
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [copiedStates, setCopiedStates] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const cryptoLoaderRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (isAuthenticated && !user?.isAdmin) {
      router.push('/');
      return;
    }
    
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchData(true); // Silent refresh
    }, 30000);
    
    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, user, router]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      
      // Fetch promo codes (increase limit to get all codes)
      const promoResponse = await fetch('/api/admin/promo-codes?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const promoData = await promoResponse.json();
      
      // Fetch users with promo codes
      const usersResponse = await fetch('/api/admin/users?includePromoUsage=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      
      setPromoCodes(promoData.promoCodes || []);
      setUsers(usersData.users || []);
      setLastRefresh(new Date());
      
      if (!silent) {
        setTimeout(() => {
          if (cryptoLoaderRef.current) {
            cryptoLoaderRef.current.hideLoader();
          }
          setTimeout(() => setLoading(false), 500);
        }, 1000);
      } else {
        setIsRefreshing(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const handleGenerateCodes = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/promo-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          baseCodeId: selectedPromoCode._id,
          ...generateData
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setGeneratedCodes(data.generatedCodes);
        fetchData(); // Refresh data
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyCode = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStates(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Filter functions
  const filteredPromoCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(search.toLowerCase()) ||
                         code.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && code.isActive) ||
                         (statusFilter === 'inactive' && !code.isActive);
    const matchesType = typeFilter === 'all' || code.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStats = () => {
    const total = promoCodes.length;
    const active = promoCodes.filter(code => code.isActive).length;
    const used = promoCodes.reduce((sum, code) => sum + code.currentUses, 0);
    const generated = promoCodes.filter(code => code.type === 'generated').length;
    
    return { total, active, used, generated };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: darkMode ? '#121212' : '#f5f5f5'
      }}>
        <CryptoLoader ref={cryptoLoaderRef} />
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0f0f0f' : '#f8fafc',
        padding: '20px'
      }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        marginBottom: '30px'
      }}>
        <Link 
          href="/admin"
          style={{
            color: darkMode ? '#b0b0b0' : '#666',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '15px',
            display: 'inline-block'
          }}
        >
          ← Back to Admin Panel
        </Link>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              color: darkMode ? '#e0e0e0' : '#1a202c',
              margin: 0,
              fontSize: '32px',
              fontWeight: '700'
            }}>
              🎫 Promo Code Management
            </h1>
            <p style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '16px',
              margin: '5px 0 0 0'
            }}>
              Manage promotional codes, track usage, and monitor user registrations
            </p>
          </div>
          

        </div>

        {/* Refresh Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginBottom: '20px' 
        }}>
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            style={{
              padding: '12px 20px',
              backgroundColor: isRefreshing ? (darkMode ? '#374151' : '#e5e7eb') : (darkMode ? '#3b82f6' : '#3b82f6'),
              color: isRefreshing ? (darkMode ? '#9ca3af' : '#6b7280') : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ 
              display: 'inline-block',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}>
              {isRefreshing ? '🔄' : '↻'}
            </span>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            {lastRefresh && (
              <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: '8px' }}>
                ({lastRefresh.toLocaleTimeString()})
              </span>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: darkMode ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Total Codes
            </div>
          </div>

          <div style={{
            background: darkMode ? 'linear-gradient(135deg, #166534 0%, #22c55e 100%)' : 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.active}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Active Codes
            </div>
          </div>

          <div style={{
            background: darkMode ? 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)' : 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.used}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Total Uses
            </div>
          </div>

          <div style={{
            background: darkMode ? 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)' : 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.generated}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Generated Codes
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '30px',
          borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
          paddingBottom: '0'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'codes', label: 'Promo Codes', icon: '🎫' },
            { id: 'users', label: 'User Management', icon: '👥' },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id 
                  ? (darkMode ? '#374151' : '#f3f4f6')
                  : 'transparent',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab.id 
                  ? (darkMode ? '#e0e0e0' : '#1f2937')
                  : (darkMode ? '#9ca3af' : '#6b7280'),
                borderBottom: activeTab === tab.id 
                  ? `2px solid ${darkMode ? '#3b82f6' : '#3b82f6'}`
                  : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <OverviewTab 
            promoCodes={promoCodes}
            users={users}
            stats={stats}
            darkMode={darkMode}
          />
        )}
        
        {activeTab === 'codes' && (
          <PromoCodesTab 
            promoCodes={filteredPromoCodes}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            darkMode={darkMode}
            onGenerate={(code) => {
              setSelectedPromoCode(code);
              setShowGenerateModal(true);
            }}
          />
        )}
        
        {activeTab === 'users' && (
          <UsersTab 
            users={users}
            darkMode={darkMode}
            onViewUser={(user) => {
              setSelectedUser(user);
              setShowUserModal(true);
            }}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            promoCodes={promoCodes}
            users={users}
            stats={stats}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && selectedPromoCode && (
        <GenerateModal
          promoCode={selectedPromoCode}
          generateData={generateData}
          setGenerateData={setGenerateData}
          onGenerate={handleGenerateCodes}
          onClose={() => {
            setShowGenerateModal(false);
            setSelectedPromoCode(null);
            setGeneratedCodes([]);
          }}
          generatedCodes={generatedCodes}
          onCopy={handleCopyCode}
          copiedStates={copiedStates}
          darkMode={darkMode}
        />
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          darkMode={darkMode}
        />
      )}
      </div>
    </>
  );
};

// Component for Overview Tab
const OverviewTab = ({ promoCodes, users, stats, darkMode }) => (
  <div style={{ display: 'grid', gap: '24px' }}>
    {/* Recent Activity */}
    <div style={{
      backgroundColor: darkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        color: darkMode ? '#e0e0e0' : '#1f2937',
        marginBottom: '20px',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        Recent Promo Code Activity
      </h3>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {promoCodes
          .filter(code => code.currentUses > 0)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5)
          .map((code) => (
            <div key={code._id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: darkMode ? '#374151' : '#f9fafb',
              borderRadius: '8px'
            }}>
              <div>
                <span style={{
                  color: darkMode ? '#e0e0e0' : '#1f2937',
                  fontWeight: '500',
                  fontFamily: 'monospace'
                }}>
                  {code.code}
                </span>
                <span style={{
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '14px',
                  marginLeft: '12px'
                }}>
                  used {code.currentUses} time{code.currentUses !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '12px'
              }}>
                {new Date(code.updatedAt).toLocaleDateString()} {new Date(code.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
      </div>
    </div>


  </div>
);

// Component for Promo Codes Tab
const PromoCodesTab = ({ promoCodes, search, setSearch, statusFilter, setStatusFilter, typeFilter, setTypeFilter, darkMode, onGenerate }) => {
  // Get preset codes for filter buttons
  const presetCodes = promoCodes.filter(code => code.type === 'preset');
  
  return (
    <div>
      {/* Preset Code Filter Buttons */}
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{
          color: darkMode ? '#e0e0e0' : '#1f2937',
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          🎯 Preset Codes (Click to Generate)
        </h4>
        
        <div style={{ 
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {presetCodes.map((code) => (
            <button
              key={code._id}
              onClick={() => onGenerate(code)}
              style={{
                background: code.discountType === 'free_access' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {code.code}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>
                {code.discountType === 'free_access' ? 'FREE' : 
                 code.finalPrice ? `$${(code.finalPrice / 100).toFixed(2)}` :
                 code.discountType === 'percentage' ? `${code.discountValue}% off` :
                 `$${(code.discountValue / 100).toFixed(2)} off`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search generated codes..."
            style={{
              padding: '12px 16px',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              backgroundColor: darkMode ? '#374151' : 'white',
              color: darkMode ? '#e0e0e0' : '#1f2937',
              fontSize: '14px'
            }}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              backgroundColor: darkMode ? '#374151' : 'white',
              color: darkMode ? '#e0e0e0' : '#1f2937',
              fontSize: '14px'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              backgroundColor: darkMode ? '#374151' : 'white',
              color: darkMode ? '#e0e0e0' : '#1f2937',
              fontSize: '14px'
            }}
          >
            <option value="all">All Types</option>
            <option value="generated">Generated</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

    {/* Generated Codes Grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px'
    }}>
      {promoCodes.filter(code => code.type !== 'preset').map((code) => (
        <PromoCodeCard 
          key={code._id}
          code={code}
          darkMode={darkMode}
          onGenerate={() => onGenerate(code)}
        />
      ))}
    </div>
  </div>
  );
};

// Component for individual promo code cards
const PromoCodeCard = ({ code, darkMode, onGenerate }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'preset': return '#3b82f6';
      case 'generated': return '#10b981';
      case 'custom': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getDiscountDisplay = () => {
    if (code.discountType === 'free_access') return 'FREE';
    if (code.finalPrice) return `$${(code.finalPrice / 100).toFixed(2)} final`;
    if (code.discountType === 'percentage') return `${code.discountValue}% off`;
    return `$${(code.discountValue / 100).toFixed(2)} off`;
  };

  return (
    <div style={{
      backgroundColor: darkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = darkMode 
        ? '0 8px 30px rgba(0,0,0,0.4)' 
        : '0 8px 30px rgba(0,0,0,0.15)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = darkMode 
        ? '0 4px 20px rgba(0,0,0,0.3)' 
        : '0 4px 20px rgba(0,0,0,0.1)';
    }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: darkMode ? '#e0e0e0' : '#1f2937',
            marginBottom: '4px',
            fontFamily: 'monospace'
          }}>
            {code.code}
          </div>
          <div style={{
            display: 'inline-block',
            backgroundColor: getTypeColor(code.type),
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {code.type}
          </div>
        </div>
        
        <div style={{
          backgroundColor: code.isActive 
            ? (darkMode ? '#065f46' : '#d1fae5')
            : (darkMode ? '#7f1d1d' : '#fee2e2'),
          color: code.isActive 
            ? (darkMode ? '#10b981' : '#065f46')
            : (darkMode ? '#ef4444' : '#dc2626'),
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {code.isActive ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      {/* Description */}
      <p style={{
        color: darkMode ? '#9ca3af' : '#6b7280',
        fontSize: '14px',
        lineHeight: '1.5',
        marginBottom: '16px',
        minHeight: '42px'
      }}>
        {code.description}
      </p>

      {/* Discount Info */}
      <div style={{
        backgroundColor: darkMode ? '#374151' : '#f9fafb',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: code.discountType === 'free_access' 
            ? '#10b981' 
            : (darkMode ? '#e0e0e0' : '#1f2937'),
          marginBottom: '4px'
        }}>
          {getDiscountDisplay()}
        </div>
        <div style={{
          fontSize: '12px',
          color: darkMode ? '#9ca3af' : '#6b7280'
        }}>
          {code.discountType === 'free_access' ? 'Complete Access' : 'Discount'}
        </div>
      </div>

      {/* Usage Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: darkMode ? '#e0e0e0' : '#1f2937'
          }}>
            {code.currentUses}/{code.maxUses}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#9ca3af' : '#6b7280'
          }}>
            Uses
          </div>
        </div>
        
        {code.validUntil && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#e0e0e0' : '#1f2937',
              fontWeight: '500'
            }}>
              Expires: {new Date(code.validUntil).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          style={{
            flex: 1,
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>
        
        {code.type === 'preset' && (
          <button
            onClick={() => onGenerate()}
            style={{
              flex: 1,
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Generate
          </button>
        )}
      </div>
    </div>
  );
};

// Component for Users Tab
const UsersTab = ({ users, darkMode, onViewUser }) => (
  <div>
    <div style={{
      backgroundColor: darkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        color: darkMode ? '#e0e0e0' : '#1f2937',
        marginBottom: '20px',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        Users with Promo Codes
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              backgroundColor: darkMode ? '#374151' : '#f9fafb',
              borderBottom: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
            }}>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>Promo Code</th>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>Plan</th>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>Amount Paid</th>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>Joined</th>
              <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#374151', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(user => user.registrationPromoCode).map((user) => (
              <tr key={user._id} style={{
                borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
              }}>
                <td style={{ padding: '12px' }}>
                  <div>
                    <div style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontWeight: '500' }}>
                      {user.name}
                    </div>
                    <div style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>
                      {user.email}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                    color: darkMode ? '#e0e0e0' : '#1f2937',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    {user.registrationPromoCode}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    color: darkMode ? '#e0e0e0' : '#1f2937',
                    fontSize: '14px',
                    textTransform: 'capitalize'
                  }}>
                    {user.subscriptionTier}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    color: darkMode ? '#e0e0e0' : '#1f2937',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {user.subscription && user.subscription.amount 
                      ? `$${(user.subscription.amount / 100).toFixed(2)}`
                      : user.registrationPromoCode && user.registrationPromoCode.includes('FREE') 
                        ? '$0.00 (Free)'
                        : 'N/A'
                    }
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    backgroundColor: user.hasActiveSubscription 
                      ? (darkMode ? '#065f46' : '#d1fae5')
                      : (darkMode ? '#7f1d1d' : '#fee2e2'),
                    color: user.hasActiveSubscription 
                      ? (darkMode ? '#10b981' : '#065f46')
                      : (darkMode ? '#ef4444' : '#dc2626'),
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {user.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => onViewUser(user)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Component for Analytics Tab
const AnalyticsTab = ({ promoCodes, users, stats, darkMode }) => {
  const getUsageByMonth = () => {
    const monthlyData = {};
    promoCodes.forEach(code => {
      if (code.currentUses > 0) {
        const month = new Date(code.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + code.currentUses;
      }
    });
    return Object.entries(monthlyData).slice(-6);
  };

  const getCodeTypeDistribution = () => {
    const distribution = {};
    promoCodes.forEach(code => {
      distribution[code.type] = (distribution[code.type] || 0) + 1;
    });
    return distribution;
  };

  const monthlyUsage = getUsageByMonth();
  const typeDistribution = getCodeTypeDistribution();

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Usage Analytics */}
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#1f2937',
          marginBottom: '20px',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          📊 Usage Analytics
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{
            backgroundColor: darkMode ? '#374151' : '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
              {((stats.used / stats.total) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              Usage Rate
            </div>
          </div>
          
          <div style={{
            backgroundColor: darkMode ? '#374151' : '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
              {users.filter(u => u.registrationPromoCode).length}
            </div>
            <div style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              Users with Promo Codes
            </div>
          </div>
          
          <div style={{
            backgroundColor: darkMode ? '#374151' : '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f97316', marginBottom: '4px' }}>
              {promoCodes.filter(c => c.currentUses >= c.maxUses).length}
            </div>
            <div style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              Exhausted Codes
            </div>
          </div>
        </div>
      </div>

      {/* Code Type Distribution */}
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#1f2937',
          marginBottom: '20px',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          🎯 Code Type Distribution
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {Object.entries(typeDistribution).map(([type, count]) => (
            <div key={type} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: darkMode ? '#374151' : '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: type === 'preset' ? '#3b82f6' : type === 'generated' ? '#10b981' : '#8b5cf6'
                }}></div>
                <span style={{
                  color: darkMode ? '#e0e0e0' : '#1f2937',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {type}
                </span>
              </div>
              <div style={{
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {count} codes ({((count / stats.total) * 100).toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Usage Trend */}
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#1f2937',
          marginBottom: '20px',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          📈 Monthly Usage Trend
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {monthlyUsage.map(([month, usage]) => (
            <div key={month} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: darkMode ? '#374151' : '#f9fafb',
              borderRadius: '8px'
            }}>
              <span style={{
                color: darkMode ? '#e0e0e0' : '#1f2937',
                fontWeight: '500'
              }}>
                {month}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: `${Math.max(20, (usage / Math.max(...monthlyUsage.map(([, u]) => u))) * 100)}px`,
                  height: '8px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '4px'
                }}></div>
                <span style={{
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '30px'
                }}>
                  {usage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component for Generate Modal
const GenerateModal = ({ promoCode, generateData, setGenerateData, onGenerate, onClose, generatedCodes, onCopy, copiedStates, darkMode }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  }}>
    <div style={{
      backgroundColor: darkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ 
        color: darkMode ? '#e0e0e0' : '#1f2937',
        marginBottom: '24px',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        Generate {promoCode.code} Codes
      </h3>

      {generatedCodes.length === 0 ? (
        <form onSubmit={onGenerate}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#e0e0e0' : '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Code Suffix
              </label>
              <input
                type="text"
                value={generateData.suffix}
                onChange={(e) => setGenerateData({...generateData, suffix: e.target.value.toUpperCase()})}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#e0e0e0' : '#1f2937',
                  fontSize: '14px'
                }}
                placeholder="e.g., 2024, SPECIAL"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  color: darkMode ? '#e0e0e0' : '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={generateData.quantity}
                  onChange={(e) => setGenerateData({...generateData, quantity: e.target.value})}
                  min="1"
                  max="50"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? '#e0e0e0' : '#1f2937',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  color: darkMode ? '#e0e0e0' : '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Max Uses Per Code
                </label>
                <input
                  type="number"
                  value={generateData.maxUses}
                  onChange={(e) => setGenerateData({...generateData, maxUses: e.target.value})}
                  min="1"
                  max="1000"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? '#e0e0e0' : '#1f2937',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#e0e0e0' : '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={generateData.validUntil}
                onChange={(e) => setGenerateData({...generateData, validUntil: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#e0e0e0' : '#1f2937',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: darkMode ? '#e0e0e0' : '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Description
              </label>
              <textarea
                value={generateData.description}
                onChange={(e) => setGenerateData({...generateData, description: e.target.value})}
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#e0e0e0' : '#1f2937',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Description for the generated codes"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                color: darkMode ? '#e0e0e0' : '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Generate {generateData.quantity} Code{generateData.quantity > 1 ? 's' : ''}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <h4 style={{ 
            color: darkMode ? '#e0e0e0' : '#1f2937',
            marginBottom: '20px',
            fontSize: '18px'
          }}>
            ✅ Generated {generatedCodes.length} Code{generatedCodes.length > 1 ? 's' : ''}
          </h4>
          
          <div style={{
            backgroundColor: darkMode ? '#374151' : '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {generatedCodes.map((code, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: index < generatedCodes.length - 1 ? `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}` : 'none'
              }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: darkMode ? '#10b981' : '#059669'
                }}>
                  {code.code}
                </span>
                <button
                  onClick={() => onCopy(code.code, index)}
                  style={{
                    backgroundColor: copiedStates[index] ? '#10b981' : 'transparent',
                    border: `1px solid ${copiedStates[index] ? '#10b981' : (darkMode ? '#6b7280' : '#d1d5db')}`,
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: copiedStates[index] ? 'white' : (darkMode ? '#e0e0e0' : '#374151'),
                    transition: 'all 0.2s ease',
                    minWidth: '60px'
                  }}
                >
                  {copiedStates[index] ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setGeneratedCodes([])}
              style={{
                backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                color: darkMode ? '#e0e0e0' : '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Generate More
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Component for User Details Modal
const UserDetailsModal = ({ user, onClose, darkMode }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  }}>
    <div style={{
      backgroundColor: darkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ 
          color: darkMode ? '#e0e0e0' : '#1f2937',
          margin: 0,
          fontSize: '24px',
          fontWeight: '600'
        }}>
          User Details
        </h3>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: darkMode ? '#9ca3af' : '#6b7280',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* User Info */}
        <div style={{
          backgroundColor: darkMode ? '#374151' : '#f9fafb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ color: darkMode ? '#e0e0e0' : '#1f2937', marginBottom: '12px', fontSize: '16px' }}>
            👤 User Information
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Name:</span>
              <span style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontSize: '14px', fontWeight: '500' }}>
                {user.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Email:</span>
              <span style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontSize: '14px', fontWeight: '500' }}>
                {user.email}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Joined:</span>
              <span style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontSize: '14px', fontWeight: '500' }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Promo Code Info */}
        <div style={{
          backgroundColor: darkMode ? '#374151' : '#f9fafb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ color: darkMode ? '#e0e0e0' : '#1f2937', marginBottom: '12px', fontSize: '16px' }}>
            🎫 Promo Code Usage
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Code Used:</span>
              <span style={{
                backgroundColor: darkMode ? '#1f2937' : '#e5e7eb',
                color: darkMode ? '#e0e0e0' : '#1f2937',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: '500'
              }}>
                {user.registrationPromoCode}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div style={{
          backgroundColor: darkMode ? '#374151' : '#f9fafb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ color: darkMode ? '#e0e0e0' : '#1f2937', marginBottom: '12px', fontSize: '16px' }}>
            💳 Subscription Details
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Plan:</span>
              <span style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                {user.subscriptionTier}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Status:</span>
              <span style={{
                backgroundColor: user.hasActiveSubscription 
                  ? (darkMode ? '#065f46' : '#d1fae5')
                  : (darkMode ? '#7f1d1d' : '#fee2e2'),
                color: user.hasActiveSubscription 
                  ? (darkMode ? '#10b981' : '#065f46')
                  : (darkMode ? '#ef4444' : '#dc2626'),
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {user.hasActiveSubscription ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Amount Paid:</span>
              <span style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontSize: '14px', fontWeight: '500' }}>
                {user.subscription && user.subscription.amount 
                  ? `$${(user.subscription.amount / 100).toFixed(2)}`
                  : user.registrationPromoCode && user.registrationPromoCode.includes('FREE') 
                    ? '$0.00 (Free Access)'
                    : 'N/A'
                }
              </span>
            </div>
            {user.subscription && user.subscription.currentPeriodEnd && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Expires:</span>
                <span style={{ color: darkMode ? '#e0e0e0' : '#1f2937', fontSize: '14px', fontWeight: '500' }}>
                  {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default EnhancedPromoCodeManagement; 
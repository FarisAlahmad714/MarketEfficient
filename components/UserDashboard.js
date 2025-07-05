import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/UserDashboard.module.css';
import storage from '../lib/storage';

const UserDashboard = ({ user }) => {
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get token from storage
      const token = storage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      // Fetch subscription data
      const subResponse = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscriptionData(subData);
      }

      // Fetch payment history
      const paymentResponse = await fetch('/api/user/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentHistory(paymentData.payments || []);
      }

    } catch (error) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/user/manage-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      admin: { color: '#8b5cf6', bg: '#ede9fe', text: 'Administrator' },
      active: { color: '#10b981', bg: '#d1fae5', text: 'Active' },
      trialing: { color: '#f59e0b', bg: '#fef3c7', text: 'Trial' },
      past_due: { color: '#ef4444', bg: '#fee2e2', text: 'Past Due' },
      cancelled: { color: '#6b7280', bg: '#f3f4f6', text: 'Cancelled' },
      none: { color: '#6b7280', bg: '#f3f4f6', text: 'Free' }
    };

    const config = statusConfig[status] || statusConfig.none;
    
    return (
      <span 
        className={styles.statusBadge}
        style={{ 
          color: config.color, 
          backgroundColor: config.bg 
        }}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>My Dashboard</h1>
        <p>Manage your subscription and view your account details</p>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Subscription Status Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Subscription Status</h2>
          {getStatusBadge(user.isAdmin ? 'admin' : (subscriptionData?.status || 'none'))}
        </div>
        
        <div className={styles.cardContent}>
          {user.isAdmin ? (
            <div className={styles.activeSubscription}>
              <div className={styles.planInfo}>
                <h3>Administrator Account</h3>
                <p className={styles.planPrice}>
                  Full Access - No Payment Required
                </p>
              </div>
              
              <div className={styles.billingInfo}>
                <p><strong>Status:</strong> Admin privileges grant unlimited access to all features</p>
              </div>
            </div>
          ) : subscriptionData?.hasActiveSubscription ? (
            <div className={styles.activeSubscription}>
              <div className={styles.planInfo}>
                <h3>{subscriptionData.tier === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}</h3>
                <p className={styles.planPrice}>
                  ${subscriptionData.tier === 'monthly' ? '29' : '249'}/
                  {subscriptionData.tier === 'monthly' ? 'month' : 'year'}
                </p>
              </div>
              
              {subscriptionData.nextBillingDate && (
                <div className={styles.billingInfo}>
                  <p><strong>Next billing:</strong> {formatDate(subscriptionData.nextBillingDate)}</p>
                </div>
              )}
              
              <div className={styles.subscriptionActions}>
                <button 
                  className={styles.manageBtn}
                  onClick={handleManageSubscription}
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.freeAccount}>
              <div className={styles.freeInfo}>
                <h3>Free Account</h3>
                <p>Upgrade to unlock premium features and advanced analytics</p>
              </div>
              
              <div className={styles.upgradeSection}>
                <button 
                  className={styles.upgradeBtn}
                  onClick={handleUpgrade}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Account Information</h2>
        </div>
        
        <div className={styles.cardContent}>
          <div className={styles.accountGrid}>
            <div className={styles.accountItem}>
              <label>Name</label>
              <p>{user.name}</p>
            </div>
            <div className={styles.accountItem}>
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            <div className={styles.accountItem}>
              <label>Member since</label>
              <p>{formatDate(user.createdAt || new Date())}</p>
            </div>
            <div className={styles.accountItem}>
              <label>Account Type</label>
              <p>{user.isAdmin ? 'Administrator' : 'Standard User'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Payment History</h2>
        </div>
        
        <div className={styles.cardContent}>
          {paymentHistory.length > 0 ? (
            <div className={styles.paymentTable}>
              <div className={styles.tableHeader}>
                <div>Date</div>
                <div>Description</div>
                <div>Amount</div>
                <div>Status</div>
              </div>
              
              {paymentHistory.map((payment, index) => (
                <div key={index} className={styles.tableRow}>
                  <div>{formatDate(payment.createdAt)}</div>
                  <div>{payment.description || 'Subscription Payment'}</div>
                  <div>{formatAmount(payment.amount)}</div>
                  <div>
                    <span className={`${styles.paymentStatus} ${styles[payment.status]}`}>
                      {payment.status === 'succeeded' ? 'Paid' : payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noPayments}>
              <p>No payment history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Features Access */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Feature Access</h2>
        </div>
        
        <div className={styles.cardContent}>
          <div className={styles.featuresGrid}>
            <div className={`${styles.feature} ${(user.isAdmin || subscriptionData?.hasActiveSubscription) ? styles.enabled : styles.disabled}`}>
              <span className={styles.featureIcon}>📊</span>
              <div>
                <h4>Advanced Charts</h4>
                <p>Professional trading tools</p>
              </div>
              <span className={styles.featureStatus}>
                {(user.isAdmin || subscriptionData?.hasActiveSubscription) ? '✓' : '🔒'}
              </span>
            </div>
            
            <div className={`${styles.feature} ${(user.isAdmin || subscriptionData?.hasActiveSubscription) ? styles.enabled : styles.disabled}`}>
              <span className={styles.featureIcon}>🤖</span>
              <div>
                <h4>AI Insights</h4>
                <p>Machine learning predictions</p>
              </div>
              <span className={styles.featureStatus}>
                {(user.isAdmin || subscriptionData?.hasActiveSubscription) ? '✓' : '🔒'}
              </span>
            </div>
            
            <div className={`${styles.feature} ${(user.isAdmin || subscriptionData?.hasActiveSubscription) ? styles.enabled : styles.disabled}`}>
              <span className={styles.featureIcon}>📱</span>
              <div>
                <h4>Mobile Access</h4>
                <p>Trade on the go</p>
              </div>
              <span className={styles.featureStatus}>
                {(user.isAdmin || subscriptionData?.hasActiveSubscription) ? '✓' : '🔒'}
              </span>
            </div>
            
            <div className={`${styles.feature} ${(user.isAdmin || subscriptionData?.hasActiveSubscription) ? styles.enabled : styles.disabled}`}>
              <span className={styles.featureIcon}>🔔</span>
              <div>
                <h4>Real-time Alerts</h4>
                <p>Instant notifications</p>
              </div>
              <span className={styles.featureStatus}>
                {(user.isAdmin || subscriptionData?.hasActiveSubscription) ? '✓' : '🔒'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 
// components/admin/UserDetailsModal.js
import { useState, useEffect } from 'react';
import CryptoLoader from '../CryptoLoader';

const UserDetailsModal = ({ user, darkMode, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Since subscription data is already included with the user object from the API,
  // we can use it directly
  useEffect(() => {
    if (user.subscription) {
      setSubscriptionDetails(user.subscription);
    }
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel this subscription? The user will retain access until the end of their billing period.')) {
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          action: 'cancel'
        })
      });

      if (response.ok) {
        alert('Subscription cancelled successfully. User will retain access until period end.');
        onUpdate();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      alert('Error cancelling subscription: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          action: 'reactivate'
        })
      });

      if (response.ok) {
        alert('Subscription reactivated successfully');
        onUpdate();
      } else {
        throw new Error('Failed to reactivate subscription');
      }
    } catch (error) {
      alert('Error reactivating subscription: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleExtendSubscription = async (days) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          action: 'extend',
          days: days
        })
      });

      if (response.ok) {
        alert(`Subscription extended by ${days} days`);
        onUpdate();
      } else {
        throw new Error('Failed to extend subscription');
      }
    } catch (error) {
      alert('Error extending subscription: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleGrantAccess = async (plan, duration) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          plan: plan,
          duration: duration
        })
      });

      if (response.ok) {
        alert(`Granted ${plan} access for ${duration} days`);
        onUpdate();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to grant access');
      }
    } catch (error) {
      alert('Error granting access: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, color: darkMode ? '#e0e0e0' : '#333', fontSize: '22px' }}>
            User Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: darkMode ? '#e0e0e0' : '#333',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* User Info */}
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px' }}>
              👤 User Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Name:</strong>
                <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>{user.name}</p>
              </div>
              <div>
                <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Email:</strong>
                <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>{user.email}</p>
              </div>
              <div>
                <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Email Verified:</strong>
                <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>
                  {user.isVerified ? '✅ Verified' : '❌ Not Verified'}
                </p>
              </div>
              <div>
                <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Account Type:</strong>
                <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>
                  {user.isAdmin ? '👑 Administrator' : '👤 Regular User'}
                </p>
              </div>
              <div>
                <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>User ID:</strong>
                <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '12px', fontFamily: 'monospace' }}>
                  {user._id}
                </p>
              </div>
              <div>
                <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Member Since:</strong>
                <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px' }}>
              💳 Subscription Details
            </h3>
            
            {user.subscription ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Status:</strong>
                    <p style={{ margin: '5px 0' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        backgroundColor: user.subscription.status === 'active' ? '#28a745' : 
                                       user.subscription.status === 'trialing' ? '#17a2b8' :
                                       user.subscription.status === 'past_due' ? '#ffc107' :
                                       user.subscription.status === 'cancelled' ? '#dc3545' :
                                       user.subscription.status === 'admin_access' ? '#6f42c1' : '#6c757d',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {user.subscription.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Plan:</strong>
                    <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>
                      {user.subscription.plan === 'monthly' ? '📅 Monthly' : '📆 Annual'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Amount:</strong>
                    <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>
                      ${(user.subscription.amount / 100).toFixed(2)} / {user.subscription.plan === 'monthly' ? 'month' : 'year'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Days Remaining:</strong>
                    <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '15px' }}>
                      <span style={{
                        color: getDaysRemaining(user.subscription.currentPeriodEnd) < 7 ? '#ff9800' : 'inherit'
                      }}>
                        {getDaysRemaining(user.subscription.currentPeriodEnd)} days
                      </span>
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Current Period Start:</strong>
                    <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '14px' }}>
                      {formatDate(user.subscription.currentPeriodStart)}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Current Period End:</strong>
                    <p style={{ margin: '5px 0', color: darkMode ? '#e0e0e0' : '#333', fontSize: '14px' }}>
                      {formatDate(user.subscription.currentPeriodEnd)}
                    </p>
                  </div>
                  {user.subscription.promoCodeUsed && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Promo Code Used:</strong>
                      <p style={{ margin: '5px 0', color: '#4caf50', fontSize: '14px' }}>
                        🎫 {user.subscription.promoCodeUsed.code} - {user.subscription.promoCodeUsed.description}
                      </p>
                    </div>
                  )}
                  {user.subscription.cancelAtPeriodEnd && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : '#fff3cd',
                        borderRadius: '6px',
                        border: `1px solid ${darkMode ? '#ff9800' : '#ffeaa7'}`
                      }}>
                        <strong style={{ color: '#ff9800' }}>⚠️ Subscription set to cancel</strong>
                        <p style={{ margin: '5px 0 0', color: darkMode ? '#ffb74d' : '#856404', fontSize: '13px' }}>
                          This subscription will end on {formatDate(user.subscription.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  flexWrap: 'wrap',
                  borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  paddingTop: '20px'
                }}>
                  {user.subscription.status === 'active' && !user.subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={updating}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: updating ? 'default' : 'pointer',
                        opacity: updating ? 0.6 : 1,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      🚫 Cancel Subscription
                    </button>
                  )}
                  
                  {user.subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={updating}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: updating ? 'default' : 'pointer',
                        opacity: updating ? 0.6 : 1,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ✅ Reactivate Subscription
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleExtendSubscription(7)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'default' : 'pointer',
                      opacity: updating ? 0.6 : 1,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Extend 7 Days
                  </button>
                  
                  <button
                    onClick={() => handleExtendSubscription(30)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'default' : 'pointer',
                      opacity: updating ? 0.6 : 1,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Extend 30 Days
                  </button>

                  <button
                    onClick={() => handleExtendSubscription(90)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'default' : 'pointer',
                      opacity: updating ? 0.6 : 1,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Extend 90 Days
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '20px',
                  backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : '#fff3cd',
                  borderRadius: '6px',
                  border: `1px solid ${darkMode ? '#ff9800' : '#ffeaa7'}`,
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, color: darkMode ? '#ffb74d' : '#856404' }}>
                    ⚠️ This user does not have an active subscription.
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleGrantAccess('monthly', 30)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'default' : 'pointer',
                      opacity: updating ? 0.6 : 1,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🎁 Grant Monthly Access (30 days)
                  </button>
                  
                  <button
                    onClick={() => handleGrantAccess('annual', 365)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'default' : 'pointer',
                      opacity: updating ? 0.6 : 1,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🎁 Grant Annual Access (365 days)
                  </button>

                  <button
                    onClick={() => handleGrantAccess('monthly', 7)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ffc107',
                      color: '#333',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'default' : 'pointer',
                      opacity: updating ? 0.6 : 1,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🎫 Grant 7-Day Trial
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{
            padding: '20px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px' }}>
              📊 Account Statistics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px' 
            }}>
              <div style={{
                padding: '15px',
                backgroundColor: darkMode ? '#333' : '#fff',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>🗓️</div>
                <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Account Age</div>
                <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px', fontWeight: '500' }}>
                  {Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: darkMode ? '#333' : '#fff',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>💰</div>
                <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Total Spent</div>
                <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px', fontWeight: '500' }}>
                  ${user.subscription ? (user.subscription.amount / 100).toFixed(2) : '0.00'}
                </div>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: darkMode ? '#333' : '#fff',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>📝</div>
                <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '13px' }}>Account Status</div>
                <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontSize: '18px', fontWeight: '500' }}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
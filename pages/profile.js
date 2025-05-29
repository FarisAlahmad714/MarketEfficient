// pages/profile.js
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { FaUser, FaCamera, FaCreditCard, FaCheckCircle, 
         FaExclamationCircle, FaLock, FaBell } from 'react-icons/fa';
import Head from 'next/head';
import CryptoLoader from '../components/CryptoLoader';

const ProfilePage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    notifications: {
      email: true,
      app: true
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        notifications: user.notifications || { email: true, app: true }
      });
      fetchUserData();
    }
  }, [user, isAuthenticated]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/user/subscription/details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch subscription');
      
      const data = await response.json();
      setSubscription(data.subscription);
      setBillingHistory(data.billingHistory || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setSaveError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveError(null);
    
    try {
      // Simulate save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
      await fetchUserData();
    } catch (error) {
      setSaveError('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to reactivate subscription');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
      await fetchUserData();
    } catch (error) {
      setSaveError('Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/subscription/update-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to create payment update session');
      
      const { url } = await response.json();
      
      // Redirect to Stripe portal
      window.location.href = url;
    } catch (error) {
      setSaveError('Failed to update payment method. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    const badges = {
      active: { icon: FaCheckCircle, text: 'Active', color: '#4CAF50' },
      trialing: { icon: FaExclamationCircle, text: 'Trial', color: '#FFC107' },
      cancelled: { icon: FaExclamationCircle, text: 'Cancelled', color: '#F44336' },
      admin_access: { icon: FaCheckCircle, text: 'Admin Access', color: '#9C27B0' },
      inactive: { icon: FaExclamationCircle, text: 'Inactive', color: '#F44336' }
    };
    
    const badge = badges[subscription.status] || badges.inactive;
    const Icon = badge.icon;
    
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: darkMode ? `${badge.color}33` : `${badge.color}1A`,
        color: badge.color,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '500',
      }}>
        <Icon style={{ marginRight: '5px' }} />
        {badge.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        padding: '20px'
      }}>
        <div style={{
          width: '400px',
          maxWidth: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <CryptoLoader 
            message="Loading profile..."
            minDisplayTime={1500}
            height="350px"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - MarketEfficient</title>
        <meta name="description" content="Manage your profile and subscription" />
      </Head>
      
      <div style={{
        maxWidth: '1000px',
        margin: '40px auto',
        padding: '0 20px',
      }}>
        <h1 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '20px'
        }}>
          Your Profile
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '30px',
          flexWrap: 'wrap',
        }}>
          {/* Left sidebar */}
          <div style={{ flex: '0 0 240px' }}>
            {/* Profile Card */}
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              <div style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                margin: '0 auto 15px',
                backgroundColor: darkMode ? '#333' : '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${darkMode ? '#555' : '#e0e0e0'}`,
                overflow: 'hidden',
              }}>
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <FaUser size={50} color={darkMode ? '#666' : '#999'} />
                )}
                <label htmlFor="profile-image-upload" style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  backgroundColor: darkMode ? '#1976D2' : '#2196F3',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: `2px solid ${darkMode ? '#1e1e1e' : 'white'}`,
                }}>
                  <FaCamera color="white" size={14} />
                  <input 
                    type="file" 
                    id="profile-image-upload" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
              
              <h2 style={{ 
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '18px', 
                margin: '0 0 5px 0',
                fontWeight: 'bold',
              }}>
                {formData.name}
              </h2>
              
              <p style={{ 
                color: darkMode ? '#b0b0b0' : '#666',
                margin: '0 0 15px 0',
                fontSize: '14px',
              }}>
                {formData.email}
              </p>
              
              {getSubscriptionBadge()}
              
              {subscription?.plan && (
                <div style={{
                  marginTop: '10px',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: darkMode ? '#90caf9' : '#2196F3',
                  display: 'inline-block',
                  fontSize: '13px',
                  fontWeight: '500',
                  textTransform: 'capitalize',
                }}>
                  {subscription.plan} Plan
                </div>
              )}
            </div>
            
            {/* Navigation */}
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}>
              {[
                { id: 'profile', icon: FaUser, label: 'Profile Settings' },
                { id: 'subscription', icon: FaCreditCard, label: 'Subscription' },
                { id: 'notifications', icon: FaBell, label: 'Notifications' },
                { id: 'security', icon: FaLock, label: 'Security' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: activeTab === tab.id ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                    borderLeft: activeTab === tab.id ? '4px solid #2196F3' : 'none',
                    paddingLeft: activeTab === tab.id ? '16px' : '20px',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: activeTab === tab.id ? '#2196F3' : (darkMode ? '#e0e0e0' : '#333'),
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <tab.icon style={{ marginRight: '10px', fontSize: '16px' }} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div style={{
            flex: '1 1 auto',
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            padding: '30px',
            minWidth: '300px',
          }}>
            {/* Success/Error Messages */}
            {saveSuccess && (
              <div style={{
                backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                color: '#4CAF50',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <FaCheckCircle style={{ marginRight: '10px' }} />
                Changes saved successfully!
              </div>
            )}
            
            {saveError && (
              <div style={{
                backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
                color: '#F44336',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <FaExclamationCircle style={{ marginRight: '10px' }} />
                {saveError}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontSize: '20px',
                }}>
                  Profile Settings
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontWeight: '500',
                  }}>
                    Full Name
                  </label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#e0e0e0' : '#333',
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontWeight: '500',
                  }}>
                    Email Address
                  </label>
                  <input 
                    type="email"
                    value={formData.email}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#e0e0e0' : '#333',
                    }}
                    disabled
                  />
                </div>
                
                <div style={{ marginBottom: '25px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontWeight: '500',
                  }}>
                    Bio
                  </label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#e0e0e0' : '#333',
                      height: '100px',
                      resize: 'vertical',
                    }}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
            
            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontSize: '20px',
                }}>
                  Subscription & Billing
                </h2>
                
                {/* Current Subscription */}
                {subscription ? (
                  <div style={{
                    padding: '20px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    marginBottom: '30px',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                    }}>
                      <div>
                        <h3 style={{ 
                          color: darkMode ? '#e0e0e0' : '#333',
                          margin: '0 0 5px 0',
                          fontSize: '18px',
                          textTransform: 'capitalize',
                        }}>
                          {subscription.plan} Plan
                        </h3>
                        {getSubscriptionBadge()}
                      </div>
                      
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: darkMode ? '#e0e0e0' : '#333',
                        }}>
                          {subscription.amount ? formatPrice(subscription.amount) : 'Free'}
                        </div>
                        {subscription.originalAmount && subscription.amount < subscription.originalAmount && (
                          <div style={{
                            fontSize: '14px',
                            color: '#4CAF50',
                          }}>
                            was {formatPrice(subscription.originalAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Subscription Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      {subscription.promoCode && (
                        <div>
                          <label style={{
                            color: darkMode ? '#888' : '#666',
                            fontSize: '13px',
                            display: 'block',
                            marginBottom: '3px'
                          }}>
                            Promo Code Used
                          </label>
                          <p style={{
                            color: '#4CAF50',
                            fontSize: '15px',
                            margin: 0,
                            fontWeight: '600'
                          }}>
                            {subscription.promoCode.code}
                            {subscription.discountAmount > 0 && (
                              <span style={{
                                fontSize: '13px',
                                fontWeight: 'normal',
                                marginLeft: '5px'
                              }}>
                                (-{formatPrice(subscription.discountAmount)})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      {subscription.currentPeriodEnd && (
                        <div>
                          <label style={{
                            color: darkMode ? '#888' : '#666',
                            fontSize: '13px',
                            display: 'block',
                            marginBottom: '3px'
                          }}>
                            {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                          </label>
                          <p style={{
                            color: darkMode ? '#e0e0e0' : '#333',
                            fontSize: '15px',
                            margin: 0
                          }}>
                            {formatDate(subscription.currentPeriodEnd)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Subscription Actions */}
                    {subscription.stripeSubscriptionId && (
                      <div style={{ 
                        borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`,
                        paddingTop: '20px',
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}>
                        {subscription.cancelAtPeriodEnd ? (
                          <button
                            onClick={handleReactivateSubscription}
                            disabled={loading}
                            style={{
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '10px 20px',
                              fontSize: '14px',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.7 : 1,
                            }}
                          >
                            Reactivate Subscription
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleUpdatePayment}
                              disabled={loading}
                              style={{
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                              }}
                            >
                              Update Payment Method
                            </button>
                            <button
                              onClick={handleCancelSubscription}
                              disabled={loading}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#F44336',
                                border: '1px solid #F44336',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                              }}
                            >
                              Cancel Subscription
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: darkMode ? '#262626' : '#f5f5f5',
                    borderRadius: '8px',
                    marginBottom: '30px'
                  }}>
                    <p style={{
                      color: darkMode ? '#888' : '#666',
                      marginBottom: '20px',
                      fontSize: '16px'
                    }}>
                      You don't have an active subscription.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      style={{
                        padding: '12px 30px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    >
                      View Plans
                    </button>
                  </div>
                )}
                
                {/* Billing History */}
                {billingHistory.length > 0 && (
                  <>
                    <h3 style={{
                      color: darkMode ? '#e0e0e0' : '#333',
                      marginBottom: '15px',
                      fontSize: '18px',
                    }}>
                      Billing History
                    </h3>
                    
                    <div style={{
                      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      {billingHistory.map((payment, index) => (
                        <div
                          key={payment.id || index}
                          style={{
                            padding: '15px 20px',
                            borderBottom: index < billingHistory.length - 1 ? 
                              `1px solid ${darkMode ? '#333' : '#eee'}` : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <p style={{
                              color: darkMode ? '#e0e0e0' : '#333',
                              margin: 0,
                              fontSize: '14px'
                            }}>
                              {payment.description}
                            </p>
                            <p style={{
                              color: darkMode ? '#888' : '#666',
                              margin: '2px 0 0 0',
                              fontSize: '12px'
                            }}>
                              {formatDate(payment.createdAt)}
                              {payment.promoCode && (
                                <span style={{
                                  marginLeft: '10px',
                                  color: '#4CAF50'
                                }}>
                                  • {payment.promoCode.code}
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{
                              color: darkMode ? '#e0e0e0' : '#333',
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {formatPrice(payment.amount)}
                            </p>
                            <p style={{
                              color: payment.status === 'succeeded' ? '#4CAF50' : '#F44336',
                              margin: '2px 0 0 0',
                              fontSize: '12px',
                              textTransform: 'capitalize'
                            }}>
                              {payment.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontSize: '20px',
                }}>
                  Notification Settings
                </h2>
                
                {[
                  { id: 'email', title: 'Email Notifications', desc: 'Receive emails about account updates' },
                  { id: 'app', title: 'App Notifications', desc: 'In-app notifications about your activity' }
                ].map(notif => (
                  <div
                    key={notif.id}
                    style={{
                      marginBottom: '15px',
                      padding: '15px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? '#262626' : '#f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ 
                        color: darkMode ? '#e0e0e0' : '#333',
                        margin: '0 0 5px 0',
                        fontSize: '16px',
                      }}>
                        {notif.title}
                      </h3>
                      <p style={{ 
                        color: darkMode ? '#b0b0b0' : '#666',
                        margin: 0,
                        fontSize: '14px',
                      }}>
                        {notif.desc}
                      </p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.notifications[notif.id]} 
                        onChange={() => handleNotificationChange(notif.id)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: formData.notifications[notif.id] ? '#2196F3' : (darkMode ? '#555' : '#ccc'),
                        transition: '0.3s',
                        borderRadius: '34px',
                      }}>
                        <span style={{
                          position: 'absolute',
                          height: '18px',
                          width: '18px',
                          left: formData.notifications[notif.id] ? '28px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%',
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    marginTop: '20px',
                  }}
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontSize: '20px',
                }}>
                  Security Settings
                </h2>
                
                <div style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  marginBottom: '20px',
                }}>
                  <h3 style={{ 
                    color: darkMode ? '#e0e0e0' : '#333',
                    margin: '0 0 15px 0',
                    fontSize: '18px',
                  }}>
                    Change Password
                  </h3>
                  
                  <button 
                    onClick={() => router.push('/auth/forgot-password')}
                    style={{
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset Password via Email
                  </button>
                </div>
                
                <div style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                }}>
                  <h3 style={{ 
                    color: darkMode ? '#e0e0e0' : '#333',
                    margin: '0 0 15px 0',
                    fontSize: '18px',
                  }}>
                    Account Actions
                  </h3>
                  
                  <button 
                    onClick={logout}
                    style={{
                      backgroundColor: '#F44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
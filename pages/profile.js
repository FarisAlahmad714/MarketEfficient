// pages/profile.js
// pages/profile.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { FaUser, FaCamera, FaCreditCard, FaHistory, FaCheckCircle, 
         FaExclamationCircle, FaLock, FaSignOutAlt, FaBell } from 'react-icons/fa';
import Head from 'next/head';
import CryptoLoader from '../components/CryptoLoader';

const ProfilePage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    notifications: {
      email: true,
      app: true
    }
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);

  
  const cryptoLoaderRef = useRef(null);

  // Fetch user data on component mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        notifications: user.notifications || {
          email: true,
          app: true
        }
      });

      // Fetch all data and wait for completion
      Promise.all([
        fetchUserSubscription(),
        fetchPaymentMethods(),
        fetchPaymentHistory(),
        fetchProfileImage()
      ]).then(() => {
        if (cryptoLoaderRef.current) {
          cryptoLoaderRef.current.hideLoader();
          setTimeout(() => {
            setLoading(false);
          }, 500);
        } else {
          setLoading(false);
        }
      }).catch((error) => {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      });
    }
  }, [user]);

  // Simulated fetch functions returning promises
  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch subscription');
      
      const data = await response.json();
      
      if (data.subscription) {
        setSubscriptionStatus(data.subscription.status);
        setSubscriptionTier(data.subscription.plan);
        
        // Store the full subscription data for later use
        setSubscriptionData(data.subscription);
      } else {
        setSubscriptionStatus('inactive');
        setSubscriptionTier(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscriptionStatus('inactive');
      setSubscriptionTier(null);
    }
  };

  const fetchPaymentMethods = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setPaymentMethods([
          { id: 'card_123', type: 'card', last4: '4242', brand: 'Visa', expMonth: 12, expYear: 2025, isDefault: true },
        ]);
        resolve();
      }, 700);
    });
  };

  const fetchPaymentHistory = async () => {
  try {
    const response = await fetch('/api/user/subscription', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch payment history');
    
    const data = await response.json();
    
    if (data.billingHistory) {
      setPaymentHistory(data.billingHistory.map(payment => ({
        id: payment._id,
        amount: payment.amount / 100, // Convert cents to dollars
        date: payment.createdAt,
        status: payment.status === 'succeeded' ? 'paid' : payment.status,
        description: payment.description
      })));
    }
  } catch (error) {
    console.error('Error fetching payment history:', error);
    setPaymentHistory([]);
  }
};

  const fetchProfileImage = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setProfileImage(null); // Default no image
        resolve();
      }, 600);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNotificationChange = (type) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [type]: !formData.notifications[type]
      }
    });
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

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setSaveSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };

  const handleSubscribe = () => {
    console.log('Open subscription modal or redirect to Stripe');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      const data = await response.json();
      setSaveSuccess(true);
      setSaveError(null);
      
      // Update local state
      setSubscriptionData(data.subscription);
      
      // Show success message
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
      
      // Refresh subscription data
      await fetchUserSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setSaveError('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReactivateSubscription = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to reactivate subscription');
      
      const data = await response.json();
      setSaveSuccess(true);
      setSaveError(null);
      
      // Update local state
      setSubscriptionData(data.subscription);
      
      // Show success message
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
      
      // Refresh subscription data
      await fetchUserSubscription();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setSaveError('Failed to reactivate subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    console.log('Add payment method');
  };

  const getSubscriptionBadge = () => {
    if (subscriptionStatus === 'active') {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
          color: '#4CAF50',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '500',
        }}>
          <FaCheckCircle style={{ marginRight: '5px' }} />
          Active
        </div>
      );
    } else if (subscriptionStatus === 'trialing') {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)',
          color: '#FFC107',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '500',
        }}>
          <FaExclamationCircle style={{ marginRight: '5px' }} />
          Trial
        </div>
      );
    } else {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
          color: '#F44336',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '500',
        }}>
          <FaExclamationCircle style={{ marginRight: '5px' }} />
          Inactive
        </div>
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '80px auto',
        padding: '30px',
        textAlign: 'center',
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '8px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Please log in to view your profile</h2>
      </div>
    );
  }

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
            ref={cryptoLoaderRef}
            message="Loading profile data..."
            minDisplayTime={1500}
            height="350px"
            key={`profile-loader-${Date.now()}`}
            forceDarkMode={darkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Profile - Trading Platform</title>
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
          <div style={{
            flex: '0 0 240px',
          }}>
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
              
              {subscriptionTier && (
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
                  {subscriptionTier} Plan
                </div>
              )}
            </div>
            
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '12px',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}>
              <button 
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'profile' ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                  borderLeft: activeTab === 'profile' ? '4px solid #2196F3' : 'none',
                  paddingLeft: activeTab === 'profile' ? '16px' : '20px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: activeTab === 'profile' ? (darkMode ? '#2196F3' : '#2196F3') : (darkMode ? '#e0e0e0' : '#333'),
                  fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaUser style={{ marginRight: '10px', fontSize: '16px' }} />
                Profile Settings
              </button>
              
              <button 
                onClick={() => setActiveTab('subscription')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'subscription' ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                  borderLeft: activeTab === 'subscription' ? '4px solid #2196F3' : 'none',
                  paddingLeft: activeTab === 'subscription' ? '16px' : '20px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: activeTab === 'subscription' ? (darkMode ? '#2196F3' : '#2196F3') : (darkMode ? '#e0e0e0' : '#333'),
                  fontWeight: activeTab === 'subscription' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaCreditCard style={{ marginRight: '10px', fontSize: '16px' }} />
                Subscription
              </button>
              
              <button 
                onClick={() => setActiveTab('payment')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'payment' ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                  borderLeft: activeTab === 'payment' ? '4px solid #2196F3' : 'none',
                  paddingLeft: activeTab === 'payment' ? '16px' : '20px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: activeTab === 'payment' ? (darkMode ? '#2196F3' : '#2196F3') : (darkMode ? '#e0e0e0' : '#333'),
                  fontWeight: activeTab === 'payment' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaCreditCard style={{ marginRight: '10px', fontSize: '16px' }} />
                Payment Methods
              </button>
              
              <button 
                onClick={() => setActiveTab('history')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'history' ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                  borderLeft: activeTab === 'history' ? '4px solid #2196F3' : 'none',
                  paddingLeft: activeTab === 'history' ? '16px' : '20px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: activeTab === 'history' ? (darkMode ? '#2196F3' : '#2196F3') : (darkMode ? '#e0e0e0' : '#333'),
                  fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaHistory style={{ marginRight: '10px', fontSize: '16px' }} />
                Payment History
              </button>
              
              <button 
                onClick={() => setActiveTab('notifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'notifications' ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                  borderLeft: activeTab === 'notifications' ? '4px solid #2196F3' : 'none',
                  paddingLeft: activeTab === 'notifications' ? '16px' : '20px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: activeTab === 'notifications' ? (darkMode ? '#2196F3' : '#2196F3') : (darkMode ? '#e0e0e0' : '#333'),
                  fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaBell style={{ marginRight: '10px', fontSize: '16px' }} />
                Notifications
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'security' ? (darkMode ? '#333' : '#f5f7fa') : 'transparent',
                  borderLeft: activeTab === 'security' ? '4px solid #2196F3' : 'none',
                  paddingLeft: activeTab === 'security' ? '16px' : '20px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: activeTab === 'security' ? (darkMode ? '#2196F3' : '#2196F3') : (darkMode ? '#e0e0e0' : '#333'),
                  fontWeight: activeTab === 'security' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                <FaLock style={{ marginRight: '10px', fontSize: '16px' }} />
                Security
              </button>
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
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}>
                  Profile Settings
                </h2>
                
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
                    Your profile has been updated successfully.
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
                    name="email"
                    value={formData.email}
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
                    disabled
                  />
                  <small style={{ 
                    color: darkMode ? '#777' : '#999',
                    fontSize: '12px', 
                    marginTop: '5px',
                    display: 'block'
                  }}>
                    Email address cannot be changed. Contact support for assistance.
                  </small>
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
                
                <div style={{ marginTop: '30px' }}>
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'subscription' && (
  <div>
    <h2 style={{ 
      color: darkMode ? '#e0e0e0' : '#333',
      marginTop: 0,
      marginBottom: '20px',
      fontWeight: 'bold',
      fontSize: '20px',
    }}>
      Subscription Plan
    </h2>
    
    {/* Show success/error messages */}
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
        Your subscription has been updated successfully.
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
        marginBottom: '15px',
      }}>
        <div>
          <h3 style={{ 
            color: darkMode ? '#e0e0e0' : '#333',
            margin: '0 0 5px 0',
            fontSize: '18px',
            textTransform: 'capitalize',
            fontWeight: 'bold',
          }}>
            {subscriptionTier || 'Free'} Plan
          </h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {getSubscriptionBadge()}
            {subscriptionData && subscriptionStatus === 'active' && (
              <span style={{ 
                color: darkMode ? '#b0b0b0' : '#666',
                marginLeft: '10px',
                fontSize: '14px',
              }}>
                {subscriptionData.cancelAtPeriodEnd 
                  ? `Access until: ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}`
                  : `Next billing date: ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}`
                }
              </span>
            )}
          </div>
        </div>
        
        <div>
          {subscriptionData && subscriptionData.stripeSubscriptionId ? (
            // Stripe subscription - can cancel/reactivate
            subscriptionData.cancelAtPeriodEnd ? (
              <button
                onClick={handleReactivateSubscription}
                disabled={loading}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : 'Reactivate Subscription'}
              </button>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                style={{
                  backgroundColor: 'transparent',
                  color: '#F44336',
                  border: `1px solid ${darkMode ? 'rgba(244, 67, 54, 0.5)' : 'rgba(244, 67, 54, 0.3)'}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )
          ) : subscriptionData && !subscriptionData.stripeSubscriptionId && subscriptionStatus === 'active' ? (
            // Promotional subscription - no actions available
            <div style={{
              padding: '8px 16px',
              backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
              color: '#2196F3',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
            }}>
              Promotional Plan
            </div>
          ) : (
            // No active subscription
            <button
              onClick={() => window.location.href = '/pricing'}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Subscribe Now
            </button>
          )}
        </div>
      </div>
      
      {/* Show promotional subscription notice */}
      {subscriptionData && !subscriptionData.stripeSubscriptionId && subscriptionStatus === 'active' && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
          borderRadius: '6px',
          color: darkMode ? '#90caf9' : '#2196F3',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <FaExclamationCircle style={{ marginRight: '8px' }} />
          This is a promotional subscription. It will expire on {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()} and won't auto-renew.
        </div>
      )}
      
      {/* Show cancellation pending notice */}
      {subscriptionData && subscriptionData.cancelAtPeriodEnd && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: darkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.05)',
          borderRadius: '6px',
          color: darkMode ? '#FFC107' : '#FFA000',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <FaExclamationCircle style={{ marginRight: '8px' }} />
          Your subscription is set to cancel at the end of the current billing period. You'll retain access until {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}.
        </div>
      )}
      
      {subscriptionStatus === 'active' && subscriptionTier && (
        <div style={{
          color: darkMode ? '#b0b0b0' : '#666',
          fontSize: '14px',
          marginTop: '15px',
        }}>
          <p style={{ margin: '0 0 5px 0' }}>Your {subscriptionTier} subscription includes:</p>
          <ul style={{ 
            paddingLeft: '20px',
            margin: '0',
            lineHeight: '1.6',
          }}>
            {subscriptionTier === 'monthly' || subscriptionTier === 'annual' ? (
              <>
                <li>Full access to all trading tests and exam modules</li>
                <li>Unlimited chart analysis with AI feedback</li>
                <li>Performance tracking and analytics</li>
                <li>Expert trading pattern recognition tools</li>
                {subscriptionTier === 'annual' && <li>Save 20% compared to monthly billing</li>}
              </>
            ) : (
              <li>Full access to premium features</li>
            )}
          </ul>
        </div>
      )}
    </div>
    
    <h3 style={{ 
      color: darkMode ? '#e0e0e0' : '#333',
      fontSize: '18px',
      marginBottom: '15px',
    }}>
      Available Plans
    </h3>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
      gap: '20px',
      marginBottom: '30px',
    }}>
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
        backgroundColor: subscriptionTier === 'monthly' ? (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 'transparent',
        borderColor: subscriptionTier === 'monthly' ? '#2196F3' : (darkMode ? '#444' : '#ddd'),
      }}>
        <h4 style={{ 
          color: darkMode ? '#e0e0e0' : '#333',
          margin: '0 0 10px 0',
          fontSize: '18px',
        }}>
          Monthly Plan
        </h4>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: darkMode ? '#e0e0e0' : '#333',
          margin: '10px 0',
        }}>
          $29.99<span style={{ fontSize: '14px', fontWeight: 'normal', color: darkMode ? '#b0b0b0' : '#666' }}>/month</span>
        </div>
        <ul style={{ 
          paddingLeft: '20px',
          margin: '15px 0',
          color: darkMode ? '#b0b0b0' : '#666',
          fontSize: '14px',
          lineHeight: '1.6',
        }}>
          <li>Full access to all features</li>
          <li>Cancel anytime</li>
          <li>Priority support</li>
        </ul>
        {(subscriptionTier !== 'monthly' || subscriptionStatus !== 'active') && (
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              width: '100%',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            {subscriptionStatus === 'active' ? 'Switch to Monthly' : 'Choose Monthly'}
          </button>
        )}
      </div>
      
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
        backgroundColor: subscriptionTier === 'annual' ? (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 'transparent',
        borderColor: subscriptionTier === 'annual' ? '#2196F3' : (darkMode ? '#444' : '#ddd'),
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h4 style={{ 
            color: darkMode ? '#e0e0e0' : '#333',
            margin: '0 0 10px 0',
            fontSize: '18px',
          }}>
            Annual Plan
          </h4>
          <div style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '3px 8px',
            borderRadius: '4px',
          }}>
            SAVE 20%
          </div>
        </div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: darkMode ? '#e0e0e0' : '#333',
          margin: '10px 0',
        }}>
          $287.88<span style={{ fontSize: '14px', fontWeight: 'normal', color: darkMode ? '#b0b0b0' : '#666' }}>/year</span>
        </div>
        <div style={{
          fontSize: '14px',
          color: darkMode ? '#90caf9' : '#2196F3',
          marginBottom: '10px',
        }}>
          Just $23.99/month (billed annually)
        </div>
        <ul style={{ 
          paddingLeft: '20px',
          margin: '15px 0',
          color: darkMode ? '#b0b0b0' : '#666',
          fontSize: '14px',
          lineHeight: '1.6',
        }}>
          <li>Everything in Monthly plan</li>
          <li>Save 20% with annual billing</li>
          <li>Best value for serious traders</li>
        </ul>
        {(subscriptionTier !== 'annual' || subscriptionStatus !== 'active') && (
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              width: '100%',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            {subscriptionStatus === 'active' ? 'Switch to Annual' : 'Choose Annual'}
          </button>
        )}
      </div>
    </div>
  </div>
)}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}>
                  Notification Settings
                </h2>
                
                <div style={{
                  marginBottom: '20px',
                }}>
                  <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#262626' : '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <h3 style={{ 
                        color: darkMode ? '#e0e0e0' : '#333',
                        margin: '0 0 5px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}>
                        Email Notifications
                      </h3>
                      <p style={{ 
                        color: darkMode ? '#b0b0b0' : '#666',
                        margin: 0,
                        fontSize: '14px',
                      }}>
                        Receive emails about account and subscription updates.
                      </p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.notifications.email} 
                        onChange={() => handleNotificationChange('email')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: formData.notifications.email ? '#2196F3' : (darkMode ? '#555' : '#ccc'),
                        transition: '0.3s',
                        borderRadius: '34px',
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px',
                          width: '18px',
                          left: formData.notifications.email ? '28px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%',
                        }} />
                      </span>
                    </label>
                  </div>
                  
                  <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#262626' : '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <h3 style={{ 
                        color: darkMode ? '#e0e0e0' : '#333',
                        margin: '0 0 5px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}>
                        App Notifications
                      </h3>
                      <p style={{ 
                        color: darkMode ? '#b0b0b0' : '#666',
                        margin: 0,
                        fontSize: '14px',
                      }}>
                        Receive in-app notifications about your activity and results.
                      </p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.notifications.app} 
                        onChange={() => handleNotificationChange('app')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: formData.notifications.app ? '#2196F3' : (darkMode ? '#555' : '#ccc'),
                        transition: '0.3s',
                        borderRadius: '34px',
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px',
                          width: '18px',
                          left: formData.notifications.app ? '28px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%',
                        }} />
                      </span>
                    </label>
                  </div>
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
                    marginTop: '20px',
                  }}
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontWeight: 'bold',
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
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontWeight: '500',
                    }}>
                      Current Password
                    </label>
                    <input 
                      type="password"
                      placeholder="Enter your current password"
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
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontWeight: '500',
                    }}>
                      New Password
                    </label>
                    <input 
                      type="password"
                      placeholder="Enter new password"
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
                      Confirm New Password
                    </label>
                    <input 
                      type="password"
                      placeholder="Confirm new password"
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
                  
                  <button 
                    onClick={() => console.log('Change password')}
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
                    Update Password
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
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={() => console.log('Delete account')}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#F44336',
                        border: `1px solid ${darkMode ? 'rgba(244, 67, 54, 0.5)' : 'rgba(244, 67, 54, 0.3)'}`,
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <FaSignOutAlt style={{ marginRight: '8px' }} />
                      Delete Account
                    </button>
                  </div>
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
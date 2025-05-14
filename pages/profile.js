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
  const fetchUserSubscription = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setSubscriptionStatus('active');
        setSubscriptionTier('premium');
        resolve();
      }, 500);
    });
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

  const fetchPaymentHistory = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setPaymentHistory([
          { id: 'invoice_123', amount: 19.99, date: '2025-04-01', status: 'paid' },
          { id: 'invoice_122', amount: 19.99, date: '2025-03-01', status: 'paid' },
          { id: 'invoice_121', amount: 19.99, date: '2025-02-01', status: 'paid' },
        ]);
        resolve();
      }, 800);
    });
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

  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      console.log('Canceling subscription...');
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
                        {subscriptionStatus === 'active' && (
                          <span style={{ 
                            color: darkMode ? '#b0b0b0' : '#666',
                            marginLeft: '10px',
                            fontSize: '14px',
                          }}>
                            Next billing date: May 1, 2025
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {subscriptionStatus === 'active' ? (
                        <button
                          onClick={handleCancelSubscription}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#F44336',
                            border: `1px solid ${darkMode ? 'rgba(244, 67, 54, 0.5)' : 'rgba(244, 67, 54, 0.3)'}`,
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel Subscription
                        </button>
                      ) : (
                        <button
                          onClick={handleSubscribe}
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
                  
                  {subscriptionStatus === 'active' && subscriptionTier === 'premium' && (
                    <div style={{
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontSize: '14px',
                    }}>
                      <p style={{ margin: '0 0 5px 0' }}>Your premium subscription includes:</p>
                      <ul style={{ 
                        paddingLeft: '20px',
                        margin: '0',
                        lineHeight: '1.6',
                      }}>
                        <li>Full access to all trading tests and exam modules</li>
                        <li>Unlimited chart analysis with AI feedback</li>
                        <li>Performance tracking and analytics</li>
                        <li>Expert trading pattern recognition tools</li>
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
                    backgroundColor: subscriptionTier === 'basic' ? (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 'transparent',
                    borderColor: subscriptionTier === 'basic' ? '#2196F3' : (darkMode ? '#444' : '#ddd'),
                  }}>
                    <h4 style={{ 
                      color: darkMode ? '#e0e0e0' : '#333',
                      margin: '0 0 10px 0',
                      fontSize: '18px',
                    }}>
                      Basic Plan
                    </h4>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: darkMode ? '#e0e0e0' : '#333',
                      margin: '10px 0',
                    }}>
                      $9.99<span style={{ fontSize: '14px', fontWeight: 'normal', color: darkMode ? '#b0b0b0' : '#666' }}>/month</span>
                    </div>
                    <ul style={{ 
                      paddingLeft: '20px',
                      margin: '15px 0',
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}>
                      <li>Access to bias tests</li>
                      <li>Limited chart exam access</li>
                      <li>Basic performance tracking</li>
                    </ul>
                    {(subscriptionTier !== 'basic' || subscriptionStatus !== 'active') && (
                      <button
                        onClick={() => console.log('Select Basic Plan')}
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
                        {subscriptionStatus === 'active' ? 'Switch to Basic' : 'Choose Basic'}
                      </button>
                    )}
                  </div>
                  
                  <div style={{
                    padding: '20px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    backgroundColor: subscriptionTier === 'premium' ? (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 'transparent',
                    borderColor: subscriptionTier === 'premium' ? '#2196F3' : (darkMode ? '#444' : '#ddd'),
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
                        Premium Plan
                      </h4>
                      <div style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}>
                        BEST VALUE
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: darkMode ? '#e0e0e0' : '#333',
                      margin: '10px 0',
                    }}>
                      $19.99<span style={{ fontSize: '14px', fontWeight: 'normal', color: darkMode ? '#b0b0b0' : '#666' }}>/month</span>
                    </div>
                    <ul style={{ 
                      paddingLeft: '20px',
                      margin: '15px 0',
                      color: darkMode ? '#b0b0b0' : '#666',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}>
                      <li>Full access to all tests and exams</li>
                      <li>Unlimited AI-powered analysis</li>
                      <li>Advanced performance tracking</li>
                      <li>Priority customer support</li>
                      <li>New features as they release</li>
                    </ul>
                    {(subscriptionTier !== 'premium' || subscriptionStatus !== 'active') && (
                      <button
                        onClick={() => console.log('Select Premium Plan')}
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
                        {subscriptionStatus === 'active' ? 'Switch to Premium' : 'Choose Premium'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'payment' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}>
                  Payment Methods
                </h2>
                
                {paymentMethods.length > 0 ? (
                  <div>
                    {paymentMethods.map(method => (
                      <div 
                        key={method.id}
                        style={{
                          padding: '15px',
                          borderRadius: '8px',
                          border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                          marginBottom: '15px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '50px',
                            height: '30px',
                            backgroundColor: darkMode ? '#333' : '#f0f0f0',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '15px',
                            border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                          }}>
                            {method.brand === 'Visa' && (
                              <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>VISA</span>
                            )}
                            {method.brand === 'Mastercard' && (
                              <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>MC</span>
                            )}
                            {method.brand === 'Amex' && (
                              <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>AMEX</span>
                            )}
                          </div>
                          
                          <div>
                            <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>
                              {method.brand} •••• {method.last4}
                            </div>
                            <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
                              Expires {method.expMonth}/{method.expYear}
                              {method.isDefault && (
                                <span style={{ 
                                  marginLeft: '10px',
                                  color: darkMode ? '#90caf9' : '#2196F3',
                                  fontWeight: '500',
                                  fontSize: '12px',
                                }}>
                                  DEFAULT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <button
                            onClick={() => console.log('Edit payment method')}
                            style={{
                              backgroundColor: 'transparent',
                              color: darkMode ? '#90caf9' : '#2196F3',
                              border: 'none',
                              padding: '5px 10px',
                              marginRight: '10px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => console.log('Remove payment method')}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#F44336',
                              border: 'none',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: darkMode ? '#b0b0b0' : '#666',
                    border: `1px dashed ${darkMode ? '#444' : '#ddd'}`,
                    borderRadius: '8px',
                    margin: '20px 0',
                  }}>
                    <p style={{ marginBottom: '15px' }}>You haven't added any payment methods yet.</p>
                  </div>
                )}
                
                <button
                  onClick={handleAddPaymentMethod}
                  style={{
                    backgroundColor: 'transparent',
                    color: darkMode ? '#90caf9' : '#2196F3',
                    border: `1px solid ${darkMode ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.3)'}`,
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '20px',
                  }}
                >
                  <FaCreditCard style={{ marginRight: '8px' }} />
                  Add Payment Method
                </button>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div>
                <h2 style={{ 
                  color: darkMode ? '#e0e0e0' : '#333',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}>
                  Payment History
                </h2>
                
                {paymentHistory.length > 0 ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '15px',
                      fontWeight: 'bold',
                      color: darkMode ? '#b0b0b0' : '#666',
                      padding: '0 15px 10px 15px',
                      borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                      fontSize: '14px',
                    }}>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                    </div>
                    
                    {paymentHistory.map(payment => (
                      <div 
                        key={payment.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '15px',
                          padding: '15px',
                          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                        }}
                      >
                        <div style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        <div style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                          ${payment.amount.toFixed(2)}
                        </div>
                        <div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            backgroundColor: payment.status === 'paid' 
                              ? (darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
                              : (darkMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)'),
                            color: payment.status === 'paid' ? '#4CAF50' : '#FFC107',
                          }}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: darkMode ? '#b0b0b0' : '#666',
                    border: `1px dashed ${darkMode ? '#444' : '#ddd'}`,
                    borderRadius: '8px',
                  }}>
                    <p>No payment history yet.</p>
                  </div>
                )}
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
import { useState } from 'react';
import storage from '../../lib/storage';

const EmailCampaignModal = ({ campaignType, targetUsers, darkMode, onClose, onSuccess }) => {
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    template: 'default',
    schedule: 'immediate',
    scheduledDate: '',
    includePromoCode: false,
    promoCode: '',
    promoDiscount: 20
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Email templates based on campaign type
  const getEmailTemplates = () => {
    switch (campaignType) {
      case 'inactive_users':
        return {
          default: {
            name: 'Re-engagement Campaign',
            subject: 'We miss you! Come back to improve your trading psychology',
            preview: 'A personalized message encouraging users to return and continue their trading psychology journey with us.'
          },
          discount: {
            name: 'Win-Back with Discount',
            subject: 'Special offer: 20% off to welcome you back!',
            preview: 'Offer a discount to inactive users to encourage them to return and upgrade their subscription.'
          },
          educational: {
            name: 'Educational Content',
            subject: 'New trading psychology insights waiting for you',
            preview: 'Send valuable educational content to re-engage users without being too sales-focused.'
          }
        };
      case 'revenue_growth':
        return {
          default: {
            name: 'Premium Features Promotion',
            subject: 'Unlock advanced trading psychology features',
            preview: 'Promote premium features to capitalize on positive revenue trends.'
          }
        };
      case 'new_feature':
        return {
          default: {
            name: 'Feature Announcement',
            subject: 'Exciting new feature just for you!',
            preview: 'Announce new features to engage active users.'
          }
        };
      default:
        return {
          default: {
            name: 'General Campaign',
            subject: 'Update from ChartSense',
            preview: 'A general purpose email campaign.'
          }
        };
    }
  };

  const templates = getEmailTemplates();

  const handleInputChange = (field, value) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateChange = (templateKey) => {
    const template = templates[templateKey];
    setCampaignData(prev => ({
      ...prev,
      template: templateKey,
      name: template.name,
      subject: template.subject
    }));
  };

  const handleCreateCampaign = async () => {
    if (!campaignData.name.trim() || !campaignData.subject.trim()) {
      setError('Campaign name and subject are required');
      return;
    }

    if (campaignData.schedule === 'scheduled' && !campaignData.scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = storage.getItem('auth_token');
      const response = await fetch('/api/admin/email-campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...campaignData,
          campaignType,
          targetUsers: targetUsers.map(user => user._id),
          targetCount: targetUsers.length
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const result = await response.json();
      onSuccess(result);
      
    } catch (err) {
      setError(err.message || 'An error occurred while creating the campaign');
    } finally {
      setLoading(false);
    }
  };

  const generatePromoCode = () => {
    const code = 'COMEBACK' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setCampaignData(prev => ({
      ...prev,
      promoCode: code
    }));
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '75vh',
        overflow: 'hidden',
        boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333', margin: 0 }}>
            📧 Create Email Campaign
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: darkMode ? '#e0e0e0' : '#333',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {/* Campaign Info */}
          <div style={{
            padding: '16px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: darkMode ? '#e0e0e0' : '#333', marginBottom: '10px' }}>Campaign Details</h4>
            <p style={{ color: darkMode ? '#b0b0b0' : '#666', margin: 0 }}>
              Target: <strong>{targetUsers.length}</strong> users
              {campaignType === 'inactive_users' && ' (inactive users)'}
            </p>
          </div>

          {/* Template Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>
              Email Template
            </label>
            <div style={{ display: 'grid', gap: '10px' }}>
              {Object.entries(templates).map(([key, template]) => (
                <div
                  key={key}
                  onClick={() => handleTemplateChange(key)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${campaignData.template === key ? '#2196F3' : (darkMode ? '#444' : '#ddd')}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: campaignData.template === key ? (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 'transparent'
                  }}
                >
                  <div style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500', marginBottom: '4px' }}>
                    {template.name}
                  </div>
                  <div style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
                    {template.preview}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>
              Campaign Name *
            </label>
            <input
              type="text"
              value={campaignData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter campaign name"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Email Subject */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>
              Email Subject *
            </label>
            <input
              type="text"
              value={campaignData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Enter email subject"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Promo Code Option */}
          {campaignType === 'inactive_users' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={campaignData.includePromoCode}
                  onChange={(e) => handleInputChange('includePromoCode', e.target.checked)}
                />
                <span style={{ color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>
                  Include Promo Code
                </span>
              </label>
              
              {campaignData.includePromoCode && (
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={campaignData.promoCode}
                      onChange={(e) => handleInputChange('promoCode', e.target.value)}
                      placeholder="Promo code"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                        backgroundColor: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#e0e0e0' : '#333',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      onClick={generatePromoCode}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Generate
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>
                      Discount:
                    </span>
                    <input
                      type="number"
                      value={campaignData.promoDiscount}
                      onChange={(e) => handleInputChange('promoDiscount', parseInt(e.target.value))}
                      min="5"
                      max="50"
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                        backgroundColor: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#e0e0e0' : '#333',
                        fontSize: '14px'
                      }}
                    />
                    <span style={{ color: darkMode ? '#b0b0b0' : '#666', fontSize: '14px' }}>%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule Options */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: darkMode ? '#e0e0e0' : '#333', fontWeight: '500' }}>
              Schedule
            </label>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="schedule"
                  value="immediate"
                  checked={campaignData.schedule === 'immediate'}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                />
                <span style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Send immediately (as draft)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="schedule"
                  value="scheduled"
                  checked={campaignData.schedule === 'scheduled'}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                />
                <span style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Schedule for later</span>
              </label>
            </div>
            
            {campaignData.schedule === 'scheduled' && (
              <input
                type="datetime-local"
                value={campaignData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '14px'
                }}
              />
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
              color: '#f44336',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: darkMode ? '#333' : '#e0e0e0',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCampaignModal;
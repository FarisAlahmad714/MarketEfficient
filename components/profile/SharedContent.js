// components/profile/SharedContent.js
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaShare, FaArrowUp, FaArrowDown, FaTrophy, FaCertificate, FaChartLine } from 'react-icons/fa';

const SharedContent = ({ username, isOwnProfile = false }) => {
  const { darkMode } = useContext(ThemeContext);
  const [sharedContent, setSharedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (username) {
      fetchSharedContent();
    }
  }, [username]);

  const fetchSharedContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/shared-content?username=${username}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        setSharedContent(data.content);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'test_result': return FaChartLine;
      case 'trading_highlight': return FaArrowUp;
      case 'achievement': return FaTrophy;
      case 'badge': return FaCertificate;
      default: return FaShare;
    }
  };

  const renderTradingCard = (item) => {
    const trade = item.data;
    const isProfit = trade.return >= 0;
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        {/* Trade Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: isProfit ? '#4CAF50' : '#F44336',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {isProfit ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
              {trade.symbol} {trade.side.toUpperCase()}
            </div>
            {trade.leverage > 1 && (
              <div style={{
                backgroundColor: '#FF9800',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {trade.leverage}x
              </div>
            )}
          </div>
          
          <div style={{
            backgroundColor: isProfit ? '#4CAF50' : '#F44336',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            {formatPercentage(trade.return)}
          </div>
        </div>

        {/* Trade Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>Entry</div>
            <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
              ${trade.entryPrice?.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>Exit</div>
            <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
              ${trade.exitPrice?.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>Duration</div>
            <div style={{ fontWeight: '600', color: darkMode ? '#e0e0e0' : '#333' }}>
              {trade.duration}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: darkMode ? '#888' : '#666' }}>P&L</div>
            <div style={{ 
              fontWeight: '600', 
              color: isProfit ? '#4CAF50' : '#F44336'
            }}>
              ${trade.pnl?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Entry Reasoning */}
        {trade.entryReason && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#2196F3',
              marginBottom: '6px'
            }}>
              📝 Entry Reasoning
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#e0e0e0' : '#333',
              lineHeight: '1.4'
            }}>
              {trade.entryReason}
            </div>
          </div>
        )}

        {/* Additional Analysis */}
        {(trade.technicalAnalysis || trade.riskManagement || trade.biasCheck) && (
          <details style={{ marginTop: '12px' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2196F3',
              marginBottom: '8px'
            }}>
              📊 Detailed Analysis
            </summary>
            <div style={{
              backgroundColor: darkMode ? '#262626' : '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              color: darkMode ? '#b0b0b0' : '#555'
            }}>
              {trade.technicalAnalysis && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Technical Analysis:</strong> {trade.technicalAnalysis}
                </div>
              )}
              {trade.riskManagement && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Risk Management:</strong> {trade.riskManagement}
                </div>
              )}
              {trade.biasCheck && (
                <div>
                  <strong>Bias Check:</strong> {trade.biasCheck}
                </div>
              )}
            </div>
          </details>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          fontSize: '12px',
          color: darkMode ? '#888' : '#666'
        }}>
          <div>
            Confidence: {trade.confidenceLevel || 'N/A'}/10
          </div>
          <div>
            {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  const renderBiasTestCard = (item) => {
    const test = item.data;
    
    return (
      <div key={item.shareId} style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        {/* Test Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: '#2196F3',
              borderRadius: '8px',
              padding: '8px',
              color: 'white'
            }}>
              <FaChartLine size={16} />
            </div>
            <div>
              <div style={{
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '16px'
              }}>
                {test.assetName} Bias Test
              </div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#888' : '#666'
              }}>
                {test.timeframe} • {test.questionsCount} questions
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: test.percentage >= 80 ? '#4CAF50' : test.percentage >= 60 ? '#FF9800' : '#F44336',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            {test.percentage}%
          </div>
        </div>

        {/* Score Details */}
        <div style={{
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
              Score: {test.score}/{test.totalPoints}
            </span>
            <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
              Correct: {test.correctAnswers}/{test.questionsCount}
            </span>
          </div>
        </div>

        {/* User Reasoning */}
        {test.userReasoning && test.userReasoning.length > 0 && (
          <div style={{
            backgroundColor: darkMode ? '#262626' : '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#4CAF50',
              marginBottom: '8px'
            }}>
              💭 Your Reasoning
            </div>
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#e0e0e0' : '#333',
              lineHeight: '1.4'
            }}>
              {test.userReasoning.join(' • ')}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {test.aiAnalysis && test.aiAnalysis.length > 0 && (
          <details style={{ marginTop: '12px' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2196F3',
              marginBottom: '8px'
            }}>
              🤖 AI Analysis
            </summary>
            <div style={{
              backgroundColor: darkMode ? '#0a1929' : '#f0f7ff',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              color: darkMode ? '#b0b0b0' : '#555',
              lineHeight: '1.4',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {test.aiAnalysis.join('\n\n')}
            </div>
          </details>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          fontSize: '12px',
          color: darkMode ? '#888' : '#666'
        }}>
          <div>
            Performance: {test.percentage >= 80 ? 'Excellent' : test.percentage >= 60 ? 'Good' : 'Needs Improvement'}
          </div>
          <div>
            {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  const renderSharedItem = (item) => {
    if (item.type === 'trading_highlight') {
      return renderTradingCard(item);
    } else if (item.type === 'test_result') {
      return renderBiasTestCard(item);
    }
    
    // Fallback for other types
    const Icon = getContentIcon(item.type);
    
    return (
      <div
        key={item.shareId}
        style={{
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onClick={() => {
          // Open the shared content link
          window.open(`${window.location.origin}/share/${item.shareId}`, '_blank');
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            backgroundColor: '#2196F3',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={16} color="white" />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#333',
              marginBottom: '4px'
            }}>
              {getContentTitle(item)}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              {formatDate(item.createdAt)}
            </div>
          </div>

          {getContentMetric(item)}
        </div>

        <div style={{
          fontSize: '14px',
          color: darkMode ? '#b0b0b0' : '#555',
          lineHeight: '1.4'
        }}>
          {getContentDescription(item)}
        </div>
      </div>
    );
  };

  const getContentTitle = (item) => {
    switch (item.type) {
      case 'test_result':
        return `${item.data.testType} Result`;
      case 'trading_highlight':
        return `${item.data.symbol} ${item.data.side.toUpperCase()} Trade`;
      case 'achievement':
        return item.data.title;
      case 'badge':
        return item.data.title;
      default:
        return 'Shared Content';
    }
  };

  const getContentDescription = (item) => {
    switch (item.type) {
      case 'test_result':
        return `Scored ${item.data.percentage}% (${item.data.score}/${item.data.totalPoints}) on ${item.data.assetName} bias test`;
      case 'trading_highlight':
        const returnText = formatPercentage(item.data.return);
        return `${item.data.leverage > 1 ? `${item.data.leverage}x leveraged ` : ''}trade with ${returnText} return over ${item.data.duration}`;
      case 'achievement':
        return item.data.description;
      case 'badge':
        return item.data.description;
      default:
        return 'View shared content';
    }
  };

  const getContentMetric = (item) => {
    switch (item.type) {
      case 'test_result':
        return (
          <div style={{
            backgroundColor: item.data.percentage >= 80 ? '#4CAF50' : '#2196F3',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {item.data.percentage}%
          </div>
        );
      case 'trading_highlight':
        const isProfit = item.data.return >= 0;
        return (
          <div style={{
            backgroundColor: isProfit ? '#4CAF50' : '#F44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isProfit ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
            {formatPercentage(item.data.return)}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        textAlign: 'center'
      }}>
        <div style={{
          color: darkMode ? '#888' : '#666',
          fontSize: '14px'
        }}>
          Loading shared content...
        </div>
      </div>
    );
  }

  if (!sharedContent || sharedContent.all.length === 0) {
    return (
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        textAlign: 'center'
      }}>
        <FaShare size={24} style={{ color: darkMode ? '#555' : '#999', marginBottom: '12px' }} />
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          margin: '0 0 8px 0',
          fontSize: '16px'
        }}>
          No Shared Content
        </h3>
        <p style={{
          color: darkMode ? '#888' : '#666',
          fontSize: '14px',
          margin: 0
        }}>
          {isOwnProfile 
            ? "Start sharing your achievements and trading results!"
            : `${username} hasn't shared any content yet.`
          }
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'All', count: sharedContent.all.length },
    { id: 'trading_highlight', label: 'Trades', count: sharedContent.trading_highlight.length },
    { id: 'test_result', label: 'Test Results', count: sharedContent.test_result.length },
    { id: 'achievement', label: 'Achievements', count: sharedContent.achievement.length },
  ].filter(tab => tab.count > 0);

  const displayContent = activeTab === 'all' ? sharedContent.all : sharedContent[activeTab];

  return (
    <div style={{
      backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <FaShare size={20} style={{ color: '#2196F3' }} />
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          margin: 0,
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Shared Content
        </h3>
        <button
          onClick={fetchSharedContent}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id 
                  ? '#2196F3' 
                  : (darkMode ? '#333' : '#f5f5f5'),
                color: activeTab === tab.id 
                  ? 'white' 
                  : (darkMode ? '#e0e0e0' : '#333'),
                border: 'none',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* Content List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {displayContent.map(item => renderSharedItem(item))}
      </div>
    </div>
  );
};

export default SharedContent;
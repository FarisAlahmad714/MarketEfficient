// components/profile/TestResultsCards.js
import React, { useState, useEffect } from 'react';
import { FaShare, FaCalendarAlt, FaChartLine, FaTrophy } from 'react-icons/fa';

const TestResultsCards = ({ 
  testResults = [], 
  darkMode = false, 
  isOwnProfile = false,
  onShareResult = null 
}) => {
  const [filter, setFilter] = useState('all');


  if (testResults.length === 0) {
    return (
      <div style={{
        backgroundColor: darkMode ? '#1e1e1e' : 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
        <h3 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginBottom: '10px'
        }}>
          No Test Results
        </h3>
        <p style={{
          color: darkMode ? '#b0b0b0' : '#666',
          margin: 0
        }}>
          {isOwnProfile 
            ? "Take some tests to see your results here!"
            : "This user hasn't shared any test results."
          }
        </p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#8BC34A'; // Light Green
    if (score >= 40) return '#FFC107'; // Amber
    if (score >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getTestTypeIcon = (type) => {
    const icons = {
      'Bias Test': '🧠',
      'Chart Exam': '📈',
      'Swing Analysis': '📊',
      'Fibonacci Retracement': '🌀',
      'Fair Value Gaps': '📉'
    };
    return icons[type] || '📋';
  };

  const getTestTypeColor = (type) => {
    const colors = {
      'Bias Test': '#9C27B0',
      'Chart Exam': '#2196F3',
      'Swing Analysis': '#FF9800',
      'Fibonacci Retracement': '#4CAF50',
      'Fair Value Gaps': '#F44336'
    };
    return colors[type] || '#666';
  };

  // Get unique test types for filter
  const testTypes = ['all', ...new Set(testResults.map(test => test.type))];

  // Filter results
  const filteredResults = filter === 'all' 
    ? testResults 
    : testResults.filter(test => test.type === filter);

  const handleShare = (result, e) => {
    e.stopPropagation();
    
    if (onShareResult) {
      onShareResult({
        ...result,
        type: 'test_result',
        testType: result.type,
        completedAt: result.completedAt || new Date().toISOString()
      });
    }
  };

  return (
    <div style={{
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '30px',
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          marginTop: 0,
          marginBottom: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaChartLine style={{ color: '#2196F3' }} />
          Recent Test Results
        </h2>
        
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {testTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                backgroundColor: filter === type ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                color: filter === type ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                border: 'none',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredResults.slice(0, 6).map((result, index) => (
          <div
            key={index}
            style={{
              backgroundColor: darkMode ? '#262626' : '#f9f9f9',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${getTestTypeColor(result.type)}33`,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = darkMode 
                ? '0 8px 20px rgba(0,0,0,0.4)' 
                : '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Test Type Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>
                  {getTestTypeIcon(result.type)}
                </span>
                <h4 style={{
                  margin: 0,
                  color: darkMode ? '#e0e0e0' : '#333',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {result.type}
                </h4>
              </div>
              
              {isOwnProfile && onShareResult && (
                <button
                  onClick={(e) => handleShare(result, e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: darkMode ? '#888' : '#666',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Share result"
                >
                  <FaShare size={12} />
                </button>
              )}
            </div>

            {/* Score Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: getScoreColor(result.percentage)
                }}>
                  {result.percentage}%
                </div>
                
                <div>
                  <div style={{
                    color: darkMode ? '#b0b0b0' : '#666',
                    fontSize: '12px'
                  }}>
                    Score
                  </div>
                  <div style={{
                    color: darkMode ? '#e0e0e0' : '#333',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {result.score}/{result.totalPoints}
                  </div>
                </div>
              </div>

              {/* Performance Badge */}
              {result.percentage >= 90 && (
                <div style={{
                  backgroundColor: '#FFD700',
                  color: '#333',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FaTrophy size={10} />
                  PERFECT
                </div>
              )}
              {result.percentage >= 80 && result.percentage < 90 && (
                <div style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  EXCELLENT
                </div>
              )}
              {result.percentage >= 70 && result.percentage < 80 && (
                <div style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  GOOD
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: darkMode ? '#333' : '#f0f0f0',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '15px'
            }}>
              <div style={{
                height: '100%',
                width: `${result.percentage}%`,
                backgroundColor: getScoreColor(result.percentage),
                borderRadius: '3px',
                transition: 'width 0.5s ease'
              }} />
            </div>

            {/* Test Details */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '12px'
              }}>
                <FaCalendarAlt size={10} />
                {new Date(result.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              
              {result.asset && (
                <div style={{
                  backgroundColor: getTestTypeColor(result.type) + '20',
                  color: getTestTypeColor(result.type),
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {result.asset.toUpperCase()}
                </div>
              )}
            </div>

            {/* Subtype if available */}
            {result.subType && (
              <div style={{
                marginTop: '10px',
                color: darkMode ? '#888' : '#666',
                fontSize: '11px',
                fontStyle: 'italic'
              }}>
                {result.subType}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more results indicator */}
      {filteredResults.length > 6 && (
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`
        }}>
          <div style={{
            color: darkMode ? '#888' : '#666',
            fontSize: '14px'
          }}>
            Showing 6 of {filteredResults.length} results
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {testResults.length > 0 && (
        <div style={{
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#2196F3',
              marginBottom: '5px'
            }}>
              {testResults.length}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Total Tests
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: getScoreColor(
                Math.round(testResults.reduce((sum, test) => sum + test.percentage, 0) / testResults.length)
              ),
              marginBottom: '5px'
            }}>
              {Math.round(testResults.reduce((sum, test) => sum + test.percentage, 0) / testResults.length)}%
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Average Score
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#4CAF50',
              marginBottom: '5px'
            }}>
              {testResults.filter(test => test.percentage >= 80).length}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Excellent (80%+)
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#FFD700',
              marginBottom: '5px'
            }}>
              {testResults.filter(test => test.percentage === 100).length}
            </div>
            <div style={{
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '12px'
            }}>
              Perfect Scores
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultsCards;
// components/Leaderboard.js
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { Trophy, Award, Medal, User, Calendar, Activity } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testType, setTestType] = useState('all');
  const [period, setPeriod] = useState('month');
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  
  const { darkMode } = useContext(ThemeContext);
  const { isAuthenticated, user } = useContext(AuthContext);
  
  // Test type options
  const testTypes = [
    { id: 'all', name: 'All Tests' },
    { id: 'bias-test', name: 'Bias Test' },
    { id: 'swing-analysis', name: 'Swing Analysis' },
    { id: 'fibonacci-retracement', name: 'Fibonacci Retracement' },
    { id: 'fair-value-gaps', name: 'Fair Value Gaps' }
  ];
  
  // Time period options
  const periods = [
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'year', name: 'This Year' },
    { id: 'all', name: 'All Time' }
  ];
  
  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token if user is authenticated
        const headers = {};
        if (isAuthenticated) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        }
        
        const response = await fetch(`/api/leaderboard?testType=${testType}&period=${period}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        setLeaderboardData(data.leaderboard);
        setTotalParticipants(data.totalParticipants || 0);
        setCurrentUserRank(data.currentUserRank);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Unable to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [testType, period, isAuthenticated]);
  
  // Get the appropriate icon based on rank
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} color="#FFD700" />; // Gold
      case 2:
        return <Medal size={20} color="#C0C0C0" />; // Silver
      case 3:
        return <Medal size={20} color="#CD7F32" />; // Bronze
      default:
        return <Award size={20} color="#2196F3" />;
    }
  };
  
  // Handle changing test type
  const handleTestTypeChange = (type) => {
    setTestType(type);
  };
  
  // Handle changing time period
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check if current user is in the leaderboard
  const isCurrentUser = (userId) => {
    return isAuthenticated && user && user.id === userId;
  };
  
  return (
    <div style={{
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '8px',
      padding: '25px',
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{
          color: darkMode ? '#e0e0e0' : '#333',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Trophy 
            size={24} 
            color={darkMode ? '#FFD700' : '#FFD700'} 
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}
          />
          Leaderboard
        </h2>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Filter by test type */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {testTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleTestTypeChange(type.id)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: testType === type.id ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                  color: testType === type.id ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: testType === type.id ? '500' : 'normal',
                  whiteSpace: 'nowrap'
                }}
              >
                {type.name}
              </button>
            ))}
          </div>
          
          {/* Filter by time period */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {periods.map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: period === p.id ? '#2196F3' : (darkMode ? '#333' : '#f5f5f5'),
                  color: period === p.id ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: period === p.id ? '500' : 'normal'
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* User's rank (if authenticated) */}
      {isAuthenticated && currentUserRank && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
          color: darkMode ? '#90CAF9' : '#1976D2',
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <User size={18} />
          <span>
            Your rank: <strong>#{currentUserRank}</strong> of {totalParticipants} participants
            {testType !== 'all' && ` in ${testTypes.find(t => t.id === testType)?.name || testType}`}
            {period !== 'all' && ` for ${periods.find(p => p.id === period)?.name.toLowerCase()}`}
          </span>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '40px 0'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${darkMode ? '#333' : '#f3f3f3'}`,
            borderTop: '4px solid #2196F3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{
          padding: '15px',
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
          color: '#f44336',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      ) : (
        <>
          {/* Leaderboard table */}
          {leaderboardData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: darkMode ? '#e0e0e0' : '#333'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`
                  }}>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '60px' }}>Rank</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left' }}>User</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '100px' }}>Score</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '120px' }}>Tests Taken</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', width: '150px' }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((entry) => (
                    <tr 
                      key={entry.rank}
                      style={{
                        borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                        backgroundColor: isCurrentUser(entry.userId) 
                          ? (darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)') 
                          : 'transparent'
                      }}
                    >
                      <td style={{ 
                        padding: '12px 10px', 
                        textAlign: 'center',
                        fontWeight: entry.rank <= 3 ? '600' : 'normal',
                        color: entry.rank === 1 
                          ? '#FFD700' 
                          : entry.rank === 2 
                            ? '#C0C0C0' 
                            : entry.rank === 3 
                              ? '#CD7F32' 
                              : (darkMode ? '#e0e0e0' : '#333')
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}>
                          {getRankIcon(entry.rank)}
                          {entry.rank}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '12px 10px',
                        fontWeight: isCurrentUser(entry.userId) ? '600' : 'normal'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: generateUserColor(entry.name),
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}>
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{entry.name}</div>
                            {entry.email && (
                              <div style={{ 
                                fontSize: '0.8rem', 
                                color: darkMode ? '#b0b0b0' : '#666',
                                marginTop: '2px'
                              }}>
                                {entry.email}
                              </div>
                            )}
                          </div>
                          {isCurrentUser(entry.userId) && (
                            <span style={{
                              fontSize: '0.75rem',
                              backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                              color: '#2196F3',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              marginLeft: '5px'
                            }}>
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '12px 10px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: getScoreColor(entry.score, darkMode)
                      }}>
                        {entry.score}%
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}>
                          <Activity size={16} color={darkMode ? '#b0b0b0' : '#666'} />
                          {entry.testsTaken}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '12px 10px', 
                        textAlign: 'center',
                        color: darkMode ? '#b0b0b0' : '#666'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}>
                          <Calendar size={16} color={darkMode ? '#b0b0b0' : '#666'} />
                          {formatDate(entry.lastActive)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              color: darkMode ? '#b0b0b0' : '#666'
            }}>
              No leaderboard data available for the selected criteria.
            </div>
          )}
          
          {/* Leaderboard footer with total participants */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: darkMode ? '#262626' : '#f5f5f5',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '0.9rem'
          }}>
            <div>
              <strong>{totalParticipants}</strong> {totalParticipants === 1 ? 'participant' : 'participants'} in total
            </div>
            <div>
              Showing top {leaderboardData.length} users
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Generate a consistent color based on username
const generateUserColor = (name) => {
  const colors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#607D8B', 
    '#00BCD4', '#FFC107', '#795548', '#3F51B5', '#E91E63'
  ];
  
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to pick a color
  return colors[Math.abs(hash) % colors.length];
};

// Get color based on score
const getScoreColor = (score, isDarkMode) => {
  if (score >= 90) return '#4CAF50'; // Green
  if (score >= 75) return '#8BC34A'; // Light Green
  if (score >= 60) return '#FFC107'; // Amber
  if (score >= 40) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

export default Leaderboard;
// pages/admin/cleanup.js
import React, { useState, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import storage from '../../lib/storage';

const CleanupPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !user.isAdmin) {
      router.push('/');
    }
  }, [user, router]);

  const runCleanup = async (action) => {
    if (!confirm(`Are you sure you want to run: ${action}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = await storage.getItem('auth_token');
      
      const response = await fetch('/api/admin/cleanup-old-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          cutoffDate: '2025-07-03T08:06:00.000Z' // July 3, 2025, 08:06 AM
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
      } else {
        setError(data.error || 'Cleanup failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0a0a0a' : '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
          Access Denied - Admin Only
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Cleanup - ChartSense</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0a0a0a' : '#f5f5f5',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            color: darkMode ? '#e0e0e0' : '#333',
            marginBottom: '20px'
          }}>
            🧹 Post Cleanup Tool
          </h1>
          
          <p style={{
            color: darkMode ? '#b0b0b0' : '#666',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Clean up old shared content posts that don't have proper delete buttons.
            <br />
            <strong>Cutoff Date:</strong> July 3, 2025, 08:06 AM
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gap: '16px',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => runCleanup('delete_old')}
              disabled={loading}
              style={{
                padding: '16px 24px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              🗑️ Delete All Posts Before Cutoff Date
            </button>
            
            <button
              onClick={() => runCleanup('fix_userids')}
              disabled={loading}
              style={{
                padding: '16px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              🔧 Fix Missing User IDs (Keep Posts)
            </button>
            
            <button
              onClick={() => runCleanup('both')}
              disabled={loading}
              style={{
                padding: '16px 24px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              ⚡ Both: Fix User IDs Then Delete Old Posts
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              padding: '20px',
              backgroundColor: darkMode ? '#262626' : '#f9f9f9',
              borderRadius: '8px',
              textAlign: 'center',
              color: darkMode ? '#e0e0e0' : '#333'
            }}>
              🔄 Processing cleanup...
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              padding: '20px',
              backgroundColor: '#ffebee',
              color: '#f44336',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              ❌ Error: {error}
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div style={{
              padding: '20px',
              backgroundColor: darkMode ? '#262626' : '#f9f9f9',
              borderRadius: '8px',
              color: darkMode ? '#e0e0e0' : '#333'
            }}>
              <h3 style={{ marginTop: 0, color: '#4CAF50' }}>✅ Cleanup Results</h3>
              
              {results.deleted && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>🗑️ Deleted:</h4>
                  <ul>
                    <li>Posts: {results.deleted.posts}</li>
                    <li>Comments: {results.deleted.comments}</li>
                    <li>Likes: {results.deleted.likes}</li>
                    <li>Notifications: {results.deleted.notifications}</li>
                  </ul>
                </div>
              )}
              
              {results.fixed && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>🔧 Fixed:</h4>
                  <ul>
                    <li>Posts Fixed: {results.fixed.postsFixed}</li>
                    <li>Users Not Found: {results.fixed.usersNotFound}</li>
                  </ul>
                </div>
              )}
              
              {results.summary && (
                <div>
                  <h4>📊 Summary:</h4>
                  <ul>
                    <li>Remaining Posts: {results.summary.remainingPosts}</li>
                    <li>Posts Without User ID: {results.summary.postsWithoutUserId}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{
            marginTop: '30px',
            padding: '16px',
            backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0',
            borderRadius: '8px',
            fontSize: '14px',
            color: darkMode ? '#888' : '#666'
          }}>
            <strong>⚠️ Warning:</strong> These actions are irreversible. Make sure you have a database backup before proceeding.
          </div>
        </div>
      </div>
    </>
  );
};

export default CleanupPage;
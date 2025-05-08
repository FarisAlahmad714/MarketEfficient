import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import Link from 'next/link';

const AdminPanel = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    // Check if user is admin, redirect if not
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (isAuthenticated && !user?.isAdmin) {
      router.push('/');
      return;
    }
    
    // Fetch users
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/admin/users?page=${page}&search=${search}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [isAuthenticated, user, router, page, search]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ 
        color: darkMode ? '#e0e0e0' : '#333',
        marginBottom: '30px'
      }}>
        Admin Panel
      </h1>
      
      {/* Search bar */}
      <div style={{ 
        marginBottom: '30px', 
        display: 'flex', 
        gap: '10px'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            style={{
              flex: 1,
              padding: '10px 15px',
              borderRadius: '4px',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#e0e0e0' : '#333'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: `4px solid ${darkMode ? '#333' : '#f3f3f3'}`,
            borderTop: '4px solid #2196F3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
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
          padding: '20px',
          backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
          color: '#f44336',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      ) : (
        <>
          {/* Users table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                  borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`
                }}>
                  <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Name</th>
                  <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#e0e0e0' : '#333' }}>Email</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Verified</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Admin</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Joined</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#e0e0e0' : '#333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: darkMode ? '#b0b0b0' : '#666' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id} style={{
                      borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`
                    }}>
                      <td style={{ padding: '15px', color: darkMode ? '#e0e0e0' : '#333' }}>{user.name}</td>
                      <td style={{ padding: '15px', color: darkMode ? '#e0e0e0' : '#333' }}>{user.email}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: user.isVerified ? '#4CAF50' : '#F44336'
                        }}></span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: user.isAdmin ? '#4CAF50' : '#F44336'
                        }}></span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#b0b0b0' : '#666' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          style={{
                            padding: '5px 10px',
                            backgroundColor: darkMode ? '#333' : '#f5f5f5',
                            color: darkMode ? '#e0e0e0' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}
                          onClick={() => {/* Implement view user details */}}
                        >
                          View
                        </button>
                        {/* Additional action buttons could go here */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '10px',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 15px',
                  backgroundColor: page === 1 ? (darkMode ? '#333' : '#e0e0e0') : (darkMode ? '#2a2a2a' : '#f5f5f5'),
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'default' : 'pointer',
                  opacity: page === 1 ? 0.7 : 1
                }}
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {[...Array(totalPages).keys()].map(i => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: page === i + 1 ? '#2196F3' : (darkMode ? '#2a2a2a' : '#f5f5f5'),
                    color: page === i + 1 ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === i + 1 ? 'default' : 'pointer'
                  }}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 15px',
                  backgroundColor: page === totalPages ? (darkMode ? '#333' : '#e0e0e0') : (darkMode ? '#2a2a2a' : '#f5f5f5'),
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  opacity: page === totalPages ? 0.7 : 1
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
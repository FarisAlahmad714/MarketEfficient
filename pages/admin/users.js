// pages/admin/users.js (Frontend page, not API route)
import { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import AdminProtectedRoute from '../../components/auth/AdminProtectedRoute';
import Link from 'next/link';
import CryptoLoader from '../../components/CryptoLoader';

const UsersManagement = () => {
  const { darkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [userToCancel, setUserToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const cryptoLoaderRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `/api/admin/users?page=${page}&search=${search}&includePromoUsage=true`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);

        setTimeout(() => {
          if (cryptoLoaderRef.current) {
            cryptoLoaderRef.current.hideLoader();
          }
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }, 1000);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/users?userId=${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter((u) => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setDeleteError(err.message || 'An error occurred while deleting the user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelSubscription = (userId) => {
    const user = users.find((u) => u._id === userId);
    if (user) {
      setUserToCancel(user);
      setShowCancelModal(true);
      setCancelError(null);
    }
  };

  const confirmCancelSubscription = async () => {
    if (!userToCancel) return;

    setCancelLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: userToCancel._id })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setUsers(
        users.map((u) =>
          u._id === userToCancel._id
            ? {
                ...u,
                subscription: { ...u.subscription, status: 'cancelled' }
              }
            : u
        )
      );

      setShowCancelModal(false);
      setUserToCancel(null);
    } catch (err) {
      setCancelError(err.message || 'An error occurred while canceling the subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h1 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>User Management</h1>
        <Link
          href="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: darkMode ? '#90caf9' : '#2196F3',
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}
        >
          <i className="fas fa-chevron-left" style={{ marginRight: '5px' }}></i>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
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
          <CryptoLoader ref={cryptoLoaderRef} />
        </div>
      ) : error ? (
        <div
          style={{
            padding: '20px',
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
            color: '#f44336',
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: darkMode ? '#1e1e1e' : 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: darkMode
                  ? '0 4px 12px rgba(0,0,0,0.3)'
                  : '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                    borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`
                  }}
                >
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'center',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Verified
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'center',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Admin
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'center',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Joined
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Subscription Plan
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'right',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Promo Code
                  </th>
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'center',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: darkMode ? '#b0b0b0' : '#666'
                      }}
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      style={{
                        borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`
                      }}
                    >
                      <td
                        style={{
                          padding: '15px',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                      >
                        {user.name}
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                      >
                        {user.email}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: user.isVerified ? '#4CAF50' : '#F44336'
                          }}
                        ></span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: user.isAdmin ? '#4CAF50' : '#F44336'
                          }}
                        ></span>
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          textAlign: 'center',
                          color: darkMode ? '#b0b0b0' : '#666'
                        }}
                      >
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                      >
                        {user.subscription?.plan || 'N/A'}
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                      >
                        {user.subscription?.status || 'N/A'}
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          textAlign: 'right',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                      >
                        {user.subscription?.amount
                          ? `$${(user.subscription.amount / 100).toFixed(2)}`
                          : 'N/A'}
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          color: darkMode ? '#e0e0e0' : '#333'
                        }}
                      >
                        {user.subscription?.promoCodeUsed?.code || 'N/A'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <button
                            style={{
                              padding: '5px 10px',
                              backgroundColor: darkMode ? '#333' : '#f5f5f5',
                              color: darkMode ? '#e0e0e0' : '#333',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              /* Implement view user details */
                            }}
                          >
                            View
                          </button>
                          {user.subscription?.status === 'active' && (
                            <button
                              style={{
                                padding: '5px 10px',
                                backgroundColor: darkMode ? '#3A1A1A' : '#ffebee',
                                color: '#F44336',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleCancelSubscription(user._id)}
                            >
                              Cancel Subscription
                            </button>
                          )}
                          {!user.isAdmin && (
                            <button
                              style={{
                                padding: '5px 10px',
                                backgroundColor: darkMode ? '#3A1A1A' : '#ffebee',
                                color: '#F44336',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                              }}
                              onClick={() => handleDeleteClick(user)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '30px'
              }}
            >
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 15px',
                  backgroundColor: page === 1
                    ? darkMode
                      ? '#333'
                      : '#e0e0e0'
                    : darkMode
                    ? '#2a2a2a'
                    : '#f5f5f5',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'default' : 'pointer',
                  opacity: page === 1 ? 0.7 : 1
                }}
              >
                Previous
              </button>
              {[...Array(totalPages).keys()].map((i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor:
                      page === i + 1 ? '#2196F3' : darkMode ? '#2a2a2a' : '#f5f5f5',
                    color:
                      page === i + 1 ? 'white' : darkMode ? '#e0e0e0' : '#333',
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
                  backgroundColor: page === totalPages
                    ? darkMode
                      ? '#333'
                      : '#e0e0e0'
                    : darkMode
                    ? '#2a2a2a'
                    : '#f5f5f5',
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

      {showDeleteModal && userToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: darkMode
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <h3
              style={{
                color: darkMode ? '#e0e0e0' : '#333',
                marginTop: 0,
                marginBottom: '20px'
              }}
            >
              Confirm User Deletion
            </h3>
            <p
              style={{
                color: darkMode ? '#b0b0b0' : '#666',
                marginBottom: '20px'
              }}
            >
              Are you sure you want to delete the user{' '}
              <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                {userToDelete.name}
              </strong>{' '}
              with email{' '}
              <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                {userToDelete.email}
              </strong>
              ?
            </p>
            <p
              style={{
                color: '#F44336',
                marginBottom: '30px',
                fontWeight: 500
              }}
            >
              This action cannot be undone. All user data will be permanently deleted.
            </p>
            {deleteError && (
              <div
                style={{
                  padding: '10px 15px',
                  backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
                  color: '#f44336',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}
              >
                {deleteError}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: darkMode ? '#333' : '#e0e0e0',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deleteLoading ? 'default' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && userToCancel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: darkMode
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <h3
              style={{
                color: darkMode ? '#e0e0e0' : '#333',
                marginTop: 0,
                marginBottom: '20px'
              }}
            >
              Confirm Subscription Cancellation
            </h3>
            <p
              style={{
                color: darkMode ? '#b0b0b0' : '#666',
                marginBottom: '20px'
              }}
            >
              Are you sure you want to cancel the subscription for{' '}
              <strong style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                {userToCancel.name}
              </strong>
              ?
            </p>
            <p
              style={{
                color: '#F44336',
                marginBottom: '30px',
                fontWeight: 500
              }}
            >
              This action cannot be undone.
            </p>
            {cancelError && (
              <div
                style={{
                  padding: '10px 15px',
                  backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : '#ffebee',
                  color: '#f44336',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}
              >
                {cancelError}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: darkMode ? '#333' : '#e0e0e0',
                  color: darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={cancelLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: cancelLoading ? 'default' : 'pointer',
                  opacity: cancelLoading ? 0.7 : 1
                }}
              >
                {cancelLoading ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminUsersPage = () => (
  <AdminProtectedRoute>
    <UsersManagement />
  </AdminProtectedRoute>
);

export default AdminUsersPage;
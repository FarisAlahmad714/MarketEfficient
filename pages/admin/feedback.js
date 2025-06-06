import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AdminProtectedRoute from '../../components/auth/AdminProtectedRoute';
import styles from '../../styles/AdminUsers.module.css';

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [stats, setStats] = useState({});

  const router = useRouter();

  useEffect(() => {
    fetchFeedback();
  }, [filter, sortBy]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feedback?filter=${filter}&sort=${sortBy}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
        setStats(data.stats || {});
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch feedback');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          feedbackId,
          status: newStatus
        })
      });

      if (response.ok) {
        await fetchFeedback();
        if (selectedFeedback && selectedFeedback._id === feedbackId) {
          setSelectedFeedback({ ...selectedFeedback, status: newStatus });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error updating feedback status:', err);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ feedbackId })
      });

      if (response.ok) {
        await fetchFeedback();
        if (selectedFeedback && selectedFeedback._id === feedbackId) {
          setSelectedFeedback(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete feedback');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error deleting feedback:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'ui': return '🎨';
      case 'performance': return '⚡';
      case 'general': return '💬';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <Layout>
        <AdminProtectedRoute>
          <div className={styles.container}>
            <div className={styles.loadingState}>Loading feedback...</div>
          </div>
        </AdminProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminProtectedRoute>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Feedback Management</h1>
            <button 
              onClick={() => router.push('/admin')}
              className={styles.backButton}
            >
              ← Back to Admin
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Feedback</h3>
              <p className={styles.statNumber}>{stats.total || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>New</h3>
              <p className={styles.statNumber} style={{ color: '#3b82f6' }}>
                {stats.new || 0}
              </p>
            </div>
            <div className={styles.statCard}>
              <h3>In Progress</h3>
              <p className={styles.statNumber} style={{ color: '#f59e0b' }}>
                {stats.in_progress || 0}
              </p>
            </div>
            <div className={styles.statCard}>
              <h3>Resolved</h3>
              <p className={styles.statNumber} style={{ color: '#10b981' }}>
                {stats.resolved || 0}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <label>Filter by Status:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">Status</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>

          {/* Feedback List */}
          <div className={styles.contentGrid}>
            <div className={styles.tableContainer}>
              {feedback.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No feedback found matching the current filters.</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>User</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <span className={styles.typeIndicator}>
                            {getTypeIcon(item.type)} {item.type}
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles.subjectButton}
                            onClick={() => setSelectedFeedback(item)}
                          >
                            {item.subject}
                          </button>
                        </td>
                        <td>
                          {item.userId ? (
                            <span>{item.userId.email}</span>
                          ) : (
                            <span className={styles.anonymousUser}>
                              {item.userEmail || 'Anonymous'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span 
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(item.status) }}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => setSelectedFeedback(item)}
                              className={styles.viewButton}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className={styles.deleteButton}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Feedback Detail Modal */}
            {selectedFeedback && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h2>Feedback Details</h2>
                    <button
                      onClick={() => setSelectedFeedback(null)}
                      className={styles.closeButton}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.feedbackDetails}>
                      <div className={styles.detailRow}>
                        <strong>Type:</strong> {getTypeIcon(selectedFeedback.type)} {selectedFeedback.type}
                      </div>
                      <div className={styles.detailRow}>
                        <strong>Subject:</strong> {selectedFeedback.subject}
                      </div>
                      <div className={styles.detailRow}>
                        <strong>User:</strong> {selectedFeedback.userId?.email || selectedFeedback.userEmail || 'Anonymous'}
                      </div>
                      <div className={styles.detailRow}>
                        <strong>Status:</strong>
                        <select
                          value={selectedFeedback.status}
                          onChange={(e) => handleStatusUpdate(selectedFeedback._id, e.target.value)}
                          className={styles.statusSelect}
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className={styles.detailRow}>
                        <strong>Date:</strong> {formatDate(selectedFeedback.createdAt)}
                      </div>
                      <div className={styles.detailRow}>
                        <strong>Message:</strong>
                        <div className={styles.messageContent}>
                          {selectedFeedback.message}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminProtectedRoute>
    </Layout>
  );
};

export default AdminFeedback;
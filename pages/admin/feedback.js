import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/AdminFeedback.module.css';
import AdminProtectedRoute from '../../components/auth/AdminProtectedRoute';
import { ThemeContext } from '../../contexts/ThemeContext';

const AdminFeedback = () => {
  const { darkMode } = useContext(ThemeContext);
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
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
      });
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
      });
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug_report': return '🐛';
      case 'feature_request': return '✨';
      case 'ui_ux': return '🎨';
      case 'performance': return '⚡';
      case 'general_feedback': return '💬';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Feedback Management</h1>
        <Link href="/admin" legacyBehavior>
          <a style={{
            background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            color: '#3B82F6',
            padding: '10px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            ← Back to Admin
          </a>
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Feedback</h3>
          <p className={styles.statNumber}>{stats.total || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Open</h3>
          <p className={styles.statNumber} style={{ color: getStatusColor('open') }}>
            {stats.open || 0}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>In Progress</h3>
          <p className={styles.statNumber} style={{ color: getStatusColor('in_progress') }}>
            {stats.in_progress || 0}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Resolved</h3>
          <p className={styles.statNumber} style={{ color: getStatusColor('resolved') }}>
            {stats.resolved || 0}
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <label htmlFor="status-filter">Filter by Status</label>
          <select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="sort-by">Sort by</label>
          <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.tableContainer}>
          {feedback.length > 0 ? (
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
                  <tr key={item._id} onClick={() => setSelectedFeedback(item)}>
                    <td>
                      <span className={styles.typeIndicator}>
                        {getTypeIcon(item.type)} {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.subjectButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFeedback(item);
                        }}
                      >
                        {item.subject}
                      </button>
                    </td>
                    <td>{item.userId ? item.userId.email : 'Anonymous'}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item._id);
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>No feedback found.</div>
          )}
        </div>

        <div className={styles.detailsPanel}>
          {selectedFeedback ? (
            <div>
              <h2>{selectedFeedback.subject}</h2>
              <div className={styles.detailItem}>
                <strong>From:</strong> {selectedFeedback.userId ? selectedFeedback.userId.email : 'Anonymous'}
              </div>
              <div className={styles.detailItem}>
                <strong>Date:</strong> {formatDate(selectedFeedback.createdAt)}
              </div>
              <div className={styles.detailItem}>
                <strong>Status:</strong>
                <select
                  value={selectedFeedback.status}
                  onChange={(e) => handleStatusUpdate(selectedFeedback._id, e.target.value)}
                  style={{ marginLeft: '10px', backgroundColor: getStatusColor(selectedFeedback.status), color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px' }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className={styles.detailItem}>
                <strong>Type:</strong> {selectedFeedback.type.replace(/_/g, ' ')}
              </div>
              <div className={styles.detailItem}>
                <strong>Message:</strong>
                <p className={styles.detailContent}>{selectedFeedback.message}</p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>Select a feedback item to see details.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProtectedAdminFeedback = () => (
  <AdminProtectedRoute>
    <AdminFeedback />
  </AdminProtectedRoute>
);

export default ProtectedAdminFeedback;
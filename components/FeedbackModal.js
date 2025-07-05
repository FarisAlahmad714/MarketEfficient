import React, { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/FeedbackModal.module.css';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    type: 'general_feedback',
    subject: '',
    message: '',
    email: user?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);


    try {
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          type: 'general_feedback',
          subject: '',
          message: '',
          email: user?.email || ''
        });
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !isBrowser) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Send Feedback</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.feedbackForm}>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.userDetail}>
                <strong>Name:</strong> {user.name}
              </div>
              <div className={styles.userDetail}>
                <strong>Email:</strong> {user.email}
              </div>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="type">Feedback Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="general_feedback">General Feedback</option>
              <option value="bug_report">Bug Report</option>
              <option value="feature_request">Feature Request</option>
              <option value="ui_ux">UI/UX Feedback</option>
              <option value="performance">Performance Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of your feedback"
              required
              maxLength={200}
            />
          </div>

          {!user && (
            <div className={styles.formGroup}>
              <label htmlFor="email">Email (optional)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email for follow-up"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Please provide detailed feedback..."
              required
              rows={6}
              maxLength={2000}
            />
            <div className={styles.charCount}>
              {formData.message.length}/2000 characters
            </div>
          </div>

          {submitStatus === 'success' && (
            <div className={styles.successMessage}>
              Thank you for your feedback! We'll review it shortly.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className={styles.errorMessage}>
              Failed to submit feedback. Please try again.
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(
    modalContent,
    document.getElementById('modal-root')
  );
};

export default FeedbackModal;
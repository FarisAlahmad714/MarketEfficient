import React, { useState, useEffect, useContext, useMemo } from 'react';
import { FaComment, FaHeart, FaReply, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import ProfileAvatar from './ProfileAvatar';
import MentionTextarea from './MentionTextarea';
import { useLeaderboardImages } from '../lib/useLeaderboardImages';
import storage from '../lib/storage';

const CommentSection = ({ shareId, initialCommentsCount = 0 }) => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [mentions, setMentions] = useState([]);

  // Get profile images for comment authors - memoized to prevent infinite updates
  const commentUsers = useMemo(() => {
    return comments.flatMap(comment => [
      { userId: comment.userId, profileImageGcsPath: null },
      ...(comment.replies || []).map(reply => ({ userId: reply.userId, profileImageGcsPath: null }))
    ]);
  }, [comments]);
  const { imageUrls } = useLeaderboardImages(commentUsers);

  const fetchComments = async () => {
    if (!shareId) return;
    
    try {
      setLoading(true);
      const token = await storage.getItem('auth_token');
      
      const response = await fetch(`/api/comments?shareId=${shareId}&limit=20&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (offset === 0) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setHasMore(data.hasMore);
        setCommentsCount(data.totalCount);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [shareId, showComments, offset]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const token = await storage.getItem('auth_token');
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shareId,
          content: newComment.trim(),
          parentCommentId: replyTo?._id || null,
          mentions: mentions
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (replyTo) {
          // Add reply to existing comment
          setComments(prev => prev.map(comment => 
            comment._id === replyTo._id 
              ? { 
                  ...comment, 
                  replies: [...(comment.replies || []), data.comment],
                  repliesCount: (comment.repliesCount || 0) + 1
                }
              : comment
          ));
          setReplyTo(null);
        } else {
          // Add new top-level comment
          setComments(prev => [data.comment, ...prev]);
          setCommentsCount(prev => prev + 1);
        }
        
        setNewComment('');
        setMentions([]);
        
        // Trigger notification update
        window.dispatchEvent(new Event('notificationUpdate'));
      }
    } catch (error) {
    }
  };

  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    try {
      const token = await storage.getItem('auth_token');
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (isReply) {
          // Remove reply from parent comment
          setComments(prev => prev.map(comment => 
            comment._id === parentId 
              ? { 
                  ...comment, 
                  replies: comment.replies.filter(reply => reply._id !== commentId),
                  repliesCount: Math.max(0, (comment.repliesCount || 0) - 1)
                }
              : comment
          ));
        } else {
          // Remove top-level comment
          setComments(prev => prev.filter(comment => comment._id !== commentId));
          setCommentsCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
    }
  };

  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const renderCommentContent = (content) => {
    // Replace @mentions with clickable links
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username (every odd index after split)
        return (
          <span
            key={index}
            style={{
              color: '#2196F3',
              cursor: 'pointer',
              fontWeight: '600'
            }}
            onClick={() => {
              // Navigate to user profile
              window.location.href = `/u/${part}`;
            }}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const CommentItem = ({ comment, isReply = false, parentId = null }) => (
    <div style={{
      padding: isReply ? '8px 0 8px 40px' : '12px 0',
      borderBottom: !isReply ? `1px solid ${darkMode ? '#333' : '#f0f0f0'}` : 'none'
    }}>
      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <ProfileAvatar
          imageUrl={imageUrls[comment.userId]}
          name={comment.name}
          size={isReply ? 32 : 36}
          borderRadius="50%"
        />
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{
              fontWeight: '600',
              fontSize: '14px',
              color: darkMode ? '#e0e0e0' : '#333'
            }}>
              {comment.name}
            </span>
            <span style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              @{comment.username}
            </span>
            <span style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              •
            </span>
            <span style={{
              fontSize: '12px',
              color: darkMode ? '#888' : '#666'
            }}>
              {formatDate(comment.createdAt)}
            </span>
          </div>
          
          <div style={{
            fontSize: '14px',
            color: darkMode ? '#e0e0e0' : '#333',
            lineHeight: '1.4',
            marginBottom: '8px'
          }}>
            {renderCommentContent(comment.content)}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => setReplyTo(comment)}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#888' : '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <FaReply size={12} />
              Reply
            </button>
            
            {comment.likesCount > 0 && (
              <span style={{
                fontSize: '12px',
                color: darkMode ? '#888' : '#666'
              }}>
                {comment.likesCount} likes
              </span>
            )}
            
            {user && user.id === comment.userId && (
              <button
                onClick={() => handleDeleteComment(comment._id, isReply, parentId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px'
                }}
              >
                <FaTrash size={12} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => toggleReplies(comment._id)}
            style={{
              background: 'none',
              border: 'none',
              color: darkMode ? '#888' : '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              marginLeft: '48px'
            }}
          >
            {showReplies[comment._id] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            {comment.repliesCount > 0 ? `${comment.repliesCount} replies` : 'View replies'}
          </button>
          
          {showReplies[comment._id] && comment.replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              isReply={true}
              parentId={comment._id}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Comment Toggle Button */}
      <button
        onClick={() => setShowComments(!showComments)}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: darkMode ? '#888' : '#666',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          padding: '4px 0'
        }}
      >
        <FaComment size={14} />
        {commentsCount > 0 ? `${commentsCount} comments` : 'Comment'}
      </button>

      {/* Comments Section */}
      {showComments && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          backgroundColor: darkMode ? '#262626' : '#f8f9fa',
          borderRadius: '8px'
        }}>
          {/* Comment Form */}
          {user && (
            <form onSubmit={handleSubmitComment} style={{ marginBottom: '16px' }}>
              {replyTo && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: darkMode ? '#333' : '#e3f2fd',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}>
                  Replying to @{replyTo.username}
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: darkMode ? '#888' : '#666',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <ProfileAvatar
                  imageUrl={imageUrls[user.id]}
                  name={user.name}
                  size={32}
                  borderRadius="50%"
                />
                <div style={{ flex: 1 }}>
                  <MentionTextarea
                    value={newComment}
                    onChange={(value) => setNewComment(value)}
                    onMentionsChange={(newMentions) => setMentions(newMentions)}
                    placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                    darkMode={darkMode}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    style={{
                      marginTop: '8px',
                      padding: '6px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                      opacity: newComment.trim() ? 1 : 0.6
                    }}
                  >
                    {replyTo ? 'Reply' : 'Comment'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          {loading && comments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: darkMode ? '#888' : '#666'
            }}>
              Loading comments...
            </div>
          ) : comments.length > 0 ? (
            <div>
              {comments.map(comment => (
                <CommentItem key={comment._id} comment={comment} />
              ))}
              
              {hasMore && (
                <button
                  onClick={() => setOffset(prev => prev + 20)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: darkMode ? '#333' : '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    color: darkMode ? '#e0e0e0' : '#333',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {loading ? 'Loading...' : 'Load more comments'}
                </button>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: darkMode ? '#888' : '#666',
              fontSize: '14px'
            }}>
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
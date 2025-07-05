import React, { useState, useEffect, useContext } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import storage from '../lib/storage';

const LikeButton = ({ shareId, targetType, targetId, initialLikesCount = 0, size = 14 }) => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikeStatus();
  }, [shareId, targetId, targetType]);

  const fetchLikeStatus = async () => {
    if (!shareId || !targetId || !targetType) return;
    
    try {
      const token = await storage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `/api/likes/status?shareId=${shareId}&targetIds=${targetId}&targetType=${targetType}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        const likeData = data.likesData[targetId];
        if (likeData) {
          setIsLiked(likeData.isLiked);
          setLikesCount(likeData.likesCount);
        }
      }
    } catch (error) {
    }
  };

  const handleToggleLike = async () => {
    if (!user || loading) return;
    
    try {
      setLoading(true);
      const token = await storage.getItem('auth_token');
      
      const response = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shareId,
          targetType,
          targetId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        
        // Trigger notification update
        window.dispatchEvent(new Event('notificationUpdate'));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={!user || loading}
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        color: isLiked ? '#f44336' : (darkMode ? '#888' : '#666'),
        cursor: user && !loading ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        opacity: loading ? 0.6 : 1,
        transition: 'color 0.2s ease'
      }}
    >
      {isLiked ? (
        <FaHeart size={size} style={{ color: '#f44336' }} />
      ) : (
        <FaRegHeart size={size} />
      )}
      {likesCount > 0 ? (
        <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
      ) : (
        <span>Like</span>
      )}
    </button>
  );
};

export default LikeButton;
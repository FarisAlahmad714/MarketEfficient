// pages/feed.js - Social Feed Page
import React, { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import storage from '../lib/storage';
import { FaNewspaper, FaUsers, FaHeart, FaComments } from 'react-icons/fa';

const SocialFeed = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [feedContent, setFeedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSocialFeed();
  }, [user]);

  const fetchSocialFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await storage.getItem('auth_token');
      const response = await fetch('/api/feed/social', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedContent(data.feedContent || []);
        setFollowedUsers(data.followedUsers || []);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load feed');
      }
    } catch (error) {
      console.error('Error fetching social feed:', error);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Social Feed - MarketEfficient</title>
      </Head>
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Social Feed</h1>
        {loading ? (
          <p>Loading...</p>
        ) : feedContent.length === 0 ? (
          <p>No content from followed users yet!</p>
        ) : (
          feedContent.map(item => (
            <div key={item.shareId} style={{ 
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '12px'
            }}>
              <h3>{item.name} shared {item.type}</h3>
              <p>{JSON.stringify(item.data)}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default SocialFeed;
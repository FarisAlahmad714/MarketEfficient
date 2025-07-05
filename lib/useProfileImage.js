import { useState, useEffect, useCallback } from 'react';
import storage from './storage';

export const useProfileImage = (userId, shouldFetch = true) => {
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!userId || !shouldFetch) {
      setProfileImageUrl(null);
      return;
    }

    const fetchProfileImage = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = storage.getItem('auth_token');
        
        // Try authenticated endpoint first
        if (token) {
          try {
            const response = await fetch('/api/user/get-profile-image', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              
              if (data.profileImageUrl) {
                // Add cache-busting parameter to ensure fresh load
                const imageUrl = data.profileImageUrl.includes('?') 
                  ? `${data.profileImageUrl}&v=${Date.now()}`
                  : `${data.profileImageUrl}?v=${Date.now()}`;
                setProfileImageUrl(imageUrl);
                return;
              }
            } else {
            }
          } catch (authError) {
          }
        }

        // Fallback to public API using userId
        if (userId) {
          try {
            const response = await fetch(`/api/profile/user-image/${userId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              
              if (data.profileImageUrl) {
                // Add cache-busting parameter to ensure fresh load
                const imageUrl = data.profileImageUrl.includes('?') 
                  ? `${data.profileImageUrl}&v=${Date.now()}`
                  : `${data.profileImageUrl}?v=${Date.now()}`;
                setProfileImageUrl(imageUrl);
              } else {
                setProfileImageUrl(null);
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              setError(`Failed to fetch profile image: ${response.status} - ${errorData.error || 'Unknown error'}`);
              setProfileImageUrl(null);
            }
          } catch (publicError) {
            setError(publicError.message);
            setProfileImageUrl(null);
          }
        } else {
          setError('No authentication token and no userId provided');
          setProfileImageUrl(null);
        }
      } catch (err) {
        setError(err.message);
        setProfileImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileImage();
  }, [userId, shouldFetch, refreshTrigger]);

  const refreshProfileImage = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { profileImageUrl, loading, error, refreshProfileImage };
};

export const useUserProfileImage = (targetUserId, shouldFetch = true) => {
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetUserId || !shouldFetch) {
      setProfileImageUrl(null);
      return;
    }

    const fetchUserProfileImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the public profile API to get user profile images
        const response = await fetch(`/api/profile/user-image/${targetUserId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.profileImageUrl) {
            // Add cache-busting parameter to ensure fresh load
            const imageUrl = data.profileImageUrl.includes('?') 
              ? `${data.profileImageUrl}&v=${Date.now()}`
              : `${data.profileImageUrl}?v=${Date.now()}`;
            setProfileImageUrl(imageUrl);
          } else {
            setProfileImageUrl(null);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(`Failed to fetch profile image: ${response.status} - ${errorData.error || 'Unknown error'}`);
          setProfileImageUrl(null);
        }
      } catch (err) {
        setError(err.message);
        setProfileImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileImage();
  }, [targetUserId, shouldFetch]);

  return { profileImageUrl, loading, error };
};
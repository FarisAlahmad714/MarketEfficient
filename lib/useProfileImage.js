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
        if (!token) {
          setError('No authentication token');
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/user/get-profile-image', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Profile image API response:', data);
          
          if (data.profileImageUrl) {
            console.log('Setting profile image URL:', data.profileImageUrl);
            setProfileImageUrl(data.profileImageUrl);
          } else {
            console.log('No profile image URL in response');
            setProfileImageUrl(null);
          }
        } else {
          // If we get a 404 or similar, just set to null (no image)
          console.log('No profile image found or error fetching:', response.status);
          setProfileImageUrl(null);
        }
      } catch (err) {
        console.error('Error fetching profile image:', err);
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

        const token = storage.getItem('auth_token');
        if (!token) {
          setError('No authentication token');
          setLoading(false);
          return;
        }

        // This would need a new API endpoint to get other users' profile images
        // For now, we'll just return null for other users
        setProfileImageUrl(null);
      } catch (err) {
        console.error('Error fetching user profile image:', err);
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
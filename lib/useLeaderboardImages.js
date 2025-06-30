import { useState, useEffect } from 'react';

// In-memory cache for profile images
const imageCache = new Map();
const pendingRequests = new Map();

export const useLeaderboardImages = (leaderboardData) => {
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leaderboardData || leaderboardData.length === 0) {
      setImageUrls({});
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      const urls = {};
      const toFetch = [];

      // First, check cache for existing images
      leaderboardData.forEach(user => {
        if (user.profileImageGcsPath) {
          const cached = imageCache.get(user.userId);
          if (cached) {
            urls[user.userId] = cached;
          } else {
            toFetch.push(user);
          }
        } else {
          urls[user.userId] = null;
        }
      });

      // Update state with cached images immediately
      setImageUrls(prev => ({ ...prev, ...urls }));

      if (toFetch.length === 0) {
        setLoading(false);
        return;
      }

      // Batch fetch remaining images with request deduplication
      const fetchPromises = toFetch.map(async (user) => {
        const userId = user.userId;
        
        // Check if request is already pending
        if (pendingRequests.has(userId)) {
          return pendingRequests.get(userId);
        }

        const fetchPromise = fetchProfileImageUrl(user.profileImageGcsPath, userId);
        pendingRequests.set(userId, fetchPromise);

        try {
          const imageUrl = await fetchPromise;
          
          // Cache the result
          imageCache.set(userId, imageUrl);
          
          // Update state
          setImageUrls(prev => ({ ...prev, [userId]: imageUrl }));
          
          return { userId, imageUrl };
        } catch (error) {
          console.error(`Error fetching image for user ${userId}:`, error);
          const fallbackUrl = null;
          imageCache.set(userId, fallbackUrl);
          setImageUrls(prev => ({ ...prev, [userId]: fallbackUrl }));
          return { userId, imageUrl: fallbackUrl };
        } finally {
          pendingRequests.delete(userId);
        }
      });

      await Promise.all(fetchPromises);
      setLoading(false);
    };

    fetchImages();
  }, [leaderboardData]);

  return { imageUrls, loading };
};

// Optimized fetch function for profile images
async function fetchProfileImageUrl(gcsPath, userId) {
  try {
    const response = await fetch(`/api/get-profile-image-url?gcsPath=${encodeURIComponent(gcsPath)}&userId=${userId}&v=${Date.now()}`, {
      method: 'GET', // Changed to GET for browser caching
      headers: {
        'Cache-Control': 'public, max-age=1800', // 30 minutes cache
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`useLeaderboardImages: API error ${response.status} for user ${userId}:`, errorData);
      throw new Error(`Failed to fetch image: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.profileImageUrl) {
      console.warn(`useLeaderboardImages: No profile image URL returned for user ${userId}`);
      return null;
    }
    
    // Add cache-busting to the returned URL as well
    const url = data.profileImageUrl.includes('?') 
      ? `${data.profileImageUrl}&v=${Date.now()}`
      : `${data.profileImageUrl}?v=${Date.now()}`;
    
    console.log(`useLeaderboardImages: Successfully fetched image URL for user ${userId}`);
    return url;
  } catch (error) {
    console.error(`useLeaderboardImages: Error fetching image for user ${userId}:`, error);
    throw error;
  }
}

// Clear cache function (useful for profile updates)
export const clearImageCache = (userId = null) => {
  if (userId) {
    imageCache.delete(userId);
  } else {
    imageCache.clear();
  }
};
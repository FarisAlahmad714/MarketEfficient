import { useState, useEffect } from 'react';

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

      // Process each user in parallel
      await Promise.all(
        leaderboardData.map(async (user) => {
          if (user.profileImageGcsPath) {
            try {
              const response = await fetch('/api/get-profile-image-url', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gcsPath: user.profileImageGcsPath }),
              });

              if (response.ok) {
                const data = await response.json();
                urls[user.userId] = data.profileImageUrl;
              } else {
                urls[user.userId] = null;
              }
            } catch (error) {
              console.error(`Error fetching image for user ${user.userId}:`, error);
              urls[user.userId] = null;
            }
          } else {
            urls[user.userId] = null;
          }
        })
      );

      setImageUrls(urls);
      setLoading(false);
    };

    fetchImages();
  }, [leaderboardData]);

  return { imageUrls, loading };
};
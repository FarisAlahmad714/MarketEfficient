import React, { createContext, useContext, useState, useCallback } from 'react';

const ProfileImageContext = createContext();

export const useProfileImageContext = () => {
  const context = useContext(ProfileImageContext);
  if (!context) {
    throw new Error('useProfileImageContext must be used within ProfileImageProvider');
  }
  return context;
};

export const ProfileImageProvider = ({ children }) => {
  const [imageVersion, setImageVersion] = useState(0);

  const invalidateProfileImage = useCallback(() => {
    setImageVersion(prev => prev + 1);
    // Also emit a custom event for components that need to refresh
    window.dispatchEvent(new CustomEvent('profileImageUpdated'));
  }, []);

  return (
    <ProfileImageContext.Provider value={{ imageVersion, invalidateProfileImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
};
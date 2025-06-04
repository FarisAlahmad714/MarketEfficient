import React, { createContext, useState, useEffect, useContext } from 'react';
import storage from '../lib/storage';

export const ThemeContext = createContext();

// Custom hook for safe theme context access
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Return fallback values if context is not available
  if (!context) {
    return {
      darkMode: false,
      toggleTheme: () => {}
    };
  }
  
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  
  useEffect(() => {
    // Update the document body with theme classes
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
    
    // Store user preference in storage
    storage.setItem('darkMode', darkMode);
  }, [darkMode]);
  
  // Check for saved preference on load
  useEffect(() => {
    const savedMode = storage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export const getAssetCardBackgroundColor = (darkMode) => {
    return darkMode ? 'linear-gradient(rgba(5, 5, 5, 0.7), rgba(5, 5, 5, 0.9))' : 'linear-gradient(rgba(10, 10, 10, 0.7), rgba(10, 10, 10, 0.9))';
  };
  
  export const getButtonColorByMode = (darkMode, isActive) => {
    if (isActive) return { bg: '#4CAF50', color: 'white' };
    return {
      bg: darkMode ? '#333' : '#f5f5f5',
      color: darkMode ? '#e0e0e0' : '#333',
    };
  };
  
  export const getCardBackgroundColor = (darkMode) => {
    return darkMode ? '#1e1e1e' : 'white';
  };
  
  export const getBorderColor = (darkMode) => {
    return darkMode ? '#333' : '#eee';
  };
  
  export const getTextColor = (darkMode) => {
    return darkMode ? '#e0e0e0' : '#333';
  };
  
  export const getTextSecondaryColor = (darkMode) => {
    return darkMode ? '#b0b0b0' : '#666';
  };
  
  export const getBoxShadow = (darkMode) => {
    return darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)';
  };
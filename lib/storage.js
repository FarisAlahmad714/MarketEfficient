// lib/storage.js
import storageCompat from './storageCompat';

const storage = {
  getItem: (key) => {
    try {
      return storageCompat.getItem(key);
    } catch (error) {
      console.error('Storage error:', error);
      // Fallback to direct localStorage
      const value = localStorage.getItem(key);
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  },
  
  setItem: (key, value) => {
    try {
      storageCompat.setItem(key, value);
    } catch (error) {
      console.error('Storage error:', error);
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  },
  
  removeItem: (key) => {
    try {
      storageCompat.removeItem(key);
    } catch (error) {
      console.error('Storage error:', error);
      localStorage.removeItem(key);
    }
  },
  
  clear: () => {
    try {
      storageCompat.clear();
    } catch (error) {
      console.error('Storage error:', error);
      localStorage.clear();
    }
  }
};

export default storage;
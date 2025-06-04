// lib/storageCompat.js
class StorageCompatibilityLayer {
    constructor() {
      this.debug = process.env.NODE_ENV === 'development';
    }
  
    setItem(key, value) {
        // Use secure storage for sensitive keys
        const sensitiveKeys = ['auth_token', 'tempToken'];
        if (sensitiveKeys.includes(key)) {
            return secureStorage.setItem(key, value);
        }
        // Regular storage for non-sensitive
        localStorage.setItem(key, value);
        if (this.debug) {
            console.log(`[Storage] Set ${key}`);
          }
        }
  
    getItem(key) {
      if (typeof window === 'undefined') return null;
      
      try {
        const value = localStorage.getItem(key);
        if (!value) return null;
        
        // Try to parse JSON, if it fails return as string
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } catch (error) {
        if (this.debug) {
          console.error(`[Storage] Error getting ${key}:`, error);
        }
        return null;
      }
    }
  
    removeItem(key) {
      if (typeof window === 'undefined') return;
      
      localStorage.removeItem(key);
      
      if (this.debug) {
        console.log(`[Storage] Removed ${key}`);
      }
    }
  
    clear() {
      if (typeof window === 'undefined') return;
      localStorage.clear();
    }
  }
  
  // Create and export the instance
  const storageCompat = new StorageCompatibilityLayer();
  export default storageCompat;
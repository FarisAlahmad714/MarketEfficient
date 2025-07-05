import secureStorage from './secureStorage';
// lib/storageCompat.js
class StorageCompatibilityLayer {
    constructor() {
      this.debug = process.env.NODE_ENV === 'development';
    }
  
    async setItem(key, value) {
        if (this.debug) {
        }
        // Always use secureStorage
        return await secureStorage.setItem(key, value);
    }
  
    async getItem(key) {
        if (this.debug) {
        }
        // Always use secureStorage
        return await secureStorage.getItem(key);
    }
  
    removeItem(key) {
        if (this.debug) {
        }
        // Always use secureStorage
        secureStorage.removeItem(key);
    }
  
    clear() {
        if (this.debug) {
        }
        // This should call secureStorage's clear method, 
        // which is implemented to clear only secure items.
        secureStorage.clear();
    }
  }
  
  // Create and export the instance
  const storageCompat = new StorageCompatibilityLayer();
  export default storageCompat;
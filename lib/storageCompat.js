import secureStorage from './secureStorage';
// lib/storageCompat.js
class StorageCompatibilityLayer {
    constructor() {
      this.debug = process.env.NODE_ENV === 'development';
    }
  
    async setItem(key, value) {
        if (this.debug) {
            console.log(`[StorageCompat] Delegating setItem for ${key} to secureStorage`);
        }
        // Always use secureStorage
        return await secureStorage.setItem(key, value);
    }
  
    async getItem(key) {
        if (this.debug) {
            console.log(`[StorageCompat] Delegating getItem for ${key} to secureStorage`);
        }
        // Always use secureStorage
        return await secureStorage.getItem(key);
    }
  
    removeItem(key) {
        if (this.debug) {
            console.log(`[StorageCompat] Delegating removeItem for ${key} to secureStorage`);
        }
        // Always use secureStorage
        secureStorage.removeItem(key);
    }
  
    clear() {
        if (this.debug) {
            console.log(`[StorageCompat] Delegating clear to secureStorage`);
        }
        // This should call secureStorage's clear method, 
        // which is implemented to clear only secure items.
        secureStorage.clear();
    }
  }
  
  // Create and export the instance
  const storageCompat = new StorageCompatibilityLayer();
  export default storageCompat;
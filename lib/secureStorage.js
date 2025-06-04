// lib/secureStorage.js
import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor() {
    // Get encryption key from environment or generate one
    this.encryptionKey = process.env.NEXT_PUBLIC_STORAGE_KEY || 'fallback-key-change-this';
    
    // Flag to indicate we're using secure storage
    this.isSecure = true;
    
    // Use sessionStorage for sensitive data (clears on tab close)
    this.sensitiveKeys = ['auth_token', 'registrationTempToken', 'tempToken'];
  }

  // Encrypt data before storing
  encrypt(data) {
    try {
      const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
      return CryptoJS.AES.encrypt(stringData, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  // Decrypt data after retrieving
  decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  setItem(key, value) {
    if (typeof window === 'undefined') return;

    try {
      const encrypted = this.encrypt(value);
      if (!encrypted) throw new Error('Encryption failed');

      // Use sessionStorage for sensitive data
      if (this.sensitiveKeys.includes(key)) {
        sessionStorage.setItem(`_secure_${key}`, encrypted);
      } else {
        localStorage.setItem(key, encrypted);
      }

      // Log for security audit
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SecureStorage] Stored ${key} (encrypted: ${this.sensitiveKeys.includes(key) ? 'session' : 'local'})`);
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to store:', error);
      // Fallback to regular storage if encryption fails
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  getItem(key) {
    if (typeof window === 'undefined') return null;

    try {
      let encrypted;
      
      // Check sessionStorage first for sensitive keys
      if (this.sensitiveKeys.includes(key)) {
        encrypted = sessionStorage.getItem(`_secure_${key}`);
      }
      
      // Fall back to localStorage
      if (!encrypted) {
        encrypted = localStorage.getItem(key);
      }

      if (!encrypted) return null;

      // Try to decrypt
      const decrypted = this.decrypt(encrypted);
      if (decrypted !== null) return decrypted;

      // If decryption fails, might be old unencrypted data
      try {
        return JSON.parse(encrypted);
      } catch {
        return encrypted;
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve:', error);
      return null;
    }
  }

  removeItem(key) {
    if (typeof window === 'undefined') return;

    // Remove from both storages to ensure cleanup
    sessionStorage.removeItem(`_secure_${key}`);
    localStorage.removeItem(key);
  }

  clear() {
    if (typeof window === 'undefined') return;
    
    // Clear both storages
    sessionStorage.clear();
    localStorage.clear();
  }

  // Security audit method
  auditStorage() {
    const audit = {
      encrypted: [],
      plainText: [],
      sensitive: []
    };

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      // Check if it looks encrypted
      if (value && value.includes('U2FsdGVkX1')) {
        audit.encrypted.push(key);
      } else {
        audit.plainText.push(key);
      }
    }

    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('_secure_')) {
        audit.sensitive.push(key.replace('_secure_', ''));
      }
    }

    return audit;
  }
}

export default new SecureStorage();
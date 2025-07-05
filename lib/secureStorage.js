// lib/secureStorage.js
import CryptoJS from 'crypto-js';
import logger from './logger';

class SecureStorage {
  constructor() {
    this.algorithm = 'aes-256-gcm'; // GCM includes authentication, consider if CryptoJS.AES supports GCM directly. If not, HMAC is good.
    // Never expose the actual key
    this.encryptionKey = null;
    this._cachedSessionKey = null; // Added for caching sessionKey
    this.sensitiveKeys = ['auth_token', 'user_data']; // Example, configure as needed
  }
  
  async initializeKey() {
    if (this.encryptionKey) return; // Already initialized

    if (this._cachedSessionKey) {
      try {
        this.encryptionKey = await this.deriveKey(this._cachedSessionKey);
        if (this.encryptionKey) return; // Successfully derived from cached sessionKey
      } catch (error) {
        logger.error("[SecureStorage] Failed to derive key from cached sessionKey:", error);
        this._cachedSessionKey = null; // Clear cache if derivation fails
      }
    }

    // Derive key from server session
    try {
      if (process.env.NODE_ENV === 'development') {
      }
      const response = await fetch('/api/auth/session-key', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch session key: ${response.statusText}`);
      }
      const { sessionKey } = await response.json();
      if (!sessionKey) {
        throw new Error('Session key not found in response.');
      }
      this._cachedSessionKey = sessionKey; // Cache the fetched sessionKey
      this.encryptionKey = await this.deriveKey(sessionKey);
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      logger.error("[SecureStorage] Failed to initialize key:", error);
      // Handle key initialization failure, e.g. by disabling storage or notifying user
    }
  }

  async deriveKey(sessionKey) {
    // Securely derive a key using PBKDF2 with a unique salt
    // Generate salt based on session key and environment-specific salt
    const envSalt = process.env.ENCRYPTION_SALT || 'ChartSense-Default-Salt-' + process.env.NODE_ENV;
    const uniqueSaltData = `${sessionKey}-${envSalt}`;
    const salt = CryptoJS.SHA256(uniqueSaltData).toString().substring(0, 32);
    const saltWordArray = CryptoJS.enc.Hex.parse(salt);
    const key = CryptoJS.PBKDF2(sessionKey, saltWordArray, {
      keySize: 256 / 32, // 256 bits
      iterations: 100000 // NIST recommendation for PBKDF2
    });
    return key.toString(CryptoJS.enc.Hex); // Store key as hex string
  }


  // Encrypt data before storing
  encrypt(data) {
    if (!this.encryptionKey) {
      logger.error('[SecureStorage] Encryption key not initialized');
      return null;
    }
    try {
      const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
      const encrypted = CryptoJS.AES.encrypt(stringData, this.encryptionKey).toString();
      
      // Add HMAC for integrity
      const hmac = CryptoJS.HmacSHA256(encrypted, this.encryptionKey).toString();
      return `${encrypted}.${hmac}`;
    } catch (error) {
      logger.error('Encryption failed:', error);
      return null;
    }
  }

  // Decrypt data after retrieving
  decrypt(encryptedData) {
    if (!this.encryptionKey) {
      logger.error('[SecureStorage] Encryption key not initialized');
      return null;
    }
    try {
      if (typeof encryptedData !== 'string' || !encryptedData.includes('.')) {
        // This might be unencrypted data or data encrypted with an old scheme.
        // Depending on policy, either return null, or try to parse it as-is if it's known to be safe.
        // For now, strict adherence to new format.
        if (process.env.NODE_ENV === 'development') {
        }
        // Attempt to handle potentially unencrypted JSON or plain string
        try {
            return JSON.parse(encryptedData);
        } catch (e) {
            // If not JSON, return as is, assuming it might be a plain string.
            // This path should be taken if you expect some data to be unencrypted.
            // Otherwise, for strict encryption, return null.
            return encryptedData; 
        }
      }
      const [encrypted, hmac] = encryptedData.split('.');
      
      // Verify integrity
      const calculatedHmac = CryptoJS.HmacSHA256(encrypted, this.encryptionKey).toString();
      if (calculatedHmac !== hmac) {
        logger.error('Data integrity check failed');
        // Optionally, trigger an alert or logging for security monitoring here
        throw new Error('Data integrity check failed');
      }
      
      // Decrypt
      const bytes = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted && encrypted) { // Check if decryption produced an empty string but source was not empty
        // This condition helps distinguish between decrypting an empty string vs. a decryption failure
        // that results in an empty string. If 'encrypted' itself was non-empty, then an empty 'decrypted' is an error.
        throw new Error('Decryption resulted in empty data. Potential tampering or incorrect key.');
      }

      // Always return the raw decrypted string. Caller is responsible for JSON.parse if needed.
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      return null;
    }
  }

  async setItem(key, value) {
    if (typeof window === 'undefined' || !this.encryptionKey) {
      if (!this.encryptionKey) {
        logger.error('[SecureStorage] Cannot set item, key not initialized. Attempting to initialize...');
        await this.initializeKey();
        if (!this.encryptionKey) {
          logger.error('[SecureStorage] Key initialization failed. Cannot set item.');
          return;
        }
      } else {
        // This case should ideally not be hit if the first condition handles !this.encryptionKey
        return;
      }
    }
  
    try {
      const encrypted = this.encrypt(value);
      if (!encrypted) {
        logger.error('[SecureStorage] Encryption failed - not storing data for key:', key);
        return; // Don't store if encryption fails
      }
  
      // Use sessionStorage for sensitive data, localStorage for others
      // The definition of 'sensitiveKeys' should be managed carefully.
      if (this.sensitiveKeys.includes(key)) {
        sessionStorage.setItem(`_secure_${key}`, encrypted);
      } else {
        // For non-sensitive keys, decide if they also need encryption.
        // The original guide implies all secureStorage items are encrypted.
        localStorage.setItem(`_secure_${key}`, encrypted); // Ensuring all items via SecureStorage are marked
      }
  
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      logger.error(`[SecureStorage] Failed to store ${key}:`, error);
      // DO NOT fallback to plaintext storage
    }
  }

  async getItem(key) {
    if (typeof window === 'undefined') return null; // Return null if window is not defined

    if (!this.encryptionKey) {
      logger.error('[SecureStorage] Cannot get item, key not initialized. Attempting to initialize...');
      await this.initializeKey();
      if(!this.encryptionKey) {
          logger.error('[SecureStorage] Key initialization failed. Cannot get item.');
          return null;
      }
    }
    
    try {
      let encrypted = null;
      
      // Check sessionStorage first for sensitive keys
      if (this.sensitiveKeys.includes(key)) {
        encrypted = sessionStorage.getItem(`_secure_${key}`);
      }
      
      // Fall back to localStorage (now also prefixed)
      if (!encrypted) {
        encrypted = localStorage.getItem(`_secure_${key}`);
      }

      // If not found in secure prefixed storage, check for non-prefixed (potentially old/unmigrated data)
      // This part is for migration handling. Once migration is complete, this can be removed.
      if (!encrypted) {
        const unsecureData = localStorage.getItem(key);
        if (unsecureData) {
            if (process.env.NODE_ENV === 'development') {
            }
            // Attempt to decrypt if it looks like old encrypted data, otherwise return as is.
            // This logic depends on how old data was stored.
            // For now, we assume it might be JSON or a plain string.
             const decryptedUnsecure = this.decrypt(unsecureData); // Try to decrypt even if from old location
             if (decryptedUnsecure !== null) return decryptedUnsecure;
             // If decrypt returns null (due to error or not matching format), handle as plain.
             try {
                return JSON.parse(unsecureData);
             } catch {
                return unsecureData;
             }
        }
      }

      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      // No fallback to parsing 'encrypted' as JSON, as decrypt handles parsing.
      // If decrypted is null, it means decryption failed.
      return decrypted;
    } catch (error) {
      logger.error(`[SecureStorage] Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  removeItem(key) {
    if (typeof window === 'undefined') return;

    // Remove from both storages to ensure cleanup
    sessionStorage.removeItem(`_secure_${key}`);
    localStorage.removeItem(`_secure_${key}`);
    localStorage.removeItem(key); // Also remove non-prefixed for cleanup during migration
  }

  clear() {
    if (typeof window === 'undefined') return;
    
    // Consider what "clear" means. Does it clear ALL localStorage/sessionStorage
    // or just the items managed by SecureStorage?
    // For now, clearing all items prefixed by _secure_
    const keysToClear = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('_secure_')) {
        keysToClear.push(key);
      }
    }
    for (const key of keysToClear) {
      localStorage.removeItem(key);
    }

    const sessionKeysToClear = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('_secure_')) {
        sessionKeysToClear.push(key);
      }
    }
    for (const key of sessionKeysToClear) {
      sessionStorage.removeItem(key);
    }

    if (process.env.NODE_ENV === 'development') {
    }
  }

  // Security audit method (updated to reflect new storage naming)
  auditStorage() {
    if (typeof window === 'undefined') return { encrypted: [], plainText: [], sensitiveSession: [] };
    const audit = {
      encryptedLocal: [],
      encryptedSession: [],
      plainTextLocal: [], // Should be empty after migration
      plainTextSession: [], // Should be empty
    };

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('_secure_')) {
        audit.encryptedLocal.push(key.replace('_secure_', ''));
      } else {
        audit.plainTextLocal.push(key);
      }

    }

    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('_secure_')) {
        audit.encryptedSession.push(key.replace('_secure_', ''));
      } else {
        // Items not prefixed in session storage are considered plain text
        audit.plainTextSession.push(key);
      }
    }
    return audit;
  }
}

// Initialize the key when the script loads or when SecureStorage is first instantiated.
// Note: `await` cannot be used at the top level of a module.
// Key initialization needs to be triggered, e.g., in an application bootstrap phase.
const secureStorageInstance = new SecureStorage();
if (typeof window !== 'undefined') {
  secureStorageInstance.initializeKey().catch(err => {
    logger.error("Error during initial key initialization:", err);
    // Application might need to handle this case, e.g. by showing an error to the user
    // or falling back to a non-functional state for secure operations.
  });
}

export default secureStorageInstance;
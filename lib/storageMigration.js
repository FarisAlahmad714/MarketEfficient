// lib/storageMigration.js
import secureStorage from './secureStorage';

// Migration utility to help transition from localStorage to secureStorage
export class StorageMigration {
  constructor() {
    this.migrationKey = '__storage_migrated_v1';
  }

  // Automated migration for existing users
  async migrateExistingData() {
    if (typeof window === 'undefined') return;
    
    // Check if migration already done
    if (localStorage.getItem(this.migrationKey)) {
      return { migrated: false, message: 'Already migrated' };
    }

    const migrationLog = [];
    const sensitiveKeys = [
      'auth_token',
      'registrationTempToken',
      'tempToken',
      'pending_verification_email',
      'pending_verification_name',
      'user_credentials'
    ];

    try {
      // Migrate sensitive data to sessionStorage (encrypted)
      sensitiveKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          secureStorage.setItem(key, value);
          localStorage.removeItem(key);
          migrationLog.push(`Migrated sensitive: ${key}`);
        }
      });

      // Keep non-sensitive data in localStorage
      const nonSensitiveKeys = [
        'darkMode',
        'preferredLanguage',
        'userPreferences',
        'recentSearches'
      ];

      nonSensitiveKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          // Just ensure it stays in localStorage
          migrationLog.push(`Kept non-sensitive: ${key}`);
        }
      });

      // Mark migration as complete
      localStorage.setItem(this.migrationKey, new Date().toISOString());

      return {
        migrated: true,
        log: migrationLog
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Migration failed:', error);
      }
      return {
        migrated: false,
        error: error.message
      };
    }
  }

  // Find and replace utility for codebase
  generateReplacements() {
    return {
      // Direct replacements
      "localStorage.setItem('auth_token'": "secureStorage.setItem('auth_token'",
      "localStorage.getItem('auth_token')": "secureStorage.getItem('auth_token')",
      "localStorage.removeItem('auth_token')": "secureStorage.removeItem('auth_token')",
      
      // Pattern-based replacements
      patterns: [
        {
          pattern: /localStorage\.setItem\(['"](.+?)['"],\s*(.+?)\)/g,
          replacement: (match, key, value) => {
            const sensitiveKeys = ['token', 'auth', 'session', 'credential'];
            const isSensitive = sensitiveKeys.some(k => key.toLowerCase().includes(k));
            return isSensitive 
              ? `secureStorage.setItem('${key}', ${value})`
              : match;
          }
        }
      ]
    };
  }
}

// Context wrapper to handle migration on app load
export const StorageMigrationProvider = ({ children }) => {
  const [migrationComplete, setMigrationComplete] = useState(false);
  
  useEffect(() => {
    const migration = new StorageMigration();
    migration.migrateExistingData().then(result => {
      if (result.migrated && process.env.NODE_ENV === 'development') {
        console.log('Storage migration completed:', result.log);
      }
      setMigrationComplete(true);
    });
  }, []);

  if (!migrationComplete) {
    return <div>Updating security settings...</div>;
  }

  return children;
};

// Helper hook for components
export const useSecureStorage = () => {
  const setSecureItem = (key, value) => {
    secureStorage.setItem(key, value);
  };

  const getSecureItem = (key) => {
    return secureStorage.getItem(key);
  };

  const removeSecureItem = (key) => {
    secureStorage.removeItem(key);
  };

  return {
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    storage: secureStorage
  };
};

// Example usage in components:
/*
import { useSecureStorage } from '../lib/storageMigration';

function MyComponent() {
  const { setSecureItem, getSecureItem } = useSecureStorage();
  
  // Instead of: localStorage.setItem('auth_token', token)
  setSecureItem('auth_token', token);
  
  // Instead of: localStorage.getItem('auth_token')
  const token = getSecureItem('auth_token');
}
*/
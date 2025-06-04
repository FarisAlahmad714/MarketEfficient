// lib/envSecurity.js
import crypto from 'crypto';

class EnvSecurity {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = this.deriveKey(process.env.MASTER_KEY || 'fallback-key');
  }

  deriveKey(masterKey) {
    return crypto.createHash('sha256').update(String(masterKey)).digest();
  }

  encryptEnvVar(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decryptEnvVar(encrypted) {
    try {
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }

  // Get secure environment variable
  getSecureEnv(key, encrypted = false) {
    const value = process.env[key];
    if (!value) return null;
    
    if (encrypted) {
      return this.decryptEnvVar(value);
    }
    
    return value;
  }

  // Validate environment setup
  validateSecureEnvironment() {
    const criticalVars = [
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'MONGODB_URI',
      'MAILJET_API_KEY'
    ];
    
    const issues = [];
    
    // Check critical variables
    criticalVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push(`Missing critical variable: ${varName}`);
      }
    });
    
    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      issues.push('JWT_SECRET should be at least 64 characters for production');
    }
    
    // Check for default/weak values
    const weakPatterns = ['secret', 'password', 'default', 'test', '123'];
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.includes('SECRET') || key.includes('KEY')) {
        weakPatterns.forEach(pattern => {
          if (value.toLowerCase().includes(pattern)) {
            issues.push(`Weak value detected in ${key}`);
          }
        });
      }
    });
    
    // Production-specific checks
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        issues.push('Production URL not properly configured');
      }
      
      if (!process.env.MASTER_KEY) {
        issues.push('MASTER_KEY required for production encryption');
      }
    }
    
    return {
      isSecure: issues.length === 0,
      issues
    };
  }
}

export default new EnvSecurity();

// Usage example:
// import envSecurity from './lib/envSecurity';
// 
// const dbUri = envSecurity.getSecureEnv('MONGODB_URI', true); // For encrypted vars
// const validation = envSecurity.validateSecureEnvironment();
// if (!validation.isSecure) {
//   console.error('Environment security issues:', validation.issues);
// }
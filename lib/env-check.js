// lib/env-check.js
import logger from './logger'; // Adjust path to your logger utility
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'EMAIL_FROM',
    'MAILJET_API_KEY',
    'MAILJET_SECRET_KEY'
  ];
  
  export function validateEnvironment() {
    const missing = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    });
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file'
      );
    }
    
    // Validate JWT_SECRET is strong enough
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    
    logger.log('✅ Environment variables validated');
  }
  
  // Run this check when the module is imported
  if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
  }
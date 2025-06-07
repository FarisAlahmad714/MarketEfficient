// lib/security-logger.js
import fs from 'fs';
import path from 'path';

class SecurityLogger {
  static logEvent(eventType, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      eventType,
      ...details
    };

    // Console log for development
    console.log(`[SECURITY] ${eventType}:`, JSON.stringify(details, null, 2));

    // In production, log to console only (Vercel doesn't allow file writes)
    // For a real production app, use external logging service like LogRocket, Sentry, etc.

    // For critical events, you could send alerts here
    if (['failed_login_lockout', 'suspicious_activity', 'unauthorized_admin_access'].includes(eventType)) {
      // Send email/SMS alert
      this.sendSecurityAlert(eventType, details);
    }
  }

  static sendSecurityAlert(eventType, details) {
    // Implement your alert mechanism here
    console.error(`🚨 SECURITY ALERT: ${eventType}`, details);
  }
}

export default SecurityLogger;
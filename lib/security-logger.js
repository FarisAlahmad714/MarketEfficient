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

    // Write to file (in production, use a proper logging service)
    if (process.env.NODE_ENV === 'production') {
      const logFile = path.join(process.cwd(), 'logs', `security-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }

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
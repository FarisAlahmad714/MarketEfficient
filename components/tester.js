import { useState } from 'react';

const StorageSecurityTester = () => {
  const [results, setResults] = useState(null);
  const [isSecure, setIsSecure] = useState(false);

  const runSecurityTest = () => {
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Check if auth tokens are encrypted
    const checkEncryption = () => {
      const authToken = localStorage.getItem('auth_token');
      const sessionToken = sessionStorage.getItem('_secure_auth_token');
      
      if (authToken && authToken.includes('U2FsdGVkX1')) {
        testResults.tests.push({
          name: 'Auth Token Encryption',
          status: 'PASS',
          message: 'Auth token is encrypted in localStorage'
        });
      } else if (sessionToken) {
        testResults.tests.push({
          name: 'Auth Token Encryption',
          status: 'PASS',
          message: 'Auth token is encrypted in sessionStorage'
        });
      } else if (authToken) {
        testResults.tests.push({
          name: 'Auth Token Encryption',
          status: 'FAIL',
          message: 'Auth token found in plain text!',
          severity: 'HIGH'
        });
      } else {
        testResults.tests.push({
          name: 'Auth Token Encryption',
          status: 'INFO',
          message: 'No auth token found'
        });
      }
    };

    // Test 2: Check for sensitive data in localStorage
    const checkSensitiveData = () => {
      const sensitivePatterns = [
        /token/i,
        /password/i,
        /secret/i,
        /api[_-]?key/i,
        /credit[_-]?card/i
      ];

      const plainTextSensitive = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        // Check if key contains sensitive patterns
        const isSensitiveKey = sensitivePatterns.some(pattern => pattern.test(key));
        
        if (isSensitiveKey && value && !value.includes('U2FsdGVkX1')) {
          plainTextSensitive.push(key);
        }
      }

      if (plainTextSensitive.length > 0) {
        testResults.tests.push({
          name: 'Sensitive Data Check',
          status: 'FAIL',
          message: `Found ${plainTextSensitive.length} sensitive keys in plain text`,
          details: plainTextSensitive,
          severity: 'HIGH'
        });
      } else {
        testResults.tests.push({
          name: 'Sensitive Data Check',
          status: 'PASS',
          message: 'No sensitive data found in plain text'
        });
      }
    };

    // Test 3: Session vs Local Storage Usage
    const checkStorageStrategy = () => {
      const sessionCount = sessionStorage.length;
      const localCount = localStorage.length;
      
      testResults.tests.push({
        name: 'Storage Strategy',
        status: 'INFO',
        message: `Using sessionStorage: ${sessionCount} items, localStorage: ${localCount} items`
      });
    };

    // Test 4: Check XSS Protection
    const checkXSSProtection = () => {
      try {
        // Try to inject a script tag
        const testKey = '_xss_test';
        const maliciousValue = '<script>alert("XSS")</script>';
        localStorage.setItem(testKey, maliciousValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === maliciousValue) {
          testResults.tests.push({
            name: 'XSS Protection',
            status: 'WARNING',
            message: 'Storage accepts script tags - ensure proper sanitization when displaying data',
            severity: 'MEDIUM'
          });
        }
      } catch (error) {
        testResults.tests.push({
          name: 'XSS Protection',
          status: 'INFO',
          message: 'XSS test completed'
        });
      }
    };

    // Test 5: Check for old/legacy tokens
    const checkLegacyTokens = () => {
      const legacyKeys = [
        'token',
        'user_token',
        'access_token',
        'refresh_token',
        'jwt_token'
      ];

      const foundLegacy = legacyKeys.filter(key => 
        localStorage.getItem(key) || sessionStorage.getItem(key)
      );

      if (foundLegacy.length > 0) {
        testResults.tests.push({
          name: 'Legacy Token Check',
          status: 'WARNING',
          message: `Found ${foundLegacy.length} legacy token keys`,
          details: foundLegacy,
          severity: 'MEDIUM'
        });
      } else {
        testResults.tests.push({
          name: 'Legacy Token Check',
          status: 'PASS',
          message: 'No legacy tokens found'
        });
      }
    };

    // Run all tests
    checkEncryption();
    checkSensitiveData();
    checkStorageStrategy();
    checkXSSProtection();
    checkLegacyTokens();

    // Calculate overall security score
    const failedTests = testResults.tests.filter(t => t.status === 'FAIL').length;
    const warningTests = testResults.tests.filter(t => t.status === 'WARNING').length;
    const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
    
    testResults.summary = {
      passed: passedTests,
      warnings: warningTests,
      failed: failedTests,
      score: Math.max(0, 100 - (failedTests * 25) - (warningTests * 10))
    };

    setIsSecure(failedTests === 0);
    setResults(testResults);
  };

  const clearResults = () => {
    setResults(null);
    setIsSecure(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      backgroundColor: '#1e1e1e',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: 400,
      color: '#e0e0e0',
      fontFamily: 'monospace',
      fontSize: 14,
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#90caf9' }}>
        🔒 Storage Security Tester
      </h3>
      
      {!results ? (
        <button
          onClick={runSecurityTest}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Run Security Tests
        </button>
      ) : (
        <div>
          <div style={{
            backgroundColor: results.summary.score >= 80 ? '#4caf50' : 
                           results.summary.score >= 60 ? '#ff9800' : '#f44336',
            padding: 10,
            borderRadius: 4,
            marginBottom: 15,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              Security Score: {results.summary.score}%
            </div>
            <div style={{ fontSize: 12 }}>
              {results.summary.passed} passed • 
              {results.summary.warnings} warnings • 
              {results.summary.failed} failed
            </div>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {results.tests.map((test, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  backgroundColor: '#2a2a2a',
                  borderRadius: 4,
                  borderLeft: `4px solid ${
                    test.status === 'PASS' ? '#4caf50' :
                    test.status === 'FAIL' ? '#f44336' :
                    test.status === 'WARNING' ? '#ff9800' : '#2196F3'
                  }`
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                  {test.status === 'PASS' && '✅'}
                  {test.status === 'FAIL' && '❌'}
                  {test.status === 'WARNING' && '⚠️'}
                  {test.status === 'INFO' && 'ℹ️'}
                  {' '}{test.name}
                </div>
                <div style={{ fontSize: 12 }}>{test.message}</div>
                {test.details && (
                  <div style={{ fontSize: 11, marginTop: 5, color: '#ff9800' }}>
                    Details: {test.details.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={clearResults}
            style={{
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              width: '100%',
              marginTop: 10
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default StorageSecurityTester;
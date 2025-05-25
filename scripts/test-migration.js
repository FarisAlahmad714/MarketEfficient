// scripts/test-migration.js
// Run with: node scripts/test-migration.js

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test credentials - you can set these in .env.local or use command line args
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || process.argv[2] || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || process.argv[3] || 'Test123!'
};

// Show usage if no credentials
if (process.argv.length > 2 && process.argv[2] === '--help') {
  console.log('\nUsage:');
  console.log('  node scripts/test-migration.js [email] [password]');
  console.log('\nExamples:');
  console.log('  node scripts/test-migration.js [email] [password]');
  console.log('  node scripts/test-migration.js [your-email] [your-password]');
  console.log('\nOr set in .env.local:');
  console.log('  TEST_USER_EMAIL=[your-email]');
  console.log('  TEST_USER_PASSWORD=[your-password]');
  process.exit(0);
}

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Helper function to log results
function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red : 
                colors.yellow;
  console.log(`${color}${message}${colors.reset}`);
}

// Test function for a single route
async function testRoute(name, config) {
  try {
    log(`\nTesting: ${name}`);
    
    const response = await axios({
      ...config,
      validateStatus: () => true // Don't throw on any status
    });
    
    const { status, data } = response;
    
    // Check if response matches expected
    if (config.expectedStatus && status !== config.expectedStatus) {
      log(`❌ Status mismatch: expected ${config.expectedStatus}, got ${status}`, 'error');
      return false;
    }
    
    if (config.expectedError && !data.error) {
      log(`❌ Expected error response but got success`, 'error');
      return false;
    }
    
    if (config.requiredFields) {
      const missingFields = config.requiredFields.filter(field => !data[field]);
      if (missingFields.length > 0) {
        log(`❌ Missing required fields: ${missingFields.join(', ')}`, 'error');
        return false;
      }
    }
    
    log(`✅ ${name} passed`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${name} failed: ${error.message}`, 'error');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting Migration Tests', 'info');
  
  let token = null;
  let passed = 0;
  let failed = 0;
  
  // Test 1: Login to get token
  try {
    log('Attempting login with test credentials...', 'info');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
    token = loginResponse.data.token;
    log('✅ Login successful', 'success');
  } catch (error) {
    log('❌ Login failed - cannot proceed with tests', 'error');
    log(`Error: ${error.response?.data?.error || error.message}`, 'error');
    log('\nTo fix this:', 'info');
    log('1. Create a test user: node scripts/create-test-user.js', 'info');
    log('2. Or use your credentials: node scripts/test-migration.js [email] [password]', 'info');
    log('3. Or add to .env.local:', 'info');
    log('   TEST_USER_EMAIL=[your-email]', 'info');
    log('   TEST_USER_PASSWORD=[your-password]', 'info');
    return;
  }
  
  // Define test cases
  const tests = [
    {
      name: 'Dashboard Metrics - Authenticated',
      config: {
        method: 'get',
        url: `${API_URL}/api/dashboard/user-metrics`,
        headers: { Authorization: `Bearer ${token}` },
        expectedStatus: 200,
        requiredFields: ['summary', 'trends']
      }
    },
    {
      name: 'Dashboard Metrics - No Auth',
      config: {
        method: 'get',
        url: `${API_URL}/api/dashboard/user-metrics`,
        expectedStatus: 401,
        expectedError: true
      }
    },
    {
      name: 'Dashboard Metrics - Invalid Token',
      config: {
        method: 'get',
        url: `${API_URL}/api/dashboard/user-metrics`,
        headers: { Authorization: 'Bearer invalid-token' },
        expectedStatus: 401,
        expectedError: true
      }
    },
    {
      name: 'Save Results - Wrong Method',
      config: {
        method: 'get',
        url: `${API_URL}/api/bias-test/save-results`,
        headers: { Authorization: `Bearer ${token}` },
        expectedStatus: 405,
        expectedError: true
      }
    },
    {
      name: 'Admin Route - Non-Admin User',
      config: {
        method: 'get',
        url: `${API_URL}/api/admin/users`,
        headers: { Authorization: `Bearer ${token}` },
        expectedStatus: 403,
        expectedError: true
      }
    }
  ];
  
  // Run all tests
  for (const test of tests) {
    const result = await testRoute(test.name, test.config);
    if (result) passed++;
    else failed++;
  }
  
  // Summary
  log('\n📊 Test Summary:', 'info');
  log(`Total: ${tests.length}`, 'info');
  log(`Passed: ${passed}`, 'success');
  log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Migration successful.', 'success');
  } else {
    log('\n⚠️  Some tests failed. Please check the implementation.', 'error');
  }
}

// Run the tests
runTests().catch(console.error);
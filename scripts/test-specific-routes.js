// scripts/test-specific-routes.js
// Comprehensive test suite for migrated routes
const logger = require('../lib/logger'); // Adjust path to your logger utility
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'http://localhost:3000';
let authToken = null;

// Test utilities
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  logger.log(`${colors[type]}${message}\x1b[0m`);
};

const runTest = async (testName, testFn) => {
  try {
    await testFn();
    log(`✅ ${testName} passed`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${testName} failed: ${error.message}`, 'error');
    return false;
  }
};

async function loginAndGetToken() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    authToken = response.data.token;
    log('✅ Login successful', 'success');
    return true;
  } catch (error) {
    log('❌ Login failed - tests cannot proceed', 'error');
    return false;
  }
}

async function main() {
  log('🧪 Starting Comprehensive Route Tests\n', 'info');
  
  // Login first
  const loginSuccess = await loginAndGetToken();
  if (!loginSuccess) return;
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Chart Data Fetching
  total++;
  if (await runTest('Chart Data - Fetch Chart', async () => {
    const response = await axios.get(`${API_URL}/api/charting-exam/fetch-chart`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.chart_data) throw new Error('Missing chart_data in response');
    if (!Array.isArray(response.data.chart_data)) throw new Error('chart_data should be array');
    if (response.data.chart_data.length === 0) throw new Error('chart_data should not be empty');
  })) passed++;
  
  // Test 2: Auth Me - Valid Token
  total++;
  if (await runTest('Auth Me - Valid Token', async () => {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.id) throw new Error('Missing user id in response');
    if (!response.data.email) throw new Error('Missing email in response');
  })) passed++;
  
  // Test 3: Auth Me - Invalid Token
  total++;
  if (await runTest('Auth Me - Invalid Token', async () => {
    try {
      await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      throw new Error('Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401, got ${error.response?.status}`);
      }
    }
  })) passed++;
  
  // Test 4: Bias Test Check Results - No Auth
  total++;
  if (await runTest('Bias Test Check Results - No Auth', async () => {
    const response = await axios.get(`${API_URL}/api/bias-test/check-results?session_id=test-session-123`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    // Should work without auth
  })) passed++;
  
  // Test 5: Bias Test Validate - Missing Auth
  total++;
  if (await runTest('Bias Test Validate - Missing Auth', async () => {
    try {
      await axios.post(`${API_URL}/api/bias-test/validate`, {
        predictions: ['bullish', 'bearish'],
        correctAnswers: ['bullish', 'bullish'],
        assetSymbol: 'BTC'
      });
      throw new Error('Should have failed without auth');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401, got ${error.response?.status}`);
      }
    }
  })) passed++;
  
  // Test 6: Bias Test Validate - Valid Auth & Data
  total++;
  if (await runTest('Bias Test Validate - Valid Request', async () => {
    const response = await axios.post(`${API_URL}/api/bias-test/validate`, {
      predictions: ['bullish', 'bearish'],
      correctAnswers: ['bullish', 'bullish'],
      assetSymbol: 'BTC',
      timeframe: '1d'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.success) throw new Error('Missing success field');
    if (typeof response.data.score !== 'number') throw new Error('Score should be a number');
  })) passed++;
  
  // Test 7: Admin Route - Non-Admin User
  total++;
  if (await runTest('Admin Users - Non-Admin Access', async () => {
    try {
      await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      throw new Error('Should have failed - test user is not admin');
    } catch (error) {
      if (error.response?.status !== 403) {
        throw new Error(`Expected 403, got ${error.response?.status}`);
      }
    }
  })) passed++;
  
  // Test 8: Leaderboard - Optional Auth
  total++;
  if (await runTest('Leaderboard - Works Without Auth', async () => {
    const response = await axios.get(`${API_URL}/api/leaderboard?testType=all&period=month`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data.leaderboard)) throw new Error('Leaderboard should be array');
  })) passed++;
  
  // Test 9: Leaderboard - Works With Auth (Enhanced)
  total++;
  if (await runTest('Leaderboard - Enhanced With Auth', async () => {
    const response = await axios.get(`${API_URL}/api/leaderboard?testType=all&period=month`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data.leaderboard)) throw new Error('Leaderboard should be array');
    // With auth, may include currentUserRank
  })) passed++;
  
  // Test 10: Assets - Static Data
  total++;
  if (await runTest('Assets - Static Data', async () => {
    const response = await axios.get(`${API_URL}/api/assets`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data)) throw new Error('Assets should be array');
    if (response.data.length === 0) throw new Error('Assets should not be empty');
  })) passed++;
  
  // Summary
  log(`\n📊 Test Summary:`, 'info');
  log(`Total: ${total}`, 'info');
  log(`Passed: ${passed}`, passed === total ? 'success' : 'warning');
  log(`Failed: ${total - passed}`, total - passed === 0 ? 'success' : 'error');
  
  if (passed === total) {
    log('\n🎉 All tests passed! Migration successful.', 'success');
  } else {
    log('\n⚠️  Some tests failed. Please check the implementation.', 'warning');
  }
}

main().catch(console.error); 
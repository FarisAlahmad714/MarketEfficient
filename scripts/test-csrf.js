// scripts/test-csrf.js
const fetch = require('node-fetch');

async function testCSRF() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing CSRF Protection\n');
  console.log('Make sure your Next.js server is running on port 3000\n');
  
  // Store cookies from responses
  let cookies = {};
  
  // Helper to extract cookies from response
  const extractCookies = (response) => {
    const raw = response.headers.raw()['set-cookie'];
    if (raw) {
      raw.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        cookies[name] = value;
      });
    }
  };
  
  // Test 1: Get CSRF token
  console.log('Test 1: Fetching CSRF token...');
  try {
    const tokenResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'GET',
      headers: {
        'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      }
    });
    
    extractCookies(tokenResponse);
    const data = await tokenResponse.json();
    
    if (data.csrfToken) {
      console.log('✅ Got CSRF token:', data.csrfToken.substring(0, 10) + '...');
      console.log('✅ CSRF cookie set:', cookies.csrf_token ? 'Yes' : 'No');
    } else {
      console.log('❌ No CSRF token in response');
    }
  } catch (error) {
    console.log('❌ Error fetching CSRF token:', error.message);
  }
  
  console.log('\n-------------------\n');
  
  // Test 2: Try POST without CSRF token
  console.log('Test 2: POST without CSRF token...');
  try {
    const noTokenResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      },
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
    });
    
    const result = await noTokenResponse.json();
    
    if (noTokenResponse.status === 403 && result.code === 'CSRF_VALIDATION_FAILED') {
      console.log('✅ Correctly rejected request without CSRF token');
      console.log('   Response:', result);
    } else {
      console.log('❌ SECURITY ISSUE: Request without CSRF token was accepted!');
      console.log('   Status:', noTokenResponse.status);
      console.log('   Response:', result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n-------------------\n');
  
  // Test 3: Try POST with CSRF token
  console.log('Test 3: POST with CSRF token...');
  try {
    const withTokenResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': cookies.csrf_token || '',
        'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      },
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
    });
    
    const result = await withTokenResponse.json();
    
    if (withTokenResponse.status !== 403 || result.code !== 'CSRF_VALIDATION_FAILED') {
      console.log('✅ Request with CSRF token was accepted (passed CSRF check)');
      console.log('   Status:', withTokenResponse.status);
      console.log('   Response:', result.error || result.message || 'Login attempted');
    } else {
      console.log('❌ FAILED: Request with valid CSRF token was rejected!');
      console.log('   Response:', result);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n-------------------\n');
  console.log('🏁 CSRF tests complete!');
  console.log('\nNext steps:');
  console.log('1. If all tests passed, your CSRF protection is working');
  console.log('2. Apply withCsrfProtect to all state-changing endpoints');
  console.log('3. Update all frontend forms to use authenticatedFetch from AuthContext');
}

testCSRF().catch(console.error);
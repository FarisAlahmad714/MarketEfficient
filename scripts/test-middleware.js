// scripts/test-middleware.js
// Tests the middleware functions directly without needing a running server
// Run with: node scripts/test-middleware.js

// Mock Next.js request/response objects
class MockRequest {
    constructor(options = {}) {
      this.headers = options.headers || {};
      this.method = options.method || 'GET';
      this.body = options.body || {};
      this.query = options.query || {};
      this.user = null;
    }
  }
  
  class MockResponse {
    constructor() {
      this.statusCode = 200;
      this.data = null;
      this.ended = false;
    }
  
    status(code) {
      this.statusCode = code;
      return this;
    }
  
    json(data) {
      this.data = data;
      this.ended = true;
      return this;
    }
  }
  
  // Test our middleware
  async function testMiddleware() {
    console.log('🧪 Testing Middleware Functions\n');
    
    // Test 1: No token
    console.log('Test 1: No Authentication Token');
    try {
      const { authenticate } = require('../middleware/auth');
      const middleware = authenticate({ required: true });
      
      const req = new MockRequest();
      const res = new MockResponse();
      
      await middleware(req, res, () => {});
      
      if (res.statusCode === 401 && res.data.error === 'Authorization token required') {
        console.log('✅ Correctly rejected request without token\n');
      } else {
        console.log('❌ Failed to reject request without token\n');
      }
    } catch (error) {
      console.log('❌ Error:', error.message, '\n');
    }
    
    // Test 2: Invalid token format
    console.log('Test 2: Invalid Token Format');
    try {
      const { authenticate } = require('../middleware/auth');
      const middleware = authenticate({ required: true });
      
      const req = new MockRequest({
        headers: { authorization: 'InvalidFormat' }
      });
      const res = new MockResponse();
      
      await middleware(req, res, () => {});
      
      if (res.statusCode === 401) {
        console.log('✅ Correctly rejected invalid token format\n');
      } else {
        console.log('❌ Failed to reject invalid token format\n');
      }
    } catch (error) {
      console.log('❌ Error:', error.message, '\n');
    }
    
    // Test 3: API Handler wrapper
    console.log('Test 3: API Handler Method Checking');
    try {
      const { createApiHandler } = require('../lib/api-handler');
      
      const handler = createApiHandler(
        async (req, res) => {
          res.status(200).json({ success: true });
        },
        { methods: ['POST'] }
      );
      
      // Test with GET (should fail)
      const req = new MockRequest({ method: 'GET' });
      const res = new MockResponse();
      
      await handler(req, res);
      
      if (res.statusCode === 405 && res.data.error === 'Method not allowed') {
        console.log('✅ Correctly rejected wrong HTTP method\n');
      } else {
        console.log('❌ Failed to reject wrong HTTP method\n');
      }
    } catch (error) {
      console.log('❌ Error:', error.message, '\n');
    }
    
    // Test 4: Optional auth
    console.log('Test 4: Optional Authentication');
    try {
      const { authenticate } = require('../middleware/auth');
      const middleware = authenticate({ required: false });
      
      const req = new MockRequest();
      const res = new MockResponse();
      let nextCalled = false;
      
      await middleware(req, res, () => {
        nextCalled = true;
      });
      
      if (nextCalled && req.user === null) {
        console.log('✅ Optional auth correctly allows unauthenticated requests\n');
      } else {
        console.log('❌ Optional auth failed\n');
      }
    } catch (error) {
      console.log('❌ Error:', error.message, '\n');
    }
    
    console.log('🏁 Middleware tests complete!');
    console.log('\nNote: These tests verify the middleware logic works correctly.');
    console.log('To test with real authentication, you need to:');
    console.log('1. Run: node scripts/create-test-user.js');
    console.log('2. Then: node scripts/test-migration.js');
  }
  
  // Run tests
  testMiddleware().catch(console.error);
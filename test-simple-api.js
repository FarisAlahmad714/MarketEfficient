// Quick test to verify our simplified API dependencies
console.log('Testing simplified API dependencies...');

async function testDependencies() {
  try {
    // Set a fake env var to test imports
    process.env.MONGODB_URI = 'mongodb://fake';
    
    // Test database connection module
    const connectDB = require('./lib/database');
    console.log('✅ Database module loaded');
    
    // Test models
    const SandboxPortfolio = require('./models/SandboxPortfolio');
    const SandboxTrade = require('./models/SandboxTrade');
    console.log('✅ Models loaded');
    
    console.log('✅ All dependencies for simplified API are available');
    console.log('\n🎯 The simplified API should work. Try testing it now in your browser.');
    
  } catch (error) {
    console.error('❌ Dependency error:', error.message);
    process.exit(1);
  }
}

testDependencies();
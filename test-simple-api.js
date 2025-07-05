// Quick test to verify our simplified API dependencies

async function testDependencies() {
  try {
    // Set a fake env var to test imports
    process.env.MONGODB_URI = 'mongodb://fake';
    
    // Test database connection module
    const connectDB = require('./lib/database');
    
    // Test models
    const SandboxPortfolio = require('./models/SandboxPortfolio');
    const SandboxTrade = require('./models/SandboxTrade');
    
    
  } catch (error) {
    process.exit(1);
  }
}

testDependencies();
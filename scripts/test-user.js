// scripts/create-test-user.js
// Run with: node scripts/create-test-user.js
// This script creates a test user in your MongoDB database for testing purposes.
const logger = require('../lib/logger'); // Adjust path to your logger utility
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing in your .env.local file');
  process.exit(1);
}

// User schema (matching your existing schema)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isVerified: Boolean,
  isAdmin: Boolean,
  createdAt: Date
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.log('Connected to MongoDB');
    
    // Test user details
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!';
    const testName = 'Test User';
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      logger.log('Test user already exists - updating credentials');
      
      // Update password in case it's different
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      existingUser.password = hashedPassword;
      existingUser.isVerified = true; // Make sure it's verified
      await existingUser.save();
      
      logger.log('Test user password updated');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const testUser = new User({
        name: testName,
        email: testEmail,
        password: hashedPassword,
        isVerified: true, // Pre-verify for testing
        isAdmin: false,
        createdAt: new Date()
      });
      
      await testUser.save();
      logger.log(`Test user created successfully`);
    }
    
    logger.log('\n✅ Test user ready:');
    logger.log('Email: [HIDDEN FOR SECURITY]');
    logger.log('Password: [HIDDEN FOR SECURITY]');
    logger.log('\nYou can now run: node scripts/test-migration.js');
    
    // Close connection
    setTimeout(() => {
      mongoose.connection.close();
    }, 1000);
  } catch (error) {
    console.error('Error creating test user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createTestUser();
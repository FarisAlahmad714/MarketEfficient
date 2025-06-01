const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User.js');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyAdminAccount() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Find your admin account by email
    const adminEmail = 'support@chartsense.trade'; // CHANGE THIS to your admin email
    
    const user = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (!user) {
      console.error('User not found with email:', adminEmail);
      process.exit(1);
    }
    
    // Update user to be verified and admin
    user.isVerified = true;
    user.isAdmin = true;
    user.verificationToken = undefined; // Clear any verification token
    
    await user.save();
    
    console.log('✅ Admin account verified successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('isAdmin:', user.isAdmin);
    console.log('isVerified:', user.isVerified);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verifyAdminAccount();
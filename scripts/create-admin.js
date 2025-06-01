// scripts/create-admin.js
require('dotenv').config({ path: '.env.local' }); // This loads variables from .env.local
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
 // Adjust path to your logger utility
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing in your .env.local file');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

// Load User model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isVerified: Boolean,
  isAdmin: Boolean,
  createdAt: Date
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    // Admin details - from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    
    console.log('Attempting to create/update admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.isAdmin = true;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('User has been updated to admin status');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const newAdmin = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        isVerified: true,
        isAdmin: true,
        createdAt: new Date()
      });
      
      await newAdmin.save();
      console.log('Admin user created successfully');
    }
    
    // Close connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }, 1000);
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();
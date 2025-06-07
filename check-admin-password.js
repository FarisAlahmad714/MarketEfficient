// Check what password is actually stored for admin
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  isAdmin: Boolean
});

const User = mongoose.model('User', UserSchema);

async function checkAdminPassword() {
  await connectDB();
  
  const adminEmail = process.env.ADMIN_EMAIL || 'support@chartsense.trade';
  const adminUser = await User.findOne({ email: adminEmail });
  
  if (!adminUser) {
    console.log('Admin user not found!');
    process.exit(1);
  }
  
  console.log('Admin user found:');
  console.log('Email:', adminUser.email);
  console.log('Name:', adminUser.name);
  console.log('IsAdmin:', adminUser.isAdmin);
  
  // Test different possible passwords
  const testPasswords = [
    'CHARTSENSEI714',
    'chartsensei714', 
    '123',
    'admin123',
    process.env.ADMIN_PASSWORD
  ];
  
  console.log('\nTesting passwords:');
  for (const pwd of testPasswords) {
    if (pwd) {
      const isMatch = await bcrypt.compare(pwd, adminUser.password);
      console.log(`Password "${pwd}": ${isMatch ? 'MATCH!' : 'No match'}`);
    }
  }
  
  process.exit(0);
}

checkAdminPassword().catch(console.error);
// Run this locally to unlock admin account
const mongoose = require('mongoose');
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
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
});

const User = mongoose.model('User', UserSchema);

async function unlockAdmin() {
  await connectDB();
  
  const adminEmail = process.env.ADMIN_EMAIL || 'support@chartsense.trade';
  
  const result = await User.updateOne(
    { email: adminEmail },
    { 
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 0 }
    }
  );
  
  console.log('Unlock result:', result);
  console.log('Admin account unlocked successfully!');
  process.exit(0);
}

unlockAdmin().catch(console.error);
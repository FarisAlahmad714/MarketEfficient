// Fix admin password directly in database
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
  loginAttempts: Number,
  lockUntil: Date
});

const User = mongoose.model('User', UserSchema);

async function fixAdminPassword() {
  await connectDB();
  
  const adminEmail = process.env.ADMIN_EMAIL || 'support@chartsense.trade';
  const newPassword = 'CHARTSENSEI714'; // Your desired password
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  const result = await User.updateOne(
    { email: adminEmail },
    { 
      password: hashedPassword,
      loginAttempts: 0,
      $unset: { lockUntil: 1 }
    }
  );
  
  console.log('Password update result:', result);
  console.log(`Admin password updated to: ${newPassword}`);
  console.log('Login attempts reset and account unlocked');
  
  // Verify the new password works
  const adminUser = await User.findOne({ email: adminEmail });
  const isMatch = await bcrypt.compare(newPassword, adminUser.password);
  console.log(`Password verification: ${isMatch ? 'SUCCESS!' : 'FAILED'}`);
  
  process.exit(0);
}

fixAdminPassword().catch(console.error);
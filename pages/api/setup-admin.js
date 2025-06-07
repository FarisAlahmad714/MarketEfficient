// One-time admin setup for production
import connectDB from '../../lib/database';
import User from '../../models/User';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Only allow this in development or with specific secret
  const setupSecret = req.body.setupSecret;
  if (setupSecret !== 'create-admin-2024') {
    return res.status(403).json({ error: 'Invalid setup secret' });
  }

  try {
    await connectDB();

    // Check if admin already exists and delete if found (for password update)
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'support@chartsense.trade' 
    });

    if (existingAdmin) {
      await User.deleteOne({ _id: existingAdmin._id });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'admin123', 
      12
    );

    const adminUser = new User({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'support@chartsense.trade',
      password: hashedPassword,
      isVerified: true,
      isAdmin: true,
      subscription: {
        status: 'active',
        plan: 'premium',
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    await adminUser.save();

    res.status(201).json({ 
      message: 'Admin user created successfully',
      email: adminUser.email 
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
}
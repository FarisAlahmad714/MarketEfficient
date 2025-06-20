// pages/api/user/generate-username.js
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { authenticate } from '../../../middleware/auth';
import logger from '../../../lib/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectDB();

  const userId = req.user.id || req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // If user already has a username, return it
    if (user.username) {
      return res.status(200).json({ 
        username: user.username,
        message: 'Username already exists'
      });
    }

    // Generate a username based on user's name or email
    let baseUsername = '';
    if (user.name) {
      // Use name, remove spaces and special characters, make lowercase
      baseUsername = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15);
    } else {
      // Use email prefix if no name
      baseUsername = user.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15);
    }

    // Ensure it starts with a letter
    if (!/^[a-z]/.test(baseUsername)) {
      baseUsername = 'user' + baseUsername;
    }

    // Find an available username
    let username = baseUsername;
    let counter = 1;
    
    while (true) {
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        break;
      }
      username = `${baseUsername}${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 9999) {
        username = `user${Date.now().toString().slice(-6)}`;
        break;
      }
    }

    // Update user with new username
    user.username = username;
    await user.save();

    logger.log(`Generated username ${username} for user ${userId}`);

    return res.status(200).json({ 
      username,
      message: 'Username generated successfully'
    });

  } catch (error) {
    logger.error('Error generating username:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to generate username.', details: error.message });
  }
}

export default async function (req, res) {
  const authMiddleware = authenticate({ required: true });
  
  return new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => {
      if (err) return reject(err);
      handler(req, res).then(resolve).catch(reject);
    });
  });
};
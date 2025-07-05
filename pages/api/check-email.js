import connectDB from '../../lib/database';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    await connectDB();
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    res.status(200).json({ isAvailable: !existingUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
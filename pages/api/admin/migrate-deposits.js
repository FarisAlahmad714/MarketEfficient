import { authenticate } from '../../../middleware/auth';
import connectDB from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply authentication middleware (admin only)
  return new Promise((resolve) => {
    authenticate({ adminOnly: true })(req, res, async () => {
      try {
        await connectDB();
        
        return res.status(200).json({
          success: true,
          message: 'Migration functionality has been removed',
          type: 'info'
        });
        
      } catch (error) {
        
        return res.status(500).json({
          error: 'Migration failed',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
      resolve();
    });
  });
}

// Increase timeout for long-running migration
export const config = {
  api: {
    responseLimit: false,
    timeout: 300000, // 5 minutes
  },
};
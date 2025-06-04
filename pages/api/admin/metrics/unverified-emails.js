import connectDB from '../../../../lib/database';
import User from '../../../../models/User';
import logger from '../../../../lib/logger';
// import { getSession } from 'next-auth/react'; // Or your preferred session management

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // TODO: Add robust authentication and authorization check to ensure only admin can access
  // const session = await getSession({ req });
  // if (!session || !session.user || !session.user.isAdmin) {
  //   logger.warn('[admin/metrics/unverified-emails] Unauthorized access attempt');
  //   return res.status(403).json({ message: 'Forbidden: Admin access required' });
  // }

  try {
    await connectDB();

    const unverifiedCount = await User.countDocuments({ isVerified: false });

    logger.info(`[admin/metrics/unverified-emails] Fetched unverified user count: ${unverifiedCount}`);
    return res.status(200).json({
      metric: 'unverifiedEmails',
      value: unverifiedCount,
      description: 'Total number of users pending email verification.'
    });

  } catch (error) {
    logger.error('[admin/metrics/unverified-emails] Error fetching unverified user count:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 
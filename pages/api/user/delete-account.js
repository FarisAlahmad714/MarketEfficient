import connectDB from '../../../lib/database';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import Payment from '../../../models/Payment';
import PaymentHistory from '../../../models/PaymentHistory';
import TestResults from '../../../models/TestResults';
import { authenticate } from '../../../middleware/auth'; // IMPORT THE REAL MIDDLEWARE
import { cancelStripeSubscription } from '../../../lib/stripe-service'; // IMPORT Stripe service
import { deleteImageFromGCS } from '../../../lib/gcs-service'; // IMPORT GCS service
import logger from '../../../lib/logger';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectDB();

  const userId = req.user.id || req.user._id; // Get userId from authenticated user

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Step 1: Cancel Stripe subscription if it exists
    const subscription = await Subscription.findOne({ userId: userId });
    if (subscription && subscription.stripeSubscriptionId) {
      try {
        await cancelStripeSubscription(subscription.stripeSubscriptionId);
        logger.log(`Stripe subscription cancelled for user during account deletion`);
      } catch (stripeError) {
        logger.error(`Failed to cancel Stripe subscription for user during account deletion:`, stripeError);
        // Decide if this is a fatal error. For now, we'll log and continue with account deletion.
        // For a stricter approach, you might return an error here.
        // return res.status(500).json({ error: 'Failed to cancel Stripe subscription. Account deletion halted.' });
      }
    }

    // Step 2: Delete profile image from GCS if it exists
    if (user.profileImageGcsPath) {
      try {
        await deleteImageFromGCS(user.profileImageGcsPath);
        logger.log(`Profile image deleted from GCS during account deletion`);
      } catch (gcsError) {
        logger.warn(`Failed to delete GCS image during account deletion:`, gcsError.message);
        // Non-fatal, proceed with deleting user data from DB
      }
    }

    // Step 3: Delete user-related data from the database
    // Consider using a transaction here if your DB supports it for atomicity
    await Payment.deleteMany({ userId: userId });
    await PaymentHistory.deleteMany({ userId: userId });
    await Subscription.deleteMany({ userId: userId }); // or findOneAndDelete if only one is expected
    await TestResults.deleteMany({ userId: userId });
    await User.findByIdAndDelete(userId);

    // Invalidate session/token on the client-side after this by having client call logout

    return res.status(200).json({ message: 'Account and related data deleted successfully.' });

  } catch (error) {
    logger.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Failed to delete account.', details: error.message });
  }
}

export default authenticate(handler); 
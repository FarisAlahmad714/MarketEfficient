// pages/api/[[...path]].js - Catch-all API route to apply activity tracking
import { trackUserActivity } from '../../middleware/activityTracker';

export default function handler(req, res) {
  // Apply activity tracking middleware
  trackUserActivity(req, res, () => {
    // If no specific API route matched, return 404
    res.status(404).json({ error: 'API route not found' });
  });
}
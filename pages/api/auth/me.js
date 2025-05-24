// pages/api/auth/me.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';

async function meHandler(req, res) {
  // User is already authenticated and attached to req.user via middleware
  // The middleware already fetched the user from the database
  
  // Return user info (password already excluded by middleware)
  return res.status(200).json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    isVerified: req.user.isVerified
  });
}

// Export with required auth
export default createApiHandler(
  composeMiddleware(requireAuth, meHandler),
  { methods: ['GET'] }
);
// pages/api/.js
import { requireAuth } from '../../middleware/auth';

function testHandler(req, res) {
  // If we get here, authentication worked!
  return res.status(200).json({
    message: 'Authentication successful!',
    user: req.user,
    authMethod: req.headers.cookie ? 'cookie' : 'header'
  });
}

export default requireAuth(testHandler);
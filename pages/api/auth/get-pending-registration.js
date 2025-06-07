import jwt from 'jsonwebtoken';
import logger from '../../../lib/logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Verify and decode the temporary token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the token is of the correct type
    if (decoded.type !== 'registration_intent') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Return the registration data (excluding sensitive JWT properties)
    const { name, email, promoCode, plan } = decoded;

    res.status(200).json({
      name,
      email,
      promoCode,
      plan,
    });
  } catch (error) {
    logger.error('Failed to get pending registration data:', error.message);
    res.status(401).json({ 
      error: 'Invalid or expired session token. Please start the registration process again.',
      shouldRetry: true,
    });
  }
}

export default handler; 
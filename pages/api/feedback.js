import { createApiHandler } from '../../lib/api-handler';
import { composeMiddleware } from '../../lib/api-handler';
import { sanitizeInput } from '../../middleware/sanitization';
import { apiRateLimit, strictRateLimit } from '../../middleware/rateLimit';
import { withCsrfProtect } from '../../middleware/csrf';
import Feedback from '../../models/Feedback';
import User from '../../models/User';
import connectDB from '../../lib/database';
import logger from '../../lib/logger';
import { sanitizeError } from '../../lib/error-handler';
import { validateFeedback, ValidationError } from '../../lib/validation';
import jwt from 'jsonwebtoken';

async function feedbackHandler(req, res) {
  try {
    await connectDB();

    if (req.method === 'POST') {
      return await handleFeedbackSubmission(req, res);
    } else if (req.method === 'GET') {
      return await handleFeedbackRetrieval(req, res);
    } else if (req.method === 'PATCH') {
      return await handleFeedbackUpdate(req, res);
    } else if (req.method === 'DELETE') {
      return await handleFeedbackDeletion(req, res);
    } else {
      res.setHeader('Allow', ['POST', 'GET', 'PATCH', 'DELETE']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    return res.status(500).json(sanitizedError);
  }
}

async function handleFeedbackSubmission(req, res) {
  logger.log('Feedback submission attempt:', {
    body: req.body,
    headers: {
      'x-csrf-token': req.headers['x-csrf-token'],
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    },
    cookies: req.cookies
  });

  // Validate and sanitize input
  let validatedData;
  try {
    validatedData = validateFeedback(req.body);
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.log('Validation failed:', error.message);
      return res.status(400).json({ 
        error: error.message,
        field: error.field 
      });
    }
    throw error; // Re-throw unexpected errors
  }

  const { type, subject, message, rating } = validatedData;
  let userId = null;
  let userEmail = null;
  let userName = null;

  // Check if user is authenticated (optional)
  const token = req.cookies?.auth_token;
  logger.log('Authentication check:', { 
    hasToken: !!token, 
    tokenLength: token?.length,
    cookies: Object.keys(req.cookies || {})
  });
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.log('Token decoded successfully:', { userId: decoded.userId });
      
      const user = await User.findById(decoded.userId);
      if (user) {
        userId = user._id;
        userEmail = user.email;
        userName = user.name;
        logger.log('User found:', { email: userEmail, name: userName });
      } else {
        logger.log('No user found for decoded userId');
      }
    } catch (error) {
      // Token invalid but still allow anonymous feedback
      logger.log('Invalid token in feedback submission, proceeding as anonymous:', error.message);
    }
  } else {
    logger.log('No auth token found, proceeding as anonymous');
  }

  // Create feedback record
  const feedback = new Feedback({
    userId,
    userEmail,
    userName,
    type,
    subject,
    message,
    rating: rating || undefined,
    browserInfo: {
      userAgent: req.headers['user-agent'] || '',
      url: req.headers.referer || '',
      timestamp: new Date()
    }
  });

  try {
    await feedback.save();
    logger.log(`Feedback saved successfully: ${subject} from ${userEmail || 'anonymous'}`);

    const response = {
      message: 'Feedback submitted successfully! Thank you for helping us improve.',
      feedbackId: feedback._id
    };
    
    logger.log('Sending success response:', response);
    return res.status(201).json(response);
  } catch (saveError) {
    logger.error('Error saving feedback:', saveError);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
}

async function handleFeedbackRetrieval(req, res) {
  // Admin-only endpoint to retrieve feedback
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get query parameters for filtering
    const { 
      status = 'all', 
      type = 'all', 
      page = 1, 
      limit = 20,
      sort = 'newest'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (type !== 'all') filter.type = type;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'priority':
        sortObj = { priority: -1, createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Execute query with pagination
    const feedbacks = await Feedback.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email')
      .populate('resolvedBy', 'name email');

    // Get total count for pagination
    const totalFeedbacks = await Feedback.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const typeCounts = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Convert status counts to the format expected by the frontend
    const stats = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    stats.total = totalFeedbacks;

    return res.status(200).json({
      feedback: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalFeedbacks,
        pages: Math.ceil(totalFeedbacks / parseInt(limit))
      },
      stats
    });

  } catch (error) {
    logger.error('Error retrieving feedback:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function handleFeedbackUpdate(req, res) {
  // Admin-only endpoint to update feedback status
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { feedbackId, status, priority, notes } = req.body;

    if (!feedbackId) {
      return res.status(400).json({ error: 'Feedback ID is required' });
    }

    // Build update object
    const updateObj = {};
    if (status) updateObj.status = status;
    if (priority !== undefined) updateObj.priority = priority;
    if (notes) updateObj.adminNotes = notes;
    
    // Add resolver info if status is being changed to resolved
    if (status === 'resolved' || status === 'closed') {
      updateObj.resolvedBy = user._id;
      updateObj.resolvedAt = new Date();
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateObj,
      { new: true }
    ).populate('userId', 'name email').populate('resolvedBy', 'name email');

    if (!updatedFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    logger.log(`Feedback ${feedbackId} updated by admin ${user.email}: status=${status}`);

    return res.status(200).json({
      message: 'Feedback updated successfully',
      feedback: updatedFeedback
    });

  } catch (error) {
    logger.error('Error updating feedback:', error);
    return res.status(500).json({ error: 'Failed to update feedback' });
  }
}

async function handleFeedbackDeletion(req, res) {
  // Admin-only endpoint to delete feedback
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { feedbackId } = req.body;

    if (!feedbackId) {
      return res.status(400).json({ error: 'Feedback ID is required' });
    }

    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!deletedFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    logger.log(`Feedback ${feedbackId} deleted by admin ${user.email}`);

    return res.status(200).json({
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting feedback:', error);
    return res.status(500).json({ error: 'Failed to delete feedback' });
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apply rate limiting
  const rateLimiter = req.method === 'POST' ? strictRateLimit : apiRateLimit;
  
  return new Promise((resolve) => {
    rateLimiter(req, res, async () => {
      try {
        await feedbackHandler(req, res);
        resolve();
      } catch (error) {
        const sanitizedError = sanitizeError(error);
        res.status(500).json(sanitizedError);
        resolve();
      }
    });
  });
};
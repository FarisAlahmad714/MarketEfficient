import { createApiHandler } from '../../../lib/api-handler';
import { requireAdmin } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import User from '../../../models/User';
import AdminAction from '../../../models/AdminAction';

const SUPER_ADMIN_EMAIL = 'support@chartsense.trade';

async function promoteUserHandler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    // Additional check: only superadmin can promote users
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ 
        error: 'Unauthorized. Only super admin can promote users.' 
      });
    }

    const { userId, action } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!['promote', 'demote'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "promote" or "demote"' });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-demotion
    if (action === 'demote' && targetUser.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ error: 'Cannot demote super admin' });
    }

    // Update admin status
    const previousStatus = targetUser.isAdmin;
    targetUser.isAdmin = action === 'promote';
    await targetUser.save();

    // Log the action
    await AdminAction.create({
      adminUserId: req.user._id || req.user.id,
      action: action === 'promote' ? 'user_access_granted' : 'user_access_revoked',
      targetType: 'user',
      targetId: userId,
      targetIdentifier: targetUser.email,
      description: `${action === 'promote' ? 'Promoted' : 'Demoted'} user ${targetUser.email} ${action === 'promote' ? 'to' : 'from'} admin role`,
      category: 'user_management',
      severity: 'high',
      details: {
        previousValues: { isAdmin: previousStatus },
        newValues: { isAdmin: targetUser.isAdmin },
        reason: 'Admin role management via super admin interface'
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: `User ${action === 'promote' ? 'promoted to' : 'demoted from'} admin`,
      user: {
        id: targetUser._id,
        email: targetUser.email,
        username: targetUser.username,
        isAdmin: targetUser.isAdmin
      }
    });

  } catch (error) {
    console.error('Error in promote-user:', error);
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
}

export default createApiHandler(
  composeMiddleware(requireAdmin, promoteUserHandler),
  { methods: ['POST'] }
);
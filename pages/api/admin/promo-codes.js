import PromoCode from '../../../models/PromoCode';
import User from '../../../models/User';
import AdminAction from '../../../models/AdminAction';
import connectDB from '../../../lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Verify admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const admin = await User.findById(decoded.userId);
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        return await getPromoCodes(req, res);
      case 'POST':
        return await createPromoCode(req, res, admin);
      case 'PUT':
        return await updatePromoCode(req, res, admin);
      case 'DELETE':
        return await deactivatePromoCode(req, res, admin);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Promo codes API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPromoCodes(req, res) {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    
    const query = {};
    
    // Search filter with regex injection protection
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { code: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const promoCodes = await PromoCode.find(query)
      .populate('createdBy', 'name email')
      .populate('usedBy.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PromoCode.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      promoCodes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
}

async function createPromoCode(req, res, admin) {
  try {
    const {
      code,
      type,
      discountType,
      discountValue,
      finalPrice,
      description,
      maxUses = 1,
      validUntil,
      applicablePlans = ['both']
    } = req.body;

    // Validate required fields
    if (!code || !type || !discountType || discountValue === undefined || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure applicablePlans is an array
    const plansArray = Array.isArray(applicablePlans) ? applicablePlans : [applicablePlans];

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    // Create promo code
    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      type,
      discountType,
      discountValue,
      finalPrice,
      description,
      maxUses,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      applicablePlans: plansArray,
      createdBy: admin._id
    });

    await promoCode.save();

    // Log admin action
    await AdminAction.logAction({
      adminUserId: admin._id,
      action: 'promo_code_created',
      targetType: 'promo_code',
      targetId: promoCode._id,
      targetIdentifier: promoCode.code,
      description: `Created promo code: ${promoCode.code}`,
      details: {
        code: promoCode.code,
        type: promoCode.type,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        maxUses: promoCode.maxUses
      },
      category: 'financial',
      severity: 'medium'
    });

    res.status(201).json({
      message: 'Promo code created successfully',
      promoCode
    });

  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
}

async function updatePromoCode(req, res, admin) {
  try {
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Promo code ID is required' });
    }

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Store previous values for audit
    const previousValues = {
      description: promoCode.description,
      maxUses: promoCode.maxUses,
      validUntil: promoCode.validUntil,
      isActive: promoCode.isActive
    };

    // Update allowed fields
    const allowedUpdates = ['description', 'maxUses', 'validUntil', 'isActive', 'type', 'applicablePlans'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        promoCode[field] = updates[field];
      }
    });

    await promoCode.save();

    // Log admin action
    await AdminAction.logAction({
      adminUserId: admin._id,
      action: 'promo_code_updated',
      targetType: 'promo_code',
      targetId: promoCode._id,
      targetIdentifier: promoCode.code,
      description: `Updated promo code: ${promoCode.code}`,
      details: {
        previousValues,
        newValues: updates
      },
      category: 'financial',
      severity: 'low'
    });

    res.status(200).json({
      message: 'Promo code updated successfully',
      promoCode
    });

  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
}

async function deactivatePromoCode(req, res, admin) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Promo code ID is required' });
    }

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    promoCode.isActive = false;
    await promoCode.save();

    // Log admin action
    await AdminAction.logAction({
      adminUserId: admin._id,
      action: 'promo_code_deactivated',
      targetType: 'promo_code',
      targetId: promoCode._id,
      targetIdentifier: promoCode.code,
      description: `Deactivated promo code: ${promoCode.code}`,
      details: {
        reason: 'Admin deactivation'
      },
      category: 'financial',
      severity: 'medium'
    });

    res.status(200).json({
      message: 'Promo code deactivated successfully',
      promoCode
    });

  } catch (error) {
    console.error('Error deactivating promo code:', error);
    res.status(500).json({ error: 'Failed to deactivate promo code' });
  }
} 
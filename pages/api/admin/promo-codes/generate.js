import PromoCode from '../../../../models/PromoCode';
import User from '../../../../models/User';
import AdminAction from '../../../../models/AdminAction';
import connectDB from '../../../../lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const { baseCodeId, suffix, quantity = 1, description, maxUses = 1, validUntil } = req.body;

    // Validate input
    if (!baseCodeId) {
      return res.status(400).json({ error: 'Base code ID is required' });
    }

    if (quantity < 1 || quantity > 50) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 50' });
    }

    if (maxUses < 1 || maxUses > 1000) {
      return res.status(400).json({ error: 'Max uses must be between 1 and 1000' });
    }

    // Get the base promo code template
    const baseCode = await PromoCode.findById(baseCodeId);
    if (!baseCode) {
      return res.status(404).json({ error: 'Base promo code not found' });
    }

    if (baseCode.type !== 'preset') {
      return res.status(400).json({ error: 'Can only generate codes from preset templates' });
    }

    const generatedCodes = [];
    const errors = [];

    for (let i = 0; i < quantity; i++) {
      try {
        let newCode;
        
        if (suffix) {
          // Use provided suffix
          newCode = `${baseCode.code}${suffix}`;
          if (quantity > 1) {
            newCode = `${baseCode.code}${suffix}${i + 1}`;
          }
        } else {
          // Generate random suffix
          const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
          newCode = `${baseCode.code}${randomSuffix}`;
        }

        // Check if code already exists
        const existingCode = await PromoCode.findOne({ code: newCode });
        if (existingCode) {
          errors.push(`Code ${newCode} already exists`);
          continue;
        }

        // Create new promo code based on template
        const promoCode = new PromoCode({
          code: newCode,
          type: 'generated', // Mark as generated from template
          discountType: baseCode.discountType,
          discountValue: baseCode.discountValue,
          finalPrice: baseCode.finalPrice,
          description: description || `Generated ${baseCode.code} code - ${baseCode.description}`,
          maxUses: maxUses, // Default to single use for generated codes
          validUntil: validUntil ? new Date(validUntil) : null, // Optional expiration
          applicablePlans: ['both'], // Generated codes work for all plans
          createdBy: admin._id,
          // Store reference to base template
          baseTemplate: baseCodeId
        });

        await promoCode.save();
        generatedCodes.push(promoCode);

      } catch (error) {
        errors.push(`Failed to generate code ${i + 1}: ${error.message}`);
      }
    }

    // Log admin action
    await AdminAction.logAction({
      adminUserId: admin._id,
      action: 'promo_codes_generated',
      targetType: 'promo_code',
      targetId: baseCodeId,
      targetIdentifier: baseCode.code,
      description: `Generated ${generatedCodes.length} codes from template ${baseCode.code}`,
      details: {
        baseTemplate: baseCode.code,
        suffix: suffix || 'random',
        quantity: quantity,
        successfullyGenerated: generatedCodes.length,
        errors: errors,
        generatedCodes: generatedCodes.map(code => code.code)
      },
      category: 'financial',
      severity: 'medium'
    });

    res.status(201).json({
      message: `Successfully generated ${generatedCodes.length} promo codes`,
      generatedCodes: generatedCodes.map(code => ({
        id: code._id,
        code: code.code,
        description: code.description,
        discountType: code.discountType,
        discountValue: code.discountValue,
        finalPrice: code.finalPrice
      })),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
} 
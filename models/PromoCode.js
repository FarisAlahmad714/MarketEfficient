const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PromoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow alphanumeric characters, hyphens, and underscores
        return /^[A-Z0-9_-]+$/.test(v);
      },
      message: 'Promo code can only contain uppercase letters, numbers, hyphens, and underscores'
    }
  },
  type: {
    type: String,
    enum: ['preset', 'custom', 'generated', 'full_access'],
    required: true
  },
  discountType: {
    type: String,
    enum: ['fixed_amount', 'percentage', 'free_access'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true // For fixed_amount: cents, for percentage: 0-100, for free_access: 0
  },
  finalPrice: {
    type: Number,
    required: false // Final price in cents after discount (for preset codes)
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUses: {
    type: Number,
    default: 1 // Single use by default
  },
  currentUses: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: false // Optional expiration date
  },
  applicablePlans: [{
    type: String,
    enum: ['monthly', 'annual', 'both'],
    default: 'both'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  baseTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    required: false // Only for generated codes
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    originalAmount: Number,
    discountAmount: Number,
    finalAmount: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance (code index is automatic due to unique: true)
PromoCodeSchema.index({ isActive: 1 });
PromoCodeSchema.index({ validFrom: 1, validUntil: 1 });
PromoCodeSchema.index({ createdBy: 1 });

// Update timestamp on save
PromoCodeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual to check if code is available for use
PromoCodeSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  const isTimeValid = now >= this.validFrom && (!this.validUntil || now <= this.validUntil);
  const isUsageValid = this.currentUses < this.maxUses;
  
  return this.isActive && isTimeValid && isUsageValid;
});

// Method to check if code can be used by a specific user
PromoCodeSchema.methods.canBeUsedBy = function(userId) {
  if (!this.isAvailable) return false;
  
  // Check if user has already used this code
  const hasUsed = this.usedBy.some(usage => usage.userId.toString() === userId.toString());
  return !hasUsed;
};

// Method to use the promo code
PromoCodeSchema.methods.useCode = function(userId, originalAmount, discountAmount, finalAmount) {
  if (!this.canBeUsedBy(userId)) {
    throw new Error('Promo code cannot be used by this user');
  }
  
  this.usedBy.push({
    userId,
    usedAt: new Date(),
    originalAmount,
    discountAmount,
    finalAmount
  });
  
  this.currentUses += 1;
  return this.save();
};

// Method to calculate discount for a given amount
PromoCodeSchema.methods.calculateDiscount = function(originalAmount) {
  if (!this.isAvailable) {
    throw new Error('Promo code is not available');
  }
  
  let discountAmount = 0;
  let finalAmount = originalAmount;
  
  switch (this.discountType) {
    case 'fixed_amount':
      discountAmount = Math.min(this.discountValue, originalAmount);
      finalAmount = originalAmount - discountAmount;
      break;
      
    case 'percentage':
      discountAmount = Math.floor((originalAmount * this.discountValue) / 100);
      finalAmount = originalAmount - discountAmount;
      break;
      
    case 'free_access':
      discountAmount = originalAmount;
      finalAmount = 0;
      break;
      
    default:
      throw new Error('Invalid discount type');
  }
  
  // For preset codes, use the predefined final price if available
  if (this.type === 'preset' && this.finalPrice !== undefined) {
    finalAmount = this.finalPrice;
    discountAmount = originalAmount - finalAmount;
  }
  
  return {
    originalAmount,
    discountAmount,
    finalAmount: Math.max(0, finalAmount)
  };
};

// Static method to create preset promo codes
PromoCodeSchema.statics.createPresetCodes = async function(adminUserId) {
  const presetCodes = [
    {
      code: 'WIZDOM',
      type: 'preset',
      discountType: 'fixed_amount',
      discountValue: 900, // $9 off
      finalPrice: 2000, // $20 final price (30% off monthly)
      description: 'WIZDOM Community Discount - $20 monthly subscription (30% off)'
    },
    {
      code: 'FOXDEN',
      type: 'preset',
      discountType: 'fixed_amount',
      discountValue: 900, // $9 off
      finalPrice: 2000, // $20 final price (30% off monthly)
      description: 'FOXDEN Community Discount - $20 monthly subscription (30% off)'
    },
    {
      code: 'FRIENDSFAMILY',
      type: 'preset',
      discountType: 'fixed_amount',
      discountValue: 1400, // $14 off
      finalPrice: 1500, // $15 final price (48% off monthly)
      description: 'Friends & Family Discount - $15 monthly subscription (48% off)'
    },
    {
      code: 'TESTFREE',
      type: 'preset',
      discountType: 'free_access',
      discountValue: 0,
      finalPrice: 0, // Completely free
      description: 'Test Code - Free access for testing (100% off)'
    }
  ];
  
  const createdCodes = [];
  
  for (const codeData of presetCodes) {
    try {
      // Check if code already exists
      const existingCode = await this.findOne({ code: codeData.code });
      if (!existingCode) {
        const newCode = new this({
          ...codeData,
          createdBy: adminUserId,
          applicablePlans: ['both'] // Make preset codes work for all plans
        });
        await newCode.save();
        createdCodes.push(newCode);
      }
    } catch (error) {
      console.error(`Error creating preset code ${codeData.code}:`, error);
    }
  }
  
  return createdCodes;
};

// Static method to find valid code by code string
PromoCodeSchema.statics.findValidCode = function(codeString) {
  const now = new Date();
  return this.findOne({
    code: codeString.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    $or: [
      { validUntil: null },
      { validUntil: { $exists: false } },
      { validUntil: { $gte: now } }
    ],
    $expr: { $lt: ['$currentUses', '$maxUses'] }
  });
};

module.exports = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema); 
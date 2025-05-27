const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [50, 'Name cannot be more than 50 characters'],
    minlength: [2, 'Name must be at least 2 characters'],
    trim: true,
    validate: {
      validator: function(v) {
        // Only allow letters, spaces, hyphens, and apostrophes
        return /^[a-zA-Z\s\-']+$/.test(v);
      },
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email'
    ],
    validate: {
      validator: function(v) {
        // Additional email security checks
        return !v.includes('<') && !v.includes('>') && !v.includes('"');
      },
      message: 'Email contains invalid characters'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        // Enhanced password validation
        const hasUpperCase = /[A-Z]/.test(v);
        const hasLowerCase = /[a-z]/.test(v);
        const hasNumbers = /\d/.test(v);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(v);
        
        let strengthScore = 0;
        if (hasUpperCase) strengthScore++;
        if (hasLowerCase) strengthScore++;
        if (hasNumbers) strengthScore++;
        if (hasSpecialChar) strengthScore++;
        
        return strengthScore >= 2;
      },
      message: 'Password must contain at least 2 of: uppercase letters, lowercase letters, numbers, special characters'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    metrics: {
      type: Boolean,
      default: true
    },
    reminders: {
      type: Boolean,
      default: true
    }
  },
  // Subscription related fields
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'inactive', 'cancelled', 'past_due', 'trialing'],
    default: 'none'
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'monthly', 'annual', 'admin'],
    default: 'free'
  },
  hasActiveSubscription: {
    type: Boolean,
    default: false
  },
  trialUsed: {
    type: Boolean,
    default: false
  },
  registrationPromoCode: {
    type: String,
    required: false // Store the promo code used during registration
  },
  hasReceivedWelcomeEmail: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ resetPasswordToken: 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Add password hashing pre-save hook
UserSchema.pre('save', async function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Use higher salt rounds for better security
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords with account locking
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // If account is locked, don't allow login
  if (this.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  // If password doesn't match, increment login attempts
  if (!isMatch) {
    this.loginAttempts += 1;
    
    // If we have hit max attempts and it's not locked yet, lock the account
    if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
      this.lockUntil = Date.now() + LOCK_TIME;
    }
    
    await this.save();
    return false;
  }
  
  // If password matches and there were previous failed attempts, reset them
  if (this.loginAttempts > 0) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = new Date();
    await this.save();
  }
  
  return true;
};

// Method to unlock account (for admin use)
UserSchema.methods.unlockAccount = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// Method to check if password needs to be changed (for future use)
UserSchema.methods.isPasswordExpired = function() {
  // Implement password expiration logic if needed
  // For now, return false
  return false;
};

// Method to update subscription status
UserSchema.methods.updateSubscriptionStatus = async function(status, tier) {
  this.subscriptionStatus = status;
  this.subscriptionTier = tier || this.subscriptionTier;
  this.hasActiveSubscription = ['active', 'trialing'].includes(status);
  return this.save();
};

// Method to check if user has access to premium features
UserSchema.methods.hasPremiumAccess = function() {
  return this.isAdmin || this.hasActiveSubscription || this.subscriptionTier === 'admin';
};

// Method to check if user can start a trial
UserSchema.methods.canStartTrial = function() {
  return !this.trialUsed && this.subscriptionStatus === 'none';
};

// Static method to find user by email (case-insensitive)
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Prevent model overwrite during hot reloads
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
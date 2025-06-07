// lib/validation.js

/**
 * Simple validation utility for API requests
 */

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validates that a value exists and is not empty
 */
export function required(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  return value;
}

/**
 * Validates string length
 */
export function maxLength(value, max, fieldName) {
  if (typeof value === 'string' && value.length > max) {
    throw new ValidationError(`${fieldName} must be ${max} characters or less`, fieldName);
  }
  return value;
}

/**
 * Validates minimum string length
 */
export function minLength(value, min, fieldName) {
  if (typeof value === 'string' && value.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters`, fieldName);
  }
  return value;
}

/**
 * Validates that a value is one of the allowed options
 */
export function isOneOf(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, fieldName);
  }
  return value;
}

/**
 * Validates email format
 */
export function isEmail(value, fieldName) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof value === 'string' && !emailRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, fieldName);
  }
  return value;
}

/**
 * Validates that a value is a number within range
 */
export function isNumberInRange(value, min, max, fieldName) {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new ValidationError(`${fieldName} must be a number between ${min} and ${max}`, fieldName);
  }
  return num;
}

/**
 * Validates that a value is a string (not object/array)
 */
export function isString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }
  return value;
}

/**
 * Sanitizes string by removing potential XSS attempts
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * Feedback validation schema
 */
export function validateFeedback(data) {
  const errors = [];
  
  try {
    // Validate type
    required(data.type, 'type');
    isOneOf(data.type, ['general_feedback', 'bug_report', 'feature_request', 'ui_ux', 'performance', 'other'], 'type');
    
    // Validate subject
    required(data.subject, 'subject');
    isString(data.subject, 'subject');
    maxLength(data.subject, 200, 'subject');
    minLength(data.subject, 3, 'subject');
    
    // Validate message
    required(data.message, 'message');
    isString(data.message, 'message');
    maxLength(data.message, 2000, 'message');
    minLength(data.message, 10, 'message');
    
    // Validate rating (optional)
    if (data.rating !== undefined && data.rating !== null && data.rating !== '') {
      isNumberInRange(data.rating, 1, 5, 'rating');
    }
    
    // Validate email (optional)
    if (data.email && data.email.trim()) {
      isEmail(data.email, 'email');
    }
    
    // Sanitize strings
    return {
      type: data.type,
      subject: sanitizeString(data.subject),
      message: sanitizeString(data.message),
      rating: data.rating ? Number(data.rating) : undefined,
      email: data.email ? sanitizeString(data.email) : undefined
    };
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid input data');
  }
}

/**
 * Login validation schema
 */
export function validateLogin(data) {
  try {
    // Validate email
    required(data.email, 'email');
    isString(data.email, 'email');
    isEmail(data.email, 'email');
    maxLength(data.email, 254, 'email'); // RFC 5321 limit
    
    // Validate password
    required(data.password, 'password');
    isString(data.password, 'password');
    minLength(data.password, 1, 'password'); // Don't reveal min length for security
    maxLength(data.password, 128, 'password'); // Reasonable max to prevent DoS
    
    return {
      email: sanitizeString(data.email.toLowerCase().trim()),
      password: data.password // Don't sanitize password as it might change it
    };
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid login data');
  }
}

export default {
  ValidationError,
  required,
  maxLength,
  minLength,
  isOneOf,
  isEmail,
  isNumberInRange,
  isString,
  sanitizeString,
  validateFeedback,
  validateLogin
};
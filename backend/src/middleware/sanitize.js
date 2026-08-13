const mongoose = require('mongoose');

// ──────────────────────────────────────────────────────────────
// SalonSync Input Sanitization & Security Utilities
// ──────────────────────────────────────────────────────────────

/**
 * Middleware: Validates that req.params.id is a valid MongoDB ObjectId.
 * Prevents Mongoose CastError leakage and malformed ID injection.
 */
const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format'
    });
  }
  next();
};

/**
 * Creates a middleware that strips req.body down to only the allowed fields.
 * Prevents mass-assignment attacks (e.g., injecting `role`, `salonId`, etc.).
 *
 * @param {string[]} allowedFields - Array of field names that are permitted.
 * @returns {Function} Express middleware
 */
const sanitizeBody = (allowedFields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const cleaned = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          cleaned[field] = req.body[field];
        }
      }
      req.body = cleaned;
    }
    next();
  };
};

/**
 * Wraps an async route handler to catch errors and return safe error messages.
 * In production, raw error messages are hidden. In development, they are shown.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @param {string} [fallbackMessage] - Optional user-friendly error message
 * @returns {Function} Express middleware
 */
const safeHandler = (fn, fallbackMessage = 'An unexpected error occurred') => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`[${req.method} ${req.originalUrl}]`, error.message);

      const statusCode = error.statusCode || 500;
      const isProduction = process.env.NODE_ENV === 'production';

      // Mongoose validation errors are safe to show (field-level validation messages)
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map(e => e.message);
        return res.status(400).json({
          success: false,
          message: messages.length > 0 ? messages.join('. ') : 'Validation failed'
        });
      }

      // Duplicate key errors
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'A record with this information already exists'
        });
      }

      return res.status(statusCode).json({
        success: false,
        message: isProduction ? fallbackMessage : (error.message || fallbackMessage)
      });
    }
  };
};

module.exports = {
  validateObjectId,
  sanitizeBody,
  safeHandler
};

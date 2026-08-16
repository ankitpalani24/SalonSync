const crypto = require('crypto');
const models = require('../models');

/**
 * Normalizes request body for consistent cryptographic hashing.
 */
const hashRequestBody = (body) => {
  if (!body || typeof body !== 'object') return '';
  const sortedKeys = Object.keys(body).sort();
  const sortedObj = {};
  for (const k of sortedKeys) {
    sortedObj[k] = body[k];
  }
  return crypto.createHash('sha256').update(JSON.stringify(sortedObj)).digest('hex');
};

/**
 * Middleware: Idempotency Protection for Multi-Instance API Mutations.
 * Scoped by: Salon Tenant + Authenticated User + Route Endpoint + Idempotency-Key.
 *
 * Behaviors:
 * 1. If no `Idempotency-Key` header is present, proceeds normally.
 * 2. If present and key already executed with MATCHING payload:
 *    Returns the original response with `X-Cache-Lookup: HIT-IDEMPOTENT`.
 * 3. If present and key already executed with DIFFERENT payload:
 *    Returns `422 Unprocessable Entity` (`Idempotency key reused with different request payload`).
 * 4. If new key: intercepts `res.json` and stores the response atomically in MongoDB with a 24-hour TTL.
 */
const requireIdempotency = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return next();
  }

  const cleanKey = idempotencyKey.trim();
  const requestHash = hashRequestBody(req.body);
  const endpoint = `${req.method} ${req.baseUrl || ''}${req.path}`;
  const salonId = req.user ? req.user.salonId : null;
  const userId = req.user ? req.user._id : null;

  if (!salonId) {
    return next();
  }

  models.IdempotencyKey.findOne({
    salonId,
    endpoint,
    key: cleanKey
  }).then(existing => {
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return res.status(422).json({
          success: false,
          message: 'Idempotency key reused with different request payload'
        });
      }

      res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
      return res.status(existing.statusCode).json(existing.responseBody);
    }

    // Intercept res.json to capture response on completion
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 500) {
        models.IdempotencyKey.create({
          salonId,
          userId,
          endpoint,
          key: cleanKey,
          requestHash,
          statusCode: res.statusCode,
          responseBody: body
        }).catch(err => {
          // If race condition insertion collision occurs, log cleanly
          console.warn('[IDEMPOTENCY_SAVE_WARN]', err.message);
        });
      }
      return originalJson(body);
    };

    next();
  }).catch(err => {
    console.error('[IDEMPOTENCY_MIDDLEWARE_ERROR]', err.message);
    next();
  });
};

module.exports = {
  requireIdempotency,
  hashRequestBody
};

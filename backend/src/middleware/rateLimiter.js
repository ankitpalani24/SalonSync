const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

// Initialize Redis only if REDIS_URL environment variable is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log('[REDIS] Connected to distributed rate limit store');
    }).catch(err => {
      console.warn('[REDIS_WARNING] Redis connection failed, falling back to local memory store:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('error', () => {
      isRedisConnected = false;
    });
  } catch (err) {
    console.warn('[REDIS_FALLBACK] Using in-memory rate limiting:', err.message);
  }
}

/**
 * Creates a rate limiter instance with Redis store when available, or MemoryStore fallback.
 */
const createLimiter = ({ windowMs, max, prefix = 'rl:', message }) => {
  let store = undefined;

  if (redisClient && isRedisConnected) {
    try {
      store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix
      });
    } catch (e) {
      store = undefined;
    }
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    passOnStoreError: true, // Safe fallback if Redis store encounters transient error
    handler: (req, res) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        retryAfter
      });
    }
  });
};

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  prefix: 'rl:auth:',
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const sensitiveActionLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  prefix: 'rl:sensitive:',
  message: 'Too many sensitive operations requested. Please slow down.'
});

const apiLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  prefix: 'rl:api:',
  message: 'Rate limit exceeded. Please slow down.'
});

const getRedisHealth = async () => {
  if (!process.env.REDIS_URL) {
    return { status: 'disabled', message: 'Redis is not configured, in-memory rate limiting active' };
  }
  if (redisClient && isRedisConnected) {
    try {
      const pong = await redisClient.ping();
      return { status: 'connected', ping: pong };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }
  return { status: 'disconnected', message: 'Redis offline, fallback store active' };
};

module.exports = {
  createLimiter,
  authLimiter,
  sensitiveActionLimiter,
  apiLimiter,
  getRedisHealth,
  getRedisClient: () => redisClient
};

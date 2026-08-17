const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.log('Failed to set Google/Cloudflare DNS servers, using default resolver.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/api');
const correlationAndLogger = require('./src/middleware/observability');
const { getRedisHealth } = require('./src/middleware/rateLimiter');

// Load environment variables
dotenv.config();

// ── Startup Validation ──────────────────────────────────────
// Fail fast if critical security env vars are missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  console.error('Set JWT_SECRET in your .env file or environment before starting the server.');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// ── HTTP Security Headers (helmet) ──────────────────────────
app.use(helmet());

// ── Request Correlation ID & Observability Logging ──────────
app.use(correlationAndLogger);

// ── CORS Configuration ──────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "https://salonsync-iota.vercel.app"
];

// Vercel preview deploy pattern: salonsync-<hash>-<user>.vercel.app
const VERCEL_PREVIEW_PATTERN = /^https:\/\/salonsync[a-z0-9-]*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      VERCEL_PREVIEW_PATTERN.test(origin) || 
                      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);
                      
    if (isAllowed) {
      return callback(null, true);
    }
    
    // Strict CORS: Reject un-whitelisted origins (do not leak origin value)
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ── Body Parser with Size Limit (DoS protection) ────────────
app.use(express.json({ limit: '1mb' }));

// ── Health Check Endpoints (Container / Load Balancer Probes) ──
app.get(['/health', '/health/live'], (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const redisHealth = await getRedisHealth();

  if (!isDbReady) {
    return res.status(503).json({
      status: 'unhealthy',
      ready: false,
      checks: {
        database: 'disconnected',
        redis: redisHealth.status
      }
    });
  }

  res.json({
    status: 'ready',
    ready: true,
    checks: {
      database: 'connected',
      redis: redisHealth.status
    }
  });
});

// ── Dynamic API Cache Control (Never cache sensitive tenant/financial API data) ──
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'SalonSync Enterprise API is online.',
    version: '1.0.0'
  });
});

// ── Global Error Handler (production-safe) ──────────────────
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log full error internally but never expose to client
  if (!isProduction) {
    console.error(err.stack);
  } else {
    console.error(`[${req.method} ${req.originalUrl}] ${err.message}`);
  }

  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`SalonSync Server running on port ${PORT}`);
});

// ── Graceful Process Shutdown (Zero-downtime Render/Container deployment) ──
const gracefulShutdown = async (signal) => {
  console.log(`[SHUTDOWN] Received ${signal}. Initiating graceful termination...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP listener terminated.');
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close(false);
        console.log('[SHUTDOWN] MongoDB connection closed.');
      }
      const { getRedisClient } = require('./src/middleware/rateLimiter');
      const redis = getRedisClient();
      if (redis && redis.status === 'ready') {
        await redis.quit();
        console.log('[SHUTDOWN] Redis connection closed.');
      }
      process.exit(0);
    } catch (err) {
      console.error('[SHUTDOWN_ERROR]', err.message);
      process.exit(1);
    }
  });

  // Forced exit fallback after 10 seconds
  setTimeout(() => {
    console.error('[SHUTDOWN] Forceful termination due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');
const correlationAndLogger = require('../../src/middleware/observability');
const { getRedisHealth, createLimiter } = require('../../src/middleware/rateLimiter');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(correlationAndLogger);

// Health check endpoints
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

app.use('/api', apiRoutes);

setupDB();

describe('SalonSync Distributed Rate Limiting, Health Checks & Observability Suite', () => {
  let salon, user, token;

  beforeEach(async () => {
    salon = await models.Salon.create({
      name: 'RateLimit Test Salon',
      ownerName: 'RL Admin',
      email: 'rladmin@test.com',
      phone: '9988776655'
    });

    user = await models.User.create({
      name: 'RL Admin',
      email: 'rladmin@test.com',
      phone: '9988776655',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salon._id
    });

    token = jwt.sign({ id: user._id, tokenVersion: 1 }, process.env.JWT_SECRET);
  });

  // TEST 1: Health Probes
  test('Health check: /health and /health/live return 200 OK with uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.timestamp).toBeDefined();

    const liveRes = await request(app).get('/health/live');
    expect(liveRes.status).toBe(200);
    expect(liveRes.body.status).toBe('ok');
  });

  test('Readiness probe: /health/ready confirms MongoDB and Redis status', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.ready).toBe(true);
    expect(res.body.checks.database).toBe('connected');
    expect(res.body.checks.redis).toBeDefined();
  });

  // TEST 2: Correlation ID Telemetry
  test('Observability: attaches X-Correlation-ID to responses and accepts custom correlation ID', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-correlation-id']).toBeDefined();

    const customId = 'txn-client-trace-12345';
    const traceRes = await request(app)
      .get('/health')
      .set('X-Correlation-ID', customId);

    expect(traceRes.headers['x-correlation-id']).toBe(customId);
  });

  // TEST 3: Rate Limiting & 429 Response Formatting
  test('Rate Limiter: returns clean 429 response with Retry-After header when threshold is breached', async () => {
    const testApp = express();
    testApp.use(express.json());

    // Create a strict test limiter of 3 requests per 10 seconds
    const strictLimiter = createLimiter({
      windowMs: 10 * 1000,
      max: 3,
      message: 'Test rate limit exceeded'
    });

    testApp.get('/test-rate-limit', strictLimiter, (req, res) => {
      res.json({ success: true, message: 'allowed' });
    });

    // Send 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const res = await request(testApp).get('/test-rate-limit');
      expect(res.status).toBe(200);
    }

    // 4th request must be rejected with 429
    const blockedRes = await request(testApp).get('/test-rate-limit');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.message).toMatch(/rate limit exceeded/i);
    expect(blockedRes.headers['retry-after']).toBeDefined();
    expect(Number(blockedRes.headers['retry-after'])).toBeGreaterThan(0);
  });

  // TEST 4: Zero Secret Leakage in Redis Health
  test('Redis health probe does not expose credentials or internal paths', async () => {
    const health = await getRedisHealth();
    expect(health.status).toBeDefined();
    expect(JSON.stringify(health)).not.toMatch(/redis:\/\/:/i);
    expect(JSON.stringify(health)).not.toMatch(/password/i);
  });
});

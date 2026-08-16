const crypto = require('crypto');

/**
 * Request Correlation ID and Observability Middleware.
 * Attaches a unique X-Correlation-ID header to every request and response.
 * Records structured performance telemetry and error logging without leaking secrets.
 */
const correlationAndLogger = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const isError = res.statusCode >= 400;

    // Structured logging payload (strictly zero passwords, tokens, or raw secrets)
    const logData = {
      timestamp: new Date().toISOString(),
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      user: req.user ? {
        id: String(req.user._id || req.user.id),
        role: req.user.role,
        salonId: req.user.salonId ? String(req.user.salonId) : undefined,
        branchId: req.user.branchId ? String(req.user.branchId) : undefined
      } : undefined
    };

    if (isError && res.statusCode >= 500) {
      console.error('[HTTP_5XX_ERROR]', JSON.stringify(logData));
    } else if (isError && [401, 403, 429].includes(res.statusCode)) {
      console.warn(`[SECURITY_${res.statusCode}]`, JSON.stringify(logData));
    }
  });

  next();
};

module.exports = correlationAndLogger;

const { validateObjectId, sanitizeBody, safeHandler } = require('../../src/middleware/sanitize');

describe('Sanitizer & Middleware Unit Tests', () => {

  describe('validateObjectId middleware', () => {
    test('calls next() for valid 24-character hex MongoDB ObjectId', () => {
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = {};
      const next = jest.fn();

      validateObjectId(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('returns 400 Bad Request for malformed ObjectId string', () => {
      const req = { params: { id: 'invalid-id-123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      validateObjectId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Invalid resource ID format/i)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next() if req.params.id is not set', () => {
      const req = { params: {} };
      const res = {};
      const next = jest.fn();

      validateObjectId(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('sanitizeBody middleware (Mass-Assignment Protection)', () => {
    test('strips fields not present in allowed list', () => {
      const allowedFields = ['name', 'phone', 'email'];
      const req = {
        body: {
          name: 'Jane Doe',
          phone: '9999999999',
          email: 'jane@example.com',
          role: 'SUPER_ADMIN',         // Malicious attempt to escalate role
          subscriptionPlan: 'Franchise',// Malicious attempt to change plan
          loyaltyPoints: 999999         // Malicious attempt to inject points
        }
      };
      const res = {};
      const next = jest.fn();

      const middleware = sanitizeBody(allowedFields);
      middleware(req, res, next);

      expect(req.body).toEqual({
        name: 'Jane Doe',
        phone: '9999999999',
        email: 'jane@example.com'
      });
      expect(req.body.role).toBeUndefined();
      expect(req.body.subscriptionPlan).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('safeHandler error masking utility', () => {
    test('calls wrapped function successfully when no error occurs', async () => {
      const handlerFn = jest.fn().mockResolvedValue(true);
      const wrapped = safeHandler(handlerFn);

      const req = { method: 'GET', originalUrl: '/test' };
      const res = {};
      const next = jest.fn();

      await wrapped(req, res, next);
      expect(handlerFn).toHaveBeenCalledWith(req, res, next);
    });

    test('masks internal error details in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const handlerFn = jest.fn().mockRejectedValue(new Error('Internal database connection password secret leaked'));
      const wrapped = safeHandler(handlerFn, 'Safe fallback message');

      const req = { method: 'GET', originalUrl: '/test' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await wrapped(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Safe fallback message'
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

});

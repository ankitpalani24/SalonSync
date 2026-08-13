const request = require('supertest');
const express = require('express');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

setupDB();

describe('Authentication & Authorization Integration Tests', () => {

  describe('POST /api/auth/signup', () => {
    test('creates a new salon owner user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ownerName: 'Test Owner',
          email: 'owner@salonsync-test.com',
          phone: '9876543210',
          password: 'Password123!',
          salonName: 'Test Salon',
          salonAddress: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          businessType: 'Salon'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('SALON_OWNER');
      expect(res.body.user.password).toBeUndefined(); // Password must not be returned
    });

    test('rejects signup with invalid email or weak password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ownerName: 'Test Owner',
          email: 'invalid-email',
          phone: '9876543210',
          password: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Valid email is required|Password must be at least 8 characters/i);
    });

    test('rejects duplicate email signup', async () => {
      await models.User.create({
        name: 'Existing User',
        email: 'existing@salonsync-test.com',
        phone: '9999999999',
        password: 'hashedpassword',
        role: 'CLIENT'
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ownerName: 'Duplicate User',
          email: 'existing@salonsync-test.com',
          phone: '9876543210',
          password: 'Password123!',
          role: 'CLIENT'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password123!', 12);
      await models.User.create({
        name: 'Login User',
        email: 'login@salonsync-test.com',
        phone: '9876543210',
        password: hash,
        role: 'SALON_MANAGER'
      });
    });

    test('authenticates valid credentials and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@salonsync-test.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@salonsync-test.com');
      expect(res.body.user.password).toBeUndefined();
    });

    test('rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@salonsync-test.com',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });
  });

  describe('Role Escalation Prevention', () => {
    test('SALON_MANAGER cannot create a SUPER_ADMIN user account', async () => {
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');

      const hash = await bcrypt.hash('Password123!', 12);
      const manager = await models.User.create({
        name: 'Manager User',
        email: 'manager@salonsync-test.com',
        phone: '9876543210',
        password: hash,
        role: 'SALON_MANAGER'
      });

      const token = jwt.sign({ id: manager._id }, process.env.JWT_SECRET);

      const res = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Attacker',
          email: 'attacker@salonsync-test.com',
          phone: '9999999999',
          role: 'SUPER_ADMIN' // Privilege escalation attempt
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

});

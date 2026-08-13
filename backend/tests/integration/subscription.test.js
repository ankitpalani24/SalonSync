const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const { protect, validateSubscription } = require('../../src/middleware/auth');

const app = express();
app.use(express.json());

// Dummy protected franchise route
app.get('/api/franchise/analytics', protect, validateSubscription('Franchise'), (req, res) => {
  res.json({ success: true, message: 'Welcome to Franchise Analytics' });
});

setupDB();

describe('Subscription Plan Restriction Integration Tests', () => {

  let starterSalon, franchiseSalon;
  let starterOwnerToken, franchiseOwnerToken, superAdminToken;

  beforeEach(async () => {
    starterSalon = await models.Salon.create({ name: 'Starter Salon', ownerName: 'Owner 1', email: 'o1@test.com', phone: '1111111111', subscriptionPlan: 'Starter Salon' });
    franchiseSalon = await models.Salon.create({ name: 'Franchise Salon', ownerName: 'Owner 2', email: 'o2@test.com', phone: '2222222222', subscriptionPlan: 'Franchise' });

    const starterOwner = await models.User.create({ name: 'Owner 1', email: 'o1@test.com', phone: '1111111111', password: 'hash', role: 'SALON_OWNER', salonId: starterSalon._id });
    const franchiseOwner = await models.User.create({ name: 'Owner 2', email: 'o2@test.com', phone: '2222222222', password: 'hash', role: 'SALON_OWNER', salonId: franchiseSalon._id });
    const superAdmin = await models.User.create({ name: 'Admin', email: 'admin@test.com', phone: '9999999999', password: 'hash', role: 'SUPER_ADMIN' });

    starterOwnerToken = jwt.sign({ id: starterOwner._id }, process.env.JWT_SECRET);
    franchiseOwnerToken = jwt.sign({ id: franchiseOwner._id }, process.env.JWT_SECRET);
    superAdminToken = jwt.sign({ id: superAdmin._id }, process.env.JWT_SECRET);
  });

  test('BLOCKS starter salon user from accessing Franchise plan endpoint', async () => {
    const res = await request(app)
      .get('/api/franchise/analytics')
      .set('Authorization', `Bearer ${starterOwnerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Subscription tier validation failed/i);
  });

  test('ALLOWS franchise salon user to access Franchise plan endpoint', async () => {
    const res = await request(app)
      .get('/api/franchise/analytics')
      .set('Authorization', `Bearer ${franchiseOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Welcome to Franchise Analytics');
  });

  test('SUPER_ADMIN bypasses subscription plan restriction', async () => {
    const res = await request(app)
      .get('/api/franchise/analytics')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

});

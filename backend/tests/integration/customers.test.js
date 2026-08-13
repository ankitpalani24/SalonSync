const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

setupDB();

describe('Customer CRM & Tenant Isolation Integration Tests', () => {

  let salonA, salonB;
  let ownerAToken, ownerBToken;

  beforeEach(async () => {
    salonA = await models.Salon.create({ name: 'Salon Alpha', ownerName: 'Owner A', email: 'a@salonsync-test.com', phone: '1111111111' });
    salonB = await models.Salon.create({ name: 'Salon Beta', ownerName: 'Owner B', email: 'b@salonsync-test.com', phone: '2222222222' });

    const ownerA = await models.User.create({ name: 'Owner A', email: 'a@salonsync-test.com', phone: '1111111111', password: 'hash', role: 'SALON_OWNER', salonId: salonA._id });
    const ownerB = await models.User.create({ name: 'Owner B', email: 'b@salonsync-test.com', phone: '2222222222', password: 'hash', role: 'SALON_OWNER', salonId: salonB._id });

    ownerAToken = jwt.sign({ id: ownerA._id }, process.env.JWT_SECRET);
    ownerBToken = jwt.sign({ id: ownerB._id }, process.env.JWT_SECRET);
  });

  test('creates customer and sanitizes body (ignores injected loyaltyPoints)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Alice Springs',
        phone: '9876543210',
        email: 'alice@example.com',
        loyaltyPoints: 9999 // Malicious injection attempt
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Alice Springs');
    expect(res.body.data.loyaltyPoints).toBe(0); // Should remain default 0
  });

  test('enforces multi-tenant isolation (Salon B cannot access Salon A customer)', async () => {
    const customerA = await models.Customer.create({
      salonId: salonA._id,
      name: 'Client of Salon A',
      phone: '9999999999',
      email: 'clientA@example.com'
    });

    // Owner A can fetch customerA
    const resA = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${ownerAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBe(1);
    expect(resA.body.data[0].name).toBe('Client of Salon A');

    // Owner B gets empty list for Salon B
    const resB = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${ownerBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(0);

    // Owner B cannot update Customer A
    const resUpdate = await request(app)
      .put(`/api/customers/${customerA._id}`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({ name: 'Hacked Name' });

    expect(resUpdate.status).toBe(404);
  });

});

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

describe('Appointment Booking & Double-Booking Prevention Integration Tests', () => {

  let salon, branch, staff, customer, token;

  beforeEach(async () => {
    salon = await models.Salon.create({ name: 'Salon Test', ownerName: 'Owner', email: 'owner@test.com', phone: '1111111111' });
    branch = await models.Branch.create({ salonId: salon._id, name: 'Main Branch' });
    staff = await models.Staff.create({ salonId: salon._id, branchId: branch._id, name: 'Emma Watson', phone: '9999999999' });
    customer = await models.Customer.create({ salonId: salon._id, name: 'Client Test', phone: '8888888888' });

    const owner = await models.User.create({ name: 'Owner', email: 'owner@test.com', phone: '1111111111', password: 'hash', role: 'SALON_OWNER', salonId: salon._id, branchId: branch._id });
    token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET);
  });

  test('creates a valid appointment', async () => {
    const apptDate = new Date('2026-09-01T00:00:00.000Z');

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id,
        staffId: staff._id,
        date: apptDate,
        time: '14:00',
        status: 'Scheduled'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.time).toBe('14:00');
  });

  test('PREVENTS DOUBLE BOOKING: rejects overlapping appointment for same staff and time', async () => {
    const apptDate = new Date('2026-09-01T00:00:00.000Z');

    // Create initial booking
    await models.Appointment.create({
      salonId: salon._id,
      branchId: branch._id,
      customerId: customer._id,
      staffId: staff._id,
      date: apptDate,
      time: '14:00',
      status: 'Scheduled'
    });

    // Attempt second booking for same staff at 14:00 on 2026-09-01
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id,
        staffId: staff._id,
        date: apptDate,
        time: '14:00',
        status: 'Scheduled'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already booked for another appointment/i);
  });

  test('allows cancellation of an appointment', async () => {
    const appt = await models.Appointment.create({
      salonId: salon._id,
      branchId: branch._id,
      customerId: customer._id,
      staffId: staff._id,
      date: new Date('2026-09-01'),
      time: '16:00',
      status: 'Scheduled'
    });

    const res = await request(app)
      .delete(`/api/appointments/${appt._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await models.Appointment.findById(appt._id);
    expect(check).toBeNull();
  });

  test('allows SALON_OWNER without branchId to book an appointment with auto-resolution', async () => {
    // Owner with no branchId
    const ownerWithoutBranch = await models.User.create({
      name: 'Owner No Branch',
      email: 'owner_nobranch@test.com',
      phone: '1234567890',
      password: 'hash',
      role: 'SALON_OWNER',
      salonId: salon._id
    });
    const ownerToken = jwt.sign({ id: ownerWithoutBranch._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerName: 'New Walk-in Client',
        customerPhone: '9876543210',
        staffId: staff._id,
        date: new Date('2026-09-02T00:00:00.000Z'),
        time: '11:00',
        services: [{ name: 'Signature Haircut', price: 1500 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customerId).toBeDefined();
    expect(res.body.data.branchId).toBeDefined();
  });

});

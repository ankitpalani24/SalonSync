const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');

// Simulate two independent backend server instances connecting to the same database
const createServerInstance = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRoutes);
  return app;
};

const serverA = createServerInstance();
const serverB = createServerInstance();

setupDB();

describe('SalonSync Multi-Instance / Distributed Concurrency & Scaling Test Suite', () => {

  let salon, branch, ownerUser, ownerToken, staffA, staffB, productA, productB;

  beforeEach(async () => {
    salon = await models.Salon.create({
      name: 'Distributed Luxury Salon',
      ownerName: 'Cluster Admin',
      email: 'cluster@salonsync.com',
      phone: '9876543210',
      address: 'Cloud Plaza',
      city: 'Mumbai'
    });

    branch = await models.Branch.create({
      salonId: salon._id,
      name: 'Main Flagship Branch',
      city: 'Mumbai'
    });

    ownerUser = await models.User.create({
      name: 'Cluster Admin',
      email: 'cluster@salonsync.com',
      phone: '9876543210',
      password: '$2a$10$hashedpasswordfordistributedtest',
      role: 'SALON_OWNER',
      salonId: salon._id,
      branchId: branch._id
    });
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);

    staffA = await models.Staff.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Lead Stylist Viktor',
      phone: '9876500010',
      role: 'Senior Stylist'
    });

    staffB = await models.Staff.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Master Colorist Maya',
      phone: '9876500011',
      role: 'Color Specialist'
    });

    productA = await models.Product.create({
      salonId: salon._id,
      name: 'Olaplex No. 3 Hair Perfector',
      sku: 'OLA-003',
      category: 'Hair Care',
      purchasePrice: 1800,
      sellingPrice: 2800,
      price: 2800,
      quantity: 50
    });

    productB = await models.Product.create({
      salonId: salon._id,
      name: 'Moroccanoil Treatment 100ml',
      sku: 'MOR-100',
      category: 'Hair Oil',
      purchasePrice: 2000,
      sellingPrice: 3200,
      price: 3200,
      quantity: 100
    });
  });

  // ----------------------------------------------------
  // TEST 1: Cross-Instance 20-Request Appointment Concurrency
  // ----------------------------------------------------
  test('TEST 1: 20 concurrent booking requests distributed across Server A and Server B -> Exactly 1 succeeds, 19 fail', async () => {
    const bookingDate = '2026-10-01';
    const bookingTime = '14:00';

    // 1. Create 20 unique customers
    const customers = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        models.Customer.create({
          salonId: salon._id,
          branchId: branch._id,
          name: `Distributed Client ${i + 1}`,
          phone: `98765${String(20000 + i).slice(-5)}`
        })
      )
    );

    // 2. Distribute requests evenly across Server A and Server B
    const requests = customers.map((c, index) => {
      const targetServer = index % 2 === 0 ? serverA : serverB;
      return request(targetServer)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: c._id,
          staffId: staffA._id,
          date: bookingDate,
          time: bookingTime,
          duration: 60
        });
    });

    // 3. Dispatch all 20 requests concurrently
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const conflictCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(19);

    // 4. Verify MongoDB state across all instances: Exactly 1 appointment in DB
    const appointmentsInDB = await models.Appointment.find({
      salonId: salon._id,
      staffId: staffA._id,
      date: new Date(bookingDate),
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });
    expect(appointmentsInDB.length).toBe(1);
    expect(appointmentsInDB[0].time).toBe('14:00');

    // 5. Verify SlotReservation records in MongoDB
    const slotReservations = await models.SlotReservation.find({
      salonId: salon._id,
      staffId: staffA._id,
      dateStr: '2026-10-01'
    });
    // 60 minutes = 4 slices of 15 mins (14:00, 14:15, 14:30, 14:45)
    expect(slotReservations.length).toBe(4);
  });

  // ----------------------------------------------------
  // TEST 2: Cross-Instance Rescheduling Concurrency
  // ----------------------------------------------------
  test('TEST 2: Simultaneous rescheduling requests through Server A and Server B targeting the same slot -> Exactly 1 succeeds', async () => {
    const bookingDate = '2026-10-02';

    // 1. Create two existing appointments at different times
    const appt1Res = await request(serverA)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ staffId: staffA._id, date: bookingDate, time: '10:00', duration: 60 });
    
    const appt2Res = await request(serverB)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ staffId: staffA._id, date: bookingDate, time: '11:00', duration: 60 });

    const appt1Id = appt1Res.body.data._id;
    const appt2Id = appt2Res.body.data._id;

    // 2. Concurrently reschedule both to 16:00: Appt 1 via Server A, Appt 2 via Server B
    const [resA, resB] = await Promise.all([
      request(serverA)
        .put(`/api/appointments/${appt1Id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ time: '16:00' }),
      request(serverB)
        .put(`/api/appointments/${appt2Id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ time: '16:00' })
    ]);

    const results = [resA, resB];
    const successes = results.filter(r => r.status === 200);
    const conflicts = results.filter(r => r.status === 400);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(1);

    // Verify DB state: Exactly 1 appointment at 16:00
    const apptsAt16 = await models.Appointment.find({
      salonId: salon._id,
      staffId: staffA._id,
      date: new Date(bookingDate),
      time: '16:00',
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });
    expect(apptsAt16.length).toBe(1);
  });

  // ----------------------------------------------------
  // TEST 3: Cross-Instance Inventory Concurrency (Stock = 50, 10 reqs x 7)
  // ----------------------------------------------------
  test('TEST 3: Initial Stock 50 -> 10 concurrent requests of qty 7 across Server A & Server B -> 7 succeed, 3 fail, final stock = 1', async () => {
    // 10 concurrent POS invoices requesting qty 7 each
    const requests = Array.from({ length: 10 }, (_, idx) => {
      const targetServer = idx % 2 === 0 ? serverA : serverB;
      return request(targetServer)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerName: `Inventory Client ${idx + 1}`,
          products: [{ productId: productA._id, quantity: 7, price: 2800 }],
          paymentMethod: 'Cash',
          status: 'Paid'
        });
    });

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const failCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(7);
    expect(failCount).toBe(3);

    // Verify product stock in MongoDB: 50 - (7 * 7) = 1
    const updatedProduct = await models.Product.findById(productA._id);
    expect(updatedProduct.quantity).toBe(1);
  });

  // ----------------------------------------------------
  // TEST 4: Cross-Instance Inventory Concurrency (Stock = 100, 10 reqs x 20)
  // ----------------------------------------------------
  test('TEST 4: Initial Stock 100 -> 10 concurrent requests of qty 20 across Server A & Server B -> 5 succeed, 5 fail, final stock = 0', async () => {
    // 10 concurrent POS invoices requesting qty 20 each
    const requests = Array.from({ length: 10 }, (_, idx) => {
      const targetServer = idx % 2 === 0 ? serverA : serverB;
      return request(targetServer)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerName: `Bulk Client ${idx + 1}`,
          products: [{ productId: productB._id, quantity: 20, price: 3200 }],
          paymentMethod: 'UPI',
          status: 'Paid'
        });
    });

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const failCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(5);
    expect(failCount).toBe(5);

    // Verify product stock in MongoDB: 100 - (5 * 20) = 0
    const updatedProduct = await models.Product.findById(productB._id);
    expect(updatedProduct.quantity).toBe(0);
  });

  // ----------------------------------------------------
  // TEST 5: Cross-Instance Slot Cancellation and Immediate Rebooking
  // ----------------------------------------------------
  test('TEST 5: Server A books -> Server B cancels -> Server A immediately rebooks -> Succeeds cleanly', async () => {
    const bookingDate = '2026-10-03';
    const bookingTime = '10:00';

    // 1. Server A books 10:00
    const bookRes = await request(serverA)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ staffId: staffB._id, date: bookingDate, time: bookingTime, duration: 60 });
    expect(bookRes.status).toBe(201);
    const apptId = bookRes.body.data._id;

    // 2. Server B cancels the appointment
    const cancelRes = await request(serverB)
      .put(`/api/appointments/${apptId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'Cancelled' });
    expect(cancelRes.status).toBe(200);

    // 3. Server A re-books 10:00
    const rebookRes = await request(serverA)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ staffId: staffB._id, date: bookingDate, time: bookingTime, duration: 60 });
    expect(rebookRes.status).toBe(201);
  });

});

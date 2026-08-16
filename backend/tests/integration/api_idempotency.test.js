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

describe('SalonSync API Idempotency & Distributed Deduplication Suite', () => {
  let salonA, branchA, userA, tokenA;
  let salonB, branchB, userB, tokenB;
  let customerA, productA, staffA;

  beforeEach(async () => {
    // Tenant A
    salonA = await models.Salon.create({
      name: 'Idempotent Salon A',
      ownerName: 'Admin A',
      email: 'admina@idempotent.com',
      phone: '9888800001'
    });

    branchA = await models.Branch.create({
      salonId: salonA._id,
      name: 'Branch A1',
      city: 'Mumbai'
    });

    userA = await models.User.create({
      name: 'Admin A',
      email: 'admina@idempotent.com',
      phone: '9888800001',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salonA._id,
      branchId: branchA._id,
      tokenVersion: 1
    });
    tokenA = jwt.sign({ id: userA._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    customerA = await models.Customer.create({
      salonId: salonA._id,
      branchId: branchA._id,
      name: 'Loyal Client Alpha',
      phone: '9876500001'
    });

    productA = await models.Product.create({
      salonId: salonA._id,
      branchId: branchA._id,
      name: 'Luxury Hair Serum',
      sku: 'SERUM-LUX-100',
      quantity: 20,
      purchasePrice: 500,
      sellingPrice: 1200
    });

    staffA = await models.Staff.create({
      salonId: salonA._id,
      branchId: branchA._id,
      name: 'Lead Stylist Sarah',
      phone: '9876500002',
      role: 'Senior Stylist'
    });

    // Tenant B (for cross-tenant idempotency isolation test)
    salonB = await models.Salon.create({
      name: 'Idempotent Salon B',
      ownerName: 'Admin B',
      email: 'adminb@idempotent.com',
      phone: '9888800002'
    });

    branchB = await models.Branch.create({
      salonId: salonB._id,
      name: 'Branch B1',
      city: 'Delhi'
    });

    userB = await models.User.create({
      name: 'Admin B',
      email: 'adminb@idempotent.com',
      phone: '9888800002',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salonB._id,
      branchId: branchB._id,
      tokenVersion: 1
    });
    tokenB = jwt.sign({ id: userB._id, tokenVersion: 1 }, process.env.JWT_SECRET);
  });

  // TEST 1: Duplicate Invoicing
  test('Invoice Idempotency: Retrying invoice creation with same Idempotency-Key returns cached result and executes DB writes only once', async () => {
    const idempotencyKey = 'inv-req-key-abc-12345';
    const invoicePayload = {
      customerId: customerA._id,
      branchId: branchA._id,
      services: [{ name: 'Royal Haircut', price: 1000, quantity: 1 }],
      products: [{ productId: productA._id, name: productA.name, price: 1200, quantity: 2 }],
      paymentMethod: 'Card'
    };

    // First Request
    const res1 = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(invoicePayload);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    const firstInvoiceId = res1.body.data._id;
    const firstInvoiceNumber = res1.body.data.invoiceNumber;

    // Verify product stock was decremented from 20 to 18
    let updatedProduct = await models.Product.findById(productA._id);
    expect(updatedProduct.quantity).toBe(18);

    // Second Request (Identical Key & Payload - e.g. Client network timeout retry)
    const res2 = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(invoicePayload);

    expect(res2.status).toBe(201);
    expect(res2.headers['x-cache-lookup']).toBe('HIT-IDEMPOTENT');
    expect(res2.body.data._id).toBe(firstInvoiceId);
    expect(res2.body.data.invoiceNumber).toBe(firstInvoiceNumber);

    // Verify DB integrity: ONLY 1 invoice was created in DB and stock was NOT deducted twice
    const totalInvoices = await models.Invoice.countDocuments({ salonId: salonA._id });
    expect(totalInvoices).toBe(1);

    updatedProduct = await models.Product.findById(productA._id);
    expect(updatedProduct.quantity).toBe(18); // Still 18, never 16!
  });

  // TEST 2: Key Reuse with Mismatched Payload Rejection
  test('Payload Tampering: Reusing an Idempotency-Key with a different payload is rejected with 422 Unprocessable Entity', async () => {
    const idempotencyKey = 'key-reuse-different-payload-999';

    // Original Request
    const res1 = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        customerId: customerA._id,
        services: [{ name: 'Express Blowdry', price: 500, quantity: 1 }]
      });
    expect(res1.status).toBe(201);

    // Tampered / Modified Payload with same key
    const res2 = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        customerId: customerA._id,
        services: [{ name: 'Full Bridal Package', price: 25000, quantity: 1 }]
      });

    expect(res2.status).toBe(422);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toMatch(/different request payload/i);
  });

  // TEST 3: Stock Adjustment Idempotency
  test('Stock Adjustment Idempotency: Retrying manual stock adjustment does not apply delta multiple times', async () => {
    const idempotencyKey = 'stock-adj-key-001';

    // First adjustment (+10 stock)
    const res1 = await request(app)
      .post(`/api/products/${productA._id}/adjust-stock`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ delta: 10, reason: 'Restock shipment' });

    expect(res1.status).toBe(200);
    expect(res1.body.data.quantity).toBe(30);

    // Second adjustment retry with same key
    const res2 = await request(app)
      .post(`/api/products/${productA._id}/adjust-stock`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ delta: 10, reason: 'Restock shipment' });

    expect(res2.status).toBe(200);
    expect(res2.headers['x-cache-lookup']).toBe('HIT-IDEMPOTENT');

    // Final DB check: Product quantity is exactly 30, not 40
    const finalProduct = await models.Product.findById(productA._id);
    expect(finalProduct.quantity).toBe(30);
  });

  // TEST 4: Appointment Booking Idempotency
  test('Appointment Booking Idempotency: Retrying appointment booking returns original booking and creates slot reservations exactly once', async () => {
    const idempotencyKey = 'appt-booking-key-456';
    const apptPayload = {
      customerId: customerA._id,
      staffId: staffA._id,
      branchId: branchA._id,
      date: '2026-11-20',
      time: '14:00',
      duration: 30
    };

    // First booking attempt
    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(apptPayload);

    expect(res1.status).toBe(201);
    const bookingId = res1.body.data._id;

    // Second booking attempt (retry)
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(apptPayload);

    expect(res2.status).toBe(201);
    expect(res2.headers['x-cache-lookup']).toBe('HIT-IDEMPOTENT');
    expect(res2.body.data._id).toBe(bookingId);

    // Exactly 1 appointment in DB
    const apptCount = await models.Appointment.countDocuments({ salonId: salonA._id });
    expect(apptCount).toBe(1);

    // Exactly 2 slot reservation slices in DB (14:00 and 14:15 = 840, 855)
    const slotCount = await models.SlotReservation.countDocuments({ salonId: salonA._id, staffId: staffA._id });
    expect(slotCount).toBe(2);
  });

  // TEST 5: Cross-Tenant Idempotency Key Isolation
  test('Multi-Tenant Isolation: Same idempotency key used across two different salons executes independently without collision', async () => {
    const sharedKey = 'common-pos-key-0001';

    // Tenant A creates appointment
    const resA = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', sharedKey)
      .send({
        customerId: customerA._id,
        staffId: staffA._id,
        branchId: branchA._id,
        date: '2026-12-01',
        time: '10:00'
      });
    expect(resA.status).toBe(201);

    // Tenant B uses the exact same key string in their own salon
    const customerB = await models.Customer.create({
      salonId: salonB._id,
      branchId: branchB._id,
      name: 'Client Beta',
      phone: '9900011122'
    });
    const staffB = await models.Staff.create({
      salonId: salonB._id,
      branchId: branchB._id,
      name: 'Stylist Bob',
      phone: '9900011133'
    });

    const resB = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('Idempotency-Key', sharedKey)
      .send({
        customerId: customerB._id,
        staffId: staffB._id,
        branchId: branchB._id,
        date: '2026-12-01',
        time: '10:00'
      });

    // Tenant B must successfully create their appointment and NOT receive Tenant A's cached response
    expect(resB.status).toBe(201);
    expect(resB.headers['x-cache-lookup']).toBeUndefined();
    expect(resB.body.data.salonId).toBe(String(salonB._id));
    expect(resB.body.data._id).not.toBe(resA.body.data._id);
  });
});

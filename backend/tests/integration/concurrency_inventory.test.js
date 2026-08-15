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

describe('SalonSync Master Inventory Concurrency & Data Integrity Suite', () => {

  let ownerToken, salon, branch, ownerUser, customer, staffMember, product;
  let salonB, branchB, ownerUserB, ownerTokenB, productB;

  beforeEach(async () => {
    // Primary Tenant (Salon A)
    salon = await models.Salon.create({
      name: 'Concurrency Master Salon',
      ownerName: 'Concurrency Admin',
      email: 'admin@concurrency.com',
      phone: '9988776600',
      address: 'Tech Park',
      city: 'Bangalore'
    });

    branch = await models.Branch.create({
      salonId: salon._id,
      name: 'Main Lab Branch',
      city: 'Bangalore'
    });

    ownerUser = await models.User.create({
      name: 'Concurrency Admin',
      email: 'admin@concurrency.com',
      phone: '9988776600',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salon._id,
      branchId: branch._id
    });
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);

    customer = await models.Customer.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Test Customer',
      phone: '9988776611'
    });

    staffMember = await models.Staff.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Stylist One',
      phone: '9988776622',
      salary: 30000,
      commissionPercentage: 10
    });

    product = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Keratin Smoothing Serum',
      sku: 'KERATIN-100',
      quantity: 10,
      purchasePrice: 500,
      sellingPrice: 1200,
      lowStockThreshold: 2
    });

    // Secondary Tenant (Salon B) for Multi-Tenant Isolation Tests
    salonB = await models.Salon.create({
      name: 'Competitor Salon B',
      ownerName: 'Admin B',
      email: 'admin@salonb.com',
      phone: '9988776699',
      address: 'Indiranagar',
      city: 'Bangalore'
    });

    branchB = await models.Branch.create({
      salonId: salonB._id,
      name: 'Branch B',
      city: 'Bangalore'
    });

    ownerUserB = await models.User.create({
      name: 'Admin B',
      email: 'admin@salonb.com',
      phone: '9988776699',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salonB._id,
      branchId: branchB._id
    });
    ownerTokenB = jwt.sign({ id: ownerUserB._id }, process.env.JWT_SECRET);

    productB = await models.Product.create({
      salonId: salonB._id,
      branchId: branchB._id,
      name: 'Salon B Product',
      sku: 'SALONB-01',
      quantity: 50,
      purchasePrice: 400,
      sellingPrice: 1000
    });
  });

  // TEST 1: 2-Request Concurrency (Stock = 10, 7 + 7)
  test('TEST 1: 2-request concurrency (Stock = 10, 7 + 7) -> 1 succeeds, 1 fails, final stock = 3', async () => {
    expect(product.quantity).toBe(10);

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          products: [{ productId: product._id, quantity: 7, price: 1200 }]
        }),
      request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          products: [{ productId: product._id, quantity: 7, price: 1200 }]
        })
    ]);

    const results = [resA, resB];
    const successResponses = results.filter(r => r.status === 201);
    const failedResponses = results.filter(r => r.status === 400);

    expect(successResponses.length).toBe(1);
    expect(failedResponses.length).toBe(1);
    expect(failedResponses[0].body.message).toMatch(/Insufficient inventory/i);

    const finalProduct = await models.Product.findById(product._id);
    expect(finalProduct.quantity).toBe(3);
  });

  // TEST 2: 10-Request Concurrency (Stock = 50, 10 requests of 7 each)
  test('TEST 2: 10-request concurrency (Stock = 50, 10 x 7) -> 7 succeed, 3 fail, final stock = 1', async () => {
    const bulkProduct = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Argan Oil 50ml',
      sku: 'ARGAN-50',
      quantity: 50,
      purchasePrice: 300,
      sellingPrice: 800
    });

    const requests = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          products: [{ productId: bulkProduct._id, quantity: 7, price: 800 }]
        })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const failureCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(7);
    expect(failureCount).toBe(3);

    const finalProduct = await models.Product.findById(bulkProduct._id);
    expect(finalProduct.quantity).toBe(1); // 50 - (7 * 7) = 1
  });

  // TEST 3: 10-Request Concurrency (Stock = 100, 10 requests of 20 each)
  test('TEST 3: 10-request concurrency (Stock = 100, 10 x 20) -> 5 succeed, 5 fail, final stock = 0', async () => {
    const bulkProduct100 = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Deep Conditioning Mask',
      sku: 'MASK-100',
      quantity: 100,
      purchasePrice: 400,
      sellingPrice: 950
    });

    const requests = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          products: [{ productId: bulkProduct100._id, quantity: 20, price: 950 }]
        })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const failureCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(5);
    expect(failureCount).toBe(5);

    const finalProduct = await models.Product.findById(bulkProduct100._id);
    expect(finalProduct.quantity).toBe(0); // 100 - (5 * 20) = 0
  });

  // TEST 3b: 10-Request Concurrency (Stock = 100, 10 requests of 7 each -> All succeed, stock = 30)
  test('TEST 3b: 10-request concurrency (Stock = 100, 10 x 7) -> All 10 succeed, final stock = 30', async () => {
    const bulkProduct100b = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Shampoo 250ml',
      sku: 'SHAMP-100',
      quantity: 100,
      purchasePrice: 200,
      sellingPrice: 500
    });

    const requests = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          products: [{ productId: bulkProduct100b._id, quantity: 7, price: 500 }]
        })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const failureCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(10);
    expect(failureCount).toBe(0);

    const finalProduct = await models.Product.findById(bulkProduct100b._id);
    expect(finalProduct.quantity).toBe(30); // 100 - (10 * 7) = 30
  });

  // TEST 4: Multi-Product Rollback
  test('TEST 4: Multi-product invoice rollback preserves initial stock on failure', async () => {
    const prod1 = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Volumizing Spray',
      sku: 'SPRAY-01',
      quantity: 5,
      purchasePrice: 200,
      sellingPrice: 600
    });

    const prod2 = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Rare Serum',
      sku: 'SERUM-01',
      quantity: 1,
      purchasePrice: 800,
      sellingPrice: 1800
    });

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customer._id,
        products: [
          { productId: prod1._id, quantity: 2, price: 600 },
          { productId: prod2._id, quantity: 3, price: 1800 }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient inventory for Rare Serum/i);

    const recheckedProd1 = await models.Product.findById(prod1._id);
    expect(recheckedProd1.quantity).toBe(5);

    const recheckedProd2 = await models.Product.findById(prod2._id);
    expect(recheckedProd2.quantity).toBe(1);
  });

  // TEST 5: Backbar / Appointment Completion Idempotency
  test('TEST 5: Duplicate appointment completion deducts backbar inventory exactly once', async () => {
    const service = await models.Service.create({
      salonId: salon._id,
      name: 'Spa Hair Treatment',
      category: 'Spa',
      price: 2000,
      materialCost: 500,
      requiredProducts: [{ productId: product._id, quantity: 2 }]
    });

    const appt = await models.Appointment.create({
      salonId: salon._id,
      branchId: branch._id,
      customerId: customer._id,
      staffId: staffMember._id,
      services: [{ serviceId: service._id, name: service.name, price: service.price }],
      date: new Date(),
      time: '16:00',
      status: 'Scheduled',
      inventoryDeducted: false
    });

    const [res1, res2] = await Promise.all([
      request(app)
        .put(`/api/appointments/${appt._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'Completed' }),
      request(app)
        .put(`/api/appointments/${appt._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'Completed' })
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const updatedProduct = await models.Product.findById(product._id);
    expect(updatedProduct.quantity).toBe(8); // 10 - 2 = 8

    const consumptions = await models.InventoryConsumption.find({ appointmentId: appt._id });
    expect(consumptions.length).toBe(1);
  });

  // TEST 6: Refund Idempotency (Stock = 10, Sell 3 -> 7, Refund 3 -> 10, Second Refund -> 10)
  test('TEST 6: Refund restores stock once and second refund is idempotent', async () => {
    const refundProduct = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Blow Dry Gel',
      sku: 'GEL-01',
      quantity: 10,
      purchasePrice: 150,
      sellingPrice: 400
    });

    // 1. Sell 3 units
    const invRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customer._id,
        products: [{ productId: refundProduct._id, quantity: 3, price: 400 }]
      });

    expect(invRes.status).toBe(201);
    const invoiceId = invRes.body.data._id;

    // Stock should now be 7
    let p = await models.Product.findById(refundProduct._id);
    expect(p.quantity).toBe(7);

    // 2. First Refund
    const ref1 = await request(app)
      .post(`/api/invoices/${invoiceId}/refund`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(ref1.status).toBe(200);
    expect(ref1.body.success).toBe(true);

    // Stock should be restored to 10
    p = await models.Product.findById(refundProduct._id);
    expect(p.quantity).toBe(10);

    // 3. Second Refund Attempt on same invoice (idempotent)
    const ref2 = await request(app)
      .post(`/api/invoices/${invoiceId}/refund`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(ref2.status).toBe(200);
    expect(ref2.body.success).toBe(true);

    // Stock MUST still be 10 (never 13!)
    p = await models.Product.findById(refundProduct._id);
    expect(p.quantity).toBe(10);
  });

  // TEST 7: Cross-Tenant Isolation
  test('TEST 7: Tenant B cannot deduct or access Tenant A product inventory', async () => {
    // Salon B attempts to buy Salon A's product
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${ownerTokenB}`)
      .send({
        products: [{ productId: product._id, quantity: 5, price: 1200 }]
      });

    // Product of Salon A should remain untouched (stock = 10)
    const pA = await models.Product.findById(product._id);
    expect(pA.quantity).toBe(10);
  });

});

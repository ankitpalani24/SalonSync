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

describe('SalonSync Inventory Concurrency & Race Condition Validation', () => {

  let ownerToken, salon, branch, ownerUser, customer, staffMember, product;

  beforeEach(async () => {
    salon = await models.Salon.create({
      name: 'Concurrency Test Salon',
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

    // Product with Initial Stock = 10
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
  });

  test('CONCURRENCY TEST: Simultaneous checkout of 7 units when stock is 10 ensures only 1 succeeds and final stock is 3', async () => {
    expect(product.quantity).toBe(10);

    // Launch Request A (sell 7) and Request B (sell 7) concurrently via Promise.all
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

    // Exactly ONE request must succeed (201)
    expect(successResponses.length).toBe(1);
    expect(successResponses[0].body.success).toBe(true);

    // The other request must fail (400) with "Insufficient inventory"
    expect(failedResponses.length).toBe(1);
    expect(failedResponses[0].body.success).toBe(false);
    expect(failedResponses[0].body.message).toMatch(/Insufficient inventory/i);

    // Verify database document state: Stock MUST be exactly 3 (10 - 7 = 3)
    const finalProduct = await models.Product.findById(product._id);
    expect(finalProduct.quantity).toBe(3);
    expect(finalProduct.quantity).not.toBe(10);
    expect(finalProduct.quantity).not.toBe(7);
    expect(finalProduct.quantity).not.toBe(-4);
    expect(finalProduct.quantity).not.toBe(0);
  });

  test('CONCURRENCY TEST: Multi-product invoice rolls back atomic deductions if a subsequent product has insufficient stock', async () => {
    // Product 1 has stock 5, Product 2 has stock 1
    const prod1 = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Volumizing Mousse',
      sku: 'MOUSSE-01',
      quantity: 5,
      purchasePrice: 200,
      sellingPrice: 600
    });

    const prod2 = await models.Product.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Rare Hair Mask',
      sku: 'MASK-01',
      quantity: 1,
      purchasePrice: 800,
      sellingPrice: 1800
    });

    // Attempt to buy 2 of prod1 and 3 of prod2 (prod2 will fail)
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
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Insufficient inventory for Rare Hair Mask/i);

    // Verify Prod 1 was rolled back and still has stock = 5
    const recheckedProd1 = await models.Product.findById(prod1._id);
    expect(recheckedProd1.quantity).toBe(5);

    // Verify Prod 2 still has stock = 1
    const recheckedProd2 = await models.Product.findById(prod2._id);
    expect(recheckedProd2.quantity).toBe(1);
  });

  test('CONCURRENCY TEST: Simultaneous appointment completion deducts backbar inventory exactly once', async () => {
    // Service requires 2 units of product
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
      time: '15:00',
      status: 'Scheduled',
      inventoryDeducted: false
    });

    const initialStock = product.quantity; // 10

    // Send two simultaneous requests to mark appointment Completed
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

    // Verify product stock was decremented by 2 EXACTLY ONCE: 10 - 2 = 8
    const updatedProduct = await models.Product.findById(product._id);
    expect(updatedProduct.quantity).toBe(initialStock - 2);

    // Verify only 1 InventoryConsumption record exists
    const consumptions = await models.InventoryConsumption.find({ appointmentId: appt._id });
    expect(consumptions.length).toBe(1);
    expect(consumptions[0].quantityConsumed).toBe(2);
  });

});

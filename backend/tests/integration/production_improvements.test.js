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

describe('SalonSync Production Readiness Improvements & Audits', () => {
  let salonOwnerToken;
  let staffAToken;
  let testSalonId;
  let testBranchId;
  let staffAId;
  let staffBId;
  let customerId;
  let productId;
  let serviceId;

  beforeEach(async () => {
    // 1. Create Test Salon and Branch
    const salon = await models.Salon.create({
      name: 'Production Audit Salon',
      ownerName: 'Audit Owner',
      email: 'owner@auditsalon.com',
      phone: '9888888888'
    });
    testSalonId = salon._id;

    const branch = await models.Branch.create({
      salonId: testSalonId,
      name: 'Main Flagship',
      city: 'Mumbai',
      address: 'Bandra 1st Avenue',
      phone: '9888888888'
    });
    testBranchId = branch._id;

    // 2. Create Users & Staff
    const ownerUser = await models.User.create({
      name: 'Salon Owner',
      email: 'owner@auditsalon.com',
      phone: '9888888888',
      password: 'hashedpassword',
      role: 'SALON_OWNER',
      salonId: testSalonId,
      branchId: testBranchId
    });
    salonOwnerToken = jwt.sign({ id: ownerUser._id, role: 'SALON_OWNER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const staffAUser = await models.User.create({
      name: 'Staff Alice',
      email: 'alice@auditsalon.com',
      phone: '9111111111',
      password: 'hashedpassword',
      role: 'STAFF',
      salonId: testSalonId,
      branchId: testBranchId
    });
    staffAToken = jwt.sign({ id: staffAUser._id, role: 'STAFF' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const staffADoc = await models.Staff.create({
      salonId: testSalonId,
      branchId: testBranchId,
      userId: staffAUser._id,
      name: 'Staff Alice',
      email: 'alice@auditsalon.com',
      phone: '9111111111',
      role: 'Senior Stylist',
      salary: 30000,
      commissionPercentage: 15
    });
    staffAId = staffADoc._id;

    const staffBUser = await models.User.create({
      name: 'Staff Bob',
      email: 'bob@auditsalon.com',
      phone: '9222222222',
      password: 'hashedpassword',
      role: 'STAFF',
      salonId: testSalonId,
      branchId: testBranchId
    });

    const staffBDoc = await models.Staff.create({
      salonId: testSalonId,
      branchId: testBranchId,
      userId: staffBUser._id,
      name: 'Staff Bob',
      email: 'bob@auditsalon.com',
      phone: '9222222222',
      role: 'Color Specialist',
      salary: 45000,
      commissionPercentage: 20
    });
    staffBId = staffBDoc._id;

    // 3. Create Product & Service
    const product = await models.Product.create({
      salonId: testSalonId,
      branchId: testBranchId,
      name: 'Moroccan Argan Oil Serum',
      sku: 'SERUM-ARG-100',
      quantity: 50,
      purchasePrice: 600,
      sellingPrice: 1200,
      lowStockThreshold: 5
    });
    productId = product._id;

    const service = await models.Service.create({
      salonId: testSalonId,
      name: 'Keratin Hair Treatment',
      category: 'Haircut',
      duration: 60,
      price: 3000,
      materialCost: 400,
      requiredProducts: [{
        productId: product._id,
        productName: product.name,
        quantity: 2,
        unit: 'ml'
      }]
    });
    serviceId = service._id;

    // 4. Create Customer
    const customer = await models.Customer.create({
      salonId: testSalonId,
      name: 'Sophia Williams',
      phone: '9333333333',
      email: 'sophia@example.com',
      loyaltyPoints: 100
    });
    customerId = customer._id;
  });

  // -------------------------------------------------------------
  // TEST 1: Inventory Movement Audit Trail across Sales & Refunds
  // -------------------------------------------------------------
  test('POS retail checkout decrements stock atomically and logs SALE in InventoryMovement', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${salonOwnerToken}`)
      .send({
        customerId,
        staffId: staffAId,
        services: [{ serviceId, quantity: 1, price: 3000 }],
        products: [{ productId, quantity: 3, price: 1200 }],
        discount: 0,
        tax: 18,
        paymentMethod: 'UPI'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const invoiceId = res.body.data._id;

    // Check product quantity was decremented from 50 to 47
    const product = await models.Product.findById(productId);
    expect(product.quantity).toBe(47);

    // Verify InventoryMovement record created with SALE type
    const movements = await models.InventoryMovement.find({ productId, type: 'SALE' });
    expect(movements.length).toBeGreaterThanOrEqual(1);
    const lastSale = movements[movements.length - 1];
    expect(lastSale.previousQuantity).toBe(50);
    expect(lastSale.changeQuantity).toBe(-3);
    expect(lastSale.newQuantity).toBe(47);
    expect(String(lastSale.referenceId)).toBe(String(invoiceId));
    expect(lastSale.referenceType).toBe('Invoice');

    // Refund invoice and verify stock restoration + REFUND movement
    const refundRes = await request(app)
      .post(`/api/invoices/${invoiceId}/refund`)
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(refundRes.status).toBe(200);
    expect(refundRes.body.success).toBe(true);

    const restoredProduct = await models.Product.findById(productId);
    expect(restoredProduct.quantity).toBe(50);

    const refundMovements = await models.InventoryMovement.find({ productId, type: 'REFUND' });
    expect(refundMovements.length).toBe(1);
    expect(refundMovements[0].previousQuantity).toBe(47);
    expect(refundMovements[0].changeQuantity).toBe(3);
    expect(refundMovements[0].newQuantity).toBe(50);
  });

  // -------------------------------------------------------------
  // TEST 2: Stock Adjustment Audit Trail
  // -------------------------------------------------------------
  test('Manual stock adjustment creates ADJUSTMENT/PURCHASE log in InventoryMovement', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/adjust-stock`)
      .set('Authorization', `Bearer ${salonOwnerToken}`)
      .send({
        delta: 10,
        reason: 'Shipment restock from vendor',
        type: 'PURCHASE'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(60);

    const movementRes = await request(app)
      .get(`/api/inventory/movements?productId=${productId}`)
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(movementRes.status).toBe(200);
    expect(movementRes.body.success).toBe(true);
    const purchaseMovement = movementRes.body.data.find(m => m.type === 'PURCHASE');
    expect(purchaseMovement).toBeDefined();
    expect(purchaseMovement.changeQuantity).toBe(10);
    expect(purchaseMovement.newQuantity).toBe(60);
  });

  // -------------------------------------------------------------
  // TEST 3: Staff Confidentiality & Commission Isolation
  // -------------------------------------------------------------
  test('Staff member can only view their own commissions, not peers', async () => {
    const dummyInvoiceA = await models.Invoice.create({
      salonId: testSalonId,
      branchId: testBranchId,
      customerId,
      invoiceNumber: 'INV-TEST-COMM-A',
      finalAmount: 3000,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      staffId: staffAId
    });

    const dummyInvoiceB = await models.Invoice.create({
      salonId: testSalonId,
      branchId: testBranchId,
      customerId,
      invoiceNumber: 'INV-TEST-COMM-B',
      finalAmount: 5000,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      staffId: staffBId
    });

    // Generate commission for Alice
    await models.Commission.create({
      salonId: testSalonId,
      branchId: testBranchId,
      staffId: staffAId,
      invoiceId: dummyInvoiceA._id,
      revenueGenerated: 3000,
      commissionRate: 15,
      commissionEarned: 450
    });

    // Generate commission for Bob
    await models.Commission.create({
      salonId: testSalonId,
      branchId: testBranchId,
      staffId: staffBId,
      invoiceId: dummyInvoiceB._id,
      revenueGenerated: 5000,
      commissionRate: 20,
      commissionEarned: 1000
    });

    // Alice requests commissions
    const aliceRes = await request(app)
      .get('/api/commissions')
      .set('Authorization', `Bearer ${staffAToken}`);

    expect(aliceRes.status).toBe(200);
    expect(aliceRes.body.success).toBe(true);
    // Alice should only see her commissions (staffId === staffAId)
    aliceRes.body.data.forEach(c => {
      const sId = typeof c.staffId === 'object' ? c.staffId._id : c.staffId;
      expect(String(sId)).toBe(String(staffAId));
    });

    // Salon Owner requests commissions
    const ownerRes = await request(app)
      .get('/api/commissions')
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------
  // TEST 4: Customer 360 CRM Profile Aggregation
  // -------------------------------------------------------------
  test('Customer 360 CRM Profile endpoint returns rich aggregated metrics', async () => {
    // Create an appointment for Sophia
    await models.Appointment.create({
      salonId: testSalonId,
      branchId: testBranchId,
      customerId,
      staffId: staffAId,
      services: [{ serviceId, name: 'Keratin Hair Treatment', price: 3000, duration: 60 }],
      date: new Date(),
      time: '11:00',
      duration: 60,
      status: 'Completed'
    });

    const res = await request(app)
      .get(`/api/customers/${customerId}/profile`)
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer).toBeDefined();
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalVisits).toBeGreaterThanOrEqual(1);
    expect(res.body.data.topServices).toBeDefined();
    expect(Array.isArray(res.body.data.appointments)).toBe(true);
    expect(Array.isArray(res.body.data.invoices)).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 5: Pagination Across Core Endpoints
  // -------------------------------------------------------------
  test('Pagination works seamlessly with page & limit query parameters', async () => {
    // Test Customers Pagination
    const custRes = await request(app)
      .get('/api/customers?page=1&limit=5')
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(custRes.status).toBe(200);
    expect(custRes.body.pagination).toBeDefined();
    expect(custRes.body.pagination.page).toBe(1);
    expect(custRes.body.pagination.limit).toBe(5);
    expect(custRes.body.pagination.total).toBeGreaterThanOrEqual(1);

    // Test Invoices Pagination
    const invRes = await request(app)
      .get('/api/invoices?page=1&limit=5')
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(invRes.status).toBe(200);
    expect(invRes.body.pagination).toBeDefined();

    // Test Expenses Pagination
    const expRes = await request(app)
      .get('/api/expenses?page=1&limit=5')
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(expRes.status).toBe(200);
    expect(expRes.body.pagination).toBeDefined();

    // Test Products Pagination
    const prodRes = await request(app)
      .get('/api/products?page=1&limit=5')
      .set('Authorization', `Bearer ${salonOwnerToken}`);

    expect(prodRes.status).toBe(200);
    expect(prodRes.body.pagination).toBeDefined();
  });
});

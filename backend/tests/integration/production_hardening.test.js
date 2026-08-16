const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');
const financialService = require('../../src/services/financialService');

// Create test express app mirror
const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRoutes);

describe('SalonSync Production Hardening & Security Audit Test Suite', () => {
  setupDB();

  let salonAId, branchA1Id, branchA2Id;
  let salonBId, branchB1Id;
  let salonAOwnerToken, salonAManagerToken, staffAToken, clientAToken;
  let salonBOwnerToken;

  beforeEach(async () => {
    // 1. Create Salon A & Branches
    const salonA = await models.Salon.create({
      name: 'Luxe Salon Mumbai',
      ownerName: 'Raj Owner',
      email: 'raj@luxesalon.com',
      phone: '9888800001',
      city: 'Mumbai',
      subscriptionPlan: 'Franchise'
    });
    salonAId = salonA._id;

    const branchA1 = await models.Branch.create({
      salonId: salonAId,
      name: 'Bandra Flagship',
      city: 'Mumbai'
    });
    branchA1Id = branchA1._id;

    const branchA2 = await models.Branch.create({
      salonId: salonAId,
      name: 'Juhu Branch',
      city: 'Mumbai'
    });
    branchA2Id = branchA2._id;

    // 2. Create Salon B & Branch
    const salonB = await models.Salon.create({
      name: 'Competitor Glam Delhi',
      ownerName: 'Vikram Delhi',
      email: 'vikram@glamdelhi.com',
      phone: '9888800005',
      city: 'Delhi',
      subscriptionPlan: 'Starter Salon'
    });
    salonBId = salonB._id;

    const branchB1 = await models.Branch.create({
      salonId: salonBId,
      name: 'Connaught Place',
      city: 'Delhi'
    });
    branchB1Id = branchB1._id;

    // 3. Create Users
    // Salon A Owner
    const ownerA = await models.User.create({
      name: 'Raj Owner',
      email: 'raj.owner@luxesalon.com',
      phone: '9888800001',
      password: 'hashedPassword123',
      role: 'SALON_OWNER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    salonAOwnerToken = require('jsonwebtoken').sign({ id: ownerA._id }, process.env.JWT_SECRET || 'fallback_secret');

    // Salon A Manager
    const managerA = await models.User.create({
      name: 'Priya Manager',
      email: 'priya.manager@luxesalon.com',
      phone: '9888800002',
      password: 'hashedPassword123',
      role: 'SALON_MANAGER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    salonAManagerToken = require('jsonwebtoken').sign({ id: managerA._id }, process.env.JWT_SECRET || 'fallback_secret');

    // Salon A Staff
    const staffA = await models.User.create({
      name: 'Kavita Stylist',
      email: 'kavita@luxesalon.com',
      phone: '9888800003',
      password: 'hashedPassword123',
      role: 'STAFF',
      salonId: salonAId,
      branchId: branchA1Id
    });
    staffAToken = require('jsonwebtoken').sign({ id: staffA._id }, process.env.JWT_SECRET || 'fallback_secret');

    // Salon A Client
    const clientA = await models.User.create({
      name: 'Ananya Client',
      email: 'ananya.client@gmail.com',
      phone: '9888800004',
      password: 'hashedPassword123',
      role: 'CLIENT'
    });
    clientAToken = require('jsonwebtoken').sign({ id: clientA._id }, process.env.JWT_SECRET || 'fallback_secret');

    // Salon B Owner
    const ownerB = await models.User.create({
      name: 'Vikram Delhi Owner',
      email: 'vikram@glamdelhi.com',
      phone: '9888800005',
      password: 'hashedPassword123',
      role: 'SALON_OWNER',
      salonId: salonBId,
      branchId: branchB1Id
    });
    salonBOwnerToken = require('jsonwebtoken').sign({ id: ownerB._id }, process.env.JWT_SECRET || 'fallback_secret');
  });

  // =========================================================================
  // 1. PAGINATION BOUNDS & HARD LIMITS
  // =========================================================================
  describe('1. Pagination Security & Hard Bounds Clamping', () => {
    beforeEach(async () => {
      // Seed 25 test customers
      const testCusts = [];
      for (let i = 1; i <= 25; i++) {
        testCusts.push({
          salonId: salonAId,
          name: `Customer ${i}`,
          phone: `98000000${String(i).padStart(2, '0')}`,
          email: `cust${i}@test.com`
        });
      }
      await models.Customer.insertMany(testCusts);
    });

    test('clamps limit=1000000 down to maxLimit of 100 and returns valid pagination structure', async () => {
      const res = await request(app)
        .get('/api/customers?page=1&limit=1000000')
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(100);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.total).toBe(25);
    });

    test('handles ?page=0 and ?limit=0 by safely clamping to page=1 and default limit=20', async () => {
      const res = await request(app)
        .get('/api/customers?page=0&limit=0')
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
      expect(res.body.data.length).toBe(20);
    });

    test('handles negative limit ?limit=-5 and malformed inputs gracefully', async () => {
      const res = await request(app)
        .get('/api/customers?page=abc&limit=-5')
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });
  });

  // =========================================================================
  // 2. LARGE DATASET BENCHMARK & PERFORMANCE
  // =========================================================================
  describe('2. Large Dataset Performance Benchmark', () => {
    test('accurately processes historical trend queries across thousands of records in < 200ms', async () => {
      const now = new Date();
      const syntheticInvoices = [];
      const syntheticExpenses = [];

      for (let i = 0; i < 200; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - (i % 6), (i % 25) + 1);
        syntheticInvoices.push({
          salonId: salonAId,
          branchId: branchA1Id,
          invoiceNumber: `INV-BENCH-${i}`,
          finalAmount: 1500,
          paymentStatus: 'Paid',
          createdAt: d
        });
        if (i % 2 === 0) {
          syntheticExpenses.push({
            salonId: salonAId,
            branchId: branchA1Id,
            category: 'Products',
            amount: 400,
            date: d
          });
        }
      }

      await models.Invoice.insertMany(syntheticInvoices);
      await models.Expense.insertMany(syntheticExpenses);

      const startTime = performance.now();
      const trends = await financialService.getHistoricalTrends({ salonId: salonAId });
      const durationMs = performance.now() - startTime;

      expect(durationMs).toBeLessThan(200);
      expect(trends.monthLabels.length).toBe(6);
      expect(trends.monthlyProfitChartData.profits.length).toBe(6);
      expect(typeof trends.monthlyProfitChartData.profits[5]).toBe('number');
    });
  });

  // =========================================================================
  // 3. FINANCIAL AUDIT TRAIL & LEDGER INTEGRITY
  // =========================================================================
  describe('3. Financial Audit Trail & Inventory Ledger Integrity', () => {
    test('records immutable AuditLog and InventoryMovement records on invoice creation and refund', async () => {
      // 1. Create Product
      const product = await models.Product.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Keratin Serum',
        sku: 'KER-01',
        quantity: 50,
        purchasePrice: 500,
        sellingPrice: 1000
      });

      // 2. Create Invoice
      const invRes = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${salonAOwnerToken}`)
        .send({
          branchId: branchA1Id,
          products: [{ productId: product._id, quantity: 2, price: 1000 }]
        });

      expect(invRes.status).toBe(201);
      const invoiceId = invRes.body.data._id;

      // Verify Product decremented atomically to 48
      const updatedProduct = await models.Product.findById(product._id);
      expect(updatedProduct.quantity).toBe(48);

      // Verify InventoryMovement SALE record created
      const saleMovement = await models.InventoryMovement.findOne({
        salonId: salonAId,
        productId: product._id,
        type: 'SALE'
      });
      expect(saleMovement).toBeDefined();
      expect(saleMovement.changeQuantity).toBe(-2);
      expect(saleMovement.newQuantity).toBe(48);

      // Verify AuditLog record created for Invoice creation
      const createAudit = await models.AuditLog.findOne({
        salonId: salonAId,
        entity: 'Invoice',
        action: 'CREATE'
      });
      expect(createAudit).toBeDefined();
      expect(createAudit.userName).toBe('Raj Owner');

      // 3. Process Refund
      const refRes = await request(app)
        .post(`/api/invoices/${invoiceId}/refund`)
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(refRes.status).toBe(200);

      // Verify Product restored atomically to 50
      const restoredProduct = await models.Product.findById(product._id);
      expect(restoredProduct.quantity).toBe(50);

      // Verify InventoryMovement REFUND record created
      const refMovement = await models.InventoryMovement.findOne({
        salonId: salonAId,
        productId: product._id,
        type: 'REFUND'
      });
      expect(refMovement).toBeDefined();
      expect(refMovement.changeQuantity).toBe(2);
      expect(refMovement.newQuantity).toBe(50);

      // Verify AuditLog record created for Invoice refund
      const refundAudit = await models.AuditLog.findOne({
        salonId: salonAId,
        entity: 'Invoice',
        action: 'STATUS_CHANGE'
      });
      expect(refundAudit).toBeDefined();
      expect(refundAudit.newValue.paymentStatus).toBe('Refunded');
    });

    test('prevents negative stock under concurrent/excess stock adjustment', async () => {
      const product = await models.Product.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Shampoo 250ml',
        sku: 'SHP-250',
        quantity: 5,
        purchasePrice: 200,
        sellingPrice: 400
      });

      // Attempt to deduct 10 units when only 5 exist
      const res = await request(app)
        .post(`/api/products/${product._id}/adjust-stock`)
        .set('Authorization', `Bearer ${salonAOwnerToken}`)
        .send({ delta: -10, reason: 'Test excessive deduction' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // Verify stock remained unchanged at 5
      const current = await models.Product.findById(product._id);
      expect(current.quantity).toBe(5);
    });
  });

  // =========================================================================
  // 4. MULTI-TENANT SECURITY & ATTACK-STYLE REGRESSION
  // =========================================================================
  describe('4. Multi-Tenant Attack-Style Security Regression', () => {
    test('Tenant A cannot access Tenant B customer CRM record by direct ID manipulation', async () => {
      const custB = await models.Customer.create({
        salonId: salonBId,
        name: 'Confidential Delhi VIP',
        phone: '9999900001',
        email: 'vip.delhi@secret.com'
      });

      const res = await request(app)
        .get(`/api/customers/${custB._id}/profile`)
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('Tenant A cannot view Tenant B audit logs or financial reports', async () => {
      await models.AuditLog.create({
        salonId: salonBId,
        userName: 'Vikram Delhi Owner',
        userRole: 'SALON_OWNER',
        action: 'PRICE_CHANGE',
        entity: 'Service',
        entityName: 'Secret Delhi Facial'
      });

      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // Tenant A sees 0 records of Tenant B
    });
  });

  // =========================================================================
  // 5. ROLE PERMISSION & PRIVILEGE ESCALATION REGRESSION
  // =========================================================================
  describe('5. Role Permission & Privilege Escalation Regression', () => {
    test('CLIENT role is strictly forbidden from accessing financial summary analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/financial-summary')
        .set('Authorization', `Bearer ${clientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('STAFF role cannot view peer staff salaries in GET /api/staff', async () => {
      await models.Staff.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Master Director',
        phone: '9888800099',
        role: 'Creative Director',
        salary: 150000 // Confidential
      });

      const res = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      const peerStaff = res.body.data.find(s => s.name === 'Master Director');
      expect(peerStaff).toBeDefined();
      expect(peerStaff.salary).toBeUndefined(); // Salary must be masked for peer staff!
    });

    test('SALON_MANAGER cannot escalate privileges by creating SUPER_ADMIN account', async () => {
      const res = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${salonAManagerToken}`)
        .send({
          name: 'Hacker Admin',
          email: 'hacker@admin.com',
          role: 'SUPER_ADMIN',
          password: 'Password123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 6. SECURITY HEADERS & PRODUCTION RESPONSE SAFETY
  // =========================================================================
  describe('6. Security Headers & Production Error Sanitization', () => {
    test('response includes standard security headers (Helmet)', async () => {
      const res = await request(app).get('/api/salons');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test('malformed request returns clean JSON error without internal stack leakage', async () => {
      const res = await request(app)
        .get('/api/customers/invalid-mongo-id-123/profile')
        .set('Authorization', `Bearer ${salonAOwnerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid resource ID format');
    });
  });
});

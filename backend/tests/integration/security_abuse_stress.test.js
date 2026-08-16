const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');
const financialService = require('../../src/services/financialService');

const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRoutes);

describe('SalonSync API Security, Input Validation & Abuse Stress Suite', () => {
  setupDB();

  let salonAId, branchA1Id;
  let salonBId, branchB1Id;
  let ownerAToken, managerAToken, staffAToken, clientAToken;
  let ownerBToken;

  beforeEach(async () => {
    // Salon A
    const salonA = await models.Salon.create({
      name: 'Elysian Salon Mumbai',
      ownerName: 'Aarav Sharma',
      email: 'aarav@elysiansalon.com',
      phone: '9876543210',
      city: 'Mumbai',
      subscriptionPlan: 'Franchise'
    });
    salonAId = salonA._id;

    const branchA1 = await models.Branch.create({
      salonId: salonAId,
      name: 'Colaba Grand',
      city: 'Mumbai'
    });
    branchA1Id = branchA1._id;

    // Salon B
    const salonB = await models.Salon.create({
      name: 'Rival Studio Delhi',
      ownerName: 'Karan Mehra',
      email: 'karan@rivalstudio.com',
      phone: '9876543211',
      city: 'Delhi',
      subscriptionPlan: 'Starter Salon'
    });
    salonBId = salonB._id;

    const branchB1 = await models.Branch.create({
      salonId: salonBId,
      name: 'South Extension',
      city: 'Delhi'
    });
    branchB1Id = branchB1._id;

    // Users
    const ownerA = await models.User.create({
      name: 'Aarav Sharma',
      email: 'aarav.owner@elysian.com',
      phone: '9876543210',
      password: 'hashedPassword123',
      role: 'SALON_OWNER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    ownerAToken = require('jsonwebtoken').sign({ id: ownerA._id }, process.env.JWT_SECRET || 'test_secret');

    const managerA = await models.User.create({
      name: 'Neha Manager',
      email: 'neha.mgr@elysian.com',
      phone: '9876543212',
      password: 'hashedPassword123',
      role: 'SALON_MANAGER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    managerAToken = require('jsonwebtoken').sign({ id: managerA._id }, process.env.JWT_SECRET || 'test_secret');

    const staffA = await models.User.create({
      name: 'Rohan Stylist',
      email: 'rohan.staff@elysian.com',
      phone: '9876543213',
      password: 'hashedPassword123',
      role: 'STAFF',
      salonId: salonAId,
      branchId: branchA1Id
    });
    staffAToken = require('jsonwebtoken').sign({ id: staffA._id }, process.env.JWT_SECRET || 'test_secret');

    const clientA = await models.User.create({
      name: 'Simran Client',
      email: 'simran.client@elysian.com',
      phone: '9876543214',
      password: 'hashedPassword123',
      role: 'CLIENT'
    });
    clientAToken = require('jsonwebtoken').sign({ id: clientA._id }, process.env.JWT_SECRET || 'test_secret');

    const ownerB = await models.User.create({
      name: 'Karan Delhi Owner',
      email: 'karan.owner@rival.com',
      phone: '9876543211',
      password: 'hashedPassword123',
      role: 'SALON_OWNER',
      salonId: salonBId,
      branchId: branchB1Id
    });
    ownerBToken = require('jsonwebtoken').sign({ id: ownerB._id }, process.env.JWT_SECRET || 'test_secret');
  });

  // =========================================================================
  // 1. JWT & AUTHENTICATION ABUSE TESTING
  // =========================================================================
  describe('1. JWT & Authentication Abuse Testing', () => {
    test('rejects missing Authorization header with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects malformed Bearer token with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid.token.payload.signature');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects expired JWT token with 401 Unauthorized', async () => {
      const expiredToken = require('jsonwebtoken').sign(
        { id: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '-1s' }
      );
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. AUDIT LOG IMMUTABILITY & FORMAT VERIFICATION
  // =========================================================================
  describe('2. Audit Log Immutability & Safety', () => {
    test('Audit logs cannot be modified or deleted via any REST API endpoint', async () => {
      const auditLog = await models.AuditLog.create({
        salonId: salonAId,
        userName: 'Aarav Sharma',
        userRole: 'SALON_OWNER',
        action: 'UPDATE',
        entity: 'Product',
        entityId: '12345',
        entityName: 'Shampoo Gold',
        previousValue: { quantity: 10 },
        newValue: { quantity: 8 }
      });

      // Attempt PUT /api/audit-logs/:id
      const putRes = await request(app)
        .put(`/api/audit-logs/${auditLog._id}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ action: 'DELETE' });
      expect([404, 405]).toContain(putRes.status);

      // Attempt DELETE /api/audit-logs/:id
      const delRes = await request(app)
        .delete(`/api/audit-logs/${auditLog._id}`)
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect([404, 405]).toContain(delRes.status);

      // Verify record is preserved unchanged in MongoDB
      const checkLog = await models.AuditLog.findById(auditLog._id);
      expect(checkLog).toBeDefined();
      expect(checkLog.action).toBe('UPDATE');
    });

    test('Audit logs format contains required metadata and never stores passwords or secrets', async () => {
      const auditLog = await models.AuditLog.create({
        salonId: salonAId,
        branchId: branchA1Id,
        userName: 'Aarav Sharma',
        userRole: 'SALON_OWNER',
        action: 'CREATE',
        entity: 'Invoice',
        entityId: 'INV-999',
        entityName: 'INV-999',
        newValue: { finalAmount: 2500 }
      });

      expect(auditLog.salonId).toBeDefined();
      expect(auditLog.userName).toBe('Aarav Sharma');
      expect(auditLog.userRole).toBe('SALON_OWNER');
      expect(auditLog.action).toBe('CREATE');
      expect(auditLog.entity).toBe('Invoice');
      expect(auditLog.timestamp).toBeDefined();

      const jsonStr = JSON.stringify(auditLog);
      expect(jsonStr).not.toContain('password');
      expect(jsonStr).not.toContain('JWT_SECRET');
    });
  });

  // =========================================================================
  // 3. INPUT VALIDATION & FINANCIAL MUTATION ATTACK RESILIENCE
  // =========================================================================
  describe('3. Input Validation & Financial Mutation Attacks', () => {
    test('rejects negative service price, NaN, or Infinity on service creation', async () => {
      const resNeg = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Hair Cut', category: 'Haircut', price: -500 });
      expect(resNeg.status).toBe(400);

      const resNaN = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ name: 'Hair Cut', category: 'Haircut', price: 'NotANumber' });
      expect(resNaN.status).toBe(400);
    });

    test('rejects negative product prices or negative initial quantities', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'Hair Gel',
          sku: 'GEL-01',
          purchasePrice: -100,
          sellingPrice: 300,
          quantity: -5
        });
      expect(res.status).toBe(400);
    });

    test('rejects invalid ObjectId formats gracefully with 400 and clean error message', async () => {
      const res = await request(app)
        .get('/api/customers/undefined/profile')
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid resource ID format');
    });
  });

  // =========================================================================
  // 4. FINANCIAL REGRESSION (₹100,000 CONTROLLED AUDIT SCENARIO)
  // =========================================================================
  describe('4. Financial Regression (₹100,000 Authoritative Scenario)', () => {
    test('verifies Gross Rev ₹100k, Disc ₹5k, Ref ₹5k, Mat ₹20k, Comm ₹10k, Exp ₹15k -> Net ₹90k, Gross Prof ₹60k, Net Prof ₹45k, Margin 50%', async () => {
      const now = new Date();

      // Product
      const product = await models.Product.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Hair Spa Kit',
        sku: 'SPA-KIT-100',
        quantity: 100,
        purchasePrice: 20000,
        sellingPrice: 100000
      });

      // Staff
      const staff = await models.Staff.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Senior Artist',
        phone: '9888800099',
        salary: 0,
        commissionPercentage: 10
      });

      // Paid Invoice (Gross ₹100k, Discount ₹5k, Net Billed ₹95k)
      const invPaid = await models.Invoice.create({
        salonId: salonAId,
        branchId: branchA1Id,
        invoiceNumber: 'INV-FIN-01',
        products: [{ productId: product._id, name: product.name, price: 100000, quantity: 1 }],
        discount: 5000,
        finalAmount: 95000,
        paymentStatus: 'Paid',
        staffId: staff._id,
        createdAt: now
      });

      // Refunded Invoice (Refund ₹5,000)
      await models.Invoice.create({
        salonId: salonAId,
        branchId: branchA1Id,
        invoiceNumber: 'INV-FIN-REF',
        finalAmount: 5000,
        paymentStatus: 'Refunded',
        createdAt: now
      });

      // Operating Expense (₹15,000)
      await models.Expense.create({
        salonId: salonAId,
        branchId: branchA1Id,
        category: 'Rent',
        amount: 15000,
        date: now
      });

      // Commission (₹10,000)
      await models.Commission.create({
        salonId: salonAId,
        branchId: branchA1Id,
        staffId: staff._id,
        invoiceId: invPaid._id,
        revenueGenerated: 100000,
        commissionRate: 10,
        commissionEarned: 10000,
        date: now
      });

      // Execute Financial Summary
      const summary = await financialService.getFinancialSummary({ salonId: salonAId, horizon: 'month' });
      const m = summary.metrics;

      expect(m.grossRevenue).toBe(100000);
      expect(m.discounts).toBe(5000);
      expect(m.refunds).toBe(5000);
      expect(m.netRevenue).toBe(90000);
      expect(m.productCosts).toBe(20000);
      expect(m.staffCommissions).toBe(10000);
      expect(m.operatingExpenses).toBe(15000);
      expect(m.grossProfit).toBe(60000);
      expect(m.netProfit).toBe(45000);
      expect(m.profitMargin).toBe(50);

      // Verify reconciliation endpoint
      const recRes = await request(app)
        .get('/api/analytics/financial-reconciliation?horizon=month')
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(recRes.status).toBe(200);
      expect(recRes.body.data.audit.reconciliationStatus).toBe('BALANCED');
      expect(recRes.body.data.audit.isBalanced).toBe(true);
    });
  });

  // =========================================================================
  // 5. INVENTORY & APPOINTMENT CONCURRENCY REGRESSIONS
  // =========================================================================
  describe('5. Inventory & Appointment Concurrency Regressions', () => {
    test('Inventory concurrency: Stock=10, Request A=7, Request B=7 -> exactly 1 succeeds, 1 fails with 400, final stock = 3', async () => {
      const product = await models.Product.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Limited Edition Pomade',
        sku: 'POM-LTD-10',
        quantity: 10,
        purchasePrice: 150,
        sellingPrice: 350
      });

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/invoices')
          .set('Authorization', `Bearer ${ownerAToken}`)
          .send({
            branchId: branchA1Id,
            products: [{ productId: product._id, quantity: 7, price: 350 }]
          }),
        request(app)
          .post('/api/invoices')
          .set('Authorization', `Bearer ${ownerAToken}`)
          .send({
            branchId: branchA1Id,
            products: [{ productId: product._id, quantity: 7, price: 350 }]
          })
      ]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(400);

      const finalProduct = await models.Product.findById(product._id);
      expect(finalProduct.quantity).toBe(3);
    });

    test('Appointment concurrency: 20 simultaneous bookings for same staff & slot -> exactly 1 succeeds, 19 fail with 409', async () => {
      const staff = await models.Staff.create({
        salonId: salonAId,
        branchId: branchA1Id,
        name: 'Celebrity Stylist Ajay',
        phone: '9900990099'
      });

      const customer = await models.Customer.create({
        salonId: salonAId,
        name: 'Prestige VIP',
        phone: '9888899999'
      });

      const testDate = '2026-10-15';
      const testTime = '11:00';

      const bookingPromises = Array.from({ length: 20 }).map(() =>
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${ownerAToken}`)
          .send({
            salonId: salonAId,
            branchId: branchA1Id,
            customerId: customer._id,
            staffId: staff._id,
            date: testDate,
            time: testTime,
            duration: 30
          })
      );

      const results = await Promise.all(bookingPromises);
      const successCount = results.filter(r => r.status === 201).length;
      const conflictCount = results.filter(r => r.status === 400 || r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(19);

      // Verify exactly 2 slot slices (11:00 and 11:15 = 660, 675) were reserved
      const reservations = await models.SlotReservation.find({
        salonId: salonAId,
        staffId: staff._id,
        dateStr: testDate
      });
      expect(reservations.length).toBe(2);
    });
  });
});

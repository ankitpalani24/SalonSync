const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');
const correlationAndLogger = require('../../src/middleware/observability');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(correlationAndLogger);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use('/api', apiRoutes);

setupDB();

describe('SalonSync Final Production Security, Concurrency & Acceptance Test Suite', () => {
  let salonA, branchA, ownerUserA, ownerTokenA;
  let salonB, branchB, ownerUserB, ownerTokenB;
  let managerUserA, managerTokenA;
  let staffUserA, staffTokenA, staffMemberA;
  let clientUserA, clientTokenA;
  let superAdminUser, superAdminToken;

  beforeEach(async () => {
    // 1. Create Salon A (Primary Tenant)
    salonA = await models.Salon.create({
      name: 'Luxe Salon A',
      ownerName: 'Alice Owner',
      email: 'alice@salona.com',
      phone: '9876543210',
      subscriptionPlan: 'Franchise',
      subscriptionStatus: 'Active'
    });

    branchA = await models.Branch.create({
      salonId: salonA._id,
      name: 'Bandra Main Branch',
      city: 'Mumbai',
      status: 'Active'
    });

    ownerUserA = await models.User.create({
      name: 'Alice Owner',
      email: 'alice@salona.com',
      phone: '9876543210',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salonA._id,
      branchId: branchA._id,
      tokenVersion: 1
    });
    ownerTokenA = jwt.sign({ id: ownerUserA._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    managerUserA = await models.User.create({
      name: 'Bob Manager',
      email: 'bob@salona.com',
      phone: '9876543211',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_MANAGER',
      salonId: salonA._id,
      branchId: branchA._id,
      tokenVersion: 1
    });
    managerTokenA = jwt.sign({ id: managerUserA._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    staffUserA = await models.User.create({
      name: 'Charlie Stylist',
      email: 'charlie@salona.com',
      phone: '9876543212',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'STAFF',
      salonId: salonA._id,
      branchId: branchA._id,
      tokenVersion: 1
    });
    staffTokenA = jwt.sign({ id: staffUserA._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    staffMemberA = await models.Staff.create({
      salonId: salonA._id,
      branchId: branchA._id,
      userId: staffUserA._id,
      name: 'Charlie Stylist',
      phone: '9876543212',
      email: 'charlie@salona.com',
      role: 'Senior Stylist',
      salary: 30000,
      commissionPercentage: 15,
      rating: 4.8
    });

    clientUserA = await models.User.create({
      name: 'Diana Client',
      email: 'diana@client.com',
      phone: '9876543213',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'CLIENT',
      salonId: salonA._id,
      branchId: branchA._id,
      tokenVersion: 1
    });
    clientTokenA = jwt.sign({ id: clientUserA._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    // 2. Create Salon B (Isolated Competitor Tenant)
    salonB = await models.Salon.create({
      name: 'Competitor Salon B',
      ownerName: 'Eve Competitor',
      email: 'eve@salonb.com',
      phone: '9123456780',
      subscriptionPlan: 'Starter Salon',
      subscriptionStatus: 'Active'
    });

    branchB = await models.Branch.create({
      salonId: salonB._id,
      name: 'Delhi North Branch',
      city: 'Delhi',
      status: 'Active'
    });

    ownerUserB = await models.User.create({
      name: 'Eve Competitor',
      email: 'eve@salonb.com',
      phone: '9123456780',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salonB._id,
      branchId: branchB._id,
      tokenVersion: 1
    });
    ownerTokenB = jwt.sign({ id: ownerUserB._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    // 3. Super Admin
    superAdminUser = await models.User.create({
      name: 'Super Admin',
      email: 'admin@salonsync.global',
      phone: '9999999999',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SUPER_ADMIN',
      tokenVersion: 1
    });
    superAdminToken = jwt.sign({ id: superAdminUser._id, tokenVersion: 1 }, process.env.JWT_SECRET);
  });

  // =========================================================================
  // 1. MULTI-TENANT SECURITY & PRIVILEGE ESCALATION ATTACK TESTS
  // =========================================================================
  describe('1. Multi-Tenant Authorization & Privilege Escalation Defenses', () => {
    test('CLIENT role is strictly blocked from financial and management endpoints', async () => {
      const expensesRes = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${clientTokenA}`);
      expect(expensesRes.status).toBe(403);

      const finSumRes = await request(app)
        .get('/api/analytics/financial-summary')
        .set('Authorization', `Bearer ${clientTokenA}`);
      expect(finSumRes.status).toBe(403);

      const staffManageRes = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${clientTokenA}`)
        .send({ name: 'Hacked Staff', phone: '9999999999' });
      expect(staffManageRes.status).toBe(403);
    });

    test('STAFF role cannot view other staff salaries or salon financial analytics', async () => {
      // Create a second staff member in Salon A with salary
      const secondStaff = await models.Staff.create({
        salonId: salonA._id,
        branchId: branchA._id,
        name: 'Secret Earner',
        phone: '9111122222',
        email: 'secret@salona.com',
        salary: 75000,
        commissionPercentage: 20
      });

      const staffRes = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${staffTokenA}`);

      expect(staffRes.status).toBe(200);
      const list = staffRes.body.data;
      const own = list.find(s => s.name === 'Charlie Stylist');
      const other = list.find(s => s.name === 'Secret Earner');

      expect(own.salary).toBeDefined(); // Charlie can see own salary
      expect(other.salary).toBeUndefined(); // Charlie CANNOT see other staff salary

      // STAFF cannot view financial summary
      const finRes = await request(app)
        .get('/api/analytics/financial-summary')
        .set('Authorization', `Bearer ${staffTokenA}`);
      expect(finRes.status).toBe(403);
    });

    test('SALON_MANAGER is forbidden from issuing refunds (billing.refund permission)', async () => {
      const invoice = await models.Invoice.create({
        invoiceNumber: 'INV-TEST-REFUND-01',
        salonId: salonA._id,
        branchId: branchA._id,
        finalAmount: 1000,
        paymentStatus: 'Paid'
      });

      const refundRes = await request(app)
        .post(`/api/invoices/${invoice._id}/refund`)
        .set('Authorization', `Bearer ${managerTokenA}`)
        .send({});

      expect(refundRes.status).toBe(403);
      expect(refundRes.body.message).toMatch(/Forbidden|lacks required permission/i);
    });

    test('SALON_MANAGER cannot create SUPER_ADMIN or SALON_OWNER (privilege escalation blocked)', async () => {
      const escalateRes = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${managerTokenA}`)
        .send({
          name: 'Fake Admin',
          email: 'fakeadmin@salona.com',
          phone: '9000000000',
          role: 'SUPER_ADMIN'
        });

      expect(escalateRes.status).toBe(403);
      expect(escalateRes.body.message).toMatch(/Forbidden: Your role 'SALON_MANAGER' cannot create users with role 'SUPER_ADMIN'/i);
    });

    test('IDOR Attack: Salon Owner A cannot access or delete Salon B resources', async () => {
      const customerB = await models.Customer.create({
        salonId: salonB._id,
        branchId: branchB._id,
        name: 'VIP Client of Salon B',
        phone: '9900990099'
      });

      // Owner A tries to fetch Customer B profile
      const getRes = await request(app)
        .get(`/api/customers/${customerB._id}/profile`)
        .set('Authorization', `Bearer ${ownerTokenA}`);
      expect(getRes.status).toBe(404);

      // Owner A tries to delete Customer B
      const delRes = await request(app)
        .delete(`/api/customers/${customerB._id}`)
        .set('Authorization', `Bearer ${ownerTokenA}`);
      expect(delRes.status).toBe(404);
    });

    test('Cross-tenant Branch IDOR on user creation is rejected', async () => {
      const idorBranchRes = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${ownerTokenA}`)
        .send({
          name: 'Hijacked User',
          email: 'hijack@salona.com',
          phone: '9888877777',
          role: 'STAFF',
          branchId: branchB._id // Branch B belongs to Salon B!
        });

      expect(idorBranchRes.status).toBe(400);
      expect(idorBranchRes.body.message).toMatch(/Branch does not belong to this salon/i);
    });
  });

  // =========================================================================
  // 2. INVENTORY ATOMICITY & BACKBAR CONCURRENCY
  // =========================================================================
  describe('2. Inventory Atomicity & Backbar Concurrency Verification', () => {
    test('Backbar service deduction enforces quantity >= requested and avoids negative stock', async () => {
      const product = await models.Product.create({
        salonId: salonA._id,
        branchId: branchA._id,
        name: 'Bleaching Powder',
        sku: 'BLEACH-500',
        quantity: 2, // Only 2 units available
        purchasePrice: 100,
        sellingPrice: 200
      });

      const service = await models.Service.create({
        salonId: salonA._id,
        name: 'Hair Bleach Service',
        category: 'Hair Color',
        duration: 60,
        price: 2000,
        requiredProducts: [
          { productId: product._id, productName: product.name, quantity: 5 } // Requires 5 units!
        ]
      });

      const appointment = await models.Appointment.create({
        salonId: salonA._id,
        branchId: branchA._id,
        customerId: clientUserA._id,
        staffId: staffMemberA._id,
        services: [{ serviceId: service._id, name: service.name, price: 2000, duration: 60 }],
        date: new Date(),
        time: '14:00',
        status: 'Scheduled',
        inventoryDeducted: false
      });

      // Complete the appointment
      const completeRes = await request(app)
        .put(`/api/appointments/${appointment._id}`)
        .set('Authorization', `Bearer ${ownerTokenA}`)
        .send({ status: 'Completed' });

      expect(completeRes.status).toBe(200);

      // Product quantity should still be 2 (NOT decremented to negative -3)
      const refetchedProduct = await models.Product.findById(product._id);
      expect(refetchedProduct.quantity).toBe(2);
      expect(refetchedProduct.quantity).toBeGreaterThanOrEqual(0);
    });

    test('Concurrent completion of appointment deduplicates backbar deduction via atomic condition', async () => {
      const product = await models.Product.create({
        salonId: salonA._id,
        branchId: branchA._id,
        name: 'Keratin Ampoule',
        sku: 'KER-AMP-10',
        quantity: 10,
        purchasePrice: 150,
        sellingPrice: 300
      });

      const service = await models.Service.create({
        salonId: salonA._id,
        name: 'Keratin Infusion',
        category: 'Other',
        duration: 45,
        price: 1500,
        requiredProducts: [
          { productId: product._id, productName: product.name, quantity: 2 }
        ]
      });

      const appointment = await models.Appointment.create({
        salonId: salonA._id,
        branchId: branchA._id,
        customerId: clientUserA._id,
        staffId: staffMemberA._id,
        services: [{ serviceId: service._id, name: service.name, price: 1500, duration: 45 }],
        date: new Date(),
        time: '16:00',
        status: 'Scheduled',
        inventoryDeducted: false
      });

      // 10 concurrent requests to complete the appointment
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .put(`/api/appointments/${appointment._id}`)
          .set('Authorization', `Bearer ${ownerTokenA}`)
          .send({ status: 'Completed' })
      );

      const responses = await Promise.all(requests);
      responses.forEach(r => expect(r.status).toBe(200));

      // Product stock should be decremented EXACTLY ONCE: 10 - 2 = 8
      const finalProduct = await models.Product.findById(product._id);
      expect(finalProduct.quantity).toBe(8);

      // Inventory movement recorded exactly once for this appointment
      const movements = await models.InventoryMovement.find({
        referenceId: appointment._id,
        type: 'SERVICE_USAGE'
      });
      expect(movements.length).toBe(1);
      expect(movements[0].changeQuantity).toBe(-2);
      expect(movements[0].previousQuantity).toBe(10);
      expect(movements[0].newQuantity).toBe(8);
    });
  });

  // =========================================================================
  // 3. FULL 22-STEP PRODUCTION ACCEPTANCE TEST
  // =========================================================================
  describe('3. Complete 22-Step Production Lifecycle Acceptance Test', () => {
    test('Simulate complete end-to-end salon enterprise lifecycle against database', async () => {
      // Step 1: Salon owner registers
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'E2E Owner',
          email: 'e2eowner@salonsync.io',
          phone: '9888800001',
          password: 'Password@123',
          salonName: 'E2E Royal Sanctuary',
          salonAddress: '100 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          businessType: 'Luxury Spa'
        });
      expect(signupRes.status).toBe(201);
      const e2eToken = signupRes.body.token;
      const e2eUser = signupRes.body.user;
      const e2eSalonId = e2eUser.salonId;
      const e2eBranchId = e2eUser.branchId;

      // Step 2 & 3: Verify Salon and default Branch exist
      const salonDoc = await models.Salon.findById(e2eSalonId);
      expect(salonDoc).toBeDefined();
      expect(salonDoc.name).toBe('E2E Royal Sanctuary');

      // Create a secondary branch
      const branchRes = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({
          name: 'Colaba Branch',
          city: 'Mumbai',
          phone: '9888800002',
          status: 'Active'
        });
      expect(branchRes.status).toBe(201);
      const secondBranchId = branchRes.body.data._id;

      // Step 4: Add Staff
      const staffRes = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({
          name: 'Sophie Artist',
          phone: '9888800003',
          role: 'Master Colorist',
          salary: 40000,
          commissionPercentage: 10,
          branchId: secondBranchId
        });
      expect(staffRes.status).toBe(201);
      const staffId = staffRes.body.data._id;

      // Step 5: Add Service
      const productRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({
          name: 'Gold Serum 100ml',
          sku: 'GOLD-SER-100',
          category: 'Hair Care',
          quantity: 20,
          purchasePrice: 500,
          sellingPrice: 1200,
          lowStockThreshold: 3
        });
      expect(productRes.status).toBe(201);
      const productId = productRes.body.data._id;

      const serviceRes = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({
          name: 'Gold Radiance Hair Treatment',
          category: 'Hair Color',
          duration: 60,
          price: 3000,
          materialCost: 200,
          requiredProducts: [
            { productId, productName: 'Gold Serum 100ml', quantity: 1 }
          ]
        });
      expect(serviceRes.status).toBe(201);
      const serviceId = serviceRes.body.data._id;

      // Step 7: Client registers
      const clientSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Eleanor Client',
          email: 'eleanor@client.io',
          phone: '9888800004',
          password: 'Password@123',
          role: 'CLIENT'
        });
      expect(clientSignup.status).toBe(201);
      const clientToken = clientSignup.body.token;

      // Step 8: Client books appointment
      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          salonId: e2eSalonId,
          branchId: secondBranchId,
          staffId,
          date: new Date().toISOString().split('T')[0],
          time: '11:00',
          duration: 60,
          services: [{ serviceId, name: 'Gold Radiance Hair Treatment', price: 3000, duration: 60 }]
        });
      expect(apptRes.status).toBe(201);
      const appointmentId = apptRes.body.data._id;

      // Step 9 & 10: Staff completes appointment and backbar inventory deducted
      const apptCompleteRes = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({ status: 'Completed' });
      expect(apptCompleteRes.status).toBe(200);

      // Backbar product: 20 - 1 = 19
      const prodAfterService = await models.Product.findById(productId);
      expect(prodAfterService.quantity).toBe(19);

      // Step 11 & 12: Client pays & Invoice generated (1 service + 1 retail product sale)
      const customerDoc = await models.Customer.findOne({ salonId: e2eSalonId, email: 'eleanor@client.io' });

      const invoiceRes = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({
          customerId: customerDoc._id,
          branchId: secondBranchId,
          staffId,
          services: [{ serviceId, name: 'Gold Radiance Hair Treatment', price: 3000, quantity: 1 }],
          products: [{ productId, name: 'Gold Serum 100ml', price: 1200, quantity: 2 }],
          tax: 0,
          discount: 200,
          paymentMethod: 'UPI'
        });
      expect(invoiceRes.status).toBe(201);
      const invoiceId = invoiceRes.body.data._id;
      const finalAmount = invoiceRes.body.data.finalAmount;
      // subtotal: 3000 + 2400 = 5400 - 200 discount = 5200
      expect(finalAmount).toBe(5200);

      // Step 13: Retail inventory deducted (19 - 2 = 17)
      const prodAfterSale = await models.Product.findById(productId);
      expect(prodAfterSale.quantity).toBe(17);

      // Step 14: Record Operating Expense
      const expenseRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({
          branchId: secondBranchId,
          category: 'Electricity',
          amount: 1500,
          description: 'Salon lighting and AC utility',
          paymentMethod: 'UPI'
        });
      expect(expenseRes.status).toBe(201);

      // Step 15 & 16: Financial Summary and Reconciliation
      const finRecRes = await request(app)
        .get('/api/analytics/financial-reconciliation?horizon=all')
        .set('Authorization', `Bearer ${e2eToken}`);
      expect(finRecRes.status).toBe(200);
      expect(finRecRes.body.data.audit.reconciliationStatus).toBe('BALANCED');
      expect(finRecRes.body.data.audit.isBalanced).toBe(true);

      // Step 17: Dashboard Stats
      const dashRes = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${e2eToken}`);
      expect(dashRes.status).toBe(200);
      expect(dashRes.body.data.monthlyRevenue).toBeGreaterThan(0);

      // Step 18: Client reviews staff
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          salonId: e2eSalonId,
          staffId,
          rating: 5,
          comment: 'Outstanding gold hair treatment!'
        });
      expect(reviewRes.status).toBe(201);

      // Step 19 & 20: Refund performed and inventory restored
      const refundRes = await request(app)
        .post(`/api/invoices/${invoiceId}/refund`)
        .set('Authorization', `Bearer ${e2eToken}`)
        .send({});
      expect(refundRes.status).toBe(200);
      expect(refundRes.body.data.paymentStatus).toBe('Refunded');

      // Restored inventory: 17 + 2 = 19
      const prodAfterRefund = await models.Product.findById(productId);
      expect(prodAfterRefund.quantity).toBe(19);

      // Step 21: Audit logs created
      const auditRes = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${e2eToken}`);
      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.length).toBeGreaterThan(0);

      // Step 22: Final Reconciled Net Profit after refund
      const finalFinRes = await request(app)
        .get('/api/analytics/financial-reconciliation?horizon=all')
        .set('Authorization', `Bearer ${e2eToken}`);
      expect(finalFinRes.status).toBe(200);
      expect(finalFinRes.body.data.audit.isBalanced).toBe(true);
      expect(finalFinRes.body.data.metrics.refunds).toBe(5200);
      expect(finalFinRes.body.data.metrics.netRevenue).toBe(0);
    });
  });
});

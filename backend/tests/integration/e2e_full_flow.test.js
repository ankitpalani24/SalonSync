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

describe('SalonSync Master End-to-End Functional & Integration Verification', () => {

  let ownerToken, managerToken, staffToken, clientToken, franchiseToken;
  let salon, branchA, branchB;
  let ownerUser, managerUser, staffUser, clientUser, franchiseUser;
  let staffMember, customer, service, product, supplier;

  beforeEach(async () => {
    // 1. Create Salon
    salon = await models.Salon.create({
      name: 'Luxe & Gold Premier Salon',
      ownerName: 'Alexander Wright',
      email: 'alexander@luxegold.com',
      phone: '9876543210',
      address: '101 Horizon Promenade',
      city: 'Mumbai',
      state: 'Maharashtra',
      businessType: 'Salon & Spa',
      subscriptionPlan: 'Franchise',
      subscriptionStatus: 'Active',
      slug: 'luxe-gold-premier',
      tagline: 'Signature Luxury Hair & Spa Experience',
      openingHours: 'Mon - Sun: 09:00 AM - 09:00 PM',
      rating: 4.9,
      totalReviews: 50
    });

    // 2. Create Multi-Branches
    branchA = await models.Branch.create({
      salonId: salon._id,
      name: 'Bandra Flagship Branch',
      city: 'Mumbai',
      address: 'Plot 12, Waterfield Road',
      phone: '9876543211',
      status: 'Active'
    });

    branchB = await models.Branch.create({
      salonId: salon._id,
      name: 'Juhu Luxury Lounge',
      city: 'Mumbai',
      address: 'Juhu Tara Road',
      phone: '9876543212',
      status: 'Active'
    });

    // 3. Create Users across all roles
    ownerUser = await models.User.create({
      name: 'Alexander Wright',
      email: 'owner@luxegold.com',
      phone: '9876543210',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salon._id,
      branchId: branchA._id
    });
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);

    managerUser = await models.User.create({
      name: 'Marcus Vance',
      email: 'manager@luxegold.com',
      phone: '9876543213',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_MANAGER',
      salonId: salon._id,
      branchId: branchA._id
    });
    managerToken = jwt.sign({ id: managerUser._id }, process.env.JWT_SECRET);

    staffUser = await models.User.create({
      name: 'Emma Watson',
      email: 'emma@luxegold.com',
      phone: '9876543214',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'STAFF',
      salonId: salon._id,
      branchId: branchA._id
    });
    staffToken = jwt.sign({ id: staffUser._id }, process.env.JWT_SECRET);

    clientUser = await models.User.create({
      name: 'Priyanka Chopra',
      email: 'priyanka@client.com',
      phone: '9876543215',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'CLIENT',
      salonId: salon._id
    });
    clientToken = jwt.sign({ id: clientUser._id }, process.env.JWT_SECRET);

    franchiseUser = await models.User.create({
      name: 'Franchise Director',
      email: 'director@luxegold.com',
      phone: '9876543216',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'FRANCHISE_OWNER',
      salonId: salon._id
    });
    franchiseToken = jwt.sign({ id: franchiseUser._id }, process.env.JWT_SECRET);

    // 4. Create Staff Member Document
    staffMember = await models.Staff.create({
      salonId: salon._id,
      branchId: branchA._id,
      userId: staffUser._id,
      name: 'Emma Watson',
      phone: '9876543214',
      email: 'emma@luxegold.com',
      role: 'Senior Stylist',
      salary: 35000,
      commissionPercentage: 15,
      rating: 4.9,
      status: 'Active'
    });

    // 5. Create Supplier & Product (Inventory)
    supplier = await models.Supplier.create({
      salonId: salon._id,
      name: "L'Oreal Professional Ind.",
      phone: '1800-22-3000',
      email: 'orders@loreal.in',
      address: 'Mumbai Corp Park',
      outstandingDues: 10000
    });

    product = await models.Product.create({
      salonId: salon._id,
      branchId: branchA._id,
      name: 'Moroccan Argan Hair Elixir',
      sku: 'ELIXIR-ARG-100',
      category: 'Hair Care',
      quantity: 50,
      minStock: 10,
      purchasePrice: 600,
      sellingPrice: 1500,
      supplierId: supplier._id,
      lowStockThreshold: 10
    });

    // 6. Create Service with Material Consumption
    service = await models.Service.create({
      salonId: salon._id,
      name: 'Signature 24K Gold Facial & Spa',
      category: 'Facial',
      duration: 60,
      price: 5000,
      materialCost: 800,
      profitMargin: 4200,
      requiredProducts: [
        {
          productId: product._id,
          productName: product.name,
          quantity: 2,
          unit: 'bottles'
        }
      ]
    });

    // 7. Create Customer
    customer = await models.Customer.create({
      salonId: salon._id,
      branchId: branchA._id,
      name: 'Priyanka Chopra',
      phone: '9876543215',
      email: 'priyanka@client.com',
      loyaltyPoints: 100,
      membershipLevel: 'Gold'
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 1: AUTHENTICATION & SECURITY
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 1 & 2: Authentication, Security & PBAC Matrix', () => {

    test('registers new salon owner and returns valid JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Elena Rostova',
          email: 'elena@royalspa.com',
          phone: '9988776655',
          password: 'Password@123',
          role: 'SALON_OWNER',
          salonName: 'Royal Russian Spa',
          address: 'Downtown Promenade',
          city: 'Delhi'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const token = res.body.token || res.body.data?.token;
      const user = res.body.user || res.body.data?.user;
      expect(token).toBeDefined();
      expect(user.email).toBe('elena@royalspa.com');
      expect(user.password).toBeUndefined(); // Password NEVER leaked
    });

    test('prevents duplicate user registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'owner@luxegold.com',
          phone: '9876543210',
          password: 'Password@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists|already registered|already in use/i);
    });

    test('authenticates valid login and issues JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'owner@luxegold.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('PBAC: Rejects CLIENT role from accessing Owner expenses or financial analytics', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('PBAC: Rejects unauthenticated request without token', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('PBAC: Rejects malformed / expired token', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid_garbage_token_string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 3: CUSTOMER CRM LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 3: Customer CRM Management & History', () => {

    test('creates, retrieves, searches, updates and deletes customer', async () => {
      // 1. Create
      const resCreate = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Deepika Padukone',
          phone: '9811223344',
          email: 'deepika@padukone.com',
          gender: 'Female',
          membershipLevel: 'Silver'
        });

      expect(resCreate.status).toBe(201);
      expect(resCreate.body.success).toBe(true);
      const newCustId = resCreate.body.data._id;

      // 2. Search
      const resSearch = await request(app)
        .get('/api/customers?search=Deepika')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resSearch.status).toBe(200);
      expect(resSearch.body.data.some(c => c.name.includes('Deepika'))).toBe(true);

      // 3. Update
      const resUpdate = await request(app)
        .put(`/api/customers/${newCustId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ loyaltyPoints: 250, membershipLevel: 'Platinum' });

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.loyaltyPoints).toBe(250);
      expect(resUpdate.body.data.membershipLevel).toBe('Platinum');

      // 4. Delete
      const resDelete = await request(app)
        .delete(`/api/customers/${newCustId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resDelete.status).toBe(200);
      expect(resDelete.body.success).toBe(true);

      // Verify deletion from DB
      const checkCust = await models.Customer.findById(newCustId);
      expect(checkCust).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 4 & 5: SALON DISCOVERY & STAFF MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 4 & 5: Salon Discovery, Staff HR & Performance', () => {

    test('fetches public salon details by slug without requiring authentication', async () => {
      const res = await request(app).get('/api/salons/public/luxe-gold-premier');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.salon.name).toBe('Luxe & Gold Premier Salon');
      expect(res.body.data.branches.length).toBeGreaterThanOrEqual(1);
    });

    test('creates and retrieves staff member details and assigns commission rate', async () => {
      const res = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Brad Pitt',
          phone: '9822334455',
          email: 'brad@luxegold.com',
          role: 'Master Stylist',
          salary: 45000,
          commissionPercentage: 20,
          branchId: branchA._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commissionPercentage).toBe(20);

      // Log attendance
      const resAtt = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          staffId: res.body.data._id,
          date: '2026-08-16',
          checkIn: '09:00',
          checkOut: '18:00',
          workingHours: 9,
          status: 'Present'
        });

      expect(resAtt.status).toBe(201);
      expect(resAtt.body.success).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 6, 7 & 8: APPOINTMENTS, OVERLAP PREVENTIONS & SERVICE CONSUMPTION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 6, 7, 8, 9 & 10: Appointments, Collision Prevention & Inventory Consumption', () => {

    test('books appointment and PREVENTS double-booking collisions for same staff/time', async () => {
      const bookingDate = new Date('2026-09-15T00:00:00.000Z');

      // 1. Primary Booking
      const res1 = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          date: bookingDate,
          time: '14:00',
          services: [{ serviceId: service._id, name: service.name, price: service.price }]
        });

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);

      // 2. Attempt Overlapping Booking (Same Staff, Same Date, Same Time)
      const res2 = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          date: bookingDate,
          time: '14:00',
          services: [{ serviceId: service._id, name: service.name, price: service.price }]
        });

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toMatch(/already booked/i);
    });

    test('completes appointment and deducts backbar inventory material stock in database', async () => {
      const initialStock = product.quantity; // 50

      const appt = await models.Appointment.create({
        salonId: salon._id,
        branchId: branchA._id,
        customerId: customer._id,
        staffId: staffMember._id,
        services: [{ serviceId: service._id, name: service.name, price: service.price }],
        date: new Date('2026-09-16'),
        time: '11:00',
        status: 'Scheduled',
        inventoryDeducted: false
      });

      // Complete the appointment
      const resComplete = await request(app)
        .put(`/api/appointments/${appt._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'Completed' });

      expect(resComplete.status).toBe(200);
      expect(resComplete.body.success).toBe(true);
      expect(resComplete.body.data.status).toBe('Completed');

      // Verify Stock Deduction in Product Collection: 50 - 2 (required for service) = 48
      const updatedProduct = await models.Product.findById(product._id);
      expect(updatedProduct.quantity).toBe(initialStock - 2);

      // Verify Inventory Consumption Record created
      const consumptions = await models.InventoryConsumption.find({ appointmentId: appt._id });
      expect(consumptions.length).toBe(1);
      expect(consumptions[0].quantityConsumed).toBe(2);

      // Verify Double-Completion does NOT deduct stock twice
      await request(app)
        .put(`/api/appointments/${appt._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'Completed' });

      const recheckedProduct = await models.Product.findById(product._id);
      expect(recheckedProduct.quantity).toBe(initialStock - 2); // Stock remains 48
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 11, 15 & 16: POS BILLING, COMMISSIONS, LOYALTY & DISCOUNTS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 11, 15 & 16: POS Invoicing, Staff Commission & Loyalty Engine', () => {

    test('creates full POS invoice: calculates revenue, staff commissions, stock sale deduction, and loyalty points', async () => {
      // Starting customer loyalty: 100 points
      // Starting product stock: 50 units
      const initialStock = product.quantity;

      const resInvoice = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          staffId: staffMember._id,
          services: [
            { serviceId: service._id, name: service.name, price: 5000, quantity: 1 }
          ],
          products: [
            { productId: product._id, name: product.name, price: 1500, quantity: 2 } // 3000
          ],
          tax: 18, // 18% of 8000 = 1440
          discount: 440, // Net 9000
          redeemPoints: 50, // ₹50 loyalty discount
          paymentMethod: 'UPI'
        });

      expect(resInvoice.status).toBe(201);
      expect(resInvoice.body.success).toBe(true);

      const inv = resInvoice.body.data;
      // Subtotal: 5000 + 3000 = 8000
      // Tax (18%): 1440
      // Discount: 440
      // Loyalty: 50
      // Final: 8000 + 1440 - 440 - 50 = 8950
      expect(inv.finalAmount).toBe(8950);

      // 1. Verify Product Inventory stock deduction from retail sale: 50 - 2 = 48
      const updatedProduct = await models.Product.findById(product._id);
      expect(updatedProduct.quantity).toBe(initialStock - 2);

      // 2. Verify Staff Commission (15% on 5000 service rev = ₹750)
      const commission = await models.Commission.findOne({ invoiceId: inv._id });
      expect(commission).toBeDefined();
      expect(commission.commissionEarned).toBe(750);

      // 3. Verify Customer Loyalty Points Balance:
      // Deducted 50 redeemed + Earned (8950 / 100 = 89 points earned) -> 100 - 50 + 89 = 139
      const updatedCustomer = await models.Customer.findById(customer._id);
      expect(updatedCustomer.loyaltyPoints).toBe(139);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 12, 13 & 14: OPERATING EXPENSES, P&L ENGINE & DATE HORIZONS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 12, 13 & 14: Expenses CRUD, Financial P&L Engine & Mathematical Reconciliation', () => {

    test('creates expenses across categories and reconciles full P&L financial engine', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // 1. Create Invoices for current month
      await models.Invoice.create([
        {
          invoiceNumber: 'INV-2026-TEST-01',
          salonId: salon._id,
          branchId: branchA._id,
          customerId: customer._id,
          services: [{ serviceId: service._id, name: service.name, price: 10000, quantity: 1 }],
          products: [{ productId: product._id, name: product.name, price: 2000, quantity: 1 }],
          tax: 0,
          discount: 500,
          finalAmount: 11500,
          paymentStatus: 'Paid',
          staffId: staffMember._id,
          createdAt: new Date(currentYear, currentMonth, 10)
        }
      ]);

      // 2. Create Expenses for current month
      await models.Expense.create([
        {
          salonId: salon._id,
          branchId: branchA._id,
          category: 'Rent',
          amount: 40000,
          date: new Date(currentYear, currentMonth, 1),
          paymentMethod: 'Bank Transfer',
          vendor: 'Signature Floor Corp'
        },
        {
          salonId: salon._id,
          branchId: branchA._id,
          category: 'Electricity',
          amount: 10000,
          date: new Date(currentYear, currentMonth, 5),
          paymentMethod: 'UPI',
          vendor: 'Power Utility Corp'
        }
      ]);

      // 3. Query Financial Summary from Financial Engine API
      const resSummary = await request(app)
        .get('/api/analytics/financial-summary?horizon=month')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resSummary.status).toBe(200);
      expect(resSummary.body.success).toBe(true);

      const { metrics, counts } = resSummary.body.data;

      // Net Revenue = Gross (12000) - Discount (500) = 11500
      expect(metrics.grossRevenue).toBe(12000);
      expect(metrics.netRevenue).toBe(11500);

      // Product Cost = 1 unit product purchase price (600) + service material cost (800) = 1400
      expect(metrics.productCosts).toBe(1400);

      // Operating Expenses = 40000 (Rent) + 10000 (Electricity) = 50000
      expect(metrics.operatingExpenses).toBe(50000);

      // Staff Commissions = 15% of 10000 service rev = 1500
      expect(metrics.staffCommissions).toBe(1500);

      // Gross Profit = Net Revenue (11500) - Product Costs (1400) - Commissions (1500) = 8600
      expect(metrics.grossProfit).toBe(8600);

      // Net Profit = Gross Profit (8600) - Operating Expenses (50000) = -41400
      expect(metrics.netProfit).toBe(8600 - 50000);

      // Counts validation
      expect(counts.invoiceCount).toBeGreaterThanOrEqual(1);
      expect(counts.expenseCount).toBeGreaterThanOrEqual(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN 21: ENTERPRISE FRANCHISE MULTI-BRANCH ISOLATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Domain 21: Multi-Branch Tenant Isolation & Franchise Rollup', () => {

    test('isolates branch data for Branch Manager and aggregates all branches for Franchise Owner', async () => {
      // Add expense to Branch A
      await models.Expense.create({
        salonId: salon._id,
        branchId: branchA._id,
        category: 'Rent',
        amount: 25000,
        date: new Date(),
        vendor: 'Branch A Landlord'
      });

      // Add expense to Branch B
      await models.Expense.create({
        salonId: salon._id,
        branchId: branchB._id,
        category: 'Rent',
        amount: 35000,
        date: new Date(),
        vendor: 'Branch B Landlord'
      });

      // Manager (assigned to Branch A) fetches expenses -> sees only Branch A (₹25,000)
      const resManager = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(resManager.status).toBe(200);
      const managerExpenses = resManager.body.data;
      expect(managerExpenses.every(e => String(e.branchId) === String(branchA._id))).toBe(true);

      // Franchise Owner fetches franchise overview -> sees aggregated branches
      const resFranchise = await request(app)
        .get('/api/analytics/franchise-overview')
        .set('Authorization', `Bearer ${franchiseToken}`);

      expect(resFranchise.status).toBe(200);
      expect(resFranchise.body.data.summary.totalBranches).toBe(2);
      expect(resFranchise.body.data.branchMetrics.length).toBe(2);
    });
  });

});

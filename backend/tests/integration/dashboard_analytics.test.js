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

describe('SalonSync Dashboard Analytics & Data Fetching Test Suite', () => {
  let salonAId;
  let salonBId;
  let branchA1Id;
  let branchA2Id;
  let branchB1Id;
  let salonAOwnerToken;
  let franchiseAOwnerToken;
  let salonBOwnerToken;
  let managerA1Token;

  beforeEach(async () => {
    // 1. Create Salon A (Multi-Branch) & Salon B (Separate Tenant)
    const salonA = await models.Salon.create({
      name: 'Luxe Salon A',
      ownerName: 'Owner A',
      email: 'ownerA@luxesalon.com',
      phone: '9888800001'
    });
    salonAId = salonA._id;

    const salonB = await models.Salon.create({
      name: 'Separate Salon B',
      ownerName: 'Owner B',
      email: 'ownerB@separatesalon.com',
      phone: '9888800002'
    });
    salonBId = salonB._id;

    // Branches for Salon A
    const branchA1 = await models.Branch.create({
      salonId: salonAId,
      name: 'Downtown Flagship',
      city: 'Mumbai',
      phone: '9888800001'
    });
    branchA1Id = branchA1._id;

    const branchA2 = await models.Branch.create({
      salonId: salonAId,
      name: 'Suburban Branch',
      city: 'Thane',
      phone: '9888800003'
    });
    branchA2Id = branchA2._id;

    // Branch for Salon B
    const branchB1 = await models.Branch.create({
      salonId: salonBId,
      name: 'Salon B Flagship',
      city: 'Delhi',
      phone: '9888800002'
    });
    branchB1Id = branchB1._id;

    // Users
    const ownerA = await models.User.create({
      name: 'Owner A',
      email: 'ownerA@luxesalon.com',
      phone: '9888800001',
      password: 'hashedpassword',
      role: 'SALON_OWNER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    salonAOwnerToken = jwt.sign({ id: ownerA._id, role: 'SALON_OWNER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const franchiseOwnerA = await models.User.create({
      name: 'Franchise Head A',
      email: 'franchiseA@luxesalon.com',
      phone: '9888800004',
      password: 'hashedpassword',
      role: 'FRANCHISE_OWNER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    franchiseAOwnerToken = jwt.sign({ id: franchiseOwnerA._id, role: 'FRANCHISE_OWNER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const managerA1 = await models.User.create({
      name: 'Manager A1',
      email: 'managerA1@luxesalon.com',
      phone: '9888800005',
      password: 'hashedpassword',
      role: 'SALON_MANAGER',
      salonId: salonAId,
      branchId: branchA1Id
    });
    managerA1Token = jwt.sign({ id: managerA1._id, role: 'SALON_MANAGER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const ownerB = await models.User.create({
      name: 'Owner B',
      email: 'ownerB@separatesalon.com',
      phone: '9888800002',
      password: 'hashedpassword',
      role: 'SALON_OWNER',
      salonId: salonBId,
      branchId: branchB1Id
    });
    salonBOwnerToken = jwt.sign({ id: ownerB._id, role: 'SALON_OWNER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  // TEST 1: Empty Dataset returns clean structure without crashing
  test('1. Empty dataset returns valid metrics, 0s, and default series without errors', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.todayRevenue).toBe(0);
    expect(res.body.data.todayExpenses).toBe(0);
    expect(res.body.data.todayProfit).toBe(0);
    expect(res.body.data.monthlyRevenue).toBe(0);
    expect(res.body.data.trends).toBeDefined();
    expect(res.body.data.trends.monthLabels).toHaveLength(6);
    expect(res.body.data.trends.revenueExpenseChartData.revenues).toHaveLength(6);
    expect(res.body.data.trends.appointmentTrendChartData.days).toHaveLength(7);
  });

  // TEST 2: Revenue and Expenses calculations and 6-Month Trends
  test('2. Accurately calculates Revenue vs Expenses trend across 6 historical months', async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Invoice for Branch A1 this month (₹15,000)
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-A-001',
      finalAmount: 15000,
      paymentStatus: 'Paid',
      createdAt: new Date(currentYear, currentMonth, 10)
    });

    // Invoice for Branch A2 this month (₹10,000)
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA2Id,
      invoiceNumber: 'INV-A-002',
      finalAmount: 10000,
      paymentStatus: 'Paid',
      createdAt: new Date(currentYear, currentMonth, 12)
    });

    // Expense for Branch A1 this month (₹6,000)
    await models.Expense.create({
      salonId: salonAId,
      branchId: branchA1Id,
      category: 'Rent',
      amount: 6000,
      date: new Date(currentYear, currentMonth, 5)
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.monthlyRevenue).toBe(25000);
    expect(res.body.data.monthlyExpenses).toBe(6000);
    expect(res.body.data.netProfit).toBe(19000);

    const revs = res.body.data.trends.revenueExpenseChartData.revenues;
    const exps = res.body.data.trends.revenueExpenseChartData.expenses;
    // Current month is the last element in 6-month historical array
    expect(revs[revs.length - 1]).toBe(25000);
    expect(exps[exps.length - 1]).toBe(6000);
  });

  // TEST 3: Monthly Profit Trend
  test('3. Accurately calculates Monthly Profit (Revenue - Expenses)', async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-PROF-1',
      finalAmount: 20000,
      paymentStatus: 'Paid',
      createdAt: new Date(currentYear, currentMonth, 1)
    });

    await models.Expense.create({
      salonId: salonAId,
      branchId: branchA1Id,
      category: 'Electricity',
      amount: 4500,
      date: new Date(currentYear, currentMonth, 2)
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(res.status).toBe(200);
    const profits = res.body.data.trends.monthlyProfitChartData.profits;
    expect(profits[profits.length - 1]).toBe(15500); // 20000 - 4500
  });

  // TEST 4: Appointment Trend Distribution (Mon - Sun)
  test('4. Correctly aggregates appointment trends by day of the week', async () => {
    const staff = await models.Staff.create({
      salonId: salonAId,
      branchId: branchA1Id,
      name: 'Stylist John',
      phone: '9888800091',
      role: 'Senior Stylist'
    });
    const customer = await models.Customer.create({
      salonId: salonAId,
      name: 'Client Clara',
      phone: '9888800010'
    });

    // Create appointments on known days
    // 2026-08-10 is a Monday
    await models.Appointment.create({
      salonId: salonAId,
      branchId: branchA1Id,
      staffId: staff._id,
      customerId: customer._id,
      date: new Date(2026, 7, 10), // Monday
      time: '11:00',
      status: 'Completed',
      services: [{ name: 'Executive Haircut', price: 800 }]
    });

    await models.Appointment.create({
      salonId: salonAId,
      branchId: branchA1Id,
      staffId: staff._id,
      customerId: customer._id,
      date: new Date(2026, 7, 10), // Monday
      time: '14:00',
      status: 'Scheduled',
      services: [{ name: 'Beard Trim', price: 300 }]
    });

    // 2026-08-14 is a Friday
    await models.Appointment.create({
      salonId: salonAId,
      branchId: branchA1Id,
      staffId: staff._id,
      customerId: customer._id,
      date: new Date(2026, 7, 14), // Friday
      time: '16:00',
      status: 'Completed',
      services: [{ name: 'Hair Color', price: 2500 }]
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(res.status).toBe(200);
    const trend = res.body.data.trends.appointmentTrendChartData;
    expect(trend.days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    const monIdx = trend.days.indexOf('Mon');
    const friIdx = trend.days.indexOf('Fri');
    expect(trend.appointments[monIdx]).toBe(2);
    expect(trend.appointments[friIdx]).toBe(1);
  });

  // TEST 5: Customer Growth Metric
  test('5. Computes cumulative customer growth across historical months', async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Customer registered 2 months ago
    await models.Customer.create({
      salonId: salonAId,
      name: 'Customer Early',
      phone: '9888800021',
      createdAt: new Date(currentYear, currentMonth - 2, 5)
    });

    // Customer registered this month
    await models.Customer.create({
      salonId: salonAId,
      name: 'Customer Recent',
      phone: '9888800022',
      createdAt: new Date(currentYear, currentMonth, 2)
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(res.status).toBe(200);
    const custGrowth = res.body.data.trends.customerGrowthChartData.customers;
    expect(custGrowth[custGrowth.length - 1]).toBe(2);
  });

  // TEST 6: Popular Services Ranking
  test('6. Computes Popular Services ranking with counts from completed appointments and invoices', async () => {
    const staff = await models.Staff.create({
      salonId: salonAId,
      branchId: branchA1Id,
      name: 'Stylist Mia',
      phone: '9888800092',
      role: 'Stylist'
    });
    const customer = await models.Customer.create({
      salonId: salonAId,
      name: 'Customer Bob',
      phone: '9888800030'
    });

    // 3 Haircuts in invoice
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-POP-1',
      finalAmount: 3600,
      paymentStatus: 'Paid',
      services: [
        { name: 'Royal Haircut', price: 1200, quantity: 3 },
        { name: 'Gold Facial', price: 2000, quantity: 1 }
      ]
    });

    // 1 Haircut in appointment
    await models.Appointment.create({
      salonId: salonAId,
      branchId: branchA1Id,
      staffId: staff._id,
      customerId: customer._id,
      date: new Date(),
      time: '12:00',
      status: 'Completed',
      services: [{ name: 'Royal Haircut', price: 1200 }]
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(res.status).toBe(200);
    const pop = res.body.data.trends.popularServicesData;
    expect(pop.labels[0]).toBe('Royal Haircut');
    expect(pop.values[0]).toBe(4); // 3 from invoice + 1 from appointment
    expect(pop.labels[1]).toBe('Gold Facial');
    expect(pop.values[1]).toBe(1);
  });

  // TEST 7: Branch-Specific Filtering
  test('7. Filters analytics strictly when branchId query is specified', async () => {
    const now = new Date();
    // Branch A1: ₹10,000
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-B1',
      finalAmount: 10000,
      paymentStatus: 'Paid',
      createdAt: now
    });

    // Branch A2: ₹20,000
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA2Id,
      invoiceNumber: 'INV-B2',
      finalAmount: 20000,
      paymentStatus: 'Paid',
      createdAt: now
    });

    // Query strictly for Branch A1
    const resA1 = await request(app)
      .get(`/api/dashboard/stats?branchId=${branchA1Id}`)
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(resA1.status).toBe(200);
    expect(resA1.body.data.monthlyRevenue).toBe(10000);

    // Query strictly for Branch A2
    const resA2 = await request(app)
      .get(`/api/dashboard/stats?branchId=${branchA2Id}`)
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(resA2.status).toBe(200);
    expect(resA2.body.data.monthlyRevenue).toBe(20000);
  });

  // TEST 8: Franchise Owner Aggregation Across Branches
  test('8. Franchise Owner aggregates all authorized branches when branchId is null', async () => {
    const now = new Date();
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-FRAN-1',
      finalAmount: 12000,
      paymentStatus: 'Paid',
      createdAt: now
    });
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA2Id,
      invoiceNumber: 'INV-FRAN-2',
      finalAmount: 18000,
      paymentStatus: 'Paid',
      createdAt: now
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${franchiseAOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.monthlyRevenue).toBe(30000); // 12k + 18k
  });

  // TEST 9: Multi-Tenant Data Isolation
  test('9. Strict multi-tenant isolation prevents Salon B data from appearing in Salon A dashboard', async () => {
    const now = new Date();

    // Salon A revenue: ₹5,000
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-ISO-A',
      finalAmount: 5000,
      paymentStatus: 'Paid',
      createdAt: now
    });

    // Salon B revenue: ₹90,000
    await models.Invoice.create({
      salonId: salonBId,
      branchId: branchB1Id,
      invoiceNumber: 'INV-ISO-B',
      finalAmount: 90000,
      paymentStatus: 'Paid',
      createdAt: now
    });

    // Request as Salon A Owner
    const resA = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.monthlyRevenue).toBe(5000); // Exactly ₹5,000, NOT ₹95,000

    // Request as Salon B Owner
    const resB = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonBOwnerToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.monthlyRevenue).toBe(90000);
  });

  // TEST 10: Financial Reconciliation Consistency between Dashboard and Reports
  test('10. Financial Reconciliation: Dashboard revenue & profit exactly match financial reports', async () => {
    const now = new Date();
    await models.Invoice.create({
      salonId: salonAId,
      branchId: branchA1Id,
      invoiceNumber: 'INV-REC-1',
      finalAmount: 50000,
      paymentStatus: 'Paid',
      createdAt: now
    });
    await models.Expense.create({
      salonId: salonAId,
      branchId: branchA1Id,
      category: 'Rent',
      amount: 15000,
      date: now
    });

    // Fetch Dashboard Stats
    const dashRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    // Fetch Financial Summary Report
    const repRes = await request(app)
      .get('/api/analytics/financial-summary?horizon=this_month')
      .set('Authorization', `Bearer ${salonAOwnerToken}`);

    expect(dashRes.status).toBe(200);
    expect(repRes.status).toBe(200);

    expect(dashRes.body.data.monthlyRevenue).toBe(repRes.body.data.metrics.netRevenue);
    expect(dashRes.body.data.monthlyExpenses).toBe(repRes.body.data.metrics.operatingExpenses);
    expect(dashRes.body.data.netProfit).toBe(repRes.body.data.metrics.netProfit);
  });
});

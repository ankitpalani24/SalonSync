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

describe('Expenses & Profit/Loss Analytics Integration Tests', () => {

  let salon, branch, token;

  beforeEach(async () => {
    salon = await models.Salon.create({ name: 'Salon Finance', ownerName: 'Owner', email: 'owner@fin.com', phone: '1111111111' });
    branch = await models.Branch.create({ salonId: salon._id, name: 'Main Branch' });

    const owner = await models.User.create({ name: 'Owner', email: 'owner@fin.com', phone: '1111111111', password: 'hash', role: 'SALON_OWNER', salonId: salon._id, branchId: branch._id });
    token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET);
  });

  test('creates and retrieves expenses', async () => {
    const resCreate = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Rent',
        amount: 15000,
        description: 'Monthly salon rent'
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.data.amount).toBe(15000);

    const resGet = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`);

    expect(resGet.status).toBe(200);
    expect(resGet.body.data.length).toBe(1);
    expect(resGet.body.data[0].category).toBe('Rent');
  });

  test('calculates dashboard P&L stats accurately', async () => {
    // 1. Create a Service with material cost
    const service = await models.Service.create({
      salonId: salon._id,
      name: 'Facial',
      category: 'Facial',
      duration: 60,
      price: 2000,
      materialCost: 300
    });

    // 2. Create an Invoice for today (Revenue = 2000, Material Cost = 300)
    await models.Invoice.create({
      invoiceNumber: 'INV-2026-0001',
      salonId: salon._id,
      branchId: branch._id,
      services: [{ serviceId: service._id, name: 'Facial', price: 2000, quantity: 1 }],
      finalAmount: 2000,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid'
    });

    // 3. Create an Expense for today (Expense = 500)
    await models.Expense.create({
      salonId: salon._id,
      branchId: branch._id,
      category: 'Electricity',
      amount: 500,
      description: 'Daily bill'
    });

    // Net Profit = Revenue (2000) - Material Cost (300) - Expense (500) = 1200
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.todayRevenue).toBe(2000);
    expect(res.body.data.todayExpenses).toBe(500);
    expect(res.body.data.netProfit).toBe(1200);
  });

});

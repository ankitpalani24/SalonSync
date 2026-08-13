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

describe('POS Billing, Inventory Deduction, Loyalty & Commission Integration Tests', () => {

  let salon, branch, staff, customer, service, product, token;

  beforeEach(async () => {
    salon = await models.Salon.create({ name: 'Salon POS', ownerName: 'Owner', email: 'owner@pos.com', phone: '1111111111' });
    branch = await models.Branch.create({ salonId: salon._id, name: 'Main Branch' });
    staff = await models.Staff.create({ salonId: salon._id, branchId: branch._id, name: 'Emma Watson', phone: '9999999999', commissionPercentage: 10 });
    customer = await models.Customer.create({ salonId: salon._id, name: 'Client Billing', phone: '8888888888', loyaltyPoints: 50 });

    service = await models.Service.create({ salonId: salon._id, name: 'Haircut', category: 'Haircut', duration: 30, price: 1000, materialCost: 100 });
    product = await models.Product.create({ salonId: salon._id, name: 'Shampoo', sku: 'SH-1', quantity: 10, purchasePrice: 200, sellingPrice: 500 });

    const owner = await models.User.create({ name: 'Owner', email: 'owner@pos.com', phone: '1111111111', password: 'hash', role: 'SALON_OWNER', salonId: salon._id, branchId: branch._id });
    token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET);
  });

  test('creates invoice, deducts product inventory stock, calculates loyalty points & staff commission', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id,
        staffId: staff._id,
        services: [{ serviceId: service._id, quantity: 1 }],
        products: [{ productId: product._id, quantity: 2 }], // 2 * 500 = 1000 product rev; 1000 service rev = Total 2000
        tax: 0,
        discount: 0,
        paymentMethod: 'UPI'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.finalAmount).toBe(2000);

    // 1. Check Product Stock Deduction (Original 10 - 2 = 8 remaining)
    const updatedProduct = await models.Product.findById(product._id);
    expect(updatedProduct.quantity).toBe(8);

    // 2. Check Loyalty Points Earning (2000 / 100 = 20 points earned + 50 initial = 70)
    const updatedCustomer = await models.Customer.findById(customer._id);
    expect(updatedCustomer.loyaltyPoints).toBe(70);

    // 3. Check Staff Commission Record (10% of 1000 service rev = 100 earned)
    const commission = await models.Commission.findOne({ invoiceId: res.body.data._id });
    expect(commission).toBeDefined();
    expect(commission.commissionEarned).toBe(100);
  });

  test('REJECTS INVOICE when requested product quantity exceeds available stock', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id,
        staffId: staff._id,
        products: [{ productId: product._id, quantity: 15 }], // Requested 15, Available 10
        paymentMethod: 'Cash'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Insufficient inventory/i);

    // Stock must remain untouched (10)
    const checkProduct = await models.Product.findById(product._id);
    expect(checkProduct.quantity).toBe(10);
  });

  test('redeems customer loyalty points for billing discount', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id,
        staffId: staff._id,
        services: [{ serviceId: service._id, quantity: 1 }], // ₹1000
        redeemPoints: 30, // ₹30 discount
        paymentMethod: 'Cash'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.finalAmount).toBe(970); // 1000 - 30 = 970

    // Customer loyalty balance should deduct 30 points and add 9 points (970/100) -> 50 - 30 + 9 = 29
    const updatedCustomer = await models.Customer.findById(customer._id);
    expect(updatedCustomer.loyaltyPoints).toBe(29);
  });

});

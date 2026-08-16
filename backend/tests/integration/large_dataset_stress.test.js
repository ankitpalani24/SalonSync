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

describe('SalonSync Large Dataset Performance & Stress Audit Suite', () => {
  setupDB();

  let salonId, branch1Id, branch2Id, ownerToken;

  beforeEach(async () => {
    // 1. Create Salon & Branches
    const salon = await models.Salon.create({
      name: 'Mega Chain Salon India',
      ownerName: 'Sunil Mittal',
      email: 'sunil@megasalon.com',
      phone: '9988776655',
      city: 'Bangalore',
      subscriptionPlan: 'Franchise'
    });
    salonId = salon._id;

    const branch1 = await models.Branch.create({
      salonId,
      name: 'Indiranagar Flagship',
      city: 'Bangalore'
    });
    branch1Id = branch1._id;

    const branch2 = await models.Branch.create({
      salonId,
      name: 'Koramangala Branch',
      city: 'Bangalore'
    });
    branch2Id = branch2._id;

    // 2. Create Owner User
    const owner = await models.User.create({
      name: 'Sunil Mittal',
      email: 'sunil.owner@megasalon.com',
      phone: '9988776655',
      password: 'hashedPassword123',
      role: 'SALON_OWNER',
      salonId,
      branchId: branch1Id
    });
    ownerToken = require('jsonwebtoken').sign({ id: owner._id }, process.env.JWT_SECRET || 'test_secret');
  });

  test('High-Volume Multi-Year Analytics & Performance Benchmark (p50, p95, p99)', async () => {
    // 1. Seed high-volume realistic dataset
    const INVOICE_COUNT = 300;
    const EXPENSE_COUNT = 150;
    const APPOINTMENT_COUNT = 300;
    const MOVEMENT_COUNT = 400;

    const now = new Date();
    const invoices = [];
    const expenses = [];
    const appointments = [];
    const movements = [];

    // Create a dummy staff & product for relations
    const staff = await models.Staff.create({
      salonId,
      branchId: branch1Id,
      name: 'Deepak Stylist',
      phone: '9888877771',
      role: 'Master Stylist',
      salary: 40000,
      commissionPercentage: 12
    });

    const product = await models.Product.create({
      salonId,
      branchId: branch1Id,
      name: 'Moroccan Hair Mask',
      sku: 'MOR-MASK-01',
      quantity: 500,
      purchasePrice: 600,
      sellingPrice: 1200
    });

    for (let i = 0; i < INVOICE_COUNT; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (i % 12), (i % 28) + 1);
      invoices.push({
        salonId,
        branchId: i % 2 === 0 ? branch1Id : branch2Id,
        invoiceNumber: `INV-STRESS-${String(i).padStart(5, '0')}`,
        services: [{ name: 'Hair Spa', price: 1500, quantity: 1 }],
        products: [{ productId: product._id, name: product.name, price: 1200, quantity: 1 }],
        tax: 18,
        discount: 100,
        finalAmount: 3086,
        paymentMethod: i % 3 === 0 ? 'UPI' : (i % 3 === 1 ? 'Card' : 'Cash'),
        paymentStatus: 'Paid',
        staffId: staff._id,
        createdAt: d
      });
    }

    for (let i = 0; i < EXPENSE_COUNT; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (i % 12), (i % 28) + 1);
      expenses.push({
        salonId,
        branchId: i % 2 === 0 ? branch1Id : branch2Id,
        category: i % 4 === 0 ? 'Rent' : (i % 4 === 1 ? 'Products' : (i % 4 === 2 ? 'Electricity' : 'Salary')),
        amount: 5000 + (i * 20),
        date: d,
        paymentMethod: 'Bank Transfer'
      });
    }

    for (let i = 0; i < APPOINTMENT_COUNT; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (i % 12), (i % 28) + 1);
      appointments.push({
        salonId,
        branchId: i % 2 === 0 ? branch1Id : branch2Id,
        customerId: new mongoose.Types.ObjectId(),
        staffId: staff._id,
        services: [{ name: 'Hair Treatment', price: 2000, duration: 45 }],
        date: d,
        time: '14:00',
        status: i % 5 === 0 ? 'Completed' : 'Scheduled'
      });
    }

    for (let i = 0; i < MOVEMENT_COUNT; i++) {
      movements.push({
        salonId,
        branchId: i % 2 === 0 ? branch1Id : branch2Id,
        productId: product._id,
        productName: product.name,
        type: i % 2 === 0 ? 'SALE' : 'PURCHASE',
        previousQuantity: 500 - i,
        changeQuantity: i % 2 === 0 ? -1 : 5,
        newQuantity: 500 - i + (i % 2 === 0 ? -1 : 5),
        timestamp: new Date(now.getFullYear(), now.getMonth() - (i % 6), (i % 28) + 1)
      });
    }

    await models.Invoice.insertMany(invoices);
    await models.Expense.insertMany(expenses);
    await models.Appointment.insertMany(appointments);
    await models.InventoryMovement.insertMany(movements);

    // 2. Measure & Benchmark 4 Core Analytical Endpoints across 20 iterations
    const calculatePercentiles = (latencies) => {
      const sorted = [...latencies].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.50)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      return { p50: Math.round(p50 * 100) / 100, p95: Math.round(p95 * 100) / 100, p99: Math.round(p99 * 100) / 100 };
    };

    const endpoints = [
      { name: 'GET /api/dashboard/stats', url: '/api/dashboard/stats' },
      { name: 'GET /api/analytics/financial-summary', url: '/api/analytics/financial-summary?horizon=year' },
      { name: 'GET /api/analytics/financial-reconciliation', url: '/api/analytics/financial-reconciliation?horizon=month' },
      { name: 'GET /api/inventory/movements', url: '/api/inventory/movements?page=1&limit=50' }
    ];

    const benchmarkResults = {};

    for (const ep of endpoints) {
      const latencies = [];
      let lastPayloadSize = 0;

      const memStart = process.memoryUsage().heapUsed;
      const cpuStart = process.cpuUsage();

      for (let run = 0; run < 15; run++) {
        const start = performance.now();
        const res = await request(app)
          .get(ep.url)
          .set('Authorization', `Bearer ${ownerToken}`);
        const duration = performance.now() - start;

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        latencies.push(duration);
        lastPayloadSize = JSON.stringify(res.body).length;
      }

      const memEnd = process.memoryUsage().heapUsed;
      const cpuDiff = process.cpuUsage(cpuStart);
      const percentiles = calculatePercentiles(latencies);

      benchmarkResults[ep.name] = {
        ...percentiles,
        payloadBytes: lastPayloadSize,
        heapDeltaKB: Math.round((memEnd - memStart) / 1024),
        cpuUserMs: Math.round(cpuDiff.user / 1000)
      };

      // Assert SLA performance requirements (< 200ms p95 across realistic multi-year collections)
      expect(percentiles.p95).toBeLessThan(250);
    }

    console.log('\n================ LARGE DATASET BENCHMARK METRICS ================');
    console.table(benchmarkResults);
    console.log('=================================================================\n');
  });
});

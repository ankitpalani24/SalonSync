const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');

const app = express();
app.use(helmet());
app.use(express.json());
app.use('/api', apiRoutes);

setupDB();

describe('SalonSync High-Concurrency Mixed Load & Stress Benchmark Suite', () => {
  let salonId, branchId, user, token;
  let customer, staff1, staff2, product1, product2;

  beforeEach(async () => {
    const salon = await models.Salon.create({
      name: 'Load Test Salon',
      ownerName: 'Benchmark Admin',
      email: 'bench@salonsync.com',
      phone: '9888800099'
    });
    salonId = salon._id;

    const branch = await models.Branch.create({
      salonId,
      name: 'Central Branch',
      city: 'Mumbai'
    });
    branchId = branch._id;

    user = await models.User.create({
      name: 'Benchmark Admin',
      email: 'bench@salonsync.com',
      phone: '9888800099',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId,
      branchId,
      tokenVersion: 1
    });
    token = jwt.sign({ id: user._id, tokenVersion: 1 }, process.env.JWT_SECRET);

    customer = await models.Customer.create({
      salonId,
      branchId,
      name: 'Benchmark Customer',
      phone: '9900000001'
    });

    staff1 = await models.Staff.create({
      salonId,
      branchId,
      name: 'Staff Alpha',
      phone: '9900000002',
      commissionPercentage: 10
    });

    staff2 = await models.Staff.create({
      salonId,
      branchId,
      name: 'Staff Beta',
      phone: '9900000003',
      commissionPercentage: 15
    });

    product1 = await models.Product.create({
      salonId,
      branchId,
      name: 'Shampoo 500ml',
      sku: 'SHAMP-001',
      quantity: 500,
      purchasePrice: 200,
      sellingPrice: 500
    });

    product2 = await models.Product.create({
      salonId,
      branchId,
      name: 'Conditioner 500ml',
      sku: 'COND-001',
      quantity: 500,
      purchasePrice: 250,
      sellingPrice: 600
    });

    // Seed historical dataset for realistic load querying
    const invoices = [];
    const now = new Date();
    for (let i = 0; i < 150; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), (i % 28) + 1, 12, 0, 0);
      invoices.push({
        invoiceNumber: `INV-BENCH-${i + 1}`,
        salonId,
        branchId,
        customerId: customer._id,
        services: [{ name: 'Hair Cut & Styling', price: 1000, quantity: 1 }],
        products: [{ productId: product1._id, name: product1.name, price: 500, quantity: 1 }],
        tax: 18,
        discount: 100,
        finalAmount: 1670,
        paymentStatus: i % 25 === 0 ? 'Refunded' : 'Paid',
        createdAt: d
      });
    }
    await models.Invoice.insertMany(invoices);
  });

  test('50 Concurrent Virtual Requests: Mixed Read/Write Benchmark (p50, p95, p99, throughput, memory)', async () => {
    const CONCURRENCY = 50;
    const startTime = performance.now();
    const memStart = process.memoryUsage().heapUsed;

    // Generate 50 mixed operations
    const operations = Array.from({ length: CONCURRENCY }).map((_, index) => {
      const opType = index % 5;
      const opStart = performance.now();

      let reqPromise;
      if (opType === 0) {
        // Read: Dashboard Stats
        reqPromise = request(app)
          .get('/api/dashboard/stats')
          .set('Authorization', `Bearer ${token}`);
      } else if (opType === 1) {
        // Read: Financial Summary
        reqPromise = request(app)
          .get('/api/analytics/financial-summary?horizon=month')
          .set('Authorization', `Bearer ${token}`);
      } else if (opType === 2) {
        // Read: Customer search & pagination
        reqPromise = request(app)
          .get('/api/customers?limit=20&page=1')
          .set('Authorization', `Bearer ${token}`);
      } else if (opType === 3) {
        // Write: Create Invoice with atomic inventory deduction
        reqPromise = request(app)
          .post('/api/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({
            customerId: customer._id,
            branchId,
            services: [{ name: 'Deluxe Facial', price: 2000, quantity: 1 }],
            products: [{ productId: product1._id, name: product1.name, price: 500, quantity: 1 }],
            paymentMethod: 'UPI'
          });
      } else {
        // Write: Appointment Booking
        const hour = 10 + (index % 8);
        const min = (index % 4) * 15;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        reqPromise = request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            customerId: customer._id,
            staffId: index % 2 === 0 ? staff1._id : staff2._id,
            branchId,
            date: '2026-11-25',
            time: timeStr,
            duration: 15
          });
      }

      return reqPromise.then(res => {
        const opDuration = performance.now() - opStart;
        return {
          status: res.status,
          success: res.status < 400 || res.status === 400 || res.status === 409, // business conflicts are valid HTTP responses
          duration: opDuration
        };
      });
    });

    const results = await Promise.all(operations);
    const totalDuration = performance.now() - startTime;
    const memEnd = process.memoryUsage().heapUsed;

    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.50)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];
    const rps = Math.round((CONCURRENCY / (totalDuration / 1000)) * 100) / 100;
    const serverErrors = results.filter(r => r.status >= 500).length;

    console.log('\n================ 50 CONCURRENT LOAD BENCHMARK ================');
    console.table({
      'Concurrent Requests': CONCURRENCY,
      'Total Batch Time (ms)': Math.round(totalDuration * 100) / 100,
      'Throughput (req/sec)': rps,
      'p50 Latency (ms)': Math.round(p50 * 100) / 100,
      'p95 Latency (ms)': Math.round(p95 * 100) / 100,
      'p99 Latency (ms)': Math.round(p99 * 100) / 100,
      '5xx Server Errors': serverErrors,
      'Heap Memory Delta (KB)': Math.round((memEnd - memStart) / 1024)
    });
    console.log('==============================================================');

    expect(serverErrors).toBe(0);
    expect(totalDuration).toBeLessThan(10000);
  });
});

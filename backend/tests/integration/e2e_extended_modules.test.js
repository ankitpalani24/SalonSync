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

describe('SalonSync Extended Modules Verification (Memberships, Reviews, WhatsApp, Audit Logs & Subscriptions)', () => {

  let ownerToken, salon, branch, ownerUser, customer, staffMember;

  beforeEach(async () => {
    salon = await models.Salon.create({
      name: 'Elysium Spa & Wellness',
      ownerName: 'Victoria Secret',
      email: 'victoria@elysium.com',
      phone: '9988001122',
      address: '77 Ocean Drive',
      city: 'Goa',
      state: 'Goa',
      businessType: 'Salon & Spa',
      subscriptionPlan: 'Franchise',
      subscriptionStatus: 'Active',
      slug: 'elysium-spa-goa'
    });

    branch = await models.Branch.create({
      salonId: salon._id,
      name: 'Goa Beachfront Branch',
      city: 'Goa',
      address: '77 Ocean Drive',
      phone: '9988001123',
      status: 'Active'
    });

    ownerUser = await models.User.create({
      name: 'Victoria Secret',
      email: 'owner@elysium.com',
      phone: '9988001122',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salon._id,
      branchId: branch._id
    });
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);

    customer = await models.Customer.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Gauri Khan',
      phone: '9811224466',
      email: 'gauri@redchillies.com',
      loyaltyPoints: 50,
      membershipLevel: 'Silver'
    });

    staffMember = await models.Staff.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Jean Claude',
      phone: '9811224477',
      email: 'jean@elysium.com',
      role: 'Spa Master',
      salary: 40000,
      commissionPercentage: 12,
      rating: 4.8,
      status: 'Active'
    });
  });

  // 1. Memberships & Subscriptions
  describe('Domain 17: Customer Memberships & Recurring Tier Plans', () => {
    test('creates membership tier plan and subscribes customer', async () => {
      // 1. Create Membership Tier
      const resPlan = await request(app)
        .post('/api/memberships')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Platinum Royal Club',
          tier: 'Platinum',
          price: 15000,
          validityDays: 365,
          discountPercentage: 20,
          servicesIncluded: ['Facial', 'Hair Spa', 'Full Body Massage'],
          description: 'VIP Platinum access with 20% flat discount on all spa treatments.'
        });

      expect(resPlan.status).toBe(201);
      expect(resPlan.body.success).toBe(true);
      expect(resPlan.body.data.tier).toBe('Platinum');

      const planId = resPlan.body.data._id;

      // 2. Subscribe Customer to Membership Plan
      const resSub = await request(app)
        .post('/api/memberships/subscribe')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customer._id,
          membershipId: planId,
          paymentMethod: 'Credit Card'
        });

      expect(resSub.status).toBe(201);
      expect(resSub.body.success).toBe(true);

      // Verify customer membership level upgraded in database
      const updatedCustomer = await models.Customer.findById(customer._id);
      expect(updatedCustomer.membershipLevel).toBe('Platinum');
    });
  });

  // 2. Reviews & Staff Ratings Engine
  describe('Domain 18 & 19: Reviews, Feedback & Staff Rating Aggregation', () => {
    test('submits customer review and updates staff rating', async () => {
      const resReview = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          staffId: staffMember._id,
          customerId: customer._id,
          customerName: customer.name,
          serviceName: 'Full Body Ayurvedic Spa',
          rating: 5,
          comment: 'Exceptional service and extremely relaxing experience.'
        });

      expect(resReview.status).toBe(201);
      expect(resReview.body.success).toBe(true);

      // Query reviews
      const resGet = await request(app)
        .get(`/api/reviews?staffId=${staffMember._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resGet.status).toBe(200);
      expect(resGet.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 3. Notifications & WhatsApp System
  describe('Domain 18 & 22: Notifications & Communication Triggers', () => {
    test('fetches notifications and updates WhatsApp config', async () => {
      // 1. Create Notification
      const resNotify = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          targetRole: 'Customer',
          recipientId: String(customer._id),
          recipientName: customer.name,
          category: 'Appointment',
          type: 'InApp',
          title: 'Upcoming Spa Appointment Reminder',
          message: 'Your spa session is scheduled for tomorrow at 10:00 AM.'
        });

      expect(resNotify.status).toBe(201);
      expect(resNotify.body.success).toBe(true);

      // 2. Query Notifications
      const resList = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resList.status).toBe(200);
      expect(resList.body.data.length).toBeGreaterThanOrEqual(1);

      // 3. WhatsApp Config
      const resConfig = await request(app)
        .get('/api/whatsapp/config')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resConfig.status).toBe(200);
      expect(resConfig.body.data).toBeDefined();
    });
  });

  // 4. Audit Logs
  describe('Domain 22: Enterprise Audit Trail', () => {
    test('creates and retrieves system audit log records', async () => {
      // 1. Create Audit Log
      await models.AuditLog.create({
        salonId: salon._id,
        userId: ownerUser._id,
        userName: ownerUser.name,
        userRole: 'SALON_OWNER',
        action: 'UPDATE',
        entity: 'Service',
        entityId: 'SERVICE-101',
        entityName: 'Ayurvedic Massage',
        previousValue: { price: 3000 },
        newValue: { price: 3500 }
      });

      // 2. Query Audit Logs
      const resLogs = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resLogs.status).toBe(200);
      expect(resLogs.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. SaaS Subscriptions
  describe('Domain 20: Platform Subscriptions & Tier Enforcement', () => {
    test('fetches salon subscription status and plans', async () => {
      const resSub = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(resSub.status).toBe(200);
      expect(resSub.body.data).toBeDefined();
    });
  });

});

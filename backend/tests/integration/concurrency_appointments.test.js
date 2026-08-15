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

describe('SalonSync Master Appointment Concurrency & Collision Security Suite', () => {

  let ownerToken, salon, branch, ownerUser, customerA, customerB, staffA, staffB, service60;
  let salonB, branchB, ownerUserB, ownerTokenB, staffSalonB;

  beforeEach(async () => {
    // Primary Tenant (Salon A)
    salon = await models.Salon.create({
      name: 'Elite Salon & Spa',
      ownerName: 'Master Admin',
      email: 'admin@elitesalon.com',
      phone: '9876543210',
      address: 'High Street',
      city: 'Mumbai'
    });

    branch = await models.Branch.create({
      salonId: salon._id,
      name: 'Downtown Branch',
      city: 'Mumbai'
    });

    ownerUser = await models.User.create({
      name: 'Master Admin',
      email: 'admin@elitesalon.com',
      phone: '9876543210',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salon._id,
      branchId: branch._id
    });
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);

    customerA = await models.Customer.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Alice Wonder',
      phone: '9876500001'
    });

    customerB = await models.Customer.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Bob Builder',
      phone: '9876500002'
    });

    staffA = await models.Staff.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Master Stylist Alex',
      phone: '9876500003',
      role: 'Senior Stylist'
    });

    staffB = await models.Staff.create({
      salonId: salon._id,
      branchId: branch._id,
      name: 'Colorist Chloe',
      phone: '9876500004',
      role: 'Hair Colorist'
    });

    service60 = await models.Service.create({
      salonId: salon._id,
      name: 'Deluxe Hair Spa (60 Min)',
      category: 'Spa',
      duration: 60,
      price: 2500
    });

    // Secondary Tenant (Salon B)
    salonB = await models.Salon.create({
      name: 'Rival Salon B',
      ownerName: 'Rival Admin',
      email: 'rival@salonb.com',
      phone: '9876599999',
      address: 'Uptown',
      city: 'Mumbai'
    });

    branchB = await models.Branch.create({
      salonId: salonB._id,
      name: 'Rival Branch B',
      city: 'Mumbai'
    });

    ownerUserB = await models.User.create({
      name: 'Rival Admin',
      email: 'rival@salonb.com',
      phone: '9876599999',
      password: '$2a$10$hashedpasswordfore2etesting',
      role: 'SALON_OWNER',
      salonId: salonB._id,
      branchId: branchB._id
    });
    ownerTokenB = jwt.sign({ id: ownerUserB._id }, process.env.JWT_SECRET);

    staffSalonB = await models.Staff.create({
      salonId: salonB._id,
      branchId: branchB._id,
      name: 'Rival Stylist Dave',
      phone: '9876599988'
    });
  });

  // TEST 1: 2-Request Concurrency on Exact Same Slot
  test('TEST 1: 2 simultaneous booking requests for exact same staff/slot -> 1 succeeds, 1 rejected', async () => {
    const bookingDate = '2026-09-01';
    const bookingTime = '10:00';

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customerA._id,
          staffId: staffA._id,
          date: bookingDate,
          time: bookingTime,
          services: [{ serviceId: service60._id, name: service60.name, duration: 60, price: 2500 }]
        }),
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customerB._id,
          staffId: staffA._id,
          date: bookingDate,
          time: bookingTime,
          services: [{ serviceId: service60._id, name: service60.name, duration: 60, price: 2500 }]
        })
    ]);

    const responses = [resA, resB];
    const successes = responses.filter(r => r.status === 201);
    const conflicts = responses.filter(r => r.status === 400);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].body.message).toMatch(/already booked for another appointment/i);

    // Verify DB state: Exactly 1 appointment in DB for Staff A on that date and time
    const appts = await models.Appointment.find({
      salonId: salon._id,
      staffId: staffA._id,
      date: new Date(bookingDate),
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });
    expect(appts.length).toBe(1);
    expect(appts[0].time).toBe('10:00');
  });

  // TEST 2: Overlapping Appointments (10:00-11:00)
  test('TEST 2: Overlapping appointment intervals (10:30-11:30 and 09:30-10:30) are rejected; back-to-back allowed', async () => {
    const bookingDate = '2026-09-02';

    // 1. Book 10:00 to 11:00 (duration: 60)
    const baseAppt = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerA._id,
        staffId: staffA._id,
        date: bookingDate,
        time: '10:00',
        services: [{ serviceId: service60._id, duration: 60, price: 2500 }]
      });
    expect(baseAppt.status).toBe(201);

    // 2. Attempt Overlap 1: 10:30 to 11:30 (should fail)
    const overlapRes1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerB._id,
        staffId: staffA._id,
        date: bookingDate,
        time: '10:30',
        services: [{ serviceId: service60._id, duration: 60, price: 2500 }]
      });
    expect(overlapRes1.status).toBe(400);
    expect(overlapRes1.body.message).toMatch(/already booked for another appointment/i);

    // 3. Attempt Overlap 2: 09:30 to 10:30 (should fail)
    const overlapRes2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerB._id,
        staffId: staffA._id,
        date: bookingDate,
        time: '09:30',
        services: [{ serviceId: service60._id, duration: 60, price: 2500 }]
      });
    expect(overlapRes2.status).toBe(400);
    expect(overlapRes2.body.message).toMatch(/already booked for another appointment/i);

    // 4. Back-to-Back 1: 11:00 to 12:00 (should SUCCEED)
    const backToBackRes1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerB._id,
        staffId: staffA._id,
        date: bookingDate,
        time: '11:00',
        services: [{ serviceId: service60._id, duration: 60, price: 2500 }]
      });
    expect(backToBackRes1.status).toBe(201);

    // 5. Back-to-Back 2: 09:00 to 10:00 (should SUCCEED)
    const backToBackRes2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerB._id,
        staffId: staffA._id,
        date: bookingDate,
        time: '09:00',
        services: [{ serviceId: service60._id, duration: 60, price: 2500 }]
      });
    expect(backToBackRes2.status).toBe(201);
  });

  // TEST 3: Different Staff Concurrency
  test('TEST 3: Concurrent bookings for different staff members at the same time slot both succeed', async () => {
    const bookingDate = '2026-09-03';
    const bookingTime = '10:00';

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customerA._id,
          staffId: staffA._id,
          date: bookingDate,
          time: bookingTime,
          duration: 60
        }),
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: customerB._id,
          staffId: staffB._id,
          date: bookingDate,
          time: bookingTime,
          duration: 60
        })
    ]);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });

  // TEST 4: Cancelled Appointment Slot Release
  test('TEST 4: Cancelled appointment frees the slot for subsequent bookings', async () => {
    const bookingDate = '2026-09-04';
    const bookingTime = '10:00';

    // 1. Create appointment
    const appt = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerA._id,
        staffId: staffA._id,
        date: bookingDate,
        time: bookingTime,
        duration: 60
      });
    expect(appt.status).toBe(201);
    const apptId = appt.body.data._id;

    // 2. Cancel the appointment
    const cancelRes = await request(app)
      .put(`/api/appointments/${apptId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'Cancelled' });
    expect(cancelRes.status).toBe(200);

    // 3. New booking for Customer B at the same 10:00 slot must now SUCCEED
    const newBookingRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId: customerB._id,
        staffId: staffA._id,
        date: bookingDate,
        time: bookingTime,
        duration: 60
      });
    expect(newBookingRes.status).toBe(201);
  });

  // TEST 5: Rescheduling & Concurrent Reschedule Collision
  test('TEST 5: Rescheduling frees old slot, occupies new slot, and concurrent reschedule collisions are rejected', async () => {
    const bookingDate = '2026-09-05';

    // 1. Create Appt 1 at 10:00 and Appt 2 at 11:00
    const appt1Res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ customerId: customerA._id, staffId: staffA._id, date: bookingDate, time: '10:00', duration: 60 });
    
    const appt2Res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ customerId: customerB._id, staffId: staffA._id, date: bookingDate, time: '11:00', duration: 60 });

    const appt1Id = appt1Res.body.data._id;
    const appt2Id = appt2Res.body.data._id;

    // 2. Reschedule Appt 1 from 10:00 to 14:00
    const reschedRes = await request(app)
      .put(`/api/appointments/${appt1Id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ time: '14:00' });
    expect(reschedRes.status).toBe(200);

    // 3. Now 10:00 is free: Customer B should be able to book 10:00
    const freeSlotRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ customerId: customerB._id, staffId: staffA._id, date: bookingDate, time: '10:00', duration: 60 });
    expect(freeSlotRes.status).toBe(201);

    // 4. Concurrent reschedule collision: Both Appt 1 (at 14:00) and Appt 2 (at 11:00) try to reschedule to 16:00 simultaneously
    const [coll1, coll2] = await Promise.all([
      request(app)
        .put(`/api/appointments/${appt1Id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ time: '16:00' }),
      request(app)
        .put(`/api/appointments/${appt2Id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ time: '16:00' })
    ]);

    const reschedResults = [coll1, coll2];
    const successResched = reschedResults.filter(r => r.status === 200);
    const failResched = reschedResults.filter(r => r.status === 400);

    expect(successResched.length).toBe(1);
    expect(failResched.length).toBe(1);
    expect(failResched[0].body.message).toMatch(/already booked for another appointment/i);
  });

  // TEST 6: 20-Request High Concurrency on Single Slot
  test('TEST 6: 20 concurrent booking requests for a single slot -> Exactly 1 succeeds, 19 rejected', async () => {
    const bookingDate = '2026-09-06';
    const bookingTime = '14:00';

    // Create 20 unique customers
    const customerDocs = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        models.Customer.create({
          salonId: salon._id,
          branchId: branch._id,
          name: `Concurrent Client ${i + 1}`,
          phone: `98765${String(10000 + i).slice(-5)}`
        })
      )
    );

    // Dispatch 20 concurrent booking requests simultaneously via Promise.all
    const requests = customerDocs.map(c =>
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: c._id,
          staffId: staffA._id,
          date: bookingDate,
          time: bookingTime,
          duration: 60
        })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    const conflictCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(19);

    // Database verification: Exactly 1 appointment exists
    const finalAppts = await models.Appointment.find({
      salonId: salon._id,
      staffId: staffA._id,
      date: new Date(bookingDate),
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });
    expect(finalAppts.length).toBe(1);
    expect(finalAppts[0].time).toBe('14:00');
  });

  // TEST 7: Different Slot Concurrency (All Succeed)
  test('TEST 7: Concurrent bookings for different non-overlapping slots (10:00, 11:00, 12:00, 13:00) all succeed', async () => {
    const bookingDate = '2026-09-07';
    const slots = ['10:00', '11:00', '12:00', '13:00'];

    const requests = slots.map((t, idx) =>
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerId: idx % 2 === 0 ? customerA._id : customerB._id,
          staffId: staffA._id,
          date: bookingDate,
          time: t,
          duration: 60
        })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;
    expect(successCount).toBe(4);

    const finalAppts = await models.Appointment.find({
      salonId: salon._id,
      staffId: staffA._id,
      date: new Date(bookingDate),
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });
    expect(finalAppts.length).toBe(4);
  });

  // TEST 8: Cross-Tenant Security & Isolation
  test('TEST 8: Tenant B cannot book staff from Tenant A or manipulate Tenant A appointments', async () => {
    const bookingDate = '2026-09-08';

    // 1. Tenant B attempts to book Staff A (belongs to Salon A)
    const crossBookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerTokenB}`)
      .send({
        staffId: staffA._id, // Staff A belongs to Salon A!
        date: bookingDate,
        time: '10:00',
        duration: 60
      });
    expect(crossBookRes.status).toBe(400);
    expect(crossBookRes.body.message).toMatch(/not found or does not belong to this salon/i);

    // 2. Create legitimate appointment in Salon A
    const apptA = await models.Appointment.create({
      salonId: salon._id,
      branchId: branch._id,
      customerId: customerA._id,
      staffId: staffA._id,
      date: new Date(bookingDate),
      time: '15:00',
      duration: 60
    });

    // 3. Tenant B attempts to modify Salon A's appointment
    const crossPutRes = await request(app)
      .put(`/api/appointments/${apptA._id}`)
      .set('Authorization', `Bearer ${ownerTokenB}`)
      .send({ time: '17:00' });
    expect(crossPutRes.status).toBe(404);

    // 4. Tenant B attempts to delete Salon A's appointment
    const crossDelRes = await request(app)
      .delete(`/api/appointments/${apptA._id}`)
      .set('Authorization', `Bearer ${ownerTokenB}`);
    expect(crossDelRes.status).toBe(404);
  });

});

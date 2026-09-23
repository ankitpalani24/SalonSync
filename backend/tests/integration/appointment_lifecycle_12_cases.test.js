const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');
const financialService = require('../../src/services/financialService');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

setupDB();

describe('SalonSync Appointment Lifecycle - 12 Acceptance Cases', () => {
  let salonA, branchA, staffA, custA, tokenA, userA;
  let salonB, branchB, staffB, custB, tokenB, userB;

  beforeEach(async () => {
    // Salon A setup
    salonA = await models.Salon.create({ name: 'Luxe Salon A', ownerName: 'Owner A', email: 'ownerA@salon.com', phone: '9000000001' });
    branchA = await models.Branch.create({ salonId: salonA._id, name: 'Downtown Branch A' });
    staffA = await models.Staff.create({ salonId: salonA._id, branchId: branchA._id, name: 'Alice Stylist', phone: '9000000002' });
    custA = await models.Customer.create({ salonId: salonA._id, branchId: branchA._id, name: 'Charlie Client', email: 'clientA@test.com', phone: '9000000003' });
    userA = await models.User.create({ name: 'Owner A', email: 'ownerA@salon.com', phone: '9000000001', password: 'hash', role: 'SALON_OWNER', salonId: salonA._id, branchId: branchA._id });
    tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET);

    // Salon B setup (Tenant Isolation)
    salonB = await models.Salon.create({ name: 'Elite Salon B', ownerName: 'Owner B', email: 'ownerB@salon.com', phone: '8000000001' });
    branchB = await models.Branch.create({ salonId: salonB._id, name: 'Uptown Branch B' });
    staffB = await models.Staff.create({ salonId: salonB._id, branchId: branchB._id, name: 'Bob Stylist', phone: '8000000002' });
    custB = await models.Customer.create({ salonId: salonB._id, branchId: branchB._id, name: 'Diana Client', email: 'clientB@test.com', phone: '8000000003' });
    userB = await models.User.create({ name: 'Owner B', email: 'ownerB@salon.com', phone: '8000000001', password: 'hash', role: 'SALON_OWNER', salonId: salonB._id, branchId: branchB._id });
    tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET);
  });

  // CASE 1: Scheduled appointment is visible in active appointments
  test('CASE 1: Scheduled appointment is visible in active appointments', async () => {
    const appt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-01'),
      time: '10:00',
      status: 'Scheduled'
    });

    const res = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map(a => String(a._id));
    expect(ids).toContain(String(appt._id));
  });

  // CASE 2: Scheduled -> Completed: Disappears from active appointments, remains in history & DB
  test('CASE 2: Scheduled -> Completed disappears from active, remains in history and MongoDB', async () => {
    const appt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-01'),
      time: '11:00',
      status: 'Scheduled'
    });

    // Mark completed
    const updateRes = await request(app)
      .put(`/api/appointments/${appt._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'Completed' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('Completed');

    // 1. Not in active
    const activeRes = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${tokenA}`);
    const activeIds = activeRes.body.data.map(a => String(a._id));
    expect(activeIds).not.toContain(String(appt._id));

    // 2. In history
    const historyRes = await request(app)
      .get('/api/appointments?scope=history')
      .set('Authorization', `Bearer ${tokenA}`);
    const historyIds = historyRes.body.data.map(a => String(a._id));
    expect(historyIds).toContain(String(appt._id));

    // 3. Document preserved in DB
    const dbDoc = await models.Appointment.findById(appt._id);
    expect(dbDoc).not.toBeNull();
    expect(dbDoc.status).toBe('Completed');
  });

  // CASE 3: Scheduled -> Cancelled: Disappears from active appointments, remains in history & DB
  test('CASE 3: Scheduled -> Cancelled disappears from active, remains in history and MongoDB', async () => {
    const appt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-01'),
      time: '12:00',
      status: 'Scheduled'
    });

    // Cancel appointment via DELETE (soft cancellation)
    const cancelRes = await request(app)
      .delete(`/api/appointments/${appt._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(cancelRes.status).toBe(200);

    // 1. Not in active
    const activeRes = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${tokenA}`);
    const activeIds = activeRes.body.data.map(a => String(a._id));
    expect(activeIds).not.toContain(String(appt._id));

    // 2. In history
    const historyRes = await request(app)
      .get('/api/appointments?scope=history')
      .set('Authorization', `Bearer ${tokenA}`);
    const historyIds = historyRes.body.data.map(a => String(a._id));
    expect(historyIds).toContain(String(appt._id));

    // 3. Document preserved in DB
    const dbDoc = await models.Appointment.findById(appt._id);
    expect(dbDoc).not.toBeNull();
    expect(dbDoc.status).toBe('Cancelled');
  });

  // CASE 4: Cancelled appointment: Slot becomes available according to existing reservation logic
  test('CASE 4: Cancelled appointment releases SlotReservation so the slot becomes re-bookable', async () => {
    const dateStr = '2026-10-02';
    const apptDate = new Date(`${dateStr}T00:00:00.000Z`);

    // 1. Book first appointment at 14:00
    const createRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: custA._id,
        staffId: staffA._id,
        date: apptDate,
        time: '14:00',
        duration: 30,
        status: 'Scheduled'
      });
    expect(createRes.status).toBe(201);
    const appt1Id = createRes.body.data._id;

    // 2. Verify slot reservation was created
    const slotsBefore = await models.SlotReservation.find({ appointmentId: appt1Id });
    expect(slotsBefore.length).toBeGreaterThan(0);

    // 3. Attempt double booking -> must fail
    const conflictRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: custA._id,
        staffId: staffA._id,
        date: apptDate,
        time: '14:00',
        duration: 30,
        status: 'Scheduled'
      });
    expect(conflictRes.status).toBe(400);

    // 4. Cancel first appointment
    const cancelRes = await request(app)
      .delete(`/api/appointments/${appt1Id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(cancelRes.status).toBe(200);

    // 5. Verify slot reservations released
    const slotsAfter = await models.SlotReservation.find({ appointmentId: appt1Id });
    expect(slotsAfter.length).toBe(0);

    // 6. Now book second appointment at the same slot -> must succeed
    const rebookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: custA._id,
        staffId: staffA._id,
        date: apptDate,
        time: '14:00',
        duration: 30,
        status: 'Scheduled'
      });
    expect(rebookRes.status).toBe(201);
    expect(rebookRes.body.success).toBe(true);
  });

  // CASE 5: Completed appointment does not appear in upcoming appointments
  test('CASE 5: Completed appointment does not appear in upcoming appointments', async () => {
    const compAppt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-05'),
      time: '15:00',
      status: 'Completed'
    });

    const activeRes = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${tokenA}`);
    const activeIds = activeRes.body.data.map(a => String(a._id));
    expect(activeIds).not.toContain(String(compAppt._id));
  });

  // CASE 6: Refresh browser after completion -> remains absent from active list
  test('CASE 6: Consecutive queries (simulating page reload) retain absence from active list', async () => {
    const appt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-06'),
      time: '10:00',
      status: 'Completed'
    });

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .get('/api/appointments?scope=active')
        .set('Authorization', `Bearer ${tokenA}`);
      const activeIds = res.body.data.map(a => String(a._id));
      expect(activeIds).not.toContain(String(appt._id));
    }
  });

  // CASE 7: Logout / Login again -> completed/cancelled remains absent from active list
  test('CASE 7: Re-authenticated session query guarantees completed/cancelled remains absent from active list', async () => {
    const appt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-07'),
      time: '10:00',
      status: 'Cancelled'
    });

    // Generate fresh session token (simulating login)
    const freshToken = jwt.sign({ id: userA._id }, process.env.JWT_SECRET);
    const res = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${freshToken}`);

    const activeIds = res.body.data.map(a => String(a._id));
    expect(activeIds).not.toContain(String(appt._id));
  });

  // CASE 8: Dashboard refresh -> Active appointment count is accurate
  test('CASE 8: Dashboard refresh computes active appointment count excluding completed/cancelled', async () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    // 2 Active today
    await models.Appointment.create({ salonId: salonA._id, branchId: branchA._id, customerId: custA._id, staffId: staffA._id, date: today, time: '10:00', status: 'Scheduled' });
    await models.Appointment.create({ salonId: salonA._id, branchId: branchA._id, customerId: custA._id, staffId: staffA._id, date: today, time: '11:00', status: 'In Progress' });

    // 1 Completed today
    await models.Appointment.create({ salonId: salonA._id, branchId: branchA._id, customerId: custA._id, staffId: staffA._id, date: today, time: '09:00', status: 'Completed' });

    // 1 Cancelled today
    await models.Appointment.create({ salonId: salonA._id, branchId: branchA._id, customerId: custA._id, staffId: staffA._id, date: today, time: '12:00', status: 'Cancelled' });

    const stats = await financialService.getDashboardStats({ salonId: salonA._id, branchId: branchA._id });
    expect(stats.today.appointments).toBe(2); // Only active (Scheduled, In Progress)
    expect(stats.today.completedAppointments).toBe(1); // Completed
  });

  // CASE 9: Staff view -> Completed/cancelled appointments are absent from active staff schedule
  test('CASE 9: Staff mobile schedule contains only active appointments for today', async () => {
    const staffUser = await models.User.create({
      name: 'Alice Staff User',
      email: 'alice.staff@salon.com',
      phone: '9000000002',
      password: 'hash',
      role: 'STAFF',
      salonId: salonA._id,
      branchId: branchA._id
    });
    await models.Staff.findByIdAndUpdate(staffA._id, { userId: staffUser._id });
    const staffToken = jwt.sign({ id: staffUser._id }, process.env.JWT_SECRET);

    const today = new Date();
    today.setHours(10, 0, 0, 0);

    const activeAppt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: today,
      time: '14:00',
      status: 'Scheduled'
    });

    const completedAppt = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: today,
      time: '09:00',
      status: 'Completed'
    });

    const res = await request(app)
      .get('/api/mobile/staff/schedule')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    const scheduleIds = res.body.data.appointmentsToday.map(a => String(a._id));
    expect(scheduleIds).toContain(String(activeAppt._id));
    expect(scheduleIds).not.toContain(String(completedAppt._id));
  });

  // CASE 10: Client view -> Completed/cancelled appointment is absent from upcoming bookings
  test('CASE 10: Client mobile dashboard upcoming appointments includes only active and excludes completed/cancelled', async () => {
    const clientUser = await models.User.create({
      name: 'Charlie Client',
      email: 'clientA@test.com',
      phone: '9000000003',
      password: 'hash',
      role: 'CLIENT',
      salonId: salonA._id
    });
    const clientToken = jwt.sign({ id: clientUser._id }, process.env.JWT_SECRET);

    const activeBooking = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-15'),
      time: '11:00',
      status: 'Confirmed'
    });

    const completedBooking = await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-10'),
      time: '10:00',
      status: 'Completed'
    });

    const res = await request(app)
      .get('/api/mobile/client/dashboard')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    const upcomingIds = res.body.data.upcomingAppointments.map(a => String(a._id));
    expect(upcomingIds).toContain(String(activeBooking._id));
    expect(upcomingIds).not.toContain(String(completedBooking._id));
  });

  // CASE 11: Two different salons -> Status filtering does not break tenant isolation
  test('CASE 11: Tenant isolation is preserved when filtering active and historical appointments', async () => {
    await models.Appointment.create({
      salonId: salonA._id,
      branchId: branchA._id,
      customerId: custA._id,
      staffId: staffA._id,
      date: new Date('2026-10-20'),
      time: '10:00',
      status: 'Scheduled'
    });

    const apptB = await models.Appointment.create({
      salonId: salonB._id,
      branchId: branchB._id,
      customerId: custB._id,
      staffId: staffB._id,
      date: new Date('2026-10-20'),
      time: '10:00',
      status: 'Scheduled'
    });

    // Owner A querying active appointments
    const resA = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${tokenA}`);

    const resAIds = resA.body.data.map(a => String(a._id));
    expect(resAIds).not.toContain(String(apptB._id));

    // Owner B querying active appointments
    const resB = await request(app)
      .get('/api/appointments?scope=active')
      .set('Authorization', `Bearer ${tokenB}`);

    const resBIds = resB.body.data.map(a => String(a._id));
    expect(resBIds).toContain(String(apptB._id));
  });

  // CASE 12: Pagination -> Completed/cancelled records do not consume active-list pagination slots
  test('CASE 12: Pagination accurately paginates only active records when scope=active is requested', async () => {
    // Create 3 active appointments and 10 completed appointments for Salon A
    for (let i = 1; i <= 3; i++) {
      await models.Appointment.create({
        salonId: salonA._id,
        branchId: branchA._id,
        customerId: custA._id,
        staffId: staffA._id,
        date: new Date(`2026-11-0${i}`),
        time: '10:00',
        status: 'Scheduled'
      });
    }
    for (let i = 1; i <= 10; i++) {
      await models.Appointment.create({
        salonId: salonA._id,
        branchId: branchA._id,
        customerId: custA._id,
        staffId: staffA._id,
        date: new Date(`2026-10-0${i < 10 ? '0' + i : i}`),
        time: '12:00',
        status: 'Completed'
      });
    }

    const res = await request(app)
      .get('/api/appointments?scope=active&page=1&limit=10')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.data.length).toBe(3);
    res.body.data.forEach(a => {
      expect(['Scheduled', 'Confirmed', 'In Progress']).toContain(a.status);
    });
  });

});

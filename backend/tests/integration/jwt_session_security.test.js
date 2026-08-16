const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { setupDB } = require('../setup');
const models = require('../../src/models');
const apiRoutes = require('../../src/routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

setupDB();

describe('SalonSync JWT Session Security, Token Invalidation & Account Status Suite', () => {
  let salon, user, validToken;

  beforeEach(async () => {
    salon = await models.Salon.create({
      name: 'Security Test Salon',
      ownerName: 'Admin Sec',
      email: 'sec@test.com',
      phone: '9911223344'
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('InitialSecurePass123!', salt);

    user = await models.User.create({
      name: 'Admin Sec',
      email: 'sec@test.com',
      phone: '9911223344',
      password: hashedPassword,
      role: 'SALON_OWNER',
      salonId: salon._id,
      tokenVersion: 1,
      status: 'Active'
    });

    validToken = jwt.sign(
      { id: user._id, tokenVersion: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  });

  // TEST 1: Token Validity & Access
  test('Valid JWT with matching tokenVersion grants authenticated access', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TEST 2: Expired Token Rejection
  test('Expired JWT is strictly rejected with 401 Unauthorized', async () => {
    const expiredToken = jwt.sign(
      { id: user._id, tokenVersion: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );

    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/token failed|not authorized/i);
  });

  // TEST 3: Invalid Signature & Malformed Tokens
  test('JWT signed with wrong secret or malformed string returns 401 Unauthorized', async () => {
    const forgedToken = jwt.sign(
      { id: user._id, tokenVersion: 1 },
      'wrong_rogue_secret_key_99999'
    );

    const resForged = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(resForged.status).toBe(401);

    const resMalformed = await request(app)
      .get('/api/customers')
      .set('Authorization', 'Bearer this.is.a.corrupted.token.payload');

    expect(resMalformed.status).toBe(401);
  });

  // TEST 4: Disabled / Suspended Account Access Revocation
  test('Disabled or Suspended account is immediately denied access (403 Forbidden)', async () => {
    await models.User.findByIdAndUpdate(user._id, { status: 'Disabled' });

    const resDisabled = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${validToken}`);

    expect(resDisabled.status).toBe(403);
    expect(resDisabled.body.success).toBe(false);
    expect(resDisabled.body.message).toMatch(/disabled or suspended/i);
  });

  // TEST 5: Password Change Session Invalidation
  test('Password change invalidates all existing JWT tokens by incrementing tokenVersion', async () => {
    // Old token should work initially
    const preCheck = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${validToken}`);
    expect(preCheck.status).toBe(200);

    // Change password via API
    const changePassRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentPassword: 'InitialSecurePass123!',
        newPassword: 'BrandNewPassword2026!'
      });

    expect(changePassRes.status).toBe(200);
    expect(changePassRes.body.success).toBe(true);
    expect(changePassRes.body.token).toBeDefined();
    const newSessionToken = changePassRes.body.token;

    // OLD token must now be REJECTED
    const postCheckOld = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${validToken}`);

    expect(postCheckOld.status).toBe(401);
    expect(postCheckOld.body.message).toMatch(/session expired|password changed/i);

    // NEW token must WORK
    const postCheckNew = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${newSessionToken}`);

    expect(postCheckNew.status).toBe(200);
  });

  // TEST 6: Explicit Logout Revocation
  test('Explicit logout revokes current session token', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validToken}`);

    expect(logoutRes.status).toBe(200);

    // Attempting to reuse old token after logout must fail
    const reusedRes = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${validToken}`);

    expect(reusedRes.status).toBe(401);
  });
});

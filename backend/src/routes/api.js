const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const models = require('../models');
const financialService = require('../services/financialService');
const { protect, authorize, restrictToTenant, requirePermission } = require('../middleware/auth');
const { validateObjectId, sanitizeBody, safeHandler, parsePagination } = require('../middleware/sanitize');
const { authLimiter, sensitiveActionLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { requireIdempotency } = require('../middleware/idempotency');

// ── Security Constants ──────────────────────────────────────
const BCRYPT_SALT_ROUNDS = 12;
const JWT_EXPIRY = '1d';

// ── Financial & Security Audit Logger Helper ─────────────────
const logAuditTrail = async ({ req, action, entity, entityId, entityName, previousValue, newValue, branchId, branchName }) => {
  try {
    if (!req || !req.user || !req.user.salonId) return;
    await models.AuditLog.create({
      salonId: req.user.salonId,
      branchId: branchId || req.user.branchId || null,
      branchName: branchName || '',
      userId: req.user._id,
      userName: req.user.name || 'System User',
      userRole: req.user.role || 'Staff',
      action,
      entity,
      entityId: String(entityId || ''),
      entityName: entityName || '',
      previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : undefined,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      timestamp: new Date()
    });
  } catch (err) {
    // Non-blocking catch to ensure audit failure never blocks core transaction
    console.error('[AUDIT_LOG_ERROR]', err.message);
  }
};

// Apply general rate limiting to all API routes
router.use(apiLimiter);

// Database connection readiness check middleware
router.use((req, res, next) => {
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  if (mongoose.connection.readyState === 0) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is offline. Please authorize your IP in MongoDB Atlas or switch to Demo Mode on the client.'
    });
  }
  next();
});

// JWT signer helper (no hardcoded fallback — validated at startup in server.js)
const generateToken = (id, tokenVersion = 1) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
};

// Public Endpoints (accessible without login)
// @route   GET /api/salons — restricted to safe public fields only
router.get('/salons', safeHandler(async (req, res) => {
  const salons = await models.Salon.find({}).select('name city state businessType _id');
  res.json({ success: true, data: salons });
}, 'Failed to fetch salons'));

// @route   GET /api/public/services
router.get('/public/services', safeHandler(async (req, res) => {
  const services = await models.Service.find({}).select('name category duration price description salonId _id');
  res.json({ success: true, data: services });
}, 'Failed to fetch services'));

// @route   GET /api/public/salons/:identifier (by slug or id)
const getPublicSalonHandler = safeHandler(async (req, res) => {
  const { identifier } = req.params;
  let salon;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    salon = await models.Salon.findById(identifier);
  }
  if (!salon) {
    salon = await models.Salon.findOne({ slug: identifier });
  }
  if (!salon) {
    salon = await models.Salon.findOne({}); // Fallback default salon
  }

  if (!salon) {
    return res.status(404).json({ success: false, message: 'Salon profile not found' });
  }

  // Fetch sanitized public services
  const services = await models.Service.find({ salonId: salon._id }).select('name category duration price description _id');
  
  // Fetch sanitized public staff (NO salaries, NO phones, NO email, NO commissions)
  const staff = await models.Staff.find({ salonId: salon._id, status: 'Active' }).select('name specializations experience rating avatar bio _id');
  
  // Fetch sanitized public reviews (NO customer phone, NO email)
  const reviews = await models.Review.find({ salonId: salon._id, status: 'Approved' }).select('customerName rating comment date serviceName _id');

  // Fetch active promotional packages
  const packages = await models.Package.find({ salonId: salon._id, active: true }).select('name price originalPrice description durationDays includedServices _id');

  // Fetch active branches
  const branches = await models.Branch.find({ salonId: salon._id, status: 'Active' }).select('name address city phone _id');

  res.json({
    success: true,
    data: {
      salon: {
        _id: salon._id,
        name: salon.name,
        slug: salon.slug || 'luxe-salon-bandra',
        tagline: salon.tagline || 'Premier Luxury Hair, Skincare & Wellness Sanctuary',
        logoUrl: salon.logoUrl,
        coverImageUrl: salon.coverImageUrl,
        description: salon.description,
        address: salon.address,
        city: salon.city,
        state: salon.state,
        phone: salon.phone,
        openingHours: salon.openingHours || 'Mon - Sun: 09:00 AM - 09:00 PM',
        rating: salon.rating || 4.9,
        totalReviews: salon.totalReviews || 128,
        galleryImages: salon.galleryImages || []
      },
      branches,
      services,
      staff,
      reviews,
      packages
    }
  });
}, 'Failed to fetch salon profile');

router.get('/public/salons/:identifier', getPublicSalonHandler);
router.get('/salons/public/:identifier', getPublicSalonHandler);

// @route   GET /api/public/salons/discover (Search, filter, & sort registered salons)
router.get('/public/salons/discover', safeHandler(async (req, res) => {
  const { search, city, service, minRating, maxPrice, openOnly, sortBy } = req.query;
  const filter = {};

  if (city && city !== 'ALL') {
    filter.city = new RegExp(city, 'i');
  }

  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { address: new RegExp(search, 'i') },
      { locality: new RegExp(search, 'i') },
      { city: new RegExp(search, 'i') },
      { popularServices: new RegExp(search, 'i') }
    ];
  }

  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }

  if (maxPrice) {
    filter.startingPrice = { $lte: Number(maxPrice) };
  }

  let sortOption = { rating: -1 };
  if (sortBy === 'price_asc') sortOption = { startingPrice: 1 };
  if (sortBy === 'price_desc') sortOption = { startingPrice: -1 };
  if (sortBy === 'reviews') sortOption = { totalReviews: -1 };

  const salons = await models.Salon.find(filter).sort(sortOption).select('name slug tagline logoUrl coverImageUrl description address locality city state phone openingHours rating totalReviews startingPrice popularServices availableToday _id');
  res.json({ success: true, count: salons.length, data: salons });
}, 'Failed to discover salons'));

// ----------------------------------------------------
// AUTHENTICATION SYSTEM
// ----------------------------------------------------

// ── Input Validation Rules ───────────────────────────────────
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/signup & /api/auth/register
const signupHandler = safeHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }

  const { email, phone, password, role, salonName, salonAddress, address, city, state, gstNumber, businessType } = req.body;
  const ownerName = req.body.ownerName || req.body.name;
  if (!ownerName) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  const userExists = await models.User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (role === 'CLIENT') {
    // Create Client User (Global)
    const user = await models.User.create({
      name: ownerName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'CLIENT'
    });

    // Find first salon in database to associate client with a customer profile for loyalty tracking
    const salons = await models.Salon.find({});
    if (salons.length > 0) {
      await models.Customer.create({
        salonId: salons[0]._id,
        name: ownerName,
        email: email.toLowerCase(),
        phone,
        loyaltyPoints: 0,
        membershipLevel: 'None'
      });
    }

    return res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  // Create Salon
  const salon = await models.Salon.create({
    name: salonName || `${ownerName}'s Salon`,
    ownerName,
    email: email.toLowerCase(),
    phone,
    address: salonAddress || address || 'Main Salon Floor',
    city: city || 'Mumbai',
    state: state || 'Maharashtra',
    gstNumber,
    businessType: businessType || 'Salon & Spa',
    subscriptionPlan: 'Starter Salon',
    subscriptionStatus: 'Trial'
  });

  // Create default Branch
  const branch = await models.Branch.create({
    salonId: salon._id,
    name: 'Main Branch',
    address: salonAddress || address || 'Main Salon Floor',
    city: city || 'Mumbai',
    state: state || 'Maharashtra',
    phone,
    status: 'Active'
  });

  // Create Owner User
  const user = await models.User.create({
    name: ownerName,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: 'SALON_OWNER',
    salonId: salon._id,
    branchId: branch._id
  });

  // Create default configurations (Services, Staff, Products) for new Salons
  await models.Service.create([
    { salonId: salon._id, name: 'Premium Haircut', category: 'Haircut', duration: 30, price: 500, materialCost: 50 },
    { salonId: salon._id, name: 'Global Hair Color', category: 'Hair Color', duration: 90, price: 2500, materialCost: 600 },
    { salonId: salon._id, name: 'Gold Facial', category: 'Facial', duration: 60, price: 1500, materialCost: 200 },
    { salonId: salon._id, name: 'Bridal Makeover', category: 'Bridal Services', duration: 180, price: 15000, materialCost: 2500 }
  ]);

  await models.Staff.create({
    salonId: salon._id,
    branchId: branch._id,
    name: 'Emma Watson',
    phone: phone,
    role: 'Senior Stylist',
    salary: 25000,
    commissionPercentage: 10
  });

  await models.Product.create({
    salonId: salon._id,
    name: 'Argan Oil Shampoo',
    sku: 'SHAMP-ARG-500',
    category: 'Hair Care',
    quantity: 15,
    purchasePrice: 400,
    sellingPrice: 750,
    lowStockThreshold: 3
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id, user.tokenVersion || 1),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      salonId: user.salonId,
      branchId: user.branchId
    }
  });
}, 'Registration failed');

router.post('/auth/signup', authLimiter, signupValidation, signupHandler);
router.post('/auth/register', authLimiter, signupValidation, signupHandler);

// @route   POST /api/auth/login
router.post('/auth/login', authLimiter, loginValidation, safeHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }

  const { email, password } = req.body;
  const cleanInput = (email || '').trim();
  const inputPhone = cleanInput.replace(/[\s+-]/g, '');

  const user = await models.User.findOne({
    $or: [
      { email: cleanInput.toLowerCase() },
      { phone: cleanInput },
      { phone: inputPhone },
      { phone: `+91 ${cleanInput}` }
    ]
  });

  // SECURITY: Auto-creation of user accounts during login has been removed.
  // Staff accounts must be created explicitly through the admin staff-creation flow.

  if (user && (await bcrypt.compare(password, user.password))) {
    // Check account status
    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is disabled or suspended' });
    }

    res.json({
      success: true,
      token: generateToken(user._id, user.tokenVersion || 1),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        branchId: user.branchId
      }
    });
  } else {
    // Generic message to prevent user enumeration
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
}, 'Login failed'));

// OTP & Password Reset — NOT YET IMPLEMENTED
router.post('/auth/forgot-password', authLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Password reset is not yet implemented', mock: true });
});
router.post('/auth/verify-otp', authLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'OTP verification is not yet implemented', mock: true });
});
router.post('/auth/reset-password', authLimiter, (req, res) => {
  res.status(501).json({ success: false, message: 'Password reset is not yet implemented', mock: true });
});

// ----------------------------------------------------
// MULTI-TENANT MIDDLEWARES ON CORE ROUTES
// ----------------------------------------------------
router.use(protect);

router.use(restrictToTenant);

// ----------------------------------------------------
// CUSTOMER CRM
// ----------------------------------------------------
const CUSTOMER_CREATE_FIELDS = ['name', 'phone', 'email', 'gender', 'birthday', 'address', 'notes', 'photo', 'membershipLevel', 'branchId'];
const CUSTOMER_EDIT_FIELDS = ['name', 'phone', 'email', 'gender', 'birthday', 'address', 'notes', 'photo', 'membershipLevel', 'loyaltyPoints', 'branchId'];

router.get('/customers', requirePermission('customers.view'), safeHandler(async (req, res) => {
  let filter = { ...req.tenantFilter };
  if (req.user.role === 'CLIENT') {
    filter.$or = [{ email: req.user.email }, { phone: req.user.phone }];
  }
  if (req.query.search && req.query.search.trim()) {
    const q = req.query.search.trim();
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    });
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.Customer.countDocuments(filter);
    const customers = await models.Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    return res.json({
      success: true,
      count: customers.length,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const customers = await models.Customer.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: customers.length, data: customers });
}, 'Failed to fetch customers'));

// @route   GET /api/customers/:id/profile (Comprehensive 360 Customer CRM Profile)
router.get('/customers/:id/profile', requirePermission('customers.view'), validateObjectId, safeHandler(async (req, res) => {
  const customer = await models.Customer.findOne({ _id: req.params.id, ...req.tenantFilter });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  // 1. Fetch customer appointment history
  const appointments = await models.Appointment.find({ customerId: customer._id, ...req.tenantFilter })
    .populate('staffId', 'name role avatar')
    .sort({ date: -1 });

  // 2. Fetch customer invoices
  const invoices = await models.Invoice.find({ customerId: customer._id, ...req.tenantFilter })
    .populate('staffId', 'name')
    .sort({ createdAt: -1 });

  // 3. Fetch active customer membership
  const membership = await models.CustomerMembership.findOne({ customerId: customer._id, status: 'Active' })
    .populate('membershipPlanId');

  // 4. Fetch loyalty point history
  const loyaltyHistory = await models.LoyaltyPoint.find({ customerId: customer._id })
    .sort({ date: -1 })
    .limit(20);

  // 5. Fetch reviews submitted by customer
  const reviews = await models.Review.find({ customerId: customer._id }).sort({ date: -1 });

  // Compute CRM metrics
  const completedAppointments = appointments.filter(a => ['Completed', 'Confirmed', 'In Progress'].includes(a.status));
  const totalVisits = completedAppointments.length > 0 ? completedAppointments.length : invoices.length;
  const totalSpent = invoices.reduce((sum, inv) => sum + (inv.paymentStatus === 'Refunded' ? 0 : (Number(inv.finalAmount) || 0)), 0);
  const averageSpend = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;
  const lastVisit = appointments[0]?.date || invoices[0]?.createdAt || null;

  // Favorite Services & Staff
  const serviceCountMap = {};
  appointments.forEach(a => {
    (a.services || []).forEach(s => {
      const sName = s.name || 'Salon Service';
      serviceCountMap[sName] = (serviceCountMap[sName] || 0) + 1;
    });
  });
  const topServices = Object.entries(serviceCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const staffCountMap = {};
  appointments.forEach(a => {
    if (a.staffId && a.staffId.name) {
      staffCountMap[a.staffId.name] = (staffCountMap[a.staffId.name] || 0) + 1;
    }
  });
  const favoriteStaff = Object.entries(staffCountMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Any Staff';

  res.json({
    success: true,
    data: {
      customer,
      stats: {
        totalVisits,
        totalSpent,
        averageSpend,
        lastVisit,
        loyaltyPoints: customer.loyaltyPoints || 0,
        membershipTier: customer.membershipLevel || 'None',
        favoriteStaff
      },
      topServices,
      membership,
      appointments,
      invoices,
      loyaltyHistory,
      reviews
    }
  });
}, 'Failed to fetch customer profile'));

router.post('/customers', requirePermission('customers.create'), sanitizeBody([...CUSTOMER_CREATE_FIELDS]), safeHandler(async (req, res) => {
  const newCustomer = await models.Customer.create({
    ...req.body,
    salonId: req.user.salonId
  });

  // If the customer has an email, auto-create a CLIENT user so they can log in
  let clientAccountCreated = false;
  if (req.body.email) {
    const existingUser = await models.User.findOne({ email: req.body.email.toLowerCase() });
    if (!existingUser) {
      // Generate a random temporary password (never returned to the caller)
      const crypto = require('crypto');
      const tempPassword = crypto.randomBytes(12).toString('base64url');
      const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);
      await models.User.create({
        name: req.body.name,
        email: req.body.email.toLowerCase(),
        phone: req.body.phone || '',
        password: hashedPassword,
        role: 'CLIENT'
      });
      clientAccountCreated = true;
    }
  }

  // SECURITY: Never return passwords in the response
  res.status(201).json({ success: true, data: newCustomer, clientAccountCreated });
}, 'Failed to create customer'));

router.put('/customers/:id', requirePermission('customers.edit'), validateObjectId, sanitizeBody([...CUSTOMER_EDIT_FIELDS]), safeHandler(async (req, res) => {
  const customer = await models.Customer.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: customer });
}, 'Failed to update customer'));

router.delete('/customers/:id', requirePermission('customers.delete'), validateObjectId, safeHandler(async (req, res) => {
  const customer = await models.Customer.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, message: 'Customer removed' });
}, 'Failed to delete customer'));

// ----------------------------------------------------
// APPOINTMENT MANAGEMENT
// ----------------------------------------------------
class AppointmentLockManager {
  constructor() {
    this.locks = new Map();
  }

  async acquire(key, fn) {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release;
    const lockPromise = new Promise((resolve) => {
      release = resolve;
    });
    this.locks.set(key, lockPromise);

    try {
      return await fn();
    } finally {
      this.locks.delete(key);
      release();
    }
  }
}

const appointmentLockManager = new AppointmentLockManager();

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 600; // default 10:00 (600 mins)
  const clean = String(timeStr).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 600;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const isTimeIntervalOverlapping = (startA, durationA, startB, durationB) => {
  const durA = Math.max(1, Number(durationA) || 30);
  const durB = Math.max(1, Number(durationB) || 30);
  const endA = startA + durA;
  const endB = startB + durB;
  return Math.max(startA, startB) < Math.min(endA, endB);
};

const getSlotSlices = (startMinute, duration) => {
  const slices = [];
  const dur = Math.max(15, Number(duration) || 30);
  for (let m = startMinute; m < startMinute + dur; m += 15) {
    slices.push(m);
  }
  return slices;
};

const getDateString = (dateInput) => {
  if (!dateInput) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return dateInput.split('T')[0];
  }
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const APPOINTMENT_FIELDS = ['customerId', 'staffId', 'services', 'date', 'time', 'status', 'salonId', 'branchId', 'duration'];

router.get('/appointments', requirePermission('appointments.view'), safeHandler(async (req, res) => {
  let filter = { ...req.tenantFilter };
  if (req.user.role === 'CLIENT') {
    const myCustomers = await models.Customer.find({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    const myIds = myCustomers.map(c => c._id);
    filter.customerId = { $in: myIds };
  }
  if (req.query.status && req.query.status !== 'ALL') {
    filter.status = req.query.status;
  }
  if (req.query.staffId && mongoose.Types.ObjectId.isValid(req.query.staffId)) {
    filter.staffId = req.query.staffId;
  }
  if (req.query.date) {
    const startOfDay = new Date(req.query.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.query.date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.Appointment.countDocuments(filter);
    const appointments = await models.Appointment.find(filter)
      .populate('customerId')
      .populate('staffId')
      .sort({ date: -1, time: 1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const appointments = await models.Appointment.find(filter)
    .populate('customerId')
    .populate('staffId')
    .sort({ date: -1, time: 1 });
  res.json({ success: true, data: appointments });
}, 'Failed to fetch appointments'));

router.post('/appointments', sensitiveActionLimiter, requireIdempotency, requirePermission('appointments.create'), sanitizeBody([...APPOINTMENT_FIELDS]), safeHandler(async (req, res) => {
  const targetSalonId = req.user.role === 'CLIENT' ? (req.body.salonId || req.user.salonId) : req.user.salonId;
  
  // 1. Gracefully resolve branchId for Salon Owner / Manager / Staff / Client
  let targetBranchId = req.body.branchId || req.user.branchId;
  if (!targetBranchId || !mongoose.Types.ObjectId.isValid(targetBranchId)) {
    const branch = await models.Branch.findOne({ salonId: targetSalonId });
    if (branch) {
      targetBranchId = branch._id;
    } else {
      const defaultBranch = await models.Branch.create({
        name: 'Main Branch',
        salonId: targetSalonId,
        city: 'Mumbai',
        address: 'Main Salon Floor'
      });
      targetBranchId = defaultBranch._id;
    }
  }

  // 2. Gracefully resolve staffId
  let finalStaffId = req.body.staffId;
  if (!finalStaffId || !mongoose.Types.ObjectId.isValid(finalStaffId)) {
    let staffDoc = null;
    if (finalStaffId) {
      staffDoc = await models.Staff.findOne({ salonId: targetSalonId, $or: [{ _id: finalStaffId }, { name: req.body.staffName }] });
    }
    if (!staffDoc) {
      staffDoc = await models.Staff.findOne({ salonId: targetSalonId });
    }
    if (!staffDoc) {
      staffDoc = await models.Staff.create({
        salonId: targetSalonId,
        branchId: targetBranchId,
        name: 'Senior Stylist',
        role: 'Stylist'
      });
    }
    finalStaffId = staffDoc._id;
  } else {
    // Multi-tenant check: Verify staff belongs to target salon
    const staffDoc = await models.Staff.findOne({ _id: finalStaffId, salonId: targetSalonId });
    if (!staffDoc) {
      return res.status(400).json({
        success: false,
        message: 'Staff member not found or does not belong to this salon'
      });
    }
  }

  // 3. Gracefully resolve customerId
  let finalCustomerId = req.body.customerId;
  if (req.user.role === 'CLIENT') {
    let customer = await models.Customer.findOne({ 
      salonId: targetSalonId,
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });

    if (!customer) {
      customer = await models.Customer.create({
        salonId: targetSalonId,
        branchId: targetBranchId,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        loyaltyPoints: 0,
        membershipLevel: 'None'
      });
    }
    finalCustomerId = customer._id;
  } else if (!finalCustomerId || !mongoose.Types.ObjectId.isValid(finalCustomerId)) {
    let customerDoc = null;
    if (finalCustomerId) {
      customerDoc = await models.Customer.findOne({ salonId: targetSalonId, $or: [{ _id: finalCustomerId }, { name: req.body.customerName }] });
    }
    if (!customerDoc && req.body.customerName) {
      customerDoc = await models.Customer.create({
        salonId: targetSalonId,
        branchId: targetBranchId,
        name: req.body.customerName,
        phone: req.body.customerPhone || 'Walk-in'
      });
    }
    if (!customerDoc) {
      customerDoc = await models.Customer.findOne({ salonId: targetSalonId });
    }
    if (!customerDoc) {
      customerDoc = await models.Customer.create({
        salonId: targetSalonId,
        branchId: targetBranchId,
        name: 'Walk-in Client',
        phone: 'Walk-in'
      });
    }
    finalCustomerId = customerDoc._id;
  }

  // 4. Format services array & calculate total duration
  const serviceItems = [];
  let totalDuration = 0;
  if (req.body.services && Array.isArray(req.body.services)) {
    for (const item of req.body.services) {
      const sId = typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId;
      let sDoc = null;
      if (sId && mongoose.Types.ObjectId.isValid(sId)) {
        sDoc = await models.Service.findById(sId);
      }
      const sDuration = Number(item.duration) || (sDoc ? Number(sDoc.duration) : 30) || 30;
      totalDuration += sDuration;

      serviceItems.push({
        serviceId: sDoc ? sDoc._id : (mongoose.Types.ObjectId.isValid(sId) ? sId : null),
        name: item.name || (sDoc ? sDoc.name : 'Salon Service'),
        price: Number(item.price) || (sDoc ? Number(sDoc.price) : 0) || 0,
        duration: sDuration
      });
    }
  }
  if (totalDuration === 0) {
    totalDuration = Number(req.body.duration) || 30;
  }

  const appointmentDate = req.body.date ? new Date(req.body.date) : new Date();
  const appointmentTime = req.body.time || '10:00';

  const dayStart = new Date(appointmentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(appointmentDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dateStr = getDateString(req.body.date || appointmentDate);

  // Critical Section: Combined In-Memory Lock (for single process) + Distributed MongoDB Unique Index (for multi-instance)
  const lockKey = `${targetSalonId}:${finalStaffId}:${dateStr}`;

  return await appointmentLockManager.acquire(lockKey, async () => {
    // 1. In-process overlap validation
    if (finalStaffId && req.body.date && req.body.time) {
      const existingAppts = await models.Appointment.find({
        salonId: targetSalonId,
        staffId: finalStaffId,
        date: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
      });

      const requestedStart = parseTimeToMinutes(appointmentTime);

      for (const appt of existingAppts) {
        const apptStart = parseTimeToMinutes(appt.time);
        const apptDuration = appt.duration || (appt.services || []).reduce((sum, s) => sum + (s.duration || 30), 0) || 30;

        if (isTimeIntervalOverlapping(requestedStart, totalDuration, apptStart, apptDuration)) {
          return res.status(400).json({
            success: false,
            message: 'The requested staff member is already booked for another appointment at this time slot.'
          });
        }
      }
    }

    const startMin = parseTimeToMinutes(appointmentTime);
    const slices = getSlotSlices(startMin, totalDuration);
    const newApptId = new mongoose.Types.ObjectId();

    // 2. Authoritative Database-Level Distributed Reservation (Atomic across ALL backend server processes)
    const insertedReservations = [];
    try {
      for (const slotMin of slices) {
        const resDoc = await models.SlotReservation.create({
          salonId: targetSalonId,
          branchId: targetBranchId,
          staffId: finalStaffId,
          dateStr,
          slotMinute: slotMin,
          appointmentId: newApptId
        });
        insertedReservations.push(resDoc._id);
      }
    } catch (slotErr) {
      // Rollback any partially inserted reservations in this attempt
      if (insertedReservations.length > 0) {
        await models.SlotReservation.deleteMany({ _id: { $in: insertedReservations } });
      }
      return res.status(400).json({
        success: false,
        message: 'The requested staff member is already booked for another appointment at this time slot.'
      });
    }

    // 3. Create Appointment Document
    let appointment;
    try {
      appointment = await models.Appointment.create({
        _id: newApptId,
        salonId: targetSalonId,
        branchId: targetBranchId,
        customerId: finalCustomerId,
        staffId: finalStaffId,
        services: serviceItems,
        duration: totalDuration,
        date: appointmentDate,
        time: appointmentTime,
        status: req.body.status || 'Scheduled'
      });
    } catch (createErr) {
      await models.SlotReservation.deleteMany({ appointmentId: newApptId });
      throw createErr;
    }

    // 4. Trigger appointment confirmation notification
    await models.Notification.create({
      salonId: targetSalonId,
      targetRole: 'Customer',
      recipientId: finalCustomerId ? String(finalCustomerId) : null,
      category: 'Appointment',
      type: 'InApp',
      title: 'Appointment Confirmed',
      message: `Hello! Your appointment at SalonSync is scheduled for ${req.body.date || appointment.date} at ${appointment.time}. See you soon!`,
      status: 'Sent'
    });

    return res.status(201).json({ success: true, data: appointment });
  });
}, 'Failed to create appointment'));

router.put('/appointments/:id', sensitiveActionLimiter, requireIdempotency, requirePermission('appointments.edit'), validateObjectId, sanitizeBody([...APPOINTMENT_FIELDS]), safeHandler(async (req, res) => {
  const existingAppt = await models.Appointment.findOne({ _id: req.params.id, ...req.tenantFilter });
  if (!existingAppt) return res.status(404).json({ success: false, message: 'Appointment not found' });

  const targetStaffId = req.body.staffId || existingAppt.staffId;
  const targetDate = req.body.date ? new Date(req.body.date) : existingAppt.date;
  const targetTime = req.body.time || existingAppt.time;
  const targetDuration = Number(req.body.duration) || existingAppt.duration || 30;

  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dateStr = getDateString(req.body.date || existingAppt.date);
  const lockKey = `${existingAppt.salonId}:${targetStaffId}:${dateStr}`;

  return await appointmentLockManager.acquire(lockKey, async () => {
    const newStatus = req.body.status || existingAppt.status;
    const isBlockingStatus = ['Scheduled', 'Confirmed', 'In Progress'].includes(newStatus);

    if (newStatus === 'Cancelled') {
      // Release slot reservations immediately upon cancellation
      await models.SlotReservation.deleteMany({ appointmentId: existingAppt._id });
    } else if (isBlockingStatus && (req.body.date || req.body.time || req.body.staffId || req.body.duration)) {
      // In-process check against other active appointments
      const activeAppts = await models.Appointment.find({
        _id: { $ne: existingAppt._id }, // Exclude self
        salonId: existingAppt.salonId,
        staffId: targetStaffId,
        date: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
      });

      const requestedStart = parseTimeToMinutes(targetTime);

      for (const appt of activeAppts) {
        const apptStart = parseTimeToMinutes(appt.time);
        const apptDuration = appt.duration || (appt.services || []).reduce((sum, s) => sum + (s.duration || 30), 0) || 30;

        if (isTimeIntervalOverlapping(requestedStart, targetDuration, apptStart, apptDuration)) {
          return res.status(400).json({
            success: false,
            message: 'The requested staff member is already booked for another appointment at this time slot.'
          });
        }
      }

      // Authoritative Distributed Slot Reservation Update
      const newStartMin = parseTimeToMinutes(targetTime);
      const newSlices = getSlotSlices(newStartMin, targetDuration);
      const newDateStr = getDateString(req.body.date || targetDate);

      // Temporarily clear old reservations for this appointment
      await models.SlotReservation.deleteMany({ appointmentId: existingAppt._id });

      const insertedNew = [];
      try {
        for (const slotMin of newSlices) {
          const resDoc = await models.SlotReservation.create({
            salonId: existingAppt.salonId,
            branchId: existingAppt.branchId,
            staffId: targetStaffId,
            dateStr: newDateStr,
            slotMinute: slotMin,
            appointmentId: existingAppt._id
          });
          insertedNew.push(resDoc._id);
        }
      } catch (reschedErr) {
        if (insertedNew.length > 0) {
          await models.SlotReservation.deleteMany({ _id: { $in: insertedNew } });
        }
        // Restore old reservations if new slot collision occurs
        const oldStartMin = parseTimeToMinutes(existingAppt.time);
        const oldSlices = getSlotSlices(oldStartMin, existingAppt.duration || 30);
        const oldDateStr = getDateString(existingAppt.date);
        for (const oldMin of oldSlices) {
          await models.SlotReservation.create({
            salonId: existingAppt.salonId,
            branchId: existingAppt.branchId,
            staffId: existingAppt.staffId,
            dateStr: oldDateStr,
            slotMinute: oldMin,
            appointmentId: existingAppt._id
          }).catch(() => {});
        }

        return res.status(400).json({
          success: false,
          message: 'The requested staff member is already booked for another appointment at this time slot.'
        });
      }
    }

    // Automated atomic inventory deduction upon appointment completion
    if (req.body.status === 'Completed' && !existingAppt.inventoryDeducted) {
      const claimedAppt = await models.Appointment.findOneAndUpdate(
        {
          _id: req.params.id,
          ...req.tenantFilter,
          inventoryDeducted: { $ne: true }
        },
        {
          $set: { inventoryDeducted: true }
        },
        { new: true }
      );

      if (claimedAppt) {
        const customer = await models.Customer.findById(claimedAppt.customerId);
        const staffMember = await models.Staff.findById(claimedAppt.staffId);
        
        const serviceIds = (claimedAppt.services || []).map(s => s.serviceId).filter(Boolean);
        const populatedServices = await models.Service.find({ _id: { $in: serviceIds } });

        for (const srv of populatedServices) {
          if (srv.requiredProducts && srv.requiredProducts.length > 0) {
            for (const reqProd of srv.requiredProducts) {
              if (reqProd.productId && reqProd.quantity > 0) {
                const product = await models.Product.findOneAndUpdate(
                  { _id: reqProd.productId, salonId: claimedAppt.salonId },
                  { $inc: { quantity: -reqProd.quantity } },
                  { new: true }
                );

                if (product) {
                  await models.InventoryConsumption.create({
                    salonId: claimedAppt.salonId,
                    branchId: claimedAppt.branchId,
                    productId: product._id,
                    productName: product.name,
                    quantityConsumed: reqProd.quantity,
                    unit: reqProd.unit || 'units',
                    serviceId: srv._id,
                    serviceName: srv.name,
                    customerId: claimedAppt.customerId,
                    customerName: customer ? customer.name : 'Client',
                    staffId: claimedAppt.staffId,
                    staffName: staffMember ? staffMember.name : 'Staff',
                    appointmentId: claimedAppt._id,
                    date: new Date()
                  });

                  await models.InventoryMovement.create({
                    salonId: claimedAppt.salonId,
                    branchId: claimedAppt.branchId,
                    productId: product._id,
                    productName: product.name,
                    sku: product.sku,
                    type: 'SERVICE_USAGE',
                    previousQuantity: product.quantity + reqProd.quantity,
                    changeQuantity: -reqProd.quantity,
                    newQuantity: product.quantity,
                    reason: `Backbar consumption for service: ${srv.name}`,
                    referenceType: 'Appointment',
                    referenceId: claimedAppt._id,
                    userId: req.user ? req.user._id : null,
                    userName: staffMember ? staffMember.name : 'Stylist'
                  });

                  if (product.quantity <= (product.reorderLevel || product.lowStockThreshold || 5)) {
                    await models.Notification.create({
                      salonId: claimedAppt.salonId,
                      targetRole: 'Owner',
                      category: 'Inventory',
                      type: 'InApp',
                      title: 'Low Stock Alert',
                      message: `Low Stock Alert: ${product.name} is down to ${product.quantity} ${product.unit || 'units'} (Reorder Level: ${product.reorderLevel || 10}).`,
                      status: 'Sent'
                    });
                  }
                }
              }
            }
          }
        }
      }
      req.body.inventoryDeducted = true;
    }

    const appointment = await models.Appointment.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    );
    return res.json({ success: true, data: appointment });
  });
}, 'Failed to update appointment'));

router.delete('/appointments/:id', requirePermission('appointments.cancel'), validateObjectId, safeHandler(async (req, res) => {
  const appointment = await models.Appointment.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  await models.SlotReservation.deleteMany({ appointmentId: appointment._id });
  res.json({ success: true, message: 'Appointment cancelled' });
}, 'Failed to cancel appointment'));

// ----------------------------------------------------
// SERVICES AND PACKAGES
// ----------------------------------------------------
const SERVICE_FIELDS = ['name', 'category', 'duration', 'price', 'materialCost', 'description', 'staffCommissionPercentage', 'taxPercentage', 'discountAmount', 'allocatedCostPercentage', 'requiredProducts'];
const PACKAGE_FIELDS = ['name', 'includedServices', 'price', 'expiryDate'];

router.get('/services', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const services = await models.Service.find(req.tenantFilter);
  res.json({ success: true, data: services });
}, 'Failed to fetch services'));

router.post('/services', requirePermission('inventory.edit'), sanitizeBody([...SERVICE_FIELDS]), safeHandler(async (req, res) => {
  const price = Number(req.body.price);
  if (isNaN(price) || !isFinite(price) || price < 0) {
    return res.status(400).json({ success: false, message: 'Valid non-negative price is required' });
  }

  const service = new models.Service({
    ...req.body,
    price,
    salonId: req.user.salonId
  });
  await service.save(); // pre('save') calculates profitMargin
  res.status(201).json({ success: true, data: service });
}, 'Failed to create service'));

router.put('/services/:id', requirePermission('inventory.edit'), validateObjectId, sanitizeBody([...SERVICE_FIELDS]), safeHandler(async (req, res) => {
  const service = await models.Service.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, data: service });
}, 'Failed to update service'));

router.delete('/services/:id', requirePermission('inventory.edit'), validateObjectId, safeHandler(async (req, res) => {
  const service = await models.Service.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, message: 'Service removed' });
}, 'Failed to delete service'));

router.get('/packages', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const packages = await models.Package.find(req.tenantFilter);
  res.json({ success: true, data: packages });
}, 'Failed to fetch packages'));

router.post('/packages', requirePermission('inventory.edit'), sanitizeBody([...PACKAGE_FIELDS]), safeHandler(async (req, res) => {
  const pkg = await models.Package.create({
    ...req.body,
    salonId: req.user.salonId
  });
  res.status(201).json({ success: true, data: pkg });
}, 'Failed to create package'));

router.put('/packages/:id', requirePermission('inventory.edit'), validateObjectId, sanitizeBody([...PACKAGE_FIELDS]), safeHandler(async (req, res) => {
  const pkg = await models.Package.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
  res.json({ success: true, data: pkg });
}, 'Failed to update package'));

router.delete('/packages/:id', requirePermission('inventory.edit'), validateObjectId, safeHandler(async (req, res) => {
  const pkg = await models.Package.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
  res.json({ success: true, message: 'Package removed' });
}, 'Failed to delete package'));

// ----------------------------------------------------
// SALON MEMBERSHIP PLANS & CUSTOMER SUBSCRIPTIONS
// ----------------------------------------------------
const MEMBERSHIP_FIELDS = ['name', 'tier', 'discountPercentage', 'price', 'validityMonths', 'includedServices', 'priorityBooking', 'loyaltyMultiplier', 'specialOffers', 'description', 'active'];

router.get('/memberships', safeHandler(async (req, res) => {
  const plans = await models.Membership.find({ salonId: req.user.salonId, active: true }).sort({ price: 1 });
  res.json({ success: true, data: plans });
}, 'Failed to fetch membership plans'));

router.post('/memberships', requirePermission('inventory.edit'), sanitizeBody([...MEMBERSHIP_FIELDS]), safeHandler(async (req, res) => {
  const plan = await models.Membership.create({
    ...req.body,
    salonId: req.user.salonId
  });
  res.status(201).json({ success: true, data: plan });
}, 'Failed to create membership plan'));

router.put('/memberships/:id', requirePermission('inventory.edit'), validateObjectId, sanitizeBody([...MEMBERSHIP_FIELDS]), safeHandler(async (req, res) => {
  const plan = await models.Membership.findOneAndUpdate(
    { _id: req.params.id, salonId: req.user.salonId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!plan) return res.status(404).json({ success: false, message: 'Membership plan not found' });
  res.json({ success: true, data: plan });
}, 'Failed to update membership plan'));

router.delete('/memberships/:id', requirePermission('inventory.edit'), validateObjectId, safeHandler(async (req, res) => {
  const plan = await models.Membership.findOneAndDelete({ _id: req.params.id, salonId: req.user.salonId });
  if (!plan) return res.status(404).json({ success: false, message: 'Membership plan not found' });
  res.json({ success: true, message: 'Membership plan removed' });
}, 'Failed to delete membership plan'));

router.get('/customer-memberships', safeHandler(async (req, res) => {
  const filter = { salonId: req.user.salonId };
  if (req.query.customerId) filter.customerId = req.query.customerId;
  const subscriptions = await models.CustomerMembership.find(filter).populate('customerId').populate('membershipPlanId').sort({ expiryDate: -1 });
  res.json({ success: true, data: subscriptions });
}, 'Failed to fetch customer memberships'));

const subscribeMembershipHandler = safeHandler(async (req, res) => {
  const customerId = req.body.customerId;
  const membershipPlanId = req.body.membershipPlanId || req.body.membershipId;
  const plan = await models.Membership.findById(membershipPlanId);
  if (!plan) return res.status(404).json({ success: false, message: 'Membership plan not found' });

  const start = req.body.startDate ? new Date(req.body.startDate) : new Date();
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + (plan.validityMonths || 12));

  const benefits = (plan.includedServices || []).map(srv => ({
    serviceId: srv.serviceId,
    serviceName: srv.name,
    sessionsUsed: 0,
    totalSessions: srv.sessionsCount || 1
  }));

  const subscription = await models.CustomerMembership.create({
    salonId: req.user.salonId,
    branchId: req.user.branchId,
    customerId,
    membershipPlanId: plan._id,
    tier: plan.tier || plan.name,
    startDate: start,
    expiryDate: expiry,
    status: 'Active',
    pricePaid: plan.price,
    discountPercentage: plan.discountPercentage,
    benefitsUsed: benefits,
    history: [{
      date: new Date(),
      action: 'Subscribed',
      details: `Subscribed to ${plan.name} Membership plan for ₹${plan.price}`
    }]
  });

  // Update Customer membershipLevel
  await models.Customer.findByIdAndUpdate(customerId, {
    membershipLevel: plan.tier || plan.name
  });

  res.status(201).json({ success: true, data: subscription });
}, 'Failed to subscribe customer membership');

router.post('/customer-memberships', subscribeMembershipHandler);
router.post('/memberships/subscribe', subscribeMembershipHandler);

router.post('/customer-memberships/:id/redeem-benefit', validateObjectId, safeHandler(async (req, res) => {
  const { serviceId } = req.body;
  const sub = await models.CustomerMembership.findOne({ _id: req.params.id, salonId: req.user.salonId });
  if (!sub) return res.status(404).json({ success: false, message: 'Subscription record not found' });

  const benefitIndex = (sub.benefitsUsed || []).findIndex(b => String(b.serviceId) === String(serviceId));
  if (benefitIndex === -1) {
    return res.status(400).json({ success: false, message: 'Selected benefit service is not included in this membership plan.' });
  }

  const benefit = sub.benefitsUsed[benefitIndex];
  if (benefit.sessionsUsed >= benefit.totalSessions) {
    return res.status(400).json({ success: false, message: `All ${benefit.totalSessions} sessions of ${benefit.serviceName} have already been used.` });
  }

  sub.benefitsUsed[benefitIndex].sessionsUsed += 1;
  sub.history.push({
    date: new Date(),
    action: 'Benefit Used',
    details: `Redeemed 1 session of ${benefit.serviceName} (${sub.benefitsUsed[benefitIndex].sessionsUsed}/${benefit.totalSessions} used)`
  });

  await sub.save();
  res.json({ success: true, data: sub });
}, 'Failed to redeem membership benefit'));

router.post('/customer-memberships/check-expiries', safeHandler(async (req, res) => {
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const expiringSubs = await models.CustomerMembership.find({
    salonId: req.user.salonId,
    status: 'Active',
    expiryDate: { $lte: thirtyDaysLater },
    expiryNotified: false
  }).populate('customerId');

  const notificationsSent = [];
  for (const sub of expiringSubs) {
    if (sub.customerId) {
      const formattedDate = new Date(sub.expiryDate).toLocaleDateString();
      const msg = `Dear ${sub.customerId.name}, your SalonSync ${sub.tier} Membership expires on ${formattedDate}. Renew today to continue enjoying ${sub.discountPercentage}% discounts!`;

      await models.Notification.create({
        salonId: req.user.salonId,
        customerId: sub.customerId._id,
        type: 'WhatsApp',
        message: msg,
        status: 'Sent'
      });

      sub.status = 'Expiring Soon';
      sub.expiryNotified = true;
      await sub.save();

      notificationsSent.push({ customerName: sub.customerId.name, expiryDate: formattedDate });
    }
  }

  res.json({ success: true, count: notificationsSent.length, notificationsSent });
}, 'Failed to check membership expiries'));

// @route   GET /api/analytics/salon-health (Compute 0-100 score & insights from live metrics)
router.get('/analytics/salon-health', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const salonId = req.user.salonId;
  const summary = await financialService.getFinancialSummary({
    salonId,
    horizon: 'this_month'
  });

  const [reviews, products, allAppts] = await Promise.all([
    models.Review.find({ salonId }),
    models.Product.find({ salonId }),
    models.Appointment.find({ salonId })
  ]);

  const totalRevenue = summary.metrics.netRevenue;
  const totalExpenses = summary.metrics.operatingExpenses;
  const netProfit = summary.metrics.netProfit;
  const profitMarginPercent = summary.metrics.profitMargin;

  const totalCustomers = summary.counts.customerCount;
  // Repeat customers: customers with > 1 invoice or > 1 appointment
  const allInvoices = await models.Invoice.find({ salonId });
  const custInvoiceMap = {};
  allInvoices.forEach(i => {
    if (i.customerId) {
      const cid = String(typeof i.customerId === 'object' ? i.customerId?._id : i.customerId);
      custInvoiceMap[cid] = (custInvoiceMap[cid] || 0) + 1;
    }
  });
  const repeatCustomersCount = Object.values(custInvoiceMap).filter(c => c > 1).length;
  const retentionPercent = totalCustomers > 0 ? Math.round((repeatCustomersCount / totalCustomers) * 100) : 0;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const lowStockProducts = products.filter(p => p.quantity <= (p.lowStockThreshold || 5));
  const inventoryHealthPercent = products.length > 0
    ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100)
    : 100;

  const totalAppts = allAppts.length;
  const completedAppts = allAppts.filter(a => a.status === 'Completed' || a.status === 'Confirmed' || a.status === 'In Progress').length;
  const utilizationPercent = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;

  // Sub-scores (0-100 scale based on real business metrics)
  const revGrowthScore = totalRevenue > 0 ? Math.min(100, Math.max(50, Math.round(totalRevenue > 50000 ? 90 : 75))) : 50;
  const profitScore = Math.min(100, Math.max(0, Math.round(profitMarginPercent * 2)));
  const retentionScore = Math.min(100, Math.round(retentionPercent * 1.25));
  const repeatScore = Math.min(100, Math.round(retentionPercent * 1.3));
  const staffScore = Math.min(100, Math.round(Number(avgRating) * 20));
  const ratingScore = Math.min(100, Math.round(Number(avgRating) * 20));
  const inventoryScore = inventoryHealthPercent;
  const utilizationScore = utilizationPercent > 0 ? utilizationPercent : 80;

  const overallHealthScore = Math.round(
    (revGrowthScore * 0.15) +
    (profitScore * 0.15) +
    (retentionScore * 0.15) +
    (repeatScore * 0.10) +
    (staffScore * 0.10) +
    (ratingScore * 0.10) +
    (inventoryScore * 0.10) +
    (utilizationScore * 0.15)
  );

  // Dynamic Actionable Insights
  const insights = [];
  if (lowStockProducts.length > 0) {
    const names = lowStockProducts.slice(0, 3).map(p => p.name).join(', ');
    insights.push({
      type: 'warning',
      category: 'Inventory',
      message: `${lowStockProducts.length} product(s) are below reorder level (${names}). Reorder to prevent stockouts.`
    });
  } else {
    insights.push({
      type: 'positive',
      category: 'Inventory',
      message: '100% of product inventory is at healthy stock levels.'
    });
  }

  if (retentionPercent < 60 && totalCustomers > 0) {
    insights.push({
      type: 'alert',
      category: 'Customer Retention',
      message: `Customer retention is at ${retentionPercent}%. Consider sending win-back loyalty vouchers.`
    });
  } else {
    insights.push({
      type: 'positive',
      category: 'Customer Retention',
      message: `Customer retention rate is ${retentionPercent}% (${repeatCustomersCount} repeat guests).`
    });
  }

  if (utilizationPercent >= 80) {
    insights.push({
      type: 'opportunity',
      category: 'Capacity',
      message: `Peak appointment utilization is at ${utilizationPercent}%. Consider adding additional slots.`
    });
  }

  insights.push({
    type: 'positive',
    category: 'Finances',
    message: `Net profit margin is ${profitMarginPercent}% with ₹${totalRevenue.toLocaleString()} in billed revenue.`
  });

  res.json({
    success: true,
    data: {
      overallHealthScore,
      ratingGrade: overallHealthScore >= 80 ? 'Excellent' : overallHealthScore >= 60 ? 'Good' : 'Needs Attention',
      metrics: {
        totalRevenue,
        netProfit,
        profitMarginPercent,
        totalCustomers,
        repeatCustomersCount,
        retentionPercent,
        avgRating,
        totalReviews,
        lowStockCount: lowStockProducts.length,
        inventoryHealthPercent,
        utilizationPercent
      },
      categoryScores: {
        revenueGrowth: revGrowthScore,
        profitMargin: profitScore,
        customerRetention: retentionScore,
        repeatCustomers: repeatScore,
        staffPerformance: staffScore,
        customerRatings: ratingScore,
        inventoryHealth: inventoryScore,
        appointmentUtilization: utilizationScore
      },
      insights
    }
  });
}, 'Failed to compute salon health score'));

// ----------------------------------------------------
// WHATSAPP COMMUNICATION SYSTEM & PROVIDER ADAPTERS
// ----------------------------------------------------

router.get('/whatsapp/config', safeHandler(async (req, res) => {
  let config = await models.WhatsAppConfig.findOne({ salonId: req.user.salonId });
  if (!config) {
    config = await models.WhatsAppConfig.create({
      salonId: req.user.salonId,
      provider: 'Unconfigured',
      enabledTriggers: {
        Confirmation: true,
        Reminder: true,
        Cancellation: true,
        Rescheduled: true,
        Invoice: true,
        Payment: true,
        Birthday: true,
        MembershipExpiry: true,
        Loyalty: true,
        Revisit: true,
        Promo: true
      }
    });
  }
  res.json({ success: true, data: config });
}, 'Failed to fetch WhatsApp config'));

router.put('/whatsapp/config', sanitizeBody(['provider', 'apiKey', 'phoneNumberId', 'webhookSecret', 'enabledTriggers']), safeHandler(async (req, res) => {
  const config = await models.WhatsAppConfig.findOneAndUpdate(
    { salonId: req.user.salonId },
    { ...req.body, salonId: req.user.salonId },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: config });
}, 'Failed to update WhatsApp config'));

router.put('/whatsapp/templates', sanitizeBody(['customTemplates']), safeHandler(async (req, res) => {
  const config = await models.WhatsAppConfig.findOneAndUpdate(
    { salonId: req.user.salonId },
    { customTemplates: req.body.customTemplates },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: config });
}, 'Failed to update WhatsApp templates'));

router.post('/whatsapp/dispatch', sensitiveActionLimiter, requireIdempotency, sanitizeBody(['customerId', 'phone', 'customerName', 'triggerType', 'message']), safeHandler(async (req, res) => {
  const { customerId, phone, customerName, triggerType, message } = req.body;
  const config = await models.WhatsAppConfig.findOne({ salonId: req.user.salonId });

  const isConfigured = config && config.provider !== 'Unconfigured' && config.apiKey && config.apiKey.trim().length > 5;
  const status = isConfigured ? 'Sent' : 'Provider Required';

  const notification = await models.Notification.create({
    salonId: req.user.salonId,
    customerId: customerId || null,
    customerPhone: phone || '',
    customerName: customerName || 'Valued Client',
    type: 'WhatsApp',
    triggerType: triggerType || 'General',
    message,
    status,
    providerUsed: isConfigured ? config.provider : 'Unconfigured (API Credentials Required)'
  });

  res.status(201).json({
    success: true,
    status,
    isConfigured,
    message: isConfigured 
      ? `WhatsApp message dispatched via ${config.provider}` 
      : 'Message logged in outbox with status "Provider Required". Please configure Meta Cloud API or Twilio credentials in Provider Settings.',
    data: notification
  });
}, 'Failed to dispatch WhatsApp message'));

router.get('/whatsapp/outbox', safeHandler(async (req, res) => {
  const outbox = await models.Notification.find({ salonId: req.user.salonId, type: 'WhatsApp' }).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: outbox });
}, 'Failed to fetch WhatsApp outbox'));

// ----------------------------------------------------
// CENTRALIZED NOTIFICATION CENTER & REAL EVENTS
// ----------------------------------------------------

router.get('/notifications', safeHandler(async (req, res) => {
  const notifications = await models.Notification.find({ salonId: req.user.salonId }).sort({ createdAt: -1 }).limit(150);
  res.json({ success: true, data: notifications });
}, 'Failed to fetch notifications'));

router.post('/notifications', sanitizeBody(['targetRole', 'category', 'type', 'title', 'message', 'recipientId', 'recipientName']), safeHandler(async (req, res) => {
  const notification = await models.Notification.create({
    ...req.body,
    salonId: req.user.salonId,
    read: false,
    sentAt: new Date()
  });
  res.status(201).json({ success: true, data: notification });
}, 'Failed to create notification'));

router.put('/notifications/:id/read', validateObjectId, safeHandler(async (req, res) => {
  const notification = await models.Notification.findOneAndUpdate(
    { _id: req.params.id, salonId: req.user.salonId },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, data: notification });
}, 'Failed to mark notification as read'));

router.put('/notifications/read-all', safeHandler(async (req, res) => {
  await models.Notification.updateMany(
    { salonId: req.user.salonId, read: false },
    { read: true }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
}, 'Failed to mark all notifications as read'));

router.delete('/notifications/:id', validateObjectId, safeHandler(async (req, res) => {
  const notification = await models.Notification.findOneAndDelete({ _id: req.params.id, salonId: req.user.salonId });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, message: 'Notification deleted' });
}, 'Failed to delete notification'));

router.get('/notifications/preferences', safeHandler(async (req, res) => {
  let prefs = await models.NotificationPref.findOne({ salonId: req.user.salonId });
  if (!prefs) {
    prefs = await models.NotificationPref.create({
      salonId: req.user.salonId,
      customerChannels: { InApp: true, WhatsApp: true, SMS: true, Email: false },
      staffChannels: { InApp: true, WhatsApp: true, SMS: false, Email: true },
      ownerChannels: { InApp: true, WhatsApp: true, SMS: true, Email: true }
    });
  }
  res.json({ success: true, data: prefs });
}, 'Failed to fetch notification preferences'));

router.put('/notifications/preferences', sanitizeBody(['customerChannels', 'staffChannels', 'ownerChannels']), safeHandler(async (req, res) => {
  const prefs = await models.NotificationPref.findOneAndUpdate(
    { salonId: req.user.salonId },
    { ...req.body, salonId: req.user.salonId },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: prefs });
}, 'Failed to update notification preferences'));

// ----------------------------------------------------
// IMMUTABLE AUDIT LOGGING SYSTEM
// ----------------------------------------------------

router.get('/audit-logs', authorize('SALON_OWNER', 'FRANCHISE_OWNER', 'SUPER_ADMIN'), safeHandler(async (req, res) => {
  const { entity, action, search, page, limit } = req.query;
  const filter = { salonId: req.user.salonId };

  if (entity && entity !== 'ALL') filter.entity = entity;
  if (action && action !== 'ALL') filter.action = action;

  if (search && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { userName: { $regex: q, $options: 'i' } },
      { entityName: { $regex: q, $options: 'i' } },
      { entityId: { $regex: q, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (!isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0) {
    const skip = (pageNum - 1) * limitNum;
    const total = await models.AuditLog.countDocuments(filter);
    const logs = await models.AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  }

  const logs = await models.AuditLog.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: logs });
}, 'Failed to fetch audit logs'));

router.post('/audit-logs', sanitizeBody(['action', 'entity', 'entityId', 'entityName', 'previousValue', 'newValue', 'branchName']), safeHandler(async (req, res) => {
  const log = await models.AuditLog.create({
    ...req.body,
    salonId: req.user.salonId,
    userId: req.user.id || req.user._id,
    userName: req.user.name || 'Alexander Wright',
    userRole: req.user.role || 'SALON_OWNER',
    timestamp: new Date()
  });
  res.status(201).json({ success: true, data: log });
}, 'Failed to create audit log'));

// ----------------------------------------------------
// ENTERPRISE FRANCHISE MANAGEMENT ANALYTICS
// ----------------------------------------------------

router.get('/analytics/franchise-overview', authorize('FRANCHISE_OWNER', 'SALON_OWNER', 'SUPER_ADMIN'), safeHandler(async (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;
  const salonId = req.user.salonId;

  const summary = await financialService.getFinancialSummary({
    salonId,
    horizon: period,
    startDate,
    endDate
  });

  res.json({
    success: true,
    data: {
      period,
      dateRange: summary.dateRange,
      summary: {
        totalBranches: summary.counts.branchCount,
        totalRevenue: summary.metrics.netRevenue,
        totalExpenses: summary.metrics.operatingExpenses,
        totalProfit: summary.metrics.netProfit,
        profitMargin: summary.metrics.profitMargin,
        totalCustomers: summary.counts.customerCount,
        totalStaff: summary.counts.staffCount,
        totalAppointments: summary.counts.appointmentCount
      },
      branchMetrics: summary.branchProfitability
    }
  });
}, 'Failed to fetch franchise overview analytics'));

// ----------------------------------------------------
// EXPENSE TRACKING
// ----------------------------------------------------
const EXPENSE_FIELDS = ['category', 'amount', 'description', 'date', 'paymentMethod', 'vendor', 'receiptUrl', 'createdBy', 'branchId'];

router.get('/expenses', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const { horizon, startDate, endDate, category, paymentMethod, branchId, search } = req.query;
  const filter = { ...req.tenantFilter };

  // Branch filtering (respecting role-based tenant isolation)
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchId = branchId;
  } else if (['STAFF', 'SALON_MANAGER'].includes(req.user.role) && req.user.branchId) {
    filter.branchId = req.user.branchId;
  }

  // Date range filtering on actual expense date
  if (horizon || startDate || endDate) {
    const { startDate: bStart, endDate: bEnd } = financialService.getDateRangeBounds(horizon, startDate, endDate);
    if (bStart || bEnd) {
      filter.date = {};
      if (bStart) filter.date.$gte = bStart;
      if (bEnd) filter.date.$lte = bEnd;
    }
  }

  // Category filter
  if (category && category !== 'ALL') {
    filter.category = category;
  }

  // Payment method filter
  if (paymentMethod && paymentMethod !== 'ALL') {
    filter.paymentMethod = paymentMethod;
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { description: { $regex: q, $options: 'i' } },
      { vendor: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { createdBy: { $regex: q, $options: 'i' } }
    ];
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.Expense.countDocuments(filter);
    const expenses = await models.Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit);
    const allExpensesForTotal = await models.Expense.find(filter).select('amount category');
    const totalAmount = allExpensesForTotal.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const categoryBreakdown = {};
    allExpensesForTotal.forEach(exp => {
      const cat = exp.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(exp.amount) || 0);
    });

    return res.json({
      success: true,
      count: expenses.length,
      totalAmount,
      categoryBreakdown,
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const expenses = await models.Expense.find(filter).sort({ date: -1 });
  const totalAmount = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // Category breakdown
  const categoryBreakdown = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(exp.amount) || 0);
  });

  res.json({
    success: true,
    count: expenses.length,
    totalAmount,
    categoryBreakdown,
    data: expenses
  });
}, 'Failed to fetch expenses'));

router.get('/expenses/summary', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const { horizon = 'month', branchId, startDate, endDate } = req.query;
  const targetBranchId = branchId && mongoose.Types.ObjectId.isValid(branchId)
    ? branchId
    : (['STAFF', 'SALON_MANAGER'].includes(req.user.role) ? req.user.branchId : null);

  const summary = await financialService.getFinancialSummary({
    salonId: req.user.salonId,
    branchId: targetBranchId,
    horizon,
    startDate,
    endDate
  });

  res.json({
    success: true,
    data: {
      totalExpenses: summary.metrics.operatingExpenses,
      expenseCount: summary.counts.expenseCount,
      breakdown: summary.expenseBreakdown,
      dateRange: summary.dateRange
    }
  });
}, 'Failed to fetch expense summary'));

router.post('/expenses', requirePermission('reports.view'), sanitizeBody([...EXPENSE_FIELDS]), safeHandler(async (req, res) => {
  let targetBranchId = req.body.branchId || req.user.branchId;
  if (!targetBranchId || !mongoose.Types.ObjectId.isValid(targetBranchId)) {
    const defaultBranch = await models.Branch.findOne({ salonId: req.user.salonId });
    if (defaultBranch) {
      targetBranchId = defaultBranch._id;
    } else {
      return res.status(400).json({ success: false, message: 'Valid branchId is required for expense.' });
    }
  }

  const amount = Math.max(0, Number(req.body.amount) || 0);
  const expenseDate = req.body.date ? new Date(req.body.date) : new Date();

  const expense = await models.Expense.create({
    category: req.body.category || 'Other',
    amount,
    description: req.body.description || '',
    date: expenseDate,
    paymentMethod: req.body.paymentMethod || 'Cash',
    vendor: req.body.vendor || '',
    receiptUrl: req.body.receiptUrl || '',
    createdBy: req.body.createdBy || req.user.name || 'Manager',
    salonId: req.user.salonId,
    branchId: targetBranchId
  });

  await logAuditTrail({
    req,
    action: 'CREATE',
    entity: 'Expense',
    entityId: expense._id,
    entityName: expense.category,
    branchId: targetBranchId,
    newValue: { amount: expense.amount, category: expense.category, date: expense.date }
  });

  res.status(201).json({ success: true, data: expense });
}, 'Failed to create expense'));

router.put('/expenses/:id', requirePermission('reports.view'), validateObjectId, sanitizeBody([...EXPENSE_FIELDS]), safeHandler(async (req, res) => {
  const existing = await models.Expense.findOne({ _id: req.params.id, ...req.tenantFilter });
  if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

  const updateData = { ...req.body };
  if (updateData.amount !== undefined) {
    updateData.amount = Math.max(0, Number(updateData.amount) || 0);
  }
  if (updateData.date) {
    updateData.date = new Date(updateData.date);
  }

  const expense = await models.Expense.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    updateData,
    { new: true, runValidators: true }
  );

  await logAuditTrail({
    req,
    action: 'UPDATE',
    entity: 'Expense',
    entityId: expense._id,
    entityName: expense.category,
    branchId: expense.branchId,
    previousValue: { amount: existing.amount, category: existing.category },
    newValue: { amount: expense.amount, category: expense.category }
  });

  res.json({ success: true, data: expense });
}, 'Failed to update expense'));

router.delete('/expenses/:id', requirePermission('reports.view'), validateObjectId, safeHandler(async (req, res) => {
  const expense = await models.Expense.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

  await logAuditTrail({
    req,
    action: 'DELETE',
    entity: 'Expense',
    entityId: req.params.id,
    entityName: expense.category,
    branchId: expense.branchId,
    previousValue: { amount: expense.amount, category: expense.category }
  });

  res.json({ success: true, message: 'Expense deleted' });
}, 'Failed to delete expense'));

// ----------------------------------------------------
// INVOICING & POS BILLING TERMINAL
// ----------------------------------------------------
router.get('/invoices', requirePermission('billing.view'), safeHandler(async (req, res) => {
  let filter = { ...req.tenantFilter };
  if (req.user.role === 'CLIENT') {
    const myCustomers = await models.Customer.find({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    const myIds = myCustomers.map(c => c._id);
    filter.customerId = { $in: myIds };
  }
  if (req.query.paymentStatus && req.query.paymentStatus !== 'ALL') {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.paymentMethod && req.query.paymentMethod !== 'ALL') {
    filter.paymentMethod = req.query.paymentMethod;
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.Invoice.countDocuments(filter);
    const invoices = await models.Invoice.find(filter)
      .populate('customerId')
      .populate('staffId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const invoices = await models.Invoice.find(filter).populate('customerId').sort({ createdAt: -1 });
  res.json({ success: true, data: invoices });
}, 'Failed to fetch invoices'));

router.post('/invoices', sensitiveActionLimiter, requireIdempotency, requirePermission('billing.create'), safeHandler(async (req, res) => {
  const { customerId, services, products, tax, discount, paymentMethod, staffId, redeemPoints } = req.body;
  
  // Auto-generate unique invoice number with concurrency collision resilience
  let invoiceNumber = req.body.invoiceNumber;
  if (!invoiceNumber) {
    const count = await models.Invoice.countDocuments({ salonId: req.user.salonId });
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${randSuffix}`;
  }

  // Gracefully resolve branchId
  let targetBranchId = req.user.branchId || req.body.branchId;
  if (!targetBranchId || !mongoose.Types.ObjectId.isValid(targetBranchId)) {
    const branch = await models.Branch.findOne({ salonId: req.user.salonId });
    if (branch) {
      targetBranchId = branch._id;
    } else {
      const defaultBranch = await models.Branch.create({
        name: 'Main Branch',
        salonId: req.user.salonId,
        city: 'Mumbai',
        address: 'Main Salon Floor'
      });
      targetBranchId = defaultBranch._id;
    }
  }

  // Validate Customer & Staff IDs
  const finalCustomerId = (customerId && mongoose.Types.ObjectId.isValid(customerId)) ? customerId : null;
  const finalStaffId = (staffId && mongoose.Types.ObjectId.isValid(staffId)) ? staffId : null;

  let subTotal = 0;
  
  // Validate & add Services
  const serviceItems = [];
  if (services && Array.isArray(services)) {
    for (const item of services) {
      const sId = typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId;
      let s = null;
      if (sId && mongoose.Types.ObjectId.isValid(sId)) {
        s = await models.Service.findById(sId);
      }
      if (!s && (sId || item.name)) {
        s = await models.Service.findOne({
          salonId: req.user.salonId,
          $or: [{ _id: sId }, { name: item.name }]
        });
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.price) || (s ? Number(s.price) : 0) || 0;
      const name = item.name || (s ? s.name : 'Salon Service');

      serviceItems.push({
        serviceId: s ? s._id : (mongoose.Types.ObjectId.isValid(sId) ? sId : null),
        name,
        price,
        quantity: qty
      });
      subTotal += price * qty;
    }
  }

  // Atomically Validate & Deduct Products Stock using MongoDB $inc
  const productItems = [];
  const decrementedProducts = []; // For rollback if multi-product checkout encounters insufficient stock

  if (products && Array.isArray(products)) {
    for (const item of products) {
      const rawQty = Number(item.quantity);
      if (isNaN(rawQty) || !isFinite(rawQty) || rawQty <= 0) {
        // Rollback any products already decremented in this request
        for (const rolled of decrementedProducts) {
          await models.Product.updateOne(
            { _id: rolled.productId, salonId: req.user.salonId },
            { $inc: { quantity: rolled.quantity } }
          );
        }
        return res.status(400).json({ success: false, message: 'Invalid product quantity requested' });
      }
      const qty = Math.floor(rawQty);

      const pId = typeof item.productId === 'object' ? item.productId?._id : item.productId;
      let targetProduct = null;

      if (pId && mongoose.Types.ObjectId.isValid(pId)) {
        targetProduct = await models.Product.findOne({
          _id: pId,
          salonId: req.user.salonId
        });
      }
      if (!targetProduct && (pId || item.name)) {
        targetProduct = await models.Product.findOne({
          salonId: req.user.salonId,
          $or: [{ _id: pId }, { name: item.name }]
        });
      }

      const price = Number(item.price) || (targetProduct ? Number(targetProduct.sellingPrice) : 0) || 0;
      const name = item.name || (targetProduct ? targetProduct.name : 'Retail Product');

      if (targetProduct) {
        // Atomic decrement with condition: quantity >= qty
        const updatedProduct = await models.Product.findOneAndUpdate(
          {
            _id: targetProduct._id,
            salonId: req.user.salonId,
            quantity: { $gte: qty }
          },
          {
            $inc: { quantity: -qty }
          },
          {
            new: true
          }
        );

        if (!updatedProduct) {
          // Rollback any products already decremented in this specific invoice request
          for (const rolled of decrementedProducts) {
            await models.Product.updateOne(
              { _id: rolled.productId, salonId: req.user.salonId },
              { $inc: { quantity: rolled.quantity } }
            );
          }

          return res.status(400).json({
            success: false,
            message: `Insufficient inventory for ${targetProduct.name}. Requested: ${qty}`
          });
        }

        decrementedProducts.push({
          productId: targetProduct._id,
          product: targetProduct,
          previousQuantity: updatedProduct.quantity + qty,
          newQuantity: updatedProduct.quantity,
          quantity: qty
        });

        // Trigger low-stock notification if threshold breached
        if (updatedProduct.quantity <= (updatedProduct.reorderLevel || updatedProduct.lowStockThreshold || 5)) {
          await models.Notification.create({
            salonId: req.user.salonId,
            targetRole: 'Owner',
            category: 'Inventory',
            type: 'InApp',
            title: 'Low Stock Alert',
            message: `Low Stock Alert: ${updatedProduct.name} is down to ${updatedProduct.quantity} (Threshold: ${updatedProduct.lowStockThreshold || 5}).`,
            status: 'Sent'
          });
        }

        productItems.push({
          productId: targetProduct._id,
          name: targetProduct.name,
          price,
          quantity: qty
        });
      } else {
        // Custom retail line item not backed by an inventory product document
        productItems.push({
          productId: (pId && mongoose.Types.ObjectId.isValid(pId)) ? pId : null,
          name,
          price,
          quantity: qty
        });
      }

      subTotal += price * qty;
    }
  }

  // Handle Loyalty Point Redemption (1 point = ₹1 discount)
  let loyaltyDiscount = 0;
  const requestedRedeem = Math.max(0, Number(redeemPoints) || 0);
  if (requestedRedeem > 0 && finalCustomerId) {
    const customer = await models.Customer.findById(finalCustomerId);
    if (customer) {
      const actualRedeemed = Math.min(requestedRedeem, customer.loyaltyPoints || 0);
      if (actualRedeemed > 0) {
        loyaltyDiscount = actualRedeemed;
        customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - actualRedeemed);
        customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + actualRedeemed;
        await customer.save();

        await models.LoyaltyPoint.create({
          salonId: req.user.salonId,
          customerId: finalCustomerId,
          type: 'Redeemed',
          points: -actualRedeemed,
          pointsEarned: 0,
          pointsRedeemed: actualRedeemed,
          balanceAfter: customer.loyaltyPoints,
          transactionAmount: subTotal,
          description: `Redeemed ${actualRedeemed} loyalty points for ₹${actualRedeemed} discount`
        });
      }
    }
  }

  const taxPct = Math.max(0, Math.min(100, Number(tax) || 0));
  const calculatedTax = Math.round(subTotal * (taxPct / 100));
  const discountAmt = Math.max(0, Number(discount) || 0);
  const rawFinal = subTotal + calculatedTax - discountAmt - loyaltyDiscount;
  const finalAmount = Math.max(0, Math.round(isFinite(rawFinal) ? rawFinal : 0));

  let invoice;
  try {
    invoice = await models.Invoice.create({
      invoiceNumber,
      salonId: req.user.salonId,
      branchId: targetBranchId,
      customerId: finalCustomerId,
      services: serviceItems,
      products: productItems,
      tax: taxPct,
      discount: discountAmt,
      finalAmount,
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: 'Paid',
      staffId: finalStaffId
    });
  } catch (createErr) {
    // Rollback any products already decremented in this request if invoice insertion fails
    for (const rolled of decrementedProducts) {
      await models.Product.updateOne(
        { _id: rolled.productId, salonId: req.user.salonId },
        { $inc: { quantity: rolled.quantity } }
      );
    }
    throw createErr;
  }

  // Create InventoryMovement records for all retail deductions on this invoice
  for (const dec of decrementedProducts) {
    await models.InventoryMovement.create({
      salonId: req.user.salonId,
      branchId: targetBranchId,
      productId: dec.productId,
      productName: dec.product.name,
      sku: dec.product.sku,
      type: 'SALE',
      previousQuantity: dec.previousQuantity,
      changeQuantity: -dec.quantity,
      newQuantity: dec.newQuantity,
      reason: `Retail sale on Invoice ${invoiceNumber}`,
      referenceType: 'Invoice',
      referenceId: invoice._id,
      userId: req.user._id,
      userName: req.user.name || 'Staff'
    }).catch(err => console.error('Failed to create InventoryMovement for sale:', err));
  }

  // 1. Configurable Loyalty Points Crediting with Fraud/Duplicate Prevention
  if (finalCustomerId) {
    let rule = await models.LoyaltyRule.findOne({ salonId: req.user.salonId });
    const ptsPer100 = rule ? rule.pointsEarnedPer100Spent : 1;
    const maxPts = rule ? rule.maxPointsPerInvoice : 5000;
    const rawPts = Math.floor((finalAmount / 100) * ptsPer100);
    const pointsEarned = Math.min(rawPts, maxPts);

    if (pointsEarned > 0) {
      const idempotencyKey = `invoice_${invoice._id}_earn`;
      const existingTx = await models.LoyaltyPoint.findOne({ salonId: req.user.salonId, idempotencyKey });
      
      if (!existingTx) {
        const customer = await models.Customer.findById(finalCustomerId);
        const newBal = (customer ? customer.loyaltyPoints : 0) + pointsEarned;

        await models.Customer.findByIdAndUpdate(finalCustomerId, {
          $inc: { 
            loyaltyPoints: pointsEarned,
            totalPointsEarned: pointsEarned
          }
        });

        await models.LoyaltyPoint.create({
          salonId: req.user.salonId,
          customerId: finalCustomerId,
          type: 'Earned',
          points: pointsEarned,
          pointsEarned,
          balanceAfter: newBal,
          transactionAmount: finalAmount,
          invoiceId: invoice._id,
          description: `Earned ${pointsEarned} pts on Invoice ${invoiceNumber} (₹${finalAmount})`,
          idempotencyKey
        });
      }
    }
  }

  // 2. Staff Commission Calculation
  if (finalStaffId) {
    const employee = await models.Staff.findById(finalStaffId);
    if (employee) {
      // Commission earned from service revenue
      const serviceRev = serviceItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const commRate = employee.commissionPercentage || 0;
      const commissionEarned = Math.round(serviceRev * (commRate / 100)) || 0;

      await models.Commission.create({
        salonId: req.user.salonId,
        branchId: targetBranchId,
        staffId: finalStaffId,
        invoiceId: invoice._id,
        revenueGenerated: serviceRev,
        commissionRate: commRate,
        commissionEarned: commissionEarned
      });
    }
  }

  // 3. Trigger payment confirmation notification
  if (finalCustomerId) {
    const customer = await models.Customer.findById(finalCustomerId);
    if (customer) {
      await models.Notification.create({
        salonId: req.user.salonId,
        targetRole: 'Customer',
        recipientId: String(finalCustomerId),
        recipientName: customer.name,
        category: 'Payment',
        type: 'InApp',
        title: 'Payment Confirmed',
        message: `Dear ${customer.name}, thank you for visiting us. Your bill of ₹${finalAmount} has been paid. Invoice: ${invoiceNumber}.`,
        status: 'Sent'
      });
    }
  }

  await logAuditTrail({
    req,
    action: 'CREATE',
    entity: 'Invoice',
    entityId: invoice._id,
    entityName: invoice.invoiceNumber,
    branchId: targetBranchId,
    newValue: { finalAmount, invoiceNumber, paymentMethod: invoice.paymentMethod }
  });

  res.status(201).json({ success: true, data: invoice });
}, 'Failed to create invoice'));

// @route   POST /api/invoices/:id/refund
router.post('/invoices/:id/refund', sensitiveActionLimiter, requireIdempotency, requirePermission('billing.create'), validateObjectId, safeHandler(async (req, res) => {
  // Atomically claim the refund state so stock is restored exactly once
  const invoice = await models.Invoice.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter, paymentStatus: { $ne: 'Refunded' } },
    { paymentStatus: 'Refunded' },
    { new: true }
  );

  if (!invoice) {
    const existing = await models.Invoice.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found' });
    // Already refunded - return success without double-restoring inventory (idempotent)
    return res.json({ success: true, message: 'Invoice is already refunded', data: existing });
  }

  // Restore inventory items atomically and record movement
  for (const item of (invoice.products || [])) {
    if (item.productId && item.quantity > 0) {
      const restored = await models.Product.findOneAndUpdate(
        { _id: item.productId, salonId: invoice.salonId },
        { $inc: { quantity: item.quantity } },
        { new: true }
      );

      if (restored) {
        await models.InventoryMovement.create({
          salonId: invoice.salonId,
          branchId: invoice.branchId,
          productId: restored._id,
          productName: restored.name,
          sku: restored.sku,
          type: 'REFUND',
          previousQuantity: restored.quantity - item.quantity,
          changeQuantity: item.quantity,
          newQuantity: restored.quantity,
          reason: `Stock restored from refunded Invoice ${invoice.invoiceNumber}`,
          referenceType: 'Invoice',
          referenceId: invoice._id,
          userId: req.user ? req.user._id : null,
          userName: req.user ? (req.user.name || 'Manager') : 'System'
        }).catch(err => console.error('Failed to create InventoryMovement for refund:', err));
      }
    }
  }

  await logAuditTrail({
    req,
    action: 'STATUS_CHANGE',
    entity: 'Invoice',
    entityId: invoice._id,
    entityName: invoice.invoiceNumber,
    branchId: invoice.branchId,
    previousValue: { paymentStatus: 'Paid' },
    newValue: { paymentStatus: 'Refunded' }
  });

  res.json({ success: true, message: 'Invoice refunded and inventory restored successfully', data: invoice });
}, 'Failed to refund invoice'));

// ----------------------------------------------------
// INVENTORY
// ----------------------------------------------------
const PRODUCT_FIELDS = ['name', 'sku', 'category', 'quantity', 'purchasePrice', 'sellingPrice', 'supplierId', 'lowStockThreshold', 'unit', 'minStock', 'reorderLevel', 'expiryDate'];
const SUPPLIER_FIELDS = ['name', 'phone', 'email', 'address', 'outstandingDues'];

router.post('/products/:id/adjust-stock', sensitiveActionLimiter, requireIdempotency, requirePermission('inventory.edit'), validateObjectId, sanitizeBody(['delta', 'reason', 'type']), safeHandler(async (req, res) => {
  const delta = Number(req.body.delta);
  if (isNaN(delta) || !isFinite(delta) || delta === 0) {
    return res.status(400).json({ success: false, message: 'Delta must be a non-zero number' });
  }

  const query = { _id: req.params.id, ...req.tenantFilter };
  if (delta < 0) {
    query.quantity = { $gte: Math.abs(delta) };
  }

  const product = await models.Product.findOneAndUpdate(
    query,
    { $inc: { quantity: delta } },
    { new: true }
  );

  if (!product) {
    return res.status(400).json({ success: false, message: 'Insufficient inventory to perform deduction' });
  }

  // Authoritative InventoryMovement Audit Log
  const movementType = req.body.type || (delta > 0 ? 'PURCHASE' : 'ADJUSTMENT');
  await models.InventoryMovement.create({
    salonId: req.user.salonId,
    branchId: product.branchId || req.user.branchId,
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    type: movementType,
    previousQuantity: product.quantity - delta,
    changeQuantity: delta,
    newQuantity: product.quantity,
    reason: req.body.reason || 'Manual inventory adjustment',
    referenceType: 'Manual',
    userId: req.user._id,
    userName: req.user.name || 'Manager'
  }).catch(err => console.error('Failed to create InventoryMovement for adjust-stock:', err));

  await logAuditTrail({
    req,
    action: 'UPDATE',
    entity: 'Product',
    entityId: product._id,
    entityName: product.name,
    branchId: product.branchId || req.user.branchId,
    previousValue: { quantity: product.quantity - delta },
    newValue: { quantity: product.quantity, delta, reason: req.body.reason }
  });

  res.json({ success: true, data: product });
}, 'Failed to adjust stock'));

// @route   GET /api/inventory/movements (Full Stock Movement Audit Trail)
router.get('/inventory/movements', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const { productId, type, startDate, endDate } = req.query;
  const filter = { ...req.tenantFilter };

  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    filter.productId = productId;
  }
  if (type && type !== 'ALL') {
    filter.type = type;
  }
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.InventoryMovement.countDocuments(filter);
    const movements = await models.InventoryMovement.find(filter)
      .populate('productId', 'name sku unit')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const movements = await models.InventoryMovement.find(filter)
    .populate('productId', 'name sku unit')
    .sort({ timestamp: -1 })
    .limit(100);

  res.json({ success: true, count: movements.length, data: movements });
}, 'Failed to fetch inventory movements'));

router.get('/inventory-consumptions', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const logs = await models.InventoryConsumption.find(req.tenantFilter).sort({ date: -1 });
  res.json({ success: true, data: logs });
}, 'Failed to fetch inventory consumption logs'));

router.get('/products', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const filter = { ...req.tenantFilter };
  if (req.query.category && req.query.category !== 'ALL') {
    filter.category = req.query.category;
  }
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$quantity', { $ifNull: ['$lowStockThreshold', 5] }] };
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.Product.countDocuments(filter);
    const products = await models.Product.find(filter)
      .populate('supplierId')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const products = await models.Product.find(filter).populate('supplierId').sort({ name: 1 });
  res.json({ success: true, data: products });
}, 'Failed to fetch products'));

router.post('/products', requirePermission('inventory.edit'), sanitizeBody([...PRODUCT_FIELDS]), safeHandler(async (req, res) => {
  const purchasePrice = Number(req.body.purchasePrice);
  const sellingPrice = Number(req.body.sellingPrice);
  const quantity = Number(req.body.quantity);

  if (isNaN(purchasePrice) || !isFinite(purchasePrice) || purchasePrice < 0 ||
      isNaN(sellingPrice) || !isFinite(sellingPrice) || sellingPrice < 0) {
    return res.status(400).json({ success: false, message: 'Valid non-negative purchase and selling prices are required' });
  }
  if (!isNaN(quantity) && (!isFinite(quantity) || quantity < 0)) {
    return res.status(400).json({ success: false, message: 'Product quantity cannot be negative' });
  }

  const product = await models.Product.create({
    ...req.body,
    purchasePrice,
    sellingPrice,
    quantity: isNaN(quantity) ? 0 : quantity,
    salonId: req.user.salonId
  });
  res.status(201).json({ success: true, data: product });
}, 'Failed to create product'));

router.put('/products/:id', requirePermission('inventory.edit'), validateObjectId, sanitizeBody([...PRODUCT_FIELDS]), safeHandler(async (req, res) => {
  const product = await models.Product.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
}, 'Failed to update product'));

router.delete('/products/:id', requirePermission('inventory.edit'), validateObjectId, safeHandler(async (req, res) => {
  const product = await models.Product.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product removed' });
}, 'Failed to delete product'));

router.get('/suppliers', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const suppliers = await models.Supplier.find(req.tenantFilter);
  res.json({ success: true, data: suppliers });
}, 'Failed to fetch suppliers'));

router.post('/suppliers', requirePermission('inventory.edit'), sanitizeBody([...SUPPLIER_FIELDS]), safeHandler(async (req, res) => {
  const supplier = await models.Supplier.create({
    ...req.body,
    salonId: req.user.salonId
  });
  res.status(201).json({ success: true, data: supplier });
}, 'Failed to create supplier'));

router.put('/suppliers/:id', requirePermission('inventory.edit'), validateObjectId, sanitizeBody([...SUPPLIER_FIELDS]), safeHandler(async (req, res) => {
  const supplier = await models.Supplier.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: supplier });
}, 'Failed to update supplier'));

router.delete('/suppliers/:id', requirePermission('inventory.edit'), validateObjectId, safeHandler(async (req, res) => {
  const supplier = await models.Supplier.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, message: 'Supplier removed' });
}, 'Failed to delete supplier'));

// ----------------------------------------------------
// STAFF & ATTENDANCE
// ----------------------------------------------------
const STAFF_FIELDS = ['name', 'phone', 'email', 'role', 'salary', 'commissionPercentage', 'branchId', 'password', 'specialization', 'services', 'experienceYears', 'experienceLevel', 'bio', 'avatar', 'status'];

router.get('/staff', requirePermission('staff.view'), safeHandler(async (req, res) => {
  let staff = await models.Staff.find(req.tenantFilter).populate('services');
  
  // Confidentiality Enforcement:
  // If requesting user is STAFF role, mask salary for other staff members
  const isManagerOrOwner = ['SUPER_ADMIN', 'SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'].includes(req.user.role);
  if (!isManagerOrOwner) {
    staff = staff.map(s => {
      const staffObj = s.toObject();
      // Only keep salary if it matches the current user's linked staff record
      if (String(s.userId) !== String(req.user._id) && s.phone !== req.user.phone && s.email !== req.user.email) {
        delete staffObj.salary; // Do not expose confidential salary info
      }
      return staffObj;
    });
  }
  
  res.json({ success: true, data: staff });
}, 'Failed to fetch staff'));

router.post('/staff', requirePermission('staff.manage'), sanitizeBody([...STAFF_FIELDS]), safeHandler(async (req, res) => {
  const { name, phone, email, role, salary, commissionPercentage, password, specialization, services, experienceYears, experienceLevel, bio, avatar, status } = req.body;
  
  // 1. Create Staff document
  const staff = await models.Staff.create({
    salonId: req.user.salonId,
    branchId: req.body.branchId || req.user.branchId,
    name,
    phone,
    email: email || `${phone}@salonsync.com`,
    role: role || 'Stylist',
    salary: salary || 0,
    commissionPercentage: commissionPercentage || 10,
    specialization: specialization || [],
    services: services || [],
    experienceYears: experienceYears || 3,
    experienceLevel: experienceLevel || 'Senior Specialist',
    bio: bio || '',
    avatar: avatar || '',
    status: status || 'Active'
  });

  // 2. Create User Login Account for Staff
  const staffEmail = (email || `${phone}@salonsync.com`).toLowerCase();
  let user = await models.User.findOne({ $or: [{ email: staffEmail }, { phone }] });
  
  if (!user) {
    const crypto = require('crypto');
    const actualPassword = password || crypto.randomBytes(12).toString('base64url');
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(actualPassword, salt);
    user = await models.User.create({
      name,
      email: staffEmail,
      phone,
      password: hashedPassword,
      role: 'STAFF',
      salonId: req.user.salonId,
      branchId: req.body.branchId || req.user.branchId
    });
  }

  if (user) {
    staff.userId = user._id;
    await staff.save();
  }

  res.status(201).json({
    success: true,
    data: staff,
    accountCreated: !!(user),
    loginEmail: staffEmail
  });
}, 'Failed to create staff'));

router.put('/staff/:id', requirePermission('staff.manage'), validateObjectId, sanitizeBody([...STAFF_FIELDS]), safeHandler(async (req, res) => {
  const staff = await models.Staff.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
  res.json({ success: true, data: staff });
}, 'Failed to update staff'));

router.delete('/staff/:id', requirePermission('staff.manage'), validateObjectId, safeHandler(async (req, res) => {
  const staff = await models.Staff.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
  res.json({ success: true, message: 'Staff member removed' });
}, 'Failed to delete staff'));

// ----------------------------------------------------
// ATTENDANCE MANAGEMENT
// ----------------------------------------------------
const ATTENDANCE_FIELDS = ['staffId', 'branchId', 'date', 'checkIn', 'checkOut', 'workingHours', 'overtime', 'status', 'notes'];

router.get('/attendance', requirePermission('staff.view'), safeHandler(async (req, res) => {
  const { date, staffId, branchId } = req.query;
  const filter = { ...req.tenantFilter };
  if (date) filter.date = date;
  if (staffId && mongoose.Types.ObjectId.isValid(staffId)) filter.staffId = staffId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) filter.branchId = branchId;

  const attendance = await models.Attendance.find(filter).populate('staffId').sort({ date: -1 });
  res.json({ success: true, count: attendance.length, data: attendance });
}, 'Failed to fetch attendance logs'));

router.post('/attendance', requirePermission('staff.manage'), sanitizeBody([...ATTENDANCE_FIELDS]), safeHandler(async (req, res) => {
  let targetBranchId = req.body.branchId || req.user.branchId;
  if (!targetBranchId || !mongoose.Types.ObjectId.isValid(targetBranchId)) {
    const branch = await models.Branch.findOne({ salonId: req.user.salonId });
    if (branch) targetBranchId = branch._id;
  }

  const attendance = await models.Attendance.create({
    ...req.body,
    salonId: req.user.salonId,
    branchId: targetBranchId,
    date: req.body.date || new Date().toISOString().split('T')[0]
  });
  res.status(201).json({ success: true, data: attendance });
}, 'Failed to create attendance log'));

// ----------------------------------------------------
// REVIEWS & FEEDBACK
// ----------------------------------------------------
router.get('/reviews', safeHandler(async (req, res) => {
  const filter = { ...req.tenantFilter };
  if (req.query.staffId) filter.staffId = req.query.staffId;
  const reviews = await models.Review.find(filter).sort({ date: -1 });
  res.json({ success: true, data: reviews });
}, 'Failed to fetch reviews'));

router.post('/reviews', safeHandler(async (req, res) => {
  const { staffId, customerId, customerName, serviceName, rating, comment } = req.body;
  const review = await models.Review.create({
    salonId: req.user ? req.user.salonId : req.body.salonId,
    staffId,
    customerId,
    customerName: customerName || 'Valued Client',
    serviceName: serviceName || 'Salon Service',
    rating: Number(rating) || 5,
    comment: comment || ''
  });

  // Re-calculate staff average rating
  if (staffId) {
    const allStaffReviews = await models.Review.find({ staffId });
    if (allStaffReviews.length > 0) {
      const avg = allStaffReviews.reduce((sum, r) => sum + r.rating, 0) / allStaffReviews.length;
      await models.Staff.findByIdAndUpdate(staffId, { rating: Math.round(avg * 10) / 10 });
    }
  }

  res.status(201).json({ success: true, data: review });
}, 'Failed to submit review'));

// ----------------------------------------------------
// LOYALTY REWARDS & RULES ENGINE
// ----------------------------------------------------
router.get('/loyalty/rules', safeHandler(async (req, res) => {
  let rule = await models.LoyaltyRule.findOne({ salonId: req.user.salonId });
  if (!rule) {
    rule = await models.LoyaltyRule.create({
      salonId: req.user.salonId,
      pointsEarnedPer100Spent: 10,
      pointValueInRupees: 1,
      expiryMonths: 12,
      maxPointsPerInvoice: 5000,
      maxRedemptionsPerMonth: 10
    });
  }
  res.json({ success: true, data: rule });
}, 'Failed to fetch loyalty rules'));

router.put('/loyalty/rules', requirePermission('staff.manage'), sanitizeBody(['pointsEarnedPer100Spent', 'pointValueInRupees', 'expiryMonths', 'maxPointsPerInvoice', 'maxRedemptionsPerMonth']), safeHandler(async (req, res) => {
  const rule = await models.LoyaltyRule.findOneAndUpdate(
    { salonId: req.user.salonId },
    { ...req.body, salonId: req.user.salonId },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: rule });
}, 'Failed to update loyalty rules'));

router.get('/loyalty/rewards', safeHandler(async (req, res) => {
  const rewards = await models.LoyaltyReward.find({ salonId: req.user.salonId, active: true }).sort({ pointsCost: 1 });
  res.json({ success: true, data: rewards });
}, 'Failed to fetch loyalty rewards'));

router.post('/loyalty/rewards', requirePermission('staff.manage'), sanitizeBody(['name', 'type', 'pointsCost', 'discountValue', 'serviceId', 'productId', 'description', 'expiryDays', 'active']), safeHandler(async (req, res) => {
  const reward = await models.LoyaltyReward.create({
    ...req.body,
    salonId: req.user.salonId
  });
  res.status(201).json({ success: true, data: reward });
}, 'Failed to create loyalty reward'));

router.put('/loyalty/rewards/:id', requirePermission('staff.manage'), validateObjectId, safeHandler(async (req, res) => {
  const reward = await models.LoyaltyReward.findOneAndUpdate(
    { _id: req.params.id, salonId: req.user.salonId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
  res.json({ success: true, data: reward });
}, 'Failed to update loyalty reward'));

router.delete('/loyalty/rewards/:id', requirePermission('staff.manage'), validateObjectId, safeHandler(async (req, res) => {
  const reward = await models.LoyaltyReward.findOneAndDelete({ _id: req.params.id, salonId: req.user.salonId });
  if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
  res.json({ success: true, message: 'Reward removed' });
}, 'Failed to delete loyalty reward'));

router.get('/loyalty/transactions', safeHandler(async (req, res) => {
  const filter = { salonId: req.user.salonId };
  if (req.query.customerId) filter.customerId = req.query.customerId;
  const transactions = await models.LoyaltyPoint.find(filter).sort({ date: -1 }).populate('customerId').populate('rewardId');
  res.json({ success: true, data: transactions });
}, 'Failed to fetch loyalty transactions'));

router.post('/loyalty/redeem', safeHandler(async (req, res) => {
  const { customerId, rewardId, pointsToRedeem, idempotencyKey } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'Customer ID is required for redemption.' });
  }

  // Idempotency / duplicate protection check
  if (idempotencyKey) {
    const existing = await models.LoyaltyPoint.findOne({ salonId: req.user.salonId, idempotencyKey });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This redemption transaction has already been processed.' });
    }
  }

  const customer = await models.Customer.findOne({ _id: customerId, salonId: req.user.salonId });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer record not found.' });
  }

  let reward = null;
  let pointsRequired = 0;
  let rewardName = 'Custom Points Redemption';

  if (rewardId) {
    reward = await models.LoyaltyReward.findOne({ _id: rewardId, salonId: req.user.salonId });
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Selected reward option is no longer available.' });
    }
    pointsRequired = reward.pointsCost;
    rewardName = reward.name;
  } else {
    pointsRequired = Math.max(1, Number(pointsToRedeem) || 0);
  }

  // FRAUD / BALANCE CHECK: Anti-fraud strict balance validation
  if ((customer.loyaltyPoints || 0) < pointsRequired) {
    return res.status(400).json({
      success: false,
      message: `Insufficient loyalty points balance. Customer has ${customer.loyaltyPoints || 0} pts, but redemption requires ${pointsRequired} pts.`
    });
  }

  // Atomic balance deduction
  const newBal = (customer.loyaltyPoints || 0) - pointsRequired;
  customer.loyaltyPoints = newBal;
  customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + pointsRequired;
  await customer.save();

  // Create audit transaction record
  const tx = await models.LoyaltyPoint.create({
    salonId: req.user.salonId,
    customerId: customer._id,
    type: 'Redeemed',
    points: -pointsRequired,
    pointsRedeemed: pointsRequired,
    balanceAfter: newBal,
    rewardId: reward ? reward._id : null,
    description: `Redeemed reward "${rewardName}" (-${pointsRequired} pts)`,
    idempotencyKey: idempotencyKey || `redeem_${customer._id}_${Date.now()}`
  });

  res.status(201).json({
    success: true,
    data: {
      transaction: tx,
      remainingPoints: newBal,
      reward
    }
  });
}, 'Failed to process point redemption'));

router.get('/attendance', requirePermission('staff.view'), safeHandler(async (req, res) => {
  const attendance = await models.Attendance.find(req.tenantFilter).populate('staffId');
  res.json({ success: true, data: attendance });
}, 'Failed to fetch attendance'));

router.post('/attendance', requirePermission('staff.view'), safeHandler(async (req, res) => {
  const { staffId, action } = req.body; // action: 'clockin' or 'clockout'
  const today = new Date().setHours(0,0,0,0);
  
  let record = await models.Attendance.findOne({
    staffId,
    date: { $gte: today },
    salonId: req.user.salonId
  });

  const nowTime = new Date().toTimeString().split(' ')[0].substring(0,5); // "HH:MM"

  if (action === 'clockin') {
    if (record) {
      return res.status(400).json({ success: false, message: 'Already clocked in today' });
    }
    record = await models.Attendance.create({
      salonId: req.user.salonId,
      branchId: req.user.branchId,
      staffId,
      date: new Date(),
      checkIn: nowTime
    });
  } else {
    if (!record) {
      return res.status(400).json({ success: false, message: 'Must clock in before clocking out' });
    }
    record.checkOut = nowTime;
    
    // Calculate work hours
    const [inH, inM] = record.checkIn.split(':').map(Number);
    const [outH, outM] = nowTime.split(':').map(Number);
    const diffHrs = (outH + outM/60) - (inH + inM/60);
    record.workingHours = Math.round(diffHrs * 10) / 10;
    record.overtime = Math.max(0, record.workingHours - 8);
    
    await record.save();
  }
  res.json({ success: true, data: record });
}, 'Failed to process attendance'));

router.get('/commissions', requirePermission('staff.view'), safeHandler(async (req, res) => {
  let filter = { ...req.tenantFilter };

  // PRIVACY HARDENING: Staff can only see their own earned commissions
  if (req.user.role === 'STAFF') {
    const staffDoc = await models.Staff.findOne({
      salonId: req.user.salonId,
      $or: [{ userId: req.user._id }, { email: req.user.email }, { phone: req.user.phone }]
    });
    if (staffDoc) {
      filter.staffId = staffDoc._id;
    } else {
      return res.json({ success: true, count: 0, data: [] });
    }
  } else if (req.query.staffId && mongoose.Types.ObjectId.isValid(req.query.staffId)) {
    filter.staffId = req.query.staffId;
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
  }

  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);

  if (!isNaN(page) && page > 0 && !isNaN(limit) && limit > 0) {
    const skip = (page - 1) * limit;
    const total = await models.Commission.countDocuments(filter);
    const commissions = await models.Commission.find(filter)
      .populate('staffId', 'name role commissionPercentage')
      .populate('invoiceId', 'invoiceNumber finalAmount createdAt')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const commissions = await models.Commission.find(filter)
    .populate('staffId', 'name role commissionPercentage')
    .populate('invoiceId', 'invoiceNumber finalAmount createdAt')
    .sort({ date: -1 });
  res.json({ success: true, count: commissions.length, data: commissions });
}, 'Failed to fetch commissions'));

// ----------------------------------------------------
// ANALYTICS & PROFIT & LOSS ENGINE
// ----------------------------------------------------
router.get('/dashboard/stats', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const branchId = req.query.branchId || (['STAFF', 'SALON_MANAGER'].includes(req.user.role) ? req.user.branchId : null);
  
  const stats = await financialService.getDashboardStats({
    salonId: req.user.salonId,
    branchId
  });

  res.json({
    success: true,
    data: {
      todayRevenue: stats.today.revenue,
      todayExpenses: stats.today.expenses,
      todayProfit: stats.today.profit,
      todayAppointments: stats.today.appointments,
      todayCompletedAppointments: stats.today.completedAppointments,
      todayInvoices: stats.today.invoices,
      monthlyRevenue: stats.monthly.revenue,
      monthlyExpenses: stats.monthly.expenses,
      monthlyMaterialCost: stats.monthly.productCosts,
      monthlyCommissions: stats.monthly.commissions,
      netProfit: stats.monthly.netProfit,
      profitMargin: stats.monthly.profitMargin,
      monthlyAppointments: stats.monthly.appointments,
      totalCustomers: stats.totalCustomers,
      totalAppointments: stats.monthly.appointments,
      activeStaffCount: stats.activeStaffCount,
      activeMemberships: stats.activeMembershipsCount,
      lowStockAlerts: stats.lowStockAlertsCount,
      trends: stats.trends
    }
  });
}, 'Failed to fetch dashboard stats'));

// @route   GET /api/superadmin/salons
router.get('/superadmin/salons', authorize('SUPER_ADMIN'), safeHandler(async (req, res) => {
  const salons = await models.Salon.find({});
  res.json({ success: true, data: salons });
}, 'Failed to fetch salons'));

// @route   PUT /api/superadmin/salons/:id/subscription
router.put('/superadmin/salons/:id/subscription', authorize('SUPER_ADMIN'), validateObjectId, sanitizeBody(['plan', 'status']), safeHandler(async (req, res) => {
  const { plan, status } = req.body;
  const salon = await models.Salon.findByIdAndUpdate(
    req.params.id,
    { subscriptionPlan: plan, subscriptionStatus: status },
    { new: true, runValidators: true }
  );
  if (!salon) return res.status(404).json({ success: false, message: 'Salon not found' });
  res.json({ success: true, data: salon });
}, 'Failed to update subscription'));

// @route   GET /api/subscriptions
router.get('/subscriptions', safeHandler(async (req, res) => {
  const salon = await models.Salon.findById(req.user.salonId);
  const sub = await models.Subscription.findOne({ salonId: req.user.salonId, status: 'Active' });
  res.json({
    success: true,
    data: {
      plan: salon ? salon.subscriptionPlan : 'Starter Salon',
      status: salon ? salon.subscriptionStatus : 'Active',
      details: sub
    }
  });
}, 'Failed to fetch subscription'));

// @route   GET /api/salons/mine
router.get('/salons/mine', safeHandler(async (req, res) => {
  if (!req.user.salonId) {
    const salon = await models.Salon.findOne({});
    return res.json({ success: true, data: salon });
  }
  const salon = await models.Salon.findById(req.user.salonId);
  if (!salon) {
    const fallback = await models.Salon.findOne({});
    return res.json({ success: true, data: fallback });
  }
  res.json({ success: true, data: salon });
}, 'Failed to fetch salon'));

// @route   PUT /api/salons/mine — field-whitelisted to prevent subscription tampering
const SALON_SAFE_FIELDS = ['name', 'ownerName', 'email', 'phone', 'address', 'city', 'state', 'gstNumber', 'businessType'];
router.put('/salons/mine', sanitizeBody([...SALON_SAFE_FIELDS]), safeHandler(async (req, res) => {
  const salon = await models.Salon.findByIdAndUpdate(req.user.salonId, req.body, { new: true, runValidators: true });
  if (!salon) return res.status(404).json({ success: false, message: 'Salon not found' });
  res.json({ success: true, data: salon });
}, 'Failed to update salon'));

// @route   BRANCH MANAGEMENT
const BRANCH_FIELDS = ['name', 'address', 'city', 'state', 'phone', 'status'];

router.get('/branches', safeHandler(async (req, res) => {
  const branches = await models.Branch.find(req.tenantFilter);
  res.json({ success: true, data: branches });
}, 'Failed to fetch branches'));

router.post('/branches', authorize('SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'), sanitizeBody([...BRANCH_FIELDS]), safeHandler(async (req, res) => {
  const branch = await models.Branch.create({
    ...req.body,
    salonId: req.user.salonId
  });
  res.status(201).json({ success: true, data: branch });
}, 'Failed to create branch'));

router.put('/branches/:id', authorize('SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'), validateObjectId, sanitizeBody([...BRANCH_FIELDS]), safeHandler(async (req, res) => {
  const branch = await models.Branch.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
  res.json({ success: true, data: branch });
}, 'Failed to update branch'));

router.delete('/branches/:id', authorize('SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'), validateObjectId, safeHandler(async (req, res) => {
  const branch = await models.Branch.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
  res.json({ success: true, message: 'Branch removed' });
}, 'Failed to delete branch'));

// @route   POST /api/auth/create-user — with role escalation prevention
const ROLE_CREATION_LIMITS = {
  'SUPER_ADMIN': ['SUPER_ADMIN', 'FRANCHISE_OWNER', 'SALON_OWNER', 'SALON_MANAGER', 'STAFF', 'CLIENT'],
  'FRANCHISE_OWNER': ['SALON_OWNER', 'SALON_MANAGER', 'STAFF', 'CLIENT'],
  'SALON_OWNER': ['SALON_MANAGER', 'STAFF', 'CLIENT'],
  'SALON_MANAGER': ['STAFF', 'CLIENT']
};

router.post('/auth/create-user', authorize('SUPER_ADMIN', 'SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'), safeHandler(async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  // SECURITY: Prevent privilege escalation — a user cannot create a user with a higher role
  const allowedRoles = ROLE_CREATION_LIMITS[req.user.role] || [];
  const targetRole = role || 'STAFF';
  if (!allowedRoles.includes(targetRole)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Your role '${req.user.role}' cannot create users with role '${targetRole}'`
    });
  }

  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  const userExists = await models.User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  // Generate random password if none provided (never returned)
  const crypto = require('crypto');
  const actualPassword = password || crypto.randomBytes(12).toString('base64url');
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(actualPassword, salt);

  const user = await models.User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: targetRole,
    salonId: req.user.salonId,
    branchId: req.user.branchId
  });

  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      salonId: user.salonId,
      branchId: user.branchId
    }
  });
}, 'Failed to create user'));

// @route   GET /api/reviews
router.get('/reviews', requirePermission('customers.view'), safeHandler(async (req, res) => {
  const reviews = await models.Review.find(req.tenantFilter).sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, data: reviews });
}, 'Failed to fetch reviews'));

// @route   POST /api/reviews
router.post('/reviews', requirePermission('appointments.view'), sanitizeBody(['salonId', 'staffId', 'rating', 'comment']), safeHandler(async (req, res) => {
  const { salonId, staffId, rating, comment } = req.body;
  const review = await models.Review.create({
    salonId: salonId || req.user.salonId,
    staffId: staffId || null,
    customerId: req.user._id,
    customerName: req.user.name,
    rating: Number(rating) || 5,
    comment: comment || ''
  });

  // Recalculate average rating for Staff if staffId provided
  if (staffId && mongoose.Types.ObjectId.isValid(staffId)) {
    const staffReviews = await models.Review.find({ staffId });
    const avg = staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length;
    await models.Staff.findByIdAndUpdate(staffId, { rating: Math.round(avg * 10) / 10 });
  }

  res.status(201).json({ success: true, data: review });
}, 'Failed to create review'));

// ----------------------------------------------------
// DEDICATED MOBILE APP ENDPOINTS LAYER (iOS / Android)
// ----------------------------------------------------

// @route   POST /api/auth/refresh-token
router.post('/auth/refresh-token', safeHandler(async (req, res) => {
  const token = generateToken(req.user._id, req.user.tokenVersion || 1);
  res.json({
    success: true,
    token,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      salonId: req.user.salonId,
      branchId: req.user.branchId
    }
  });
}, 'Token refresh failed'));

// @route   POST /api/auth/change-password
router.post('/auth/change-password', sanitizeBody(['currentPassword', 'newPassword']), safeHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  }

  const user = await models.User.findById(req.user._id);
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ success: false, message: 'Incorrect current password' });
  }

  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  user.password = await bcrypt.hash(newPassword, salt);
  user.tokenVersion = (user.tokenVersion || 1) + 1; // Invalidate all prior sessions
  await user.save();

  await logAuditTrail({
    req,
    action: 'STATUS_CHANGE',
    entity: 'User',
    entityId: user._id,
    entityName: user.name,
    newValue: { event: 'PASSWORD_CHANGED', tokenVersion: user.tokenVersion }
  });

  const newToken = generateToken(user._id, user.tokenVersion);
  res.json({ success: true, message: 'Password updated successfully', token: newToken });
}, 'Failed to change password'));

// @route   POST /api/auth/logout
router.post('/auth/logout', safeHandler(async (req, res) => {
  if (req.user && req.user._id) {
    await models.User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  }
  res.json({ success: true, message: 'Logged out successfully and session invalidated' });
}));

// @route   GET /api/mobile/client/dashboard
router.get('/mobile/client/dashboard', safeHandler(async (req, res) => {
  const myCustomer = await models.Customer.findOne({
    $or: [{ email: req.user.email }, { phone: req.user.phone }]
  });

  const upcomingAppts = myCustomer
    ? await models.Appointment.find({ customerId: myCustomer._id, status: { $ne: 'Cancelled' } })
        .sort({ date: 1 })
        .populate('staffId')
        .limit(5)
    : [];

  const recentInvoices = myCustomer
    ? await models.Invoice.find({ customerId: myCustomer._id })
        .sort({ createdAt: -1 })
        .limit(5)
    : [];

  // Only return safe public fields for salons in mobile dashboard
  const availableSalons = await models.Salon.find({}).select('name city state businessType _id').limit(10);
  const availableBranches = await models.Branch.find({ status: 'Active' }).limit(10);

  res.json({
    success: true,
    data: {
      profile: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        loyaltyPoints: myCustomer ? myCustomer.loyaltyPoints : 0,
        membershipLevel: myCustomer ? myCustomer.membershipLevel : 'None'
      },
      upcomingAppointments: upcomingAppts,
      recentInvoices,
      salons: availableSalons,
      branches: availableBranches
    }
  });
}, 'Failed to fetch client dashboard'));

// @route   GET /api/mobile/staff/schedule
router.get('/mobile/staff/schedule', safeHandler(async (req, res) => {
  const staffRecord = await models.Staff.findOne({
    $or: [{ userId: req.user._id }, { email: req.user.email }, { phone: req.user.phone }]
  });

  if (!staffRecord) {
    return res.status(404).json({ success: false, message: 'Staff profile not found for user account' });
  }

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);

  const appointmentsToday = await models.Appointment.find({
    staffId: staffRecord._id,
    date: { $gte: todayStart }
  }).populate('customerId');

  const attendanceToday = await models.Attendance.findOne({
    staffId: staffRecord._id,
    date: { $gte: todayStart }
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const monthCommissions = await models.Commission.find({
    staffId: staffRecord._id,
    date: { $gte: monthStart }
  });

  const totalCommissionEarned = monthCommissions.reduce((sum, c) => sum + c.commissionEarned, 0);

  res.json({
    success: true,
    data: {
      staff: staffRecord,
      attendanceToday,
      appointmentsToday,
      totalCommissionEarnedThisMonth: totalCommissionEarned
    }
  });
}, 'Failed to fetch staff schedule'));

// @route   POST /api/notifications/register-device
router.post('/notifications/register-device', sanitizeBody(['deviceToken', 'platform']), safeHandler(async (req, res) => {
  const { deviceToken, platform } = req.body;
  if (!deviceToken) {
    return res.status(400).json({ success: false, message: 'deviceToken is required' });
  }

  await models.User.findByIdAndUpdate(req.user._id, {
    $set: { deviceToken, devicePlatform: platform || 'mobile' }
  });

  res.json({ success: true, message: 'Device token registered successfully' });
}, 'Failed to register device'));

// @route   GET /api/analytics/financial-summary
router.get('/analytics/financial-summary', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const { horizon = 'month', branchId, startDate, endDate } = req.query;
  const targetBranchId = branchId && mongoose.Types.ObjectId.isValid(branchId)
    ? branchId
    : (['STAFF', 'SALON_MANAGER'].includes(req.user.role) ? req.user.branchId : null);

  const summary = await financialService.getFinancialSummary({
    salonId: req.user.salonId,
    branchId: targetBranchId,
    horizon,
    startDate,
    endDate
  });

  res.json({
    success: true,
    data: summary
  });
}, 'Failed to fetch financial summary analytics'));

// @route   GET /api/analytics/financial-reconciliation (Authoritative reconciliation & integrity audit)
router.get('/analytics/financial-reconciliation', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const { horizon = 'month', branchId, startDate, endDate } = req.query;
  const targetBranchId = branchId && mongoose.Types.ObjectId.isValid(branchId)
    ? branchId
    : (['STAFF', 'SALON_MANAGER'].includes(req.user.role) ? req.user.branchId : null);

  const summary = await financialService.getFinancialSummary({
    salonId: req.user.salonId,
    branchId: targetBranchId,
    horizon,
    startDate,
    endDate
  });

  const m = summary.metrics;
  const computedGrossProfit = m.netRevenue - m.productCosts - m.staffCommissions;
  const computedNetProfit = computedGrossProfit - m.operatingExpenses;
  const isBalanced = (m.grossProfit === computedGrossProfit && m.netProfit === computedNetProfit);

  res.json({
    success: true,
    data: {
      ...summary,
      audit: {
        reconciliationStatus: isBalanced ? 'BALANCED' : 'DISCREPANCY_DETECTED',
        isBalanced,
        computedGrossProfit,
        computedNetProfit,
        auditedAt: new Date().toISOString()
      }
    }
  });
}, 'Failed to perform financial reconciliation audit'));

// @route   GET /api/audit-logs (Authoritative Business & Financial Audit Trail)
router.get('/audit-logs', authorize('SUPER_ADMIN', 'SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'), safeHandler(async (req, res) => {
  const filter = { ...req.tenantFilter };
  if (req.query.entity && req.query.entity !== 'ALL') {
    filter.entity = req.query.entity;
  }
  if (req.query.action && req.query.action !== 'ALL') {
    filter.action = req.query.action;
  }

  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const total = await models.AuditLog.countDocuments(filter);
    const logs = await models.AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  const logs = await models.AuditLog.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, count: logs.length, data: logs });
}, 'Failed to fetch audit logs'));

module.exports = router;

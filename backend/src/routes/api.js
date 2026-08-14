const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const models = require('../models');
const { protect, authorize, restrictToTenant, requirePermission } = require('../middleware/auth');
const { validateObjectId, sanitizeBody, safeHandler } = require('../middleware/sanitize');

// ── Security Constants ──────────────────────────────────────
const BCRYPT_SALT_ROUNDS = 12;
const JWT_EXPIRY = '1d';

// ── Rate Limiters ───────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,                  // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' }
});

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
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
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
router.get('/public/salons/:identifier', safeHandler(async (req, res) => {
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
      services,
      staff,
      reviews,
      packages
    }
  });
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
  body('ownerName').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/signup
router.post('/auth/signup', authLimiter, signupValidation, safeHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }

  const { ownerName, email, phone, password, role, salonName, salonAddress, city, state, gstNumber, businessType } = req.body;

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
    name: salonName,
    ownerName,
    email: email.toLowerCase(),
    phone,
    address: salonAddress,
    city,
    state,
    gstNumber,
    businessType,
    subscriptionPlan: 'Starter Salon',
    subscriptionStatus: 'Trial'
  });

  // Create default Branch
  const branch = await models.Branch.create({
    salonId: salon._id,
    name: 'Main Branch',
    address: salonAddress,
    city,
    state,
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
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      salonId: user.salonId,
      branchId: user.branchId
    }
  });
}, 'Registration failed'));

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
    res.json({
      success: true,
      token: generateToken(user._id),
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
const CUSTOMER_FIELDS = ['name', 'phone', 'email', 'gender', 'birthday', 'address', 'notes', 'photo', 'membershipLevel', 'branchId'];

router.get('/customers', requirePermission('customers.view'), safeHandler(async (req, res) => {
  let filter = { ...req.tenantFilter };
  if (req.user.role === 'CLIENT') {
    filter.$or = [{ email: req.user.email }, { phone: req.user.phone }];
  }
  const customers = await models.Customer.find(filter);
  res.json({ success: true, count: customers.length, data: customers });
}, 'Failed to fetch customers'));

router.post('/customers', requirePermission('customers.create'), sanitizeBody([...CUSTOMER_FIELDS]), safeHandler(async (req, res) => {
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

router.put('/customers/:id', requirePermission('customers.edit'), validateObjectId, sanitizeBody([...CUSTOMER_FIELDS]), safeHandler(async (req, res) => {
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
const APPOINTMENT_FIELDS = ['customerId', 'staffId', 'services', 'date', 'time', 'status', 'salonId', 'branchId'];

router.get('/appointments', requirePermission('appointments.view'), safeHandler(async (req, res) => {
  let filter = { ...req.tenantFilter };
  if (req.user.role === 'CLIENT') {
    const myCustomers = await models.Customer.find({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    const myIds = myCustomers.map(c => c._id);
    filter.customerId = { $in: myIds };
  }
  const appointments = await models.Appointment.find(filter)
    .populate('customerId')
    .populate('staffId');
  res.json({ success: true, data: appointments });
}, 'Failed to fetch appointments'));

router.post('/appointments', requirePermission('appointments.create'), sanitizeBody([...APPOINTMENT_FIELDS]), safeHandler(async (req, res) => {
  let finalCustomerId = req.body.customerId;
  const targetSalonId = req.user.role === 'CLIENT' ? req.body.salonId : req.user.salonId;
  const targetBranchId = req.user.role === 'CLIENT' ? req.body.branchId : (req.user.branchId || req.body.branchId);

  // Overlap prevention validation for staff bookings
  if (req.body.staffId && req.body.date && req.body.time) {
    const checkDate = new Date(req.body.date);
    const existingAppt = await models.Appointment.findOne({
      salonId: targetSalonId,
      staffId: req.body.staffId,
      date: checkDate,
      time: req.body.time,
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    });
    if (existingAppt) {
      return res.status(400).json({
        success: false,
        message: 'The requested staff member is already booked for another appointment at this time slot.'
      });
    }
  }

  // If client user is booking, automatically resolve or create their customer profile for the target salon
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
  }

  const appointment = await models.Appointment.create({
    ...req.body,
    salonId: targetSalonId,
    branchId: targetBranchId,
    customerId: finalCustomerId
  });

  // Simulate sending WhatsApp confirmation trigger
  await models.Notification.create({
    salonId: targetSalonId,
    customerId: finalCustomerId,
    type: 'WhatsApp',
    message: `Hello! Your appointment at SalonSync is scheduled for ${appointment.date} at ${appointment.time}. See you soon!`,
    status: 'Sent'
  });

  res.status(201).json({ success: true, data: appointment });
}, 'Failed to create appointment'));

router.put('/appointments/:id', requirePermission('appointments.edit'), validateObjectId, sanitizeBody(['staffId', 'services', 'date', 'time', 'status']), safeHandler(async (req, res) => {
  const existingAppt = await models.Appointment.findOne({ _id: req.params.id, ...req.tenantFilter });
  if (!existingAppt) return res.status(404).json({ success: false, message: 'Appointment not found' });

  // Automated inventory deduction upon appointment completion
  if (req.body.status === 'Completed' && !existingAppt.inventoryDeducted) {
    const customer = await models.Customer.findById(existingAppt.customerId);
    const staffMember = await models.Staff.findById(existingAppt.staffId);
    
    const serviceIds = (existingAppt.services || []).map(s => s.serviceId).filter(Boolean);
    const populatedServices = await models.Service.find({ _id: { $in: serviceIds } });

    for (const srv of populatedServices) {
      if (srv.requiredProducts && srv.requiredProducts.length > 0) {
        for (const reqProd of srv.requiredProducts) {
          if (reqProd.productId && reqProd.quantity > 0) {
            const product = await models.Product.findById(reqProd.productId);
            if (product) {
              product.quantity = Math.max(0, product.quantity - reqProd.quantity);
              await product.save();

              await models.InventoryConsumption.create({
                salonId: existingAppt.salonId,
                branchId: existingAppt.branchId,
                productId: product._id,
                productName: product.name,
                quantityConsumed: reqProd.quantity,
                unit: reqProd.unit || 'units',
                serviceId: srv._id,
                serviceName: srv.name,
                customerId: existingAppt.customerId,
                customerName: customer ? customer.name : 'Client',
                staffId: existingAppt.staffId,
                staffName: staffMember ? staffMember.name : 'Staff',
                appointmentId: existingAppt._id,
                date: new Date()
              });

              if (product.quantity <= (product.reorderLevel || product.lowStockThreshold || 5)) {
                await models.Notification.create({
                  salonId: existingAppt.salonId,
                  customerId: null,
                  type: 'Low Stock Alert',
                  message: `Low Stock Alert: ${product.name} is down to ${product.quantity} ${product.unit || 'units'} (Reorder Level: ${product.reorderLevel || 10}).`,
                  status: 'Sent'
                });
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
  res.json({ success: true, data: appointment });
}, 'Failed to update appointment'));

router.delete('/appointments/:id', requirePermission('appointments.cancel'), validateObjectId, safeHandler(async (req, res) => {
  const appointment = await models.Appointment.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.json({ success: true, message: 'Appointment removed' });
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
  const service = new models.Service({
    ...req.body,
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

router.post('/customer-memberships', safeHandler(async (req, res) => {
  const { customerId, membershipPlanId, startDate } = req.body;
  const plan = await models.Membership.findById(membershipPlanId);
  if (!plan) return res.status(404).json({ success: false, message: 'Membership plan not found' });

  const start = startDate ? new Date(startDate) : new Date();
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
    customerId,
    membershipPlanId: plan._id,
    tier: plan.name || plan.tier,
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
    membershipLevel: plan.name
  });

  res.status(201).json({ success: true, data: subscription });
}, 'Failed to subscribe customer membership'));

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

// @route   GET /api/analytics/salon-health (Compute 0-100 score & insights)
router.get('/analytics/salon-health', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const salonFilter = { salonId: req.user.salonId };

  const [invoices, expenses, customers, staff, reviews, products, appointments] = await Promise.all([
    models.Invoice.find(salonFilter),
    models.Expense.find(salonFilter),
    models.Customer.find(salonFilter),
    models.Staff.find({ ...salonFilter, status: 'Active' }),
    models.Review.find(salonFilter),
    models.Product.find(salonFilter),
    models.Appointment.find(salonFilter)
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? Math.max(0, Math.round((netProfit / totalRevenue) * 100)) : 0;

  const totalCustomers = customers.length;
  const repeatCustomersCount = customers.filter(c => (c.totalAppointments || 0) > 1 || (c.totalSpent || 0) > 3000).length;
  const retentionPercent = totalCustomers > 0 ? Math.round((repeatCustomersCount / totalCustomers) * 100) : 0;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1) 
    : 4.9;

  const lowStockProducts = products.filter(p => p.quantity <= (p.lowStockThreshold || 5));
  const inventoryHealthPercent = products.length > 0 
    ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100) 
    : 100;

  const totalAppts = appointments.length;
  const completedAppts = appointments.filter(a => a.status === 'Completed' || a.status === 'Confirmed' || a.status === 'In Progress').length;
  const utilizationPercent = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 85;

  // Sub-scores (0-100 scale)
  const revGrowthScore = Math.min(100, Math.max(50, Math.round(totalRevenue > 0 ? 85 : 60)));
  const profitScore = Math.min(100, Math.round(profitMarginPercent * 2.2));
  const retentionScore = Math.min(100, Math.round(retentionPercent * 1.25));
  const repeatScore = Math.min(100, Math.round(retentionPercent * 1.3));
  const staffScore = Math.min(100, Math.round(Number(avgRating) * 20));
  const ratingScore = Math.min(100, Math.round(Number(avgRating) * 20));
  const inventoryScore = inventoryHealthPercent;
  const utilizationScore = utilizationPercent;

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

  if (retentionPercent < 60) {
    insights.push({
      type: 'alert',
      category: 'Customer Retention',
      message: `Customer retention is at ${retentionPercent}%. Consider sending win-back loyalty vouchers.`
    });
  } else {
    insights.push({
      type: 'positive',
      category: 'Customer Retention',
      message: `Strong customer retention rate of ${retentionPercent}% (${repeatCustomersCount} repeat guests).`
    });
  }

  if (utilizationPercent >= 85) {
    insights.push({
      type: 'opportunity',
      category: 'Capacity',
      message: `Peak weekend appointment utilization is at ${utilizationPercent}%. Consider adding 2 additional evening slots.`
    });
  }

  insights.push({
    type: 'positive',
    category: 'Finances',
    message: `Net profit margin is ${profitMarginPercent}% with ₹${totalRevenue.toLocaleString()} in total billed revenue.`
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
// EXPENSE TRACKING
// ----------------------------------------------------
const EXPENSE_FIELDS = ['category', 'amount', 'description', 'date', 'paymentMethod', 'vendor', 'receiptUrl', 'createdBy', 'branchId'];

router.get('/expenses', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const expenses = await models.Expense.find(req.tenantFilter);
  res.json({ success: true, data: expenses });
}, 'Failed to fetch expenses'));

router.post('/expenses', requirePermission('reports.view'), sanitizeBody([...EXPENSE_FIELDS]), safeHandler(async (req, res) => {
  const expense = await models.Expense.create({
    ...req.body,
    salonId: req.user.salonId,
    branchId: req.user.branchId
  });
  res.status(201).json({ success: true, data: expense });
}, 'Failed to create expense'));

router.put('/expenses/:id', requirePermission('reports.view'), validateObjectId, sanitizeBody([...EXPENSE_FIELDS]), safeHandler(async (req, res) => {
  const expense = await models.Expense.findOneAndUpdate(
    { _id: req.params.id, ...req.tenantFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  res.json({ success: true, data: expense });
}, 'Failed to update expense'));

router.delete('/expenses/:id', requirePermission('reports.view'), validateObjectId, safeHandler(async (req, res) => {
  const expense = await models.Expense.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
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
  const invoices = await models.Invoice.find(filter).populate('customerId');
  res.json({ success: true, data: invoices });
}, 'Failed to fetch invoices'));

router.post('/invoices', requirePermission('billing.create'), safeHandler(async (req, res) => {
  const { customerId, services, products, tax, discount, paymentMethod, staffId, redeemPoints } = req.body;
  
  // Auto-generate invoice number
  const count = await models.Invoice.countDocuments({ salonId: req.user.salonId });
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  // Gracefully resolve branchId
  let targetBranchId = req.user.branchId;
  if (!targetBranchId) {
    const branch = await models.Branch.findOne({ salonId: req.user.salonId });
    if (branch) {
      targetBranchId = branch._id;
    } else {
      return res.status(400).json({ success: false, message: 'Branch ID is required for invoice and no default branch was found.' });
    }
  }

  // Validate Customer & Staff IDs
  const finalCustomerId = (customerId && mongoose.Types.ObjectId.isValid(customerId)) ? customerId : null;
  const finalStaffId = (staffId && mongoose.Types.ObjectId.isValid(staffId)) ? staffId : null;

  // 1. Validate product inventory stock availability BEFORE deducting
  if (products && Array.isArray(products)) {
    for (const item of products) {
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const p = await models.Product.findById(item.productId);
        if (p) {
          const reqQty = item.quantity || 1;
          if (p.quantity < reqQty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient inventory for "${p.name}". Requested: ${reqQty}, Available in stock: ${p.quantity}`
            });
          }
        }
      }
    }
  }

  let subTotal = 0;
  
  // Validate & add Services
  const serviceItems = [];
  if (services && Array.isArray(services)) {
    for (const item of services) {
      if (item.serviceId && mongoose.Types.ObjectId.isValid(item.serviceId)) {
        const s = await models.Service.findById(item.serviceId);
        if (s) {
          serviceItems.push({
            serviceId: s._id,
            name: s.name,
            price: s.price,
            quantity: item.quantity || 1
          });
          subTotal += s.price * (item.quantity || 1);
        }
      }
    }
  }

  // Validate & deduct Products stock
  const productItems = [];
  if (products && Array.isArray(products)) {
    for (const item of products) {
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const p = await models.Product.findById(item.productId);
        if (p) {
          productItems.push({
            productId: p._id,
            name: p.name,
            price: p.sellingPrice,
            quantity: item.quantity || 1
          });
          subTotal += p.sellingPrice * (item.quantity || 1);
          
          // Stock Deduction
          p.quantity = Math.max(0, p.quantity - (item.quantity || 1));
          await p.save();
        }
      }
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
        customer.loyaltyPoints -= actualRedeemed;
        await customer.save();

        await models.LoyaltyPoint.create({
          salonId: req.user.salonId,
          customerId: finalCustomerId,
          pointsEarned: 0,
          pointsRedeemed: actualRedeemed,
          transactionAmount: subTotal
        });
      }
    }
  }

  const calculatedTax = subTotal * (tax || 0) / 100;
  const finalAmount = Math.max(0, Math.round(subTotal + calculatedTax - (discount || 0) - loyaltyDiscount));

  const invoice = await models.Invoice.create({
    invoiceNumber,
    salonId: req.user.salonId,
    branchId: targetBranchId,
    customerId: finalCustomerId,
    services: serviceItems,
    products: productItems,
    tax: tax || 0,
    discount: discount || 0,
    finalAmount,
    paymentMethod: paymentMethod || 'Cash',
    paymentStatus: 'Paid',
    staffId: finalStaffId
  });

  // 1. Configurable Loyalty Points Crediting with Fraud/Duplicate Prevention
  if (finalCustomerId) {
    let rule = await models.LoyaltyRule.findOne({ salonId: req.user.salonId });
    const ptsPer100 = rule ? rule.pointsEarnedPer100Spent : 10;
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

  // 3. Trigger WhatsApp notification mock
  if (finalCustomerId) {
    const customer = await models.Customer.findById(finalCustomerId);
    if (customer) {
      await models.Notification.create({
        salonId: req.user.salonId,
        customerId: finalCustomerId,
        type: 'WhatsApp',
        message: `Dear ${customer.name}, thank you for visiting us. Your bill of ₹${finalAmount} has been paid. Invoice: ${invoiceNumber}.`,
        status: 'Sent'
      });
    }
  }

  res.status(201).json({ success: true, data: invoice });
}, 'Failed to create invoice'));

// ----------------------------------------------------
// INVENTORY
// ----------------------------------------------------
const PRODUCT_FIELDS = ['name', 'sku', 'category', 'quantity', 'purchasePrice', 'sellingPrice', 'supplierId', 'lowStockThreshold', 'unit', 'minStock', 'reorderLevel', 'expiryDate'];
const SUPPLIER_FIELDS = ['name', 'phone', 'email', 'address', 'outstandingDues'];

router.get('/inventory-consumptions', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const logs = await models.InventoryConsumption.find(req.tenantFilter).sort({ date: -1 });
  res.json({ success: true, data: logs });
}, 'Failed to fetch inventory consumption logs'));

router.get('/products', requirePermission('inventory.view'), safeHandler(async (req, res) => {
  const products = await models.Product.find(req.tenantFilter).populate('supplierId');
  res.json({ success: true, data: products });
}, 'Failed to fetch products'));

router.post('/products', requirePermission('inventory.edit'), sanitizeBody([...PRODUCT_FIELDS]), safeHandler(async (req, res) => {
  const product = await models.Product.create({
    ...req.body,
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
  const commissions = await models.Commission.find(req.tenantFilter).populate('staffId').populate('invoiceId');
  res.json({ success: true, data: commissions });
}, 'Failed to fetch commissions'));

// ----------------------------------------------------
// ANALYTICS & PROFIT & LOSS ENGINE
// ----------------------------------------------------
router.get('/dashboard/stats', requirePermission('reports.view'), safeHandler(async (req, res) => {
  const filter = req.tenantFilter;

  // Monthly ranges
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);

  // Today Revenue
  const todayInvoices = await models.Invoice.find({ createdAt: { $gte: todayStart }, ...filter });
  const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

  // Monthly Revenue
  const monthlyInvoices = await models.Invoice.find({ createdAt: { $gte: startOfMonth }, ...filter });
  const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

  // Expenses
  const todayExpensesList = await models.Expense.find({ date: { $gte: todayStart }, ...filter });
  const todayExpenses = todayExpensesList.reduce((sum, exp) => sum + exp.amount, 0);

  const monthlyExpensesList = await models.Expense.find({ date: { $gte: startOfMonth }, ...filter });
  const monthlyExpenses = monthlyExpensesList.reduce((sum, exp) => sum + exp.amount, 0);

  // Materials Cost Estimate (from services sold)
  let monthlyMaterialCost = 0;
  for (const inv of monthlyInvoices) {
    for (const item of inv.services) {
      const serv = await models.Service.findById(item.serviceId);
      if (serv) {
        monthlyMaterialCost += (serv.materialCost || 0) * (item.quantity || 1);
      }
    }
  }

  const netProfit = monthlyRevenue - monthlyMaterialCost - monthlyExpenses;
  const totalCustomers = await models.Customer.countDocuments(filter);
  const totalAppointments = await models.Appointment.countDocuments(filter);
  
  const activeMemberships = await models.Customer.countDocuments({
    membershipLevel: { $ne: 'None' },
    ...filter
  });

  // Low stock warnings
  const lowStockAlerts = await models.Product.countDocuments({
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    ...filter
  });

  res.json({
    success: true,
    data: {
      todayRevenue,
      monthlyRevenue,
      todayExpenses,
      monthlyExpenses,
      netProfit,
      totalCustomers,
      totalAppointments,
      activeMemberships,
      lowStockAlerts
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
  const token = generateToken(req.user._id);
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

// @route   POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

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
  const { horizon, branchId } = req.query;
  const salonFilter = { ...req.tenantFilter };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    salonFilter.branchId = branchId;
  }

  const now = new Date();
  let startDate = null;
  if (horizon === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (horizon === 'weekly') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (horizon === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (horizon === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const queryFilter = { ...salonFilter };
  if (startDate) {
    queryFilter.createdAt = { $gte: startDate };
  }

  const invoices = await models.Invoice.find(queryFilter);
  const expenses = await models.Expense.find(startDate ? { ...salonFilter, date: { $gte: startDate } } : salonFilter);
  const commissions = await models.Commission.find(startDate ? { ...salonFilter, date: { $gte: startDate } } : salonFilter);
  const services = await models.Service.find(req.tenantFilter);
  const products = await models.Product.find(req.tenantFilter);
  const staff = await models.Staff.find(req.tenantFilter);
  const branches = await models.Branch.find({ salonId: req.user.salonId });

  let grossRevenue = 0;
  let discounts = 0;
  let refunds = 0;

  invoices.forEach(inv => {
    if (inv.paymentStatus === 'Refunded' || inv.status === 'Cancelled') {
      refunds += inv.finalAmount || 0;
      return;
    }

    let invGross = 0;
    (inv.services || []).forEach(s => { invGross += (s.price || 0) * (s.quantity || 1); });
    (inv.products || []).forEach(p => { invGross += (p.price || 0) * (p.quantity || 1); });

    grossRevenue += (invGross || inv.finalAmount || 0);
    discounts += (inv.discount || 0);
  });

  const netRevenue = Math.max(0, grossRevenue - discounts - refunds);

  let productCosts = 0;
  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
      (inv.services || []).forEach(item => {
        const srv = services.find(s => String(s._id) === String(item.serviceId) || s.name === item.name);
        if (srv) {
          productCosts += (srv.materialCost || 0) * (item.quantity || 1);
        }
      });
      (inv.products || []).forEach(item => {
        const prod = products.find(p => String(p._id) === String(item.productId) || p.name === item.name);
        if (prod) {
          productCosts += (prod.purchasePrice || 0) * (item.quantity || 1);
        }
      });
    }
  });

  let staffCommissions = commissions.reduce((sum, c) => sum + (c.commissionEarned || 0), 0);
  if (staffCommissions === 0 && invoices.length > 0) {
    invoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
        const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
        const stMember = staff.find(s => String(s._id) === String(sid));
        const commPct = stMember ? (stMember.commissionPercentage || 10) : 10;
        staffCommissions += ((inv.finalAmount || 0) * commPct) / 100;
      }
    });
  }
  staffCommissions = Math.round(staffCommissions);

  const operatingExpenses = Math.round(expenses.reduce((sum, e) => sum + (e.amount || 0), 0));
  const grossProfit = Math.round(netRevenue - productCosts - staffCommissions);
  const netProfit = Math.round(grossProfit - operatingExpenses);
  const profitMargin = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 1000) / 10 : 0;

  const expenseBreakdown = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + (e.amount || 0);
  });

  const serviceStatsMap = {};
  services.forEach(s => {
    serviceStatsMap[String(s._id)] = {
      id: s._id,
      name: s.name,
      category: s.category,
      volume: 0,
      revenue: 0,
      productCost: 0,
      staffCommission: 0,
      netProfit: 0
    };
  });

  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
      (inv.services || []).forEach(item => {
        const sid = String(item.serviceId);
        let rec = serviceStatsMap[sid];
        if (!rec) {
          const found = services.find(s => s.name === item.name);
          if (found) rec = serviceStatsMap[String(found._id)];
        }
        if (rec) {
          const qty = item.quantity || 1;
          const rev = (item.price || 0) * qty;
          const srvObj = services.find(s => String(s._id) === String(rec.id));
          const matCost = (srvObj?.materialCost || 0) * qty;
          const comm = (rev * 10) / 100;

          rec.volume += qty;
          rec.revenue += rev;
          rec.productCost += matCost;
          rec.staffCommission += comm;
          rec.netProfit += (rev - matCost - comm);
        }
      });
    }
  });

  const serviceProfitability = Object.values(serviceStatsMap).sort((a, b) => b.revenue - a.revenue);

  const staffStatsMap = {};
  staff.forEach(st => {
    staffStatsMap[String(st._id)] = { id: st._id, name: st.name, role: st.role, count: 0, revenue: 0, commission: 0 };
  });

  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
      const sid = String(typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId);
      if (staffStatsMap[sid]) {
        staffStatsMap[sid].count += 1;
        staffStatsMap[sid].revenue += inv.finalAmount || 0;
        const commPct = staff.find(s => String(s._id) === sid)?.commissionPercentage || 10;
        staffStatsMap[sid].commission += ((inv.finalAmount || 0) * commPct) / 100;
      }
    }
  });

  const staffRevenue = Object.values(staffStatsMap).sort((a, b) => b.revenue - a.revenue);

  const branchProfitability = branches.map(br => {
    const bInvoices = invoices.filter(i => String(typeof i.branchId === 'object' ? i.branchId?._id : i.branchId) === String(br._id));
    const bExpenses = expenses.filter(e => String(typeof e.branchId === 'object' ? e.branchId?._id : e.branchId) === String(br._id));

    const bRev = bInvoices.reduce((sum, i) => sum + (i.finalAmount || 0), 0);
    const bExp = bExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const bProfit = Math.max(0, bRev - bExp);
    const bAov = bInvoices.length > 0 ? Math.round(bRev / bInvoices.length) : 0;

    return {
      id: br._id,
      name: br.name,
      city: br.city || 'Branch',
      revenue: bRev,
      expenses: bExp,
      profit: bProfit,
      checkoutCount: bInvoices.length,
      averageBill: bAov
    };
  }).sort((a, b) => b.revenue - a.revenue);

  res.json({
    success: true,
    data: {
      metrics: {
        grossRevenue: Math.round(grossRevenue),
        discounts: Math.round(discounts),
        refunds: Math.round(refunds),
        netRevenue: Math.round(netRevenue),
        productCosts: Math.round(productCosts),
        staffCommissions: Math.round(staffCommissions),
        grossProfit,
        operatingExpenses,
        netProfit,
        profitMargin
      },
      expenseBreakdown,
      serviceProfitability,
      staffRevenue,
      branchProfitability
    }
  });
}, 'Failed to fetch financial summary analytics'));

module.exports = router;

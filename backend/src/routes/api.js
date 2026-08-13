const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const router = express.Router();
const models = require('../models');
const { protect, authorize, restrictToTenant, validateSubscription, checkBranchAccess, validateOwnership } = require('../middleware/auth');

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

// JWT signer helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'salonsync_secret_key_12345', {
    expiresIn: '30d',
  });
};

// Public Endpoints (accessible without login)
// @route   GET /api/salons
router.get('/salons', async (req, res) => {
  try {
    const salons = await models.Salon.find({});
    res.json({ success: true, data: salons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/public/services
router.get('/public/services', async (req, res) => {
  try {
    const services = await models.Service.find({});
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// AUTHENTICATION SYSTEM
// ----------------------------------------------------

// @route   POST /api/auth/signup
router.post('/auth/signup', async (req, res) => {
  try {
    const { ownerName, email, phone, password, role, salonName, salonAddress, city, state, gstNumber, businessType } = req.body;

    const userExists = await models.User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === 'CLIENT') {
      // Create Client User (Global)
      const user = await models.User.create({
        name: ownerName,
        email,
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
          email,
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
      email,
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
      email,
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanInput = (email || '').trim();
    const inputPhone = cleanInput.replace(/[\s+-]/g, '');

    let user = await models.User.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { phone: cleanInput },
        { phone: inputPhone },
        { phone: `+91 ${cleanInput}` }
      ]
    });

    // Auto-create missing User account if Staff record exists in database
    if (!user) {
      const staffMember = await models.Staff.findOne({
        $or: [
          { phone: cleanInput },
          { phone: inputPhone },
          { email: cleanInput.toLowerCase() },
          { phone: `+91 ${cleanInput}` }
        ]
      });

      if (staffMember) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'password123', salt);
        user = await models.User.create({
          name: staffMember.name,
          email: staffMember.email || `${staffMember.phone}@salonsync.com`,
          phone: staffMember.phone,
          password: hashedPassword,
          role: 'STAFF',
          salonId: staffMember.salonId,
          branchId: staffMember.branchId
        });
        staffMember.userId = user._id;
        await staffMember.save();
      }
    }

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
      res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// OTP & Mocks
router.post('/auth/forgot-password', (req, res) => {
  res.json({ success: true, message: 'OTP sent to registered email and mobile number' });
});
router.post('/auth/verify-otp', (req, res) => {
  res.json({ success: true, message: 'OTP verified successfully' });
});
router.post('/auth/reset-password', (req, res) => {
  res.json({ success: true, message: 'Password reset successfully. You can now login.' });
});

// ----------------------------------------------------
// MULTI-TENANT MIDDLEWARES ON CORE ROUTES
// ----------------------------------------------------
router.use(protect);

router.use(restrictToTenant);

// ----------------------------------------------------
// CUSTOMER CRM
// ----------------------------------------------------
router.get('/customers', async (req, res) => {
  try {
    let filter = { ...req.tenantFilter };
    if (req.user.role === 'CLIENT') {
      filter.$or = [{ email: req.user.email }, { phone: req.user.phone }];
    }
    const customers = await models.Customer.find(filter);
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const newCustomer = await models.Customer.create({
      ...req.body,
      salonId: req.user.salonId
    });

    // If the customer has an email, auto-create a CLIENT user so they can log in
    let clientCredentials = null;
    if (req.body.email) {
      const existingUser = await models.User.findOne({ email: req.body.email });
      if (!existingUser) {
        const defaultPassword = 'welcome123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        await models.User.create({
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone || '',
          password: hashedPassword,
          role: 'CLIENT'
        });
        clientCredentials = { email: req.body.email, defaultPassword };
      }
    }

    res.status(201).json({ success: true, data: newCustomer, clientCredentials });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await models.Customer.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await models.Customer.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// APPOINTMENT MANAGEMENT
// ----------------------------------------------------
router.get('/appointments', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const appointment = await models.Appointment.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    const appointment = await models.Appointment.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// SERVICES AND PACKAGES
// ----------------------------------------------------
router.get('/services', async (req, res) => {
  try {
    const services = await models.Service.find(req.tenantFilter);
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = new models.Service({
      ...req.body,
      salonId: req.user.salonId
    });
    await service.save(); // pre('save') calculates profitMargin
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const service = await models.Service.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const service = await models.Service.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/packages', async (req, res) => {
  try {
    const packages = await models.Package.find(req.tenantFilter);
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/packages', async (req, res) => {
  try {
    const pkg = await models.Package.create({
      ...req.body,
      salonId: req.user.salonId
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/packages/:id', async (req, res) => {
  try {
    const pkg = await models.Package.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/packages/:id', async (req, res) => {
  try {
    const pkg = await models.Package.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, message: 'Package removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// EXPENSE TRACKING
// ----------------------------------------------------
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await models.Expense.find(req.tenantFilter);
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = await models.Expense.create({
      ...req.body,
      salonId: req.user.salonId,
      branchId: req.user.branchId
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await models.Expense.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await models.Expense.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// INVOICING & POS BILLING TERMINAL
// ----------------------------------------------------
router.get('/invoices', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
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

    // 1. Loyalty Points Rule: ₹100 spent = 1 point earned
    if (finalCustomerId) {
      const pointsEarned = Math.floor(finalAmount / 100);
      if (pointsEarned > 0) {
        await models.Customer.findByIdAndUpdate(finalCustomerId, {
          $inc: { loyaltyPoints: pointsEarned }
        });
        await models.LoyaltyPoint.create({
          salonId: req.user.salonId,
          customerId: finalCustomerId,
          pointsEarned,
          transactionAmount: finalAmount
        });
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
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// INVENTORY
// ----------------------------------------------------
router.get('/products', async (req, res) => {
  try {
    const products = await models.Product.find(req.tenantFilter).populate('supplierId');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await models.Product.create({
      ...req.body,
      salonId: req.user.salonId
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await models.Product.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await models.Product.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await models.Supplier.find(req.tenantFilter);
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await models.Supplier.create({
      ...req.body,
      salonId: req.user.salonId
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await models.Supplier.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await models.Supplier.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// STAFF & ATTENDANCE
// ----------------------------------------------------
router.get('/staff', async (req, res) => {
  try {
    const staff = await models.Staff.find(req.tenantFilter);
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/staff', async (req, res) => {
  try {
    const { name, phone, email, role, salary, commissionPercentage, password } = req.body;
    
    // 1. Create Staff document
    const staff = await models.Staff.create({
      salonId: req.user.salonId,
      branchId: req.body.branchId || req.user.branchId,
      name,
      phone,
      email: email || `${phone}@salonsync.com`,
      role: role || 'Stylist',
      salary: salary || 0,
      commissionPercentage: commissionPercentage || 10
    });

    // 2. Create User Login Account for Staff
    const staffEmail = (email || `${phone}@salonsync.com`).toLowerCase();
    let user = await models.User.findOne({ $or: [{ email: staffEmail }, { phone }] });
    const defaultPassword = password || 'password123';
    
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
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
      credentials: {
        email: staffEmail,
        phone,
        password: defaultPassword
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/staff/:id', async (req, res) => {
  try {
    const staff = await models.Staff.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    const staff = await models.Staff.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const attendance = await models.Attendance.find(req.tenantFilter).populate('staffId');
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/attendance', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/commissions', async (req, res) => {
  try {
    const commissions = await models.Commission.find(req.tenantFilter).populate('staffId').populate('invoiceId');
    res.json({ success: true, data: commissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// ANALYTICS & PROFIT & LOSS ENGINE
// ----------------------------------------------------
router.get('/dashboard/stats', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/superadmin/salons
router.get('/superadmin/salons', authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const salons = await models.Salon.find({});
    res.json({ success: true, data: salons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/superadmin/salons/:id/subscription
router.put('/superadmin/salons/:id/subscription', authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { plan, status } = req.body;
    const salon = await models.Salon.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan: plan, subscriptionStatus: status },
      { new: true }
    );
    res.json({ success: true, data: salon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/salons/mine
router.get('/salons/mine', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/salons/mine
router.put('/salons/mine', async (req, res) => {
  try {
    const salon = await models.Salon.findByIdAndUpdate(req.user.salonId, req.body, { new: true });
    res.json({ success: true, data: salon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   BRANCH MANAGEMENT
router.get('/branches', async (req, res) => {
  try {
    const branches = await models.Branch.find(req.tenantFilter);
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/branches', authorize('SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'), async (req, res) => {
  try {
    const branch = await models.Branch.create({
      ...req.body,
      salonId: req.user.salonId
    });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/branches/:id', authorize('SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'), async (req, res) => {
  try {
    const branch = await models.Branch.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/branches/:id', authorize('SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'), async (req, res) => {
  try {
    const branch = await models.Branch.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, message: 'Branch removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/create-user
router.post('/auth/create-user', authorize('SUPER_ADMIN', 'SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'), async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;

    const userExists = await models.User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const user = await models.User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'STAFF',
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reviews
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await models.Review.find(req.tenantFilter).sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reviews
router.post('/reviews', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// DEDICATED MOBILE APP ENDPOINTS LAYER (iOS / Android)
// ----------------------------------------------------

// @route   POST /api/auth/refresh-token
router.post('/auth/refresh-token', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// @route   GET /api/mobile/client/dashboard
router.get('/mobile/client/dashboard', async (req, res) => {
  try {
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

    const availableSalons = await models.Salon.find({}).limit(10);
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/mobile/staff/schedule
router.get('/mobile/staff/schedule', async (req, res) => {
  try {
    const staffRecord = await models.Staff.findOne({
      $or: [{ userId: req.user._id }, { email: req.user.email }, { phone: req.user.phone }]
    });

    if (!staffRecord) {
      return res.status(440).json({ success: false, message: 'Staff profile not found for user account' });
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/notifications/register-device
router.post('/notifications/register-device', async (req, res) => {
  try {
    const { deviceToken, platform } = req.body;
    if (!deviceToken) {
      return res.status(400).json({ success: false, message: 'deviceToken is required' });
    }

    await models.User.findByIdAndUpdate(req.user._id, {
      $set: { deviceToken, devicePlatform: platform || 'mobile' }
    });

    res.json({ success: true, message: 'Device token registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/public/slots
router.get('/public/slots', async (req, res) => {
  try {
    const { salonId, staffId, date } = req.query;
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    if (!date) {
      return res.json({ success: true, availableSlots: allSlots });
    }

    const checkDate = new Date(date);
    const query = {
      date: checkDate,
      status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] }
    };
    if (salonId) query.salonId = salonId;
    if (staffId) query.staffId = staffId;

    const bookedAppts = await models.Appointment.find(query);
    const bookedTimes = new Set(bookedAppts.map(a => a.time));

    const availableSlots = allSlots.filter(s => !bookedTimes.has(s));
    res.json({ success: true, date, availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const models = require('../models');
const { protect, authorize, restrictToTenant } = require('../middleware/auth');

// JWT signer helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'salonflow_secret_key_12345', {
    expiresIn: '30d',
  });
};

// ----------------------------------------------------
// AUTHENTICATION SYSTEM
// ----------------------------------------------------

// @route   POST /api/auth/signup
router.post('/auth/signup', async (req, res) => {
  try {
    const { ownerName, email, phone, password, salonName, salonAddress, city, state, gstNumber, businessType } = req.body;

    const userExists = await models.User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
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

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

    const user = await models.User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
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
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
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
    const customers = await models.Customer.find(req.tenantFilter);
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
    res.status(201).json({ success: true, data: newCustomer });
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
    const appointments = await models.Appointment.find(req.tenantFilter)
      .populate('customerId')
      .populate('staffId');
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const appointment = await models.Appointment.create({
      ...req.body,
      salonId: req.user.salonId,
      branchId: req.user.branchId || req.body.branchId
    });

    // Simulate sending WhatsApp confirmation trigger
    await models.Notification.create({
      salonId: req.user.salonId,
      customerId: appointment.customerId,
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
    const invoices = await models.Invoice.find(req.tenantFilter).populate('customerId');
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const { customerId, services, products, tax, discount, paymentMethod, staffId } = req.body;
    
    // Auto-generate invoice number
    const count = await models.Invoice.countDocuments({ salonId: req.user.salonId });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let subTotal = 0;
    
    // Validate & add Services
    const serviceItems = [];
    for (const item of services) {
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

    // Validate & deduct Products stock
    const productItems = [];
    for (const item of products) {
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

    const calculatedTax = subTotal * (tax || 0) / 100;
    const finalAmount = Math.round(subTotal + calculatedTax - (discount || 0));

    const invoice = await models.Invoice.create({
      invoiceNumber,
      salonId: req.user.salonId,
      branchId: req.user.branchId,
      customerId,
      services: serviceItems,
      products: productItems,
      tax: tax || 0,
      discount: discount || 0,
      finalAmount,
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: 'Paid',
      staffId
    });

    // 1. Loyalty Points Rule: ₹100 spent = 1 point earned
    if (customerId) {
      const pointsEarned = Math.floor(finalAmount / 100);
      if (pointsEarned > 0) {
        await models.Customer.findByIdAndUpdate(customerId, {
          $inc: { loyaltyPoints: pointsEarned }
        });
        await models.LoyaltyPoint.create({
          salonId: req.user.salonId,
          customerId,
          pointsEarned,
          transactionAmount: finalAmount
        });
      }
    }

    // 2. Staff Commission Calculation
    if (staffId) {
      const employee = await models.Staff.findById(staffId);
      if (employee) {
        // Commission earned from service revenue
        const serviceRev = serviceItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const commissionEarned = Math.round(serviceRev * (employee.commissionPercentage / 100));

        await models.Commission.create({
          salonId: req.user.salonId,
          branchId: req.user.branchId,
          staffId,
          invoiceId: invoice._id,
          revenueGenerated: serviceRev,
          commissionRate: employee.commissionPercentage,
          commissionEarned
        });
      }
    }

    // 3. Trigger WhatsApp notification mock
    if (customerId) {
      const customer = await models.Customer.findById(customerId);
      if (customer) {
        await models.Notification.create({
          salonId: req.user.salonId,
          customerId,
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
    const staff = await models.Staff.create({
      ...req.body,
      salonId: req.user.salonId,
      branchId: req.user.branchId
    });
    res.status(201).json({ success: true, data: staff });
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

module.exports = router;

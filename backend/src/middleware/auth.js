const jwt = require('jsonwebtoken');
const { User } = require('../models');

const initializedSalons = new Set();

const ensureDefaultSalonData = async (salonId, user) => {
  if (!salonId || initializedSalons.has(String(salonId))) return;

  try {
    const models = require('../models');

    // 1. Ensure at least one Branch exists
    let branch = await models.Branch.findOne({ salonId });
    if (!branch) {
      branch = await models.Branch.create({
        salonId,
        name: 'Main Branch',
        address: 'Signature Towers, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        phone: user.phone || '9999999999',
        status: 'Active'
      });
      console.log(`Created default branch for salon ${salonId}`);
    }

    // 2. Ensure at least one Staff exists
    const staffCount = await models.Staff.countDocuments({ salonId });
    if (staffCount === 0) {
      await models.Staff.create({
        salonId,
        branchId: branch._id,
        name: 'Emma Watson',
        phone: user.phone || '9999999999',
        role: 'Senior Stylist',
        salary: 25000,
        commissionPercentage: 10
      });
      console.log(`Created default staff for salon ${salonId}`);
    }

    // 3. Ensure at least one Service exists
    const serviceCount = await models.Service.countDocuments({ salonId });
    if (serviceCount === 0) {
      await models.Service.create([
        { salonId, name: 'Premium Haircut', category: 'Haircut', duration: 30, price: 500, materialCost: 50 },
        { salonId, name: 'Global Hair Color', category: 'Hair Color', duration: 90, price: 2500, materialCost: 600 },
        { salonId, name: 'Gold Facial', category: 'Facial', duration: 60, price: 1500, materialCost: 200 },
        { salonId, name: 'Bridal Makeover', category: 'Bridal Services', duration: 180, price: 15000, materialCost: 2500 }
      ]);
      console.log(`Created default services for salon ${salonId}`);
    }

    // 4. Ensure at least one Product exists
    const productCount = await models.Product.countDocuments({ salonId });
    if (productCount === 0) {
      await models.Product.create({
        salonId,
        name: 'Argan Oil Shampoo',
        sku: 'SHAMP-ARG-500',
        category: 'Hair Care',
        quantity: 15,
        purchasePrice: 400,
        sellingPrice: 750,
        lowStockThreshold: 3
      });
      console.log(`Created default products for salon ${salonId}`);
    }

    // 5. Ensure default operating Expenses exist for salon (in development / production)
    if (process.env.NODE_ENV !== 'test') {
      const expenseCount = await models.Expense.countDocuments({ salonId });
      if (expenseCount === 0) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        await models.Expense.create([
          {
            salonId,
            branchId: branch._id,
            category: 'Rent',
            amount: 45000,
            description: 'Monthly commercial floor lease',
            date: new Date(currentYear, currentMonth, 1),
            paymentMethod: 'Bank Transfer',
            vendor: 'Signature Estates Ltd',
            createdBy: 'System Seed'
          },
          {
            salonId,
            branchId: branch._id,
            category: 'Electricity',
            amount: 12500,
            description: 'Commercial electricity & power utility',
            date: new Date(currentYear, currentMonth, 5),
            paymentMethod: 'UPI',
            vendor: 'Tata Power / Municipal',
            createdBy: 'System Seed'
          },
          {
            salonId,
            branchId: branch._id,
            category: 'Products',
            amount: 18000,
            description: 'Salon backbar and styling product restock',
            date: new Date(currentYear, currentMonth, 8),
            paymentMethod: 'Card',
            vendor: "L'Oreal Professional Ind.",
            createdBy: 'System Seed'
          },
          {
            salonId,
            branchId: branch._id,
            category: 'Marketing',
            amount: 8000,
            description: 'Meta and Instagram promotional campaign',
            date: new Date(currentYear, currentMonth, 10),
            paymentMethod: 'UPI',
            vendor: 'Meta Ads Manager',
            createdBy: 'System Seed'
          },
          {
            salonId,
            branchId: branch._id,
            category: 'Maintenance',
            amount: 3500,
            description: 'AC servicing and salon sanitization',
            date: new Date(currentYear, currentMonth, 12),
            paymentMethod: 'Cash',
            vendor: 'CoolCare Services',
            createdBy: 'System Seed'
          }
        ]);
        console.log(`Created default expenses for salon ${salonId}`);
      }
    }

    // 6. Ensure the user document itself has branchId assigned
    if (user && !user.branchId) {
      user.branchId = branch._id;
      await user.save();
      console.log(`Associated branchId ${branch._id} with user ${user._id}`);
    }

    initializedSalons.add(String(salonId));
  } catch (err) {
    console.error(`Error in ensureDefaultSalonData for salon ${salonId}:`, err);
  }
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Account status check (Disabled or Suspended accounts rejected)
      if (req.user.status && req.user.status !== 'Active') {
        return res.status(403).json({ success: false, message: 'Account is disabled or suspended' });
      }

      // Token version check (Session invalidation on password change or revocation)
      if (decoded.tokenVersion !== undefined && req.user.tokenVersion !== undefined) {
        if (decoded.tokenVersion !== req.user.tokenVersion) {
          return res.status(401).json({ success: false, message: 'Session expired or password changed. Please log in again.' });
        }
      }

      // Auto-repair missing salon seed data for newly/manually registered salons
      if (req.user.salonId) {
        await ensureDefaultSalonData(req.user.salonId, req.user);
      }

      next();
    } catch (error) {
      console.error(`[AUTH_ERROR] ${error.message}`);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Check if user has required roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource` 
      });
    }
    next();
  };
};

// Middleware to enforce multi-tenant isolation
const restrictToTenant = (req, res, next) => {
  if (req.user && req.user.role !== 'SUPER_ADMIN') {
    if (req.user.role === 'CLIENT') {
      // Clients are restricted to their associated salon if set
      req.tenantFilter = req.user.salonId ? { salonId: req.user.salonId } : {};
    } else {
      // Salon owners, managers, and staff are strictly filtered by their salonId
      req.tenantFilter = { salonId: req.user.salonId };
      if (req.body) {
        req.body.salonId = req.user.salonId;
      }
    }
  } else {
    req.tenantFilter = {}; // Super Admin can view all salons
  }
  next();
};

// Subscription validation middleware
const validateSubscription = (...allowedPlans) => {
  return async (req, res, next) => {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next(); // Super admin bypasses subscription check
    }
    try {
      const { Salon } = require('../models');
      const salon = await Salon.findById(req.user.salonId);
      if (!salon) {
        return res.status(404).json({ success: false, message: 'Salon not found' });
      }
      
      if (!allowedPlans.includes(salon.subscriptionPlan)) {
        return res.status(403).json({
          success: false,
          message: `Subscription tier validation failed. Requires plan: [${allowedPlans.join(', ')}]. Current plan: ${salon.subscriptionPlan}`
        });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Subscription validation failed' });
    }
  };
};

// Branch access middleware
const checkBranchAccess = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Super Admin, Salon Owner, and Franchise Owner can access all branches of their salon
    if (['SUPER_ADMIN', 'SALON_OWNER', 'FRANCHISE_OWNER'].includes(req.user.role)) {
      return next();
    }
    
    // Staff and Managers are restricted to their assigned branch
    const userBranchId = req.user.branchId ? req.user.branchId.toString() : null;
    const reqBranchId = req.params.branchId || req.query.branchId || req.body.branchId;
    
    if (reqBranchId && reqBranchId.toString() !== userBranchId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You only have access to your assigned branch'
      });
    }
    
    if (['SALON_MANAGER', 'STAFF'].includes(req.user.role)) {
      req.branchFilter = { branchId: req.user.branchId };
      if (req.body) {
        req.body.branchId = req.user.branchId;
      }
    }
    
    next();
  };
};

// Ownership validation middleware
const validateOwnership = (modelName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    
    const resourceId = req.params.id;
    if (!resourceId) {
      return next();
    }
    
    try {
      const models = require('../models');
      const Model = models[modelName];
      if (!Model) {
        return res.status(500).json({ success: false, message: `Invalid model name: ${modelName}` });
      }
      
      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }
      
      if (resource.salonId && resource.salonId.toString() !== req.user.salonId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Resource does not belong to your salon'
        });
      }
      
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Ownership validation failed' });
    }
  };
};

const { PERMISSIONS, hasPermission } = require('../config/permissions');

// Granular permission check middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (hasPermission(req.user.role, permission)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: `Forbidden: Role '${req.user.role}' lacks required permission '${permission}'`
    });
  };
};

module.exports = {
  protect,
  authorize,
  restrictToTenant,
  validateSubscription,
  checkBranchAccess,
  validateOwnership,
  requirePermission,
  PERMISSIONS,
  hasPermission
};

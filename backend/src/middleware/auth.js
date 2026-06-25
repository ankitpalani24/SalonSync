const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salonflow_secret_key_12345');
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error(error);
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
    // If not a Super Admin, verify the query is filtered by the user's salonId
    req.tenantFilter = { salonId: req.user.salonId };
    
    // For POST/PUT payloads, enforce their own salonId
    if (req.body) {
      req.body.salonId = req.user.salonId;
    }
  } else {
    req.tenantFilter = {}; // Super Admin can see everything
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

module.exports = { protect, authorize, restrictToTenant, validateSubscription, checkBranchAccess, validateOwnership };

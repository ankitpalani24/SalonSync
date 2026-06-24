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
  if (req.user && req.user.role !== 'Super Admin') {
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

module.exports = { protect, authorize, restrictToTenant };

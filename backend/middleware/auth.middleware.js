const jwt = require('jsonwebtoken');
const { User, Role, Customer, Tenant, Plan } = require('../models');
const tenantContext = require('../utils/tenantContext');

/**
 * Middleware to verify JWT token (Alias: protect)
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] },
        { 
          model: Tenant, 
          attributes: ['id', 'name', 'status', 'subscription_ends_at', 'subscription_starts_at', 'trial_ends_at', 'billing_cycle', 'next_billing_date'],
          include: [{ model: Plan }]
        }
      ]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user.'
      });
    }

    if (user.tenant_id) {
      if (!user.Tenant) {
        return res.status(401).json({
          success: false,
          message: 'Organization not found or inactive.'
        });
      }

      const tenantStatus = user.Tenant.status;
      if (['suspended', 'cancelled'].includes(tenantStatus)) {
        return res.status(403).json({
          success: false,
          message: 'Your organization has been suspended or cancelled. Please contact support.'
        });
      }

      if (['new_registration', 'trial_expired', 'expired', 'unpaid'].includes(tenantStatus) && req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          message: 'Your organization subscription is not active. Transactions are currently blocked.'
        });
      }

      req.tenantId = user.tenant_id;
    } else {
      req.tenantId = null; // Global/Super Admin
    }

    req.user = user;

    // Wrap subsequent execution in tenant context
    tenantContext.run(req.tenantId, () => {
      next();
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is not valid.'
    });
  }
};

exports.protect = exports.verifyToken;

/**
 * Middleware to restrict access by permission (e.g., 'invoices.write')
 */
exports.requirePermission = (moduleName, accessType = 'read') => {
  return (req, res, next) => {
    if (!req.user || !req.user.Role) {
      return res.status(403).json({ success: false, message: 'Access denied. No role assigned.' });
    }

    // Developer Fail-safe: Always allow
    if (req.user.Role.name === 'Developer') {
        return next();
    }

    let { permissions } = req.user.Role;
    
    // Safety: Parse string permissions if Sequelize didn't automatically do it
    if (typeof permissions === 'string') {
        try {
            permissions = JSON.parse(permissions);
        } catch (e) {
            console.error('Failed to parse role permissions:', e);
            return res.status(500).json({ success: false, message: 'Error parsing role permissions.' });
        }
    }

    if (permissions && permissions[moduleName] && permissions[moduleName][accessType]) {
        return next();
    }

    console.log(`[Permission Denied] User: ${req.user.email}, Role: ${req.user.Role.name}, Module: ${moduleName}, Access: ${accessType}`);
    console.log('Permissions Object:', JSON.stringify(permissions, null, 2));

    return res.status(403).json({
        success: false,
        message: `Access denied. Insufficient permissions for ${moduleName}.${accessType}`
    });
  };
};

/**
 * Middleware to restrict access by role name (Backward compatibility)
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.Role || !roles.includes(req.user.Role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

/**
 * Middleware to restrict access to Super Admins (tenant_id = null)
 */
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.tenant_id !== null) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }
  next();
};

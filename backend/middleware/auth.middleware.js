const jwt = require('jsonwebtoken');
const { User, Role, Customer } = require('../models');

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

    // const Role = require('../models/Role'); // Already imported at top
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user.'
      });
    }

    req.user = user;
    next();
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

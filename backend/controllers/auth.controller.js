const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Role, Customer } = require('../models');

/**
 * Handle user login
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ 
      where: { email, is_active: true },
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ]
    });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.Role?.name || 'Staff' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Long-lived refresh token
    );

    // Set Refresh Token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token, // Access token for Authorization header
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.Role?.name || 'Staff',
          role_type: user.Role?.type || 'Internal',
          LinkedCustomers: user.LinkedCustomers || [],
          permissions: typeof user.Role?.permissions === 'string' 
            ? JSON.parse(user.Role.permissions || '{}') 
            : (user.Role?.permissions || {})
        }
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
  }
};

/**
 * Handle new user registration (Admin only)
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role_id } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      password_hash: password,
      role_id
    });

    const populated = await User.findByPk(user.id, {
      include: [{ model: Role, attributes: ['name', 'permissions', 'type'] }]
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        id: populated.id,
        name: populated.name,
        email: populated.email,
        role: populated.Role?.name || 'Staff'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * Get current authenticated user profile
 */
exports.me = async (req, res) => {
  // Use the data attached by the verifyToken middleware (already includes Role)
  res.json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.Role?.name || 'No Role',
      role_type: req.user.Role?.type || 'Internal',
      LinkedCustomers: req.user.LinkedCustomers || [],
      permissions: typeof req.user.Role?.permissions === 'string'
        ? JSON.parse(req.user.Role.permissions || '{}')
        : (req.user.Role?.permissions || {})
    }
  });
};

/**
 * Refresh access token
 */
exports.refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token missing' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.Role?.name || 'Staff' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.Role?.name || 'Staff',
          role_type: user.Role?.type || 'Internal',
          LinkedCustomers: user.LinkedCustomers || [],
          permissions: typeof user.Role?.permissions === 'string'
            ? JSON.parse(user.Role.permissions || '{}')
            : (user.Role?.permissions || {})
        }
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

/**
 * Logout - Clear cookies
 */
exports.logout = async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * Handle password change
 */
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    
    if (!(await user.validatePassword(oldPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid old password.'
      });
    }

    user.password_hash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

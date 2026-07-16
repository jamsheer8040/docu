const { body } = require('express-validator');

exports.validateServiceType = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Service name is required')
    .isLength({ max: 150 }).withMessage('Name too long (max 150)'),
  body('cost_price')
    .isFloat({ min: 0 }).withMessage('Cost price must be numeric'),
  body('pricing_mode')
    .isIn(['Single', 'Multi']).withMessage('Invalid pricing mode'),
  body('pricing')
    .isArray({ min: 1 }).withMessage('Pricing information is required'),
  body('pricing.*.pricing_type')
    .isIn(['Single', 'Normal', 'Prime', 'Prime+']).withMessage('Invalid pricing type'),
  body('pricing.*.selling_price')
    .isFloat({ min: 0 }).withMessage('Selling price must be numeric'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('Invalid active status')
];

exports.validateServiceOrder = [
  body('customer_id')
    .notEmpty().withMessage('Customer is required')
    .isNumeric().withMessage('Invalid customer ID'),
  body('service_type_id')
    .notEmpty().withMessage('Service type is required')
    .isNumeric().withMessage('Invalid service type ID'),
  body('notes')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 }).withMessage('Notes too long (max 500)')
];

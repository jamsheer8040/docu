const { body } = require('express-validator');

exports.taxValidator = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Tax name is required')
    .isLength({ max: 100 }).withMessage('Tax name cannot exceed 100 characters'),
  body('rate')
    .isNumeric().withMessage('Tax rate must be a number')
    .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('is_active')
    .optional()
    .isBoolean()
];

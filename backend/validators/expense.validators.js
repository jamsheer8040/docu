const { body } = require('express-validator');

exports.createExpenseValidator = [
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 3, max: 200 }).withMessage('Description must be 3-200 characters'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category too long'),
  
  body('sub_category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Sub Category too long'),
  
  body('status')
    .optional()
    .isIn(['Paid', 'Unpaid']).withMessage('Invalid status'),
  
  body('account_id')
    .if(body('status').equals('Paid'))
    .notEmpty().withMessage('Account is required when marking as Paid'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
];

exports.updateExpenseValidator = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Description must be 3-200 characters'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category too long'),
  
  body('sub_category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Sub Category too long'),
  
  body('status')
    .optional()
    .isIn(['Paid', 'Unpaid']).withMessage('Invalid status'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
];

exports.markPaidValidator = [
  body('account_id')
    .notEmpty().withMessage('Wallet Account is required'),
  
  body('payment_date')
    .optional()
    .isISO8601().withMessage('Invalid payment date format')
];

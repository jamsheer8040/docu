const { body } = require('express-validator');

exports.createInvoiceValidator = [
  body('customer_id')
    .isInt()
    .withMessage('A valid Customer ID is required')
    .custom(async (id) => {
      const { Customer } = require('../models');
      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw new Error('Selected customer does not exist');
      }
      return true;
    }),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Invoice must contain at least one item'),
  
  body('items.*.description')
    .notEmpty()
    .withMessage('Item description is required'),
  
  body('items.*.quantity')
    .isFloat({ min: 0.1 })
    .withMessage('Item quantity must be greater than 0'),
  
  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Item unit price must be 0 or more'),
  
  body('discount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount cannot be negative'),
  
  body('tax')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Tax cannot be negative'),
    
  body('due_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid due date format')
];

exports.updateInvoiceStatusValidator = [
  body('status')
    .isIn(['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'])
    .withMessage('Invalid status'),
  
  body('account_id')
    .if(body('status').equals('Paid'))
    .notEmpty()
    .withMessage('Wallet account is required when marking as Paid')
];

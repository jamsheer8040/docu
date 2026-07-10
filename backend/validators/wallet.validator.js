const { body } = require('express-validator');

exports.transferValidator = [
  body('from_account_id')
    .isInt()
    .withMessage('Source account is required'),
  
  body('to_account_id')
    .isInt()
    .custom((value, { req }) => {
      if (value === parseInt(req.body.from_account_id)) {
        throw new Error('Source and destination accounts must be different');
      }
      return true;
    }),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Transfer amount must be greater than 0'),
  
  body('description')
    .optional()
    .isString()
    .trim()
];

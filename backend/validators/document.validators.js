const { body } = require('express-validator');
const Customer = require('../models/Customer');

exports.createDocumentValidator = [
  body('customer_id')
    .notEmpty().withMessage('Customer is required')
    .isInt().withMessage('Customer ID must be an integer'),
  body('type')
    .optional({ checkFalsy: true })
    .trim()
    .escape(),
  body('document_type_id')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Document type must be a valid ID'),
  body('doc_number')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 100 }).withMessage('Document number cannot exceed 100 characters'),
  body('issue_date')
    .optional({ checkFalsy: true })
    .isDate().withMessage('Invalid issue date format'),
  body('expiry_date')
    .notEmpty().withMessage('Expiry date is required')
    .isDate().withMessage('Invalid expiry date format')
    .custom((value, { req }) => {
      if (req.body.issue_date && new Date(value) <= new Date(req.body.issue_date)) {
        throw new Error('Expiry date must be after issue date');
      }
      return true;
    }),
  body('staff_name')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 255 }).withMessage('Staff name cannot exceed 255 characters'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

exports.updateDocumentValidator = exports.createDocumentValidator;

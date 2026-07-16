const { body } = require('express-validator');

exports.customerValidator = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 150 }).withMessage('Name must be between 2 and 150 characters'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Please provide a valid email'),
  body('phone_whatsapp')
    .trim()
    .escape()
    .notEmpty().withMessage('Phone/WhatsApp is required')
    .matches(/^\+?[1-9]\d{7,14}$/).withMessage('Phone must be in international format (e.g. +971501234567)'),
  body('city')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 100 }),
  body('country')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 100 }),
  body('trade_license_no')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 50 }),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ max: 500 }),
  body('pricing_category')
    .optional()
    .isIn(['Normal', 'Prime', 'Prime+']).withMessage('Invalid pricing category')
];

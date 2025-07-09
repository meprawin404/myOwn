const { body, param, validationResult } = require('express-validator');
const { sendErrorResponse } = require('../utils/responseFormat');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendErrorResponse(
            res, 
            400, 
            'Validation Error', 
            'Please check your input',
            errors.array()
        );
    }
    next();
};

// User validation rules
const validateSignup = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters'),
    body('role')
        .isIn(['Tenant', 'Landlord', 'Enterprise'])
        .withMessage('Invalid role. Must be Tenant, Landlord, or Enterprise'),
    handleValidationErrors
];

const validateSignin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

const validateOTP = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('OTP must be a 6-digit number'),
    handleValidationErrors
];

const validateResetPassword = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    handleValidationErrors
];

const validateEmail = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    handleValidationErrors
];

const validateRole = [
    body('role')
        .isIn(['Tenant', 'Landlord', 'Enterprise'])
        .withMessage('Invalid role. Must be Tenant, Landlord, or Enterprise'),
    handleValidationErrors
];

const validateObjectId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    handleValidationErrors
];

// Property validation
const validateProperty = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    body('price')
        .isNumeric()
        .isFloat({ min: 1 })
        .withMessage('Price must be a positive number'),
    body('location')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Location must be between 2 and 100 characters'),
    body('amenities')
        .optional()
        .isArray()
        .withMessage('Amenities must be an array'),
    handleValidationErrors
];

// Booking validation
const validateBooking = [
    body('propertyId')
        .isMongoId()
        .withMessage('Invalid property ID'),
    body('startDate')
        .isISO8601()
        .withMessage('Start date must be in valid ISO format'),
    body('endDate')
        .isISO8601()
        .withMessage('End date must be in valid ISO format')
        .custom((endDate, { req }) => {
            if (new Date(endDate) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    handleValidationErrors
];

module.exports = {
    validateSignup,
    validateSignin,
    validateOTP,
    validateResetPassword,
    validateEmail,
    validateRole,
    validateObjectId,
    validateProperty,
    validateBooking
};
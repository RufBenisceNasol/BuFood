const { body } = require('express-validator');

const registerValidation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),

    body('email')
        .isEmail().withMessage('Please enter a valid email'),

    body('contactNumber')
        .notEmpty().withMessage('Contact number is required')
        .isMobilePhone().withMessage('Invalid contact number'),

    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('role')
        .optional()
        .isIn(['Customer', 'Seller']).withMessage('Invalid role'),
];

const loginValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

const resendVerificationValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const checkVerificationValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const forgotPasswordValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const resetPasswordValidation = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
];

module.exports = {
    registerValidation,
    loginValidation,
    resendVerificationValidation,
    checkVerificationValidation,
    forgotPasswordValidation,
    resetPasswordValidation
};

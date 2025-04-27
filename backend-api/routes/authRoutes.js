const express = require('express');
const { 
    register, 
    login, 
    logout,
    verifyEmail, 
    getMe, 
    resendVerificationEmail, 
    checkEmailVerificationStatus,
    forgotPassword,
    resetPassword,
    refreshToken
} = require('../controllers/authController');
const { 
    registerValidation, 
    loginValidation, 
    resendVerificationValidation, 
    checkVerificationValidation,
    resetPasswordValidation,
    forgotPasswordValidation
} = require('../middlewares/validators/authValidator');
const handleValidation = require('../middlewares/validators/handleValidation');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, contactNumber]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Customer, Seller]
 */
router.post('/register', registerValidation, handleValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 */
router.post('/login', loginValidation, handleValidation, login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, logout);

router.get('/verify/:token', verifyEmail);
router.get('/me', authenticate, getMe);
router.post('/resend-verification', resendVerificationValidation, handleValidation, resendVerificationEmail);
router.post('/check-verification', checkVerificationValidation, handleValidation, checkEmailVerificationStatus);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 */
router.post('/forgot-password', forgotPasswordValidation, handleValidation, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with token
 */
router.post('/reset-password', resetPasswordValidation, handleValidation, resetPassword);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Get new access token using refresh token
 */
router.post('/refresh-token', refreshToken);

module.exports = router;

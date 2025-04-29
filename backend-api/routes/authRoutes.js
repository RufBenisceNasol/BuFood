const express = require('express');
const { register, login, verifyEmail, getMe, resendVerificationEmail, checkEmailVerificationStatus, updateProfile } = require('../controllers/authController');
const { registerValidation, loginValidation, resendVerificationValidation, checkVerificationValidation } = require('../middlewares/validators/authValidator');
const handleValidation = require('../middlewares/validators/handleValidation');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route for user registration with validation
router.post('/register', registerValidation, handleValidation, register);

// Route for user login with validation
router.post('/login', loginValidation, handleValidation, login);

// Route for email verification using token
router.get('/verify/:token', verifyEmail);

// 🔐 Protected route to get the current logged-in user
router.get('/me', authenticate, getMe);

// 🔐 Protected route to update user profile
router.put('/profile', authenticate, updateProfile);

// Route for resending the verification email (with validation)
router.post('/resend-verification', resendVerificationValidation, handleValidation, resendVerificationEmail);

// Route for checking the email verification status (with validation)
router.post('/check-verification', checkVerificationValidation, handleValidation, checkEmailVerificationStatus);

module.exports = router;

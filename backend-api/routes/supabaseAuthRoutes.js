const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout,
  verifyEmail,
  resendVerificationEmail,
  checkEmailVerificationStatus,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken,
  updateProfile,
  uploadProfileImage
} = require('../controllers/supabaseAuthController');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
// Import multer instance and create a single-file middleware for field name 'image'
const profileImageUpload = require('../middlewares/uploadProfileImage');
const profileImageUploadMiddleware = profileImageUpload.single('image');

/**
 * @swagger
 * /api/auth/supabase/register:
 *   post:
 *     summary: Register a new user with Supabase authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - contactNumber
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Customer, Seller]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/supabase/login:
 *   post:
 *     summary: Login with Supabase authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/supabase/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticateWithSupabase, logout);

/**
 * @swagger
 * /api/auth/supabase/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/supabase/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification email resent
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @swagger
 * /api/auth/supabase/check-verification:
 *   post:
 *     summary: Check email verification status
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification status retrieved
 */
router.post('/check-verification', checkEmailVerificationStatus);

/**
 * @swagger
 * /api/auth/supabase/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateWithSupabase, getMe);

/**
 * @swagger
 * /api/auth/supabase/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/supabase/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', authenticateWithSupabase, resetPassword);

/**
 * @swagger
 * /api/auth/supabase/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/supabase/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateWithSupabase, updateProfile);

/**
 * @swagger
 * /api/auth/supabase/profile/image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded
 */
router.post('/profile/image', authenticateWithSupabase, profileImageUploadMiddleware, uploadProfileImage);

module.exports = router;

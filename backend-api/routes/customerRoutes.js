const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerProfile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         contactNumber:
 *           type: string
 */

const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const handleValidation = require('../middlewares/validators/handleValidation');

const {
  getCustomerProfile,
  getAllStoresForCustomer,
  viewStore,
} = require('../controllers/customerController');
// Unify favorites under Supabase-based favoriteController
const favoriteController = require('../controllers/favoriteController');

/**
 * @swagger
 * /api/customers/profile:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerProfile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 */
router.get('/profile', authenticate, checkRole('Customer'), getCustomerProfile);

/**
 * @swagger
 * /api/customers/favorites/{productId}:
 *   post:
 *     tags: [Customers]
 *     summary: Add a product to customer's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product added to favorites successfully
 *       400:
 *         description: Product already in favorites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 *       404:
 *         description: Product not found
 */
// Unified: Use Supabase auth and favoriteController; map :productId into body
router.post('/favorites/:productId', authenticateWithSupabase, (req, _res, next) => {
  if (!req.body) req.body = {};
  req.body.productId = req.params.productId;
  next();
}, favoriteController.addToFavorites);

/**
 * @swagger
 * /api/customers/favorites/{productId}:
 *   delete:
 *     tags: [Customers]
 *     summary: Remove a product from customer's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from favorites successfully
 *       400:
 *         description: Product not in favorites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 *       404:
 *         description: User not found
 */
// Unified: remove by product via favoriteController route semantics
router.delete('/favorites/:productId', authenticateWithSupabase, (req, _res, next) => {
  // favoriteController exposes removeProductFromFavorites expecting req.params.productId
  next();
}, favoriteController.removeProductFromFavorites);

/**
 * @swagger
 * /api/customers/favorites:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer's favorite products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 favorites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 *       404:
 *         description: User not found
 */
// Unified: get favorites via favoriteController
router.get('/favorites', authenticateWithSupabase, favoriteController.getFavorites);

/**
 * @swagger
 * /api/customers/stores:
 *   get:
 *     tags: [Customers]
 *     summary: Get all stores for customer
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
router.get('/stores', getAllStoresForCustomer);

/**
 * @swagger
 * /api/customers/store/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: View specific store and its products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store details with products
 *       404:
 *         description: Store not found
 */
router.get('/store/:id', viewStore);

module.exports = router;

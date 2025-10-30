// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const { 
  cartLimiter,
  addToCartValidator,
  updateCartValidator,
  removeItemValidator 
} = require('../middlewares/validators/cartValidator');
const {
  addToCart,
  viewCart,
  removeItemFromCart,
  clearCart,
  updateCartItem,
  getCartSummary
} = require('../controllers/cartController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product
 *         quantity:
 *           type: number
 *           description: Quantity of the product
 *     Cart:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *           description: ID of the cart owner
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         total:
 *           type: number
 *           description: Total amount of all items in cart
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: View cart items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 */
// View cart (GET /)
router.get('/', authenticateWithSupabase, cartLimiter, viewCart);

// Add to cart (POST /) — supports plural mount at /api/carts
router.post('/', authenticateWithSupabase, cartLimiter, addToCartValidator, addToCart);

// Update cart item (PUT /) — alias for /update
router.put('/', authenticateWithSupabase, cartLimiter, updateCartValidator, updateCartItem);

// Clear cart (DELETE /) — alias for /clear
router.delete('/', authenticateWithSupabase, cartLimiter, clearCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
// Backward-compatible: POST /add
router.post('/add', authenticateWithSupabase, cartLimiter, addToCartValidator, addToCart);

/**
 * @swagger
 * /api/cart/summary:
 *   get:
 *     tags: [Cart]
 *     summary: Get cart summary (total items and amount)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart summary retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', authenticateWithSupabase, cartLimiter, getCartSummary);

/**
 * @swagger
 * /api/cart/remove:
 *   post:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       401:
 *         description: Unauthorized
 */
router.post('/remove', authenticateWithSupabase, cartLimiter, removeItemValidator, removeItemFromCart);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/clear', authenticateWithSupabase, cartLimiter, clearCart);

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/update', authenticateWithSupabase, cartLimiter, updateCartValidator, updateCartItem);

module.exports = router;

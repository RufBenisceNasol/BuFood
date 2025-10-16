const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  validateCart,
  getCartCount,
} = require('../controllers/cartControllerWithChoices');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');

/**
 * @swagger
 * /api/carts:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart with variant selections
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
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               variantSelections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variant:
 *                       type: string
 *                     choice:
 *                       type: string
 *                     image:
 *                       type: string
 *               quantity:
 *                 type: number
 *               selectedOptions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/', authenticateWithSupabase, addToCart);

/**
 * @swagger
 * /api/carts:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', authenticateWithSupabase, getCart);

/**
 * @swagger
 * /api/carts/count:
 *   get:
 *     tags: [Cart]
 *     summary: Get cart item count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart count retrieved
 */
router.get('/count', authenticateWithSupabase, getCartCount);

/**
 * @swagger
 * /api/carts/validate:
 *   post:
 *     tags: [Cart]
 *     summary: Validate cart before checkout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart validation result
 */
router.post('/validate', authenticateWithSupabase, validateCart);

/**
 * @swagger
 * /api/carts/items/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/items/:itemId', authenticateWithSupabase, updateCartItem);

/**
 * @swagger
 * /api/carts/items/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/items/:itemId', authenticateWithSupabase, removeCartItem);

/**
 * @swagger
 * /api/carts:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', authenticateWithSupabase, clearCart);

module.exports = router;

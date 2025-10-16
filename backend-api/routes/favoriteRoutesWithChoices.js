const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  checkFavorite,
  clearFavorites,
  moveToCart,
} = require('../controllers/favoriteControllerWithChoices');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     tags: [Favorites]
 *     summary: Add product to favorites with variant selections
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
 *               variantSelections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variant:
 *                       type: string
 *                     choice:
 *                       type: string
 *     responses:
 *       200:
 *         description: Added to favorites
 */
router.post('/', authenticateWithSupabase, addToFavorites);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Get user's favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved
 */
router.get('/', authenticateWithSupabase, getFavorites);

/**
 * @swagger
 * /api/favorites/check:
 *   get:
 *     tags: [Favorites]
 *     summary: Check if product is favorited
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantSelections
 *         schema:
 *           type: string
 *           description: JSON string of variant selections
 *     responses:
 *       200:
 *         description: Favorite status retrieved
 */
router.get('/check', authenticateWithSupabase, checkFavorite);

/**
 * @swagger
 * /api/favorites/{itemId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove item from favorites
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
 *         description: Removed from favorites
 */
router.delete('/:itemId', authenticateWithSupabase, removeFromFavorites);

/**
 * @swagger
 * /api/favorites/clear:
 *   delete:
 *     tags: [Favorites]
 *     summary: Clear all favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites cleared
 */
router.delete('/clear/all', authenticateWithSupabase, clearFavorites);

/**
 * @swagger
 * /api/favorites/{itemId}/move-to-cart:
 *   post:
 *     tags: [Favorites]
 *     summary: Move favorite item to cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Added to cart from favorites
 */
router.post('/:itemId/move-to-cart', authenticateWithSupabase, moveToCart);

module.exports = router;

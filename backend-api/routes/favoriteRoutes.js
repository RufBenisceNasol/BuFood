const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  removeProductFromFavorites,
  checkFavorite,
  clearFavorites,
} = require('../controllers/favoriteController');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     tags: [Favorites]
 *     summary: Add product to favorites
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
 *               variantId:
 *                 type: string
 *               variantName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to favorites successfully
 *       400:
 *         description: Already in favorites
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
 *         description: Favorites retrieved successfully
 */
router.get('/', authenticateWithSupabase, getFavorites);

/**
 * @swagger
 * /api/favorites/{itemId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove item from favorites by item ID
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
 * /api/favorites/product/{productId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove product from favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed from favorites
 */
router.delete('/product/:productId', authenticateWithSupabase, removeProductFromFavorites);

/**
 * @swagger
 * /api/favorites/check/{productId}:
 *   get:
 *     tags: [Favorites]
 *     summary: Check if product is in favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite status retrieved
 */
router.get('/check/:productId', authenticateWithSupabase, checkFavorite);

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

module.exports = router;

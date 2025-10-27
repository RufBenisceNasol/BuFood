const express = require('express');
const router = express.Router();
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const favoriteController = require('../controllers/favoriteController');

// All routes protected by Supabase middleware which populates req.user (Mongo user)
router.post('/', authenticateWithSupabase, favoriteController.addToFavorites);
router.get('/', authenticateWithSupabase, favoriteController.getFavorites);
router.delete('/:itemId', authenticateWithSupabase, favoriteController.removeFromFavorites);
router.delete('/product/:productId', authenticateWithSupabase, favoriteController.removeProductFromFavorites);
router.get('/check/:productId', authenticateWithSupabase, favoriteController.checkFavorite);
router.delete('/clear', authenticateWithSupabase, favoriteController.clearFavorites);

module.exports = router;

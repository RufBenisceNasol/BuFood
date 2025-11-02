const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const { listProductReviews, createProductReview } = require('../controllers/reviewController');

// Public: list reviews for a product
router.get('/products/:productId/reviews', listProductReviews);

// Authenticated: create a review for a product (Supabase-authenticated)
router.post('/products/:productId/reviews', authenticateWithSupabase, createProductReview);

module.exports = router;

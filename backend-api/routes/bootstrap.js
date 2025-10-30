const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

// Models
const Cart = require('../models/cartModel');
const Conversation = require('../models/Conversation');
const Favorite = require('../models/favoriteModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const Store = require('../models/storeModel');

// GET /api/bootstrap
// Aggregates initial data for the authenticated user
router.get('/bootstrap', async (req, res) => {
  try {
    const supabaseUser = req.user;
    if (!supabaseUser?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Resolve the MongoDB User by Supabase ID
    const User = require('../models/userModel');
    const userDoc = await User.findOne({ supabaseId: supabaseUser.id }).select('_id supabaseId role');
    if (!userDoc) {
      // If app hasn't created a User document yet, return empty aggregates
      return res.json({
        cart: { items: [], total: 0 },
        conversations: [],
        favorites: { items: [] },
        orders: [],
        products: await Product.find({}).sort({ createdAt: -1 }).limit(24).lean(),
        reviews: [],
        stores: await Store.find({}).sort({ createdAt: -1 }).limit(50).lean(),
      });
    }
    const userObjectId = userDoc._id;

    // Pagination defaults to keep payload small
    const productLimit = Math.min(Number(req.query.productLimit) || 24, 100);
    const reviewLimit = Math.min(Number(req.query.reviewLimit) || 20, 200);
    const convLimit = Math.min(Number(req.query.conversationLimit) || 50, 200);
    const orderLimit = Math.min(Number(req.query.orderLimit) || 50, 200);
    const storeLimit = Math.min(Number(req.query.storeLimit) || 50, 200);

    // If your schemas store user as ObjectId, you likely have a User doc with supabaseId.
    // For now, try both direct string match and fallback noop where applicable.

    const [
      cart,
      conversations,
      favoritesDoc,
      orders,
      products,
      reviews,
      stores,
    ] = await Promise.all([
      Cart.findOne({ user: userObjectId }).lean(),
      Conversation.find({ participants: userObjectId })
        .sort({ updatedAt: -1 })
        .limit(convLimit)
        .lean(),
      Favorite.findOne({ user: userObjectId }).lean(),
      Order.find({ customer: userObjectId })
        .sort({ createdAt: -1 })
        .limit(orderLimit)
        .lean(),
      Product.find({})
        .sort({ createdAt: -1 })
        .limit(productLimit)
        .lean(),
      Review.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .limit(reviewLimit)
        .lean(),
      Store.find({})
        .sort({ createdAt: -1 })
        .limit(storeLimit)
        .lean(),
    ]);

    res.json({
      cart: cart || { items: [], total: 0 },
      conversations: conversations || [],
      favorites: favoritesDoc || { items: [] },
      orders: orders || [],
      products: products || [],
      reviews: reviews || [],
      stores: stores || [],
    });
  } catch (err) {
    console.error('Bootstrap fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch bootstrap data' });
  }
});

module.exports = router;

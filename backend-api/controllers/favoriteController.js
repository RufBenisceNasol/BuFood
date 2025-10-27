const Favorite = require('../models/favoriteModel');
const Product = require('../models/productModel');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Add product to favorites
 * POST /api/favorites
 */
const addToFavorites = async (req, res) => {
  try {
    let userId;

    // Decode Supabase token locally (no upstream call)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        userId = decoded.sub; // Supabase user ID
      }
    }

    // If we decoded a Supabase user id (UUID), resolve to Mongo user _id without calling Supabase
    if (userId && typeof userId === 'string') {
      const mapped = await User.findOne({ supabaseId: userId }).select('_id');
      if (mapped) userId = mapped._id;
      else userId = null; // force unauthorized below if mapping not found
    }

    // Fallback to middleware user (Mongo user _id) if available
    if (!userId && req.user?._id) userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: No valid user found' 
      });
    }

    const { productId, variantId, variantName, selectedVariant } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create favorites list for user
    let favorites = await Favorite.findOne({ user: userId });
    if (!favorites) {
      favorites = new Favorite({ user: userId, items: [] });
    }

    // Check if product (with same variant) already in favorites
    const exists = favorites.items.find(item => {
      if (item.product.toString() !== productId) return false;
      // Prefer strict variantId match when provided
      if ((variantId || null) === (item.variantId || null)) return true;
      // Fallback: compare selectedVariant names when variantId not available
      const a = selectedVariant || {};
      const b = item.selectedVariant || {};
      const aKey = `${a.variantName || ''}::${a.optionName || ''}`;
      const bKey = `${b.variantName || ''}::${b.optionName || ''}`;
      return aKey && aKey.length > 2 && aKey === bKey;
    });

    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'This item is already in your favorites' 
      });
    }

    // Add to favorites (include variant snapshot if provided)
    favorites.items.push({
      product: productId,
      variantId: variantId || null,
      variantName: variantName || null,
      selectedVariant: selectedVariant ? {
        variantName: selectedVariant.variantName || null,
        optionName: selectedVariant.optionName || null,
        price: typeof selectedVariant.price === 'number' ? selectedVariant.price : undefined,
        image: selectedVariant.image || null,
      } : undefined,
    });

    await favorites.save();
    await favorites.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Added to favorites',
      data: favorites,
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
      error: error.message,
    });
  }
};

/**
 * Get user's favorites
 * GET /api/favorites
 */
const getFavorites = async (req, res) => {
  try {
    let userId = null;
    // Try middleware user first
    if (req.user?._id) {
      userId = req.user._id;
    } else {
      // Attempt local decode and map to Mongo user id
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded?.sub) {
          const mapped = await User.findOne({ supabaseId: decoded.sub }).select('_id');
          if (mapped) userId = mapped._id;
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const favorites = await Favorite.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name description price image category variants sellerId storeId availability'
      });

    if (!favorites) {
      return res.status(200).json({
        success: true,
        data: { user: userId, items: [] },
      });
    }

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message 
    });
  }
};

/**
 * Remove item from favorites
 * DELETE /api/favorites/:itemId
 */
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const favorites = await Favorite.findOne({ user: userId });

    if (!favorites) {
      return res.status(404).json({ 
        success: false,
        message: 'Favorites list not found' 
      });
    }

    // Remove item
    favorites.items = favorites.items.filter(
      item => item._id.toString() !== itemId
    );

    await favorites.save();

    res.status(200).json({
      success: true,
      message: 'Removed from favorites',
      data: favorites,
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message 
    });
  }
};

/**
 * Remove product from favorites (by productId and optional variantId)
 * DELETE /api/favorites/product/:productId
 */
const removeProductFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { variantId } = req.query;

    const favorites = await Favorite.findOne({ user: userId });

    if (!favorites) {
      return res.status(404).json({ 
        success: false,
        message: 'Favorites list not found' 
      });
    }

    // Remove product (optionally matching variant)
    favorites.items = favorites.items.filter(item => {
      if (item.product.toString() !== productId) return true;
      if (variantId && item.variantId !== variantId) return true;
      return false;
    });

    await favorites.save();

    res.status(200).json({
      success: true,
      message: 'Removed from favorites',
      data: favorites,
    });
  } catch (error) {
    console.error('Remove product from favorites error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message 
    });
  }
};

/**
 * Check if product is in favorites
 * GET /api/favorites/check/:productId
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { variantId } = req.query;

    const favorites = await Favorite.findOne({ user: userId });

    if (!favorites) {
      return res.status(200).json({
        success: true,
        isFavorite: false,
      });
    }

    const isFavorite = favorites.items.some(item => 
      item.product.toString() === productId && 
      (!variantId || item.variantId === variantId)
    );

    res.status(200).json({
      success: true,
      isFavorite,
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check favorite status',
      error: error.message 
    });
  }
};

/**
 * Clear all favorites
 * DELETE /api/favorites/clear
 */
const clearFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.findOne({ user: userId });

    if (!favorites) {
      return res.status(404).json({ 
        success: false,
        message: 'Favorites list not found' 
      });
    }

    favorites.items = [];
    await favorites.save();

    res.status(200).json({
      success: true,
      message: 'Favorites cleared',
      data: favorites,
    });
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear favorites',
      error: error.message 
    });
  }
};

module.exports = {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  removeProductFromFavorites,
  checkFavorite,
  clearFavorites,
};

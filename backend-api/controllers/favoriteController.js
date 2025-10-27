const Favorite = require('../models/favoriteModel');
const Product = require('../models/productModel');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Resolve the effective Mongo user _id for favorites operations
const resolveUserId = async (req) => {
  // Prefer middleware-populated Mongo user
  if (req.user && req.user._id) return String(req.user._id);

  // Fallback: decode Supabase token locally and map sub -> Mongo user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.decode(token);
    const supabaseSub = decoded?.sub;
    if (!supabaseSub) return null;
    const mapped = await User.findOne({ supabaseId: supabaseSub }).select('_id');
    return mapped ? String(mapped._id) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Add product to favorites
 * POST /api/favorites
 */
const addToFavorites = async (req, res) => {
  try {
    const userId = await resolveUserId(req);

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
    const userId = await resolveUserId(req);

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
    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
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
    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
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
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(200).json({ success: true, isFavorite: false });
    }
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
    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

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


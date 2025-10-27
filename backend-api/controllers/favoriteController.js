const Favorite = require('../models/favoriteModel');
const Product = require('../models/productModel');

/**
 * Add product to favorites
 * POST /api/favorites
 */
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    // Accept either legacy flat fields or nested selectedVariant
    const selectedVariant = req.body.selectedVariant || req.body.variant || null;
    const legacyVariantId = req.body.variantId || null;
    const legacyVariantName = req.body.variantName || null;

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
    const existingIndex = favorites.items.findIndex(item => {
      if (item.product.toString() !== productId) return false;
      const a = item.selectedVariant || {};
      const b = selectedVariant || {};
      // Prefer variantId for strict equality when present
      if ((a.variantId || null) || (legacyVariantId || b.variantId || null)) {
        return (a.variantId || null) === (legacyVariantId || b.variantId || null);
      }
      // Fallback to name/option match if no variantId provided
      const aKey = `${a.variantName || ''}||${a.optionName || ''}`;
      const bKey = `${legacyVariantName || b.variantName || ''}||${b.optionName || ''}`;
      return aKey === bKey;
    });

    if (existingIndex !== -1) {
      return res.status(400).json({ 
        message: 'This item is already in your favorites',
        success: false 
      });
    }

    // Build selectedVariant payload
    const sv = selectedVariant ? {
      variantId: selectedVariant.variantId || legacyVariantId || null,
      variantName: selectedVariant.variantName || legacyVariantName || null,
      optionName: selectedVariant.optionName || null,
      image: selectedVariant.image || null,
      price: typeof selectedVariant.price === 'number' ? selectedVariant.price : null,
    } : {
      variantId: legacyVariantId || null,
      variantName: legacyVariantName || null,
      optionName: null,
      image: null,
      price: null,
    };

    // Add to favorites
    favorites.items.push({
      product: productId,
      selectedVariant: sv,
    });

    await favorites.save();

    // Populate product details
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
      error: error.message 
    });
  }
};

/**
 * Get user's favorites
 * GET /api/favorites
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

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
    const { variantId, variantName, optionName } = req.query;

    const favorites = await Favorite.findOne({ user: userId });

    if (!favorites) {
      return res.status(404).json({ 
        success: false,
        message: 'Favorites list not found' 
      });
    }

    // Remove product (optionally matching variant). Support nested selectedVariant
    favorites.items = favorites.items.filter(item => {
      if (item.product.toString() !== productId) return true;
      const sv = item.selectedVariant || {};
      if (variantId) return sv.variantId !== variantId; // keep if not matching
      if (variantName || optionName) {
        const aKey = `${sv.variantName || ''}||${sv.optionName || ''}`;
        const bKey = `${variantName || ''}||${optionName || ''}`;
        return aKey !== bKey; // keep if not equal
      }
      // No specific variant provided: remove all for this product
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

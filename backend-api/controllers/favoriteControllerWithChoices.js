const Favorite = require('../models/favoriteModelWithChoices');
const Product = require('../models/productModelWithChoices');

/**
 * DEEP LOGIC: Add to favorites
 * POST /api/favorites
 * 
 * Flow:
 * 1. Validate product exists
 * 2. Validate variant selections (if any)
 * 3. Calculate display info (name, image, price)
 * 4. Get or create favorites list
 * 5. Add item (check for duplicates)
 * 6. Save and return favorites
 */
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantSelections } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate variant selections if product has variants
    if (product.variants && product.variants.length > 0 && variantSelections) {
      const validation = product.validateSelections(variantSelections);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid variant selections',
          errors: validation.errors,
        });
      }
    }

    // Calculate display info
    let displayName = product.name;
    let displayImage = product.image;
    let displayPrice = product.basePrice;

    if (variantSelections && variantSelections.length > 0) {
      // Add variant info to display name
      const variantNames = variantSelections.map(v => v.choice).join(', ');
      displayName = `${product.name} - ${variantNames}`;

      // Use first variant's image if available
      const firstSelection = variantSelections[0];
      const variant = product.variants.find(v => v.name === firstSelection.variant);
      if (variant) {
        const choice = variant.choices.find(c => c.name === firstSelection.choice);
        if (choice) {
          if (choice.image) displayImage = choice.image;
          displayPrice = choice.price;
        }
      }

      // Calculate full price
      displayPrice = product.calculatePrice(variantSelections);
    }

    // Get or create favorites
    const favorites = await Favorite.getOrCreate(userId);

    // Add item
    const result = favorites.addItem({
      product: productId,
      variantSelections: variantSelections || [],
      displayName,
      displayImage,
      displayPrice,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Save
    await favorites.save();

    // Populate
    await favorites.populate('items.product');

    res.status(200).json({
      success: true,
      message: result.message,
      favorites,
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
 * DEEP LOGIC: Get favorites
 * GET /api/favorites
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name description image basePrice variants category availability',
      });

    if (!favorites) {
      return res.status(200).json({
        success: true,
        favorites: {
          user: userId,
          items: [],
          itemCount: 0,
        },
      });
    }

    // Validate items
    const validation = await favorites.validateItems();

    res.status(200).json({
      success: true,
      favorites,
      validation,
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorites',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Remove from favorites
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
        message: 'Favorites not found',
      });
    }

    const result = favorites.removeItem(itemId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    await favorites.save();
    await favorites.populate('items.product');

    res.status(200).json({
      success: true,
      message: result.message,
      favorites,
    });

  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Check if favorited
 * GET /api/favorites/check
 * 
 * Query params: productId, variantSelections (JSON string)
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantSelections } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const favorites = await Favorite.findOne({ user: userId });
    
    if (!favorites) {
      return res.status(200).json({
        success: true,
        isFavorited: false,
      });
    }

    // Parse variant selections if provided
    let selections = [];
    if (variantSelections) {
      try {
        selections = JSON.parse(variantSelections);
      } catch (e) {
        selections = [];
      }
    }

    const isFavorited = favorites.isFavorited(productId, selections);

    res.status(200).json({
      success: true,
      isFavorited,
    });

  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Clear all favorites
 * DELETE /api/favorites/clear
 */
const clearFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.findOne({ user: userId });
    if (!favorites) {
      return res.status(404).json({
        success: false,
        message: 'Favorites not found',
      });
    }

    favorites.items = [];
    await favorites.save();

    res.status(200).json({
      success: true,
      message: 'Favorites cleared',
      favorites,
    });

  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear favorites',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Move favorite to cart
 * POST /api/favorites/:itemId/move-to-cart
 * 
 * Convenience endpoint to add favorited item directly to cart
 */
const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity = 1 } = req.body;

    const favorites = await Favorite.findOne({ user: userId });
    if (!favorites) {
      return res.status(404).json({
        success: false,
        message: 'Favorites not found',
      });
    }

    const item = favorites.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Favorite item not found',
      });
    }

    // Get product
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product no longer available',
      });
    }

    // Validate and check stock
    const validation = product.validateSelections(item.variantSelections);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Product variant no longer available',
        errors: validation.errors,
      });
    }

    const stockCheck = product.checkStock(item.variantSelections, quantity);
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
      });
    }

    // Add to cart (use cart controller logic)
    const Cart = require('../models/cartModelWithChoices');
    const cart = await Cart.getOrCreate(userId);

    const price = product.calculatePrice(item.variantSelections);
    const productSnapshot = {
      name: product.name,
      image: item.displayImage,
      basePrice: product.basePrice,
    };

    cart.addItem({
      product: item.product,
      variantSelections: item.variantSelections,
      price,
      quantity,
      productSnapshot,
    });

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Added to cart from favorites',
      cart,
    });

  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move to cart',
      error: error.message,
    });
  }
};

module.exports = {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  checkFavorite,
  clearFavorites,
  moveToCart,
};

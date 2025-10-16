const Cart = require('../models/cartModelWithChoices');
const Product = require('../models/productModelWithChoices');

/**
 * DEEP LOGIC: Add item to cart
 * POST /api/carts
 * 
 * Flow:
 * 1. Validate product exists
 * 2. Validate variant selections are complete and valid
 * 3. Check stock availability
 * 4. Calculate price based on selections
 * 5. Get or create user's cart
 * 6. Add item (or update quantity if duplicate)
 * 7. Save cart and return updated cart
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantSelections, quantity = 1, selectedOptions } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    // 1. Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 2. Validate variant selections
    if (product.variants && product.variants.length > 0) {
      const validation = product.validateSelections(variantSelections || []);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid variant selections',
          errors: validation.errors,
        });
      }
    }

    // 3. Check stock availability
    const stockCheck = product.checkStock(variantSelections || [], quantity);
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
      });
    }

    // 4. Calculate price
    const price = product.calculatePrice(variantSelections || []);

    // 5. Create product snapshot
    const productSnapshot = {
      name: product.name,
      image: product.image,
      basePrice: product.basePrice,
    };

    // If variant has image, use that as primary
    if (variantSelections && variantSelections.length > 0) {
      const firstSelection = variantSelections[0];
      const variant = product.variants.find(v => v.name === firstSelection.variant);
      if (variant) {
        const choice = variant.choices.find(c => c.name === firstSelection.choice);
        if (choice && choice.image) {
          productSnapshot.image = choice.image;
        }
      }
    }

    // 6. Get or create cart
    const cart = await Cart.getOrCreate(userId);

    // 7. Add item to cart
    const result = cart.addItem({
      product: productId,
      variantSelections: variantSelections || [],
      selectedOptions,
      price,
      quantity,
      productSnapshot,
    });

    // 8. Save cart
    await cart.save();

    // 9. Populate product details
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action,
      cart,
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to cart',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Get user's cart
 * GET /api/carts
 * 
 * Flow:
 * 1. Get cart for user
 * 2. Validate all items (check if products/variants still exist and available)
 * 3. Return cart with validation results
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get cart
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name description image basePrice variants category availability',
      });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          user: userId,
          items: [],
          total: 0,
          itemCount: 0,
        },
      });
    }

    // Validate cart items
    const validation = await cart.validateItems();

    res.status(200).json({
      success: true,
      cart,
      validation,
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Update cart item quantity
 * PUT /api/carts/items/:itemId
 * 
 * Flow:
 * 1. Find cart
 * 2. Find item in cart
 * 3. Get product and validate stock for new quantity
 * 4. Update quantity
 * 5. Save and return cart
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative',
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // Find item
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // If quantity > 0, validate stock
    if (quantity > 0) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product no longer available',
        });
      }

      const stockCheck = product.checkStock(item.variantSelections, quantity);
      if (!stockCheck.available) {
        return res.status(400).json({
          success: false,
          message: stockCheck.message,
        });
      }
    }

    // Update quantity
    const result = cart.updateItemQuantity(itemId, quantity);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Save cart
    await cart.save();

    // Populate
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action,
      cart,
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Remove item from cart
 * DELETE /api/carts/items/:itemId
 */
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const result = cart.removeItem(itemId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: result.message,
      cart,
    });

  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Clear entire cart
 * DELETE /api/carts
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Validate cart before checkout
 * POST /api/carts/validate
 * 
 * Comprehensive validation:
 * 1. Check all products exist
 * 2. Check all variants are available
 * 3. Check stock for all items
 * 4. Check if prices changed
 * 5. Return detailed validation report
 */
const validateCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    const validation = await cart.validateItems();
    const priceChanges = [];

    // Check for price changes
    for (const item of cart.items) {
      if (item.product) {
        const currentPrice = item.product.calculatePrice(item.variantSelections);
        if (currentPrice !== item.price) {
          priceChanges.push({
            itemId: item._id,
            productName: item.productSnapshot.name,
            oldPrice: item.price,
            newPrice: currentPrice,
            difference: currentPrice - item.price,
          });
        }
      }
    }

    const isValid = validation.valid && priceChanges.length === 0;

    res.status(200).json({
      success: true,
      valid: isValid,
      validation,
      priceChanges,
      cart,
    });

  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Get cart item count
 * GET /api/carts/count
 */
const getCartCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });

    res.status(200).json({
      success: true,
      count: cart ? cart.itemCount : 0,
    });

  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart count',
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  validateCart,
  getCartCount,
};

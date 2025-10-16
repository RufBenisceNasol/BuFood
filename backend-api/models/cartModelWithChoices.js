const mongoose = require('mongoose');

/**
 * DEEP LOGIC: Cart Item with Variant Selections
 * 
 * Key Design Decisions:
 * 1. Store complete variant selections for each cart item
 * 2. Store snapshot of price at time of adding (prevents price changes from affecting cart)
 * 3. Store snapshot of choice images for display
 * 4. Each unique combination of product + selections = separate cart item
 * 5. Validate stock before allowing add to cart
 */

const variantSelectionSchema = new mongoose.Schema({
  variant: {
    type: String,
    required: true,
    // e.g., "Color", "Size", "Flavor"
  },
  choice: {
    type: String,
    required: true,
    // e.g., "Silver Tube", "Large", "Chocolate"
  },
  choiceId: {
    type: mongoose.Schema.Types.ObjectId,
    // Reference to the specific choice _id for tracking
  },
  image: {
    type: String,
    default: '',
    // Snapshot of choice image at time of adding
  },
  price: {
    type: Number,
    required: true,
    // Snapshot of choice price at time of adding
  },
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  
  // Product snapshot (in case product is deleted)
  productSnapshot: {
    name: { type: String, required: true },
    image: { type: String },
    basePrice: { type: Number },
  },
  
  // Variant selections made by customer
  variantSelections: [variantSelectionSchema],
  
  // Legacy support for simple variants
  selectedVariantId: {
    type: String,
  },
  
  // Free options (no price impact)
  selectedOptions: {
    type: Map,
    of: String,
    default: undefined,
    // e.g., { "Sugar Level": "50%", "Ice": "Normal" }
  },
  
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    required: true,
  },
  
  // Price at time of adding (snapshot)
  price: {
    type: Number,
    required: true,
    min: 0,
    // Unit price with all variant selections applied
  },
  
  subtotal: {
    type: Number,
    required: true,
    // price × quantity
  },
  
  // Metadata
  addedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Track if product/variant was modified after adding to cart
  isModified: {
    type: Boolean,
    default: false,
  },
  
  modificationNote: {
    type: String,
    default: '',
    // e.g., "Product price changed", "Variant out of stock"
  },
});

/**
 * DEEP LOGIC: Generate unique key for cart item
 * 
 * Used to identify if the same product + variant combination already exists
 * 
 * @returns {String} - Unique key like "productId-Color:Silver-Size:Large"
 */
cartItemSchema.methods.generateUniqueKey = function() {
  const productId = this.product.toString();
  const variantKey = this.variantSelections
    .map(v => `${v.variant}:${v.choice}`)
    .sort()
    .join('-');
  
  return `${productId}-${variantKey}`;
};

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    
    items: [cartItemSchema],
    
    total: {
      type: Number,
      required: true,
      default: 0,
      // Sum of all item subtotals
    },
    
    itemCount: {
      type: Number,
      default: 0,
      // Total number of items (sum of quantities)
    },
    
    // Metadata
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    timestamps: true 
  }
);

/**
 * DEEP LOGIC: Pre-save middleware to calculate totals
 * 
 * Automatically recalculate total and itemCount whenever cart is saved
 */
cartSchema.pre('save', function(next) {
  // Recalculate subtotals for each item
  this.items.forEach(item => {
    item.subtotal = item.price * item.quantity;
  });
  
  // Calculate cart total
  this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Calculate item count
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  this.lastModified = new Date();
  
  next();
});

/**
 * DEEP LOGIC: Instance method to add item to cart
 * 
 * Handles duplicate detection and quantity updates
 * 
 * @param {Object} itemData - { product, variantSelections, price, quantity, productSnapshot }
 * @returns {Object} - { success: Boolean, message: String, item: Object }
 */
cartSchema.methods.addItem = function(itemData) {
  const { product, variantSelections, price, quantity, productSnapshot } = itemData;
  
  // Generate unique key for this product + variant combination
  const newItemKey = this._generateItemKey(product, variantSelections);
  
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(item => {
    const existingKey = this._generateItemKey(item.product, item.variantSelections);
    return existingKey === newItemKey;
  });
  
  if (existingItemIndex !== -1) {
    // Item exists, update quantity
    this.items[existingItemIndex].quantity += quantity;
    
    return {
      success: true,
      message: 'Cart updated',
      item: this.items[existingItemIndex],
      action: 'updated',
    };
  } else {
    // New item, add to cart
    const newItem = {
      product,
      productSnapshot,
      variantSelections,
      quantity,
      price,
      subtotal: price * quantity,
    };
    
    this.items.push(newItem);
    
    return {
      success: true,
      message: 'Added to cart',
      item: newItem,
      action: 'added',
    };
  }
};

/**
 * DEEP LOGIC: Helper to generate item key
 * 
 * @private
 */
cartSchema.methods._generateItemKey = function(productId, variantSelections) {
  const prodId = productId.toString();
  const variantKey = (variantSelections || [])
    .map(v => `${v.variant}:${v.choice}`)
    .sort()
    .join('-');
  
  return `${prodId}-${variantKey}`;
};

/**
 * DEEP LOGIC: Instance method to update item quantity
 * 
 * @param {String} itemId - Cart item _id
 * @param {Number} quantity - New quantity
 * @returns {Object} - { success: Boolean, message: String }
 */
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  
  if (!item) {
    return {
      success: false,
      message: 'Item not found in cart',
    };
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.pull(itemId);
    return {
      success: true,
      message: 'Item removed from cart',
      action: 'removed',
    };
  }
  
  item.quantity = quantity;
  item.subtotal = item.price * quantity;
  
  return {
    success: true,
    message: 'Quantity updated',
    action: 'updated',
  };
};

/**
 * DEEP LOGIC: Instance method to remove item
 * 
 * @param {String} itemId - Cart item _id
 * @returns {Object} - { success: Boolean, message: String }
 */
cartSchema.methods.removeItem = function(itemId) {
  const item = this.items.id(itemId);
  
  if (!item) {
    return {
      success: false,
      message: 'Item not found in cart',
    };
  }
  
  this.items.pull(itemId);
  
  return {
    success: true,
    message: 'Item removed from cart',
  };
};

/**
 * DEEP LOGIC: Instance method to clear cart
 */
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.total = 0;
  this.itemCount = 0;
};

/**
 * DEEP LOGIC: Instance method to validate cart items
 * 
 * Checks if products still exist, variants are available, and stock is sufficient
 * Marks items as modified if there are issues
 * 
 * @returns {Object} - { valid: Boolean, issues: Array }
 */
cartSchema.methods.validateItems = async function() {
  const Product = mongoose.model('Product');
  const issues = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      item.isModified = true;
      item.modificationNote = 'Product no longer available';
      issues.push({
        itemId: item._id,
        issue: 'Product deleted',
        action: 'remove',
      });
      continue;
    }
    
    // Validate variant selections
    const validation = product.validateSelections(item.variantSelections);
    if (!validation.valid) {
      item.isModified = true;
      item.modificationNote = validation.errors.join(', ');
      issues.push({
        itemId: item._id,
        issue: validation.errors.join(', '),
        action: 'review',
      });
      continue;
    }
    
    // Check stock
    const stockCheck = product.checkStock(item.variantSelections, item.quantity);
    if (!stockCheck.available) {
      item.isModified = true;
      item.modificationNote = stockCheck.message;
      issues.push({
        itemId: item._id,
        issue: stockCheck.message,
        action: 'reduce_quantity',
      });
    }
  }
  
  if (issues.length > 0) {
    await this.save();
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
};

/**
 * DEEP LOGIC: Static method to get or create cart for user
 * 
 * @param {ObjectId} userId - User ID
 * @returns {Cart} - User's cart
 */
cartSchema.statics.getOrCreate = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [], total: 0 });
  }
  
  return cart;
};

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ lastModified: -1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

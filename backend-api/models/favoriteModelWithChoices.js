const mongoose = require('mongoose');

/**
 * DEEP LOGIC: Favorites with Variant Selections
 * 
 * Key Design Decisions:
 * 1. Allow favoriting specific variant combinations
 * 2. Store variant selections for easy "Add to Cart" from favorites
 * 3. One favorites list per user
 * 4. Support both products with and without variants
 */

const variantSelectionSchema = new mongoose.Schema({
  variant: {
    type: String,
    required: true,
  },
  choice: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
}, { _id: false });

const favoriteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  
  // Variant selections (if any)
  variantSelections: [variantSelectionSchema],
  
  // Quick display info (snapshot)
  displayName: {
    type: String,
    // e.g., "JMCY Mascara - Silver Tube"
  },
  
  displayImage: {
    type: String,
    // Primary image to show (variant choice image or product image)
  },
  
  displayPrice: {
    type: Number,
    // Price at time of favoriting
  },
  
  addedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Track if product/variant was modified
  isAvailable: {
    type: Boolean,
    default: true,
  },
  
  note: {
    type: String,
    default: '',
    // e.g., "Out of stock", "Product removed"
  },
});

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    
    items: [favoriteItemSchema],
    
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true 
  }
);

/**
 * DEEP LOGIC: Pre-save middleware
 */
favoriteSchema.pre('save', function(next) {
  this.itemCount = this.items.length;
  next();
});

/**
 * DEEP LOGIC: Instance method to add item to favorites
 * 
 * @param {Object} itemData - { product, variantSelections, displayName, displayImage, displayPrice }
 * @returns {Object} - { success: Boolean, message: String }
 */
favoriteSchema.methods.addItem = function(itemData) {
  const { product, variantSelections, displayName, displayImage, displayPrice } = itemData;
  
  // Generate unique key
  const newItemKey = this._generateItemKey(product, variantSelections);
  
  // Check if already favorited
  const exists = this.items.some(item => {
    const existingKey = this._generateItemKey(item.product, item.variantSelections);
    return existingKey === newItemKey;
  });
  
  if (exists) {
    return {
      success: false,
      message: 'Already in favorites',
    };
  }
  
  // Add to favorites
  this.items.push({
    product,
    variantSelections,
    displayName,
    displayImage,
    displayPrice,
  });
  
  return {
    success: true,
    message: 'Added to favorites',
  };
};

/**
 * DEEP LOGIC: Helper to generate item key
 * 
 * @private
 */
favoriteSchema.methods._generateItemKey = function(productId, variantSelections) {
  const prodId = productId.toString();
  const variantKey = (variantSelections || [])
    .map(v => `${v.variant}:${v.choice}`)
    .sort()
    .join('-');
  
  return `${prodId}-${variantKey}`;
};

/**
 * DEEP LOGIC: Instance method to remove item
 * 
 * @param {String} itemId - Favorite item _id
 * @returns {Object} - { success: Boolean, message: String }
 */
favoriteSchema.methods.removeItem = function(itemId) {
  const item = this.items.id(itemId);
  
  if (!item) {
    return {
      success: false,
      message: 'Item not found in favorites',
    };
  }
  
  this.items.pull(itemId);
  
  return {
    success: true,
    message: 'Removed from favorites',
  };
};

/**
 * DEEP LOGIC: Instance method to check if item is favorited
 * 
 * @param {ObjectId} productId - Product ID
 * @param {Array} variantSelections - Variant selections
 * @returns {Boolean} - True if favorited
 */
favoriteSchema.methods.isFavorited = function(productId, variantSelections = []) {
  const searchKey = this._generateItemKey(productId, variantSelections);
  
  return this.items.some(item => {
    const itemKey = this._generateItemKey(item.product, item.variantSelections);
    return itemKey === searchKey;
  });
};

/**
 * DEEP LOGIC: Instance method to validate favorites
 * 
 * Check if products/variants are still available
 * 
 * @returns {Object} - { valid: Boolean, issues: Array }
 */
favoriteSchema.methods.validateItems = async function() {
  const Product = mongoose.model('Product');
  const issues = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      item.isAvailable = false;
      item.note = 'Product no longer available';
      issues.push({
        itemId: item._id,
        issue: 'Product deleted',
      });
      continue;
    }
    
    // Validate variant selections
    if (item.variantSelections && item.variantSelections.length > 0) {
      const validation = product.validateSelections(item.variantSelections);
      if (!validation.valid) {
        item.isAvailable = false;
        item.note = validation.errors.join(', ');
        issues.push({
          itemId: item._id,
          issue: validation.errors.join(', '),
        });
      }
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
 * DEEP LOGIC: Static method to get or create favorites for user
 * 
 * @param {ObjectId} userId - User ID
 * @returns {Favorite} - User's favorites
 */
favoriteSchema.statics.getOrCreate = async function(userId) {
  let favorites = await this.findOne({ user: userId });
  
  if (!favorites) {
    favorites = await this.create({ user: userId, items: [] });
  }
  
  return favorites;
};

// Indexes
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ 'items.product': 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

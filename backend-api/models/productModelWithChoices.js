const mongoose = require('mongoose');

/**
 * DEEP LOGIC: Variant Choices Schema
 * 
 * This schema supports dynamic variant categories (e.g., Size, Color, Flavor)
 * where each category has multiple choices with individual pricing, stock, and images.
 * 
 * Key Design Decisions:
 * 1. Variants are categories (e.g., "Size", "Color")
 * 2. Each variant has multiple choices (e.g., "Small", "Large")
 * 3. Each choice has independent price, stock, and image
 * 4. Base price + choice price = final price
 * 5. Stock is tracked per choice, not per product
 */

const variantChoiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g., "3in1 Mascara", "Silver Tube", "Large", "Small"
  },
  image: {
    type: String,
    default: '',
    // Cloudinary URL for this specific choice
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    // This is the ABSOLUTE price for this choice, not an adjustment
    // e.g., 119, 129, 139
  },
  priceAdjustment: {
    type: Number,
    default: 0,
    // Optional: If you want to show "+10" or "-5" relative to base
    // Positive = add to base, Negative = subtract from base
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  sku: {
    type: String,
    default: '',
    // Stock Keeping Unit for inventory tracking
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  // Metadata for tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true }); // Enable _id for each choice

const variantCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g., "Color", "Size", "Flavor", "Add-ons"
  },
  isRequired: {
    type: Boolean,
    default: true,
    // If true, customer MUST select one choice from this category
  },
  allowMultiple: {
    type: Boolean,
    default: false,
    // If true, customer can select multiple choices (e.g., add-ons)
  },
  choices: [variantChoiceSchema],
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    // Base price before any variant selections
    // Can be 0 if all pricing comes from variants
  },
  image: {
    type: String,
    default: 'https://res.cloudinary.com/dflcnd7z3/image/upload/v1744609432/zqmqydo1eeiup3qvv1vh.jpg',
    // Main product image
  },
  category: {
    type: String,
    required: true,
  },
  
  /**
   * VARIANTS STRUCTURE
   * Array of variant categories, each with multiple choices
   * 
   * Example:
   * variants: [
   *   {
   *     name: "Color",
   *     isRequired: true,
   *     allowMultiple: false,
   *     choices: [
   *       { name: "3in1 Mascara", image: "url1", price: 119, stock: 20 },
   *       { name: "Silver Tube", image: "url2", price: 119, stock: 15 }
   *     ]
   *   },
   *   {
   *     name: "Add-ons",
   *     isRequired: false,
   *     allowMultiple: true,
   *     choices: [
   *       { name: "Extra Brush", image: "", price: 20, stock: 50 },
   *       { name: "Mirror", image: "", price: 15, stock: 30 }
   *     ]
   *   }
   * ]
   */
  variants: [variantCategorySchema],
  
  // Legacy support for simple variants (if needed)
  simpleVariants: [
    {
      id: { type: String },
      name: { type: String },
      price: { type: Number, min: 0 },
      image: { type: String },
      stock: { type: Number, min: 0, default: 0 },
      sku: { type: String },
      isAvailable: { type: Boolean, default: true }
    }
  ],
  
  // Optional customization options (free choices)
  options: {
    type: Map,
    of: [String],
    default: undefined,
    // e.g., { "Sugar Level": ["0%", "50%", "100%"], "Ice": ["Less", "Normal", "Extra"] }
  },
  
  // Product-level stock (if no variants)
  stock: {
    type: Number,
    min: 0,
    default: 0,
  },
  
  availability: {
    type: String,
    enum: ['Available', 'Out of Stock'],
    default: 'Available',
  },
  
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  
  estimatedTime: {
    type: Number,
    min: 1,
    default: 30,
  },
  
  shippingFee: {
    type: Number,
    min: 0,
    default: 0,
  },
  
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  
  // Tracking
  totalSold: {
    type: Number,
    default: 0,
  },
  
  viewCount: {
    type: Number,
    default: 0,
  },
  
}, {
  timestamps: true,
});

/**
 * DEEP LOGIC: Pre-save middleware
 * 
 * Automatically update product availability based on variant stock
 * If ALL choices in ALL required variants are out of stock, mark product as unavailable
 */
productSchema.pre('save', function(next) {
  // If product has variants, check their stock
  if (this.variants && this.variants.length > 0) {
    let hasAvailableChoice = false;
    
    for (const variant of this.variants) {
      if (variant.isRequired) {
        // Check if at least one choice has stock
        const availableChoices = variant.choices.filter(
          choice => choice.stock > 0 && choice.isAvailable
        );
        
        if (availableChoices.length > 0) {
          hasAvailableChoice = true;
          break;
        }
      }
    }
    
    // Update availability
    this.availability = hasAvailableChoice ? 'Available' : 'Out of Stock';
  } else {
    // No variants, check product-level stock
    this.availability = this.stock > 0 ? 'Available' : 'Out of Stock';
  }
  
  next();
});

/**
 * DEEP LOGIC: Instance method to calculate price
 * 
 * Given a set of variant selections, calculate the final price
 * 
 * @param {Array} selections - Array of { variant: "Color", choice: "Silver Tube" }
 * @returns {Number} - Final calculated price
 */
productSchema.methods.calculatePrice = function(selections) {
  let totalPrice = this.basePrice;
  
  if (!selections || selections.length === 0) {
    return totalPrice;
  }
  
  // For each selection, find the choice and add its price
  for (const selection of selections) {
    const variant = this.variants.find(v => v.name === selection.variant);
    if (variant) {
      const choice = variant.choices.find(c => c.name === selection.choice);
      if (choice) {
        // If using absolute pricing
        if (choice.price !== undefined) {
          totalPrice = choice.price;
        }
        // If using price adjustments
        if (choice.priceAdjustment !== undefined && choice.priceAdjustment !== 0) {
          totalPrice += choice.priceAdjustment;
        }
      }
    }
  }
  
  return totalPrice;
};

/**
 * DEEP LOGIC: Instance method to validate selections
 * 
 * Ensures all required variants are selected and choices exist
 * 
 * @param {Array} selections - Array of { variant: "Color", choice: "Silver Tube" }
 * @returns {Object} - { valid: Boolean, errors: Array }
 */
productSchema.methods.validateSelections = function(selections) {
  const errors = [];
  
  // Check if all required variants are selected
  const requiredVariants = this.variants.filter(v => v.isRequired);
  
  for (const variant of requiredVariants) {
    const selected = selections.find(s => s.variant === variant.name);
    
    if (!selected) {
      errors.push(`Please select a ${variant.name}`);
      continue;
    }
    
    // Check if the choice exists
    const choice = variant.choices.find(c => c.name === selected.choice);
    if (!choice) {
      errors.push(`Invalid choice for ${variant.name}`);
      continue;
    }
    
    // Check if choice is available
    if (!choice.isAvailable || choice.stock <= 0) {
      errors.push(`${selected.choice} is out of stock`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * DEEP LOGIC: Instance method to check stock availability
 * 
 * @param {Array} selections - Array of { variant: "Color", choice: "Silver Tube" }
 * @param {Number} quantity - Requested quantity
 * @returns {Object} - { available: Boolean, message: String }
 */
productSchema.methods.checkStock = function(selections, quantity) {
  if (!selections || selections.length === 0) {
    // No variants, check product-level stock
    if (this.stock < quantity) {
      return {
        available: false,
        message: `Only ${this.stock} items available`,
      };
    }
    return { available: true };
  }
  
  // Check stock for each selected choice
  for (const selection of selections) {
    const variant = this.variants.find(v => v.name === selection.variant);
    if (variant) {
      const choice = variant.choices.find(c => c.name === selection.choice);
      if (choice && choice.stock < quantity) {
        return {
          available: false,
          message: `Only ${choice.stock} units of ${choice.name} available`,
        };
      }
    }
  }
  
  return { available: true };
};

/**
 * DEEP LOGIC: Instance method to deduct stock
 * 
 * Called when an order is placed
 * 
 * @param {Array} selections - Array of { variant: "Color", choice: "Silver Tube" }
 * @param {Number} quantity - Quantity to deduct
 */
productSchema.methods.deductStock = async function(selections, quantity) {
  if (!selections || selections.length === 0) {
    // No variants, deduct product-level stock
    this.stock = Math.max(0, this.stock - quantity);
    this.totalSold += quantity;
    await this.save();
    return;
  }
  
  // Deduct stock for each selected choice
  for (const selection of selections) {
    const variant = this.variants.find(v => v.name === selection.variant);
    if (variant) {
      const choice = variant.choices.find(c => c.name === selection.choice);
      if (choice) {
        choice.stock = Math.max(0, choice.stock - quantity);
        if (choice.stock === 0) {
          choice.isAvailable = false;
        }
      }
    }
  }
  
  this.totalSold += quantity;
  await this.save();
};

/**
 * DEEP LOGIC: Static method to find products with available choices
 * 
 * @param {Object} filters - Query filters
 * @returns {Array} - Products with at least one available choice
 */
productSchema.statics.findAvailable = function(filters = {}) {
  return this.find({
    ...filters,
    $or: [
      // Products with variants that have available choices
      {
        'variants.choices': {
          $elemMatch: {
            stock: { $gt: 0 },
            isAvailable: true,
          }
        }
      },
      // Products without variants but with stock
      {
        variants: { $size: 0 },
        stock: { $gt: 0 },
      }
    ]
  });
};

// Indexes for performance
productSchema.index({ sellerId: 1, createdAt: -1 });
productSchema.index({ category: 1, availability: 1 });
productSchema.index({ 'variants.choices.stock': 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

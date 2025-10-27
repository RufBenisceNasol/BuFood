const mongoose = require('mongoose');

const favoriteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  // Store full selectedVariant details to keep UI consistent with cart/orders
  selectedVariant: {
    variantId: { type: String, default: null },
    variantName: { type: String, default: null },
    optionName: { type: String, default: null },
    image: { type: String, default: null },
    price: { type: Number, default: null },
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One favorites list per user
    },
    items: [favoriteItemSchema],
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ 'items.product': 1 });
// Helpful index for checking duplicates by variant when present
favoriteSchema.index({ 'items.product': 1, 'items.selectedVariant.variantId': 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorite;

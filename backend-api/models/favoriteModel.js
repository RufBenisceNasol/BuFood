const mongoose = require('mongoose');

const favoriteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: String,
    default: null, // If user favorited a specific variant
  },
  variantName: {
    type: String,
    default: null,
  },
  selectedVariant: {
    variantName: { type: String },
    optionName: { type: String },
    price: { type: Number, min: 0 },
    image: { type: String }
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

const Favorite = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorite;

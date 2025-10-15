const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  selectedVariantId: {
    type: String
  },
  selectedOptions: {
    type: Map,
    of: String,
    default: undefined
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  price: { // unit price after applying variant/addons if any
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [cartItemSchema],
    total: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { 
    timestamps: true
  }
);

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {  // Changed from customer to user to match the database
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
    timestamps: true,
    // Adding index at schema level
    autoIndex: true 
  }
);

// Creating a unique index on the user field
cartSchema.index({ user: 1 }, { unique: true });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

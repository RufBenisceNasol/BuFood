const mongoose = require('mongoose');

// Define the Product schema (flat product model)
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    index: true,
    sparse: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    default: 'https://res.cloudinary.com/dflcnd7z3/image/upload/v1744609432/zqmqydo1eeiup3qvv1vh.jpg',
  },
  images: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    enum: ['Available', 'Out of Stock'],
    default: 'Available',
  },
  estimatedTime: {
    type: Number,
    min: 1,
    default: 30, // Default 30 minutes
  },
  shippingFee: {
    type: Number,
    min: 0,
    default: 0,
  },
  stock: {
    type: Number,
    min: 0,
    default: 0,
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0, // Percentage discount (0-100)
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined,
  },
  // Legacy simple variants (kept for backward compatibility)
  variants: {
    type: [
      new mongoose.Schema({
        id: { type: String },
        name: { type: String },
        price: { type: Number, min: 0 },
        image: { type: String, default: '' },
        stock: { type: Number, min: 0, default: 0 },
        sku: { type: String, default: '' },
        isAvailable: { type: Boolean, default: true }
      }, { _id: false })
    ],
    default: []
  },
  
  // New nested variant choices structure
  // Example: [{ variantName: 'Size', options: [{ optionName:'Large', price:120, stock:10, image:'...' }] }]
  variantChoices: [
    {
      variantName: { type: String, required: true },
      options: [
        {
          optionName: { type: String, required: true },
          price: { type: Number, min: 0, required: true },
          stock: { type: Number, min: 0, default: 0 },
          image: { type: String, default: '' }
        }
      ]
    }
  ],
  // Optional options map: e.g., { Size: ['S','M','L'], Sugar: ['0%','50%','100%'] }
  options: {
    type: Map,
    of: [String],
    default: undefined,
  },
  // Optional paid add-ons (extras) with prices
  addons: [
    {
      name: { type: String },
      price: { type: Number, min: 0 }
    }
  ],
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
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Pre-save middleware to auto-update availability based on stock
productSchema.pre('save', function(next) {
  if (this.isModified('stock')) {
    this.availability = this.stock > 0 ? 'Available' : 'Out of Stock';
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

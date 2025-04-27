const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel'); // Your OrderItem model


// Add product to cart
const addToCart = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const price = product.price;
    const subtotal = price * quantity;

    let cart = await Cart.findOne({ customer: customerId });

    if (!cart) {
      cart = new Cart({
        customer: customerId,
        items: [{ product: productId, quantity, subtotal }],
        total: subtotal,
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].subtotal += subtotal;
      } else {
        cart.items.push({ product: productId, quantity, subtotal });
      }

      cart.total = cart.items.reduce((acc, item) => acc + item.subtotal, 0);
    }

    await cart.save();
    res.status(200).json({ message: 'Product added to cart', cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart', details: err.message });
  }
};

// View cart
const viewCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');
    if (!cart) {
      // Return empty cart structure instead of 404
      return res.status(200).json({
        customer: req.user._id,
        items: [],
        total: 0
      });
    }

    res.status(200).json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart', details: err.message });
  }
};

const removeItemFromCart = async (req, res) => {
    try {
      const customerId = req.user._id;
      const { productId } = req.body;
  
      let cart = await Cart.findOne({ customer: customerId });
  
      // Handle non-existent cart
      if (!cart) {
        return res.status(200).json({
          message: 'Cart is empty',
          cart: {
            customer: customerId,
            items: [],
            total: 0
          }
        });
      }
  
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );
  
      if (itemIndex > -1) {
        const item = cart.items[itemIndex];
        cart.total -= item.subtotal;
        cart.items.splice(itemIndex, 1);
      } else {
        // Item not in cart, return current cart state
        return res.status(200).json({ 
          message: 'Item not in cart',
          cart 
        });
      }
  
      await cart.save();
      res.status(200).json({ message: 'Item removed from cart', cart });
    } catch (err) {
      console.error('Error removing item from cart:', err);
      res.status(500).json({ error: 'Failed to remove item from cart', details: err.message });
    }
};
  

// Clear cart
const clearCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    let cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
      return res.status(200).json({
        message: 'Cart cleared',
        cart: {
          customer: customerId,
          items: [],
          total: 0
        }
      });
    }

    cart.items = [];
    cart.total = 0;

    await cart.save();
    res.status(200).json({ message: 'Cart cleared', cart });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Failed to clear cart', details: err.message });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
      const customerId = req.user._id;
      const { productId, quantity } = req.body;
  
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and valid quantity are required' });
      }
  
      let cart = await Cart.findOne({ customer: customerId });
      if (!cart) {
        return res.status(200).json({
          message: 'Cart is empty',
          cart: {
            customer: customerId,
            items: [],
            total: 0
          }
        });
      }
  
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex === -1) {
        // Item not in cart, return current cart state
        return res.status(200).json({ 
          message: 'Item not found in cart',
          cart 
        });
      }
  
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
  
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].subtotal = product.price * quantity;
  
      cart.total = cart.items.reduce((acc, item) => acc + item.subtotal, 0);
  
      await cart.save();
      res.status(200).json({ message: 'Cart item updated', cart });
    } catch (err) {
      console.error('Error updating cart item:', err);
      res.status(500).json({ error: 'Failed to update item in cart', details: err.message });
    }
};
  

// Get cart summary (total items and total amount)
const getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ 
        totalItems: 0, 
        totalAmount: 0 
      });
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cart.total;

    res.status(200).json({ totalItems, totalAmount });
  } catch (err) {
    console.error('Error fetching cart summary:', err);
    res.status(500).json({ error: 'Failed to fetch cart summary', details: err.message });
  }
};









module.exports = {
  addToCart,
  viewCart,
  removeItemFromCart,
  clearCart,
  updateCartItem, // Correctly export the checkout function
};
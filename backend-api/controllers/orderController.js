const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
// PayMongo removed
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const fs = require('fs').promises;
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
// Socket is optional: if not present in the environment, fall back to no-op
let emitToUser = () => {};
try {
  ({ emitToUser } = require('../utils/socket'));
} catch (_) {
  // no-op in environments without socket module
}
const { randomUUID } = require('crypto');
const { mapToSupabaseId } = require('../helpers/idMapper');

// Helper function for consistent response structure
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error
});

// Create order from cart
const createOrderFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const {
      orderType,
      paymentMethod,
      deliveryDetails,
      pickupDetails,
      notes,
      selectedItems // Array of product IDs to order
    } = req.body;

    // Validate required fields based on order type
    if (!orderType || !['Pickup', 'Delivery'].includes(orderType)) {
      return res.status(400).json(createResponse(
        false,
        'Invalid order type',
        null,
        'Order type must be either Pickup or Delivery'
      ));
    }

    // Validate selectedItems
    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(400).json(createResponse(
        false,
        'No items selected',
        null,
        'Please select at least one item to order'
      ));
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .session(session);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json(createResponse(
        false,
        'Cart is empty',
        null,
        'Cannot create order from empty cart'
      ));
    }

    // Filter selected items from cart
    const selectedCartItems = cart.items.filter(item => 
      selectedItems.includes(item.product._id.toString())
    );

    if (selectedCartItems.length === 0) {
      return res.status(400).json(createResponse(
        false,
        'No valid items selected',
        null,
        'Selected items were not found in cart'
      ));
    }

    // Group items by store
    const itemsByStore = selectedCartItems.reduce((acc, item) => {
      const storeId = item.product.storeId.toString();
      if (!acc[storeId]) {
        acc[storeId] = [];
      }
      acc[storeId].push(item);
      return acc;
    }, {});

    const orders = [];

    // Create an order for each store
    for (const [storeId, items] of Object.entries(itemsByStore)) {
      // Get store details
      const store = await Store.findById(storeId).session(session);
      if (!store) {
        throw new Error(`Store not found for ID: ${storeId}`);
      }

      // Calculate total amount for this store's items
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

      // Calculate shipping fee if delivery (sum product shippingFee)
      let shippingFee = 0;
      if (orderType === 'Delivery') {
        shippingFee = items.reduce((sum, item) => sum + (item.product.shippingFee || 0), 0);
      }

      // Calculate estimated delivery time (in minutes) if delivery
      const estimatedDeliveryTime = orderType === 'Delivery' 
        ? Math.max(...items.map(item => item.product.estimatedTime || 30)) + 30 // Add 30 minutes for delivery
        : null;

      // Create order items (use stored cart item price and selections)
      const orderItems = items.map(item => ({
        product: item.product._id,
        selectedVariant: item.selectedVariant || undefined,
        selectedVariantId: item.selectedVariantId,
        selectedOptions: item.selectedOptions,
        quantity: item.quantity,
        price: typeof item.price === 'number' ? item.price : (item?.selectedVariant?.price ?? item.product.price),
        subtotal: item.subtotal
      }));

      // Validate delivery details for delivery orders
      if (orderType === 'Delivery') {
        if (!deliveryDetails || 
            !deliveryDetails.receiverName ||
            !deliveryDetails.contactNumber ||
            !deliveryDetails.building ||
            !deliveryDetails.roomNumber) {
          throw new Error('Incomplete delivery details');
        }
      }

      // Validate pickup details for pickup orders
      if (orderType === 'Pickup') {
        if (!pickupDetails || 
            !pickupDetails.contactNumber ||
            !pickupDetails.pickupTime) {
          throw new Error('Incomplete pickup details');
        }
      }

      // Create the order
      const order = new Order({
        customer: req.user._id,
        seller: store.owner,
        store: storeId,
        items: orderItems,
        totalAmount: totalAmount + shippingFee,
        orderType,
        shippingFee,
        status: 'Pending',
        paymentStatus: 'Pending',
        paymentMethod: paymentMethod || (orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'),
        deliveryDetails: orderType === 'Delivery' ? deliveryDetails : undefined,
        pickupDetails: orderType === 'Pickup' ? pickupDetails : undefined,
        estimatedDeliveryTime,
        notes
      });

      await order.save({ session });
      orders.push(order);

      // Remove ordered items from cart
      cart.items = cart.items.filter(item => 
        !selectedItems.includes(item.product._id.toString())
      );
    }

    // Update cart total or delete if empty
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id, { session });
    } else {
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      await cart.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();

    res.status(201).json(createResponse(
      true,
      'Orders created successfully',
      { orders }
    ));

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating order:', error);
    res.status(500).json(createResponse(
      false,
      'Failed to create order',
      null,
      error.message
    ));
  } finally {
    session.endSession();
  }
};

// Customer uploads manual GCash payment proof
const uploadManualGcashProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { gcashRef } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json(createResponse(false, 'Order not found'));
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }

    if (order.paymentMethod !== 'GCash_Manual') {
      return res.status(400).json(createResponse(false, 'Order is not using manual GCash payment'));
    }

    // Upload image if provided
    let proofImageUrl = order.paymentProof?.proofImageUrl || '';
    if (req.file && req.file.path) {
      const result = await uploadToCloudinary(req.file.path, 'payment-proofs');
      proofImageUrl = result.secure_url;
      try { await fs.unlink(req.file.path); } catch (_) {}
    }

    order.paymentProof = {
      gcashRef: gcashRef || order.paymentProof?.gcashRef || '',
      proofImageUrl,
      status: 'pending_verification',
      uploadedAt: new Date()
    };
    await order.save();

    return res.status(200).json(createResponse(true, 'Payment proof uploaded', { orderId: order._id, paymentProof: order.paymentProof }));
  } catch (error) {
    console.error('Upload manual GCash proof error:', error);
    return res.status(500).json(createResponse(false, 'Failed to upload payment proof', null, error.message));
  }
};

// Seller approves manual GCash payment
const approveManualGcash = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json(createResponse(false, 'Order not found'));
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }
    if (order.paymentMethod !== 'GCash_Manual') {
      return res.status(400).json(createResponse(false, 'Order is not using manual GCash payment'));
    }
    order.paymentStatus = 'Paid';
    order.paymentProof = {
      ...(order.paymentProof || {}),
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.user._id
    };
    await order.save();
    return res.status(200).json(createResponse(true, 'Payment approved', { orderId: order._id }));
  } catch (error) {
    console.error('Approve manual GCash error:', error);
    return res.status(500).json(createResponse(false, 'Failed to approve payment', null, error.message));
  }
};

// Seller rejects manual GCash payment
const rejectManualGcash = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json(createResponse(false, 'Order not found'));
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(false, 'Unauthorized'));
    }
    if (order.paymentMethod !== 'GCash_Manual') {
      return res.status(400).json(createResponse(false, 'Order is not using manual GCash payment'));
    }
    order.paymentStatus = 'Failed';
    order.paymentProof = {
      ...(order.paymentProof || {}),
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      rejectionReason: reason || 'Invalid proof'
    };
    await order.save();
    return res.status(200).json(createResponse(true, 'Payment rejected', { orderId: order._id }));
  } catch (error) {
    console.error('Reject manual GCash error:', error);
    return res.status(500).json(createResponse(false, 'Failed to reject payment', null, error.message));
  }
};

// Get seller's orders with filtering and pagination
const getSellerOrders = async (req, res) => {
  try {
    const { 
      status, 
      orderType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check if user is authenticated and is a seller
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    // Build filter object
    const filter = { seller: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (orderType) {
      filter.orderType = orderType;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get orders with pagination
    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('store', 'name location')
      .populate('items.product', 'name price')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);

    res.status(200).json(createResponse(
      true,
      'Orders retrieved successfully',
      {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasMore: skip + orders.length < totalOrders
        }
      }
    ));

  } catch (error) {
    console.error('Error getting seller orders:', error);
    res.status(500).json(createResponse(
      false,
      'Failed to get orders',
      null,
      error.message
    ));
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status, estimatedTime } = req.body;

    // Check if user is authenticated and is a seller
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    // Get the order
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      return res.status(404).json(createResponse(
        false,
        'Order not found',
        null,
        'The specified order does not exist'
      ));
    }

    // Verify that the seller owns this order
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(
        false,
        'Unauthorized',
        null,
        'You do not have permission to update this order'
      ));
    }

    // Update order status if provided
    if (status) {
      // Validate status transition
      const validTransitions = {
        'Pending': ['Accepted', 'Rejected'],
        'Accepted': ['Preparing'],
        'Preparing': ['Ready', 'Out for Delivery'],
        'Ready': ['Ready for Pickup'],
        'Out for Delivery': ['Delivered'],
        'Ready for Pickup': ['Delivered']
      };
      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid status transition',
          null,
          `Cannot transition from ${order.status} to ${status}`
        ));
      }
      order.status = status;
      // Update estimated time if provided
      if (estimatedTime && ['Preparing', 'Out for Delivery'].includes(status)) {
        order.estimatedDeliveryTime = estimatedTime;
      }
    }
    // Update payment status if provided
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;

    // Save the updated order
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    res.status(200).json(createResponse(
      true,
      'Order status updated successfully',
      { order }
    ));

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating order status:', error);
    res.status(500).json(createResponse(
      false,
      'Failed to update order status',
      null,
      error.message
    ));
  } finally {
    session.endSession();
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    // Get the order with populated fields
    const order = await Order.findById(orderId)
      .populate('customer', 'name email')
      .populate('store', 'name location')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json(createResponse(
        false,
        'Order not found',
        null,
        'The specified order does not exist'
      ));
    }

    // Verify that the user is either the customer or seller
    if (
      order.seller.toString() !== req.user._id.toString() &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json(createResponse(
        false,
        'Unauthorized',
        null,
        'You do not have permission to view this order'
      ));
    }

    return res.status(200).json(createResponse(
      true,
      'Order details retrieved successfully',
      { order }
    ));

  } catch (error) {
    console.error('Error getting order details:', error);
    return res.status(500).json(createResponse(
      false,
      'Failed to get order details',
      null,
      error.message
    ));
  }
};

// Accept order (Seller only)
const acceptOrder = async (req, res) => {
const session = await mongoose.startSession();
session.startTransaction();

try {
  const { orderId } = req.params;
  const { estimatedPreparationTime, note } = req.body;
  const idempotencyKey = req.get('Idempotency-Key') || `order:${orderId}:accept`;
  const requestId = randomUUID();

  // Check if user is authenticated and is a seller
  if (!req.user || !req.user._id) {
    return res.status(401).json(createResponse(
      false,
      'Authentication required',
      null,
      'User must be logged in to perform this action'
    ));
  }

    // Get the order
    const order = await Order.findById(orderId)
      .populate('customer', 'name email')
      .populate('store', 'name')
      .session(session);
    
    if (!order) {
      return res.status(404).json(createResponse(
        false,
        'Order not found',
        null,
        'The specified order does not exist'
      ));
    }

    // Verify that the seller owns this order
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(
        false,
        'Unauthorized',
        null,
        'You do not have permission to accept this order'
      ));
    }

    // Check if order is in Pending status
    if (order.status !== 'Pending') {
      return res.status(400).json(createResponse(
        false,
        'Invalid order status',
        null,
        `Cannot accept order that is in ${order.status} status`
      ));
    }

    // Check if all products are still available and have sufficient stock
    const productUpdates = [];
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      if (!product.isAvailable) {
        throw new Error(`Product ${product.name} is no longer available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      // Prepare stock update
      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -item.quantity } }
        }
      });
    }

    // Update product stock
    await Product.bulkWrite(productUpdates, { session });

    // Update order status and details
    order.status = 'Accepted';
    order.acceptedAt = new Date();
    order.estimatedPreparationTime = estimatedPreparationTime;
    if (note) {
      order.sellerNotes = note;
    }

    // Calculate estimated completion time
    const estimatedMinutes = parseInt(estimatedPreparationTime) || 30; // Default to 30 minutes if not specified
    order.estimatedCompletionTime = new Date(Date.now() + estimatedMinutes * 60000);

    // Save the updated order
    await order.save({ session });

    // Upsert conversation for this order between customer and seller
    const customerId = order.customer._id || order.customer; // populated or ObjectId
    const sellerId = order.seller; // ObjectId
    const participants = [String(customerId), String(sellerId)].sort();
    const participantsKey = participants.join('|');

    let conversation = await Conversation.findOneAndUpdate(
      { participantsKey, orderId: String(order._id) },
      {
        $setOnInsert: {
          participants: [customerId, sellerId],
          participantsKey,
          orderId: String(order._id),
          createdBy: 'system'
        }
      },
      { new: true, upsert: true, session }
    );

    // Create idempotent system message summarizing the acceptance
    const orderSnapshot = {
      orderId: String(order._id),
      items: (order.items || []).map(it => ({
        productId: String(it.product),
        name: it.name || undefined,
        qty: Number(it.quantity) || 0,
        price: typeof it.price === 'number' ? it.price : (it?.selectedVariant?.price ?? 0)
      })),
      total: Number(order.totalAmount) || 0,
      acceptedAt: order.acceptedAt,
      expectedReadyTime: order.estimatedCompletionTime
    };
    const sysText = `Seller ${order.store?.name || ''} accepted your order. Total ₱${orderSnapshot.total}. Ready around ${order.estimatedCompletionTime?.toISOString?.() || ''}.`;

    let systemMessage;
    try {
      systemMessage = await Message.create([{
        conversationId: conversation._id,
        type: 'system',
        text: sysText.substring(0, 2048),
        senderId: null,
        receiverId: null,
        orderRef: { orderId: String(order._id), summary: `Accepted • ₱${orderSnapshot.total}` },
        orderSnapshot,
        requestId,
        idempotencyKey
      }], { session });
      systemMessage = systemMessage[0];
    } catch (e) {
      // Duplicate due to idempotency
      if (e && e.code === 11000) {
        systemMessage = await Message.findOne({ idempotencyKey }).session(session);
      } else {
        throw e;
      }
    }

    // Update conversation lastMessage and unread count for customer
    const recipientKey = String(customerId);
    const lastMessage = {
      id: systemMessage._id,
      text: systemMessage.text,
      type: 'system',
      senderId: null,
      senderName: null,
      createdAt: systemMessage.createdAt,
      orderRef: systemMessage.orderRef || null
    };
    conversation = await Conversation.findOneAndUpdate(
      { _id: conversation._id },
      {
        $set: { lastMessage },
        $inc: { [`unreadCounts.${recipientKey}`]: 1 },
        $currentDate: { updatedAt: true }
      },
      { new: true, session }
    );

    // Commit the transaction
    await session.commitTransaction();

    // Resolve socket rooms (prefer Supabase userId)
    const sellerSupabaseId = await mapToSupabaseId(sellerId);
    const customerSupabaseId = await mapToSupabaseId(customerId);
    const sellerRoom = String(sellerSupabaseId || sellerId);
    const customerRoom = String(customerSupabaseId || customerId);

    // Emit socket events (post-commit)
    const convoPayload = conversation.toObject();
    emitToUser(customerRoom, 'conversation:upserted', { conversation: convoPayload });
    emitToUser(sellerRoom, 'conversation:upserted', { conversation: convoPayload });
    emitToUser(customerRoom, 'message:created', { message: systemMessage });
    emitToUser(sellerRoom, 'message:created', { message: systemMessage });
    emitToUser(customerRoom, 'unread:update', { conversationId: conversation._id, unreadCounts: conversation.unreadCounts });
    // Backward-compatible events with existing app
    emitToUser(customerRoom, 'conversation:updated', { conversationId: conversation._id, lastMessage });
    emitToUser(customerRoom, 'message:received', systemMessage);

    // Foodpanda-like generic event for simpler clients
    const autoMessage = {
      type: 'system',
      text: systemMessage.text,
      orderId: String(order._id),
      storeId: String(order.store?._id || order.store),
      total: Number(order.totalAmount) || 0,
      timestamp: systemMessage.createdAt,
    };
    emitToUser(customerRoom, 'newMessage', autoMessage);
    emitToUser(sellerRoom, 'newMessage', autoMessage);
    // Legacy alias
    emitToUser(customerRoom, 'new_message', autoMessage);
    emitToUser(sellerRoom, 'new_message', autoMessage);

    // Prepare success response with enriched details
    return res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: {
        order: {
          _id: order._id,
          status: order.status,
          customer: { name: order.customer.name, email: order.customer.email },
          store: order.store.name,
          acceptedAt: order.acceptedAt,
          estimatedPreparationTime: order.estimatedPreparationTime,
          estimatedCompletionTime: order.estimatedCompletionTime,
          sellerNotes: order.sellerNotes
        },
        conversation: convoPayload,
        systemMessage: { id: systemMessage._id, text: systemMessage.text, createdAt: systemMessage.createdAt },
        requestId
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error accepting order:', error);
    res.status(500).json(createResponse(
      false,
      'Failed to accept order',
      null,
      error.message
    ));
  } finally {
    session.endSession();
  }
};

// Cancel order (Customer only, for pending orders)
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    // Get the order
    const order = await Order.findById(orderId)
      .populate('store', 'name')
      .session(session);
    
    if (!order) {
      return res.status(404).json(createResponse(
        false,
        'Order not found',
        null,
        'The specified order does not exist'
      ));
    }

    // Verify that the user is the customer who placed the order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(
        false,
        'Unauthorized',
        null,
        'You do not have permission to cancel this order'
      ));
    }

    // Check if order is in Pending status
    if (order.status !== 'Pending') {
      return res.status(400).json(createResponse(
        false,
        'Cannot cancel order',
        null,
        'Orders can only be cancelled while in Pending status'
      ));
    }

    // Update order status and add cancellation details
    order.status = 'Canceled';
    order.canceledAt = new Date();
    order.cancellationReason = cancellationReason || 'Canceled by customer';
    order.canceledBy = 'Customer';

    // Save the updated order
    await order.save({ session });

    // Return items to cart (with required price field) if customer wants to reorder later
    const existingCart = await Cart.findOne({ user: req.user._id }).session(session);

    // Normalize order items to cart item shape and ensure price/subtotal exist
    const normalizedItems = order.items.map((oi) => {
      const price = typeof oi.price === 'number'
        ? oi.price
        : (oi?.selectedVariant?.price ?? 0);
      const quantity = Number(oi.quantity) || 0;
      const subtotal = price * quantity;
      return {
        product: oi.product,
        name: oi.name, // optional snapshot if ever present
        image: oi.image, // optional snapshot if ever present
        selectedVariant: oi.selectedVariant ? {
          variantName: oi.selectedVariant.variantName,
          optionName: oi.selectedVariant.optionName,
          price: oi.selectedVariant.price,
          image: oi.selectedVariant.image,
        } : undefined,
        selectedVariantId: oi.selectedVariantId,
        selectedOptions: oi.selectedOptions,
        quantity,
        price,
        subtotal,
      };
    }).filter(ci => ci.quantity > 0);

    if (normalizedItems.length > 0) {
      if (existingCart) {
        // Merge with existing cart items by product + selectedVariant option
        const updatedItems = [...existingCart.items];
        for (const nItem of normalizedItems) {
          const idx = updatedItems.findIndex(it => (
            it.product.toString() === nItem.product.toString() &&
            ((it.selectedVariant && nItem.selectedVariant && it.selectedVariant.optionName === nItem.selectedVariant.optionName) ||
             (!it.selectedVariant && !nItem.selectedVariant))
          ));
          if (idx > -1) {
            const newQty = (Number(updatedItems[idx].quantity) || 0) + nItem.quantity;
            updatedItems[idx].quantity = newQty;
            // Keep existing line price snapshot, recompute subtotal
            const linePrice = typeof updatedItems[idx].price === 'number' ? updatedItems[idx].price : nItem.price;
            updatedItems[idx].price = linePrice;
            updatedItems[idx].subtotal = newQty * linePrice;
            // Preserve name/image if present, or set if missing
            updatedItems[idx].name = updatedItems[idx].name || nItem.name;
            updatedItems[idx].image = updatedItems[idx].image || nItem.image;
          } else {
            updatedItems.push(nItem);
          }
        }
        existingCart.items = updatedItems;
        existingCart.total = updatedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
        await existingCart.save({ session });
      } else {
        // Only create a new cart if there are valid items to return
        const newCart = new Cart({
          user: req.user._id,
          items: normalizedItems,
          total: normalizedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0)
        });
        await newCart.save({ session });
      }
    }

    // Commit the transaction
    await session.commitTransaction();

    // Prepare success response
    res.status(200).json(createResponse(
      true,
      'Order cancelled successfully',
      {
        order: {
          _id: order._id,
          status: order.status,
          store: order.store.name,
          canceledAt: order.canceledAt,
          cancellationReason: order.cancellationReason
        }
      }
    ));

  } catch (error) {
    await session.abortTransaction();
    console.error('Error cancelling order:', error);
    res.status(500).json(createResponse(
      false,
      'Failed to cancel order',
      null,
      error.message
    ));
  } finally {
    session.endSession();
  }
};

// Create order directly from products
const createDirectOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const {
      orderType,
      items, // Array of { productId, quantity, selectedVariantId?, selectedOptions? }
      paymentMethod,
      deliveryDetails,
      pickupTime,
      notes
    } = req.body;

    // Validate required fields based on order type
    if (!orderType || !['Pickup', 'Delivery'].includes(orderType)) {
      return res.status(400).json(createResponse(
        false,
        'Invalid order type',
        null,
        'Order type must be either Pickup or Delivery'
      ));
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(createResponse(
        false,
        'No items selected',
        null,
        'Please select at least one item to order'
      ));
    }

    // Get and validate all products
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('storeId', 'name location owner deliveryFee')
      .session(session);

    // Check if all products were found
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p._id.toString());
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new Error(`Products not found: ${missingIds.join(', ')}`);
    }

    // Validate product availability and stock
    for (const product of products) {
      const orderItem = items.find(item => item.productId === product._id.toString());
      
      if (!product.isAvailable) {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stock < orderItem.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${orderItem.quantity}`);
      }
    }

    // Group items by store
    const itemsByStore = products.reduce((acc, product) => {
      const storeId = product.storeId._id.toString();
      const orderItem = items.find(item => item.productId === product._id.toString());
      
      if (!acc[storeId]) {
        acc[storeId] = {
          store: product.storeId,
          items: []
        };
      }

      // Determine unit price: variant overrides base price if provided
      let unitPrice = product.price;
      if (orderItem?.selectedVariantId && Array.isArray(product.variants)) {
        const v = product.variants.find(v => String(v.id || v._id || v.name) === String(orderItem.selectedVariantId));
        if (v && typeof v.price === 'number') unitPrice = v.price;
      }

      acc[storeId].items.push({
        product: product._id,
        selectedVariantId: orderItem?.selectedVariantId,
        selectedOptions: orderItem?.selectedOptions,
        quantity: orderItem.quantity,
        price: unitPrice,
        subtotal: unitPrice * orderItem.quantity
      });

      return acc;
    }, {});

    const orders = [];
    const productUpdates = [];

    // Create an order for each store
    for (const [storeId, storeData] of Object.entries(itemsByStore)) {
      const { store, items: storeItems } = storeData;

      // Calculate total amount and shipping fee
      const subtotal = storeItems.reduce((sum, item) => sum + item.subtotal, 0);
      // Calculate shipping fee if delivery (sum product shippingFee)
      let shippingFee = 0;
      if (orderType === 'Delivery') {
        shippingFee = storeItems.reduce((sum, item) => {
          const product = products.find(p => p._id.toString() === item.product.toString());
          return sum + (product && product.shippingFee ? product.shippingFee : 0);
        }, 0);
      }
      const totalAmount = subtotal + shippingFee;

      // Validate delivery details for delivery orders
      if (orderType === 'Delivery') {
        if (!deliveryDetails || 
            !deliveryDetails.receiverName ||
            !deliveryDetails.contactNumber ||
            !deliveryDetails.building ||
            !deliveryDetails.roomNumber) {
          throw new Error('Incomplete delivery details');
        }
      }

      // Validate pickup time for pickup orders
      if (orderType === 'Pickup' && !pickupTime) {
        throw new Error('Pickup time is required for pickup orders');
      }

      // Calculate estimated delivery time
      const estimatedDeliveryTime = orderType === 'Delivery'
        ? Math.max(...storeItems.map(item => {
            const product = products.find(p => p._id.toString() === item.product.toString());
            return product.estimatedTime || 30;
          })) + 30 // Add 30 minutes for delivery
        : null;

      // Create the order
      const order = new Order({
        customer: req.user._id,
        seller: store.owner,
        store: store._id,
        items: storeItems,
        totalAmount,
        orderType,
        shippingFee,
        status: 'Pending',
        paymentStatus: 'Pending',
        paymentMethod: paymentMethod || (orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'),
        deliveryDetails: orderType === 'Delivery' ? deliveryDetails : undefined,
        pickupTime: orderType === 'Pickup' ? new Date(pickupTime) : undefined,
        estimatedDeliveryTime,
        notes
      });

      await order.save({ session });
      orders.push(order);

      // Prepare stock updates for products
      for (const item of storeItems) {
        productUpdates.push({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stock: -item.quantity } }
          }
        });
      }
    }

    // Update product stock
    if (productUpdates.length > 0) {
      await Product.bulkWrite(productUpdates, { session });
    }

    // Commit the transaction
    await session.commitTransaction();

    res.status(201).json(createResponse(
      true,
      'Orders created successfully',
      { 
        orders: orders.map(order => ({
          _id: order._id,
          store: itemsByStore[order.store.toString()].store.name,
          totalAmount: order.totalAmount,
          status: order.status,
          orderType: order.orderType,
          items: order.items.map(item => ({
            product: products.find(p => p._id.toString() === item.product.toString()).name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          }))
        }))
      }
    ));

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating direct order:', error);
    res.status(500).json(createResponse(
      false,
      'Failed to create order',
      null,
      error.message
    ));
  } finally {
    session.endSession();
  }
};

/**
 * Get all orders for the logged-in customer
 * @route GET /api/orders/my-orders
 * @access Private (Customer only)
 */
const getCustomerOrders = async (req, res, next) => {
    try {
        // Get orders for the logged-in customer
        const orders = await Order.find({ customer: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price image'
            })
            .populate('store', 'storeName')
            .sort({ createdAt: -1 }); // Most recent orders first

        res.status(200).json(createResponse(
            true,
            'Orders retrieved successfully',
            { orders }
        ));
    } catch (error) {
        next(new ApiError(500, error.message));
    }
};

// Create a PayMongo GCash source and return the checkout URL
const checkoutWithGCash = async (req, res) => {
  try {
    const { amount, orderId, redirectUrl } = req.body;
    if (!amount || !orderId || !redirectUrl) {
      return res.status(400).json(createResponse(false, 'Missing required fields', null, 'amount, orderId, and redirectUrl are required'));
    }
    // PayMongo disabled: directly return provided redirect URL for manual/off-platform flow
    const checkoutUrl = redirectUrl;
    res.json(createResponse(true, 'GCash checkout URL created (manual redirect)', { checkoutUrl }));
  } catch (err) {
    console.error('PayMongo GCash error:', err.response?.data || err.message);
    res.status(500).json(createResponse(false, 'Failed to create GCash payment source', null, err.response?.data || err.message));
  }
};

// PayMongo webhook handler
const paymongoWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (!event || !event.data || !event.data.id) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }
    const eventType = event.type;
    // For payment.paid, update the order as paid
    if (eventType === 'payment.paid') {
      const payment = event.data.attributes;
      // Try to get orderId from payment.source.redirect.success URL
      let orderId = null;
      if (payment.source && payment.source.redirect && payment.source.redirect.success) {
        const url = payment.source.redirect.success;
        const match = url.match(/[?&]orderId=([^&]+)/);
        if (match) orderId = match[1];
      }
      if (!orderId) {
        console.error('Order ID not found in payment.paid webhook');
        return res.status(200).json({ message: 'No orderId, ignored' });
      }
      // Update the order
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'Paid';
        order.status = 'Pending'; // or keep current status
        await order.save();
        console.log(`Order ${orderId} marked as Paid via PayMongo webhook.`);
      } else {
        console.error(`Order ${orderId} not found for PayMongo webhook.`);
      }
      return res.status(200).json({ message: 'Order payment status updated' });
    }
    // Log other event types for debugging
    console.log('Unhandled PayMongo webhook event:', eventType);
    res.status(200).json({ message: 'Event received' });
  } catch (err) {
    console.error('PayMongo webhook error:', err);
    res.status(500).json({ error: 'Webhook handler error' });
  }
};

module.exports = {
  createOrderFromCart,
  getSellerOrders,
  updateOrderStatus,
  getOrderDetails,
  acceptOrder,
  cancelOrder,
  createDirectOrder,
  getCustomerOrders,
  checkoutWithGCash,
  paymongoWebhook,
  uploadManualGcashProof,
  approveManualGcash,
  rejectManualGcash
}; 
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Helper function to create a response object
const createResponse = (success, message, data = null, error = null) => ({
    success,
    message,
    data,
    error
});

// Checkout from cart
const checkoutFromCart = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product')
            .session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            return res.status(400).json(createResponse(false, 'Cart is empty'));
        }

        // Group items by store
        const itemsByStore = cart.items.reduce((acc, item) => {
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
            const store = await Store.findById(storeId).session(session);
            if (!store) {
                await session.abortTransaction();
                return res.status(404).json(createResponse(false, 'Store not found'));
            }

            const seller = await User.findById(store.owner).session(session);
            if (!seller) {
                await session.abortTransaction();
                return res.status(404).json(createResponse(false, 'Seller not found'));
            }

            // Calculate total amount and prepare order items
            const orderItems = items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                subtotal: item.subtotal
            }));

            const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
            const shippingFee = items.reduce((sum, item) => sum + (item.product.shippingFee || 0), 0);
            const estimatedDeliveryTime = Math.max(...items.map(item => item.product.estimatedTime || 30));

            const order = new Order({
                customer: req.user._id,
                seller: seller._id,
                store: store._id,
                items: orderItems,
                totalAmount: totalAmount + shippingFee,
                shippingFee,
                estimatedDeliveryTime,
                status: 'Pending'
            });

            await order.save({ session });
            orders.push(order);
        }

        // Clear the cart after creating orders
        await Cart.findByIdAndDelete(cart._id, { session });

        await session.commitTransaction();
        res.status(200).json(createResponse(true, 'Orders created successfully', { orders }));
    } catch (error) {
        await session.abortTransaction();
        console.error('Checkout error:', error);
        res.status(500).json(createResponse(false, 'Failed to create orders', null, error.message));
    } finally {
        session.endSession();
    }
};

// Checkout directly from product
const checkoutFromProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            return res.status(404).json(createResponse(false, 'Product not found'));
        }

        const store = await Store.findById(product.storeId).session(session);
        if (!store) {
            await session.abortTransaction();
            return res.status(404).json(createResponse(false, 'Store not found'));
        }

        const seller = await User.findById(store.owner).session(session);
        if (!seller) {
            await session.abortTransaction();
            return res.status(404).json(createResponse(false, 'Seller not found'));
        }

        const subtotal = product.price * quantity;
        const order = new Order({
            customer: req.user._id,
            seller: seller._id,
            store: store._id,
            items: [{
                product: product._id,
                quantity,
                price: product.price,
                subtotal
            }],
            totalAmount: subtotal + (product.shippingFee || 0),
            shippingFee: product.shippingFee || 0,
            estimatedDeliveryTime: product.estimatedTime || 30,
            status: 'Pending'
        });

        await order.save({ session });
        await session.commitTransaction();

        res.status(200).json(createResponse(true, 'Order created successfully', { order }));
    } catch (error) {
        await session.abortTransaction();
        console.error('Checkout error:', error);
        res.status(500).json(createResponse(false, 'Failed to create order', null, error.message));
    } finally {
        session.endSession();
    }
};

// Place order (update shipping address and confirm)
const placeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryDetails, paymentMethod, notes } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            customer: req.user._id,
            status: 'Pending'
        });

        if (!order) {
            return res.status(404).json(createResponse(false, 'Order not found or cannot be modified'));
        }

        order.deliveryDetails = deliveryDetails;
        order.paymentMethod = paymentMethod;
        order.notes = notes;
        order.status = 'Placed';

        if (paymentMethod === 'Cash on Delivery') {
            order.paymentStatus = 'Pending';
        }

        await order.save();
        res.status(200).json(createResponse(true, 'Order placed successfully', { order }));
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json(createResponse(false, 'Failed to place order', null, error.message));
    }
};

// Get customer's orders
const getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('items.product')
            .populate('store', 'storeName')
            .sort({ createdAt: -1 });

        res.status(200).json(createResponse(true, 'Orders retrieved successfully', { orders }));
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json(createResponse(false, 'Failed to retrieve orders', null, error.message));
    }
};

// Get seller's orders
const getSellerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ seller: req.user._id })
            .populate('items.product')
            .populate('customer', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(createResponse(true, 'Orders retrieved successfully', { orders }));
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json(createResponse(false, 'Failed to retrieve orders', null, error.message));
    }
};

// Get order details
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('items.product')
            .populate('customer', 'name')
            .populate('seller', 'name')
            .populate('store', 'storeName');

        if (!order) {
            return res.status(404).json(createResponse(false, 'Order not found'));
        }

        // Check if user has permission to view this order
        if (order.customer._id.toString() !== req.user._id.toString() &&
            order.seller._id.toString() !== req.user._id.toString()) {
            return res.status(403).json(createResponse(false, 'Not authorized to view this order'));
        }

        res.status(200).json(createResponse(true, 'Order details retrieved successfully', { order }));
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json(createResponse(false, 'Failed to retrieve order details', null, error.message));
    }
};

// Cancel order (customer)
const cancelOrderByCustomer = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({
            _id: orderId,
            customer: req.user._id,
            status: { $in: ['Pending', 'Placed'] }
        });

        if (!order) {
            return res.status(404).json(createResponse(false, 'Order not found or cannot be canceled'));
        }

        order.status = 'Canceled';
        await order.save();

        res.status(200).json(createResponse(true, 'Order canceled successfully', { order }));
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json(createResponse(false, 'Failed to cancel order', null, error.message));
    }
};

// Update order status (seller)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action, status, note, estimatedTime } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            seller: req.user._id
        });

        if (!order) {
            return res.status(404).json(createResponse(false, 'Order not found'));
        }

        // Attach order to request for validator use
        req.order = order;

        // Handle different actions
        switch (action) {
            case 'accept':
                if (order.status !== 'Pending') {
                    return res.status(400).json(
                        createResponse(false, 'Can only accept pending orders')
                    );
                }
                order.status = 'Accepted';
                if (estimatedTime) {
                    order.estimatedDeliveryTime = estimatedTime;
                }
                break;

            case 'reject':
                if (order.status !== 'Pending') {
                    return res.status(400).json(
                        createResponse(false, 'Can only reject pending orders')
                    );
                }
                order.status = 'Rejected';
                break;

            case 'updateStatus':
                // Define valid transitions based on order type
                const validTransitions = order.orderType === 'Pickup' ? {
                    'Accepted': ['Preparing'],
                    'Preparing': ['Ready for Pickup'],
                    'Ready for Pickup': ['Delivered'] // When customer picks up and pays
                } : {
                    'Accepted': ['Preparing'],
                    'Preparing': ['Ready'],
                    'Ready': ['Out for Delivery'],
                    'Out for Delivery': ['Delivered']
                };

                if (!validTransitions[order.status]?.includes(status)) {
                    return res.status(400).json(
                        createResponse(false, `Invalid status transition from ${order.status} to ${status}`)
                    );
                }

                // Update payment status for pickup orders when delivered
                if (order.orderType === 'Pickup' && status === 'Delivered') {
                    order.paymentStatus = 'Paid';
                }

                order.status = status;
                break;

            case 'cancel':
                if (!['Pending', 'Accepted'].includes(order.status)) {
                    return res.status(400).json(
                        createResponse(false, 'Can only cancel pending or accepted orders')
                    );
                }
                order.status = 'Canceled';
                break;

            default:
                return res.status(400).json(createResponse(false, 'Invalid action'));
        }

        // Add note to status history
        if (note) {
            order.notes = note;
        }

        await order.save();
        
        // Send response with appropriate message based on action
        const messages = {
            accept: 'Order accepted successfully',
            reject: 'Order rejected',
            updateStatus: 'Order status updated successfully',
            cancel: 'Order canceled successfully'
        };

        res.status(200).json(createResponse(true, messages[action], { 
            order,
            statusHistory: order.statusHistory 
        }));
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json(createResponse(false, 'Failed to update order status', null, error.message));
    }
};

module.exports = {
    checkoutFromCart,
    checkoutFromProduct,
    placeOrder,
    getCustomerOrders,
    getSellerOrders,
    getOrderDetails,
    cancelOrderByCustomer,
    updateOrderStatus
}; 
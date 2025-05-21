const express = require('express');
const router = express.Router();
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const {
    checkoutFromCart,
    checkoutFromProduct,
    placeOrder,
    getCustomerOrders,
    getSellerOrders,
    getOrderDetails,
    cancelOrderByCustomer,
    updateOrderStatus
} = require('../controllers/orderController');
const {
    checkoutFromProductValidator,
    placeOrderValidator,
    orderIdValidator,
    updateOrderStatusValidator
} = require('../middlewares/validators/orderValidator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         customer:
 *           type: string
 *           description: Customer ID
 *         seller:
 *           type: string
 *           description: Seller ID
 *         store:
 *           type: string
 *           description: Store ID
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               subtotal:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         shippingFee:
 *           type: number
 *         status:
 *           type: string
 *           enum: [Pending, Placed, Shipped, Delivered, Canceled]
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid, Failed]
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, Credit Card, GCash]
 */

/**
 * @swagger
 * /api/orders/checkout-cart:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout from cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders created successfully
 *       400:
 *         description: Cart is empty
 *       401:
 *         description: Unauthorized
 */
router.post('/checkout-cart', authenticate, checkRole('Customer'), checkoutFromCart);

/**
 * @swagger
 * /api/orders/checkout-from-product:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout directly from product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.post('/checkout-from-product', authenticate, checkRole('Customer'), checkoutFromProductValidator, checkoutFromProduct);

/**
 * @swagger
 * /api/orders/place-order/{orderId}:
 *   post:
 *     tags: [Orders]
 *     summary: Place order with shipping details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order placed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/place-order/:orderId', authenticate, checkRole('Customer'), placeOrderValidator, placeOrder);

/**
 * @swagger
 * /api/orders/customer:
 *   get:
 *     tags: [Orders]
 *     summary: Get customer's orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/customer', authenticate, checkRole('Customer'), getCustomerOrders);

/**
 * @swagger
 * /api/orders/seller/placed:
 *   get:
 *     tags: [Orders]
 *     summary: Get seller's orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get('/seller/placed', authenticate, checkRole('Seller'), getSellerOrders);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this order
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', authenticate, orderIdValidator, getOrderDetails);

/**
 * @swagger
 * /api/orders/cancel-by-customer/{orderId}:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel order by customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found or cannot be canceled
 */
router.patch('/cancel-by-customer/:orderId', authenticate, checkRole('Customer'), orderIdValidator, cancelOrderByCustomer);

/**
 * @swagger
 * /api/orders/seller/manage/{orderId}:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (seller)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [cancel, updateStatus]
 *               status:
 *                 type: string
 *                 enum: [Shipped, Delivered]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 *       404:
 *         description: Order not found
 */
router.patch('/seller/manage/:orderId', authenticate, checkRole('Seller'), updateOrderStatusValidator, updateOrderStatus);

module.exports = router; 
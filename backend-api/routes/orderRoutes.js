const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, completed, cancelled]
 *         totalAmount:
 *           type: number
 *         customerId:
 *           type: string
 *         sellerId:
 *           type: string
 */

const {
  checkoutFromProduct,
  checkoutFromCart,
  placeOrder,
  getOrdersForCustomer,
  getOrderDetails,
  cancelOrderByCustomer,
  getPlacedOrdersForSeller, 
  updateOrderStatusOrCancelBySeller,
} = require('../controllers/orderController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');

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
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Checkout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/checkout-from-product', authenticate, checkRole('Customer'), checkoutFromProduct);

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
 *         description: Cart checkout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/checkout-cart', authenticate, checkRole('Customer'), checkoutFromCart);

/**
 * @swagger
 * /api/orders/place-order/{orderId}:
 *   post:
 *     tags: [Orders]
 *     summary: Place order after checkout
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
 *         description: Order placed successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/place-order/:orderId', authenticate, checkRole('Customer'), placeOrder);

/**
 * @swagger
 * /api/orders/customer:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders for customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/customer', authenticate, getOrdersForCustomer);

/**
 * @swagger
 * /api/orders/seller/placed:
 *   get:
 *     tags: [Orders]
 *     summary: Get all placed orders for seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders for seller
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get('/seller/placed', authenticate, checkRole('Seller'), getPlacedOrdersForSeller);

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
 *         description: Order details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', authenticate, getOrderDetails);

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
 *         description: Order cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not order owner
 */
router.patch('/cancel-by-customer/:orderId', authenticate, checkRole('Customer'), cancelOrderByCustomer);

/**
 * @swagger
 * /api/orders/seller/manage/{orderId}:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status or cancel by seller
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, completed, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the seller
 */
router.patch('/seller/manage/:orderId', authenticate, checkRole('Seller'), updateOrderStatusOrCancelBySeller);

module.exports = router;

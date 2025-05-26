const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { createOrderValidator, updateOrderStatusValidator, acceptOrderValidator, cancelOrderValidator, createDirectOrderValidator } = require('../middlewares/validators/orderValidator');
const { 
  createOrderFromCart, 
  getSellerOrders, 
  updateOrderStatus,
  getOrderDetails,
  acceptOrder,
  cancelOrder,
  createDirectOrder
} = require('../controllers/orderController');
const { 
  validateCreateOrderFromCart,
  validateCreateDirectOrder,
  validateUpdateOrderStatus,
  validateGetOrderDetails,
  validateCancelOrder,
  validateGetSellerOrders,
  validateAcceptOrder
} = require('../middlewares/validators/orderValidator');
const { authenticateUser } = require('../middleware/auth'); // Assuming you have auth middleware

/**
 * @swagger
 * components:
 *   schemas:
 *     DeliveryDetails:
 *       type: object
 *       required:
 *         - receiverName
 *         - contactNumber
 *         - building
 *         - roomNumber
 *       properties:
 *         receiverName:
 *           type: string
 *           description: Name of the person receiving the order
 *         contactNumber:
 *           type: string
 *           pattern: ^(\+63|0)[0-9]{10}$
 *           description: Contact number of the receiver (e.g., +639123456789)
 *         building:
 *           type: string
 *           description: Building name/number
 *         roomNumber:
 *           type: string
 *           description: Room or unit number
 *         additionalInstructions:
 *           type: string
 *           description: Additional delivery instructions
 *     OrderItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: ID of the product
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity ordered
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Price per unit
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Total price for this item (quantity * price)
 *     Order:
 *       type: object
 *       properties:
 *         customer:
 *           type: string
 *           description: ID of the customer
 *         seller:
 *           type: string
 *           description: ID of the seller
 *         store:
 *           type: string
 *           description: ID of the store
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           description: Total amount including shipping fee
 *         orderType:
 *           type: string
 *           enum: [Pickup, Delivery]
 *         shippingFee:
 *           type: number
 *           description: Delivery fee (0 for pickup orders)
 *         status:
 *           type: string
 *           enum: [Pending, Accepted, Rejected, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered, Canceled]
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid, Failed]
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, GCash, Cash on Pickup]
 *     CreateOrder:
 *       type: object
 *       required:
 *         - orderType
 *         - selectedItems
 *       properties:
 *         orderType:
 *           type: string
 *           enum: [Pickup, Delivery]
 *           description: Type of order
 *         selectedItems:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product IDs to order from cart
 *           minItems: 1
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, GCash, Cash on Pickup]
 *           description: Payment method
 *         deliveryDetails:
 *           $ref: '#/components/schemas/DeliveryDetails'
 *         pickupTime:
 *           type: string
 *           format: date-time
 *           description: Required for pickup orders (must be in the future)
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes for the order
 *     UpdateOrderStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [Accepted, Rejected, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered]
 *           description: New status for the order
 *         estimatedTime:
 *           type: integer
 *           description: Estimated delivery/preparation time in minutes (required for Preparing and Out for Delivery status)
 *     AcceptOrder:
 *       type: object
 *       required:
 *         - estimatedPreparationTime
 *       properties:
 *         estimatedPreparationTime:
 *           type: integer
 *           minimum: 1
 *           description: Estimated preparation time in minutes
 *         note:
 *           type: string
 *           maxLength: 500
 *           description: Optional note from the seller about the order
 *     CancelOrder:
 *       type: object
 *       properties:
 *         cancellationReason:
 *           type: string
 *           maxLength: 500
 *           description: Optional reason for cancellation
 *     DirectOrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product to order
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity to order
 *     CreateDirectOrder:
 *       type: object
 *       required:
 *         - orderType
 *         - items
 *       properties:
 *         orderType:
 *           type: string
 *           enum: [Pickup, Delivery]
 *           description: Type of order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DirectOrderItem'
 *           description: Array of products and quantities to order
 *           minItems: 1
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, GCash, Cash on Pickup]
 *           description: Payment method
 *         deliveryDetails:
 *           $ref: '#/components/schemas/DeliveryDetails'
 *         pickupTime:
 *           type: string
 *           format: date-time
 *           description: Required for pickup orders (must be in the future)
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes for the order
 */

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order from selected cart items
 *     description: |
 *       Creates one or more orders from selected items in the cart. Items are grouped by store,
 *       creating separate orders for each store. Selected items will be removed from the cart.
 *       
 *       For delivery orders, complete delivery details are required.
 *       For pickup orders, a future pickup time is required.
 *       
 *       The cart will be updated to remove ordered items. If all items are ordered,
 *       the cart will be deleted.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Orders created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Orders created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       400:
 *         description: |
 *           Bad Request - Possible causes:
 *           * Invalid order type
 *           * No items selected
 *           * Selected items not found in cart
 *           * Empty cart
 *           * Incomplete delivery details
 *           * Missing pickup time
 *           * Invalid pickup time (must be in future)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - User must be logged in
 *       500:
 *         description: Server error while processing the order
 */
router.post('/create', createOrderValidator, createOrderFromCart);

/**
 * @swagger
 * /api/orders/seller:
 *   get:
 *     tags: [Orders]
 *     summary: Get seller's orders with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Accepted, Rejected, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered, Canceled]
 *         description: Filter orders by status
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *           enum: [Pickup, Delivery]
 *         description: Filter orders by type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/seller', getSellerOrders);

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
 *         description: ID of the order
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:orderId', getOrderDetails);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Seller only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatus'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not the seller
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.patch('/:orderId/status', updateOrderStatusValidator, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{orderId}/accept:
 *   post:
 *     tags: [Orders]
 *     summary: Accept an order (Seller only)
 *     description: |
 *       Allows a seller to accept a pending order. When accepting an order:
 *       - Validates product availability and stock
 *       - Updates product stock
 *       - Sets order status to Accepted
 *       - Records acceptance time and estimated completion time
 *       - Optionally adds seller notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to accept
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptOrder'
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order accepted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: Accepted
 *                         customer:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                         store:
 *                           type: string
 *                         acceptedAt:
 *                           type: string
 *                           format: date-time
 *                         estimatedPreparationTime:
 *                           type: integer
 *                         estimatedCompletionTime:
 *                           type: string
 *                           format: date-time
 *                         sellerNotes:
 *                           type: string
 *       400:
 *         description: |
 *           Bad Request - Possible causes:
 *           * Order is not in Pending status
 *           * Invalid preparation time
 *           * Products no longer available
 *           * Insufficient stock
 *       401:
 *         description: Unauthorized - User must be logged in
 *       403:
 *         description: Forbidden - User is not the seller of this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error while processing the request
 */
router.post('/:orderId/accept', acceptOrderValidator, acceptOrder);

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel a pending order (Customer only)
 *     description: |
 *       Allows a customer to cancel their order if it's still in Pending status.
 *       When an order is cancelled:
 *       - Order status is updated to Canceled
 *       - Cancellation time and reason are recorded
 *       - Items are returned to the customer's cart for easy reordering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to cancel
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelOrder'
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order cancelled successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: Canceled
 *                         store:
 *                           type: string
 *                         canceledAt:
 *                           type: string
 *                           format: date-time
 *                         cancellationReason:
 *                           type: string
 *       400:
 *         description: |
 *           Bad Request - Possible causes:
 *           * Order is not in Pending status
 *           * Invalid cancellation reason format
 *       401:
 *         description: Unauthorized - User must be logged in
 *       403:
 *         description: Forbidden - User is not the customer who placed this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error while processing the request
 */
router.post('/:orderId/cancel', cancelOrderValidator, cancelOrder);

/**
 * @swagger
 * /api/orders/create-direct:
 *   post:
 *     tags: [Orders]
 *     summary: Create orders directly from products
 *     description: |
 *       Creates one or more orders directly from products without using the cart.
 *       Orders are grouped by store, and each store's items create a separate order.
 *       
 *       Features:
 *       - Specify quantity for each product
 *       - Automatic store grouping
 *       - Stock validation and update
 *       - Delivery fee calculation per store
 *       
 *       For delivery orders, complete delivery details are required.
 *       For pickup orders, a future pickup time is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDirectOrder'
 *     responses:
 *       201:
 *         description: Orders created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Orders created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           store:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           orderType:
 *                             type: string
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 product:
 *                                   type: string
 *                                 quantity:
 *                                   type: integer
 *                                 price:
 *                                   type: number
 *                                 subtotal:
 *                                   type: number
 *       400:
 *         description: |
 *           Bad Request - Possible causes:
 *           * Invalid order type
 *           * No items provided
 *           * Invalid product IDs
 *           * Invalid quantities
 *           * Products not available
 *           * Insufficient stock
 *           * Incomplete delivery details
 *           * Missing pickup time
 *           * Invalid pickup time
 *       401:
 *         description: Unauthorized - User must be logged in
 *       500:
 *         description: Server error while processing the request
 */
router.post('/create-direct', createDirectOrderValidator, createDirectOrder);

// Order routes with validators
router.post('/create-from-cart', validateCreateOrderFromCart, createOrderFromCart);
router.post('/create-direct', validateCreateDirectOrder, createDirectOrder);
router.get('/seller', validateGetSellerOrders, getSellerOrders);
router.get('/:orderId', validateGetOrderDetails, getOrderDetails);
router.patch('/:orderId/status', validateUpdateOrderStatus, updateOrderStatus);
router.post('/:orderId/accept', validateAcceptOrder, acceptOrder);
router.post('/:orderId/cancel', validateCancelOrder, cancelOrder);

module.exports = router; 
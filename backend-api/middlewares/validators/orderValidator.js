const { body, param } = require('express-validator');
const handleValidation = require('./handleValidation');

// Validation for checkout from product
const checkoutFromProductValidator = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid product ID format'),
    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive number'),
    body('orderType')
        .notEmpty()
        .withMessage('Order type is required')
        .isIn(['Pickup', 'Delivery'])
        .withMessage('Invalid order type'),
    handleValidation
];

// Validation for placing order
const placeOrderValidator = [
    param('orderId')
        .isMongoId()
        .withMessage('Invalid order ID format'),
    body('orderType')
        .notEmpty()
        .withMessage('Order type is required')
        .isIn(['Pickup', 'Delivery'])
        .withMessage('Invalid order type'),
    body('deliveryDetails')
        .custom((value, { req }) => {
            if (req.body.orderType === 'Delivery') {
                if (!value || typeof value !== 'object') {
                    throw new Error('Delivery details are required for delivery orders');
                }
            }
            return true;
        }),
    body('deliveryDetails.receiverName')
        .if(body('orderType').equals('Delivery'))
        .notEmpty()
        .withMessage('Receiver name is required for delivery')
        .isString()
        .withMessage('Receiver name must be a string')
        .trim(),
    body('deliveryDetails.contactNumber')
        .notEmpty()
        .withMessage('Contact number is required')
        .isString()
        .withMessage('Contact number must be a string')
        .matches(/^[0-9+\-\s()]+$/)
        .withMessage('Invalid contact number format')
        .trim(),
    body('deliveryDetails.building')
        .if(body('orderType').equals('Delivery'))
        .notEmpty()
        .withMessage('Building name/number is required for delivery')
        .isString()
        .withMessage('Building must be a string')
        .trim(),
    body('deliveryDetails.roomNumber')
        .if(body('orderType').equals('Delivery'))
        .notEmpty()
        .withMessage('Room number is required for delivery')
        .isString()
        .withMessage('Room number must be a string')
        .trim(),
    body('deliveryDetails.additionalInstructions')
        .optional()
        .isString()
        .withMessage('Additional instructions must be a string')
        .trim(),
    body('pickupTime')
        .if(body('orderType').equals('Pickup'))
        .notEmpty()
        .withMessage('Pickup time is required for pickup orders')
        .isISO8601()
        .withMessage('Invalid pickup time format')
        .custom((value) => {
            const pickupTime = new Date(value);
            const now = new Date();
            if (pickupTime <= now) {
                throw new Error('Pickup time must be in the future');
            }
            return true;
        }),
    body('paymentMethod')
        .notEmpty()
        .withMessage('Payment method is required')
        .custom((value, { req }) => {
            const validMethods = req.body.orderType === 'Pickup' 
                ? ['Cash on Pickup', 'GCash']
                : ['Cash on Delivery', 'GCash'];
            if (!validMethods.includes(value)) {
                throw new Error(`Invalid payment method for ${req.body.orderType.toLowerCase()} order`);
            }
            return true;
        }),
    body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .trim(),
    handleValidation
];

// Validation for order ID parameter
const orderIdValidator = [
    param('orderId')
        .isMongoId()
        .withMessage('Invalid order ID format'),
    handleValidation
];

// Validation for updating order status
const updateOrderStatusValidator = [
    param('orderId')
        .isMongoId()
        .withMessage('Invalid order ID format'),
    body('action')
        .notEmpty()
        .withMessage('Action is required')
        .isIn(['accept', 'reject', 'updateStatus', 'cancel'])
        .withMessage('Invalid action'),
    body('status')
        .optional()
        .custom((value, { req }) => {
            if (req.body.action !== 'updateStatus') return true;
            
            const order = req.order; // Assuming order is attached in previous middleware
            const validStatuses = order.orderType === 'Pickup'
                ? ['Preparing', 'Ready for Pickup', 'Delivered']
                : ['Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
            
            if (!validStatuses.includes(value)) {
                throw new Error(`Invalid status for ${order.orderType.toLowerCase()} order`);
            }
            return true;
        }),
    body('estimatedTime')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Estimated time must be a positive number (in minutes)'),
    body('note')
        .optional()
        .isString()
        .withMessage('Note must be a string')
        .trim(),
    handleValidation
];

module.exports = {
    checkoutFromProductValidator,
    placeOrderValidator,
    orderIdValidator,
    updateOrderStatusValidator
}; 
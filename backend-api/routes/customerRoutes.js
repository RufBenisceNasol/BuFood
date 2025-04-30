const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerProfile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         contactNumber:
 *           type: string
 */

const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const handleValidation = require('../middlewares/validators/handleValidation');

const {
  getCustomerProfile,
  getAllStoresForCustomer,
  viewStore,
} = require('../controllers/customerController');

/**
 * @swagger
 * /api/customers/profile:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerProfile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 */
router.get('/profile', authenticate, checkRole('Customer'), getCustomerProfile);

/**
 * @swagger
 * /api/customers/stores:
 *   get:
 *     tags: [Customers]
 *     summary: Get all stores for customer
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
router.get('/stores', getAllStoresForCustomer);

/**
 * @swagger
 * /api/customers/store/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: View specific store and its products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store details with products
 *       404:
 *         description: Store not found
 */
router.get('/store/:id', viewStore);

module.exports = router;

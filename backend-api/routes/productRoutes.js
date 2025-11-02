const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the product
 *         price:
 *           type: number
 *           description: Price of the product
 *         description:
 *           type: string
 *           description: Product description
 *         image:
 *           type: string
 *           format: binary
 *           description: Product image
 *         storeId:
 *           type: string
 *           description: ID of the store this product belongs to
 */

const {
  createProduct,
  bulkCreateProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteAllProductsInStore,
  getSellerProducts,
  updateProductImage,
  getSellerAnalytics
} = require('../controllers/productController');

const { authenticateWithSupabase, checkRole } = require('../middlewares/supabaseAuthMiddleware');
const uploadProductImage = require('../middlewares/uploadProductImage'); 
const handleValidation = require('../middlewares/validators/handleValidation');
const checkProductOwnership = require('../utils/checkProductOwnership');
const {
  createProductValidation,
  updateProductValidation
} = require('../middlewares/validators/productValidation');

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', getAllProducts);  // Fetch all products

/**
 * @swagger
 * /api/products/seller/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products of logged-in seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's products
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get(
  '/seller/products',
  authenticateWithSupabase,  // Ensure the user is authenticated
  checkRole('Seller'),  // Ensure the user is a Seller
  getSellerProducts  // Controller to fetch seller's products
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);  // Fetch a product by ID

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateWithSupabase,
  checkRole('Seller'),
  // Wrap multer to handle file errors gracefully
  (req, res, next) => {
    const mw = uploadProductImage.single('image');
    mw(req, res, (err) => {
      if (!err) return next();
      const code = err?.code;
      if (code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image too large', code });
      }
      return res.status(400).json({ success: false, message: err.message || 'Invalid image upload', code });
    });
  },
  createProductValidation,
  handleValidation,
  createProduct
);

// Bulk create products: expects JSON array body (items)
router.post(
  '/bulk',
  authenticateWithSupabase,
  checkRole('Seller'),
  bulkCreateProducts
);

/**
 * @swagger
 * /api/products/{id}/image:
 *   patch:
 *     tags: [Products]
 *     summary: Update product image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product image updated successfully
 */
router.patch('/:id/image', authenticateWithSupabase, uploadProductImage.single('image'), updateProductImage);


/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Edit product details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               availability:
 *                 type: string
 *                 enum: [Available, Out of Stock]
 *               image:  
 *                 type: string
 *                 format: uri
 * 
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not product owner
 *       404:
 *         description: Product not found
 */
router.patch('/:id',
  authenticateWithSupabase,
  checkRole('Seller'),
  checkProductOwnership,
  updateProductValidation,
  handleValidation,
  updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.delete(
  '/:id',
  authenticateWithSupabase,
  checkRole('Seller'),
  deleteProduct
);

/**
 * @swagger
 * /api/products/store/{storeId}/products:
 *   delete:
 *     tags: [Products]
 *     summary: Delete all products in a store
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All products deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not store owner
 */
router.delete(
  '/store/:storeId/products',
  authenticateWithSupabase,
  checkRole('Seller'),
  deleteAllProductsInStore
);

/**
 * @swagger
 * /api/products/seller/analytics:
 *   get:
 *     tags: [Products]
 *     summary: Get seller analytics (sales, revenue, top products)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/seller/analytics',
  authenticateWithSupabase,
  checkRole('Seller'),
  getSellerAnalytics
);

module.exports = router;

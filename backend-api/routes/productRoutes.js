const express = require('express');
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteAllProductsInStore,
  getSellerProducts
} = require('../controllers/productController');

const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const uploadProductImage = require('../middlewares/uploadProductImage'); 
const handleValidation = require('../middlewares/validators/handleValidation');
const checkProductOwnership = require('../utils/checkProductOwnership');
const {
  createProductValidation,
  updateProductValidation
} = require('../middlewares/validators/productValidation');

// 🟢 Public routes
router.get('/', getAllProducts);  // Fetch all products

// 🆕 Get all products of the logged-in seller (This must come before /:id to avoid conflict)
router.get(
  '/seller/products',
  authenticate,  // Ensure the user is authenticated
  checkRole('Seller'),  // Ensure the user is a Seller
  getSellerProducts  // Controller to fetch seller's products
);

// Product by ID route must come after specific routes
router.get('/:id', getProductById);  // Fetch a product by ID

// Create a new product
router.post(
  '/',
  authenticate,
  checkRole('Seller'),
  uploadProductImage.single('image'),
  createProductValidation,
  handleValidation,
  createProduct
);

// Update an existing product
router.put(
  '/:id',
  authenticate,
  checkProductOwnership,
  uploadProductImage.single('image'),
  updateProductValidation,
  handleValidation,
  updateProduct
);

// Delete a product
router.delete(
  '/:id',
  authenticate,
  checkRole('Seller'),
  deleteProduct
);

// 🧹 Route to delete all products in a store
router.delete(
  '/store/:storeId/products',
  authenticate,
  checkRole('Seller'),
  deleteAllProductsInStore
);

module.exports = router;

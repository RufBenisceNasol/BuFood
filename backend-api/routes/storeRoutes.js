const express = require('express');
const router = express.Router();

const {
  updateStore,
  deleteStore,
  getAllStores,
  getStoreById,
  getStoreProducts,
  getMyStore
} = require('../controllers/storeController');

const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const checkStoreOwnership = require('../utils/checkOwnership');
const uploadStoreImage = require('../middlewares/uploadStoreMiddleware'); 

// 🔍 Get all stores (with optional search)
router.get('/', getAllStores);

// 👤 Get store by logged-in owner
router.get(
  '/my-store',
  authenticate,
  checkRole('Seller'),
  getMyStore
);

// 📍 Get a specific store by ID (for customers)
router.get('/:id', getStoreById);

// ✏️ Update store - only by owner with validation
router.put('/:id', 
  authenticate, 
  checkStoreOwnership, 
  uploadStoreImage.fields([
    { name: 'image', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
  ]),
  updateStore
);

// ❌ Delete store - only by owner
router.delete('/:id', authenticate, checkStoreOwnership, deleteStore);

// 🛒 Get all products in a store by store ID (for customers)
router.get('/:id/products', getStoreProducts);

module.exports = router;

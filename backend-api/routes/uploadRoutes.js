const express = require('express');
const router = express.Router();
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const upload = require('../utils/multerStorage');
const { uploadImage } = require('../controllers/uploadController');

// Image upload endpoint for seller product/variant option images
// Field name: 'image'
router.post('/image', authenticate, checkRole('Seller'), upload.single('image'), uploadImage);

module.exports = router;

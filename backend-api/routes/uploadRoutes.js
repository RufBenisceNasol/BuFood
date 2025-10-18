const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const upload = require('../utils/multerStorage');
const { uploadImage } = require('../controllers/uploadController');

// Image upload endpoint for seller product/variant option images
// Field name: 'image'
// Attach multer with inline error handling to avoid generic 500s
router.post(
  '/image',
  authenticate,
  checkRole('Seller'),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const code = err.code;
        let message = 'Upload error';
        if (code === 'LIMIT_FILE_SIZE') message = 'Image too large (max 8MB)';
        if (code === 'LIMIT_UNEXPECTED_FILE') message = 'Invalid file type';
        return res.status(400).json({ success: false, message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Invalid image' });
    });
  },
  uploadImage
);

module.exports = router;

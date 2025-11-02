const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateWithSupabase, checkRole } = require('../middlewares/supabaseAuthMiddleware');
const upload = require('../utils/multerStorage');
const { uploadImage } = require('../controllers/uploadController');

// Image upload endpoint for seller product/variant option images
// Field name: 'image'
// Attach multer with inline error handling to avoid generic 500s
router.post(
  '/image',
  authenticateWithSupabase,
  checkRole('Seller'),
  (req, res, next) => {
    // Be permissive: accept either single('image') or fields([{ name:'image' }]) style
    const mw = upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'file', maxCount: 1 }, // fallback common name
    ]);
    mw(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          const code = err.code;
          let message = 'Upload error';
          if (code === 'LIMIT_FILE_SIZE') message = 'Image too large (max 8MB)';
          if (code === 'LIMIT_UNEXPECTED_FILE') message = 'Invalid file type';
          return res.status(400).json({ success: false, message });
        }
        return res.status(400).json({ success: false, message: err.message || 'Invalid image' });
      }
      // Normalize to req.file for controller convenience
      if (!req.file) {
        if (req.files?.image?.[0]) req.file = req.files.image[0];
        else if (req.files?.file?.[0]) req.file = req.files.file[0];
      }
      return next();
    });
  },
  uploadImage
);

module.exports = router;

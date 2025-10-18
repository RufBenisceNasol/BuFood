const uploadToCloudinary = require('../utils/uploadToCloudinary');

// POST /api/upload/image
// Accepts multipart/form-data with field name 'image'
// Returns { success, imageUrl }
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // If using multer-storage-cloudinary, req.file.path is already a Cloudinary URL
    // and req.file.filename is the public_id. Do not re-upload.
    if (typeof req.file.path === 'string' && /^https?:\/\//i.test(req.file.path)) {
      return res.status(200).json({ success: true, imageUrl: req.file.path, publicId: req.file.filename });
    }

    // Otherwise, upload the local file path using our helper
    const result = await uploadToCloudinary(req.file.path, 'product-images');
    return res.status(200).json({ success: true, imageUrl: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
  }
};

module.exports = { uploadImage };

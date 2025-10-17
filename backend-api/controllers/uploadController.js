const uploadToCloudinary = require('../utils/uploadToCloudinary');

// POST /api/upload/image
// Accepts multipart/form-data with field name 'image'
// Returns { success, imageUrl }
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.path, 'product-images');

    return res.status(200).json({ success: true, imageUrl: result.secure_url });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
  }
};

module.exports = { uploadImage };

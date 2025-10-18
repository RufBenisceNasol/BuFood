const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ALLOWED_FORMATS,
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
    resource_type: 'image',
  },
});

const fileFilter = (req, file, cb) => {
  const isImage = /^image\//.test(file.mimetype);
  if (!isImage) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB
    files: 1,
  },
});

module.exports = upload;
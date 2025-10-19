const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const Order = require('../models/orderModel');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const fs = require('fs').promises;  // Use fs.promises for cleaner async file handling

// Utility function for file deletion
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Error deleting file:', err);
  }
};

// Bulk create flat products
const bulkCreateProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const store = await Store.findOne({ owner: sellerId });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const items = Array.isArray(req.body) ? req.body : (Array.isArray(req.body.items) ? req.body.items : []);
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    // Validate and map inputs
    const docs = [];
    const errors = [];
    items.forEach((it, idx) => {
      const name = (it.name || '').toString().trim();
      const price = Number(it.price);
      const stock = it.stock != null ? Number(it.stock) : 0;
      const category = (it.category || '').toString().trim();
      const description = (it.description || '').toString();
      const image = (it.image || '').toString();
      if (!name || !(price >= 0) || !category || !image) {
        errors.push({ index: idx, message: 'Invalid product row: name, price>=0, category, image required' });
        return;
      }
      docs.push({
        name,
        slug: toSlug(name),
        description,
        price,
        category,
        sellerId,
        storeId: store._id,
        image,
        stock: isNaN(stock) ? 0 : stock,
      });
    });

    if (docs.length === 0) {
      return res.status(400).json({ message: 'All rows invalid', errors });
    }

    const inserted = await Product.insertMany(docs, { ordered: false });
    return res.status(201).json({ inserted, errors });
  } catch (err) {
    // insertMany with ordered:false may still throw write errors, return partials when possible
    console.error('Bulk create error:', err);
    return res.status(500).json({ message: 'Bulk create failed', error: err.message });
  }
};

// Utility: simple slugify
const toSlug = (str) => (str || '')
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

// Create a flat product (no variants)
const createProduct = async (req, res) => {
  try {
    const requestId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const ctype = req.headers['content-type'] || '';
    // Expose requestId to client for correlation
    res.set('X-Request-Id', requestId);
    if (req.id) {
      res.set('X-Server-Request-Id', req.id);
    }
    console.log(`[createProduct:${requestId}] content-type:`, ctype);
    console.log(`[createProduct:${requestId}] server req.id:`, req.id);
    console.log(`[createProduct:${requestId}] incoming body keys:`, Object.keys(req.body || {}));
    console.log(`[createProduct:${requestId}] incoming body:`, req.body);
    console.log(`[createProduct:${requestId}] req.user:`, req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : null);
    console.log(`[createProduct:${requestId}] has file:`, !!req.file, 'filename:', req.file?.originalname, 'mimetype:', req.file?.mimetype, 'size:', req.file?.size);
    // Some multer configs use req.files; log if present
    if (req.files) {
      const fileKeys = Array.isArray(req.files) ? req.files.map(f => f.fieldname) : Object.keys(req.files);
      console.log(`[createProduct:${requestId}] req.files keys:`, fileKeys);
    }
    const { name, description } = req.body;
    const imageFromBody = req.body?.image;
    let price = req.body?.price;
    let category = req.body?.category;
    let availability = req.body?.availability;
    let estimatedTime = req.body?.estimatedTime;
    let shippingFee = req.body?.shippingFee;
    let stock = req.body?.stock;
    let discount = req.body?.discount;

    let imagesFromBody = [];
    if (req.body.images) {
      try {
        imagesFromBody = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
      } catch (e) {
        console.log('createProduct: failed to parse images array:', e.message);
        imagesFromBody = [];
      }
    }
    // Sanitize images array: keep only non-empty strings
    imagesFromBody = (Array.isArray(imagesFromBody) ? imagesFromBody : []).filter(u => typeof u === 'string' && u.trim().length > 0);
    console.log(`[createProduct:${requestId}] parsed imagesFromBody length:`, imagesFromBody.length);

    price = Number(price);
    stock = stock != null ? Number(stock) : 0;
    shippingFee = shippingFee != null ? Number(shippingFee) : 0;
    discount = discount != null ? Number(discount) : 0;
    estimatedTime = estimatedTime != null ? Number(estimatedTime) : 30;
    category = (category || '').toString().trim();
    availability = availability || 'Available';

    if (!name) {
      console.log(`[createProduct:${requestId}] missing field: name`);
      return res.status(400).json({ success: false, message: 'Missing field: name', requestId, serverRequestId: req.id });
    }
    if (!(price >= 0) || Number.isNaN(price)) {
      console.log(`[createProduct:${requestId}] invalid field: price`, price);
      return res.status(400).json({ success: false, message: 'Invalid field: price must be a number >= 0', requestId, serverRequestId: req.id });
    }
    if (!category) {
      console.log(`[createProduct:${requestId}] missing field: category`);
      return res.status(400).json({ success: false, message: 'Missing field: category', requestId, serverRequestId: req.id });
    }

    const sellerId = req.user._id;
    const store = await Store.findOne({ owner: sellerId });
    if (!store) {
      console.log(`[createProduct:${requestId}] store not found for seller:`, sellerId);
      return res.status(404).json({ success: false, message: 'Store not found for current seller', requestId, serverRequestId: req.id });
    }

    let imageUrl = imageFromBody;
    if (!imageUrl && req.file) {
      try {
        console.log(`[createProduct:${requestId}] uploading file to Cloudinary...`);
        const result = await uploadToCloudinary(req.file.path, 'product-images');
        imageUrl = result.secure_url;
        console.log(`[createProduct:${requestId}] Cloudinary uploaded url:`, imageUrl);
      } catch (upErr) {
        console.error(`[createProduct:${requestId}] Cloudinary upload failed:`, upErr?.stack || upErr);
        return res.status(502).json({ success: false, message: 'Image upload failed', error: upErr.message, requestId, serverRequestId: req.id });
      } finally {
        try { if (req.file?.path) await deleteFile(req.file.path); } catch (delErr) { console.warn(`[createProduct:${requestId}] cleanup file error:`, delErr.message); }
      }
    }
    if (!imageUrl) imageUrl = imagesFromBody[0];
    if (!imageUrl) {
      console.log(`[createProduct:${requestId}] no image provided, using default`);
      imageUrl = Product.schema.path('image').defaultValue;
    }

    console.log(`[createProduct:${requestId}] creating Product doc with:`, { name, price, category, availability, estimatedTime, shippingFee, stock, discount, imageUrl, storeId: store._id });
    const newProduct = new Product({
      name,
      slug: toSlug(name),
      description,
      price,
      category,
      availability,
      sellerId,
      storeId: store._id,
      image: imageUrl,
      images: Array.isArray(imagesFromBody) ? imagesFromBody : [],
      estimatedTime,
      shippingFee,
      stock,
      discount,
    });

    console.log(`[createProduct:${requestId}] saving product to DB...`);
    let savedProduct;
    try {
      savedProduct = await newProduct.save();
    } catch (dbErr) {
      console.error(`[createProduct:${requestId}] product save failed:`, dbErr?.stack || dbErr);
      const status = dbErr?.name === 'ValidationError' ? 400 : 500;
      return res.status(status).json({ success: false, message: 'Failed to save product', error: dbErr.message, requestId, serverRequestId: req.id });
    }
    console.log(`[createProduct:${requestId}] product saved, updating store products array...`);
    try {
      store.products.push(savedProduct._id);
      await store.save();
    } catch (storeErr) {
      console.error(`[createProduct:${requestId}] store save failed:`, storeErr?.stack || storeErr);
      return res.status(500).json({ success: false, message: 'Product saved but failed to update store', error: storeErr.message, productId: savedProduct._id, requestId, serverRequestId: req.id });
    }

    console.log(`[createProduct:${requestId}] saved product id:`, savedProduct._id);
    res.status(201).json({ success: true, product: savedProduct, requestId, serverRequestId: req.id });
  } catch (err) {
    console.error(`[createProduct:${requestId}] unexpected error:`, err?.stack || err);
    // Map common mongoose/cast errors to 400
    if (err?.name === 'ValidationError' || err?.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product payload', error: err.message, requestId, serverRequestId: req.id });
    }
    res.status(500).json({ success: false, message: 'Create product failed', error: err.message, requestId, serverRequestId: req.id });
  }
};

// Get all products for a seller
const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await Product.find({ sellerId })
      .populate('storeId', 'storeName')
      .populate('sellerId', 'name email');

    res.status(200).json(products); // Directly sending the products array
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch seller products' });
  }
};

// Get all products (public route) with filters: category, sellerId, q
const getAllProducts = async (req, res) => {
  try {
    const { category, sellerId, q } = req.query || {};
    const filter = {};
    if (category) filter.category = category;
    if (sellerId) filter.sellerId = sellerId;
    if (q) filter.name = { $regex: new RegExp(q, 'i') };

    const products = await Product.find(filter)
      .populate('storeId', 'storeName')
      .populate('sellerId', 'name email');

    // Aggregate sales stats per product from orders delivered
    const stats = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $project: {
          product: '$items.product',
          quantity: '$items.quantity',
          hour: { $hour: '$createdAt' }
        }
      },
      { $group: { _id: { product: '$product', hour: '$hour' }, qty: { $sum: '$quantity' } } },
      {
        $group: {
          _id: '$_id.product',
          totalSold: { $sum: '$qty' },
          hours: { $push: { hour: '$_id.hour', qty: '$qty' } }
        }
      }
    ]);

    const statsMap = new Map();
    for (const s of stats) {
      const hours = Array.isArray(s.hours) ? s.hours : [];
      let maxQty = 0;
      for (const h of hours) {
        if (h.qty > maxQty) maxQty = h.qty;
      }
      const peakHours = hours.filter(h => h.qty === maxQty).map(h => h.hour).sort((a, b) => a - b);
      statsMap.set(String(s._id), {
        soldCount: s.totalSold || 0,
        peakOrderTimes: peakHours
      });
    }

    const productsWithStats = products.map(p => {
      const obj = p.toObject();
      const stat = statsMap.get(String(p._id));
      obj.soldCount = stat ? stat.soldCount : 0;
      obj.peakOrderTimes = stat ? stat.peakOrderTimes : [];
      return obj;
    });

    res.json(productsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('storeId', 'storeName')
      .populate('sellerId', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Attach stats for single product
    const stats = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      {
        $project: {
          quantity: '$items.quantity',
          hour: { $hour: '$createdAt' }
        }
      },
      { $group: { _id: '$hour', qty: { $sum: '$quantity' } } },
      { $sort: { _id: 1 } }
    ]);

    let soldCount = 0;
    let maxQty = 0;
    for (const s of stats) {
      soldCount += s.qty || 0;
      if (s.qty > maxQty) maxQty = s.qty;
    }
    const peakOrderTimes = stats.filter(s => s.qty === maxQty).map(s => s._id);

    const result = product.toObject();
    result.soldCount = soldCount;
    result.peakOrderTimes = peakOrderTimes;
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow updating specific fields
    const updates = {};
    const allowedUpdates = ['name', 'description', 'price', 'category', 'availability', 'estimatedTime', 'shippingFee', 'stock', 'discount', 'variants', 'options'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        // Parse JSON for variants/options if needed
        if ((field === 'variants' || field === 'options') && typeof req.body[field] === 'string') {
          try {
            const parsed = JSON.parse(req.body[field]);
            updates[field] = parsed;
          } catch (_) {
            // ignore malformed, skip update for this field
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Handle image upload if file is present
    if (req.file) {
      updates.image = req.file.path;
    }

    // Update the product with the allowed fields
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product image only
const updateProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check ownership
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.path, 'product-images');
    
    // Delete the local file after upload
    await deleteFile(req.file.path);

    // Only update the image URL, keeping all other fields unchanged
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { image: result.secure_url },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Product.findByIdAndDelete(req.params.id);
    await Store.findByIdAndUpdate(product.storeId, {
      $pull: { products: product._id },
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteAllProductsInStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;

    // Find the store by ID
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Remove all products related to the store
    await Product.deleteMany({ storeId: storeId });

    // Clear the products array in the store model
    store.products = [];
    await store.save();

    res.status(200).json({ message: 'All products deleted from store' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get seller analytics (sales, revenue, top products)
const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Get all seller's products
    const products = await Product.find({ sellerId });
    const productIds = products.map(p => p._id);
    
    // Get all delivered orders containing seller's products
    const orders = await Order.find({
      seller: sellerId,
      status: 'Delivered'
    }).populate('items.product');
    
    // Calculate total revenue
    let totalRevenue = 0;
    let totalOrders = orders.length;
    const productSales = {};
    
    orders.forEach(order => {
      totalRevenue += order.totalAmount || 0;
      
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue += item.subtotal;
      });
    });
    
    // Get top selling products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)
      .map(item => ({
        productId: item.product._id,
        name: item.product.name,
        image: item.product.image,
        quantitySold: item.totalQuantity,
        revenue: item.totalRevenue
      }));
    
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts: products.length,
        topProducts
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProduct,
  bulkCreateProducts,
  getSellerProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteAllProductsInStore,
  updateProductImage,
  getSellerAnalytics,
};

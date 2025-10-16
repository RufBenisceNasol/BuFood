const Product = require('../models/productModelWithChoices');
const cloudinary = require('../config/cloudinaryConfig');

/**
 * DEEP LOGIC: Create product with variant choices
 * POST /api/products
 * 
 * Flow:
 * 1. Validate seller authentication
 * 2. Parse and validate variant structure
 * 3. Upload images to Cloudinary
 * 4. Create product with variants
 * 5. Return created product
 */
const createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const storeId = req.user.store?.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store not found. Please create a store first.',
      });
    }

    const {
      name,
      description,
      basePrice,
      category,
      variants,
      options,
      stock,
      estimatedTime,
      shippingFee,
      discount,
    } = req.body;

    // Validation
    if (!name || basePrice === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, base price, and category are required',
      });
    }

    // Upload main product image if provided
    let imageUrl = '';
    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        folder: 'products',
      });
      imageUrl = result.secure_url;
    }

    // Create product
    const product = new Product({
      name,
      description,
      basePrice,
      image: imageUrl || undefined,
      category,
      variants: variants || [],
      options: options || undefined,
      stock: stock || 0,
      estimatedTime: estimatedTime || 30,
      shippingFee: shippingFee || 0,
      discount: discount || 0,
      sellerId,
      storeId,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Add variant category to product
 * POST /api/products/:productId/variants
 * 
 * Flow:
 * 1. Validate product ownership
 * 2. Validate variant structure
 * 3. Add variant category
 * 4. Save and return product
 */
const addVariantCategory = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id;
    const { name, isRequired, allowMultiple, choices } = req.body;

    // Validation
    if (!name || !choices || choices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Variant name and at least one choice are required',
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.sellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Check if variant category already exists
    const existingVariant = product.variants.find(v => v.name === name);
    if (existingVariant) {
      return res.status(400).json({
        success: false,
        message: `Variant category "${name}" already exists`,
      });
    }

    // Add variant category
    product.variants.push({
      name,
      isRequired: isRequired !== undefined ? isRequired : true,
      allowMultiple: allowMultiple || false,
      choices,
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Variant category added successfully',
      product,
    });

  } catch (error) {
    console.error('Add variant category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add variant category',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Add choice to variant category
 * POST /api/products/:productId/variants/:variantId/choices
 * 
 * Flow:
 * 1. Validate product ownership
 * 2. Find variant category
 * 3. Upload choice image if provided
 * 4. Add choice to variant
 * 5. Save and return product
 */
const addVariantChoice = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const sellerId = req.user._id;
    const { name, price, priceAdjustment, stock, sku } = req.body;

    // Validation
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Choice name, price, and stock are required',
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.sellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Find variant category
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant category not found',
      });
    }

    // Check if choice already exists
    const existingChoice = variant.choices.find(c => c.name === name);
    if (existingChoice) {
      return res.status(400).json({
        success: false,
        message: `Choice "${name}" already exists in this variant`,
      });
    }

    // Upload image if provided
    let imageUrl = '';
    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        folder: 'product-variants',
      });
      imageUrl = result.secure_url;
    }

    // Add choice
    variant.choices.push({
      name,
      image: imageUrl,
      price,
      priceAdjustment: priceAdjustment || 0,
      stock,
      sku: sku || '',
      isAvailable: true,
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Choice added successfully',
      product,
    });

  } catch (error) {
    console.error('Add variant choice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add variant choice',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Update variant choice
 * PUT /api/products/:productId/variants/:variantId/choices/:choiceId
 */
const updateVariantChoice = async (req, res) => {
  try {
    const { productId, variantId, choiceId } = req.params;
    const sellerId = req.user._id;
    const { name, price, priceAdjustment, stock, sku, isAvailable } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.sellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Find variant and choice
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant category not found',
      });
    }

    const choice = variant.choices.id(choiceId);
    if (!choice) {
      return res.status(404).json({
        success: false,
        message: 'Choice not found',
      });
    }

    // Update choice
    if (name !== undefined) choice.name = name;
    if (price !== undefined) choice.price = price;
    if (priceAdjustment !== undefined) choice.priceAdjustment = priceAdjustment;
    if (stock !== undefined) choice.stock = stock;
    if (sku !== undefined) choice.sku = sku;
    if (isAvailable !== undefined) choice.isAvailable = isAvailable;

    // Upload new image if provided
    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        folder: 'product-variants',
      });
      choice.image = result.secure_url;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Choice updated successfully',
      product,
    });

  } catch (error) {
    console.error('Update variant choice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update variant choice',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Delete variant choice
 * DELETE /api/products/:productId/variants/:variantId/choices/:choiceId
 * 
 * IMPORTANT: This is a sensitive operation
 * - Check if choice is in any active carts
 * - Warn seller if deletion will affect customers
 */
const deleteVariantChoice = async (req, res) => {
  try {
    const { productId, variantId, choiceId } = req.params;
    const sellerId = req.user._id;
    const { force } = req.query; // force=true to delete anyway

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.sellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Find variant and choice
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant category not found',
      });
    }

    const choice = variant.choices.id(choiceId);
    if (!choice) {
      return res.status(404).json({
        success: false,
        message: 'Choice not found',
      });
    }

    // Check if this is the last choice in a required variant
    if (variant.isRequired && variant.choices.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last choice in a required variant. Delete the variant category instead.',
      });
    }

    // Check if choice is in any carts (optional, requires Cart model)
    // const Cart = require('../models/cartModelWithChoices');
    // const cartsWithChoice = await Cart.countDocuments({
    //   'items.variantSelections': {
    //     $elemMatch: {
    //       variant: variant.name,
    //       choice: choice.name
    //     }
    //   }
    // });

    // if (cartsWithChoice > 0 && force !== 'true') {
    //   return res.status(400).json({
    //     success: false,
    //     message: `This choice is in ${cartsWithChoice} customer cart(s). Add ?force=true to delete anyway.`,
    //     affectedCarts: cartsWithChoice,
    //   });
    // }

    // Delete choice
    variant.choices.pull(choiceId);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Choice deleted successfully',
      product,
    });

  } catch (error) {
    console.error('Delete variant choice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete variant choice',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Get product with variants
 * GET /api/products/:productId
 */
const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate('sellerId', 'name email')
      .populate('storeId', 'storeName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message,
    });
  }
};

/**
 * DEEP LOGIC: Get all products with filters
 * GET /api/products
 */
const getProducts = async (req, res) => {
  try {
    const {
      category,
      sellerId,
      search,
      minPrice,
      maxPrice,
      available,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};

    if (category) filters.category = category;
    if (sellerId) filters.sellerId = sellerId;
    if (available === 'true') filters.availability = 'Available';
    if (search) {
      filters.$text = { $search: search };
    }
    if (minPrice || maxPrice) {
      filters.basePrice = {};
      if (minPrice) filters.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filters.basePrice.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filters)
      .populate('sellerId', 'name')
      .populate('storeId', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filters);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  addVariantCategory,
  addVariantChoice,
  updateVariantChoice,
  deleteVariantChoice,
  getProduct,
  getProducts,
};

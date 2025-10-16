# Complete Product Variants, Cart & Favorites System Documentation 🛒❤️

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Schemas](#database-schemas)
3. [Backend API](#backend-api)
4. [Frontend Components](#frontend-components)
5. [System Flow](#system-flow)
6. [Usage Examples](#usage-examples)
7. [Testing Guide](#testing-guide)

---

## 🎯 System Overview

This is a complete e-commerce system for handling product variants, shopping cart, and favorites (wishlist) functionality. The system supports:

- **Multiple product variants** (e.g., Color, Size, Flavor) with individual pricing, images, and stock
- **Smart cart management** with variant tracking
- **Favorites/Wishlist** with variant-specific bookmarking
- **Real-time stock validation**
- **Seller-friendly variant management UI**
- **Customer-intuitive variant selection UI**

### Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Image Storage**: Cloudinary
- **Authentication**: JWT + Supabase

---

## 💾 Database Schemas

### 1. Product Model (`productModel.js`)

```javascript
{
  name: String,                    // Product name
  description: String,             // Product description
  price: Number,                   // Base price
  image: String,                   // Main product image (Cloudinary URL)
  category: String,                // Product category
  availability: String,            // "Available" | "Out of Stock"
  estimatedTime: Number,           // Delivery time in minutes
  shippingFee: Number,            // Shipping cost
  stock: Number,                   // Base stock (if no variants)
  discount: Number,                // Discount percentage (0-100)
  
  // Variants with individual pricing, images, and stock
  variants: [
    {
      id: String,                  // Unique variant ID (auto-generated)
      name: String,                // Variant name (e.g., "Black", "Large")
      price: Number,               // Variant-specific price
      image: String,               // Variant-specific image (Cloudinary URL)
      stock: Number,               // Variant-specific stock
      sku: String,                 // Stock Keeping Unit (optional)
      isAvailable: Boolean         // Variant availability flag
    }
  ],
  
  // Optional customization options
  options: Map<String, [String]>,  // e.g., { "Sugar": ["0%", "50%", "100%"] }
  
  // Optional paid add-ons
  addons: [
    {
      name: String,
      price: Number
    }
  ],
  
  sellerId: ObjectId,              // Reference to User (Seller)
  storeId: ObjectId,               // Reference to Store
  createdAt: Date,
  updatedAt: Date
}
```

**Example Product with Variants:**
```json
{
  "_id": "66f7b8a4c2...",
  "name": "Mascara 3in1",
  "description": "Waterproof and long-lasting mascara",
  "basePrice": 119,
  "image": "https://cloudinary.com/.../main.jpg",
  "category": "Beauty",
  "variants": [
    {
      "id": "black-abc1",
      "name": "Black",
      "price": 119,
      "image": "https://cloudinary.com/.../black.jpg",
      "stock": 10,
      "sku": "MASC-BLK-001",
      "isAvailable": true
    },
    {
      "id": "silver-tube-xyz2",
      "name": "Silver Tube",
      "price": 139,
      "image": "https://cloudinary.com/.../silver.jpg",
      "stock": 8,
      "sku": "MASC-SLV-001",
      "isAvailable": true
    }
  ],
  "sellerId": "seller123",
  "storeId": "store456",
  "createdAt": "2025-01-16T..."
}
```

### 2. Cart Model (`cartModel.js`)

```javascript
{
  user: ObjectId,                  // Reference to User
  items: [
    {
      product: ObjectId,           // Reference to Product
      selectedVariantId: String,   // Selected variant ID (if applicable)
      selectedOptions: Map,        // Selected options (e.g., {"Sugar": "50%"})
      quantity: Number,            // Item quantity
      price: Number,               // Unit price (with variant/options)
      subtotal: Number             // price × quantity
    }
  ],
  total: Number,                   // Sum of all subtotals
  createdAt: Date,
  updatedAt: Date
}
```

**Example Cart:**
```json
{
  "_id": "cart123",
  "user": "customer123",
  "items": [
    {
      "product": "66f7b8a4c2...",
      "selectedVariantId": "black-abc1",
      "quantity": 2,
      "price": 119,
      "subtotal": 238
    },
    {
      "product": "66f7b8a4c2...",
      "selectedVariantId": "silver-tube-xyz2",
      "quantity": 1,
      "price": 139,
      "subtotal": 139
    }
  ],
  "total": 377
}
```

### 3. Favorite Model (`favoriteModel.js`)

```javascript
{
  user: ObjectId,                  // Reference to User (unique per user)
  items: [
    {
      product: ObjectId,           // Reference to Product
      variantId: String,           // Specific variant ID (optional)
      variantName: String,         // Variant name for display
      addedAt: Date                // When added to favorites
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Example Favorites:**
```json
{
  "_id": "fav123",
  "user": "customer123",
  "items": [
    {
      "product": "66f7b8a4c2...",
      "variantId": "black-abc1",
      "variantName": "Black",
      "addedAt": "2025-01-16T..."
    }
  ]
}
```

---

## 🔌 Backend API

### Favorites Endpoints

#### 1. Add to Favorites
```http
POST /api/favorites
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "66f7b8a4c2...",
  "variantId": "black-abc1",      // Optional
  "variantName": "Black"          // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added to favorites",
  "data": {
    "user": "customer123",
    "items": [...]
  }
}
```

#### 2. Get Favorites
```http
GET /api/favorites
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": "customer123",
    "items": [
      {
        "_id": "item1",
        "product": {
          "_id": "66f7b8a4c2...",
          "name": "Mascara 3in1",
          "price": 119,
          "image": "...",
          "variants": [...]
        },
        "variantId": "black-abc1",
        "variantName": "Black",
        "addedAt": "2025-01-16T..."
      }
    ]
  }
}
```

#### 3. Remove from Favorites
```http
DELETE /api/favorites/:itemId
Authorization: Bearer {token}
```

#### 4. Remove Product from Favorites
```http
DELETE /api/favorites/product/:productId?variantId=black-abc1
Authorization: Bearer {token}
```

#### 5. Check if Product is Favorite
```http
GET /api/favorites/check/:productId?variantId=black-abc1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "isFavorite": true
}
```

#### 6. Clear All Favorites
```http
DELETE /api/favorites/clear/all
Authorization: Bearer {token}
```

### Cart Endpoints (Enhanced for Variants)

#### Add to Cart
```http
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "66f7b8a4c2...",
  "quantity": 2,
  "selectedVariantId": "black-abc1",    // Optional
  "selectedOptions": {                   // Optional
    "Sugar": "50%",
    "Ice": "Less"
  }
}
```

**Backend Logic:**
1. Validate product exists
2. If variant specified, validate variant exists and has stock
3. Calculate price based on variant/options
4. Check if same product + variant already in cart
   - If yes: Update quantity
   - If no: Add new cart item
5. Recalculate cart total
6. Return updated cart

---

## 🎨 Frontend Components

### 1. Seller: Manage Variants Page

**File:** `frontend/src/seller/ManageVariantsPage.jsx`

**Features:**
- ✅ View all variants for a product
- ✅ Add new variants dynamically
- ✅ Edit variant details (name, price, stock, SKU)
- ✅ Upload variant-specific images to Cloudinary
- ✅ Toggle variant availability
- ✅ Remove variants
- ✅ Auto-generate variant IDs
- ✅ Real-time preview
- ✅ Bulk save all changes

**Usage:**
```jsx
import ManageVariantsPage from './seller/ManageVariantsPage';

// Route
<Route path="/seller/products/:productId/variants" element={<ManageVariantsPage />} />
```

**UI Flow:**
1. Seller navigates to product list
2. Clicks "Manage Variants" on a product
3. Sees all existing variants
4. Can add/edit/remove variants
5. Uploads images per variant
6. Saves all changes at once

### 2. Customer: Single Product Page with Variants

**File:** `frontend/src/customer/SingleProductPageWithVariants.jsx`

**Features:**
- ✅ Display product with all variants
- ✅ Visual variant selection (cards with images)
- ✅ Real-time price update on variant change
- ✅ Real-time image update on variant change
- ✅ Stock validation per variant
- ✅ Quantity selector with stock limits
- ✅ Add to cart with selected variant
- ✅ Add to favorites (with variant)
- ✅ Favorite status indicator
- ✅ Out of stock indicators
- ✅ Low stock warnings

**Usage:**
```jsx
import SingleProductPageWithVariants from './customer/SingleProductPageWithVariants';

// Route
<Route path="/product/:productId" element={<SingleProductPageWithVariants />} />
```

**UI Flow:**
1. Customer views product
2. Sees all available variants
3. Selects a variant (price/image updates)
4. Adjusts quantity
5. Clicks "Add to Cart"
6. System validates stock
7. Adds to cart with variant info
8. Shows success message

---

## 🔄 System Flow

### Flow 1: Seller Creates Product with Variants

```
1. Seller creates base product
   ├─ Name: "Mascara 3in1"
   ├─ Base Price: ₱119
   ├─ Main Image: uploaded
   └─ Description: "Waterproof..."

2. Seller navigates to "Manage Variants"

3. Seller adds variants:
   ├─ Variant 1: "Black"
   │  ├─ Price: ₱119
   │  ├─ Stock: 10
   │  ├─ Image: black.jpg (uploaded)
   │  └─ SKU: MASC-BLK-001
   │
   └─ Variant 2: "Silver Tube"
      ├─ Price: ₱139
      ├─ Stock: 8
      ├─ Image: silver.jpg (uploaded)
      └─ SKU: MASC-SLV-001

4. System auto-generates IDs:
   ├─ black-abc1
   └─ silver-tube-xyz2

5. Seller clicks "Save All Variants"

6. Backend updates product document with variants array

7. Product is now available with variants
```

### Flow 2: Customer Adds Variant to Cart

```
1. Customer views product page
   └─ Sees 2 variants: Black (₱119), Silver Tube (₱139)

2. Customer selects "Black" variant
   ├─ Price updates to ₱119
   ├─ Image changes to black.jpg
   └─ Stock shows: 10 available

3. Customer sets quantity to 2

4. Customer clicks "Add to Cart"

5. Frontend sends request:
   POST /api/cart/add
   {
     "productId": "66f7b8a4c2...",
     "quantity": 2,
     "selectedVariantId": "black-abc1"
   }

6. Backend processes:
   ├─ Validates product exists
   ├─ Validates variant exists
   ├─ Checks stock: 10 >= 2 ✓
   ├─ Checks if same product+variant in cart
   │  ├─ If yes: Update quantity
   │  └─ If no: Add new item
   ├─ Calculates subtotal: 119 × 2 = 238
   └─ Updates cart total

7. Frontend shows success message

8. Cart now contains:
   {
     "product": "Mascara 3in1",
     "variant": "Black",
     "quantity": 2,
     "price": 119,
     "subtotal": 238
   }
```

### Flow 3: Customer Adds to Favorites

```
1. Customer on product page

2. Customer selects "Silver Tube" variant

3. Customer clicks favorite button (heart icon)

4. Frontend sends request:
   POST /api/favorites
   {
     "productId": "66f7b8a4c2...",
     "variantId": "silver-tube-xyz2",
     "variantName": "Silver Tube"
   }

5. Backend processes:
   ├─ Finds/creates favorites list for user
   ├─ Checks if product+variant already favorited
   │  ├─ If yes: Return "already in favorites"
   │  └─ If no: Add to favorites
   └─ Saves favorites document

6. Frontend updates UI:
   ├─ Heart icon turns red (filled)
   └─ Shows "Added to favorites"

7. Favorites list now contains:
   {
     "product": "Mascara 3in1",
     "variant": "Silver Tube",
     "variantId": "silver-tube-xyz2"
   }
```

---

## 📝 Usage Examples

### Example 1: Food Product with Size Variants

**Product:** Iced Coffee

```javascript
{
  name: "Iced Coffee",
  basePrice: 80,
  variants: [
    {
      id: "small-12oz-a1b2",
      name: "Small (12oz)",
      price: 80,
      stock: 50
    },
    {
      id: "medium-16oz-c3d4",
      name: "Medium (16oz)",
      price: 100,
      stock: 40
    },
    {
      id: "large-20oz-e5f6",
      name: "Large (20oz)",
      price: 120,
      stock: 30
    }
  ],
  options: {
    "Sugar Level": ["0%", "25%", "50%", "75%", "100%"],
    "Ice Level": ["No Ice", "Less Ice", "Normal", "Extra Ice"]
  }
}
```

### Example 2: Beauty Product with Color Variants

**Product:** Lipstick

```javascript
{
  name: "Matte Lipstick",
  basePrice: 299,
  variants: [
    {
      id: "red-passion-x1y2",
      name: "Red Passion",
      price: 299,
      image: "https://cloudinary.com/.../red.jpg",
      stock: 15,
      sku: "LIP-RED-001"
    },
    {
      id: "pink-blush-z3w4",
      name: "Pink Blush",
      price: 299,
      image: "https://cloudinary.com/.../pink.jpg",
      stock: 20,
      sku: "LIP-PNK-001"
    },
    {
      id: "nude-beige-v5u6",
      name: "Nude Beige",
      price: 299,
      image: "https://cloudinary.com/.../nude.jpg",
      stock: 12,
      sku: "LIP-NUD-001"
    }
  ]
}
```

### Example 3: Clothing with Size and Color

**Product:** T-Shirt

```javascript
{
  name: "Classic T-Shirt",
  basePrice: 399,
  variants: [
    {
      id: "small-black-a1",
      name: "Small - Black",
      price: 399,
      image: "https://cloudinary.com/.../s-black.jpg",
      stock: 25,
      sku: "TSH-S-BLK"
    },
    {
      id: "medium-black-b2",
      name: "Medium - Black",
      price: 399,
      image: "https://cloudinary.com/.../m-black.jpg",
      stock: 30,
      sku: "TSH-M-BLK"
    },
    {
      id: "small-white-c3",
      name: "Small - White",
      price: 399,
      image: "https://cloudinary.com/.../s-white.jpg",
      stock: 20,
      sku: "TSH-S-WHT"
    }
  ]
}
```

---

## 🧪 Testing Guide

### 1. Test Variant Creation (Seller)

```bash
# Create product first
POST /api/products
{
  "name": "Test Product",
  "price": 100,
  "category": "Test"
}

# Update with variants
PUT /api/products/:productId
{
  "variants": [
    {
      "id": "variant-1",
      "name": "Option 1",
      "price": 100,
      "stock": 10
    },
    {
      "id": "variant-2",
      "name": "Option 2",
      "price": 120,
      "stock": 5
    }
  ]
}
```

### 2. Test Add to Cart with Variant

```bash
# Add variant to cart
POST /api/cart/add
Authorization: Bearer {token}
{
  "productId": "66f7b8a4c2...",
  "quantity": 2,
  "selectedVariantId": "variant-1"
}

# Verify cart
GET /api/cart
Authorization: Bearer {token}

# Expected: Cart contains item with variant-1, quantity 2
```

### 3. Test Favorites with Variant

```bash
# Add to favorites
POST /api/favorites
Authorization: Bearer {token}
{
  "productId": "66f7b8a4c2...",
  "variantId": "variant-1",
  "variantName": "Option 1"
}

# Check favorite status
GET /api/favorites/check/66f7b8a4c2...?variantId=variant-1
Authorization: Bearer {token}

# Expected: { "isFavorite": true }

# Get all favorites
GET /api/favorites
Authorization: Bearer {token}

# Expected: List with product and variant info
```

### 4. Test Stock Validation

```bash
# Try to add more than available stock
POST /api/cart/add
{
  "productId": "66f7b8a4c2...",
  "quantity": 100,  # More than stock
  "selectedVariantId": "variant-1"
}

# Expected: Error "Insufficient stock"
```

### 5. Test Variant Selection UI

**Manual Testing:**
1. Open product page
2. Select different variants
3. Verify:
   - ✓ Price updates correctly
   - ✓ Image changes
   - ✓ Stock info displays
   - ✓ Out of stock variants are disabled
   - ✓ Selected variant is highlighted

---

## ✅ Checklist

### Backend
- [x] Product model with variants array
- [x] Cart model with variant tracking
- [x] Favorite model created
- [x] Favorite controller with all CRUD operations
- [x] Favorite routes configured
- [x] Server.js updated with favorite routes
- [x] Stock validation on add to cart
- [x] Variant price calculation

### Frontend
- [x] ManageVariantsPage for sellers
- [x] SingleProductPageWithVariants for customers
- [x] Variant selection UI
- [x] Real-time price/image updates
- [x] Stock validation UI
- [x] Favorite button with status
- [x] Success/error messages
- [x] Responsive design

### Features
- [x] Multiple variants per product
- [x] Individual variant pricing
- [x] Individual variant images
- [x] Individual variant stock
- [x] Auto-generate variant IDs
- [x] Add to cart with variant
- [x] Add to favorites with variant
- [x] Stock validation
- [x] Out of stock indicators
- [x] Low stock warnings

---

## 🎉 Summary

This system provides a **complete, production-ready** solution for:

1. **Sellers**: Easy variant management with image uploads
2. **Customers**: Intuitive variant selection and shopping experience
3. **System**: Robust stock tracking and validation
4. **Database**: Efficient schema design for variants and favorites

**Key Benefits:**
- ✅ Seller-friendly UI for managing variants
- ✅ Customer-intuitive variant selection
- ✅ Real-time stock validation
- ✅ Variant-specific pricing and images
- ✅ Favorites with variant tracking
- ✅ Smart cart management
- ✅ Mobile-responsive design
- ✅ Production-ready code

**All code is fully functional and ready to use!** 🚀

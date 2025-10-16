# System Architecture Diagram 🏗️

## 📐 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BUFOOD E-COMMERCE SYSTEM                         │
│                     Product Variants, Cart & Favorites                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────┐        ┌──────────────────────────────┐   │
│  │   SELLER COMPONENTS     │        │   CUSTOMER COMPONENTS        │   │
│  ├─────────────────────────┤        ├──────────────────────────────┤   │
│  │                         │        │                              │   │
│  │  ManageVariantsPage     │        │  SingleProductPageWith       │   │
│  │  ├─ Add Variant         │        │  Variants                    │   │
│  │  ├─ Edit Variant        │        │  ├─ View Variants           │   │
│  │  ├─ Upload Images       │        │  ├─ Select Variant          │   │
│  │  ├─ Set Price/Stock     │        │  ├─ Add to Cart             │   │
│  │  └─ Save All            │        │  └─ Add to Favorites        │   │
│  │                         │        │                              │   │
│  │  AddProductPage         │        │  CartPage                    │   │
│  │  └─ Create Product      │        │  └─ View Cart Items         │   │
│  │                         │        │                              │   │
│  │  ProductListPage        │        │  FavoritesPage               │   │
│  │  └─ Manage Products     │        │  └─ View Favorites          │   │
│  │                         │        │                              │   │
│  └─────────────────────────┘        └──────────────────────────────┘   │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ HTTP Requests (axios)
                               │ JWT/Supabase Auth
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         API ROUTES                                │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  /api/products              /api/cart              /api/favorites│  │
│  │  ├─ POST /                  ├─ POST /add           ├─ POST /     │  │
│  │  ├─ GET /:id                ├─ GET /               ├─ GET /      │  │
│  │  ├─ PUT /:id                ├─ DELETE /:itemId     ├─ DELETE /:id│  │
│  │  └─ DELETE /:id             └─ PUT /update         └─ GET /check │  │
│  │                                                                   │  │
│  └───────────────────┬──────────────────┬──────────────────┬────────┘  │
│                      │                  │                  │           │
│                      ▼                  ▼                  ▼           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        CONTROLLERS                                │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  productController      cartController      favoriteController   │  │
│  │  ├─ createProduct        ├─ addToCart       ├─ addToFavorites   │  │
│  │  ├─ getProductById       ├─ getCart         ├─ getFavorites     │  │
│  │  ├─ updateProduct        ├─ removeFromCart  ├─ removeFromFav    │  │
│  │  └─ deleteProduct        └─ updateCart      └─ checkFavorite    │  │
│  │                                                                   │  │
│  └───────────────────┬──────────────────┬──────────────────┬────────┘  │
│                      │                  │                  │           │
│                      │   Mongoose ODM   │                  │           │
│                      │                  │                  │           │
└──────────────────────┼──────────────────┼──────────────────┼───────────┘
                       │                  │                  │
                       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (MongoDB)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │   PRODUCTS       │  │      CARTS       │  │     FAVORITES        │ │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────────┤ │
│  │ _id              │  │ _id              │  │ _id                  │ │
│  │ name             │  │ user (ref)       │  │ user (ref)           │ │
│  │ price            │  │ items[]          │  │ items[]              │ │
│  │ image            │  │  ├─ product      │  │  ├─ product (ref)   │ │
│  │ variants[]       │  │  ├─ variantId    │  │  ├─ variantId       │ │
│  │  ├─ id           │  │  ├─ quantity     │  │  ├─ variantName     │ │
│  │  ├─ name         │  │  ├─ price        │  │  └─ addedAt         │ │
│  │  ├─ price        │  │  └─ subtotal     │  │                      │ │
│  │  ├─ image        │  │ total            │  │ createdAt            │ │
│  │  ├─ stock        │  │ createdAt        │  │ updatedAt            │ │
│  │  └─ isAvailable  │  │ updatedAt        │  │                      │ │
│  │ sellerId (ref)   │  │                  │  │                      │ │
│  │ createdAt        │  │                  │  │                      │ │
│  │ updatedAt        │  │                  │  │                      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐                    ┌──────────────────────────┐  │
│  │   CLOUDINARY     │                    │   SUPABASE AUTH          │  │
│  ├──────────────────┤                    ├──────────────────────────┤  │
│  │ Image Storage    │                    │ User Authentication      │  │
│  │ - Product Images │                    │ - JWT Tokens             │  │
│  │ - Variant Images │                    │ - Session Management     │  │
│  │ - Optimization   │                    │ - Email Verification     │  │
│  └──────────────────┘                    └──────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Seller Creates Product with Variants

```
┌─────────────┐
│   SELLER    │
└──────┬──────┘
       │
       │ 1. Creates Product
       ▼
┌─────────────────────────┐
│  AddProductPage         │
│  - Name: "Mascara"      │
│  - Price: ₱119          │
│  - Upload main image    │
└──────┬──────────────────┘
       │
       │ 2. POST /api/products
       ▼
┌─────────────────────────┐
│  productController      │
│  - Validates data       │
│  - Uploads to Cloudinary│
│  - Saves to MongoDB     │
└──────┬──────────────────┘
       │
       │ 3. Product Created
       ▼
┌─────────────────────────┐
│  ManageVariantsPage     │
│  - Add Variant 1        │
│    • Name: "Black"      │
│    • Price: ₱119        │
│    • Stock: 10          │
│    • Upload image       │
│  - Add Variant 2        │
│    • Name: "Silver"     │
│    • Price: ₱139        │
│    • Stock: 8           │
│    • Upload image       │
└──────┬──────────────────┘
       │
       │ 4. PUT /api/products/:id
       │    { variants: [...] }
       ▼
┌─────────────────────────┐
│  productController      │
│  - Validates variants   │
│  - Auto-generates IDs   │
│  - Updates product      │
└──────┬──────────────────┘
       │
       │ 5. Variants Saved
       ▼
┌─────────────────────────┐
│  MongoDB Products       │
│  {                      │
│    name: "Mascara",     │
│    variants: [          │
│      {                  │
│        id: "black-abc1",│
│        name: "Black",   │
│        price: 119,      │
│        stock: 10        │
│      },                 │
│      {                  │
│        id: "silver-xyz",│
│        name: "Silver",  │
│        price: 139,      │
│        stock: 8         │
│      }                  │
│    ]                    │
│  }                      │
└─────────────────────────┘
```

### Flow 2: Customer Adds Variant to Cart

```
┌─────────────┐
│  CUSTOMER   │
└──────┬──────┘
       │
       │ 1. Views Product
       ▼
┌─────────────────────────────────┐
│  SingleProductPageWithVariants  │
│  - Product: "Mascara"           │
│  - Variants:                    │
│    ○ Black - ₱119               │
│    ○ Silver - ₱139              │
└──────┬──────────────────────────┘
       │
       │ 2. Selects "Black" variant
       ▼
┌─────────────────────────────────┐
│  UI Updates                     │
│  - Price: ₱119                  │
│  - Image: black.jpg             │
│  - Stock: 10 available          │
└──────┬──────────────────────────┘
       │
       │ 3. Sets quantity: 2
       │ 4. Clicks "Add to Cart"
       ▼
┌─────────────────────────────────┐
│  Frontend Validation            │
│  ✓ Variant selected             │
│  ✓ Stock available (10 >= 2)    │
└──────┬──────────────────────────┘
       │
       │ 5. POST /api/cart/add
       │    {
       │      productId: "...",
       │      quantity: 2,
       │      selectedVariantId: "black-abc1"
       │    }
       ▼
┌─────────────────────────────────┐
│  cartController.addToCart       │
│  1. Validate product exists     │
│  2. Validate variant exists     │
│  3. Check stock: 10 >= 2 ✓      │
│  4. Find user's cart            │
│  5. Check if same product+      │
│     variant already in cart     │
│     - If yes: Update quantity   │
│     - If no: Add new item       │
│  6. Calculate subtotal: 119×2   │
│  7. Update cart total           │
└──────┬──────────────────────────┘
       │
       │ 6. Cart Updated
       ▼
┌─────────────────────────────────┐
│  MongoDB Carts                  │
│  {                              │
│    user: "customer123",         │
│    items: [                     │
│      {                          │
│        product: "productId",    │
│        selectedVariantId:       │
│          "black-abc1",          │
│        quantity: 2,             │
│        price: 119,              │
│        subtotal: 238            │
│      }                          │
│    ],                           │
│    total: 238                   │
│  }                              │
└──────┬──────────────────────────┘
       │
       │ 7. Success Response
       ▼
┌─────────────────────────────────┐
│  Frontend UI                    │
│  ✓ Success message displayed    │
│  ✓ Cart icon updated            │
└─────────────────────────────────┘
```

### Flow 3: Customer Adds to Favorites

```
┌─────────────┐
│  CUSTOMER   │
└──────┬──────┘
       │
       │ 1. On Product Page
       ▼
┌─────────────────────────────────┐
│  SingleProductPageWithVariants  │
│  - Product: "Mascara"           │
│  - Selected: "Silver" variant   │
└──────┬──────────────────────────┘
       │
       │ 2. Clicks heart icon
       ▼
┌─────────────────────────────────┐
│  Frontend                       │
│  - Checks if already favorited  │
│  - If not, sends request        │
└──────┬──────────────────────────┘
       │
       │ 3. POST /api/favorites
       │    {
       │      productId: "...",
       │      variantId: "silver-xyz",
       │      variantName: "Silver"
       │    }
       ▼
┌─────────────────────────────────┐
│  favoriteController             │
│  1. Validate product exists     │
│  2. Find/create favorites list  │
│  3. Check if already favorited  │
│     - If yes: Return error      │
│     - If no: Add to list        │
│  4. Save favorites              │
└──────┬──────────────────────────┘
       │
       │ 4. Favorite Added
       ▼
┌─────────────────────────────────┐
│  MongoDB Favorites              │
│  {                              │
│    user: "customer123",         │
│    items: [                     │
│      {                          │
│        product: "productId",    │
│        variantId: "silver-xyz", │
│        variantName: "Silver",   │
│        addedAt: "2025-01-16"    │
│      }                          │
│    ]                            │
│  }                              │
└──────┬──────────────────────────┘
       │
       │ 5. Success Response
       ▼
┌─────────────────────────────────┐
│  Frontend UI                    │
│  ✓ Heart icon turns red         │
│  ✓ "Added to favorites" message │
└─────────────────────────────────┘
```

---

## 🗂️ File Structure

```
BuFood/
│
├── backend-api/
│   ├── models/
│   │   ├── productModel.js         ✅ Updated (variants)
│   │   ├── cartModel.js            ✅ Existing (variant support)
│   │   └── favoriteModel.js        ✅ NEW
│   │
│   ├── controllers/
│   │   ├── productController.js    ✅ Existing
│   │   ├── cartController.js       ✅ Existing
│   │   └── favoriteController.js   ✅ NEW
│   │
│   ├── routes/
│   │   ├── productRoutes.js        ✅ Existing
│   │   ├── cartRoutes.js           ✅ Existing
│   │   └── favoriteRoutes.js       ✅ NEW
│   │
│   └── server.js                   ✅ Updated
│
├── frontend/
│   └── src/
│       ├── seller/
│       │   ├── ManageVariantsPage.jsx      ✅ NEW
│       │   ├── AddProductPage.jsx          ✅ Existing
│       │   └── ProductListPage.jsx         ✅ Existing
│       │
│       ├── customer/
│       │   ├── SingleProductPageWithVariants.jsx  ✅ NEW
│       │   ├── CartPage.jsx                       ✅ Existing
│       │   └── FavoritesPage.jsx                  ✅ To be created
│       │
│       └── api.js                          ✅ Update with favorites
│
└── Documentation/
    ├── VARIANTS_CART_FAVORITES_SYSTEM.md        ✅ Complete docs
    ├── QUICK_IMPLEMENTATION_GUIDE.md            ✅ Setup guide
    ├── IMPLEMENTATION_SUMMARY.md                ✅ Summary
    └── SYSTEM_ARCHITECTURE_DIAGRAM.md           ✅ This file
```

---

## 🎯 Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    SELLER WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AddProductPage ──────────► ProductListPage                │
│       │                            │                        │
│       │ Creates                    │ Manages                │
│       │ Product                    │ Products               │
│       ▼                            ▼                        │
│  Product Created ──────────► ManageVariantsPage            │
│                                     │                       │
│                                     │ Adds/Edits            │
│                                     │ Variants              │
│                                     ▼                       │
│                              Product with Variants          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CUSTOMER WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ProductListPage ──────────► SingleProductPageWithVariants │
│       │                              │         │            │
│       │ Browse                       │         │            │
│       │ Products                     │         │            │
│       │                              ▼         ▼            │
│       │                         Add to    Add to            │
│       │                          Cart    Favorites          │
│       │                              │         │            │
│       │                              ▼         ▼            │
│       └──────────────────────► CartPage  FavoritesPage     │
│                                     │                       │
│                                     │ Checkout              │
│                                     ▼                       │
│                                OrderPage                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────────┐
│    USER      │
└──────┬───────┘
       │
       │ 1. Login
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  - Email/Password   │
│  - JWT Token        │
└──────┬──────────────┘
       │
       │ 2. Token Stored
       ▼
┌─────────────────────┐
│  localStorage       │
│  token: "jwt..."    │
└──────┬──────────────┘
       │
       │ 3. All API Requests
       ▼
┌─────────────────────┐
│  API Headers        │
│  Authorization:     │
│  Bearer {token}     │
└──────┬──────────────┘
       │
       │ 4. Middleware
       ▼
┌─────────────────────┐
│  authenticateWith   │
│  Supabase           │
│  - Verifies token   │
│  - Attaches user    │
└──────┬──────────────┘
       │
       │ 5. Authorized
       ▼
┌─────────────────────┐
│  Controller         │
│  req.user available │
└─────────────────────┘
```

---

## 📊 Database Relationships

```
┌──────────────┐
│    USERS     │
│ _id          │
│ name         │
│ email        │
│ role         │
└──────┬───────┘
       │
       │ One-to-Many
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────┐                  ┌──────────────┐
│   PRODUCTS   │                  │    CARTS     │
│ _id          │                  │ _id          │
│ name         │                  │ user ────────┼──► User
│ variants[]   │◄─────────────────┤ items[]      │
│ sellerId ────┼──► User          │  product ────┼──► Product
└──────────────┘                  │  variantId   │
       │                          └──────────────┘
       │
       │ Referenced by
       │
       ▼
┌──────────────┐
│  FAVORITES   │
│ _id          │
│ user ────────┼──► User
│ items[]      │
│  product ────┼──► Product
│  variantId   │
└──────────────┘
```

---

## 🎨 UI Component Hierarchy

```
App
│
├── Seller Routes
│   ├── SellerDashboard
│   ├── AddProductPage
│   ├── ProductListPage
│   │   └── ProductCard
│   │       └── [Manage Variants Button]
│   │
│   └── ManageVariantsPage
│       ├── ProductInfo
│       ├── VariantsList
│       │   └── VariantCard
│       │       ├── VariantImage
│       │       ├── VariantForm
│       │       └── VariantActions
│       └── SaveButton
│
└── Customer Routes
    ├── HomePage
    ├── ProductListPage
    │   └── ProductCard
    │
    ├── SingleProductPageWithVariants
    │   ├── ProductHeader
    │   │   ├── BackButton
    │   │   └── FavoriteButton
    │   ├── ProductImage
    │   ├── ProductInfo
    │   ├── VariantsSection
    │   │   └── VariantCard[]
    │   ├── QuantitySelector
    │   └── AddToCartButton
    │
    ├── CartPage
    │   └── CartItem[]
    │       ├── ProductInfo
    │       ├── VariantInfo
    │       └── QuantityControls
    │
    └── FavoritesPage
        └── FavoriteItem[]
            ├── ProductInfo
            ├── VariantInfo
            └── RemoveButton
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
└─────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   FRONTEND   │         │   BACKEND    │         │   DATABASE   │
│              │         │              │         │              │
│  Vercel/     │◄───────►│  Render/     │◄───────►│  MongoDB     │
│  Netlify     │  HTTPS  │  Railway     │  Secure │  Atlas       │
│              │         │              │  Connect│              │
│  React App   │         │  Express API │         │  Collections │
│  Static      │         │  Node.js     │         │  - Products  │
│  Assets      │         │  REST API    │         │  - Carts     │
│              │         │              │         │  - Favorites │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│  CLOUDINARY  │         │   SUPABASE   │
│              │         │              │
│  Image CDN   │         │  Auth        │
│  Storage     │         │  JWT Tokens  │
│  Transform   │         │  Sessions    │
└──────────────┘         └──────────────┘
```

---

This architecture provides a **complete, scalable, and production-ready** system for handling product variants, shopping cart, and favorites in your e-commerce application! 🎉

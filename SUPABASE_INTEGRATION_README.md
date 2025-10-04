# Supabase Authentication Integration - Complete Guide

## 🎯 Overview

This document provides a complete overview of the Supabase authentication integration for the BuFood application. The system uses **Supabase for authentication** and **MongoDB Atlas for application data**, providing the best of both worlds: secure, managed authentication and flexible data storage.

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [File Structure](#file-structure)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Migration Guide](#migration-guide)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React + Vite                                         │  │
│  │  - Supabase Client (@supabase/supabase-js)          │  │
│  │  - Auth Context & Hooks                             │  │
│  │  - Protected Routes                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    JWT Tokens (Supabase)
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js + Express)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication Layer                                 │  │
│  │  - Supabase Middleware (verifies JWT)               │  │
│  │  - Legacy JWT Middleware (backward compatible)      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic                                       │  │
│  │  - User Management                                    │  │
│  │  - Store Management                                   │  │
│  │  - Product, Order, Cart Controllers                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ ↑                                    ↓ ↑
    Supabase Auth                          MongoDB Atlas
    (Authentication)                       (Application Data)
         ↓ ↑                                    ↓ ↑
┌──────────────────────┐            ┌──────────────────────┐
│   Supabase Cloud     │            │   MongoDB Atlas      │
│  - User Credentials  │            │  - User Profiles     │
│  - Email Verification│            │  - Stores            │
│  - Password Reset    │            │  - Products          │
│  - Session Mgmt      │            │  - Orders            │
└──────────────────────┘            │  - Carts             │
                                    │  - Reviews           │
                                    └──────────────────────┘
```

### Data Flow

**Registration Flow**:
1. User submits registration form
2. Frontend calls backend `/api/auth/supabase/register`
3. Backend creates user in Supabase (handles auth)
4. Backend creates user profile in MongoDB with `supabaseId`
5. Supabase sends verification email
6. User verifies email via Supabase link
7. MongoDB user record updated to `isVerified: true`

**Login Flow**:
1. User submits credentials
2. Frontend calls backend `/api/auth/supabase/login`
3. Backend authenticates with Supabase
4. Supabase returns JWT access token
5. Backend fetches user data from MongoDB using `supabaseId`
6. Frontend stores token and user data

**Protected Request Flow**:
1. Frontend includes Supabase JWT in Authorization header
2. Backend middleware verifies token with Supabase
3. Backend fetches user from MongoDB using `supabaseId`
4. Request proceeds with user context

## ✨ Features

### Authentication Features
- ✅ Secure user registration with email verification
- ✅ Email/password login
- ✅ Password reset via email
- ✅ Automatic token refresh
- ✅ Session management
- ✅ Role-based access control (Customer/Seller)
- ✅ Profile management
- ✅ Profile image upload

### Security Features
- ✅ Industry-standard JWT authentication (Supabase)
- ✅ Secure password hashing (handled by Supabase)
- ✅ Email verification required
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation

### Developer Features
- ✅ Dual authentication support (Supabase + Legacy JWT)
- ✅ Backward compatibility
- ✅ Migration script for existing users
- ✅ Comprehensive error handling
- ✅ Detailed logging
- ✅ API documentation (Swagger)

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account
- Supabase account
- Git

### 1. Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd BuFood

# Install backend dependencies
cd backend-api
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Supabase

1. Go to https://supabase.com and create an account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key
   - service_role key

### 3. Set Up MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Create a cluster
3. Get your connection string

### 4. Configure Environment Variables

**Backend** (`backend-api/.env`):
```env
# MongoDB
MONGODB_URI=your-mongodb-connection-string

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=8000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
```

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

### 5. Run the Application

```bash
# Terminal 1 - Backend
cd backend-api
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Test Authentication

1. Open http://localhost:5173
2. Register a new account
3. Check email for verification link
4. Verify email and login

## 📁 File Structure

```
BuFood/
├── backend-api/
│   ├── config/
│   │   └── supabaseConfig.js          # Supabase client & helpers
│   ├── controllers/
│   │   ├── authController.js          # Legacy JWT auth
│   │   └── supabaseAuthController.js  # New Supabase auth
│   ├── middlewares/
│   │   ├── authMiddleware.js          # Legacy JWT middleware
│   │   └── supabaseAuthMiddleware.js  # Supabase auth middleware
│   ├── models/
│   │   └── userModel.js               # Updated with supabaseId
│   ├── routes/
│   │   ├── authRoutes.js              # Legacy auth routes
│   │   └── supabaseAuthRoutes.js      # Supabase auth routes
│   ├── scripts/
│   │   └── migrateUsersToSupabase.js  # Migration script
│   ├── .env                            # Environment variables
│   ├── ENV_TEMPLATE.md                 # Env var template
│   ├── SUPABASE_SETUP.md              # Setup guide
│   └── server.js                       # Updated with Supabase routes
│
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js            # Supabase client config
│   │   ├── services/
│   │   │   └── supabaseAuthService.js # Auth API service
│   │   ├── hooks/
│   │   │   └── useSupabaseAuth.js     # Auth hook
│   │   ├── contexts/
│   │   │   └── SupabaseAuthContext.jsx # Auth context
│   │   └── components/
│   │       └── ProtectedRoute.jsx      # Route protection
│   ├── .env                            # Environment variables
│   └── ENV_TEMPLATE.md                 # Env var template
│
├── MIGRATION_GUIDE.md                  # Migration instructions
└── SUPABASE_INTEGRATION_README.md      # This file
```

## ⚙️ Configuration

### Supabase Dashboard Settings

#### 1. Authentication Settings

Go to **Authentication** → **Settings**:

- **Site URL**: `http://localhost:5173` (dev) or your production URL
- **Redirect URLs**: Add:
  - `http://localhost:5173/verify-email`
  - `http://localhost:5173/reset-password`
  - Your production URLs

#### 2. Email Templates

Go to **Authentication** → **Email Templates**:

Customize templates for:
- Confirm signup
- Reset password
- Magic link (optional)

#### 3. Email Provider

Go to **Authentication** → **Settings** → **Email**:

- Enable email provider
- Configure SMTP (optional, uses Supabase by default)
- Set minimum password length (recommended: 8+)

### Backend Configuration

Key environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for legacy JWT | Yes* |
| `FRONTEND_URL` | Frontend URL for redirects | Yes |

*Required for backward compatibility

### Frontend Configuration

Key environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |

## 💻 Usage Examples

### Frontend - Registration

```javascript
import { useAuth } from './contexts/SupabaseAuthContext';

function RegisterForm() {
  const { register, loading, error } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      await register({
        name: formData.name,
        email: formData.email,
        contactNumber: formData.phone,
        password: formData.password,
        role: 'Customer'
      });
      // Show success message
    } catch (err) {
      // Handle error
    }
  };

  return (/* Your form JSX */);
}
```

### Frontend - Login

```javascript
import { useAuth } from './contexts/SupabaseAuthContext';

function LoginForm() {
  const { login, loading, error } = useAuth();

  const handleLogin = async (email, password) => {
    try {
      const result = await login(email, password);
      // Redirect to dashboard
    } catch (err) {
      // Handle error
    }
  };

  return (/* Your form JSX */);
}
```

### Frontend - Protected Route

```javascript
import ProtectedRoute from './components/ProtectedRoute';
import { SellerRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Seller-only routes */}
      <Route path="/seller/products" element={
        <SellerRoute>
          <ProductManagement />
        </SellerRoute>
      } />
    </Routes>
  );
}
```

### Backend - Protected Endpoint

```javascript
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');

// Protected route
router.get('/profile', authenticateWithSupabase, async (req, res) => {
  // req.user contains MongoDB user
  // req.supabaseUser contains Supabase user
  res.json(req.user);
});

// Role-specific route
const { checkRole } = require('../middlewares/supabaseAuthMiddleware');

router.post('/products', 
  authenticateWithSupabase, 
  checkRole('Seller'),
  async (req, res) => {
    // Only sellers can access
  }
);
```

## 📚 API Reference

### Authentication Endpoints

Base URL: `/api/auth/supabase`

#### POST /register

Register a new user.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "contactNumber": "1234567890",
  "password": "SecurePass123!",
  "role": "Customer"
}
```

**Response**:
```json
{
  "message": "User registered successfully",
  "userId": "mongodb-user-id",
  "supabaseId": "supabase-user-id"
}
```

#### POST /login

Login user.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "mongodb-user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Customer"
  }
}
```

#### GET /me

Get current user (requires authentication).

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Customer",
  "profileImage": "https://..."
}
```

#### POST /forgot-password

Request password reset.

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response**:
```json
{
  "message": "Password reset email sent successfully"
}
```

See `backend-api/SUPABASE_SETUP.md` for complete API documentation.

## 🔄 Migration Guide

### Migrating Existing Users

If you have existing users with JWT authentication:

1. **Prepare**:
   ```bash
   cd backend-api
   cp .env .env.backup
   ```

2. **Test Migration (Dry Run)**:
   ```bash
   DRY_RUN=true node scripts/migrateUsersToSupabase.js
   ```

3. **Run Migration**:
   ```bash
   node scripts/migrateUsersToSupabase.js
   ```

4. **Verify**:
   - Check Supabase dashboard for migrated users
   - Verify MongoDB users have `supabaseId`
   - Test login with migrated accounts

See `MIGRATION_GUIDE.md` for detailed instructions.

## 🔒 Security

### Best Practices

1. **Environment Variables**:
   - Never commit `.env` files
   - Use different keys for dev/staging/production
   - Rotate secrets regularly

2. **API Keys**:
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
   - Use `SUPABASE_ANON_KEY` for frontend only
   - Implement Row Level Security (RLS) in Supabase

3. **Password Policy**:
   - Minimum 8 characters
   - Require uppercase, lowercase, numbers
   - Consider special characters

4. **Production**:
   - Always use HTTPS
   - Enable rate limiting
   - Monitor authentication logs
   - Implement MFA (optional)

### Security Features Implemented

- ✅ JWT token verification
- ✅ Email verification required
- ✅ Secure password reset flow
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection protection (MongoDB)
- ✅ XSS protection

## 🐛 Troubleshooting

### Common Issues

#### "Invalid API key"

**Cause**: Incorrect Supabase credentials

**Solution**:
1. Verify `SUPABASE_URL` and keys in `.env`
2. Check for extra spaces or quotes
3. Regenerate keys in Supabase dashboard if needed

#### "User not found in database"

**Cause**: User exists in Supabase but not MongoDB

**Solution**:
1. Check if user has `supabaseId` in MongoDB
2. Verify registration completed successfully
3. Check backend logs for errors during registration

#### "Email not verified"

**Cause**: User hasn't clicked verification link

**Solution**:
1. Check spam folder
2. Resend verification email
3. Verify email settings in Supabase dashboard

#### CORS Errors

**Cause**: Frontend URL not in allowed origins

**Solution**:
1. Add frontend URL to `server.js` allowed origins
2. Add redirect URLs in Supabase dashboard
3. Check browser console for specific error

#### Token Expired

**Cause**: Access token has expired

**Solution**:
- Token refresh is automatic (handled by `supabaseAuthService.js`)
- If issues persist, check refresh token configuration

### Debug Mode

Enable detailed logging:

```env
# Backend
NODE_ENV=development
DEBUG=supabase:*

# Frontend
VITE_DEBUG=true
```

### Getting Help

1. Check application logs
2. Review Supabase dashboard logs
3. Check MongoDB Atlas logs
4. Review this documentation
5. Check Supabase docs: https://supabase.com/docs

## 📊 Monitoring

### Key Metrics to Monitor

1. **Authentication**:
   - Registration success rate
   - Login success rate
   - Email verification rate
   - Password reset requests

2. **Performance**:
   - Token verification latency
   - Database query times
   - API response times

3. **Security**:
   - Failed login attempts
   - Rate limit hits
   - Suspicious activity

### Logging

Logs are stored in:
- Backend: `backend-api/logs/`
- Supabase: Dashboard → Logs
- MongoDB: Atlas → Monitoring

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update all URLs to production domains
- [ ] Use strong, unique secrets
- [ ] Enable HTTPS
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Configure backup strategy
- [ ] Test all auth flows
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Document deployment process

### Environment-Specific Configuration

**Development**:
- Use localhost URLs
- Enable debug logging
- Relaxed CORS

**Staging**:
- Use staging URLs
- Moderate logging
- Restricted CORS

**Production**:
- Use production URLs
- Error-level logging only
- Strict CORS
- Enable all security features

## 📝 License

[Your License]

## 👥 Contributors

[Your Team]

## 📞 Support

For issues or questions:
- Email: support@bufood.com
- Documentation: [Your docs URL]
- GitHub Issues: [Your repo URL]

---

**Last Updated**: 2025-10-04  
**Version**: 1.0.0  
**Maintained by**: BuFood Development Team

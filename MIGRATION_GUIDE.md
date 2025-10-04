# Migration Guide: JWT to Supabase Authentication

This guide explains how to migrate from the legacy JWT authentication to Supabase authentication while maintaining backward compatibility.

## Overview

The BuFood application now supports **dual authentication**:
- **Legacy JWT Authentication**: Existing users continue to work
- **Supabase Authentication**: New users and migrated users

## Architecture

### Before (JWT Only)
```
Frontend → Backend (JWT) → MongoDB
```

### After (Hybrid)
```
Frontend → Backend → Supabase (Auth) + MongoDB (Data)
```

## Migration Options

### Option 1: Gradual Migration (Recommended)

**Pros**: No disruption to existing users, smooth transition
**Cons**: Maintains two auth systems temporarily

**Steps**:
1. Deploy new code with both auth systems
2. New users automatically use Supabase
3. Existing users continue with JWT
4. Gradually migrate users (see migration script below)
5. Eventually deprecate JWT auth

### Option 2: Immediate Migration

**Pros**: Clean cutover, single auth system
**Cons**: Requires all users to reset passwords

**Steps**:
1. Notify all users about the migration
2. Deploy new code
3. Run migration script for all users
4. Force password reset for all users
5. Remove JWT auth code

## Current Implementation Status

✅ **Completed**:
- Supabase client configuration (backend & frontend)
- Supabase authentication middleware
- Supabase auth controllers and routes
- User model updated with `supabaseId` field
- Frontend hooks and services
- Protected route components
- Dual authentication support

⬜ **Pending**:
- User migration script
- Frontend UI updates for Supabase auth
- Testing and validation
- Production deployment

## Step-by-Step Migration Process

### Step 1: Set Up Supabase Project

Follow the instructions in `backend-api/SUPABASE_SETUP.md`

### Step 2: Configure Environment Variables

**Backend** (`backend-api/.env`):
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

### Step 3: Install Dependencies

```bash
# Backend
cd backend-api
npm install @supabase/supabase-js

# Frontend
cd frontend
npm install @supabase/supabase-js
```

### Step 4: Update Frontend App

Wrap your app with the Supabase auth provider:

```jsx
// frontend/src/main.jsx or App.jsx
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

function App() {
  return (
    <SupabaseAuthProvider>
      {/* Your app components */}
    </SupabaseAuthProvider>
  );
}
```

### Step 5: Update Authentication Components

Replace existing auth service calls with Supabase auth service:

**Before**:
```javascript
import { login, register } from './api';
```

**After**:
```javascript
import { loginUser, registerUser } from './services/supabaseAuthService';
```

### Step 6: Test New User Registration

1. Register a new user
2. Check Supabase dashboard for the user
3. Verify email verification flow
4. Test login with new user
5. Verify MongoDB has user with `supabaseId`

### Step 7: Migrate Existing Users (Optional)

Create and run the migration script:

```javascript
// backend-api/scripts/migrateUsersToSupabase.js
const mongoose = require('mongoose');
const User = require('../models/userModel');
const { createSupabaseUser } = require('../config/supabaseConfig');
require('dotenv').config();

async function migrateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users without Supabase ID
    const usersToMigrate = await User.find({ 
      supabaseId: { $exists: false },
      authMethod: { $ne: 'supabase' }
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    for (const user of usersToMigrate) {
      try {
        // Generate temporary password
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

        // Create user in Supabase
        const supabaseUser = await createSupabaseUser(
          user.email,
          tempPassword,
          {
            name: user.name,
            contactNumber: user.contactNumber,
            role: user.role
          }
        );

        // Update MongoDB user
        user.supabaseId = supabaseUser.id;
        user.authMethod = 'supabase';
        await user.save();

        console.log(`✅ Migrated: ${user.email}`);

        // TODO: Send password reset email to user
        // await sendPasswordResetEmail(user.email);

      } catch (error) {
        console.error(`❌ Failed to migrate ${user.email}:`, error.message);
      }
    }

    console.log('Migration completed');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateUsers();
```

Run the migration:
```bash
cd backend-api
node scripts/migrateUsersToSupabase.js
```

### Step 8: Update Protected Routes

Replace authentication checks:

**Before**:
```javascript
import { authenticate } from './middlewares/authMiddleware';
router.get('/protected', authenticate, handler);
```

**After** (supports both):
```javascript
import { authenticate } from './middlewares/authMiddleware';
import { authenticateWithSupabase } from './middlewares/supabaseAuthMiddleware';

// For new Supabase-only routes
router.get('/protected', authenticateWithSupabase, handler);

// For backward-compatible routes (supports both)
router.get('/legacy', authenticate, handler);
```

### Step 9: Update API Calls in Frontend

**Before**:
```javascript
const response = await axios.get('/api/auth/me', {
  headers: { Authorization: `Bearer ${jwtToken}` }
});
```

**After**:
```javascript
import { getAccessToken } from './config/supabase';

const token = await getAccessToken();
const response = await axios.get('/api/auth/supabase/me', {
  headers: { Authorization: `Bearer ${token}` }
});
```

Or use the auth service:
```javascript
import { getCurrentUser } from './services/supabaseAuthService';
const user = await getCurrentUser();
```

## API Endpoint Changes

### New Supabase Endpoints

All prefixed with `/api/auth/supabase`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register with Supabase |
| `/login` | POST | Login with Supabase |
| `/logout` | POST | Logout |
| `/me` | GET | Get current user |
| `/verify-email` | POST | Verify email |
| `/resend-verification` | POST | Resend verification |
| `/forgot-password` | POST | Request password reset |
| `/reset-password` | POST | Reset password |
| `/profile` | PUT | Update profile |
| `/profile/image` | POST | Upload profile image |

### Legacy JWT Endpoints

All prefixed with `/api/auth` (still functional):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Legacy registration |
| `/login` | POST | Legacy login |
| `/logout` | POST | Legacy logout |
| `/me` | GET | Get current user (JWT) |

## Testing Checklist

- [ ] New user registration with Supabase
- [ ] Email verification flow
- [ ] Login with Supabase credentials
- [ ] Logout functionality
- [ ] Password reset flow
- [ ] Profile updates
- [ ] Protected routes with Supabase auth
- [ ] Token refresh on expiry
- [ ] Legacy JWT users can still login
- [ ] Migrated users can login with new system

## Rollback Plan

If issues arise:

1. **Immediate**: Remove Supabase routes from `server.js`
2. **Frontend**: Revert to legacy auth service
3. **Database**: Supabase IDs are non-breaking (optional field)
4. **Users**: No data loss, continue with JWT

## Common Issues and Solutions

### Issue: "User not found in database"
**Solution**: Ensure user exists in MongoDB with matching `supabaseId`

### Issue: "Invalid token"
**Solution**: Check Supabase URL and keys are correct

### Issue: "Email not verified"
**Solution**: Check Supabase dashboard, resend verification email

### Issue: CORS errors
**Solution**: Add frontend URL to allowed origins in `server.js`

### Issue: Token expired
**Solution**: Implement token refresh (already handled in auth service)

## Performance Considerations

- **Token Verification**: Supabase tokens are verified via API call (slight latency)
- **Caching**: Consider caching user data to reduce database queries
- **Session Management**: Supabase handles session refresh automatically

## Security Improvements

✅ **Enhanced Security**:
- Industry-standard authentication (Supabase)
- Built-in email verification
- Secure password reset flow
- Automatic token refresh
- Rate limiting on auth endpoints

⚠️ **Important**:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Always use HTTPS in production
- Implement proper CORS configuration
- Monitor authentication logs

## Next Steps

1. ✅ Complete Supabase setup
2. ⬜ Update all frontend auth components
3. ⬜ Test thoroughly in development
4. ⬜ Run migration script for existing users
5. ⬜ Deploy to staging environment
6. ⬜ User acceptance testing
7. ⬜ Deploy to production
8. ⬜ Monitor and optimize
9. ⬜ Eventually deprecate JWT auth (optional)

## Support

For questions or issues:
- Check Supabase docs: https://supabase.com/docs
- Review application logs
- Check MongoDB Atlas logs
- Contact development team

---

**Last Updated**: 2025-10-04
**Version**: 1.0.0

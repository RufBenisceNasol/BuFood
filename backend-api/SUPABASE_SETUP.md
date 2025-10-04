# Supabase Authentication Setup Guide

This guide will help you integrate Supabase Authentication with your BuFood application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed
3. MongoDB Atlas account and connection string

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Name**: BuFood (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (for frontend)
   - **service_role** key (for backend - keep this secret!)

## Step 3: Configure Environment Variables

Add the following to your `.env` file in the `backend-api` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Frontend URL (for email redirects)
FRONTEND_URL=http://localhost:5173

# Existing MongoDB and other configs
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
```

## Step 4: Configure Supabase Email Templates

1. Go to **Authentication** → **Email Templates** in your Supabase dashboard
2. Customize the following templates:

### Confirm Signup Template
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### Reset Password Template
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

## Step 5: Configure Authentication Settings

1. Go to **Authentication** → **Settings**
2. Configure the following:

### Site URL
Set to your frontend URL:
- Development: `http://localhost:5173`
- Production: `https://your-domain.com`

### Redirect URLs
Add the following allowed redirect URLs:
- `http://localhost:5173/verify-email`
- `http://localhost:5173/reset-password`
- `https://your-domain.com/verify-email` (production)
- `https://your-domain.com/reset-password` (production)

### Email Auth
- Enable Email provider
- Enable "Confirm email" (recommended)
- Set "Minimum password length" to 8 or higher

## Step 6: Update Frontend Configuration

Create a Supabase configuration file in your frontend:

**frontend/src/config/supabase.js**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Add to **frontend/.env**:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
VITE_API_URL=http://localhost:8000
```

## Step 7: Install Frontend Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

## Architecture Overview

### Authentication Flow

1. **Registration**:
   - User submits registration form
   - Backend creates user in Supabase
   - Backend creates user profile in MongoDB with `supabaseId`
   - Supabase sends verification email
   - User clicks verification link
   - Email is verified in Supabase
   - MongoDB user record is updated

2. **Login**:
   - User submits credentials
   - Backend authenticates with Supabase
   - Supabase returns JWT access token
   - Backend fetches user data from MongoDB using `supabaseId`
   - Frontend stores token and user data

3. **Protected Routes**:
   - Frontend sends Supabase JWT token in Authorization header
   - Backend middleware verifies token with Supabase
   - Backend fetches user from MongoDB using `supabaseId`
   - Request proceeds with user context

### Data Storage

**Supabase (Authentication)**:
- User credentials (email, password hash)
- Email verification status
- Password reset tokens
- Session management

**MongoDB (Application Data)**:
- User profiles (name, contact, role)
- Stores (for sellers)
- Products
- Orders
- Carts
- Reviews
- Favorites

## API Endpoints

### Supabase Authentication Endpoints

All endpoints are prefixed with `/api/auth/supabase`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login user |
| POST | `/logout` | Logout user |
| POST | `/verify-email` | Verify email |
| POST | `/resend-verification` | Resend verification email |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| GET | `/me` | Get current user |
| PUT | `/profile` | Update profile |
| POST | `/profile/image` | Upload profile image |

### Legacy JWT Endpoints (Backward Compatible)

All endpoints are prefixed with `/api/auth`

These endpoints continue to work for existing users using JWT authentication.

## Testing the Integration

### 1. Test Registration

```bash
curl -X POST http://localhost:8000/api/auth/supabase/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "contactNumber": "1234567890",
    "password": "SecurePass123!",
    "role": "Customer"
  }'
```

### 2. Check Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Verify the new user appears
3. Check email verification status

### 3. Test Login

```bash
curl -X POST http://localhost:8000/api/auth/supabase/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 4. Test Protected Endpoint

```bash
curl -X GET http://localhost:8000/api/auth/supabase/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Migration Strategy

### For Existing Users

If you have existing users with JWT authentication:

1. **Dual Authentication Support**: The system now supports both JWT and Supabase authentication
2. **Gradual Migration**: 
   - New users automatically use Supabase
   - Existing users continue with JWT
   - Optionally migrate existing users to Supabase

### Migration Script (Optional)

Create a migration script to move existing users to Supabase:

```javascript
// scripts/migrateToSupabase.js
const User = require('../models/userModel');
const { createSupabaseUser } = require('../config/supabaseConfig');

async function migrateUsers() {
  const users = await User.find({ authMethod: 'legacy' });
  
  for (const user of users) {
    try {
      // Create in Supabase (they'll need to reset password)
      const supabaseUser = await createSupabaseUser(user.email, 'TempPassword123!', {
        name: user.name,
        contactNumber: user.contactNumber
      });
      
      // Update MongoDB
      user.supabaseId = supabaseUser.id;
      user.authMethod = 'supabase';
      await user.save();
      
      console.log(`Migrated: ${user.email}`);
    } catch (error) {
      console.error(`Failed to migrate ${user.email}:`, error.message);
    }
  }
}
```

## Security Best Practices

1. **Never expose service_role key**: Only use in backend
2. **Use HTTPS in production**: Ensure all API calls are encrypted
3. **Implement rate limiting**: Already configured in server.js
4. **Validate input**: Use express-validator for all inputs
5. **Monitor authentication logs**: Check Supabase dashboard regularly
6. **Set strong password policies**: Configure in Supabase settings
7. **Enable MFA**: Consider enabling multi-factor authentication

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check that SUPABASE_URL and keys are correct
   - Ensure no extra spaces in .env file

2. **"User not found in database"**
   - Verify user exists in MongoDB with correct supabaseId
   - Check MongoDB connection

3. **"Email not verified"**
   - Check Supabase dashboard for verification status
   - Resend verification email

4. **CORS errors**
   - Add frontend URL to allowed origins in server.js
   - Configure redirect URLs in Supabase dashboard

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=supabase:*
```

## Support

For issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Check MongoDB Atlas documentation
3. Review application logs
4. Contact development team

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Update frontend to use Supabase
5. ⬜ Test all authentication flows
6. ⬜ Deploy to production
7. ⬜ Monitor and optimize

---

**Last Updated**: 2025-10-04
**Version**: 1.0.0

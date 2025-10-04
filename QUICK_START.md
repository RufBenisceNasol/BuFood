# 🚀 Quick Start Guide - Supabase Authentication

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Project (2 min)

1. Go to https://supabase.com → Sign up/Login
2. Click **"New Project"**
3. Fill in details and create
4. Go to **Settings** → **API**
5. Copy these 3 values:
   - Project URL
   - anon public key
   - service_role key

### Step 2: Configure Backend (1 min)

Create `backend-api/.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
REFRESH_TOKEN_SECRET=your-secret-here
FRONTEND_URL=http://localhost:5173
PORT=8000
```

Or run interactive setup:
```bash
cd backend-api
npm run setup:supabase
```

### Step 3: Configure Frontend (1 min)

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:8000
```

### Step 4: Install & Run (1 min)

```bash
# Backend
cd backend-api
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Step 5: Test (30 sec)

1. Open http://localhost:5173
2. Register a new account
3. Check email for verification
4. Login!

---

## 📋 Checklist

- [ ] Supabase project created
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Dependencies installed
- [ ] Servers running
- [ ] Registration tested
- [ ] Email received
- [ ] Login successful

---

## 🔧 Supabase Dashboard Setup

### Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize "Confirm signup" template
3. Customize "Reset password" template

### Authentication Settings

1. Go to **Authentication** → **Settings**
2. Set **Site URL**: `http://localhost:5173`
3. Add **Redirect URLs**:
   - `http://localhost:5173/verify-email`
   - `http://localhost:5173/reset-password`

---

## 📚 Key Files Reference

### Backend
```
backend-api/
├── config/supabaseConfig.js          # Supabase setup
├── controllers/supabaseAuthController.js  # Auth logic
├── middlewares/supabaseAuthMiddleware.js  # JWT verification
├── routes/supabaseAuthRoutes.js      # API routes
└── models/userModel.js               # User schema
```

### Frontend
```
frontend/src/
├── config/supabase.js                # Supabase client
├── services/supabaseAuthService.js   # API calls
├── hooks/useSupabaseAuth.js          # Auth hook
├── contexts/SupabaseAuthContext.jsx  # Auth context
└── components/ProtectedRoute.jsx     # Route guard
```

---

## 🔗 API Endpoints

All endpoints: `/api/auth/supabase`

```
POST   /register              Register user
POST   /login                 Login user
POST   /logout                Logout user
GET    /me                    Get current user
POST   /verify-email          Verify email
POST   /resend-verification   Resend verification
POST   /forgot-password       Request password reset
POST   /reset-password        Reset password
PUT    /profile               Update profile
POST   /profile/image         Upload profile image
```

---

## 💻 Code Examples

### Frontend - Login

```javascript
import { useAuth } from './contexts/SupabaseAuthContext';

function LoginForm() {
  const { login } = useAuth();
  
  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      // Success!
    } catch (error) {
      // Handle error
    }
  };
}
```

### Frontend - Protected Route

```javascript
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Backend - Protected Endpoint

```javascript
const { authenticateWithSupabase } = require('./middlewares/supabaseAuthMiddleware');

router.get('/profile', authenticateWithSupabase, (req, res) => {
  res.json(req.user); // MongoDB user data
});
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check `.env` files for correct keys |
| "User not found" | Verify user exists in both Supabase & MongoDB |
| "Email not verified" | Check email spam folder |
| CORS errors | Add frontend URL to `server.js` allowed origins |
| Server won't start | Check all env vars are set |

---

## 📖 Full Documentation

- **Complete Guide**: `SUPABASE_INTEGRATION_README.md`
- **Setup Details**: `backend-api/SUPABASE_SETUP.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Checklist**: `IMPLEMENTATION_CHECKLIST.md`

---

## 🎯 What's Next?

1. ✅ Basic setup complete
2. ⬜ Customize email templates
3. ⬜ Update frontend UI components
4. ⬜ Test all authentication flows
5. ⬜ Deploy to production

---

## 🆘 Need Help?

1. Check the error message
2. Review logs (backend console)
3. Check Supabase dashboard
4. See troubleshooting section above
5. Review full documentation

---

**You're all set! Happy coding! 🎉**

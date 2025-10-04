# Supabase Authentication Implementation Checklist

Use this checklist to ensure complete and correct implementation of Supabase authentication in your BuFood application.

## 📋 Pre-Implementation

- [ ] Read `SUPABASE_INTEGRATION_README.md`
- [ ] Read `backend-api/SUPABASE_SETUP.md`
- [ ] Read `MIGRATION_GUIDE.md`
- [ ] Backup existing database
- [ ] Backup existing code (git commit)
- [ ] Create Supabase account
- [ ] Create MongoDB Atlas account (if not already done)

## 🔧 Backend Setup

### 1. Supabase Project Setup

- [ ] Create new Supabase project
- [ ] Note down Project URL
- [ ] Copy anon public key
- [ ] Copy service_role key (keep secret!)
- [ ] Configure authentication settings
  - [ ] Set Site URL
  - [ ] Add redirect URLs
  - [ ] Enable email provider
  - [ ] Set password requirements
- [ ] Customize email templates
  - [ ] Confirm signup template
  - [ ] Reset password template

### 2. Dependencies Installation

- [ ] Run `cd backend-api`
- [ ] Run `npm install @supabase/supabase-js`
- [ ] Verify package.json includes `@supabase/supabase-js`

### 3. Environment Configuration

- [ ] Create/update `backend-api/.env` file
- [ ] Add `SUPABASE_URL`
- [ ] Add `SUPABASE_ANON_KEY`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add `MONGODB_URI`
- [ ] Add `JWT_SECRET` (for backward compatibility)
- [ ] Add `REFRESH_TOKEN_SECRET`
- [ ] Add `FRONTEND_URL`
- [ ] Verify all required variables are set
- [ ] Run `npm run setup:supabase` (optional interactive setup)

### 4. Code Files Verification

Verify these files exist:

- [ ] `config/supabaseConfig.js`
- [ ] `controllers/supabaseAuthController.js`
- [ ] `middlewares/supabaseAuthMiddleware.js`
- [ ] `routes/supabaseAuthRoutes.js`
- [ ] `scripts/migrateUsersToSupabase.js`
- [ ] `scripts/setupSupabase.js`
- [ ] `models/userModel.js` (updated with supabaseId)
- [ ] `server.js` (updated with Supabase routes)

### 5. Database Updates

- [ ] User model includes `supabaseId` field
- [ ] User model includes `authMethod` field
- [ ] Password field is optional (not required)
- [ ] Indexes are properly configured

### 6. Server Configuration

- [ ] Supabase routes added to `server.js`
- [ ] Routes mounted at `/api/auth/supabase`
- [ ] Legacy routes still available at `/api/auth`
- [ ] CORS configured for frontend URL
- [ ] Rate limiting configured

### 7. Testing Backend

- [ ] Start backend server: `npm run dev`
- [ ] Server starts without errors
- [ ] Check logs for Supabase configuration warnings
- [ ] Test health endpoint: `GET /health`
- [ ] Test API docs: `GET /api-docs`

## 🎨 Frontend Setup

### 1. Dependencies Installation

- [ ] Run `cd frontend`
- [ ] Run `npm install @supabase/supabase-js`
- [ ] Verify package.json includes `@supabase/supabase-js`

### 2. Environment Configuration

- [ ] Create/update `frontend/.env` file
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Add `VITE_API_URL`
- [ ] Verify all variables start with `VITE_`

### 3. Code Files Verification

Verify these files exist:

- [ ] `src/config/supabase.js`
- [ ] `src/services/supabaseAuthService.js`
- [ ] `src/hooks/useSupabaseAuth.js`
- [ ] `src/contexts/SupabaseAuthContext.jsx`
- [ ] `src/components/ProtectedRoute.jsx`

### 4. App Integration

- [ ] Wrap app with `SupabaseAuthProvider`
- [ ] Update main.jsx or App.jsx
- [ ] Import and use auth context

### 5. Component Updates

Update authentication components to use Supabase:

- [ ] Registration form/page
- [ ] Login form/page
- [ ] Logout functionality
- [ ] Password reset flow
- [ ] Email verification handling
- [ ] Profile management
- [ ] Protected routes

### 6. API Service Updates

- [ ] Replace old auth API calls with Supabase service
- [ ] Update axios interceptors for token refresh
- [ ] Update error handling
- [ ] Update success messages

### 7. Testing Frontend

- [ ] Start frontend: `npm run dev`
- [ ] App loads without errors
- [ ] Check console for configuration warnings
- [ ] No CORS errors

## 🧪 Integration Testing

### 1. Registration Flow

- [ ] Open registration page
- [ ] Fill in registration form
- [ ] Submit form
- [ ] Check for success message
- [ ] Verify user created in Supabase dashboard
- [ ] Verify user created in MongoDB
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Verify email confirmed in Supabase
- [ ] Verify `isVerified: true` in MongoDB

### 2. Login Flow

- [ ] Open login page
- [ ] Enter credentials
- [ ] Submit form
- [ ] Check for success message
- [ ] Verify redirected to dashboard
- [ ] Check localStorage for tokens
- [ ] Verify user data stored correctly

### 3. Protected Routes

- [ ] Access protected route without login
- [ ] Verify redirected to login
- [ ] Login and access protected route
- [ ] Verify access granted
- [ ] Test role-based routes (Customer/Seller)

### 4. Logout Flow

- [ ] Click logout button
- [ ] Verify redirected to login/home
- [ ] Check localStorage cleared
- [ ] Try accessing protected route
- [ ] Verify redirected to login

### 5. Password Reset Flow

- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Submit form
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Submit form
- [ ] Login with new password
- [ ] Verify login successful

### 6. Email Verification

- [ ] Register new user
- [ ] Try to login before verification
- [ ] Verify error message
- [ ] Click verification link in email
- [ ] Login after verification
- [ ] Verify login successful

### 7. Token Refresh

- [ ] Login to app
- [ ] Wait for token to expire (or manually expire)
- [ ] Make API request
- [ ] Verify token refreshed automatically
- [ ] Verify request succeeds

### 8. Profile Management

- [ ] Login to app
- [ ] Navigate to profile page
- [ ] Update profile information
- [ ] Submit changes
- [ ] Verify changes saved
- [ ] Upload profile image
- [ ] Verify image uploaded

## 🔄 Migration (If Applicable)

### 1. Pre-Migration

- [ ] Backup MongoDB database
- [ ] Test migration script in dry-run mode
- [ ] Review dry-run results
- [ ] Notify users about migration (if needed)

### 2. Running Migration

- [ ] Run: `npm run migrate:supabase:dry`
- [ ] Review output
- [ ] Fix any errors
- [ ] Run: `npm run migrate:supabase`
- [ ] Monitor progress
- [ ] Check for errors

### 3. Post-Migration

- [ ] Verify users in Supabase dashboard
- [ ] Verify MongoDB users have `supabaseId`
- [ ] Test login with migrated accounts
- [ ] Verify password reset works
- [ ] Monitor error logs

## 🚀 Deployment

### 1. Pre-Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables documented
- [ ] Deployment guide created

### 2. Staging Deployment

- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Update environment variables
- [ ] Test all flows in staging
- [ ] Fix any issues

### 3. Production Deployment

- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Update environment variables
- [ ] Update Supabase redirect URLs
- [ ] Test all flows in production
- [ ] Monitor logs
- [ ] Monitor error rates

### 4. Post-Deployment

- [ ] Verify authentication working
- [ ] Monitor user registrations
- [ ] Monitor login success rate
- [ ] Check email delivery
- [ ] Monitor performance
- [ ] Set up alerts

## 📊 Monitoring & Maintenance

### 1. Monitoring Setup

- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring
- [ ] Set up alerts for critical errors

### 2. Regular Checks

- [ ] Weekly: Review error logs
- [ ] Weekly: Check authentication metrics
- [ ] Monthly: Review security settings
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit

### 3. Documentation

- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document common issues
- [ ] Create user guides

## ✅ Final Verification

### Backend

- [ ] Server starts without errors
- [ ] All routes accessible
- [ ] Authentication endpoints working
- [ ] Database connections stable
- [ ] Logs are clean
- [ ] No security warnings

### Frontend

- [ ] App loads correctly
- [ ] No console errors
- [ ] All pages accessible
- [ ] Authentication flows work
- [ ] Protected routes work
- [ ] UI/UX is smooth

### Integration

- [ ] Registration works end-to-end
- [ ] Login works end-to-end
- [ ] Logout works correctly
- [ ] Password reset works
- [ ] Email verification works
- [ ] Token refresh works
- [ ] Profile updates work

### Security

- [ ] HTTPS enabled (production)
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] No secrets exposed
- [ ] Security headers set

### Performance

- [ ] Page load times acceptable
- [ ] API response times good
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Caching configured

## 📝 Documentation Checklist

- [ ] README updated
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] User guides created
- [ ] Code comments added
- [ ] Changelog updated

## 🎉 Completion

- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Users notified (if needed)
- [ ] Monitoring active
- [ ] Support ready

---

## Notes

Use this section to track any issues, decisions, or important information:

```
Date: ___________
Issue/Decision: ___________________________________________
Resolution: _______________________________________________

Date: ___________
Issue/Decision: ___________________________________________
Resolution: _______________________________________________
```

---

**Checklist Version**: 1.0.0  
**Last Updated**: 2025-10-04  
**Completed By**: ___________  
**Completion Date**: ___________

# Backend Environment Variables Template

Create a `.env` file in the `backend-api` directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bufood?retryWrites=true&w=majority

# JWT Secrets (for legacy authentication - still needed for backward compatibility)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this

# Supabase Configuration (NEW - Primary Authentication)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key-here

# Email Configuration (Optional - Supabase handles email by default)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=BuFood <no-reply@bufood.com>

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis Configuration (Optional)
USE_REDIS=false
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Debug Options
MAIL_DEBUG=false
EXPOSE_VERIFY_LINK_FOR_TESTING=false
EXPOSE_OTP_FOR_TESTING=false
```

## How to Get Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## How to Get MongoDB URI

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<dbname>` with `bufood` (or your preferred database name)

## Important Security Notes

- ⚠️ **NEVER** commit the `.env` file to version control
- ⚠️ **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- Generate strong, random secrets for JWT keys
- Use environment-specific values for production
- Keep all credentials secure and rotate them regularly

## Production Considerations

For production deployment:
1. Set `NODE_ENV=production`
2. Update `BASE_URL` and `FRONTEND_URL` to your production domains
3. Use strong, unique secrets
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up monitoring and logging

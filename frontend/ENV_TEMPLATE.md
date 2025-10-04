# Frontend Environment Variables Template

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Backend API URL
VITE_API_URL=http://localhost:8000

# For production, update to your deployed URLs:
# VITE_API_URL=https://your-backend-domain.com
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

## How to Get Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## Important Notes

- Never commit the `.env` file to version control
- The `VITE_` prefix is required for Vite to expose these variables
- Restart the dev server after changing environment variables

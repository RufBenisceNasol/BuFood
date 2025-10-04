const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Supabase credentials not configured. Authentication features may be limited.');
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Helper function to verify Supabase JWT token
const verifySupabaseToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    
    return user;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
};

// Helper function to create user in Supabase
const createSupabaseUser = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle email verification
      user_metadata: metadata
    });

    if (error) {
      throw new Error(`Failed to create Supabase user: ${error.message}`);
    }

    return data.user;
  } catch (error) {
    throw error;
  }
};

// Helper function to sign in user with Supabase
const signInWithSupabase = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to send email verification
const sendEmailVerification = async (email) => {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email`
      }
    });

    if (error) {
      throw new Error(`Failed to generate verification link: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to reset password
const sendPasswordResetEmail = async (email) => {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      }
    });

    if (error) {
      throw new Error(`Failed to send password reset: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to update user password
const updateUserPassword = async (userId, newPassword) => {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to delete Supabase user
const deleteSupabaseUser = async (userId) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Helper function to verify email
const verifyUserEmail = async (userId) => {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  supabase,
  verifySupabaseToken,
  createSupabaseUser,
  signInWithSupabase,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateUserPassword,
  deleteSupabaseUser,
  verifyUserEmail
};

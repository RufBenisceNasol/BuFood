const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const Review = require('../models/reviewModel');
const { 
  createSupabaseUser, 
  signInWithSupabase,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateUserPassword,
  verifyUserEmail,
  deleteSupabaseUser
} = require('../config/supabaseConfig');
const { verifySupabaseToken } = require('../config/supabaseConfig');
const jwt = require('jsonwebtoken');
const { createStoreForSeller } = require('./storeController');

require('dotenv').config();

/**
 * Register a new user with Supabase + MongoDB
 * Supabase handles authentication, MongoDB stores application data
 */
const register = async (req, res) => {
  const { name, email, contactNumber, password, role } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists', 
        isVerified: !!existingUser.isVerified 
      });
    }

    // Create user in Supabase
    const supabaseUser = await createSupabaseUser(normalizedEmail, password, {
      name,
      contactNumber,
      role: role || 'Customer'
    });

    // Create user in MongoDB with Supabase ID
    const user = new User({
      supabaseId: supabaseUser.id,
      name,
      email: normalizedEmail,
      contactNumber,
      role: role || 'Customer',
      isVerified: false, // Will be verified via Supabase email
      authMethod: 'supabase'
    });

    await user.save();

    // Create store if role is Seller (non-fatal on failure)
    let storeCreationFailed = false;
    if (role === 'Seller') {
      try {
        const store = await createStoreForSeller(user);
        user.store = {
          storeName: store.storeName,
          storeId: store._id,
          owner: user._id,
        };
        await user.save();
      } catch (err) {
        console.error('Error creating store:', err.message);
        storeCreationFailed = true;
      }
    }

    // Send verification email via Supabase
    try {
      await sendEmailVerification(normalizedEmail);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
      // Don't fail registration if email sending fails
    }

    const registerPayload = {
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: user._id,
      supabaseId: supabaseUser.id,
      storeCreationFailed,
    };

    res.status(201).json(registerPayload);
  } catch (error) {
    console.error('Error during registration:', error.message);
    
    // Cleanup: If MongoDB save fails, try to delete Supabase user
    if (error.message.includes('MongoDB') && req.body.supabaseId) {
      try {
        await deleteSupabaseUser(req.body.supabaseId);
      } catch (cleanupError) {
        console.error('Failed to cleanup Supabase user:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};

/**
 * Login user with Supabase authentication
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    // Authenticate with Supabase
    const { session, user: supabaseUser } = await signInWithSupabase(normalizedEmail, password);

    if (!session || !supabaseUser) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Find user in MongoDB
    const user = await User.findOne({ supabaseId: supabaseUser.id });

    if (!user) {
      return res.status(400).json({ 
        message: 'User not found in database. Please contact support.' 
      });
    }

    // Check if email is verified in Supabase
    if (!supabaseUser.email_confirmed_at) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.' 
      });
    }

    // Update isVerified in MongoDB if not already set
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    res.status(200).json({
      message: 'Login successful',
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      user: {
        id: user._id,
        supabaseId: user.supabaseId,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        profileImage: user.profileImage,
        store: user.role === 'Seller' ? user.store : null,
      },
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    
    if (error.message.includes('Invalid login credentials')) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

/**
 * Logout user
 * Note: Supabase handles session invalidation on the client side
 */
const logout = async (req, res) => {
  try {
    // Clear any server-side session data if needed
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

/**
 * Verify email using Supabase token
 */
const verifyEmail = async (req, res) => {
  const { token, type } = req.body;

  try {
    // Supabase handles email verification automatically
    // This endpoint is for updating MongoDB status
    if (req.user) {
      req.user.isVerified = true;
      await req.user.save();
    }

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error during email verification:', error.message);
    res.status(500).json({ message: 'Verification failed' });
  }
};

/**
 * Resend verification email
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Send verification email via Supabase
    await sendEmailVerification(normalizedEmail);

    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Error resending verification email:', error.message);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
};

/**
 * Check email verification status
 */
const checkEmailVerificationStatus = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ isVerified: user.isVerified });
  } catch (error) {
    console.error('Error checking verification status:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current logged-in user
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      id: user._id,
      supabaseId: user.supabaseId,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      role: user.role,
      profileImage: user.profileImage,
      store: user.role === 'Seller' ? user.store : null,
    });
  } catch (error) {
    console.error('Error fetching current user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    }

    // Send password reset email via Supabase
    await sendPasswordResetEmail(normalizedEmail);
    
    res.status(200).json({ 
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Supabase handles password reset via their recovery flow
    // This endpoint is called after Supabase validates the reset token
    
    if (!req.supabaseUser) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password in Supabase
    await updateUserPassword(req.supabaseUser.id, newPassword);

    // CRITICAL: Also update password hash in MongoDB
    // Login checks MongoDB password, so we must update both
    const user = await User.findOne({ supabaseId: req.supabaseUser.id });
    if (user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      console.log('Password updated in both Supabase and MongoDB for user:', user.email);
    } else {
      console.warn('User not found in MongoDB for supabaseId:', req.supabaseUser.id);
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

/**
 * Refresh access token using Supabase refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Supabase client handles token refresh on frontend
    // This is a placeholder for any server-side refresh logic
    
    res.status(200).json({
      message: 'Token refresh should be handled by Supabase client on frontend'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, contactNumber, profileImage } = req.body;
    
    const update = {};
    if (name) update.name = name;
    if (contactNumber) update.contactNumber = contactNumber;
    if (profileImage !== undefined) update.profileImage = profileImage;
    
    const user = await User.findByIdAndUpdate(
      userId, 
      update, 
      { new: true, runValidators: true }
    ).select('-password -refreshToken -verificationToken -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * Upload profile image
 */
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const imageUrl = req.file.path;
    const updated = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password -refreshToken -verificationToken -passwordResetToken -passwordResetExpires');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'Profile image uploaded', imageUrl });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
};

/**
 * Exchange Supabase access token for backend JWT
 * Body: { access_token }
 * Flow: Verify Supabase token -> find/create Mongo user -> sign backend JWT
 */
const supabaseLogin = async (req, res) => {
  try {
    const { access_token: accessToken, role: desiredRole } = req.body || {};
    if (!accessToken) {
      return res.status(400).json({ message: 'access_token is required' });
    }

    const supaUser = await verifySupabaseToken(accessToken);
    if (!supaUser) {
      return res.status(401).json({ message: 'Invalid Supabase token' });
    }

    const email = (supaUser.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Supabase user email missing' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        supabaseId: supaUser.id,
        name: supaUser.user_metadata?.name || '',
        email,
        contactNumber: supaUser.user_metadata?.contactNumber || '',
        role: desiredRole || supaUser.user_metadata?.role || 'Customer',
        isVerified: !!supaUser.email_confirmed_at,
        authMethod: 'supabase',
      });
    } else {
      if (!user.supabaseId) user.supabaseId = supaUser.id;
      if (supaUser.email_confirmed_at && !user.isVerified) user.isVerified = true;
      await user.save();
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server auth misconfiguration' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('supabaseLogin error:', err);
    return res.status(500).json({ message: 'Auth error', error: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  getMe,
  resendVerificationEmail,
  checkEmailVerificationStatus,
  forgotPassword,
  resetPassword,
  refreshToken,
  updateProfile,
  uploadProfileImage,
  supabaseLogin,
};

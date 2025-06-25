const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createStoreForSeller } = require('./storeController');

require('dotenv').config();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verification email sender
const sendVerificationEmail = async (email, verificationLink) => {
  try {
    await transporter.sendMail({
      to: email,
      subject: 'Verify Your Email - Bufood 🍽️',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #333;">Welcome to <span style="color: #28a745;">Bufood</span>! 👋</h2>
            <p style="font-size: 16px; color: #555;">
              Thanks for signing up! Please verify your email address by clicking the button below:
            </p>
            <a href="${verificationLink}"
               style="display: inline-block; padding: 12px 24px; margin: 20px 0;
                      background-color: #28a745; color: #fff; text-decoration: none;
                      border-radius: 6px; font-weight: bold; font-size: 16px;">
              Verify Email
            </a>
            <p style="font-size: 14px; color: #777;">
              If you did not create this account, you can safely ignore this email.
            </p>
            <p style="font-size: 14px; color: #aaa; margin-top: 30px;">
              &mdash; The Bufood Team
            </p>
          </div>
        </div>
      `,
    });
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    throw new Error('Could not send verification email');
  }
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Register
const register = async (req, res) => {
  const { name, email, contactNumber, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      name,
      email,
      contactNumber,
      password: hashedPassword,
      verificationToken,
      role: role || 'Customer',
    });

    await user.save();

    // 🔥 Create store if role is Seller
    if (role === 'Seller') {
      try {
        const store = await createStoreForSeller(user);

        // ✅ Optionally attach store info to user
        user.store = {
          storeName: store.storeName,
          storeId: store._id,
          owner: user._id,
        };
        await user.save();
      } catch (err) {
        console.error('Error creating store:', err.message);
        // ❌ Delete the user if store creation fails
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({ message: 'Failed to create store for seller' });
      }
    }

    const verificationLink = `http://localhost:8000/api/auth/verify/${verificationToken}`;
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified)
      return res.status(403).json({ message: 'Please verify your email before logging in.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
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
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

// Email verification
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid verification token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error during email verification:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send new verification email
    const verificationLink = `http://localhost:8000/api/auth/verify/${verificationToken}`;
    await sendVerificationEmail(user.email, verificationLink);

    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Error resending verification email:', error.message);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
};

// Check email verification status
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

// Get current logged-in user (used in /auth/me route)
const getMe = async (req, res) => {
  try {
    const user = req.user; // Comes from `authenticate` middleware
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      id: user._id,
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

// Request password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request - BuFood',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Click the button below to reset your password. This link is valid for 10 minutes.</p>
          <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, contactNumber, profileImage } = req.body;
    const update = {};
    if (name) update.name = name;
    if (contactNumber) update.contactNumber = contactNumber;
    if (profileImage !== undefined) update.profileImage = profileImage;
    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).select('-password -refreshToken -verificationToken -passwordResetToken -passwordResetExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    req.user.profileImage = req.file.path;
    await req.user.save();
    res.status(200).json({ success: true, message: 'Profile image uploaded', imageUrl: req.file.path });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  sendVerificationEmail,
  getMe,
  resendVerificationEmail,
  checkEmailVerificationStatus,
  forgotPassword,
  resetPassword,
  refreshToken,
  updateProfile,
  uploadProfileImage,
};

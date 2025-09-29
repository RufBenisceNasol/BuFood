const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createStoreForSeller } = require('./storeController');
const axios = require('axios');

require('dotenv').config();

// Nodemailer setup (explicit Gmail SMTP with STARTTLS, pooled, with timeouts)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,        // use STARTTLS
  requireTLS: true,
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Timeouts (ms)
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

// Verify SMTP credentials on startup (non-fatal)
setImmediate(() => {
  transporter.verify((err, success) => {
    if (err) {
      console.error('SMTP verification failed:', err.message);
    } else {
      console.log('SMTP server is ready to take our messages');
    }
  });
});

// Helper: send mail with retry/backoff for transient errors
async function sendMailWithRetry(options, retries = 2, baseDelayMs = 1500) {
  let attempt = 0;
  for (;;) {
    try {
      return await transporter.sendMail(options);
    } catch (err) {
      const code = err?.code;
      const resp = err?.responseCode;
      const transient = code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION' || code === 'EAI_AGAIN' || [421, 451, 452].includes(resp);
      if (attempt < retries && transient) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`sendMail transient error (${code || resp}); retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
}

// Resend API email sender (primary)
const sendEmailViaResend = async (to, subject, html) => {
  const response = await axios.post('https://api.resend.com/emails', {
    from: process.env.EMAIL_FROM || 'BuFood <onboarding@resend.dev>',
    to: [to],
    subject,
    html
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });
  return response.data;
};

// Universal email sender with provider fallback
const sendEmail = async (to, subject, html) => {
  console.log(`Attempting to send email to: ${to}`);
  
  // Try Resend first if API key is available
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('Using Resend API for email delivery');
      const result = await sendEmailViaResend(to, subject, html);
      console.log(`Email sent successfully via Resend to: ${to}`, result.id);
      return result;
    } catch (error) {
      console.error('Resend API failed:', error.response?.data || error.message);
      console.log('Falling back to Gmail SMTP...');
    }
  }
  
  // Fallback to Gmail SMTP
  try {
    console.log('Using Gmail SMTP for email delivery');
    const result = await sendMailWithRetry({
      from: process.env.EMAIL_FROM || 'BuFood <no-reply@yourdomain.com>',
      to,
      subject,
      html
    });
    console.log(`Email sent successfully via Gmail SMTP to: ${to}`);
    return result;
  } catch (error) {
    console.error('Gmail SMTP also failed:', error.message);
    throw new Error(`Email delivery failed via both Resend and Gmail: ${error.message}`);
  }
};

// Verification email sender
const sendVerificationEmail = async (email, verificationLink) => {
  const subject = 'Verify Your Email - BuFood 🍽️';
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #333;">Welcome to <span style="color: #28a745;">BuFood</span>! 👋</h2>
        <p style="font-size: 16px; color: #555;">
          Thanks for signing up! Please verify your email address by clicking the button below:
        </p>
        <a href="${verificationLink}"
           style="display: inline-block; padding: 12px 24px; margin: 20px 0;
                  background-color: #28a745; color: #fff; text-decoration: none;
                  border-radius: 5px; font-weight: bold;">Verify Email</a>
        <p style="font-size: 14px; color: #777;">
          If you did not create this account, you can safely ignore this email.
        </p>
        <p style="font-size: 14px; color: #aaa; margin-top: 30px;">
          &mdash; The BuFood Team
        </p>
      </div>
    </div>
  `;
  
  try {
    await sendEmail(email, subject, html);
  } catch (error) {
    console.error('Error sending verification email to', email, ':', error.message);
    throw new Error('Could not send verification email');
  }
};
// Helper to send OTP email
const sendPasswordResetOTPEmail = async (email, otp) => {
  const subject = `Your BuFood password reset code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#fff; padding:24px; border-radius:8px;">
        <h2 style="margin:0 0 12px; color:#333;">Password reset code</h2>
        <p style="color:#555; margin:0 0 16px;">Use the following code to reset your BuFood password. This code expires in 10 minutes.</p>
        <div style="font-size:28px; font-weight:700; letter-spacing:6px; text-align:center; color:#111;">${otp}</div>
        <p style="color:#777; margin-top:16px; font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  
  try {
    await sendEmail(email, subject, html);
    console.log(`Password reset OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    throw new Error('Failed to send OTP email');
  }
};

// POST /api/auth/forgot-password-otp
const forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    // Always respond 200 to avoid account enumeration
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, an OTP has been sent' });
    }

    const otp = user.createPasswordResetOTP();
    await user.save();
    await sendPasswordResetOTPEmail(user.email, otp);
    const payload = { message: 'OTP sent to email' };
    if (process.env.EXPOSE_OTP_FOR_TESTING === 'true') {
      payload.otp = otp;
    }
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Forgot password OTP error:', error);
    return res.status(500).json({ message: 'Error sending OTP' });
  }
};

// POST /api/auth/reset-password-otp
const resetPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const isValid =
      user.passwordResetOTP &&
      user.passwordResetOTP === hashedOtp &&
      user.passwordResetOTPExpires &&
      user.passwordResetOTPExpires > Date.now();

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await sendPasswordChangedEmail(user.email);

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password via OTP error:', error);
    return res.status(500).json({ message: 'Error resetting password' });
  }
};

// POST /api/auth/resend-password-otp
const resendPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    // Always 200 to prevent enumeration
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a new OTP has been sent' });
    }

    const otp = user.createPasswordResetOTP();
    await user.save();
    await sendPasswordResetOTPEmail(user.email, otp);
    const payload = { message: 'OTP resent' };
    if (process.env.EXPOSE_OTP_FOR_TESTING === 'true') {
      payload.otp = otp;
    }
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ message: 'Error resending OTP' });
  }
};

// Password changed confirmation email
const sendPasswordChangedEmail = async (email) => {
  const subject = 'Your BuFood password was changed';
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #333;">Password changed successfully ✅</h2>
        <p style="font-size: 16px; color: #555;">
          This is a confirmation that your BuFood account password was just changed. If this was you, no further action is needed.
        </p>
        <p style="font-size: 14px; color: #777;">
          If you did not perform this action, please reset your password immediately using the "Forgot Password" link on the login page.
        </p>
        <p style="font-size: 14px; color: #aaa; margin-top: 30px;">— The BuFood Team</p>
      </div>
    </div>
  `;
  
  try {
    await sendEmail(email, subject, html);
    console.log('Password change confirmation email sent');
  } catch (error) {
    // Do not block the flow if email fails
    console.error('Error sending password change confirmation email:', error.message);
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
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    // Additional validation to prevent common issues
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!contactNumber || !/^(\+?\d{7,15}|0\d{9,12})$/.test(contactNumber)) {
      return res.status(400).json({ message: 'Invalid contact number. Use digits only, optionally starting with + or 0.' });
    }
    if (!password || password.length !== 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must be exactly 8 characters with at least one uppercase letter and one number' });
    }
    if (role && !['Customer', 'Seller'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either Customer or Seller' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists', isVerified: !!existingUser.isVerified });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      contactNumber: contactNumber.trim(),
      password: hashedPassword,
      verificationToken,
      role: role || 'Customer',
    });

    await user.save();

    // 🔥 Create store if role is Seller (non-fatal on failure)
    let storeCreationFailed = false;
    if (role === 'Seller') {
      try {
        const store = await createStoreForSeller(user);

        // ✅ Attach store info to user
        user.store = {
          storeName: store.storeName,
          storeId: store._id,
          owner: user._id,
        };
        await user.save();
      } catch (err) {
        console.error('Error creating store:', err.message);
        // Do NOT delete user or fail registration; mark flag so client can inform user/admin
        storeCreationFailed = true;
      }
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    const verificationLink = `${baseUrl}/api/auth/verify/${verificationToken}`;
    // Send verification email in background; do not block the response
    setImmediate(async () => {
      try {
        await sendVerificationEmail(normalizedEmail, verificationLink);
      } catch (e) {
        console.error('sendVerificationEmail failed during registration (background):', e.message);
      }
    });

    const registerPayload = {
      message: 'User registered successfully. Please check your email to verify your account.',
      emailQueued: true,
      storeCreationFailed,
    };
    if (process.env.EXPOSE_VERIFY_LINK_FOR_TESTING === 'true') {
      registerPayload.verifyLink = verificationLink;
    }
    res.status(201).json(registerPayload);
  } catch (error) {
    console.error('Error during registration:', error.message);
    console.error('Registration error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });

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

    // Send new verification email (direct backend verification link)
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    const verificationLink = `${baseUrl}/api/auth/verify/${verificationToken}`;
    await sendVerificationEmail(user.email, verificationLink);

    const resendPayload = { message: 'Verification email resent successfully' };
    if (process.env.EXPOSE_VERIFY_LINK_FOR_TESTING === 'true') {
      resendPayload.verifyLink = verificationLink;
    }
    res.status(200).json(resendPayload);
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
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}/reset-password/${resetToken}`;
    
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
    // Send confirmation email (non-blocking in terms of flow)
    await sendPasswordChangedEmail(user.email);

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
  sendPasswordChangedEmail,
  getMe,
  resendVerificationEmail,
  checkEmailVerificationStatus,
  forgotPassword,
  resetPassword,
  // OTP-based reset
  forgotPasswordOtp,
  resetPasswordOtp,
  resendPasswordOtp,
  refreshToken,
  updateProfile,
  uploadProfileImage,
};

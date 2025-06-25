const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    verificationToken: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['Customer', 'Seller'],
        default: 'Customer',
    },
    store: {
        storeName: String,
        storeId: mongoose.Schema.Types.ObjectId,
        owner: mongoose.Schema.Types.ObjectId,
    },
    refreshToken: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    profileImage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Add method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

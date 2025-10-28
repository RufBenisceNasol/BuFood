const mongoose = require('mongoose');
const { Schema } = mongoose;

// Minimal User model to bridge Mongo users with Supabase-authenticated sockets
// Fields used across the app: supabaseId mapping, name, email, avatar, role
const userSchema = new Schema(
  {
    supabaseId: { type: String, index: true, unique: true, sparse: true },
    name: { type: String },
    email: { type: String, index: true },
    avatar: { type: String },
    role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

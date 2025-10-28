const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', index: true, required: true },
    // For system messages, senderId/receiverId can be null
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    type: { type: String, enum: ['system', 'text', 'order', 'image'], default: 'text', index: true },
    text: { type: String, default: '' },
    attachments: [{ url: String, type: String }],
    orderRef: { orderId: String, summary: String },
    // Rich snapshot for order-related system messages
    orderSnapshot: {
      orderId: String,
      items: [{ productId: String, name: String, qty: Number, price: Number }],
      total: Number,
      acceptedAt: Date,
      expectedReadyTime: Date
    },
    senderName: String,
    senderAvatar: String,
    seen: { type: Boolean, default: false },
    // Idempotency & telemetry
    requestId: { type: String, index: true },
    idempotencyKey: { type: String, index: true, unique: true, sparse: true }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);

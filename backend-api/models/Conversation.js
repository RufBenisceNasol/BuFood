const mongoose = require('mongoose');
const { Schema } = mongoose;

const lastMessageSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'Message' },
    text: String,
    type: { type: String, enum: ['system', 'text', 'order', 'image'], default: 'text' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: String,
    createdAt: Date,
    orderRef: {
      orderId: String,
      summary: String,
    },
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    participantsKey: { type: String, index: true },
    orderId: { type: String, default: null, index: true },
    lastMessage: lastMessageSchema,
    unreadCounts: { type: Map, of: Number, default: {} },
    createdBy: { type: String, enum: ['system', 'seller', 'customer'], default: 'system' }
  },
  { timestamps: true }
);

conversationSchema.index({ participantsKey: 1, orderId: 1 }, { unique: true });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

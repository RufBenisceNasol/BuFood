const mongoose = require('mongoose');
const { Schema } = mongoose;

const lastMessageSchema = new Schema(
  {
    text: String,
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
  },
  { timestamps: true }
);

conversationSchema.index({ participantsKey: 1, orderId: 1 }, { unique: true });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

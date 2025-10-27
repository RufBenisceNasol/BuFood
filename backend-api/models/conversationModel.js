const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: '',
    },
    lastSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Ensure participants always stored sorted for uniqueness
ConversationSchema.pre('save', function (next) {
  if (this.participants && this.participants.length === 2) {
    const [a, b] = this.participants.map((id) => id.toString()).sort();
    this.participants = [a, b];
  }
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);

const mongoose = require('mongoose');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');

// Ensure a consistent conversation for two participants
const getOrCreateConversation = async (userIdA, userIdB) => {
  const [a, b] = [userIdA.toString(), userIdB.toString()].sort();
  let convo = await Conversation.findOne({ participants: [a, b] });
  if (!convo) {
    convo = await Conversation.create({ participants: [a, b] });
  }
  return convo;
};

// POST /api/chat/send
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, text } = req.body;

    if (!receiverId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'receiverId and text are required' });
    }

    const conversation = await getOrCreateConversation(senderId, receiverId);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      text: text.trim(),
    });

    conversation.lastMessage = message.text;
    conversation.lastSenderId = senderId;
    await conversation.save();

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      // Emit to receiver user room and conversation room
      io.to(receiverId.toString()).emit('message:new', {
        conversationId: conversation._id,
        message,
      });
      io.to(conversation._id.toString()).emit('message:new', {
        conversationId: conversation._id,
        message,
      });
    }

    return res.status(201).json({ success: true, data: { conversation, message } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send message', error: err.message });
  }
};

// GET /api/chat/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversationId' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages', error: err.message });
  }
};

// POST /api/chat/:conversationId/seen
const markAsSeen = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversationId' });
    }

    const result = await Message.updateMany(
      { conversationId, receiverId: userId, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('message:seen', {
        conversationId,
        seenBy: userId,
      });
    }

    return res.status(200).json({ success: true, data: { matched: result.matchedCount, modified: result.modifiedCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark messages as seen', error: err.message });
  }
};

// GET /api/chat/conversations
const listConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate({ path: 'participants', select: 'name email role profileImage' })
      .lean();

    // Compute unread counts per conversation (MVP, simple approach)
    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          receiverId: userId,
          seen: false,
        });
        return { ...c, unreadCount };
      })
    );

    return res.status(200).json({ success: true, data: withUnread });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: err.message });
  }
};

// GET /api/chat/unread
const getUnreadSummary = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    // Total unread
    const total = await Message.countDocuments({ receiverId: userId, seen: false });
    return res.status(200).json({ success: true, data: { total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch unread summary', error: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markAsSeen,
  listConversations,
  getUnreadSummary,
};

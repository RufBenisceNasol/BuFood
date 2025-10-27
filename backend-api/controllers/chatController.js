const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { emitToUser } = require('../utils/socket');

function keyForParticipants(userIds) {
  return userIds.map(String).sort().join('|');
}

async function getOrCreateConversation(customerId, sellerId, orderId = null) {
  const participants = [customerId, sellerId];
  const participantsKey = keyForParticipants(participants);
  const conv = await Conversation.findOneAndUpdate(
    { participantsKey, orderId },
    { $setOnInsert: { participants, participantsKey, orderId } },
    { new: true, upsert: true }
  );
  return conv;
}

async function listConversations(req, res) {
  const u = req.user._id;
  const convs = await Conversation.find({ participants: u })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  res.json(convs);
}

async function getMessages(req, res) {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const cursor = req.query.cursor;
  const q = { conversationId: id };
  if (cursor) q._id = { $lt: cursor };
  const msgs = await Message.find(q).sort({ _id: -1 }).limit(limit).lean();
  const nextCursor = msgs.length ? msgs[msgs.length - 1]._id : null;
  res.json({ messages: msgs.reverse(), nextCursor });
}

async function sendMessage(req, res) {
  const { conversationId, receiverId, text, attachments, orderRef } = req.body;
  const sender = req.user;
  const conv = await Conversation.findById(conversationId);
  if (!conv || !conv.participants.map(String).includes(String(sender._id))) return res.status(404).json({ error: 'Conversation not found' });

  const receiver = await User.findById(receiverId);
  if (!receiver) return res.status(400).json({ error: 'Receiver not found' });

  const msg = await Message.create({
    conversationId,
    senderId: sender._id,
    receiverId,
    text,
    attachments: attachments || [],
    orderRef: orderRef || conv.orderRef,
    senderName: sender.name,
    senderAvatar: sender.avatar,
  });

  const lastMessage = { text, senderId: sender._id, senderName: sender.name, createdAt: msg.createdAt, orderRef: msg.orderRef || null };
  const recipientKey = String(receiverId);
  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: { lastMessage },
      $inc: { [`unreadCounts.${recipientKey}`]: 1 },
      $currentDate: { updatedAt: true },
    }
  );

  emitToUser(receiverId, 'message:received', msg);
  emitToUser(receiverId, 'conversation:updated', { conversationId, lastMessage });

  res.json(msg);
}

async function sendMessageSocket(authUser, payload, io) {
  const { conversationId, receiverId, text, attachments, orderRef } = payload;
  const conv = await Conversation.findById(conversationId);
  if (!conv || !conv.participants.map(String).includes(String(authUser._id))) throw new Error('Conversation not found');

  const msg = await Message.create({
    conversationId,
    senderId: authUser._id,
    receiverId,
    text,
    attachments: attachments || [],
    orderRef: orderRef || conv.orderRef,
    senderName: authUser.name,
    senderAvatar: authUser.avatar,
  });

  const lastMessage = { text, senderId: authUser._id, senderName: authUser.name, createdAt: msg.createdAt, orderRef: msg.orderRef || null };
  const recipientKey = String(receiverId);
  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: { lastMessage },
      $inc: { [`unreadCounts.${recipientKey}`]: 1 },
      $currentDate: { updatedAt: true },
    }
  );

  io.to(String(receiverId)).emit('message:received', msg);
  io.to(String(receiverId)).emit('conversation:updated', { conversationId, lastMessage });
  return msg;
}

async function markRead(req, res) {
  const { id } = req.params;
  const me = String(req.user._id);
  await Conversation.updateOne({ _id: id }, { $set: { [`unreadCounts.${me}`]: 0 } });
  emitToUser(req.user._id, 'unread:count', { conversationId: id, count: 0 });
  res.json({ ok: true });
}

async function createOrFetch(req, res) {
  const { customerId, sellerId, orderId } = req.body;
  const conv = await getOrCreateConversation(customerId, sellerId, orderId || null);
  res.json(conv);
}

module.exports = {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  sendMessageSocket,
  markRead,
  createOrFetch,
};

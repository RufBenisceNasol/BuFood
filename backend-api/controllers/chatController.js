const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { emitToUser } = require('../utils/socket');
const Order = require('../models/orderModel');
const mongoose = require('mongoose');
const { mapToSupabaseId } = require('../helpers/idMapper');

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
  const authUserId = String(authUser._id || authUser.id);
  if (!conv || !conv.participants.map(String).includes(String(authUserId))) throw new Error('Conversation not found');

  const msg = await Message.create({
    conversationId,
    senderId: authUserId,
    receiverId,
    text,
    attachments: attachments || [],
    orderRef: orderRef || conv.orderRef,
    senderName: authUser.name,
    senderAvatar: authUser.avatar,
  });

  const lastMessage = { text, senderId: authUserId, senderName: authUser.name, createdAt: msg.createdAt, orderRef: msg.orderRef || null };
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

// -------- New helpers and endpoints (V2) --------
function keyForParticipants(userIds) {
  return userIds.map(String).sort().join('|');
}

function toIdString(objOrId) {
  if (!objOrId) return null;
  if (typeof objOrId === 'string') return objOrId;
  if (objOrId._id) return String(objOrId._id);
  return String(objOrId);
}

async function upsertConversationForOrder({ customerId, sellerId, orderId, session }) {
  const participants = [customerId, sellerId].map(String);
  const participantsKey = keyForParticipants(participants);
  const filter = { participantsKey, orderId: String(orderId) };
  const update = {
    $setOnInsert: {
      participants: [customerId, sellerId],
      participantsKey,
      orderId: String(orderId),
      createdBy: 'system'
    }
  };
  const opts = { new: true, upsert: true, ...(session ? { session } : {}) };
  return Conversation.findOneAndUpdate(filter, update, opts);
}

async function emitAll({ conversation, message, customerId, sellerId }) {
  const [custSupabase, sellSupabase] = await Promise.all([
    mapToSupabaseId(customerId),
    mapToSupabaseId(sellerId)
  ]);
  const customerRoom = String(custSupabase || customerId);
  const sellerRoom = String(sellSupabase || sellerId);
  const convoPayload = conversation.toObject ? conversation.toObject() : conversation;

  emitToUser(customerRoom, 'conversation:upserted', { conversation: convoPayload });
  emitToUser(sellerRoom, 'conversation:upserted', { conversation: convoPayload });
  emitToUser(customerRoom, 'message:created', { message });
  emitToUser(sellerRoom, 'message:created', { message });
  emitToUser(customerRoom, 'unread:update', { conversationId: conversation._id, unreadCounts: conversation.unreadCounts });

  const autoMessage = {
    type: message.type || 'text',
    text: message.text,
    orderId: message?.orderRef?.orderId || convoPayload.orderId,
    total: message?.orderSnapshot?.total,
    timestamp: message.createdAt || new Date()
  };
  emitToUser(customerRoom, 'newMessage', autoMessage);
  emitToUser(sellerRoom, 'newMessage', autoMessage);
}

// GET /api/chat/:orderId — returns conversation + messages ascending
async function getMessagesByOrder(req, res) {
  try {
    const { orderId } = req.params;
    const me = String(req.user?.id || req.user?._id);
    const conv = await Conversation.findOne({ orderId: String(orderId), participants: { $in: [me] } }).lean();
    if (!conv) return res.status(200).json({ success: true, conversation: null, messages: [] });
    const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ success: true, conversation: conv, messages });
  } catch (err) {
    console.error('getMessagesByOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load chat' });
  }
}

// POST /api/chat — manual message (V2)
async function sendChatMessage(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { conversationId, orderId, text, type, receiverId } = req.body;
    const me = String(req.user?.id || req.user?._id);
    if (!text || (!conversationId && !orderId)) {
      return res.status(400).json({ success: false, message: 'conversationId or orderId and text are required' });
    }

    let conv;
    if (conversationId) {
      conv = await Conversation.findById(conversationId).session(session);
    } else {
      const order = await Order.findById(orderId).session(session);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      const customerId = toIdString(order.customer);
      const sellerId = toIdString(order.seller);
      if (![customerId, sellerId].includes(me)) return res.status(403).json({ success: false, message: 'Not a participant of this order' });
      conv = await upsertConversationForOrder({ customerId, sellerId, orderId: order._id, session });
    }

    if (!conv || !conv.participants.map(String).includes(me)) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const rcvr = receiverId ? String(receiverId) : conv.participants.map(String).find((p) => p !== me);
    const msgDocs = await Message.create([{
      conversationId: conv._id,
      type: type || 'text',
      text,
      senderId: me,
      receiverId: rcvr,
      createdAt: new Date()
    }], { session });
    const message = msgDocs[0];

    const lastMessage = { id: message._id, text: message.text, type: message.type, senderId: message.senderId, senderName: req.user?.name || undefined, createdAt: message.createdAt };
    const inc = {}; inc[`unreadCounts.${String(rcvr)}`] = 1;
    const updatedConv = await Conversation.findOneAndUpdate(
      { _id: conv._id },
      { $set: { lastMessage }, $inc: inc, $currentDate: { updatedAt: true } },
      { new: true, session }
    );

    await session.commitTransaction();

    const [senderSupabase, receiverSupabase] = await Promise.all([
      mapToSupabaseId(me),
      mapToSupabaseId(rcvr)
    ]);
    const senderRoom = String(senderSupabase || me);
    const receiverRoom = String(receiverSupabase || rcvr);

    emitToUser(senderRoom, 'conversation:upserted', { conversation: updatedConv.toObject() });
    emitToUser(receiverRoom, 'conversation:upserted', { conversation: updatedConv.toObject() });
    emitToUser(senderRoom, 'message:created', { message });
    emitToUser(receiverRoom, 'message:created', { message });
    emitToUser(receiverRoom, 'unread:update', { conversationId: updatedConv._id, unreadCounts: updatedConv.unreadCounts });
    emitToUser(senderRoom, 'newMessage', { type: message.type, text: message.text, orderId: updatedConv.orderId, timestamp: message.createdAt });
    emitToUser(receiverRoom, 'newMessage', { type: message.type, text: message.text, orderId: updatedConv.orderId, timestamp: message.createdAt });

    return res.status(200).json({ success: true, message, conversation: updatedConv });
  } catch (err) {
    await session.abortTransaction();
    console.error('sendChatMessage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  } finally {
    session.endSession();
  }
}

// Idempotent system message on acceptance
async function createSystemMessageForOrder({ order, requestId, idempotencyKey, session }) {
  const now = new Date();
  const orderId = toIdString(order._id || order.id || order.orderId);
  const customerId = toIdString(order.customer?._id || order.customer);
  const sellerId = toIdString(order.seller?._id || order.seller);

  let conversation = await upsertConversationForOrder({ customerId, sellerId, orderId, session });

  const orderSnapshot = {
    orderId: String(orderId),
    items: (order.items || []).map((it) => ({
      productId: toIdString(it.product),
      name: it.name || undefined,
      qty: Number(it.quantity) || 0,
      price: typeof it.price === 'number' ? it.price : (it?.selectedVariant?.price ?? 0)
    })),
    total: Number(order.totalAmount || order.total) || 0,
    acceptedAt: order.acceptedAt || now,
    expectedReadyTime: order.estimatedCompletionTime || order.expectedReadyTime || null
  };
  const shortId = String(orderId).slice(-6);
  const storeName = order.store?.name || order.storeName || 'the store';
  const text = `Your order #${shortId} has been accepted by ${storeName}.`;

  let message;
  try {
    const docs = await Message.create([{
      conversationId: conversation._id,
      type: 'system',
      text: text.substring(0, 2048),
      senderId: null,
      receiverId: null,
      orderRef: { orderId: String(orderId), summary: `Accepted • ₱${orderSnapshot.total}` },
      orderSnapshot,
      requestId: requestId || undefined,
      idempotencyKey: idempotencyKey || `order:${orderId}:accepted`,
      createdAt: now
    }], { ...(session ? { session } : {}) });
    message = docs[0];
  } catch (e) {
    if (e && e.code === 11000) {
      message = await Message.findOne({ idempotencyKey: idempotencyKey || `order:${orderId}:accepted` }).session(session || null);
    } else {
      throw e;
    }
  }

  const lastMessage = { id: message._id, text: message.text, type: message.type, senderId: null, senderName: null, createdAt: message.createdAt, orderRef: message.orderRef || null };
  const inc = {}; inc[`unreadCounts.${String(customerId)}`] = 1;
  conversation = await Conversation.findOneAndUpdate(
    { _id: conversation._id },
    { $set: { lastMessage }, $inc: inc, $currentDate: { updatedAt: true } },
    { new: true, ...(session ? { session } : {}) }
  );

  await emitAll({ conversation, message, customerId, sellerId });
  return { message, conversation };
}

// System message on order creation (placed)
async function createSystemMessageOnOrderPlaced({ order, requestId, idempotencyKey, session }) {
  const now = new Date();
  const orderId = toIdString(order._id || order.id || order.orderId);
  const customerId = toIdString(order.customer?._id || order.customer);
  const sellerId = toIdString(order.seller?._id || order.seller);
  let conversation = await upsertConversationForOrder({ customerId, sellerId, orderId, session });

  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const total = Number(order.totalAmount || order.total) || 0;
  const text = `Customer placed an order with ${itemCount} item${itemCount === 1 ? '' : 's'} totaling ₱${total}. Waiting for seller confirmation.`;

  let message;
  try {
    const docs = await Message.create([{
      conversationId: conversation._id,
      type: 'system',
      text: text.substring(0, 2048),
      senderId: null,
      receiverId: null,
      orderRef: { orderId: String(orderId), summary: `Placed • ₱${total}` },
      orderSnapshot: {
        orderId: String(orderId),
        items: (order.items || []).map((it) => ({
          productId: toIdString(it.product),
          name: it.name || undefined,
          qty: Number(it.quantity) || 0,
          price: typeof it.price === 'number' ? it.price : (it?.selectedVariant?.price ?? 0)
        })),
        total,
        acceptedAt: null,
        expectedReadyTime: null
      },
      requestId: requestId || undefined,
      idempotencyKey: idempotencyKey || `order:${orderId}:placed`,
      createdAt: now
    }], { ...(session ? { session } : {}) });
    message = docs[0];
  } catch (e) {
    if (e && e.code === 11000) {
      message = await Message.findOne({ idempotencyKey: idempotencyKey || `order:${orderId}:placed` }).session(session || null);
    } else {
      throw e;
    }
  }

  const lastMessage = { id: message._id, text: message.text, type: message.type, senderId: null, senderName: null, createdAt: message.createdAt, orderRef: message.orderRef || null };
  conversation = await Conversation.findOneAndUpdate(
    { _id: conversation._id },
    { $set: { lastMessage }, $inc: { [`unreadCounts.${String(sellerId)}`]: 1 }, $currentDate: { updatedAt: true } },
    { new: true, ...(session ? { session } : {}) }
  );

  await emitAll({ conversation, message, customerId, sellerId });
  return { message, conversation };
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
  // new exports
  getMessagesByOrder,
  sendChatMessage,
  upsertConversationForOrder,
  createSystemMessageForOrder,
  createSystemMessageOnOrderPlaced,
};

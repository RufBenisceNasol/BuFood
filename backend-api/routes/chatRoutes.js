const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Order = require('../models/orderModel');

// Helper: build stable participants key for 1:1 chats
function buildParticipantsKey(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}_${y}`;
}

// GET /chat/conversations — fetch user's conversations
router.get('/conversations', authenticateWithSupabase, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    // Collect counterpart user IDs for name lookup
    const counterpartIds = new Set();
    conversations.forEach(c => {
      const other = (c.participants || []).find(p => String(p) !== String(userId));
      if (other) counterpartIds.add(String(other));
    });
    const users = await User.find({ _id: { $in: Array.from(counterpartIds) } }).select('_id name role avatar').lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    const data = conversations.map((c) => {
      const otherId = (c.participants || []).find(p => String(p) !== String(userId));
      const otherUser = otherId ? userMap.get(String(otherId)) : null;
      return {
        id: c._id,
        participants: c.participants,
        orderId: c.orderId || null,
        lastMessage: c.lastMessage || null,
        unread: Number(c.unreadCounts?.get?.(String(userId)) || c.unreadCounts?.[String(userId)] || 0),
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
        otherParticipantId: otherId || null,
        otherParticipantName: otherUser?.name || 'User',
        otherParticipantAvatar: otherUser?.avatar || null,
        participantsInfo: (c.participants || []).map(pid => {
          const pidStr = String(pid);
          const u = userMap.get(pidStr);
          const isSelf = pidStr === String(userId);
          return {
            id: pid,
            name: u?.name || (isSelf ? (req.user?.name || 'You') : undefined),
            role: u?.role || (isSelf ? req.user?.role : undefined),
            avatar: u?.avatar || (isSelf ? req.user?.avatar : undefined)
          };
        })
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /chat/messages/:conversationId — fetch messages (latest first)
// Optional query: limit (default 50), before (ISO date) for pagination
router.get('/messages/:conversationId', authenticateWithSupabase, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.participants.some((p) => String(p) === String(userId))) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const q = { conversationId };
    if (before) {
      const t = new Date(before);
      if (!isNaN(t)) q.createdAt = { $lt: t };
    }

    const messages = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();

    // Mark messages from others as seen
    const unseenIds = messages
      .filter((m) => String(m.senderId) !== String(userId) && !m.seen)
      .map((m) => m._id);
    if (unseenIds.length) {
      await Message.updateMany({ _id: { $in: unseenIds } }, { $set: { seen: true } });
      // Reset unread count for this user
      const key = String(userId);
      convo.unreadCounts = convo.unreadCounts || new Map();
      if (convo.unreadCounts instanceof Map) {
        convo.unreadCounts.set(key, 0);
      } else {
        convo.unreadCounts[key] = 0;
      }
      await convo.save();
    }

    const participantIds = (convo.participants || []).map((p) => String(p));
    const participants = await User.find({ _id: { $in: participantIds } }).select('_id name role avatar').lean();
    const participantMap = new Map(participants.map((u) => [String(u._id), u]));
    const currentUserId = String(userId);
    if (!participantMap.has(currentUserId) && req.user) {
      participantMap.set(currentUserId, {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatar,
      });
    }

    let orderSummary = null;
    let customerInfo = null;
    let sellerInfo = null;

    if (convo.orderId) {
      const order = await Order.findById(convo.orderId)
        .populate('customer', 'name role avatar')
        .populate('seller', 'name role avatar')
        .populate('items.product', 'name image images')
        .lean();
      if (order) {
        const summaryItems = (order.items || []).map((item) => {
          const productDoc = item.product || {};
          const baseImage = item.selectedVariant?.image
            || productDoc?.image
            || (Array.isArray(productDoc?.images) ? productDoc.images[0] : null);
          return {
            productId: String(productDoc?._id || item.product || ''),
            productName: productDoc?.name || item.selectedVariant?.optionName || 'Product',
            variantName: item.selectedVariant?.variantName || null,
            optionName: item.selectedVariant?.optionName || null,
            image: baseImage || null,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          };
        });

        orderSummary = {
          orderId: String(order._id),
          total: order.totalAmount,
          orderType: order.orderType,
          createdAt: order.createdAt,
          items: summaryItems,
        };

        const customerId = String(order.customer?._id || order.customer || '');
        const sellerId = String(order.seller?._id || order.seller || '');
        customerInfo = customerId
          ? {
              id: customerId,
              name: order.customer?.name,
              role: order.customer?.role,
              avatar: order.customer?.avatar,
            }
          : null;
        sellerInfo = sellerId
          ? {
              id: sellerId,
              name: order.seller?.name,
              role: order.seller?.role,
              avatar: order.seller?.avatar,
            }
          : null;
      }
    }

    const participantsInfo = participantIds.map((pid) => {
      const data = participantMap.get(pid);
      const isSelf = pid === currentUserId;
      return {
        id: pid,
        name: data?.name || (isSelf ? (req.user?.name || 'You') : 'User'),
        role: data?.role || (isSelf ? req.user?.role : undefined),
        avatar: data?.avatar || (isSelf ? req.user?.avatar : undefined),
      };
    });

    if (!customerInfo) {
      customerInfo = participantsInfo.find((p) => (p.role || '').toLowerCase() === 'customer') || null;
    }
    if (!sellerInfo) {
      sellerInfo = participantsInfo.find((p) => (p.role || '').toLowerCase() === 'seller') || null;
    }

    const counterpartInfo = participantsInfo.find((p) => p.id !== currentUserId) || null;

    res.json({
      success: true,
      data: messages.reverse(),
      meta: {
        conversationId: String(convo._id),
        orderId: convo.orderId || null,
        participants: participantsInfo,
        counterpart: counterpartInfo,
        customer: customerInfo,
        seller: sellerInfo,
        orderSummary,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /chat/messages — send message (auto-create conversation if needed)
// Body: { conversationId?, recipientId?, text, orderId? }
router.post('/messages', authenticateWithSupabase, async (req, res) => {
  try {
    const senderId = req.user?._id;
    const { conversationId, recipientId, text, orderId } = req.body || {};

    if (!senderId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }

    let convo = null;
    let receiverId = recipientId;

    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ success: false, message: 'Invalid conversation id' });
      }
      convo = await Conversation.findById(conversationId);
      if (!convo || !convo.participants.some((p) => String(p) === String(senderId))) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      // infer receiverId as the other participant
      const other = convo.participants.find((p) => String(p) !== String(senderId));
      receiverId = receiverId || other;
    } else {
      if (!recipientId) {
        return res.status(400).json({ success: false, message: 'recipientId or conversationId is required' });
      }
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ success: false, message: 'Invalid recipient id' });
      }
      const key = buildParticipantsKey(senderId, recipientId);
      convo = await Conversation.findOne({ participantsKey: key, orderId: orderId || null });
      if (!convo) {
        convo = await Conversation.create({
          participants: [senderId, recipientId],
          participantsKey: key,
          orderId: orderId || null,
          lastMessage: null,
          unreadCounts: {},
          createdBy: 'system'
        });
      }
    }

    const message = await Message.create({
      conversationId: convo._id,
      senderId,
      receiverId: receiverId || null,
      type: 'text',
      text: String(text).trim(),
      seen: false,
    });

    convo.lastMessage = {
      id: message._id,
      text: message.text,
      type: 'text',
      senderId: senderId,
      senderName: req.user?.name || 'User',
      createdAt: message.createdAt,
    };

    // increment unread for receiver
    if (receiverId) {
      const key = String(receiverId);
      if (!convo.unreadCounts) convo.unreadCounts = {};
      if (convo.unreadCounts instanceof Map) {
        const current = Number(convo.unreadCounts.get(key) || 0);
        convo.unreadCounts.set(key, current + 1);
      } else {
        const current = Number(convo.unreadCounts[key] || 0);
        convo.unreadCounts[key] = current + 1;
      }
    }

    await convo.save();

    res.status(201).json({ success: true, data: { message, conversation: convo } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

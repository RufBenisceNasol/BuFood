const { getOrCreateConversation } = require('./chatController');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { emitToUser } = require('../utils/socket');

/**
 * Called when an order is placed to create a conversation and send initial message
 * @param {Object} order - The order object with customerId, sellerId, orderId, and summary
 */
async function onOrderPlaced(order) {
  try {
    const customer = await User.findById(order.customerId);
    const seller = await User.findById(order.sellerId);
    if (!customer || !seller) throw new Error('Users not found');

    const conv = await getOrCreateConversation(customer._id, seller._id, order.orderId);
    const text = `New order placed: ${order.summary}`;
    const msg = await Message.create({
      conversationId: conv._id,
      senderId: customer._id,
      receiverId: seller._id,
      text,
      orderRef: { orderId: order.orderId, summary: order.summary },
      senderName: customer.name,
      senderAvatar: customer.avatar,
    });

    const lastMessage = { 
      text, 
      senderId: customer._id, 
      senderName: customer.name, 
      createdAt: msg.createdAt, 
      orderRef: msg.orderRef 
    };
    
    await Conversation.updateOne(
      { _id: conv._id },
      {
        $set: { lastMessage },
        $inc: { [`unreadCounts.${String(seller._id)}`]: 1 },
        $currentDate: { updatedAt: true },
      }
    );

    emitToUser(seller._id, 'conversation:created', conv);
    emitToUser(seller._id, 'message:received', msg);
    return { conv, msg };
  } catch (error) {
    console.error('Error in onOrderPlaced:', error);
    throw error;
  }
}

/**
 * Endpoint to simulate order placement (for testing)
 */
async function simulateOrder(req, res) {
  try {
    const { customerId, sellerId, orderId, summary } = req.body;
    if (!customerId || !sellerId || !orderId || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await onOrderPlaced({ 
      customerId, 
      sellerId, 
      orderId, 
      summary 
    });
    
    res.json({
      success: true,
      message: 'Order and conversation created',
      data: result
    });
  } catch (error) {
    console.error('Error in simulateOrder:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
}

module.exports = { 
  onOrderPlaced,
  simulateOrder 
};

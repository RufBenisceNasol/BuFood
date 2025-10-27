const express = require('express');
const router = express.Router();
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const { 
  listConversations, 
  getMessages, 
  sendMessage, 
  markRead, 
  createOrFetch 
} = require('../controllers/chatController');
const { simulateOrder } = require('../controllers/chatOrderController');

// Apply authentication middleware to all routes
router.use(authenticateWithSupabase);

// Get all conversations for the current user
router.get('/conversations', listConversations);

// Create or fetch a conversation
router.post('/conversations', createOrFetch);

// Get messages for a conversation
router.get('/messages/:id', getMessages);

// Send a message
router.post('/messages', sendMessage);

// Mark conversation as read
router.post('/conversations/:id/read', markRead);

// Test endpoint to simulate order placement
router.post('/simulate-order', simulateOrder);

module.exports = router;

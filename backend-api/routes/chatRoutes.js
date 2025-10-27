const express = require('express');
const { authenticateWithSupabase } = require('../middlewares/supabaseAuthMiddleware');
const { sendMessage, getMessages, markAsSeen, listConversations, getUnreadSummary } = require('../controllers/chatController');

const router = express.Router();

// All chat routes require Supabase authentication
router.use(authenticateWithSupabase);

// List conversations for current user
router.get('/conversations', listConversations);

// Get total unread count for current user
router.get('/unread', getUnreadSummary);

// Get messages for a conversation
router.get('/:conversationId/messages', getMessages);

// Send a message
router.post('/send', sendMessage);

// Mark messages as seen in a conversation
router.post('/:conversationId/seen', markAsSeen);

module.exports = router;

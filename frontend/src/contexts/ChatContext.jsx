import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { chat as chatApi } from '../api';
import { socketService } from '../services/socketService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.getConversations();
      setConversations(response.data);
      
      // Calculate total unread count
      const totalUnread = response.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0), 0
      );
      setUnreadCount(totalUnread);
      
      return response.data;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.getMessages(conversationId);
      setMessages(response.data || []);
      
      // Mark conversation as read
      if (response.data && response.data.length > 0) {
        await chatApi.markAsRead(conversationId);
        
        // Update unread count
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversationId 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
        
        // Update total unread count
        setUnreadCount(prev => prev - (conversation.unreadCount || 0));
      }
      
      return response.data;
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (text, orderRef = null) => {
    if (!currentConversation) return;
    
    try {
      const message = {
        conversationId: currentConversation._id,
        text,
        orderRef,
        sender: currentUser, // This should be set from your auth context
        createdAt: new Date().toISOString(),
        _id: `temp-${Date.now()}`,
        status: 'sending'
      };
      
      // Optimistic update
      setMessages(prev => [...prev, message]);
      
      // Send via socket
      await socketService.sendMessage(currentConversation._id, text, orderRef);
      
      // Update message status
      setMessages(prev => 
        prev.map(m => 
          m._id === message._id 
            ? { ...m, status: 'sent' } 
            : m
        )
      );
      
      return message;
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(m => 
          m._id === message._id 
            ? { ...m, status: 'failed', error: err.message } 
            : m
        )
      );
      
      throw err;
    }
  }, [currentConversation]);

  // --- SOCKET EVENT SUBSCRIPTIONS PATCH ---
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (!message) return;
      console.log('[Socket] message received:', message);

      // Append to current messages if same conversation
      if (message.conversationId === currentConversation?._id) {
        setMessages((prev) => [...prev, message]);
      }

      // Update conversation list and unread counts
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: new Date().toISOString(),
              unreadCount:
                conv._id === currentConversation?._id
                  ? 0
                  : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });

      // Increase total unread count if message not from me
      if (message.senderId !== currentUser?.id) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleConversationUpdated = (conversation) => {
      if (!conversation) return;
      console.log('[Socket] conversation upserted/updated:', conversation);
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === conversation._id);
        if (exists) {
          return prev
            .map((c) =>
              c._id === conversation._id ? { ...c, ...conversation } : c
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          return [conversation, ...prev].sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        }
      });
    };

    const handleUnreadUpdate = ({ conversationId, unreadCounts }) => {
      console.log('[Socket] unread:update', unreadCounts);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, unreadCounts, unreadCount: unreadCounts?.[currentUser?.id] || 0 }
            : c
        )
      );
    };

    // Subscribe to ALL new backend event names
    const subs = [
      socketService.on('message:created', handleNewMessage),
      socketService.on('message:received', handleNewMessage), // backward compatible
      socketService.on('newMessage', handleNewMessage),
      socketService.on('new_message', handleNewMessage),
      socketService.on('conversation:upserted', handleConversationUpdated),
      socketService.on('conversation:updated', handleConversationUpdated),
      socketService.on('unread:update', handleUnreadUpdate),
    ];

    socketService.connect();
    console.log('ChatContext connected to socket events');

    return () => {
      subs.forEach((unsub) => unsub && unsub());
    };
  }, [currentConversation, currentUser]);
  
  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Join/leave conversation room when current conversation changes
  useEffect(() => {
    if (currentConversation) {
      socketService.joinConversation(currentConversation._id);
      loadMessages(currentConversation._id);
      
      return () => {
        socketService.leaveConversation(currentConversation._id);
      };
    }
  }, [currentConversation, loadMessages]);

  // Context value
  const value = {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    loading,
    error,
    unreadCount,
    loadConversations,
    loadMessages,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

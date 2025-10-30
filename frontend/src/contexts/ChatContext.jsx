import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  // Load current user and subscribe to auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!error) setCurrentUser(data?.user || null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

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
        sender: currentUser || undefined,
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

  // Stable handlers
  const handleNewMessage = useCallback((message) => {
    if (!message) return;
    console.log('[Socket] message received:', message);

    if (message.conversationId === currentConversation?._id) {
      setMessages((prev) => [...prev, message]);
    }

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
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });

    if (message.senderId !== currentUser?.id) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [currentConversation, currentUser]);

  const handleConversationUpdated = useCallback((conversation) => {
    if (!conversation) return;
    console.log('[Socket] conversation upserted/updated:', conversation);
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === conversation._id);
      if (exists) {
        return prev
          .map((c) => (c._id === conversation._id ? { ...c, ...conversation } : c))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      } else {
        return [conversation, ...prev].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
    });
  }, []);

  const handleUnreadUpdate = useCallback(({ conversationId, unreadCounts }) => {
    console.log('[Socket] unread:update', unreadCounts);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversationId
          ? { ...c, unreadCounts, unreadCount: unreadCounts?.[currentUser?.id] || 0 }
          : c
      )
    );
  }, [currentUser?.id]);

  // Attach listeners only after socket connects AND user exists
  useEffect(() => {
    let unsubscribers = [];
    let mounted = true;

    const initSocket = async () => {
      if (!currentUser) {
        console.log('[Chat] No user yet, delaying socket connect...');
        setSocketReady(false);
        socketService.disconnect();
        return;
      }

      const socket = await socketService.connect();
      if (!mounted || !socket) {
        console.warn('[Chat] Socket not connected, retrying later...');
        return;
      }
      setSocketReady(true);
      console.log('[Chat] Socket connected, now attaching listeners.');
      unsubscribers = [
        socketService.on('message:created', handleNewMessage),
        socketService.on('message:received', handleNewMessage),
        socketService.on('newMessage', handleNewMessage),
        socketService.on('new_message', handleNewMessage),
        socketService.on('conversation:upserted', handleConversationUpdated),
        socketService.on('conversation:updated', handleConversationUpdated),
        socketService.on('unread:update', handleUnreadUpdate),
      ];
    };

    initSocket();

    return () => {
      mounted = false;
      unsubscribers.forEach((u) => u && u());
      if (!currentUser) socketService.disconnect();
    };
  }, [handleNewMessage, handleConversationUpdated, handleUnreadUpdate, currentUser]);
  
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
    currentUser,
    socketReady,
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

import React, { createContext, useContext } from 'react';

// No-op Chat context to safely disable chat without breaking imports/usages
const ChatContext = createContext({
  conversations: [],
  currentConversation: null,
  setCurrentConversation: () => {},
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
  currentUser: null,
  socketReady: false,
  loadConversations: async () => [],
  loadMessages: async () => [],
  sendMessage: async () => null,
});

export const ChatProvider = ({ children }) => (
  <ChatContext.Provider value={React.useContext(ChatContext)}>
    {children}
  </ChatContext.Provider>
);

export const useChat = () => useContext(ChatContext);

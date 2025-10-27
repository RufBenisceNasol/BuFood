import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Tabs, Button, Drawer, Badge } from 'antd';
import { MessageOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useChat } from '../contexts/ChatContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import './ChatPage.css';

const { Content } = Layout;

const ChatPage = ({ isSeller = false }) => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { 
    currentConversation, 
    setCurrentConversation, 
    conversations, 
    loadConversations,
    unreadCount 
  } = useChat();
  
  const [showMobileList, setShowMobileList] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMobileList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Set current conversation when URL changes
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        if (isMobile) {
          setShowMobileList(false);
        }
      }
    } else if (conversationId === 'new') {
      // Handle new conversation logic
      setCurrentConversation(null);
      if (isMobile) {
        setShowMobileList(false);
      }
    } else {
      setCurrentConversation(null);
      if (isMobile) {
        setShowMobileList(true);
      }
    }
  }, [conversationId, conversations, isMobile, setCurrentConversation]);

  const handleConversationSelect = (conversation) => {
    setCurrentConversation(conversation);
    const basePath = isSeller ? '/seller/chat' : '/customer/chat';
    navigate(`${basePath}/${conversation._id}`);
    if (isMobile) {
      setShowMobileList(false);
    }
  };

  const handleNewChat = () => {
    const basePath = isSeller ? '/seller/chat' : '/customer/chat';
    navigate(`${basePath}/new`);
    if (isMobile) {
      setShowMobileList(false);
    }
  };

  const handleBackToList = () => {
    const basePath = isSeller ? '/seller/chat' : '/customer/chat';
    navigate(basePath);
    if (isMobile) {
      setShowMobileList(true);
    }
  };

  const renderChatList = () => (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <Button 
          type="primary" 
          onClick={handleNewChat}
          className="new-chat-button"
        >
          New Chat
        </Button>
      </div>
      <ChatList 
        onConversationSelect={handleConversationSelect}
        selectedConversationId={currentConversation?._id}
      />
    </div>
  );

  const renderChatWindow = () => (
    <ChatWindow 
      conversation={currentConversation}
      onBack={handleBackToList}
    />
  );

  // For desktop view
  if (!isMobile) {
    return (
      <Layout className="chat-layout">
        <Content className="chat-content">
          <div className="chat-container">
            <div className="chat-sidebar">
              {renderChatList()}
            </div>
            <div className="chat-main">
              {currentConversation ? (
                renderChatWindow()
              ) : (
                <div className="chat-placeholder">
                  <MessageOutlined className="placeholder-icon" />
                  <h3>Select a conversation to start chatting</h3>
                  <p>Or start a new conversation with a seller</p>
                  <Button 
                    type="primary" 
                    onClick={handleNewChat}
                    className="start-chat-button"
                  >
                    New Message
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  // For mobile view
  return (
    <Layout className="chat-layout mobile">
      <Content className="chat-content">
        {showMobileList ? (
          <div className="chat-mobile-list">
            <div className="chat-mobile-header">
              <h2>Messages</h2>
              <Button 
                type="primary" 
                onClick={handleNewChat}
                className="new-chat-button"
              >
                New
              </Button>
            </div>
            <ChatList 
              onConversationSelect={handleConversationSelect}
              selectedConversationId={currentConversation?._id}
            />
          </div>
        ) : (
          <div className="chat-mobile-window">
            {renderChatWindow()}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ChatPage;

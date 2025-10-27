import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Badge } from 'antd';
import { MessageOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useChat } from '../../contexts/ChatContext';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import './ChatPage.css';

const { Content } = Layout;

const CustomerChatPage = () => {
  const { currentConversation, unreadCount } = useChat();
  const navigate = useNavigate();
  const [showMobileList, setShowMobileList] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

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

  const handleBackToProducts = () => {
    navigate('/products');
  };

  const handleConversationSelect = (conversation) => {
    navigate(`/customer/chat/${conversation._id}`);
    if (isMobile) {
      setShowMobileList(false);
    }
  };

  const handleBackToList = () => {
    navigate('/customer/chat');
    if (isMobile) {
      setShowMobileList(true);
    }
  };

  // For mobile view
  if (isMobile) {
    return (
      <Layout className="chat-layout mobile">
        <Content className="chat-content">
          {showMobileList ? (
            <div className="chat-mobile-list">
              <div className="chat-mobile-header">
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBackToProducts}
                  className="back-button"
                />
                <h2>Messages</h2>
              </div>
              <ChatList 
                onConversationSelect={handleConversationSelect}
                selectedConversationId={currentConversation?._id}
              />
            </div>
          ) : (
            <div className="chat-mobile-window">
              <ChatWindow 
                conversation={currentConversation}
                onBack={handleBackToList}
              />
            </div>
          )}
        </Content>
      </Layout>
    );
  }

  // For desktop view
  return (
    <Layout className="chat-layout">
      <Content className="chat-content">
        <div className="chat-container">
          <div className="chat-sidebar">
            <div className="chat-header">
              <h2>Messages</h2>
              <Badge count={unreadCount} size="small">
                <Button 
                  type="text" 
                  icon={<MessageOutlined />} 
                  className="new-chat-button"
                  onClick={() => navigate('/customer/chat/new')}
                >
                  New Chat
                </Button>
              </Badge>
            </div>
            <ChatList 
              onConversationSelect={handleConversationSelect}
              selectedConversationId={currentConversation?._id}
            />
          </div>
          <div className="chat-main">
            {currentConversation ? (
              <ChatWindow 
                conversation={currentConversation}
                onBack={handleBackToList}
              />
            ) : (
              <div className="chat-placeholder">
                <MessageOutlined className="placeholder-icon" />
                <h3>Select a conversation to start chatting</h3>
                <p>Or start a new conversation with a seller</p>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/customer/chat/new')}
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
};

export default CustomerChatPage;

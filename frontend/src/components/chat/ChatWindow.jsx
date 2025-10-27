import React, { useEffect, useRef, useState } from 'react';
import { Avatar, List, Skeleton, Empty, Button, Tooltip } from 'antd';
import { UserOutlined, CheckOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { useChat } from '../../../contexts/ChatContext';
import './ChatStyles.css';

const ChatWindow = ({ conversation, currentUser, onBack }) => {
  const { messages, loading, sendMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessageStatus = (message) => {
    if (message.status === 'sending') {
      return (
        <Tooltip title="Sending...">
          <ClockCircleOutlined className="message-status" />
        </Tooltip>
      );
    }
    
    if (message.status === 'failed') {
      return (
        <Tooltip title="Failed to send">
          <CloseCircleOutlined className="message-status error" />
        </Tooltip>
      );
    }
    
    if (message.status === 'sent') {
      return (
        <Tooltip title="Sent">
          <CheckOutlined className="message-status sent" />
        </Tooltip>
      );
    }
    
    return null;
  };

  if (!conversation) {
    return (
      <div className="chat-window empty">
        <Empty
          description={
            <span>Select a conversation to start messaging</span>
          }
        />
      </div>
    );
  }

  // Find the other participant (not the current user)
  const otherParticipant = conversation.participants.find(
    p => p._id !== currentUser?.id
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        {isMobile && (
          <Button 
            type="text" 
            icon={<span>←</span>} 
            onClick={onBack}
            className="back-button"
          />
        )}
        <div className="chat-header-info">
          <Avatar 
            src={otherParticipant?.avatar} 
            icon={<UserOutlined />} 
            size="large"
          />
          <div className="chat-header-text">
            <h3>{otherParticipant?.name || 'Unknown User'}</h3>
            <span className="status">
              {conversation.lastSeen ? 'Last seen recently' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {loading && messages.length === 0 ? (
          <div className="loading-messages">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <Empty
              description={
                <span>No messages yet. Say hello! 👋</span>
              }
            />
          </div>
        ) : (
          <List
            className="message-list"
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(message) => {
              const isCurrentUser = message.senderId === currentUser?.id;
              const messageDate = new Date(message.createdAt);
              const showDate = format(messageDate, 'MMM d, yyyy');
              const showTime = format(messageDate, 'h:mm a');

              return (
                <div key={message._id} className={`message-wrapper ${isCurrentUser ? 'current-user' : 'other-user'}`}>
                  <div className="message">
                    {!isCurrentUser && (
                      <Avatar 
                        src={message.sender?.avatar} 
                        icon={<UserOutlined />} 
                        className="message-avatar"
                      />
                    )}
                    <div className="message-content">
                      <div className="message-text">
                        {message.text}
                        <span className="message-time">
                          {showTime}
                          {isCurrentUser && renderMessageStatus(message)}
                        </span>
                      </div>
                      {message.orderRef && (
                        <div className="order-summary">
                          <div className="order-header">
                            <h4>Order #{message.orderRef.orderId}</h4>
                            <span className="order-status">{message.orderRef.status}</span>
                          </div>
                          <p className="order-details">{message.orderRef.summary}</p>
                          <Button type="link" size="small" onClick={() => {
                            // Navigate to order details
                            navigate(`/orders/${message.orderRef.orderId}`);
                          }}>
                            View Order
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <Button 
          type="primary" 
          htmlType="submit"
          disabled={!newMessage.trim()}
          className="send-button"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;

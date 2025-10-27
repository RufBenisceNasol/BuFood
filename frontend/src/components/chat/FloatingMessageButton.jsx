import React, { useState, useEffect } from 'react';
import { Badge, Button, Popover } from 'antd';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../contexts/ChatContext';
import ChatList from './ChatList';
import './ChatStyles.css';

const FloatingMessageButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const buttonRef = React.useRef(null);
  const popoverRef = React.useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        popoverRef.current && 
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNewChat = () => {
    // Navigate to chat page with a new conversation
    navigate('/seller/chat/new');
    setIsOpen(false);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const content = (
    <div className="floating-chat-container" ref={popoverRef}>
      <div className="floating-chat-header">
        <h3>Messages</h3>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={() => setIsOpen(false)}
          className="close-button"
        />
      </div>
      
      <div className="floating-chat-content">
        <ChatList 
          onConversationSelect={(conversation) => {
            navigate(`/seller/chat/${conversation._id}`);
            setIsOpen(false);
          }}
        />
      </div>
      
      <div className="floating-chat-footer">
        <Button 
          type="primary" 
          block 
          onClick={handleNewChat}
          className="new-chat-button"
        >
          New Chat
        </Button>
      </div>
    </div>
  );

  return (
    <div className="floating-message-button" ref={buttonRef}>
      <Popover
        content={content}
        trigger="click"
        visible={isOpen}
        onVisibleChange={setIsOpen}
        placement="topRight"
        overlayClassName="chat-popover"
        destroyTooltipOnHide
      >
        <Badge count={unreadCount} size="small" offset={[-5, 5]}>
          <Button 
            type="primary" 
            shape="circle" 
            icon={<MessageOutlined />} 
            size="large"
            className="message-button"
            onClick={toggleChat}
          />
        </Badge>
      </Popover>
    </div>
  );
};

export default FloatingMessageButton;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, List, Skeleton, Empty, Badge } from 'antd';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import './ChatStyles.css';

const ChatList = ({ onConversationSelect, selectedConversationId }) => {
  const { conversations, loading, unreadCount, loadConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participants.some(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower)
      ) ||
      (conv.lastMessage?.text?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const handleConversationClick = (conversation) => {
    onConversationSelect(conversation);
    // Update URL to reflect the selected conversation
    navigate(`/chat/${conversation._id}`);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-list-container">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <div className="chat-list-container empty-state">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No conversations yet"
        />
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="chat-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      
      <List
        itemLayout="horizontal"
        dataSource={filteredConversations}
        renderItem={(conversation) => {
          const otherParticipant = conversation.participants.find(
            p => p._id !== currentUser?.id
          );
          
          const isSelected = selectedConversationId === conversation._id;
          const hasUnread = conversation.unreadCount > 0;
          
          return (
            <List.Item
              key={conversation._id}
              className={`conversation-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleConversationClick(conversation)}
            >
              <List.Item.Meta
                avatar={
                  <Badge 
                    count={hasUnread ? conversation.unreadCount : 0} 
                    offset={[-5, 5]}
                  >
                    <Avatar 
                      src={otherParticipant?.avatar} 
                      icon={<UserOutlined />} 
                      size="large"
                    />
                  </Badge>
                }
                title={
                  <div className="conversation-header">
                    <span className="conversation-name">
                      {otherParticipant?.name || 'Unknown User'}
                    </span>
                    <span className="conversation-time">
                      {conversation.lastMessage?.createdAt 
                        ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { 
                            addSuffix: true 
                          })
                        : ''}
                    </span>
                  </div>
                }
                description={
                  <div className="conversation-preview">
                    {conversation.lastMessage ? (
                      <>
                        <span className={`preview-text ${hasUnread ? 'unread' : ''}`}>
                          {conversation.lastMessage.senderId === currentUser?.id 
                            ? 'You: ' 
                            : ''}
                          {conversation.lastMessage.text}
                        </span>
                        {hasUnread && <span className="unread-dot" />}
                      </>
                    ) : (
                      <span className="no-messages">No messages yet</span>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default ChatList;

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './ChatStyles.css';

export default function ChatList({ conversations, onSelect, activeId }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="dlb-chat-list">
      <div className="dlb-chat-header">
        <h2>Messages</h2>
      </div>
      <div className="dlb-conversations">
        {conversations?.length > 0 ? (
          conversations.map((conv) => {
            const lastMsg = conv.lastMessage;
            const unreadCount = conv.unreadCounts?.[conv.me] || 0;
            
            return (
              <div
                key={conv._id}
                className={`dlb-conversation ${activeId === conv._id ? 'active' : ''}`}
                onClick={() => onSelect(conv._id)}
              >
                <div className="dlb-avatar">
                  {getInitials(lastMsg?.senderName || '?')}
                </div>
                <div className="dlb-conversation-details">
                  <div className="dlb-conversation-header">
                    <span className="dlb-conversation-name">
                      {lastMsg?.senderName || 'New Chat'}
                    </span>
                    {lastMsg?.createdAt && (
                      <span className="dlb-conversation-time">
                        {format(new Date(lastMsg.createdAt), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="dlb-conversation-preview">
                    {lastMsg?.text || 'No messages yet'}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div className="dlb-unread-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="dlb-no-conversations">
            <p>No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

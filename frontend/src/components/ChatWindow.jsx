import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import './ChatStyles.css';

export default function ChatWindow({ conversation, messages, onLoadMore, hasMore }) {
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore) {
      onLoadMore?.();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const groupedMessages = messages?.reduce((acc, msg) => {
    const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="dlb-window">
      <div className="dlb-header">
        {conversation?.orderId ? `Order #${conversation.orderId}` : 'Chat'}
      </div>
      
      <div className="dlb-messages" onScroll={handleScroll}>
        {hasMore && (
          <div ref={messagesStartRef} className="dlb-load-more">
            Loading older messages...
          </div>
        )}
        
        {groupedMessages && Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="dlb-date-group">
            <div className="dlb-date-separator">
              <span>{format(new Date(date), 'MMMM d, yyyy')}</span>
            </div>
            {msgs.map((msg) => {
              const isSystem = msg.type === 'system';
              const sideClass = isSystem ? 'system' : (msg.senderId === conversation.me ? 'right' : 'left');
              return (
                <div 
                  key={msg._id}
                  className={`dlb-msg ${sideClass}`}
                >
                  <div className="dlb-msg-content">
                    {isSystem ? (
                      <div className="dlb-system-text">{msg.text}</div>
                    ) : (
                      <>
                        <div className="dlb-bubble">{msg.text}</div>
                        {msg.orderRef?.summary && (
                          <div className="dlb-order-ref">
                            <div className="dlb-order-title">Order Reference</div>
                            <div className="dlb-order-summary">{msg.orderRef.summary}</div>
                          </div>
                        )}
                        <div className="dlb-time">
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

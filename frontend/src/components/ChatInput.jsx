import { useState, useRef, useEffect } from 'react';
import { sendMessageAPI } from '../api/chatApi';
import './ChatStyles.css';

export default function ChatInput({ conversation, onSent, role }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const otherId = conversation?.participants?.find(p => String(p) !== String(conversation.me));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !conversation?._id || !otherId) return;
    
    try {
      await sendMessageAPI({
        conversationId: conversation._id,
        receiverId: otherId,
        text: text.trim(),
      });
      setText('');
      onSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dlb-input">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="dlb-textarea"
      />
      <button type="submit" className="dlb-send">
        <span role="img" aria-label="send">
          {text.trim() ? '📤' : '💬'}
        </span>
      </button>
    </form>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { PaperClipOutlined, SmileOutlined, SendOutlined } from '@ant-design/icons';
import EmojiPicker from 'emoji-picker-react';
import './ChatStyles.css';

const ChatInput = ({ onSendMessage, disabled = false, placeholder = 'Type a message...' }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Handle click outside to close emoji picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('.emoji-trigger')
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiData, event) => {
    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    
    setMessage(textBeforeCursor + emojiData.emoji + textAfterCursor);
    
    // Focus back on input and set cursor position
    setTimeout(() => {
      inputRef.current.focus();
      const newCursorPosition = cursorPosition + emojiData.emoji.length;
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-wrapper">
          <button 
            type="button" 
            className="emoji-trigger"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
          >
            <SmileOutlined className="icon" />
          </button>
          
          {showEmojiPicker && (
            <div className="emoji-picker-container" ref={emojiPickerRef}>
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                width={300}
                height={350}
                previewConfig={{
                  showPreview: false
                }}
                skinTonesDisabled
                searchDisabled={false}
              />
            </div>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="message-input"
          />
          
          <div className="action-buttons">
            <Tooltip title="Attach file">
              <button type="button" className="attach-button" disabled={disabled}>
                <PaperClipOutlined className="icon" />
              </button>
            </Tooltip>
            
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              disabled={!message.trim() || disabled}
              className="send-button"
            >
              <span className="send-text">Send</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;

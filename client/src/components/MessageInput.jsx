import React, { useState, useRef } from 'react';
import useStore from '../store';
import { sendMessage, startTyping, stopTyping } from '../socket';

function MessageInput() {
  const [content, setContent] = useState('');
  const currentChannel = useStore((s) => s.currentChannel);
  const typingRef = useRef(false);
  const timeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || !currentChannel) return;

    sendMessage(currentChannel.id, content);
    setContent('');
    stopTyping(currentChannel.id);
    typingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    if (!currentChannel) return;

    if (!typingRef.current) {
      typingRef.current = true;
      startTyping(currentChannel.id);
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      stopTyping(currentChannel.id);
    }, 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit}>
        <div className="message-input-wrapper">
          <input
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={currentChannel ? `Message #${currentChannel.name}` : 'Select a channel'}
            disabled={!currentChannel}
          />
          <button type="submit" className="btn-icon" disabled={!content.trim() || !currentChannel}>
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageInput;

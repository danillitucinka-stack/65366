import React, { useEffect, useRef } from 'react';
import useStore from '../store';
import MessageInput from './MessageInput';
import Message from './Message';
import { getSocket } from '../socket';
import { apiGet } from '../api';

function ChatArea() {
  const currentChannel = useStore((s) => s.currentChannel);
  const messages = useStore((s) => s.messages);
  const setMessages = useStore((s) => s.setMessages);
  const typingUsers = useStore((s) => s.typingUsers);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentChannel) {
      apiGet(`/api/channels/${currentChannel.id}/messages`)
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(() => {});
    }
  }, [currentChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const typingText = Object.values(typingUsers).length > 0
    ? `${Object.values(typingUsers).join(', ')} typing...`
    : '';

  return (
    <div className="main-content">
      <div className="chat-header">
        <span className="hash">#</span> {currentChannel?.name}
        {currentChannel?.type === 'voice' && <span className="voice-badge">Voice</span>}
      </div>
      <div className="messages-container">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="typing-indicator">
        {typingText && <><span>{typingText}</span></>}
      </div>
      <MessageInput />
    </div>
  );
}

export default ChatArea;

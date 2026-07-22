import React from 'react';

function Message({ message }) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="message">
      <div className="message-avatar">
        {message.username?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-username">{message.username}</span>
          <span className="message-time">{time}</span>
        </div>
        <div className="message-text">{message.content}</div>
      </div>
    </div>
  );
}

export default Message;

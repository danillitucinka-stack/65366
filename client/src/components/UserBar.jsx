import React from 'react';
import useStore from '../store';
import { disconnectSocket } from '../socket';

function UserBar() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  if (!user) return null;

  return (
    <div className="user-bar">
      <div className="user-avatar">
        {user.username?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="user-info">
        <div className="username">{user.username}</div>
        <div className="user-status">Online</div>
      </div>
      <div className="user-actions">
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          ✕
        </button>
      </div>
    </div>
  );
}

export default UserBar;

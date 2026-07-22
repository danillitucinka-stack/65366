import React, { useState } from 'react';
import useStore from '../store';
import { apiGet, apiPost } from '../api';

function ServerList({ onSelect }) {
  const servers = useStore((s) => s.servers);
  const currentServer = useStore((s) => s.currentServer);
  const setServers = useStore((s) => s.setServers);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [serverName, setServerName] = useState('');
  const [availableServers, setAvailableServers] = useState([]);

  const handleCreate = async () => {
    if (!serverName.trim()) return;
    try {
      const data = await apiPost('/api/servers', { name: serverName });
      if (data.id) {
        const updated = await apiGet('/api/servers');
        if (Array.isArray(updated)) setServers(updated);
        setShowCreate(false);
        setServerName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (serverId) => {
    try {
      await apiPost(`/api/servers/${serverId}/join`);
      const updated = await apiGet('/api/servers');
      if (Array.isArray(updated)) setServers(updated);
      setShowJoin(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="server-list">
        {servers.map((s) => (
          <div
            key={s.id}
            className={`server-item ${currentServer?.id === s.id ? 'active' : ''}`}
            onClick={() => onSelect(s)}
            title={s.name}
          >
            <span className="server-item-initials">{s.name.charAt(0)}</span>
          </div>
        ))}
        <div className="server-divider" />
        <div className="server-item server-item-add" onClick={() => setShowCreate(true)} title="Add a Server">
          <span style={{ fontSize: 24, color: '#3ba55c' }}>+</span>
        </div>
        {servers.length > 0 && (
          <div className="server-item server-item-add" onClick={() => setShowJoin(true)} title="Find Servers">
            <span style={{ fontSize: 18, color: '#3ba55c' }}>🔍</span>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create a Server</h2>
            <div className="form-group">
              <label>Server Name</label>
              <input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="Enter server name" />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ServerList;

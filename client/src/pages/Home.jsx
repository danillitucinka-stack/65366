import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { getSocket, joinChannel, leaveChannel } from '../socket';
import { apiGet } from '../api';
import ServerList from '../components/ServerList';
import ChatArea from '../components/ChatArea';
import UserBar from '../components/UserBar';
import VoiceChannel from '../components/VoiceChannel';

function Home() {
  const currentServer = useStore((s) => s.currentServer);
  const currentChannel = useStore((s) => s.currentChannel);
  const setCurrentServer = useStore((s) => s.setCurrentServer);
  const setCurrentChannel = useStore((s) => s.setCurrentChannel);
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (currentChannel) {
      joinChannel(currentChannel.id);
      return () => leaveChannel(currentChannel.id);
    }
  }, [currentChannel?.id]);

  const handleSelectServer = async (server) => {
    try {
      const data = await apiGet(`/api/servers/${server.id}`);
      setCurrentServer(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="home-layout">
      <ServerList onSelect={handleSelectServer} />
      {currentServer ? (
        <>
          <div className="channel-sidebar">
            <div className="server-header">{currentServer.name}</div>
            <div className="channel-category">Text Channels</div>
            {currentServer.channels?.filter(c => c.type === 'text').map((ch) => (
              <div
                key={ch.id}
                className={`channel-item ${currentChannel?.id === ch.id ? 'active' : ''}`}
                onClick={() => setCurrentChannel(ch)}
              >
                <span className="hash">#</span> {ch.name}
              </div>
            ))}
            <div className="channel-category">Voice Channels</div>
            {currentServer.channels?.filter(c => c.type === 'voice').map((ch) => (
              <VoiceChannel key={ch.id} channel={ch} serverId={currentServer.id} />
            ))}
            <UserBar />
          </div>
          {currentChannel ? (
            <ChatArea />
          ) : (
            <div className="welcome-screen">
              <div className="welcome-icon">💬</div>
              <h2>Welcome to {currentServer.name}</h2>
              <p>Select a channel to start chatting</p>
            </div>
          )}
        </>
      ) : (
        <div className="welcome-screen">
          <div className="welcome-icon">📡</div>
          <h2>Welcome to Discord Clone</h2>
          <p>Select a server from the left sidebar to get started, or create a new one!</p>
        </div>
      )}
    </div>
  );
}

export default Home;

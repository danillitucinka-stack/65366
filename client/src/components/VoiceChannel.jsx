import React, { useState } from 'react';
import useStore from '../store';
import { joinVoice, leaveVoice } from '../socket';

function VoiceChannel({ channel, serverId }) {
  const voiceChannelId = useStore((s) => s.voiceChannelId);
  const setVoiceChannelId = useStore((s) => s.setVoiceChannelId);
  const voiceUsers = useStore((s) => s.voiceUsers);

  const isInChannel = voiceChannelId === channel.id;

  const handleToggle = () => {
    if (isInChannel) {
      leaveVoice(channel.id, serverId);
      setVoiceChannelId(null);
    } else {
      if (voiceChannelId) {
        leaveVoice(voiceChannelId, serverId);
      }
      joinVoice(channel.id, serverId);
      setVoiceChannelId(channel.id);
    }
  };

  return (
    <>
      <div
        className={`channel-item ${isInChannel ? 'active' : ''}`}
        onClick={handleToggle}
      >
        <span className="voice-icon">🔊</span> {channel.name}
        {isInChannel && <span style={{ marginLeft: 'auto', color: '#3ba55c', fontSize: 12 }}>Connected</span>}
      </div>
      {isInChannel && voiceUsers.length > 0 && (
        <div style={{ paddingLeft: 32, fontSize: 12, color: '#72767d' }}>
          {voiceUsers.map((vu) => (
            <div key={vu.userId} className="voice-user">
              <span className="voice-indicator" />
              {vu.username}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default VoiceChannel;

import { io } from 'socket.io-client';
import useStore from './store';

let socket = null;

export function connectSocket() {
  const token = useStore.getState().token;
  if (!token) return null;
  
  if (socket?.connected) return socket;
  
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  socket = io(apiUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    path: '/socket.io'
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });
  
  socket.on('new-message', (message) => {
    const state = useStore.getState();
    if (state.currentChannel?.id === message.channel_id) {
      state.addMessage(message);
    }
  });
  
  socket.on('typing-start', ({ userId, username }) => {
    const state = useStore.getState();
    if (userId !== state.user?.id) {
      state.addTypingUser(userId, username);
    }
  });
  
  socket.on('typing-stop', ({ userId }) => {
    useStore.getState().removeTypingUser(userId);
  });
  
  socket.on('user-joined-voice', ({ userId, username }) => {
    useStore.getState().addVoiceUser({ userId, username });
  });
  
  socket.on('user-left-voice', ({ userId }) => {
    useStore.getState().removeVoiceUser(userId);
  });
  
  socket.on('offer', ({ offer, userId, username }) => {
    // Handle WebRTC offer - simplified
    console.log('Received offer from', username);
  });
  
  socket.on('answer', ({ answer, userId }) => {
    console.log('Received answer from', userId);
  });
  
  socket.on('ice-candidate', ({ candidate, userId }) => {
    console.log('Received ICE candidate from', userId);
  });
  
  socket.on('error', ({ message }) => {
    console.error('Socket error:', message);
  });
  
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinChannel(channelId) {
  if (socket) socket.emit('join-channel', channelId);
}

export function leaveChannel(channelId) {
  if (socket) socket.emit('leave-channel', channelId);
}

export function sendMessage(channelId, content) {
  if (socket) socket.emit('send-message', { channelId, content });
}

export function startTyping(channelId) {
  if (socket) socket.emit('typing-start', { channelId });
}

export function stopTyping(channelId) {
  if (socket) socket.emit('typing-stop', { channelId });
}

export function joinVoice(channelId, serverId) {
  if (socket) socket.emit('voice-join', { channelId, serverId });
}

export function leaveVoice(channelId, serverId) {
  if (socket) socket.emit('voice-leave', { channelId, serverId });
}

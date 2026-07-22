import { query } from '../lib/db.js';
import { verifyToken } from '../lib/middleware.js';

let io;

export function setupSocket(socketIo) {
  io = socketIo;
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));
    
    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Update user status to online
    query('UPDATE users SET status = $1 WHERE id = $2', ['online', socket.user.id]).catch(console.error);

    // Join a channel room
    socket.on('join-channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    // Leave a channel room
    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // Send message through socket
    socket.on('send-message', async (data) => {
      try {
        const { channelId, content } = data;
        if (!channelId || !content) return;

        const { v4: uuidv4 } = await import('uuid');
        const id = uuidv4();
        
        await query(
          'INSERT INTO messages (id, channel_id, user_id, content) VALUES ($1, $2, $3, $4)',
          [id, channelId, socket.user.id, content]
        );

        const result = await query(
          `SELECT m.*, u.username, u.avatar
           FROM messages m
           JOIN users u ON m.user_id = u.id
           WHERE m.id = $1`,
          [id]
        );

        io.to(`channel:${channelId}`).emit('new-message', result.rows[0]);
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Voice channel join
    socket.on('voice-join', async (data) => {
      try {
        const { channelId, serverId } = data;
        await query(
          'INSERT INTO voice_states (user_id, channel_id, server_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, channel_id) DO NOTHING',
          [socket.user.id, channelId, serverId]
        );
        socket.join(`voice:${channelId}`);
        socket.to(`voice:${channelId}`).emit('user-joined-voice', { userId: socket.user.id, username: socket.user.username });
        io.to(`server:${serverId}`).emit('voice-state-update', { userId: socket.user.id, channelId, joined: true });
      } catch (err) {
        console.error(err);
      }
    });

    // Voice channel leave
    socket.on('voice-leave', async (data) => {
      try {
        const { channelId, serverId } = data;
        await query('DELETE FROM voice_states WHERE user_id = $1 AND channel_id = $2', [socket.user.id, channelId]);
        socket.leave(`voice:${channelId}`);
        socket.to(`voice:${channelId}`).emit('user-left-voice', { userId: socket.user.id, username: socket.user.username });
        io.to(`server:${serverId}`).emit('voice-state-update', { userId: socket.user.id, channelId: null, joined: false });
      } catch (err) {
        console.error(err);
      }
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(`voice:${data.channelId}`).emit('offer', { offer: data.offer, userId: socket.user.id, username: socket.user.username });
    });

    socket.on('answer', (data) => {
      socket.to(`voice:${data.channelId}`).emit('answer', { answer: data.answer, userId: socket.user.id });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(`voice:${data.channelId}`).emit('ice-candidate', { candidate: data.candidate, userId: socket.user.id });
    });

    // Typing indicator
    socket.on('typing-start', (data) => {
      socket.to(`channel:${data.channelId}`).emit('typing-start', { userId: socket.user.id, username: socket.user.username });
    });

    socket.on('typing-stop', (data) => {
      socket.to(`channel:${data.channelId}`).emit('typing-stop', { userId: socket.user.id });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      query('UPDATE users SET status = $1 WHERE id = $2', ['offline', socket.user.id]).catch(console.error);
      
      // Leave all voice channels
      const voiceStates = await query('SELECT channel_id, server_id FROM voice_states WHERE user_id = $1', [socket.user.id]).catch(() => ({ rows: [] }));
      for (const vs of voiceStates.rows) {
        socket.to(`voice:${vs.channel_id}`).emit('user-left-voice', { userId: socket.user.id });
        io.to(`server:${vs.server_id}`).emit('voice-state-update', { userId: socket.user.id, channelId: null, joined: false });
      }
      await query('DELETE FROM voice_states WHERE user_id = $1', [socket.user.id]).catch(() => {});
    });
  });
}

// Vercel serverless handler for Socket.io
let handlerInitialized = false;

export default async function handler(req, res) {
  if (!handlerInitialized) {
    const { createServer } = await import('http');
    const { Server } = await import('socket.io');
    const express = await import('express');
    
    const app = express.default();
    const httpServer = createServer(app);
    
    const socketIo = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      path: '/api/socket'
    });
    
    setupSocket(socketIo);
    handlerInitialized = true;
    
    // Store for later use
    global.__socketIo = socketIo;
    global.__httpServer = httpServer;
  }

  if (global.__socketIo?.engine?.handleRequest) {
    global.__socketIo.engine.handleRequest(req, res);
  } else {
    res.status(200).json({ status: 'Socket.io server ready', message: 'Use WebSocket protocol to connect' });
  }
}

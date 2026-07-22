import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './lib/db.js';
import { setupSocket } from './api/socket.js';
import authRoutes from './api/auth.js';
import serverRoutes from './api/servers.js';
import channelRoutes from './api/channels.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/socket.io'
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
// Auth routes available at both /api/auth/* and direct /api/register, /api/login, /api/me
app.use('/api/auth', authRoutes);
app.post('/api/register', (req, res, next) => { req.url = '/register'; next(); }, authRoutes);
app.post('/api/login', (req, res, next) => { req.url = '/login'; next(); }, authRoutes);
app.get('/api/me', (req, res, next) => { req.url = '/me'; next(); }, authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Setup socket.io
setupSocket(io);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    console.log('Starting server...');
    await initDb();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}/socket.io`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

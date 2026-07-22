import express from 'express';
import cors from 'cors';
import { initDb } from '../lib/db.js';
import authRoutes from './auth.js';
import serverRoutes from './servers.js';
import channelRoutes from './channels.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/register', (req, res, next) => { req.url = '/register'; next(); }, authRoutes);
app.post('/api/login', (req, res, next) => { req.url = '/login'; next(); }, authRoutes);
app.get('/api/me', (req, res, next) => { req.url = '/me'; next(); }, authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default async function handler(req, res) {
  await initDb().catch(() => {});
  app(req, res);
}

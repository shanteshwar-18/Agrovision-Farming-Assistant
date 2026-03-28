// ============================================================
// AgroVision Backend Proxy — Express Server
// Port: 3001  (frontend Vite runs on 3000, proxied via vite.config)
// ============================================================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';

import weatherRouter from './routes/weather.js';
import soilRouter from './routes/soil.js';
import marketRouter from './routes/market.js';
import plantnetRouter from './routes/plantnet.js';
import qwenRouter from './routes/qwen.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware ----
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json({ limit: '10mb' }));

// ---- Routes ----
app.use('/api/weather', weatherRouter);
app.use('/api/soil', soilRouter);
app.use('/api/market', marketRouter);
app.use('/api/plantnet', plantnetRouter);
app.use('/api/qwen', qwenRouter);

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- 404 handler ----
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🌱 AgroVision Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

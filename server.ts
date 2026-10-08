import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint for Cloud Run container liveness/readiness
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple file-backed database store
const DB_DIR = path.join(__dirname, 'server_data');
const DB_FILE = path.join(DB_DIR, 'db.json');

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (e) {
  // Graceful fallback if filesystem is read-only
}

app.get('/api/database', (_req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
    return res.json({});
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read server database' });
  }
});

app.post('/api/database', (req, res) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to write server database' });
  }
});

// Serve frontend static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Single Page Application (SPA) catch-all fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>সিলেট মানব সেবা সংগঠন</title></head><body><div id="root">App Loading...</div></body></html>');
});

// Bind explicitly to 0.0.0.0 for Cloud Run container routing
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});

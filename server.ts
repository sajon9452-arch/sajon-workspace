import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support large payloads (such as compressed base64 profile / slider photos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. AppCreator24 & Mobile WebView Security & Optimization Headers
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*, geolocation=*');
  res.setHeader('Feature-Policy', 'camera *; microphone *; geolocation *');
  // Allow cross-origin access within AppCreator24 wrapper containers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Pragma, Cache-Control');
  next();
});

// Handle preflight OPTIONS requests cleanly
app.options('*', (_req, res) => {
  res.sendStatus(204);
});

// 2. Health check endpoint for Cloud Run container readiness
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Persistent Server Database Storage
const DB_DIR = path.join(__dirname, 'server_data');
const DB_FILE = path.join(DB_DIR, 'db.json');

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch {
  // Graceful fallback if filesystem is read-only
}

// In-Memory Database State for ultra-fast response times (<10ms)
let dbData: Record<string, any> = {};
let dbVersion = 1;
let dbLastModified = new Date().toISOString();

// Load initial database state from disk if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.data && typeof parsed.data === 'object') {
        dbData = parsed.data;
        dbVersion = typeof parsed.version === 'number' ? parsed.version : 1;
        dbLastModified = parsed.lastModified || new Date().toISOString();
      } else {
        dbData = parsed;
      }
    }
  }
} catch (err) {
  console.warn('Initial server db load warning:', err);
}

// Helper to save database to disk atomically
function persistDbToDisk() {
  try {
    const payload = {
      version: dbVersion,
      lastModified: dbLastModified,
      data: dbData
    };
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing server database to disk:', err);
  }
}

// 4. Real-Time Push Mechanism: Server-Sent Events (SSE)
const sseClients = new Set<express.Response>();

function broadcastSyncUpdate() {
  const payloadString = JSON.stringify({
    version: dbVersion,
    lastModified: dbLastModified,
    data: dbData
  });
  const sseMessage = `event: sync\ndata: ${payloadString}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(sseMessage);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Periodically send keep-alive comments every 15s to keep connections alive through WebViews / mobile proxies
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': keepalive\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// SSE Streaming Route for Instant Push to All Member Devices (<50ms)
app.get('/api/sync/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx / Cloud Run)

  // Flush headers if supported
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Send immediate initial sync payload upon connection
  const initialPayload = JSON.stringify({
    version: dbVersion,
    lastModified: dbLastModified,
    data: dbData
  });
  res.write(`event: sync\ndata: ${initialPayload}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 5. Cache-Bypass REST Sync Endpoints
// Strict No-Cache middleware for all /api endpoints
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// GET /api/sync: Fetches live data snapshot with no-cache headers
app.get('/api/sync', (_req, res) => {
  res.json({
    version: dbVersion,
    lastModified: dbLastModified,
    data: dbData,
    connectedDevices: sseClients.size
  });
});

// POST /api/sync: Receives live updates from admin or members and broadcasts instantly
app.post('/api/sync', (req, res) => {
  try {
    const body = req.body;
    let hasChanges = false;

    if (body) {
      if (body.key && body.data !== undefined) {
        dbData[body.key] = body.data;
        hasChanges = true;
      } else if (body.data && typeof body.data === 'object') {
        dbData = {
          ...dbData,
          ...body.data
        };
        hasChanges = true;
      } else if (body.fullSnapshot && typeof body.fullSnapshot === 'object') {
        dbData = body.fullSnapshot;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      dbVersion += 1;
      dbLastModified = new Date().toISOString();
      persistDbToDisk();
      broadcastSyncUpdate();
    }

    return res.json({
      success: true,
      version: dbVersion,
      lastModified: dbLastModified,
      connectedDevices: sseClients.size
    });
  } catch (err) {
    console.error('Error processing /api/sync:', err);
    return res.status(500).json({ error: 'Failed to synchronize live data' });
  }
});

// Backwards-compatible /api/database endpoints
app.get('/api/database', (_req, res) => {
  res.json(dbData);
});

app.post('/api/database', (req, res) => {
  try {
    if (req.body && typeof req.body === 'object') {
      dbData = { ...dbData, ...req.body };
      dbVersion += 1;
      dbLastModified = new Date().toISOString();
      persistDbToDisk();
      broadcastSyncUpdate();
    }
    return res.json({ success: true, version: dbVersion });
  } catch {
    return res.status(500).json({ error: 'Failed to write database' });
  }
});

// 6. Frontend Serving & Vite Integration
async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
      console.log('Vite middleware mounted in development mode');
    } catch (err) {
      console.error('Failed to initialize Vite development middleware:', err);
    }
  } else {
    // Production mode: Serve built static files from /dist with No-Cache on HTML
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        }
      }));
    }

    // SPA catch-all fallback
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>সিলেট মানব সেবা সংগঠন</title></head><body><div id="root">App Loading...</div></body></html>');
    });
  }

  // Bind to 0.0.0.0 for Cloud Run container routing
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();

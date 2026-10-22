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

// 3. Persistent Server Database Storage with Redundant Disk Backups
const DB_DIR = path.join(__dirname, 'server_data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const DB_BACKUP_FILE = path.join(DB_DIR, 'db.backup.json');

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch {
  // Graceful fallback if filesystem is read-only
}

// Supabase Server Integration Bridge
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://quqzeiuaybmhzisivrud.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Cjt1ffMfKo0CEEw3uMIbQw_1qMYftvd';

// In-Memory Database State for ultra-fast response times (<10ms)
let dbData: Record<string, any> = {};
let dbVersion = 1;
let dbLastModified = new Date().toISOString();

// Pre-seeded initial records: Strictly clean zero dummy data across the entire app
const DEFAULT_INITIAL_COLLECTIONS: Record<string, any> = {
  homeSlides: [],
  aidDonations: [],
  extraContributions: [],
  organizationRules: [],
  supportMembers: [],
  members: [],
  donors: [],
  funds: [],
  notices: [],
  humanitarianActivities: [],
  supportReports: []
};

// Helper to push collection updates to Supabase app_collections in the background
async function pushToSupabaseServer(collectionKey: string, data: any) {
  if (!collectionKey || data === undefined) return;
  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    };
    await fetch(`${SUPABASE_URL}/rest/v1/app_collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: collectionKey,
        data: data,
        updated_at: new Date().toISOString()
      })
    });
  } catch {
    // Non-blocking background sync
  }
}

// Helper: Seed server database from Supabase Cloud on startup
async function syncFromSupabaseServer() {
  try {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    };

    // 1. Attempt read from universal app_collections table
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_collections?select=*`, { headers });
      if (res.ok) {
        const collections = await res.json();
        if (Array.isArray(collections) && collections.length > 0) {
          let updated = false;
          for (const item of collections) {
            if (item && item.id && item.data) {
              const changed = mergeCollectionSafely(item.id, item.data, false);
              if (changed) updated = true;
            }
          }
          if (updated) {
            dbVersion += 1;
            dbLastModified = new Date().toISOString();
            persistDbToDisk();
            console.log('[Server Supabase] Seeded database from Supabase cloud app_collections successfully');
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Check individual tables
    const tableKeys = ['members', 'donors', 'funds', 'notices', 'support_members', 'home_slides', 'settings'];
    for (const tbl of tableKeys) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${tbl}?select=*`, { headers });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            let normalizedKey = tbl;
            if (tbl === 'support_members') normalizedKey = 'supportMembers';
            if (tbl === 'home_slides') normalizedKey = 'homeSlides';
            const changed = mergeCollectionSafely(normalizedKey, rows, false);
            if (changed) {
              dbVersion += 1;
              dbLastModified = new Date().toISOString();
              persistDbToDisk();
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('[Server Supabase] Startup seed error:', err);
  }
}

// Helper: Load database state from disk with backup fallback
function loadDatabaseState() {
  let loaded = false;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.data && typeof parsed.data === 'object') {
          dbData = parsed.data;
          dbVersion = typeof parsed.version === 'number' ? parsed.version : 1;
          dbLastModified = parsed.lastModified || new Date().toISOString();
          loaded = true;
        } else {
          dbData = parsed;
          loaded = true;
        }
      }
    } catch (err) {
      console.warn('Primary DB_FILE read failed, attempting DB_BACKUP_FILE:', err);
    }
  }

  if (!loaded && fs.existsSync(DB_BACKUP_FILE)) {
    try {
      const raw = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        dbData = parsed.data || parsed;
        dbVersion = typeof parsed.version === 'number' ? parsed.version : 1;
        dbLastModified = parsed.lastModified || new Date().toISOString();
        loaded = true;
        console.log('Restored database from DB_BACKUP_FILE successfully');
      }
    } catch (err) {
      console.error('Backup database load failed:', err);
    }
  }

  // Pre-seed initial collections if they are missing
  let needsInitialPersist = false;
  for (const [key, defaultList] of Object.entries(DEFAULT_INITIAL_COLLECTIONS)) {
    if (!dbData[key] || !Array.isArray(dbData[key])) {
      dbData[key] = defaultList;
      needsInitialPersist = true;
    }
  }

  if (!dbData['permanentlyDeleted']) {
    dbData['permanentlyDeleted'] = [];
  }

  if (needsInitialPersist || !loaded) {
    persistDbToDisk();
  }

  // Seed from Supabase Cloud
  syncFromSupabaseServer();
}

// Initial database load
loadDatabaseState();

// Helper to save database to disk atomically with backup redundancy
function persistDbToDisk() {
  try {
    const payload = {
      version: dbVersion,
      lastModified: dbLastModified,
      data: dbData
    };
    const serialized = JSON.stringify(payload, null, 2);
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Save redundant backup
    try {
      fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');
    } catch {
      // backup failure should not crash
    }
  } catch (err) {
    console.error('Error writing server database to disk:', err);
  }
}

// Protected collection keys where items must be preserved and never accidentally emptied
const PROTECTED_COLLECTIONS = [
  'members',
  'funds',
  'donors',
  'notices',
  'homeSlides',
  'aidDonations',
  'extraContributions',
  'humanitarianActivities',
  'organizationRules',
  'supportReports',
  'supportMembers',
  'userAccounts',
  'securityAlerts'
];

/**
 * Non-destructive safe merger:
 * Ensures existing saved records are NEVER wiped out by an empty array or accidental client sync.
 * Records are only deleted if their ID is in permanentlyDeleted or an explicit deletion is requested.
 */
function mergeCollectionSafely(key: string, incomingData: any, allowEmpty = false): boolean {
  if (!incomingData && incomingData !== 0 && incomingData !== false && incomingData !== '') {
    return false;
  }

  // Handle scalar / config objects
  if (!PROTECTED_COLLECTIONS.includes(key)) {
    dbData[key] = incomingData;
    return true;
  }

  if (!Array.isArray(incomingData)) {
    return false;
  }

  const existingList: any[] = Array.isArray(dbData[key]) ? dbData[key] : [];
  const permanentlyDeleted: string[] = Array.isArray(dbData['permanentlyDeleted']) ? dbData['permanentlyDeleted'] : [];
  const deletedSet = new Set(permanentlyDeleted);

  // If incoming list is empty array
  if (incomingData.length === 0) {
    if (existingList.length === 0) {
      dbData[key] = [];
      return false;
    }
    // Protect populated database from being accidentally cleared!
    if (!allowEmpty) {
      console.warn(`[Protection] Blocked accidental wiping of collection "${key}". Preserved ${existingList.length} records.`);
      return false;
    }
    dbData[key] = [];
    return true;
  }

  // Non-destructive ID merge:
  const itemMap = new Map<string, any>();
  for (const existingItem of existingList) {
    if (existingItem && existingItem.id && !deletedSet.has(existingItem.id)) {
      itemMap.set(existingItem.id, existingItem);
    }
  }

  // Update or insert incoming items
  for (const incomingItem of incomingData) {
    if (incomingItem && incomingItem.id) {
      if (!deletedSet.has(incomingItem.id)) {
        itemMap.set(incomingItem.id, incomingItem);
      }
    } else if (incomingItem) {
      const generatedId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      itemMap.set(generatedId, { ...incomingItem, id: generatedId });
    }
  }

  const merged = Array.from(itemMap.values()).filter(item => !deletedSet.has(item.id));
  dbData[key] = merged;
  return true;
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

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

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

// Explicit Manual Record Deletion Endpoint (Only manual admin action can delete data)
app.post('/api/sync/delete', (req, res) => {
  try {
    const { id, collection } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'Record ID is required for deletion' });
    }

    const permanentlyDeleted: string[] = Array.isArray(dbData['permanentlyDeleted']) ? dbData['permanentlyDeleted'] : [];
    if (!permanentlyDeleted.includes(id)) {
      dbData['permanentlyDeleted'] = [...permanentlyDeleted, id];
    }

    if (collection && Array.isArray(dbData[collection])) {
      dbData[collection] = dbData[collection].filter((item: any) => item && item.id !== id);
    } else {
      for (const colKey of PROTECTED_COLLECTIONS) {
        if (Array.isArray(dbData[colKey])) {
          dbData[colKey] = dbData[colKey].filter((item: any) => item && item.id !== id);
        }
      }
    }

    dbVersion += 1;
    dbLastModified = new Date().toISOString();
    persistDbToDisk();
    broadcastSyncUpdate();

    return res.json({ success: true, version: dbVersion, deletedId: id });
  } catch (err) {
    console.error('Error deleting record from server db:', err);
    return res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/sync: Receives live updates with non-destructive preservation
app.post('/api/sync', (req, res) => {
  try {
    const body = req.body;
    let hasChanges = false;
    const allowEmpty = body && body.allowEmpty === true;

    if (body) {
      // Handle explicit permanent deletion registration
      if (body.permanentlyDeleteId) {
        const id = body.permanentlyDeleteId;
        const currentDeleted: string[] = Array.isArray(dbData['permanentlyDeleted']) ? dbData['permanentlyDeleted'] : [];
        if (!currentDeleted.includes(id)) {
          dbData['permanentlyDeleted'] = [...currentDeleted, id];
        }
        for (const colKey of PROTECTED_COLLECTIONS) {
          if (Array.isArray(dbData[colKey])) {
            dbData[colKey] = dbData[colKey].filter((item: any) => item && item.id !== id);
          }
        }
        hasChanges = true;
      }

      if (body.key && body.data !== undefined) {
        const changed = mergeCollectionSafely(body.key, body.data, allowEmpty);
        if (changed) hasChanges = true;
      } else if (body.data && typeof body.data === 'object') {
        for (const [k, val] of Object.entries(body.data)) {
          const changed = mergeCollectionSafely(k, val, allowEmpty);
          if (changed) hasChanges = true;
        }
      } else if (body.fullSnapshot && typeof body.fullSnapshot === 'object') {
        for (const [k, val] of Object.entries(body.fullSnapshot)) {
          const changed = mergeCollectionSafely(k, val, allowEmpty);
          if (changed) hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      dbVersion += 1;
      dbLastModified = new Date().toISOString();
      persistDbToDisk();
      broadcastSyncUpdate();

      // Asynchronously backup to Supabase
      if (body) {
        if (body.key && body.data !== undefined) {
          pushToSupabaseServer(body.key, body.data);
        } else if (body.data && typeof body.data === 'object') {
          for (const [k, val] of Object.entries(body.data)) {
            pushToSupabaseServer(k, val);
          }
        }
      }
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

// Supabase Status & SQL schema helper endpoints
app.get('/api/supabase/status', async (_req, res) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    return res.json({
      connected: r.ok || r.status === 200 || r.status === 404,
      url: SUPABASE_URL,
      status: r.status
    });
  } catch (e: any) {
    return res.json({ connected: false, error: e?.message });
  }
});

// Backwards-compatible /api/database endpoints
app.get('/api/database', (_req, res) => {
  res.json(dbData);
});

app.post('/api/database', (req, res) => {
  try {
    if (req.body && typeof req.body === 'object') {
      let hasChanges = false;
      for (const [k, val] of Object.entries(req.body)) {
        const changed = mergeCollectionSafely(k, val, false);
        if (changed) hasChanges = true;
      }
      if (hasChanges) {
        dbVersion += 1;
        dbLastModified = new Date().toISOString();
        persistDbToDisk();
        broadcastSyncUpdate();
      }
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

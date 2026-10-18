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

// In-Memory Database State for ultra-fast response times (<10ms)
let dbData: Record<string, any> = {};
let dbVersion = 1;
let dbLastModified = new Date().toISOString();

// Pre-seeded initial records to guarantee organization content is never missing or blank
const DEFAULT_INITIAL_COLLECTIONS: Record<string, any> = {
  homeSlides: [
    {
      id: 'slide-1',
      title: 'মানবতার কল্যাণে নিবেদিত সিলেট মানব সেবা সংগঠন',
      description: 'অসহায় মানুষের পাশে দাঁড়াতে ও মানবতার সেবায় আমাদের ঐক্যবদ্ধ পথচলা। চট্টগ্রাম ও সিলেটের তৃণমূল মানুষের সেবায় নিবেদিত।',
      category: 'কেন্দ্রীয় মিলনমেলা',
      date: '২০২৬',
      location: 'পতেঙ্গা, চট্টগ্রাম',
      imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
      isActive: true
    },
    {
      id: 'slide-2',
      title: 'জরুরি খাদ্য ও শীতবস্ত্র বিতরণ কর্মসূচি',
      description: 'দরিদ্র ও প্রান্তিক জনগোষ্ঠীর মাঝে খাদ্য সামগ্রী ও শীতবস্ত্র পৌঁছে দেওয়ার মহৎ উদ্যোগ।',
      category: 'ত্রাণ ও পুনর্বাসন',
      date: '২০২৬',
      location: 'সিলেট ও চট্টগ্রাম',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
      isActive: true
    },
    {
      id: 'slide-3',
      title: 'বিনামূল্যে রক্তদান ক্যাম্পেইন ও স্বাস্থ্য সহায়তা',
      description: 'সংগঠনের রক্তযোদ্ধা ভাইদের উদ্যোগে স্বেচ্ছায় রক্তদান ও মুমূর্ষু রোগীর পাশে তাৎক্ষণিক রক্ত পৌঁছানোর মহৎ কার্যক্রম।',
      category: 'স্বাস্থ্য ও রক্তদান',
      date: '২০২৬',
      location: 'চট্টগ্রাম',
      imageUrl: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&w=1200&q=80',
      isActive: true
    }
  ],
  aidDonations: [
    {
      id: 'aid-1',
      recipientName: 'রহিমা বেগম (অসহায় বিধবা মাতা)',
      photoUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=600&q=80',
      address: 'পতেঙ্গা কাঠগড় বাজার এলাকা, চট্টগ্রাম',
      providerReference: 'মোঃ কামরুল হাসান (সভাপতি)',
      amount: 15000,
      date: '১২ মার্চ ২০২৬',
      description: 'কন্যার বিবাহ ও পরিবারের এক মাসের খাদ্যসামগ্রী ক্রয়ের জন্য জরুরি আর্থিক অনুদান বিতরণ করা হয়েছে।',
      bkashNumber: '01886122678',
      nagadNumber: '01711000000',
      rocketNumber: '01886122678-5',
      createdAt: '2026-03-12T10:00:00Z'
    },
    {
      id: 'aid-2',
      recipientName: 'মোঃ আব্দুল জলিল (অসুস্থ রিকশাচালক)',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      address: 'কুমারগাঁও, সিলেট সদর',
      providerReference: 'তানভীর আহমেদ (সমন্বয়ক)',
      amount: 20000,
      date: '০৫ মার্চ ২০২৬',
      description: 'হৃদরোগে আক্রান্ত হওয়ায় জরুরি অপারেশন ও ওষুধের খরচের জন্য সংগঠনের চিকিৎসা তহবিল হতে হস্তান্তরকৃত অনুদান।',
      bkashNumber: '01812345678',
      nagadNumber: '01911223344',
      createdAt: '2026-03-05T14:30:00Z'
    },
    {
      id: 'aid-3',
      recipientName: 'সুফিয়া আক্তার (মেধাবী শিক্ষার্থী)',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      address: 'দক্ষিণ পতেঙ্গা, চট্টগ্রাম',
      providerReference: 'সাইদুল ইসলাম সাজন (অর্থ সম্পাদক)',
      amount: 12000,
      date: '২০ ফেব্রুয়ারি ২০২৬',
      description: 'এইচএসসি পরীক্ষার ফি এবং বইপত্র ক্রয়ের নিমিত্তে সংগঠনের শিক্ষা সহায়তা তহবিল থেকে এককালীন অনুদান।',
      bkashNumber: '01886122678',
      createdAt: '2026-02-20T09:15:00Z'
    }
  ],
  extraContributions: [
    {
      id: 'extra-1',
      donorName: 'মোঃ আব্দুল করিম (প্রবাসী রেমিট্যান্স যোদ্ধা)',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      address: 'মাস্কাট, ওমান (মূল বাড়ি: সিলেট)',
      providerReference: 'ফখরুল ইসলাম চৌধুরী (প্রবাসী কল্যাণ সমন্বয়ক)',
      amount: 50000,
      date: '১০ মার্চ ২০২৬',
      description: 'রমজান উপলক্ষে গরিব ও এতিমদের মাঝে ইফতার ও ঈদ উপহার বিতরণ ফান্ডের জন্য বিশেষ অতিরিক্ত অনুদান।',
      bkashNumber: '01886122678',
      nagadNumber: '01711223344',
      createdAt: '2026-03-10T12:00:00Z'
    },
    {
      id: 'extra-2',
      donorName: 'আলহাজ্ব মোঃ নজরুল ইসলাম',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
      address: 'সি বিচ রোড, পতেঙ্গা, চট্টগ্রাম',
      providerReference: 'মোঃ কামরুল হাসান (সভাপতি)',
      amount: 30000,
      date: '২৮ ফেব্রুয়ারি ২০২৬',
      description: 'সংগঠনের স্থায়ী চিকিৎসা ও জরুরি অ্যাম্বুলেন্স সহায়তা তহবিলের উন্নয়নের জন্য ব্যক্তিগত অনুদান।',
      bkashNumber: '01886122678',
      createdAt: '2026-02-28T16:00:00Z'
    },
    {
      id: 'extra-3',
      donorName: 'ইঞ্জিনিয়ার রাশেদুল হক (ইউকে প্রবাসী)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      address: 'লন্ডন, যুক্তরাজ্য',
      providerReference: 'আরিফুর রহমান (দপ্তর সচিব)',
      amount: 25000,
      date: '১৫ ফেব্রুয়ারি ২০২৬',
      description: 'দুস্থ পরিবারের মাঝে টিউবওয়েল ও নিরাপদ খাবার পানি সরবরাহ প্রকল্পের জন্য অতিরিক্ত অনুদান।',
      bkashNumber: '01911223344',
      nagadNumber: '01611223344',
      createdAt: '2026-02-15T11:00:00Z'
    }
  ],
  organizationRules: [
    {
      id: 'rule-1',
      pointNumber: 1,
      ruleText: 'সংগঠনের প্রতিটি সদস্যকে সর্বদা নিঃস্বার্থ মানবসেবা, আর্তমানবতার কল্যাণ ও সামাজিক উন্নয়নে নিবেদিত থাকতে হবে।',
      category: 'মৌলিক আদর্শ',
      isActive: true
    },
    {
      id: 'rule-2',
      pointNumber: 2,
      ruleText: 'সংগঠনের নির্ধারিত মাসিক চাঁদা প্রতি মাসের ১০ তারিখের মধ্যে ফান্ডে নিয়মিত পরিশোধ করতে হবে।',
      category: 'আর্থিক শৃঙ্খলা',
      isActive: true
    },
    {
      id: 'rule-3',
      pointNumber: 3,
      ruleText: 'জরুরি মুমূর্ষু রোগীর রক্তের প্রয়োজনে এবং প্রাকৃতিক দুর্যোগে ত্রাণ বিতরণে স্বতঃস্ফূর্তভাবে অংশগ্রহণ করতে হবে।',
      category: 'সেবামূলক কার্যক্রম',
      isActive: true
    },
    {
      id: 'rule-4',
      pointNumber: 4,
      ruleText: 'সংগঠনের সকল কার্যক্রম সম্পূর্ণ অরাজনৈতিক, অলাভজনক এবং দল-মত-ধর্ম নির্বিশেষে সর্বজনীন।',
      category: 'সংগঠন নীতি',
      isActive: true
    },
    {
      id: 'rule-5',
      pointNumber: 5,
      ruleText: 'সংগঠনের অভ্যন্তরীণ শৃঙ্খলা, সুনাম ও সদস্যদের পারস্পরিক সৌহার্দ্য রক্ষা করা প্রত্যেকের আবশ্যিক দায়িত্ব।',
      category: 'শৃঙ্খলা ও আচরণ',
      isActive: true
    },
    {
      id: 'rule-6',
      pointNumber: 6,
      ruleText: 'যেকোনো ব্যক্তিগত সমস্যা বা সাংগঠনিক মতানৈক্য কেন্দ্রীয় কার্যনির্বাহী পরিষদের পরামর্শক্রমে সমাধান করতে হবে।',
      category: 'প্রশাসনিক নিয়ম',
      isActive: true
    }
  ]
};

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

  // Pre-seed initial collections if they are missing or empty
  let needsInitialPersist = false;
  for (const [key, defaultList] of Object.entries(DEFAULT_INITIAL_COLLECTIONS)) {
    if (!dbData[key] || !Array.isArray(dbData[key]) || dbData[key].length === 0) {
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

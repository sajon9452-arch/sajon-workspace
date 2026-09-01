import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// No-cache middleware for API routes to guarantee fresh updates for non-technical users
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Clean and safe working directory resolution
const rootDir = process.cwd();
const DATA_DIR = path.join(rootDir, 'server_data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SUPABASE_CONFIG_FILE = path.join(DATA_DIR, 'supabase.json');

interface AppDatabase {
  profile: {
    name: string;
    tagline: string;
    establishedDate?: string;
    establishedYear?: string;
    address: string;
    hotline?: string;
    emergencyContact?: string;
    regNumber?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  members: any[];
  donors: any[];
  notices: any[];
  funds: any[];
  manualTotalBalance: number | null;
  paymentConfig: {
    bkashNumber: string;
    bkashType: string;
    bkashInstructions?: string;
    nagadNumber: string;
    nagadType: string;
    nagadInstructions?: string;
    rocketNumber: string;
    rocketType: string;
    rocketInstructions?: string;
  };
  supportReports: any[];
  adminPin: string;
  updatedAt: string;
}

const DEFAULT_DB: AppDatabase = {
  profile: {
    name: 'সিলেট মানব সেবা সংগঠন',
    tagline: 'মানবতার কল্যাণে নিবেদিত প্রাণ',
    establishedDate: '১৫/০৮/২০২২ইং',
    establishedYear: '২০২২',
    address: 'পতেঙ্গা, চট্টগ্রাম',
    hotline: '',
    emergencyContact: '',
    regNumber: '২০২২/০৮',
    phone: '',
    email: '',
    logoUrl: ''
  },
  members: [],
  donors: [],
  notices: [],
  funds: [],
  manualTotalBalance: null,
  paymentConfig: {
    bkashNumber: '01886122678',
    bkashType: 'Personal',
    bkashInstructions: 'আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে Send Money করুন। রেফারেন্সে আপনার নাম বা মেম্বার আইডি লিখুন এবং সফল ট্রানজেকশনের TrxID নিচে সাবমিট করুন।',
    nagadNumber: '01886122678',
    nagadType: 'Personal',
    nagadInstructions: 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন। সফল পেমেন্টের পর TrxID টি নিচের বক্সে লিখে সাবমিট করুন।',
    rocketNumber: '',
    rocketType: 'Personal',
    rocketInstructions: 'রকেট একাউন্ট থেকে Send Money করার পর ফিরতি এসএমএসের TrxID নিচে যুক্ত করে সাবমিট করুন।'
  },
  supportReports: [
    {
      id: 'sup-1',
      name: 'মো: আব্দুল্লাহ আল মামুন',
      designation: 'সাধারণ সম্পাদক ও প্রধান হেল্পডেস্ক সমন্বয়ক',
      subject: 'সংগঠনের সদস্যপদ ও সার্বিক তথ্য সহায়তা',
      phone: '01886122678',
      description: 'সিলেট মানব সেবা সংগঠনের যেকোনো কার্যক্রম, নতুন সদস্য যোগদান বা জরুরি প্রয়োজনে সার্বক্ষণিক যোগাযোগ করতে পারেন।',
      type: 'সহায়তা',
      status: 'active',
      createdAt: '2026-08-15'
    },
    {
      id: 'sup-2',
      name: 'ইঞ্জি: তারেক মাহমুদ',
      designation: 'রক্তদান ও জরুরি সেবা সমন্বয়ক',
      subject: 'জরুরি রক্ত অনুসন্ধান ও ডোনার সমন্বয়',
      phone: '01711000000',
      description: 'চট্টগ্রাম ও সিলেট এলাকায় যেকোনো গ্রুপের জরুরি রক্তের প্রয়োজনে এবং রক্তদাতা নিবন্ধনে সার্বক্ষণিক যোগাযোগ ও সহায়তা প্রদান করা হয়।',
      type: 'রক্তদান বিষয়ক',
      status: 'active',
      createdAt: '2026-08-16'
    },
    {
      id: 'sup-3',
      name: 'ডা: নাজমুল হাসান',
      designation: 'স্বাস্থ্য ও চিকিৎসা ফান্ড উপদেষ্টা',
      subject: 'জরুরি চিকিৎসা সহায়তা ও ফান্ড আবেদন',
      phone: '01912345678',
      description: 'দরিদ্র ও অসহায় রোগীদের চিকিৎসা ফান্ড আবেদন এবং স্বাস্থ্য সংক্রান্ত যেকোনো পরামর্শের জন্য সরাসরি কথা বলতে পারেন।',
      type: 'সহায়তা',
      status: 'active',
      createdAt: '2026-08-20'
    }
  ],
  adminPin: '1234',
  updatedAt: new Date().toISOString()
};

function readLocalDatabase(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...DEFAULT_DB, ...parsed };
  } catch (error) {
    console.error('Error reading local server database:', error);
    return DEFAULT_DB;
  }
}

function writeLocalDatabase(data: Partial<AppDatabase>): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readLocalDatabase();
    const updated: AppDatabase = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    };
    // Safe atomic write
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return updated;
  } catch (error) {
    console.error('Error writing local server database:', error);
    return readLocalDatabase();
  }
}

// ----------------------------------------------------
// SUPABASE CLOUD DATABASE INTEGRATION ENGINE
// ----------------------------------------------------

let cachedSupabaseClient: SupabaseClient | null = null;
let cachedSupabaseUrl = '';
let cachedSupabaseKey = '';

function getSupabaseConfig(): { url: string; key: string } | null {
  const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const envKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl.trim() && envKey.trim()) {
    return { url: envUrl.trim(), key: envKey.trim() };
  }

  if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8'));
      if (fileData.url && fileData.key) {
        return { url: String(fileData.url).trim(), key: String(fileData.key).trim() };
      }
    } catch (e) {
      console.warn('Could not read supabase.json config:', e);
    }
  }

  return null;
}

function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.key) {
    cachedSupabaseClient = null;
    return null;
  }

  if (
    !cachedSupabaseClient ||
    cachedSupabaseUrl !== config.url ||
    cachedSupabaseKey !== config.key
  ) {
    try {
      cachedSupabaseClient = createClient(config.url, config.key, {
        auth: { persistSession: false }
      });
      cachedSupabaseUrl = config.url;
      cachedSupabaseKey = config.key;
      console.log('[Supabase] Client initialized for:', config.url);
    } catch (e) {
      console.error('[Supabase] Client initialization error:', e);
      cachedSupabaseClient = null;
    }
  }

  return cachedSupabaseClient;
}

/**
 * Helper to check if a Supabase error is due to table not existing yet
 */
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('not find the table') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('relation')
  );
}

/**
 * Reads state from Supabase organization_data table and merges into local DB
 */
async function syncFromSupabase(): Promise<AppDatabase | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('organization_data')
      .select('key, value, updated_at');

    if (error) {
      if (isTableMissingError(error)) {
        // Table hasn't been created in Supabase yet; gracefully use local storage
        return null;
      }
      console.log('[Supabase] Fetch info:', error.message);
      return null;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const current = readLocalDatabase();
      const merged: any = { ...current };
      for (const row of data) {
        if (row.key && row.value !== undefined) {
          merged[row.key] = row.value;
        }
      }
      merged.updatedAt = new Date().toISOString();
      const updated = writeLocalDatabase(merged);
      console.log(`[Supabase] Pulled ${data.length} keys from Supabase cloud database!`);
      return updated;
    }
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.log('[Supabase] Sync notice:', err?.message || err);
    }
  }
  return null;
}

/**
 * Upserts a single key-value pair to Supabase
 */
async function syncKeyToSupabase(key: string, value: any): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('organization_data').upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'key' }
    );

    if (error) {
      if (isTableMissingError(error)) {
        // Table not created yet in Supabase project
        return false;
      }
      console.log(`[Supabase] Upsert notice for key "${key}":`, error.message);
      return false;
    }
    console.log(`[Supabase] Successfully saved key "${key}" to Supabase!`);
    return true;
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.log(`[Supabase] Error syncing key "${key}":`, err?.message || err);
    }
    return false;
  }
}

/**
 * Upserts all database keys to Supabase
 */
async function syncAllToSupabase(db: AppDatabase): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, count: 0, error: 'Supabase not configured' };

  try {
    const keys = [
      'profile',
      'members',
      'donors',
      'notices',
      'funds',
      'manualTotalBalance',
      'paymentConfig',
      'supportReports',
      'adminPin'
    ];

    const rows = keys.map((k) => ({
      key: k,
      value: (db as any)[k] !== undefined ? (db as any)[k] : null,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('organization_data').upsert(rows, { onConflict: 'key' });

    if (error) {
      if (isTableMissingError(error)) {
        return {
          success: false,
          count: 0,
          error: 'Supabase-এ "organization_data" টেবিলটি এখনো তৈরি করা হয়নি। এডমিন প্যানেল থেকে SQL স্ক্রিপ্ট রান করুন।'
        };
      }
      return { success: false, count: 0, error: error.message };
    }

    console.log(`[Supabase] Uploaded ${rows.length} keys to Supabase cloud!`);
    return { success: true, count: rows.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

/**
 * Tests connection to Supabase and checks if organization_data table exists
 */
async function testSupabaseConnection(url?: string, key?: string): Promise<{
  connected: boolean;
  tableExists: boolean;
  message: string;
  count?: number;
}> {
  let client: SupabaseClient | null = null;
  if (url && key) {
    try {
      client = createClient(url.trim(), key.trim(), { auth: { persistSession: false } });
    } catch (e: any) {
      return {
        connected: false,
        tableExists: false,
        message: `সুপাবেজ ইউআরএল বা কী সঠিক নয়: ${e.message}`
      };
    }
  } else {
    client = getSupabaseClient();
  }

  if (!client) {
    return {
      connected: false,
      tableExists: false,
      message: 'সুপাবেজ (Supabase) ইউআরএল এবং আনন কী প্রদান করা হয়নি।'
    };
  }

  try {
    const { data, error } = await client.from('organization_data').select('key').limit(10);
    if (error) {
      if (isTableMissingError(error)) {
        return {
          connected: true,
          tableExists: false,
          message:
            'সুপাবেজে সফলভাবে কানেক্ট হয়েছে! তবে "organization_data" টেবিলটি এখনো তৈরি করা হয়নি। নিচে দেওয়া SQL স্ক্রিপ্টটি কপি করে Supabase SQL Editor এ রান (Run) করলেই তৈরি হয়ে যাবে।'
        };
      }
      return {
        connected: false,
        tableExists: false,
        message: `Supabase ত্রুটি (${error.code || 'ERROR'}): ${error.message}`
      };
    }

    return {
      connected: true,
      tableExists: true,
      count: data ? data.length : 0,
      message: `সুপাবেজ ক্লাউড ডাটাবেজ সফলভাবে সংযুক্ত ও সম্পূর্ণ প্রস্তুত! মোট ${data ? data.length : 0}টি সেভ করা কি-ডাটা ক্লাউডে বিদ্যমান রয়েছে।`
    };
  } catch (e: any) {
    return {
      connected: false,
      tableExists: false,
      message: `কানেকশন ব্যর্থ হয়েছে: ${e.message}`
    };
  }
}

// Background initial pull on server boot
syncFromSupabase().catch(() => {});

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  const config = getSupabaseConfig();
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    supabaseConfigured: Boolean(config && config.url && config.key)
  });
});

// GET full synchronized database state (pulls fresh from Supabase if configured)
app.get('/api/data', async (req, res) => {
  try {
    // Attempt real-time sync from Supabase if configured
    const cloudDb = await syncFromSupabase();
    const db = cloudDb || readLocalDatabase();
    res.json({ success: true, data: db, source: cloudDb ? 'supabase' : 'local' });
  } catch (e: any) {
    const db = readLocalDatabase();
    res.json({ success: true, data: db, source: 'local_fallback', error: e.message });
  }
});

// POST full or partial synchronized database update
app.post('/api/data', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }
    const updated = writeLocalDatabase(payload);
    
    // Sync to Supabase in background
    syncAllToSupabase(updated).catch((err) => {
      console.warn('Supabase async push failed:', err);
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST key-specific sync update
app.post('/api/data/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const allowedKeys = [
      'profile',
      'members',
      'donors',
      'notices',
      'funds',
      'manualTotalBalance',
      'paymentConfig',
      'supportReports',
      'adminPin'
    ];

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ success: false, error: `Invalid key: ${key}` });
    }

    const updated = writeLocalDatabase({ [key]: value });

    // Sync specific key to Supabase
    syncKeyToSupabase(key, value).catch((err) => {
      console.warn(`Supabase key push for ${key} failed:`, err);
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ----------------------------------------------------
// SUPABASE MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// Get Supabase status and test connection
app.get('/api/supabase/status', async (req, res) => {
  try {
    const config = getSupabaseConfig();
    if (!config) {
      return res.json({
        isConfigured: false,
        url: '',
        connected: false,
        tableExists: false,
        message: 'সুপাবেজ ক্লাউড কনফিগারেশন এখনো যুক্ত করা হয়নি।'
      });
    }

    const test = await testSupabaseConnection(config.url, config.key);
    res.json({
      isConfigured: true,
      url: config.url,
      connected: test.connected,
      tableExists: test.tableExists,
      count: test.count,
      message: test.message
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Save or Update Supabase configuration from Admin Panel
app.post('/api/supabase/config', async (req, res) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ success: false, error: 'URL এবং Key উভয় ফিল্ড আবশ্যক।' });
    }

    const cleanUrl = String(url).trim();
    const cleanKey = String(key).trim();

    // Test credentials first
    const test = await testSupabaseConnection(cleanUrl, cleanKey);
    if (!test.connected && test.message.includes('সঠিক নয়')) {
      return res.status(400).json({
        success: false,
        error: test.message,
        test
      });
    }

    // Save to config file
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      SUPABASE_CONFIG_FILE,
      JSON.stringify({ url: cleanUrl, key: cleanKey, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );

    // Reset cached client
    cachedSupabaseClient = null;
    cachedSupabaseUrl = '';
    cachedSupabaseKey = '';

    // If table exists, push all current database data to Supabase immediately
    let syncResult = null;
    if (test.tableExists) {
      const currentDb = readLocalDatabase();
      syncResult = await syncAllToSupabase(currentDb);
    }

    res.json({
      success: true,
      test,
      synced: syncResult,
      message: test.tableExists
        ? 'সুপাবেজ ক্লাউড ডাটাবেজ সফলভাবে সংরক্ষিত এবং সম্পূর্ণ ডেটা সিঙ্ক করা হয়েছে!'
        : test.message
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Force Sync local data to Supabase
app.post('/api/supabase/sync-to-cloud', async (req, res) => {
  try {
    const currentDb = readLocalDatabase();
    const result = await syncAllToSupabase(currentDb);
    res.json({
      success: result.success,
      count: result.count,
      error: result.error,
      message: result.success
        ? `সফলভাবে ${result.count}টি ডেটা ক্যাটাগরি Supabase ক্লাউডে আপলোড ও সেভ করা হয়েছে!`
        : `ক্লাউড সিঙ্ক ব্যর্থ হয়েছে: ${result.error}`
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Force Sync cloud data from Supabase to local database
app.post('/api/supabase/sync-from-cloud', async (req, res) => {
  try {
    const updated = await syncFromSupabase();
    if (updated) {
      res.json({
        success: true,
        data: updated,
        message: 'সুপাবেজ ক্লাউড থেকে সর্বশেষ সকল তথ্য সফলভাবে অ্যাপে রিয়েল-টাইমে ফেচ করা হয়েছে!'
      });
    } else {
      res.json({
        success: false,
        message: 'সুপাবেজ থেকে ডেটা ফেচ করা যায়নি। অনুগ্রহ করে টেবিল ও কানেকশন চেক করুন।'
      });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Reset database
app.post('/api/data-action/reset', (req, res) => {
  try {
    const updated = writeLocalDatabase(DEFAULT_DB);
    syncAllToSupabase(DEFAULT_DB).catch(() => {});
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Clear lists to empty
app.post('/api/data-action/clear', (req, res) => {
  try {
    const current = readLocalDatabase();
    const updated = writeLocalDatabase({
      ...current,
      members: [],
      donors: [],
      notices: [],
      funds: [],
      manualTotalBalance: null
    });
    syncAllToSupabase(updated).catch(() => {});
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');

    // Service worker must always be fresh
    app.get('/sw.js', (req, res, next) => {
      const swFile = path.join(distPath, 'sw.js');
      if (fs.existsSync(swFile)) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(swFile);
      }
      next();
    });

    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath && (filePath.endsWith('index.html') || filePath.endsWith('sw.js'))) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        }
      })
    );

    app.get('*', (req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(indexFile);
      }
      res
        .status(200)
        .send(
          '<!DOCTYPE html><html><head><title>সিলেট মানব সেবা সংগঠন</title></head><body><div id="root"></div></body></html>'
        );
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] সিলেট মানব সেবা সংগঠন server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

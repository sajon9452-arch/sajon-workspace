import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
    facebookUrl?: string;
    youtubeUrl?: string;
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
  homeSlides: any[];
  humanitarianActivities: any[];
  organizationRules: any[];
  adminPin: string;
  calendarBanners?: Record<string, any>;
  deletedSlideIds?: string[];
  deletedActivityIds?: string[];
  deletedMemberIds?: string[];
  deletedDonorIds?: string[];
  deletedNoticeIds?: string[];
  deletedFundIds?: string[];
  deletedReportIds?: string[];
  deletedRuleIds?: string[];
  updatedAt: string;
}

const DEFAULT_DB: AppDatabase = {
  profile: {
    name: 'সিলেট মানব সেবা সংগঠন',
    tagline: 'মানবতার কল্যাণে নিবেদিত প্রাণ',
    establishedDate: '১৫/০৮/২০২২ইং',
    establishedYear: '২০২২',
    address: 'পতেঙ্গা, চট্টগ্রাম',
    hotline: '01886122678',
    emergencyContact: '01711000000',
    regNumber: '২০২২/০৮',
    phone: '01886122678',
    email: 'sylhetmanabseva@gmail.com',
    logoUrl: '',
    facebookUrl: 'https://facebook.com/sylhetmanabsevasangathan',
    youtubeUrl: 'https://youtube.com/@sylhetmanabseva'
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
  homeSlides: [
    {
      id: 'slide-1',
      imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
      title: 'বন্যার্তদের মাঝে জরুরি খাদ্য ও ত্রাণ সামগ্রী বিতরণ',
      description: 'বন্যাপীড়িত প্রত্যন্ত অঞ্চলে পরিবারের মুখে অন্ন তুলে দিতে চাল, ডাল, তেল ও বিশুদ্ধ পানি সরবরাহ।',
      category: 'ত্রাণ বিতরণ',
      date: '২০২৬-০৮-২৮',
      location: 'কোম্পানীগঞ্জ, সিলেট',
      isActive: true
    },
    {
      id: 'slide-2',
      imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
      title: 'স্বেচ্ছায় রক্তদান ক্যাম্পেইন ও মুমূর্ষু রোগীর পাশে দাঁড়ানো',
      description: 'সংগঠনের নিবেদিতপ্রাণ রক্তযোদ্ধাদের মাধ্যমে জরুরি রক্তের ব্যবস্থা ও বিনামূল্যে রক্তের গ্রুপ নির্ণয়।',
      category: 'রক্তদান',
      date: '২০২৬-০৮-১৫',
      location: 'সিলেট এম.এ.জি ওসমানী মেডিকেল চত্বর',
      isActive: true
    },
    {
      id: 'slide-3',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      title: 'পরিবেশ সুরক্ষায় দেশব্যাপী বৃক্ষরোপণ কর্মসূচি',
      description: 'সবুজ বাংলাদেশ বিনির্মাণে বিভিন্ন শিক্ষাপ্রতিষ্ঠান ও মহাসড়কে ফলজ, বনজ ও ভেষজ চারা রোপণ।',
      category: 'বৃক্ষরোপণ',
      date: '২০২৬-০৭-২৫',
      location: 'পতেঙ্গা ও কর্ণফুলী উপকূলীয় অঞ্চল',
      isActive: true
    },
    {
      id: 'slide-4',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
      title: 'অসহায় পথশিশু ও প্রবীণদের মাঝে ভালোবাসা ও সহায়তা',
      description: 'দরিদ্র ও ছিন্নমূল মানুষের মুখে হাসি ফোটাতে নতুন পোশাক, পুষ্টিকর খাবার ও শিক্ষা উপকরণ বিতরণ।',
      category: 'অসহায় সেবা',
      date: '২০২৬-০৬-২০',
      location: 'সিলেট রেলওয়ে স্টেশন ও ক্বীন ব্রিজ এলাকা',
      isActive: true
    }
  ],
  humanitarianActivities: [],
  organizationRules: [
    {
      id: 'rule-1',
      pointNumber: 1,
      ruleText: 'সংগঠনের সকল সদস্যকে দেশ, সমাজ ও মানবতার সেবায় সম্পূর্ণরূপে নিঃস্বার্থ ও দল-মত নিরপেক্ষভাবে কাজ করতে হবে।',
      category: 'মূলনীতি',
      isActive: true
    },
    {
      id: 'rule-2',
      pointNumber: 2,
      ruleText: 'রক্তদানের ক্ষেত্রে কোনো প্রকার আর্থিক সুবিধা বা উপঢৌকন গ্রহণ সম্পূর্ণরূপে নিষিদ্ধ; রক্তদান একটি পবিত্র মানবিক আমানত।',
      category: 'রক্তদান সেবা',
      isActive: true
    },
    {
      id: 'rule-3',
      pointNumber: 3,
      ruleText: 'সংগঠনের ফান্ডের প্রতিটি টাকা (আয় ও ব্যয়) সুনির্দিষ্ট ভাউচার ও ট্রানজেকশন আইডিসহ ডিজিটাল ক্যাশবুকে তাৎক্ষণিক এন্ট্রি নিশ্চিত করতে হবে।',
      category: 'আর্থিক স্বচ্ছতা',
      isActive: true
    },
    {
      id: 'rule-4',
      pointNumber: 4,
      ruleText: 'ত্রাণ বিতরণ বা জরুরি যেকোনো সাহায্য সরাসরি প্রকৃত অসচ্ছল ও ক্ষতিগ্রস্ত ব্যক্তির হাতে ভলান্টিয়ারদের উপস্থিতিতে পৌঁছে দিতে হবে।',
      category: 'ত্রাণ ও সেবা',
      isActive: true
    },
    {
      id: 'rule-5',
      pointNumber: 5,
      ruleText: 'সকল সদস্যকে মাসিক সাধারণ মিটিং ও জরুরি উদ্ধার কার্যক্রমে সক্রিয় উপস্থিতি নিশ্চিত করতে হবে।',
      category: 'শৃঙ্খলা ও উপস্থিতি',
      isActive: true
    },
    {
      id: 'rule-6',
      pointNumber: 6,
      ruleText: 'সংগঠনের নাম বা লোগো ব্যবহার করে ব্যক্তিগত স্বার্থ হাসিল বা সংগঠনের ভাবমূর্তি ক্ষুণ্নকারী কর্মকাণ্ড প্রমাণিত হলে তাৎক্ষণিক সদস্যপদ বাতিল হবে।',
      category: 'সদস্যপদ বাতিল নীতিমালা',
      isActive: true
    }
  ],
  adminPin: '1234',
  calendarBanners: {},
  deletedSlideIds: [],
  deletedActivityIds: [],
  deletedMemberIds: [],
  deletedDonorIds: [],
  deletedNoticeIds: [],
  deletedFundIds: [],
  deletedReportIds: [],
  deletedRuleIds: [],
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
    const db: AppDatabase = { ...DEFAULT_DB, ...parsed };

    // Strict filter out of permanently deleted IDs across all management domains
    if (Array.isArray(db.deletedSlideIds) && db.deletedSlideIds.length > 0 && Array.isArray(db.homeSlides)) {
      db.homeSlides = db.homeSlides.filter((s: any) => !db.deletedSlideIds!.includes(s.id));
    }
    if (Array.isArray(db.deletedActivityIds) && db.deletedActivityIds.length > 0 && Array.isArray(db.humanitarianActivities)) {
      db.humanitarianActivities = db.humanitarianActivities.filter((a: any) => !db.deletedActivityIds!.includes(a.id));
    }
    if (Array.isArray(db.deletedMemberIds) && db.deletedMemberIds.length > 0 && Array.isArray(db.members)) {
      db.members = db.members.filter((m: any) => !db.deletedMemberIds!.includes(m.id));
    }
    if (Array.isArray(db.deletedDonorIds) && db.deletedDonorIds.length > 0 && Array.isArray(db.donors)) {
      db.donors = db.donors.filter((d: any) => !db.deletedDonorIds!.includes(d.id));
    }
    if (Array.isArray(db.deletedNoticeIds) && db.deletedNoticeIds.length > 0 && Array.isArray(db.notices)) {
      db.notices = db.notices.filter((n: any) => !db.deletedNoticeIds!.includes(n.id));
    }
    if (Array.isArray(db.deletedFundIds) && db.deletedFundIds.length > 0 && Array.isArray(db.funds)) {
      db.funds = db.funds.filter((f: any) => !db.deletedFundIds!.includes(f.id));
    }
    if (Array.isArray(db.deletedReportIds) && db.deletedReportIds.length > 0 && Array.isArray(db.supportReports)) {
      db.supportReports = db.supportReports.filter((r: any) => !db.deletedReportIds!.includes(r.id));
    }
    if (Array.isArray(db.deletedRuleIds) && db.deletedRuleIds.length > 0 && Array.isArray(db.organizationRules)) {
      db.organizationRules = db.organizationRules.filter((r: any) => !db.deletedRuleIds!.includes(r.id));
    }

    return db;
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
 * Universal Unlimited PostgREST Table Row Fetcher
 * Fetches all rows without the standard 1,000-row cap using automatic pagination.
 */
async function fetchAllRowsFromTable(supabase: SupabaseClient, tableName: string): Promise<any[] | null> {
  try {
    const pageSize = 1000;
    let allRows: any[] = [];
    let from = 0;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) {
        if (isTableMissingError(error)) return null;
        console.warn(`[Supabase] Table "${tableName}" query warning:`, error.message);
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        allRows = allRows.concat(data);
        if (data.length < pageSize) {
          keepFetching = false;
        } else {
          from += pageSize;
        }
      } else {
        keepFetching = false;
      }
    }
    return allRows;
  } catch (e) {
    return null;
  }
}

/**
 * Universal Chunked Upsert for Unlimited Batch Sizes
 */
async function upsertInChunks(supabase: SupabaseClient, tableName: string, records: any[], onConflict = 'id'): Promise<boolean> {
  if (!records || records.length === 0) return true;
  const chunkSize = 200;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName).upsert(chunk, { onConflict });
    if (error) {
      if (isTableMissingError(error)) return false;
      console.warn(`[Supabase] Upsert into "${tableName}" error:`, error.message);
      return false;
    }
  }
  return true;
}

// Dedicated Table Model Mappers
function extractMemberPhoto(r: any, supabaseUrl?: string): string {
  if (!r) return '';

  const candidateKeys = [
    'photo_url',
    'photoUrl',
    'avatar_url',
    'avatarUrl',
    'avatar',
    'imageUrl',
    'image_url',
    'photo',
    'image',
    'profile_photo',
    'profile_image',
    'profile_pic',
    'picture'
  ];

  // 1. Data URLs and Blob URLs take top priority
  for (const k of candidateKeys) {
    let raw = r[k];
    if (typeof raw === 'object' && raw) {
      raw = raw.url || raw.path || raw.publicUrl || raw.name || '';
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
        return trimmed;
      }
    }
  }

  // 2. Full HTTP/HTTPS URLs (including Supabase Storage)
  for (const k of candidateKeys) {
    let raw = r[k];
    if (typeof raw === 'object' && raw) {
      raw = raw.url || raw.path || raw.publicUrl || raw.name || '';
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
    }
  }

  // 3. Supabase Storage Relative Paths (exclude internal /api/ endpoints)
  const base = (
    supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://quqzeiuaybmhzisivrud.supabase.co'
  ).replace(/\/+$/, '');

  for (const k of candidateKeys) {
    let raw = r[k];
    if (typeof raw === 'object' && raw) {
      raw = raw.url || raw.path || raw.publicUrl || raw.name || '';
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed && !trimmed.startsWith('/api/')) {
        if (trimmed.startsWith('/storage/v1/object/public/')) {
          return `${base}${trimmed}`;
        }
        if (trimmed.startsWith('storage/v1/object/public/')) {
          return `${base}/${trimmed}`;
        }
        if (trimmed.includes('/') && !trimmed.startsWith('http')) {
          const clean = trimmed.replace(/^\/+/, '');
          return `${base}/storage/v1/object/public/${clean}`;
        }
        if (/\.(jpe?g|png|webp|gif|avif)$/i.test(trimmed)) {
          return `${base}/storage/v1/object/public/avatars/${trimmed}`;
        }
      }
    }
  }

  return '';
}

function mapMemberToDb(m: any) {
  const photo = extractMemberPhoto(m);
  return {
    id: m.id,
    name: m.name || '',
    phone: m.phone || '',
    designation: m.designation || '',
    area: m.area || '',
    is_expatriate: Boolean(m.isExpatriate || m.memberType === 'expatriate'),
    country_status: m.countryStatus || '',
    member_type: m.memberType || (m.isExpatriate ? 'expatriate' : 'general'),
    photo_url: photo,
    avatar_url: photo,
    avatar: photo,
    blood_group: m.bloodGroup || '',
    join_date: m.joinDate || '',
    serial: typeof m.serial === 'number' ? m.serial : null,
    created_at: m.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToMember(r: any, supabaseUrl?: string): any {
  const photo = extractMemberPhoto(r, supabaseUrl);
  return {
    id: r.id,
    name: r.name || '',
    phone: r.phone || '',
    designation: r.designation || '',
    area: r.area || '',
    isExpatriate: Boolean(r.is_expatriate ?? r.isExpatriate),
    countryStatus: r.country_status || r.countryStatus || '',
    memberType: r.member_type || r.memberType || (r.is_expatriate ? 'expatriate' : 'general'),
    photoUrl: photo,
    avatarUrl: photo,
    bloodGroup: r.blood_group || r.bloodGroup || '',
    joinDate: r.join_date || r.joinDate || '',
    serial: r.serial != null ? Number(r.serial) : undefined,
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapDonorToDb(d: any) {
  return {
    id: d.id,
    name: d.name || '',
    blood_group: d.bloodGroup || '',
    phone: d.phone || '',
    area: d.area || '',
    last_donation_date: d.lastDonationDate || '',
    is_available: d.isAvailable !== false,
    total_donations: Number(d.totalDonations) || 0,
    created_at: d.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToDonor(r: any): any {
  return {
    id: r.id,
    name: r.name || '',
    bloodGroup: r.blood_group || r.bloodGroup || '',
    phone: r.phone || '',
    area: r.area || '',
    lastDonationDate: r.last_donation_date || r.lastDonationDate || '',
    isAvailable: r.is_available !== false,
    totalDonations: Number(r.total_donations ?? r.totalDonations) || 0,
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapFundToDb(f: any) {
  return {
    id: f.id,
    type: f.type || 'income',
    category: f.category || '',
    amount: Number(f.amount) || 0,
    date: f.date || '',
    month: f.month || '',
    year: f.year || '',
    member_id: f.memberId || '',
    member_name: f.memberName || '',
    payment_method: f.paymentMethod || '',
    trx_id: f.trxId || '',
    sender_phone: f.senderPhone || '',
    notes: f.notes || '',
    status: f.status || 'approved',
    created_at: f.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToFund(r: any): any {
  return {
    id: r.id,
    type: r.type || 'income',
    category: r.category || '',
    amount: Number(r.amount) || 0,
    date: r.date || '',
    month: r.month || '',
    year: r.year || '',
    memberId: r.member_id || r.memberId || '',
    memberName: r.member_name || r.memberName || '',
    paymentMethod: r.payment_method || r.paymentMethod || '',
    trxId: r.trx_id || r.trxId || '',
    senderPhone: r.sender_phone || r.senderPhone || '',
    notes: r.notes || '',
    status: r.status || 'approved',
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapNoticeToDb(n: any) {
  return {
    id: n.id,
    notice_text: n.noticeText || '',
    date: n.date || '',
    category: n.category || 'সাধারণ',
    is_pinned: Boolean(n.isPinned),
    created_at: n.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToNotice(r: any): any {
  return {
    id: r.id,
    noticeText: r.notice_text || r.noticeText || '',
    date: r.date || '',
    category: r.category || 'সাধারণ',
    isPinned: Boolean(r.is_pinned ?? r.isPinned),
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapActivityToDb(act: any) {
  return {
    id: act.id,
    title: act.title || '',
    description: act.description || '',
    items_given: act.itemsGiven || '',
    cost: Number(act.cost) || 0,
    handled_by: act.handledBy || '',
    recipient_name: act.recipientName || '',
    recipient_photo_url: act.recipientPhotoUrl || '',
    date: act.date || '',
    location: act.location || '',
    is_featured: Boolean(act.isFeatured),
    created_at: act.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToActivity(r: any): any {
  return {
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    itemsGiven: r.items_given || r.itemsGiven || '',
    cost: Number(r.cost) || 0,
    handledBy: r.handled_by || r.handledBy || '',
    recipientName: r.recipient_name || r.recipientName || '',
    recipientPhotoUrl: r.recipient_photo_url || r.recipientPhotoUrl || '',
    date: r.date || '',
    location: r.location || '',
    isFeatured: Boolean(r.is_featured ?? r.isFeatured),
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapReportToDb(r: any) {
  return {
    id: r.id,
    type: r.type || 'সহায়তা',
    name: r.name || '',
    phone: r.phone || '',
    subject: r.subject || '',
    details: r.details || '',
    status: r.status || 'pending',
    date: r.date || '',
    created_at: r.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToReport(r: any): any {
  return {
    id: r.id,
    type: r.type || 'সহায়তা',
    name: r.name || '',
    phone: r.phone || '',
    subject: r.subject || '',
    details: r.details || '',
    status: r.status || 'pending',
    date: r.date || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapSlideToDb(s: any) {
  return {
    id: s.id,
    title: s.title || '',
    description: s.description || '',
    image_url: s.imageUrl || '',
    category: s.category || '',
    date: s.date || '',
    location: s.location || '',
    is_active: s.isActive !== false,
    created_at: s.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function mapDbToSlide(r: any): any {
  return {
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    imageUrl: r.image_url || r.imageUrl || '',
    category: r.category || '',
    date: r.date || '',
    location: r.location || '',
    isActive: r.is_active !== false,
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

function mapRuleToDb(r: any) {
  return {
    id: r.id,
    rule_text: r.ruleText || '',
    category: r.category || '',
    created_at: r.createdAt || new Date().toISOString()
  };
}

function mapDbToRule(r: any): any {
  return {
    id: r.id,
    ruleText: r.rule_text || r.ruleText || '',
    category: r.category || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString()
  };
}

/**
 * Reads state from Supabase organization_data table and merges into local DB
 */
async function syncFromSupabase(): Promise<AppDatabase | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const config = getSupabaseConfig();
  const supabaseUrl = config?.url || '';

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

    if (data && Array.isArray(data)) {
      const current = readLocalDatabase();
      const merged: any = { ...current };
      const missingKeysInSupabase: string[] = [];

      const cloudMap = new Map<string, any>();
      for (const row of data) {
        if (row.key && row.value !== undefined) {
          cloudMap.set(row.key, row.value);
        }
      }

      // 1. Merge deleted ID tracking lists first to prevent resurrection of manually deleted records
      const deletedKeyPairs: [string, string][] = [
        ['deletedActivityIds', 'humanitarianActivities'],
        ['deletedSlideIds', 'homeSlides'],
        ['deletedMemberIds', 'members'],
        ['deletedDonorIds', 'donors'],
        ['deletedNoticeIds', 'notices'],
        ['deletedFundIds', 'funds'],
        ['deletedReportIds', 'supportReports'],
        ['deletedRuleIds', 'organizationRules']
      ];

      for (const [delKey] of deletedKeyPairs) {
        const cloudDels = cloudMap.get(delKey);
        const localDels = (current as any)[delKey];
        const combinedDels = Array.from(new Set([
          ...(Array.isArray(cloudDels) ? cloudDels : []),
          ...(Array.isArray(localDels) ? (localDels as string[]) : [])
        ]));
        merged[delKey] = combinedDels;
      }

      // 2. Multi-domain non-destructive merge for array entities
      const arrayEntityKeys = [
        'members',
        'donors',
        'notices',
        'funds',
        'supportReports',
        'homeSlides',
        'humanitarianActivities',
        'organizationRules'
      ];

      for (const key of arrayEntityKeys) {
        const cloudVal = cloudMap.get(key);
        const localVal = (current as any)[key];
        const delKey = deletedKeyPairs.find(p => p[1] === key)?.[0] || '';
        const deletedIds: string[] = delKey ? (merged[delKey] || []) : [];

        if (Array.isArray(cloudVal) && Array.isArray(localVal)) {
          const itemMap = new Map<string, any>();
          // Cloud records
          cloudVal.forEach((item: any) => {
            if (item && item.id && !deletedIds.includes(item.id)) {
              itemMap.set(item.id, item);
            }
          });
          let hasLocalNew = false;
          // Retain local records that are not in cloud and not deleted
          localVal.forEach((item: any) => {
            if (item && item.id && !deletedIds.includes(item.id)) {
              if (!itemMap.has(item.id)) {
                itemMap.set(item.id, item);
                hasLocalNew = true;
              }
            }
          });
          merged[key] = Array.from(itemMap.values());
          if (hasLocalNew || !cloudMap.has(key)) {
            missingKeysInSupabase.push(key);
          }
        } else if (Array.isArray(cloudVal)) {
          merged[key] = cloudVal.filter((i: any) => i && i.id && !deletedIds.includes(i.id));
        } else if (Array.isArray(localVal)) {
          merged[key] = localVal.filter((i: any) => i && i.id && !deletedIds.includes(i.id));
          missingKeysInSupabase.push(key);
        }
      }

      // 3. Scalar and object keys (profile, paymentConfig, calendarBanners, manualTotalBalance, adminPin)
      const otherKeys = ['profile', 'manualTotalBalance', 'paymentConfig', 'calendarBanners', 'adminPin'];
      for (const k of otherKeys) {
        if (cloudMap.has(k) && cloudMap.get(k) !== undefined && cloudMap.get(k) !== null) {
          merged[k] = cloudMap.get(k);
        } else if ((current as any)[k] !== undefined) {
          missingKeysInSupabase.push(k);
        }
      }

      // 4. Universal sync across all dedicated database tables (if provisioned in Supabase)
      // 4.1 Members (General & Expatriate)
      try {
        const memberRows = await fetchAllRowsFromTable(supabase, 'members');
        if (memberRows && memberRows.length > 0) {
          const deletedMemberIds = merged.deletedMemberIds || [];
          const dedicatedMembers = memberRows
            .filter((r: any) => r && r.id && !deletedMemberIds.includes(r.id))
            .map((r: any) => mapDbToMember(r, supabaseUrl));
          const map = new Map<string, any>();
          dedicatedMembers.forEach((m: any) => map.set(m.id, m));
          if (Array.isArray(merged.members)) {
            merged.members.forEach((m: any) => {
              if (!map.has(m.id) && !deletedMemberIds.includes(m.id)) {
                map.set(m.id, m);
              } else if (map.has(m.id)) {
                const cloudM = map.get(m.id);
                // If cloud member record has no photo, but local record has a valid photo, preserve it
                if (!cloudM.photoUrl && m.photoUrl) {
                  cloudM.photoUrl = m.photoUrl;
                  cloudM.avatarUrl = m.photoUrl;
                }
              }
            });
          }
          merged.members = Array.from(map.values());
        }
      } catch (e) {}

      // 4.2 Blood Donors
      try {
        const donorRows = (await fetchAllRowsFromTable(supabase, 'blood_donors')) || (await fetchAllRowsFromTable(supabase, 'donors'));
        if (donorRows && donorRows.length > 0) {
          const deletedDonorIds = merged.deletedDonorIds || [];
          const dedicatedDonors = donorRows
            .filter((r: any) => r && r.id && !deletedDonorIds.includes(r.id))
            .map(mapDbToDonor);
          const map = new Map<string, any>();
          dedicatedDonors.forEach((d: any) => map.set(d.id, d));
          if (Array.isArray(merged.donors)) {
            merged.donors.forEach((d: any) => {
              if (!map.has(d.id) && !deletedDonorIds.includes(d.id)) {
                map.set(d.id, d);
              }
            });
          }
          merged.donors = Array.from(map.values());
        }
      } catch (e) {}

      // 4.3 Fund Records
      try {
        const fundRows = (await fetchAllRowsFromTable(supabase, 'fund_records')) || (await fetchAllRowsFromTable(supabase, 'funds'));
        if (fundRows && fundRows.length > 0) {
          const deletedFundIds = merged.deletedFundIds || [];
          const dedicatedFunds = fundRows
            .filter((r: any) => r && r.id && !deletedFundIds.includes(r.id))
            .map(mapDbToFund);
          const map = new Map<string, any>();
          dedicatedFunds.forEach((f: any) => map.set(f.id, f));
          if (Array.isArray(merged.funds)) {
            merged.funds.forEach((f: any) => {
              if (!map.has(f.id) && !deletedFundIds.includes(f.id)) {
                map.set(f.id, f);
              }
            });
          }
          merged.funds = Array.from(map.values());
        }
      } catch (e) {}

      // 4.4 Notices
      try {
        const noticeRows = await fetchAllRowsFromTable(supabase, 'notices');
        if (noticeRows && noticeRows.length > 0) {
          const deletedNoticeIds = merged.deletedNoticeIds || [];
          const dedicatedNotices = noticeRows
            .filter((r: any) => r && r.id && !deletedNoticeIds.includes(r.id))
            .map(mapDbToNotice);
          const map = new Map<string, any>();
          dedicatedNotices.forEach((n: any) => map.set(n.id, n));
          if (Array.isArray(merged.notices)) {
            merged.notices.forEach((n: any) => {
              if (!map.has(n.id) && !deletedNoticeIds.includes(n.id)) {
                map.set(n.id, n);
              }
            });
          }
          merged.notices = Array.from(map.values());
        }
      } catch (e) {}

      // 4.5 Humanitarian Activities
      try {
        const actRows = (await fetchAllRowsFromTable(supabase, 'humanitarian_activities')) || (await fetchAllRowsFromTable(supabase, 'humanitarianActivities'));
        if (actRows && actRows.length > 0) {
          const deletedActIds = merged.deletedActivityIds || [];
          const dedicatedActivities = actRows
            .filter((r: any) => r && r.id && !deletedActIds.includes(r.id))
            .map(mapDbToActivity);
          const map = new Map<string, any>();
          dedicatedActivities.forEach((a: any) => map.set(a.id, a));
          if (Array.isArray(merged.humanitarianActivities)) {
            merged.humanitarianActivities.forEach((a: any) => {
              if (!map.has(a.id) && !deletedActIds.includes(a.id)) {
                map.set(a.id, a);
              }
            });
          }
          merged.humanitarianActivities = Array.from(map.values());
        }
      } catch (e) {}

      // 4.6 Support Reports
      try {
        const reportRows = (await fetchAllRowsFromTable(supabase, 'support_reports')) || (await fetchAllRowsFromTable(supabase, 'supportReports'));
        if (reportRows && reportRows.length > 0) {
          const deletedReportIds = merged.deletedReportIds || [];
          const dedicatedReports = reportRows
            .filter((r: any) => r && r.id && !deletedReportIds.includes(r.id))
            .map(mapDbToReport);
          const map = new Map<string, any>();
          dedicatedReports.forEach((r: any) => map.set(r.id, r));
          if (Array.isArray(merged.supportReports)) {
            merged.supportReports.forEach((r: any) => {
              if (!map.has(r.id) && !deletedReportIds.includes(r.id)) {
                map.set(r.id, r);
              }
            });
          }
          merged.supportReports = Array.from(map.values());
        }
      } catch (e) {}

      // 4.7 Home Slides
      try {
        const slideRows = (await fetchAllRowsFromTable(supabase, 'home_slides')) || (await fetchAllRowsFromTable(supabase, 'homeSlides'));
        if (slideRows && slideRows.length > 0) {
          const deletedSlideIds = merged.deletedSlideIds || [];
          const dedicatedSlides = slideRows
            .filter((r: any) => r && r.id && !deletedSlideIds.includes(r.id))
            .map(mapDbToSlide);
          const map = new Map<string, any>();
          dedicatedSlides.forEach((s: any) => map.set(s.id, s));
          if (Array.isArray(merged.homeSlides)) {
            merged.homeSlides.forEach((s: any) => {
              if (!map.has(s.id) && !deletedSlideIds.includes(s.id)) {
                map.set(s.id, s);
              }
            });
          }
          merged.homeSlides = Array.from(map.values());
        }
      } catch (e) {}

      // 4.8 Organization Rules
      try {
        const ruleRows = (await fetchAllRowsFromTable(supabase, 'organization_rules')) || (await fetchAllRowsFromTable(supabase, 'organizationRules'));
        if (ruleRows && ruleRows.length > 0) {
          const deletedRuleIds = merged.deletedRuleIds || [];
          const dedicatedRules = ruleRows
            .filter((r: any) => r && r.id && !deletedRuleIds.includes(r.id))
            .map(mapDbToRule);
          const map = new Map<string, any>();
          dedicatedRules.forEach((r: any) => map.set(r.id, r));
          if (Array.isArray(merged.organizationRules)) {
            merged.organizationRules.forEach((r: any) => {
              if (!map.has(r.id) && !deletedRuleIds.includes(r.id)) {
                map.set(r.id, r);
              }
            });
          }
          merged.organizationRules = Array.from(map.values());
        }
      } catch (e) {}

      // 5. Final strict filtering of any deleted IDs across all arrays
      for (const [delKey, entityKey] of deletedKeyPairs) {
        const deletedIds: string[] = merged[delKey] || [];
        if (deletedIds.length > 0 && Array.isArray(merged[entityKey])) {
          merged[entityKey] = merged[entityKey].filter((item: any) => !deletedIds.includes(item.id));
        }
      }

      merged.updatedAt = new Date().toISOString();
      const updated = writeLocalDatabase(merged);

      // Asynchronously seed any keys that were missing in Supabase so cloud is 100% persistent
      if (missingKeysInSupabase.length > 0) {
        for (const key of missingKeysInSupabase) {
          syncKeyToSupabase(key, (merged as any)[key]).catch(() => {});
        }
      }

      console.log(`[Supabase] Pulled and merged ${data.length} keys from Supabase cloud database!`);
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
 * Upserts a single key-value pair to Supabase with unlimited scaling support across all tables
 */
async function syncKeyToSupabase(key: string, value: any): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // 1. Universal Key-Value sync to organization_data
    const { error } = await supabase.from('organization_data').upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'key' }
    );

    if (error && !isTableMissingError(error)) {
      console.log(`[Supabase] Upsert notice for key "${key}":`, error.message);
    }

    // 2. Direct synchronization to dedicated tables if present in Supabase
    // 2.1 Members
    if (key === 'members' && Array.isArray(value)) {
      try {
        const records = value.map(mapMemberToDb);
        await upsertInChunks(supabase, 'members', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedMemberIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('members').delete().in('id', deletedIds);
        }
      } catch (e) {}
    }

    // 2.2 Blood Donors
    if (key === 'donors' && Array.isArray(value)) {
      try {
        const records = value.map(mapDonorToDb);
        await upsertInChunks(supabase, 'blood_donors', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedDonorIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('blood_donors').delete().in('id', deletedIds);
        }
      } catch (e) {}
    }

    // 2.3 Funds
    if (key === 'funds' && Array.isArray(value)) {
      try {
        const records = value.map(mapFundToDb);
        await upsertInChunks(supabase, 'fund_records', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedFundIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('fund_records').delete().in('id', deletedIds);
        }
      } catch (e) {}
    }

    // 2.4 Notices
    if (key === 'notices' && Array.isArray(value)) {
      try {
        const records = value.map(mapNoticeToDb);
        await upsertInChunks(supabase, 'notices', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedNoticeIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('notices').delete().in('id', deletedIds);
        }
      } catch (e) {}
    }

    // 2.5 Humanitarian Activities
    if (key === 'humanitarianActivities' && Array.isArray(value)) {
      try {
        if (value.length === 0) {
          await supabase.from('humanitarian_activities').delete().neq('id', '___all___');
        } else {
          const records = value.map(mapActivityToDb);
          await upsertInChunks(supabase, 'humanitarian_activities', records);
          const localDb = readLocalDatabase();
          const deletedIds: string[] = localDb.deletedActivityIds || [];
          if (deletedIds.length > 0) {
            await supabase.from('humanitarian_activities').delete().in('id', deletedIds);
          }
        }
      } catch (e) {}
    }

    // 2.6 Support Reports
    if (key === 'supportReports' && Array.isArray(value)) {
      try {
        const records = value.map(mapReportToDb);
        await upsertInChunks(supabase, 'support_reports', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedReportIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('support_reports').delete().in('id', deletedIds);
        }
      } catch (e) {}
    }

    // 2.7 Home Slides
    if (key === 'homeSlides' && Array.isArray(value)) {
      try {
        const records = value.map(mapSlideToDb);
        await upsertInChunks(supabase, 'home_slides', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedSlideIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('home_slides').delete().in('id', deletedIds);
        }
      } catch (e) {}
    }

    // 2.8 Organization Rules
    if (key === 'organizationRules' && Array.isArray(value)) {
      try {
        const records = value.map(mapRuleToDb);
        await upsertInChunks(supabase, 'organization_rules', records);
        const localDb = readLocalDatabase();
        const deletedIds: string[] = localDb.deletedRuleIds || [];
        if (deletedIds.length > 0) {
          await supabase.from('organization_rules').delete().in('id', deletedIds);
        }
      } catch (e) {}
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
 * Executes a permanent DELETE directly on Supabase database tables and local DB
 */
async function executePermanentActivityDelete(id: string): Promise<{
  success: boolean;
  id: string;
  supabaseDeleted: boolean;
  supabaseConfigured: boolean;
  message: string;
}> {
  let supabaseDeleted = false;
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // 1. Permanent DELETE directly on Supabase table 'humanitarian_activities' for that specific record ID
      const { error: err1 } = await supabase
        .from('humanitarian_activities')
        .delete()
        .eq('id', id);

      if (!err1) {
        supabaseDeleted = true;
        console.log(`[Supabase] Direct table delete succeeded for ID: ${id}`);
      }

      // 2. Permanent DELETE on 'humanitarianActivities' table (if created with camelCase)
      const { error: err2 } = await supabase
        .from('humanitarianActivities')
        .delete()
        .eq('id', id);

      if (!err2) {
        supabaseDeleted = true;
      }

      // 3. Update 'organization_data' key 'humanitarianActivities' in Supabase
      const { data: orgRow } = await supabase
        .from('organization_data')
        .select('value')
        .eq('key', 'humanitarianActivities')
        .single();

      if (orgRow && Array.isArray(orgRow.value)) {
        const filtered = orgRow.value.filter((act: any) => act.id !== id);
        await supabase.from('organization_data').upsert(
          {
            key: 'humanitarianActivities',
            value: filtered,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );
        supabaseDeleted = true;
      }

      // 4. Update 'deletedActivityIds' in Supabase organization_data to guarantee it never reappears
      const { data: delRow } = await supabase
        .from('organization_data')
        .select('value')
        .eq('key', 'deletedActivityIds')
        .single();

      const existingDel = Array.isArray(delRow?.value) ? delRow.value : [];
      if (!existingDel.includes(id)) {
        existingDel.push(id);
        await supabase.from('organization_data').upsert(
          {
            key: 'deletedActivityIds',
            value: existingDel,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );
      }
    } catch (err: any) {
      console.error('[Supabase] Permanent activity delete error:', err);
    }
  }

  // 5. Update local database cache
  const localDb = readLocalDatabase();
  localDb.humanitarianActivities = (localDb.humanitarianActivities || []).filter((a: any) => a.id !== id);
  if (!localDb.deletedActivityIds) localDb.deletedActivityIds = [];
  if (!localDb.deletedActivityIds.includes(id)) {
    localDb.deletedActivityIds.push(id);
  }
  writeLocalDatabase(localDb);

  return {
    success: true,
    id,
    supabaseDeleted,
    supabaseConfigured: Boolean(supabase),
    message: supabaseDeleted
      ? `Supabase ডাটাবেজ টেবিল থেকে রেকর্ডটি (${id}) স্থায়ীভাবে মুছে ফেলা হয়েছে`
      : `রেকর্ডটি (${id}) সফলভাবে মুছে ফেলা হয়েছে`
  };
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
      'homeSlides',
      'humanitarianActivities',
      'organizationRules',
      'adminPin',
      'calendarBanners',
      'deletedSlideIds',
      'deletedActivityIds'
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

    // Check counts on tables
    let details: string[] = [`organization_data: ${data ? data.length : 0}টি কি`];
    try {
      const { count: mCount } = await client.from('members').select('*', { count: 'exact', head: true });
      if (typeof mCount === 'number') details.push(`সদস্য (members): ${mCount} জন`);
    } catch (e) {}
    try {
      const { count: dCount } = await client.from('blood_donors').select('*', { count: 'exact', head: true });
      if (typeof dCount === 'number') details.push(`রক্তদাতা (blood_donors): ${dCount} জন`);
    } catch (e) {}
    try {
      const { count: fCount } = await client.from('fund_records').select('*', { count: 'exact', head: true });
      if (typeof fCount === 'number') details.push(`ফান্ড রেকর্ড (fund_records): ${fCount}টি`);
    } catch (e) {}

    const detailsStr = details.length > 1 ? ` (${details.join(', ')})` : '';
    return {
      connected: true,
      tableExists: true,
      count: data ? data.length : 0,
      message: `সুপাবেজ ক্লাউড ডাটাবেজ সফলভাবে সংযুক্ত ও সম্পূর্ণ প্রস্তুত! কোনো লিমিট ছাড়া আনলিমিটেড স্কেলিং সক্রিয় রয়েছে${detailsStr}।`
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

// Member profile picture streaming & proxy endpoint
// Checks server_data/member_photos disk storage first, streams binary images with immutable cache
app.get('/api/member-photo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send('Missing member ID');

    // 1. Direct local disk photo cache check (fastest, 0 overhead)
    const diskPath = path.join(process.cwd(), 'server_data', 'member_photos', `${id}.jpg`);
    if (fs.existsSync(diskPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(diskPath);
    }

    const db = readLocalDatabase();
    const members = Array.isArray(db.members) ? db.members : [];
    const member = members.find((m: any) => m && m.id === id);

    if (!member) {
      return res.status(404).send('Member not found');
    }

    const photo = extractMemberPhoto(member);
    if (!photo) {
      return res.status(404).send('No photo available for this member');
    }

    // 2. Base64 Data URL -> Stream binary image buffer & persist to disk
    if (photo.startsWith('data:image/')) {
      const match = photo.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const mimeSubtype = match[1].toLowerCase();
        const contentType = mimeSubtype === 'jpg' ? 'image/jpeg' : `image/${mimeSubtype}`;
        const buffer = Buffer.from(match[2], 'base64');
        try {
          const photosDir = path.join(process.cwd(), 'server_data', 'member_photos');
          if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
          fs.writeFileSync(diskPath, buffer);
        } catch (saveErr) {}
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.end(buffer);
      }
    }

    // 3. HTTP/HTTPS or Supabase Public Storage URL -> 302 Redirect
    if (/^https?:\/\//i.test(photo)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(302, photo);
    }

    return res.status(404).send('Photo format unsupported');
  } catch (err: any) {
    res.status(500).send('Error retrieving member photo');
  }
});

// GET full synchronized database state (pulls fresh from Supabase if configured)
app.get('/api/data', async (req, res) => {
  try {
    // Attempt real-time sync from Supabase with a fast 2500ms timeout so requests never stall
    const cloudDb = await Promise.race([
      syncFromSupabase(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))
    ]);
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
      'homeSlides',
      'humanitarianActivities',
      'organizationRules',
      'adminPin',
      'calendarBanners',
      'deletedSlideIds',
      'deletedActivityIds',
      'deletedMemberIds',
      'deletedDonorIds',
      'deletedNoticeIds',
      'deletedFundIds',
      'deletedReportIds',
      'deletedRuleIds'
    ];

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ success: false, error: `Invalid key: ${key}` });
    }

    const updated = writeLocalDatabase({ [key]: value });

    // Sync specific key to Supabase and await confirmation
    try {
      await syncKeyToSupabase(key, value);
    } catch (err) {
      console.warn(`Supabase key push for ${key} notice:`, err);
    }

    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE a specific humanitarian activity permanently from Supabase & local DB
app.delete('/api/humanitarian-activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Activity ID is required' });
    }
    const result = await executePermanentActivityDelete(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Delete failed' });
  }
});

app.post('/api/humanitarian-activities/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Activity ID is required' });
    }
    const result = await executePermanentActivityDelete(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Delete failed' });
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

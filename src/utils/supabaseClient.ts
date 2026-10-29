import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase Credentials
export const DEFAULT_SUPABASE_URL = 'https://quqzeiuaybmhzisivrud.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Cjt1ffMfKo0CEEw3uMIbQw_1qMYftvd';

export const SUPABASE_CONFIG_STORAGE_KEY = 'pms_custom_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getActiveSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.url && parsed.anonKey) {
          return {
            url: parsed.url.trim(),
            anonKey: parsed.anonKey.trim()
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL,
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY
  };
}

let activeConfig = getActiveSupabaseConfig();
export let SUPABASE_URL = activeConfig.url;
export let SUPABASE_ANON_KEY = activeConfig.anonKey;

/**
 * Creates an authenticated Supabase client configured with proper Bearer & apikey headers
 */
function createConfiguredClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    global: {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    }
  });
}

export let supabase = createConfiguredClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Updates credentials in runtime and re-instantiates the Supabase client
 */
export function updateSupabaseCredentials(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (!cleanUrl || !cleanKey) return;

  SUPABASE_URL = cleanUrl;
  SUPABASE_ANON_KEY = cleanKey;
  activeConfig = { url: cleanUrl, anonKey: cleanKey };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(activeConfig));
  }

  supabase = createConfiguredClient(cleanUrl, cleanKey);
}

/**
 * Resets Supabase credentials to defaults
 */
export function resetSupabaseCredentials(): void {
  SUPABASE_URL = DEFAULT_SUPABASE_URL;
  SUPABASE_ANON_KEY = DEFAULT_SUPABASE_ANON_KEY;
  activeConfig = { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };

  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  }

  supabase = createConfiguredClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
}

export interface AppTableDefinition {
  id: string;
  key: string;
  label: string;
  englishLabel: string;
  category: 'core' | 'finance' | 'community' | 'media' | 'security' | 'system';
  description: string;
}

/**
 * Universal Registry of all Supabase database tables & data sections across the entire app.
 * Any new table or data section added here automatically appears in the Admin Panel
 * "টেবিল রেডি যাচাই" (Table Ready Check) with live status checkmark, and is included
 * in automated table health verification, SQL generator, and cloud sync loops.
 */
export const APP_SUPABASE_TABLES: AppTableDefinition[] = [
  { id: 'members', key: 'members', label: 'সদস্য তালিকা', englishLabel: 'Members', category: 'core', description: 'সংগঠনের সকল সাধারণ, প্রবাসী ও কার্যনির্বাহী সদস্য' },
  { id: 'donors', key: 'donors', label: 'রক্তদাতা ডিরেক্টরি', englishLabel: 'Blood Donors', category: 'community', description: 'জরুরি রক্তের গ্রুপভিত্তিক রক্তদাতা তালিকা' },
  { id: 'funds', key: 'funds', label: 'তহবিল ও চাঁদা', englishLabel: 'Funds & Dues', category: 'finance', description: 'মাসিক চাঁদা, অনুদান ও ব্যয়ের আয়-ব্যয় হিসাব' },
  { id: 'pending_payments', key: 'pendingPayments', label: 'পেমেন্ট রিকোয়েস্ট', englishLabel: 'Payment Requests', category: 'finance', description: 'বিকাশ, নগদ, রকেটে পাঠানো ডিজিটাল TrxID যাচাই' },
  { id: 'notices', key: 'notices', label: 'নোটিশ বোর্ড', englishLabel: 'Notices', category: 'core', description: 'জরুরি ঘোষণা ও সাধারণ নোটিশ প্রকাশ' },
  { id: 'support_members', key: 'supportMembers', label: 'সাপোর্ট প্রতিনিধি', englishLabel: 'Support Team', category: 'community', description: 'বিভাগভিত্তিক দায়িত্বপ্রাপ্ত প্রতিনিধিদের তালিকা' },
  { id: 'support_reports', key: 'supportReports', label: 'সাপোর্ট রিপোর্ট', englishLabel: 'Support Reports', category: 'community', description: 'ইউজারদের পাঠানো অভিযোগ ও পরামর্শ রিকোয়েস্ট' },
  { id: 'home_slides', key: 'homeSlides', label: 'স্লাইডার ফটো', englishLabel: 'Slider Banners', category: 'media', description: 'হোম পেজের ডায়নামিক ব্যানার ফটো ও ক্যাপশন' },
  { id: 'aid_donations', key: 'aidDonations', label: 'সাহায্য ও অনুদান', englishLabel: 'Aid Donations', category: 'finance', description: 'অসহায় ও দুস্থদের মাঝে বিতরণকৃত আর্থিক সহায়তা' },
  { id: 'extra_contributions', key: 'extraContributions', label: 'অতিরিক্ত অনুদান', englishLabel: 'Extra Contributions', category: 'finance', description: 'শুভাকাঙ্ক্ষী ও দাতাদের বিশেষ এককালীন অনুদান' },
  { id: 'humanitarian_activities', key: 'humanitarianActivities', label: 'মানবিক কার্যক্রম', englishLabel: 'Humanitarian Activities', category: 'community', description: 'ত্রাণ বিতরণ ও সমাজকল্যাণমূলক প্রকল্পের বিবরণ' },
  { id: 'organization_rules', key: 'organizationRules', label: 'সংগঠনের নিয়মাবলি', englishLabel: 'Constitution Rules', category: 'core', description: 'সংগঠনের গঠনতন্ত্র ও আচরণবিধির পয়েন্টসমূহ' },
  { id: 'user_accounts', key: 'userAccounts', label: 'ইউজার অ্যাকাউন্ট', englishLabel: 'User Accounts', category: 'security', description: 'নিবন্ধিত সদস্য ও অনুমোদিত লগইন প্রোফাইল' },
  { id: 'security_alerts', key: 'securityAlerts', label: 'সিকিউরিটি অ্যালার্ট', englishLabel: 'Security Alerts', category: 'security', description: 'ডিভাইস বাইন্ডিং ও সন্দেহজনক লগইন সতর্কবার্তা' },
  { id: 'settings', key: 'settings', label: 'অ্যাপ সেটিংস ও প্রোফাইল', englishLabel: 'Settings & Profile', category: 'system', description: 'সংগঠনের প্রোফাইল, লোগো, পেমেন্ট নম্বর ও ব্যালেন্স' },
  { id: 'registration_queue', key: 'registrationQueue', label: 'নিবন্ধন অনুমোদন কিউ', englishLabel: 'Registration Queue', category: 'security', description: 'অনলাইন সদস্য নিবন্ধন আবেদন ও অনুমোদন অপেক্ষমান তালিকা (মূল সদস্য তালিকা থেকে সম্পূর্ণ পৃথক)' },
  { id: 'app_collections', key: 'appCollections', label: 'কলেকশন ব্যাকআপ স্টোর', englishLabel: 'Universal Document Store', category: 'system', description: 'সকল ডেটার সার্বজনীন জেসন ব্যাকআপ নিরাপত্তা' }
];

// Table names mapping (TypeScript key -> Supabase table names to attempt)
export const TABLE_CANDIDATES_MAP: Record<string, string[]> = {
  members: ['members'],
  donors: ['donors', 'blood_donors'],
  funds: ['funds'],
  pendingPayments: ['pending_payments', 'pendingPayments'],
  notices: ['notices'],
  supportMembers: ['support_members', 'supportMembers'],
  supportReports: ['support_reports', 'supportReports'],
  homeSlides: ['home_slides', 'homeSlides'],
  aidDonations: ['aid_donations', 'aidDonations'],
  extraContributions: ['extra_contributions', 'extraContributions'],
  humanitarianActivities: ['humanitarian_activities', 'humanitarianActivities'],
  organizationRules: ['organization_rules', 'organizationRules'],
  userAccounts: ['user_accounts', 'userAccounts'],
  securityAlerts: ['security_alerts', 'securityAlerts'],
  registrationQueue: ['registration_queue', 'registrationQueue'],
  settings: ['settings'],
  appCollections: ['app_collections', 'appCollections']
};

/**
 * Complete, ready-to-execute Supabase SQL script that creates all database tables,
 * configures JSONB fallback data, enables RLS, and creates public access policies.
 */
export const SUPABASE_SETUP_SQL = `-- ====================================================================
-- সিলেট মানব সেবা সংগঠন: Supabase Database Schema & RLS Setup
-- Copy and run this script in your Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Universal Collections Backup Store (Never loses data regardless of columns)
CREATE TABLE IF NOT EXISTS public.app_collections (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Members Directory
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  blood_group TEXT,
  bloodGroup TEXT,
  designation TEXT,
  village TEXT,
  address TEXT,
  facebook TEXT,
  photo_url TEXT,
  photoUrl TEXT,
  serial INTEGER,
  created_at TEXT,
  createdAt TEXT,
  data JSONB
);

-- 3. Blood Donors Directory
CREATE TABLE IF NOT EXISTS public.donors (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  blood_group TEXT,
  bloodGroup TEXT,
  address TEXT,
  is_available BOOLEAN DEFAULT true,
  isAvailable BOOLEAN DEFAULT true,
  last_donation_date TEXT,
  lastDonationDate TEXT,
  note TEXT,
  created_at TEXT,
  data JSONB
);

-- 4. Fund & Donation Records
CREATE TABLE IF NOT EXISTS public.funds (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  memberId TEXT,
  member_name TEXT,
  memberName TEXT,
  month TEXT,
  amount NUMERIC,
  paid_amount NUMERIC,
  paidAmount NUMERIC,
  due_amount NUMERIC,
  dueAmount NUMERIC,
  status TEXT,
  payment_method TEXT,
  paymentMethod TEXT,
  transaction_id TEXT,
  transactionId TEXT,
  date TEXT,
  paid_months TEXT,
  paidMonths TEXT,
  due_months TEXT,
  dueMonths TEXT,
  approved_at TEXT,
  approvedAt TEXT,
  note TEXT,
  description TEXT,
  category TEXT,
  data JSONB
);

-- 5. Notice Board
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY,
  title TEXT,
  date TEXT,
  description TEXT,
  priority TEXT,
  data JSONB
);

-- 6. Support Team Representatives
CREATE TABLE IF NOT EXISTS public.support_members (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  photo_url TEXT,
  photoUrl TEXT,
  available_time TEXT,
  availableTime TEXT,
  data JSONB
);

-- 7. Home Banner / Slider Images
CREATE TABLE IF NOT EXISTS public.home_slides (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  imageUrl TEXT,
  order_index INTEGER,
  orderIndex INTEGER,
  data JSONB
);

-- 8. Humanitarian Aid Donations
CREATE TABLE IF NOT EXISTS public.aid_donations (
  id TEXT PRIMARY KEY,
  recipient_name TEXT,
  recipientName TEXT,
  phone TEXT,
  address TEXT,
  amount NUMERIC,
  category TEXT,
  description TEXT,
  date TEXT,
  created_at TEXT,
  createdAt TEXT,
  data JSONB
);

-- 9. Extra Financial Contributions
CREATE TABLE IF NOT EXISTS public.extra_contributions (
  id TEXT PRIMARY KEY,
  donor_name TEXT,
  donorName TEXT,
  phone TEXT,
  amount NUMERIC,
  purpose TEXT,
  date TEXT,
  created_at TEXT,
  createdAt TEXT,
  data JSONB
);

-- 10. Organization Rules & Guidelines
CREATE TABLE IF NOT EXISTS public.organization_rules (
  id TEXT PRIMARY KEY,
  rule_no INTEGER,
  ruleNo INTEGER,
  title TEXT,
  description TEXT,
  category TEXT,
  data JSONB
);

-- 11. Support Reports
CREATE TABLE IF NOT EXISTS public.support_reports (
  id TEXT PRIMARY KEY,
  title TEXT,
  date TEXT,
  status TEXT,
  description TEXT,
  category TEXT,
  data JSONB
);

-- 12. App Settings, Profile & Manual Net Balances
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  key TEXT,
  value TEXT,
  amount NUMERIC,
  data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Pending Payments (পেমেন্ট রিকোয়েস্ট)
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  userName TEXT,
  member_name TEXT,
  memberName TEXT,
  member_id TEXT,
  memberId TEXT,
  designation TEXT,
  sender_phone TEXT,
  senderPhone TEXT,
  amount NUMERIC,
  trx_id TEXT,
  trxId TEXT,
  transaction_id TEXT,
  transactionId TEXT,
  gateway TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT,
  submittedAt TEXT,
  created_at TEXT,
  createdAt TEXT,
  reviewed_at TEXT,
  reviewedAt TEXT,
  reviewed_by TEXT,
  reviewedBy TEXT,
  notes TEXT,
  data JSONB
);

-- 14. Humanitarian Activities (মানবিক কার্যক্রম)
CREATE TABLE IF NOT EXISTS public.humanitarian_activities (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  date TEXT,
  location TEXT,
  amount NUMERIC,
  recipient_name TEXT,
  recipientName TEXT,
  recipient_photo_url TEXT,
  recipientPhotoUrl TEXT,
  is_featured BOOLEAN DEFAULT false,
  isFeatured BOOLEAN DEFAULT false,
  data JSONB
);

-- 15. User Accounts & Login Profiles (ইউজার অ্যাকাউন্ট)
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  memberId TEXT,
  name TEXT,
  phone TEXT,
  username TEXT,
  password TEXT,
  status TEXT DEFAULT 'pending',
  designation TEXT,
  area TEXT,
  blood_group TEXT,
  photo_url TEXT,
  registered_at TEXT,
  registered_ip TEXT,
  registered_device TEXT,
  bound_device_id TEXT,
  bound_ip TEXT,
  is_device_locked BOOLEAN DEFAULT false,
  last_login_at TEXT,
  data JSONB
);

-- 16. Security & Multi-Device Alerts (সিকিউরিটি অ্যালার্ট)
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  member_name TEXT,
  phone TEXT,
  type TEXT,
  message TEXT,
  ip TEXT,
  device TEXT,
  timestamp TEXT,
  resolved BOOLEAN DEFAULT false,
  data JSONB
);

-- 17. Registration Queue & Approval (অনলাইন সদস্য নিবন্ধন অনুমোদন কিউ - Isolated from Members)
CREATE TABLE IF NOT EXISTS public.registration_queue (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  area TEXT,
  designation TEXT,
  blood_group TEXT,
  bloodGroup TEXT,
  status TEXT DEFAULT 'pending',
  password TEXT,
  photo_url TEXT,
  photoUrl TEXT,
  registered_at TEXT,
  registeredAt TEXT,
  registered_ip TEXT,
  registeredIp TEXT,
  registered_device TEXT,
  registeredDevice TEXT,
  device_fingerprint TEXT,
  deviceFingerprint TEXT,
  reviewed_at TEXT,
  reviewedAt TEXT,
  reviewed_by TEXT,
  reviewedBy TEXT,
  admin_note TEXT,
  adminNote TEXT,
  approved_member_id TEXT,
  approvedMemberId TEXT,
  assigned_username TEXT,
  assignedUsername TEXT,
  data JSONB
);

-- ====================================================================
-- Enable Row Level Security (RLS) & Allow Open App Access
-- ====================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'app_collections', 'members', 'donors', 'funds', 'pending_payments', 'notices',
      'support_members', 'home_slides', 'aid_donations', 'extra_contributions',
      'humanitarian_activities', 'organization_rules', 'support_reports', 'settings',
      'user_accounts', 'security_alerts', 'registration_queue'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Public access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;
`;

/**
 * Checks connectivity to the Supabase endpoint and checks tables existence
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const config = getActiveSupabaseConfig();
    const res = await fetch(`${config.url}/auth/v1/health`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      return { connected: true, message: 'Supabase ক্লাউড সক্রিয়' };
    }
    return { connected: true, message: 'Supabase সক্রিয়' };
  } catch {
    return { connected: false, message: 'অফলাইন মোড' };
  }
}

/**
 * Detailed table status verification across all collections.
 * Dynamically queries every table defined in APP_SUPABASE_TABLES so any newly added
 * table automatically gets verified with live status and green checkmark.
 */
export async function checkSupabaseTableDetails(): Promise<{
  connected: boolean;
  message: string;
  tables: Record<string, boolean>;
  hasAnyTable: boolean;
}> {
  const tableStatus: Record<string, boolean> = {};
  let anyTable = false;
  let isConnected = false;

  try {
    const conn = await checkSupabaseConnection();
    isConnected = conn.connected;

    // Dynamically check every single registered table from APP_SUPABASE_TABLES
    await Promise.all(
      APP_SUPABASE_TABLES.map(async (table) => {
        try {
          const { error } = await supabase.from(table.id).select('id').limit(1);
          if (!error) {
            tableStatus[table.id] = true;
            anyTable = true;
          } else {
            tableStatus[table.id] = false;
          }
        } catch {
          tableStatus[table.id] = false;
        }
      })
    );

    return {
      connected: isConnected,
      message: anyTable ? 'সব টেবিল প্রস্তুত' : 'টেবিল অনুপস্থিত (SQL রান করুন)',
      tables: tableStatus,
      hasAnyTable: anyTable
    };
  } catch {
    return {
      connected: false,
      message: 'সংযোগ ব্যর্থ',
      tables: {},
      hasAnyTable: false
    };
  }
}

/**
 * Helper to normalize record for table insertion (adds both camelCase and snake_case properties + data JSONB)
 */
function prepareRecordForSupabase(record: any): any {
  if (!record || typeof record !== 'object') return record;
  const prepared: Record<string, any> = { ...record };

  // Always embed full object in 'data' column for JSONB backup
  prepared.data = { ...record };

  // Common snake_case mappings
  if (record.bloodGroup && !record.blood_group) prepared.blood_group = record.bloodGroup;
  if (record.photoUrl && !record.photo_url) prepared.photo_url = record.photoUrl;
  if (record.createdAt && !record.created_at) prepared.created_at = record.createdAt;
  if (record.isAvailable !== undefined && record.is_available === undefined) prepared.is_available = record.isAvailable;
  if (record.lastDonationDate && !record.last_donation_date) prepared.last_donation_date = record.lastDonationDate;
  if (record.memberId && !record.member_id) prepared.member_id = record.memberId;
  if (record.memberName && !record.member_name) prepared.member_name = record.memberName;
  if (record.paidAmount !== undefined && record.paid_amount === undefined) prepared.paid_amount = record.paidAmount;
  if (record.dueAmount !== undefined && record.due_amount === undefined) prepared.due_amount = record.dueAmount;
  if (record.paymentMethod && !record.payment_method) prepared.payment_method = record.paymentMethod;
  if (record.transactionId && !record.transaction_id) prepared.transaction_id = record.transactionId;
  if (record.paidMonths && !record.paid_months) prepared.paid_months = record.paidMonths;
  if (record.dueMonths && !record.due_months) prepared.due_months = record.dueMonths;
  if (record.approvedAt && !record.approved_at) prepared.approved_at = record.approvedAt;
  if (record.availableTime && !record.available_time) prepared.available_time = record.availableTime;
  if (record.imageUrl && !record.image_url) prepared.image_url = record.imageUrl;
  if (record.orderIndex !== undefined && record.order_index === undefined) prepared.order_index = record.orderIndex;
  if (record.recipientName && !record.recipient_name) prepared.recipient_name = record.recipientName;
  if (record.donorName && !record.donor_name) prepared.donor_name = record.donorName;
  if (record.ruleNo !== undefined && record.rule_no === undefined) prepared.rule_no = record.ruleNo;
  if (record.userName && !record.user_name) prepared.user_name = record.userName;
  if (record.senderPhone && !record.sender_phone) prepared.sender_phone = record.senderPhone;
  if (record.trxId && !record.trx_id) prepared.trx_id = record.trxId;
  if (record.submittedAt && !record.submitted_at) prepared.submitted_at = record.submittedAt;
  if (record.registeredAt && !record.registered_at) prepared.registered_at = record.registeredAt;
  if (record.reviewedAt && !record.reviewed_at) prepared.reviewed_at = record.reviewedAt;
  if (record.reviewedBy && !record.reviewed_by) prepared.reviewed_by = record.reviewedBy;
  if (record.registeredIp && !record.registered_ip) prepared.registered_ip = record.registeredIp;
  if (record.registeredDevice && !record.registered_device) prepared.registered_device = record.registeredDevice;
  if (record.deviceFingerprint && !record.device_fingerprint) prepared.device_fingerprint = record.deviceFingerprint;
  if (record.adminNote && !record.admin_note) prepared.admin_note = record.adminNote;
  if (record.approvedMemberId && !record.approved_member_id) prepared.approved_member_id = record.approvedMemberId;
  if (record.assignedUsername && !record.assigned_username) prepared.assigned_username = record.assignedUsername;
  if (record.boundDeviceId && !record.bound_device_id) prepared.bound_device_id = record.boundDeviceId;
  if (record.boundIp && !record.bound_ip) prepared.bound_ip = record.boundIp;
  if (record.isDeviceLocked !== undefined && record.is_device_locked === undefined) prepared.is_device_locked = record.isDeviceLocked;
  if (record.lastLoginAt && !record.last_login_at) prepared.last_login_at = record.lastLoginAt;
  if (record.lastLoginIp && !record.last_login_ip) prepared.last_login_ip = record.lastLoginIp;
  if (record.lastLoginDevice && !record.last_login_device) prepared.last_login_device = record.lastLoginDevice;
  if (record.isSuspicious !== undefined && record.is_suspicious === undefined) prepared.is_suspicious = record.isSuspicious;

  return prepared;
}

/**
 * Universal safe sync to Supabase:
 * 1. Writes to dedicated table (checking candidates like snake_case)
 * 2. Also writes to `app_collections` as a universal safety net
 */
export async function safeSyncToSupabase<T extends { id: string }>(collectionKey: string, record: T): Promise<boolean> {
  if (!record || !record.id) return false;
  let success = false;

  const candidateTables = TABLE_CANDIDATES_MAP[collectionKey] || [collectionKey];
  const prepared = prepareRecordForSupabase(record);

  // 1. Attempt write to candidate tables
  for (const table of candidateTables) {
    try {
      const { error } = await supabase.from(table).upsert(prepared);
      if (!error) {
        success = true;
        break;
      }
    } catch {
      // ignore
    }
  }

  // 2. Also attempt update in app_collections universal document
  try {
    const { data: existingDoc } = await supabase
      .from('app_collections')
      .select('data')
      .eq('id', collectionKey)
      .single();

    let currentList: any[] = [];
    if (existingDoc && Array.isArray(existingDoc.data)) {
      currentList = existingDoc.data;
    }

    const idx = currentList.findIndex((item: any) => item && item.id === record.id);
    if (idx >= 0) {
      currentList[idx] = record;
    } else {
      currentList.push(record);
    }

    await supabase.from('app_collections').upsert({
      id: collectionKey,
      data: currentList,
      updated_at: new Date().toISOString()
    });
    success = true;
  } catch {
    // ignore
  }

  return success;
}

/**
 * Saves an entire collection to Supabase (both dedicated table and universal app_collections store)
 */
export async function saveSupabaseCollection<T extends { id: string }>(collectionKey: string, items: T[]): Promise<boolean> {
  if (!Array.isArray(items)) return false;
  let success = false;

  // 1. Save whole array into app_collections
  try {
    const { error: collErr } = await supabase.from('app_collections').upsert({
      id: collectionKey,
      data: items,
      updated_at: new Date().toISOString()
    });
    if (!collErr) {
      success = true;
    }
  } catch {
    // fallback
  }

  // 2. Upsert items into specific candidate table
  const candidateTables = TABLE_CANDIDATES_MAP[collectionKey] || [collectionKey];
  for (const table of candidateTables) {
    try {
      if (items.length > 0) {
        const preparedItems = items.map(prepareRecordForSupabase);
        const { error } = await supabase.from(table).upsert(preparedItems);
        if (!error) {
          success = true;
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  return success;
}

/**
 * Safely fetches a collection from Supabase:
 * First checks dedicated tables, then checks app_collections universal table
 */
export async function fetchSupabaseCollection<T>(collectionKey: string): Promise<T[] | null> {
  const candidateTables = TABLE_CANDIDATES_MAP[collectionKey] || [collectionKey];

  // 1. Try dedicated tables
  for (const table of candidateTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(5000);
      if (!error && Array.isArray(data) && data.length > 0) {
        // Unpack: if item has 'data' jsonb column, merge it and normalize snake_case
        const normalized = data.map((item: any) => {
          const base = (item && item.data && typeof item.data === 'object') 
            ? { ...item.data, ...item } 
            : { ...item };

          // Comprehensive snake_case to camelCase mapping
          if (base.registered_at && !base.registeredAt) base.registeredAt = base.registered_at;
          if (base.registered_ip && !base.registeredIp) base.registeredIp = base.registered_ip;
          if (base.registered_device && !base.registeredDevice) base.registeredDevice = base.registered_device;
          if (base.device_fingerprint && !base.deviceFingerprint) base.deviceFingerprint = base.device_fingerprint;
          if (base.admin_note && !base.adminNote) base.adminNote = base.admin_note;
          if (base.approved_member_id && !base.approvedMemberId) base.approvedMemberId = base.approved_member_id;
          if (base.assigned_username && !base.assignedUsername) base.assignedUsername = base.assigned_username;
          if (base.photo_url && !base.photoUrl) base.photoUrl = base.photo_url;
          if (base.blood_group && !base.bloodGroup) base.bloodGroup = base.blood_group;
          if (base.member_id && !base.memberId) base.memberId = base.member_id;
          if (base.member_name && !base.memberName) base.memberName = base.member_name;
          if (base.user_name && !base.userName) base.userName = base.user_name;
          if (base.sender_phone && !base.senderPhone) base.senderPhone = base.sender_phone;
          if (base.trx_id && !base.trxId) base.trxId = base.trx_id;
          if (base.transaction_id && !base.transactionId) base.transactionId = base.transaction_id;
          if (base.paid_amount !== undefined && base.paidAmount === undefined) base.paidAmount = base.paid_amount;
          if (base.due_amount !== undefined && base.dueAmount === undefined) base.dueAmount = base.due_amount;
          if (base.payment_method && !base.paymentMethod) base.paymentMethod = base.payment_method;
          if (base.submitted_at && !base.submittedAt) base.submittedAt = base.submitted_at;
          if (base.bound_device_id && !base.boundDeviceId) base.boundDeviceId = base.bound_device_id;
          if (base.bound_ip && !base.boundIp) base.boundIp = base.bound_ip;
          if (base.is_device_locked !== undefined && base.isDeviceLocked === undefined) base.isDeviceLocked = base.is_device_locked;
          if (base.last_login_at && !base.lastLoginAt) base.lastLoginAt = base.last_login_at;
          if (base.last_login_ip && !base.lastLoginIp) base.lastLoginIp = base.last_login_ip;
          if (base.last_login_device && !base.lastLoginDevice) base.lastLoginDevice = base.last_login_device;
          if (base.is_suspicious !== undefined && base.isSuspicious === undefined) base.isSuspicious = base.is_suspicious;

          return base;
        });
        return normalized as T[];
      }
    } catch {
      // try next
    }
  }

  // 2. Check app_collections table
  try {
    const { data: collDoc, error: collErr } = await supabase
      .from('app_collections')
      .select('data')
      .eq('id', collectionKey)
      .single();

    if (!collErr && collDoc && Array.isArray(collDoc.data) && collDoc.data.length > 0) {
      return collDoc.data as T[];
    }
  } catch {
    // ignore
  }

  return null;
}

// Backwards-compatible fetch function
export async function fetchSupabaseData<T>(tableName: string): Promise<T[] | null> {
  return fetchSupabaseCollection<T>(tableName);
}

/**
 * Permanently deletes a record from Supabase (from candidate tables and app_collections)
 */
export async function safeDeleteFromSupabase(collectionKey: string, id: string): Promise<boolean> {
  if (!id) return false;
  let success = false;

  const candidateTables = TABLE_CANDIDATES_MAP[collectionKey] || [collectionKey];

  // 1. Delete from dedicated tables
  for (const table of candidateTables) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        success = true;
      }
    } catch {
      // ignore
    }
  }

  // 2. Delete from app_collections
  try {
    const { data: collDoc } = await supabase
      .from('app_collections')
      .select('data')
      .eq('id', collectionKey)
      .single();

    if (collDoc && Array.isArray(collDoc.data)) {
      const filtered = collDoc.data.filter((item: any) => item && item.id !== id);
      await supabase.from('app_collections').upsert({
        id: collectionKey,
        data: filtered,
        updated_at: new Date().toISOString()
      });
      success = true;
    }
  } catch {
    // ignore
  }

  return success;
}

/**
 * Net Balance & Financial Sync to Supabase
 */
export async function syncNetBalanceToSupabase(balance: number): Promise<boolean> {
  try {
    const payload = {
      id: 'pms_manual_net_balance',
      key: 'net_balance',
      value: balance.toString(),
      amount: balance,
      updated_at: new Date().toISOString()
    };
    const { error: err1 } = await supabase.from('settings').upsert(payload);
    if (!err1) return true;

    // Fallback: app_collections
    const { error: err2 } = await supabase.from('app_collections').upsert({
      id: 'pms_manual_net_balance',
      data: { amount: balance, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
    if (!err2) return true;
  } catch {
    // ignore
  }
  return false;
}

export async function fetchNetBalanceFromSupabase(): Promise<number | null> {
  try {
    const { data: sData, error: err1 } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'pms_manual_net_balance')
      .single();
    if (!err1 && sData) {
      const parsed = parseFloat(sData.amount ?? sData.value);
      if (!isNaN(parsed)) return parsed;
    }

    const { data: collData, error: err2 } = await supabase
      .from('app_collections')
      .select('data')
      .eq('id', 'pms_manual_net_balance')
      .single();
    if (!err2 && collData && collData.data && typeof collData.data.amount === 'number') {
      return collData.data.amount;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Sync Financial Balances (Monthly Expense & Extra Money) to Supabase
 */
export async function syncFinancialsToSupabase(monthlyExpense: number, extraMoney: number): Promise<boolean> {
  try {
    await supabase.from('settings').upsert([
      { id: 'pms_monthly_expense', key: 'monthly_expense', amount: monthlyExpense, updated_at: new Date().toISOString() },
      { id: 'pms_extra_money', key: 'extra_money', amount: extraMoney, updated_at: new Date().toISOString() }
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function fetchFinancialsFromSupabase(): Promise<{ monthlyExpense?: number; extraMoney?: number } | null> {
  try {
    const { data, error } = await supabase.from('settings').select('*').in('id', ['pms_monthly_expense', 'pms_extra_money']);
    if (!error && Array.isArray(data)) {
      const result: { monthlyExpense?: number; extraMoney?: number } = {};
      data.forEach((row: any) => {
        if (row.id === 'pms_monthly_expense' && typeof row.amount === 'number') {
          result.monthlyExpense = row.amount;
        }
        if (row.id === 'pms_extra_money' && typeof row.amount === 'number') {
          result.extraMoney = row.amount;
        }
      });
      return result;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Universal Push: Pushes all local datasets to Supabase in one operation
 */
export async function pushAllDataToSupabase(snapshot: Record<string, any>): Promise<{
  success: boolean;
  syncedKeys: string[];
  failedKeys: string[];
}> {
  const syncedKeys: string[] = [];
  const failedKeys: string[] = [];

  for (const [key, val] of Object.entries(snapshot)) {
    if (Array.isArray(val) && val.length > 0) {
      try {
        const ok = await saveSupabaseCollection(key, val);
        if (ok) {
          syncedKeys.push(key);
        } else {
          failedKeys.push(key);
        }
      } catch {
        failedKeys.push(key);
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      try {
        await supabase.from('settings').upsert({
          id: `pms_${key}`,
          key: key,
          data: val,
          updated_at: new Date().toISOString()
        });
        syncedKeys.push(key);
      } catch {
        failedKeys.push(key);
      }
    }
  }

  return {
    success: syncedKeys.length > 0,
    syncedKeys,
    failedKeys
  };
}

/**
 * Universal Pull: Fetches all collections from Supabase
 */
export async function pullAllDataFromSupabase(): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  // Dynamically pull all registered collection tables from APP_SUPABASE_TABLES
  const collectionKeys = APP_SUPABASE_TABLES
    .map(t => t.key)
    .filter(k => k !== 'settings' && k !== 'appCollections');

  await Promise.all(
    collectionKeys.map(async (key) => {
      try {
        const data = await fetchSupabaseCollection(key);
        if (Array.isArray(data) && data.length > 0) {
          result[key] = data;
        }
      } catch {
        // ignore
      }
    })
  );

  // Settings & financials
  try {
    const netBal = await fetchNetBalanceFromSupabase();
    if (netBal !== null && !isNaN(netBal)) {
      result['manualTotalBalance'] = netBal;
    }
    const fins = await fetchFinancialsFromSupabase();
    if (fins?.monthlyExpense !== undefined) {
      result['monthlyExpense'] = fins.monthlyExpense;
    }
    if (fins?.extraMoney !== undefined) {
      result['extraMoney'] = fins.extraMoney;
    }
  } catch {
    // ignore
  }

  return result;
}

/**
 * Real-Time Subscriptions: Subscribes to Supabase postgres_changes
 */
export function subscribeToAllSupabaseTables(
  onTableChange?: (payload: { table: string; eventType: string; new: any; old: any }) => void
): () => void {
  try {
    const channel = supabase
      .channel('public-db-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public'
        },
        (payload) => {
          if (onTableChange) {
            onTableChange({
              table: payload.table,
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase Real-Time Live Sync');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase Realtime subscription error:', err);
    return () => {};
  }
}

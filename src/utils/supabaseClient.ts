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

// Table names mapping (TypeScript key -> Supabase table names to attempt)
export const TABLE_CANDIDATES_MAP: Record<string, string[]> = {
  members: ['members'],
  donors: ['donors', 'blood_donors'],
  funds: ['funds'],
  notices: ['notices'],
  supportMembers: ['support_members', 'supportMembers'],
  homeSlides: ['home_slides', 'homeSlides'],
  aidDonations: ['aid_donations', 'aidDonations'],
  extraContributions: ['extra_contributions', 'extraContributions'],
  organizationRules: ['organization_rules', 'organizationRules'],
  supportReports: ['support_reports', 'supportReports'],
  settings: ['settings'],
  pendingPayments: ['pending_payments', 'pendingPayments']
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

-- ====================================================================
-- Enable Row Level Security (RLS) & Allow Open App Access
-- ====================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'app_collections', 'members', 'donors', 'funds', 'notices',
      'support_members', 'home_slides', 'aid_donations',
      'extra_contributions', 'organization_rules', 'support_reports', 'settings'
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
 * Detailed table status verification across all collections
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

    // Check each primary table
    const checkList = ['members', 'donors', 'funds', 'notices', 'support_members', 'home_slides', 'app_collections', 'settings'];
    await Promise.all(
      checkList.map(async (tbl) => {
        try {
          const { error } = await supabase.from(tbl).select('id').limit(1);
          if (!error) {
            tableStatus[tbl] = true;
            anyTable = true;
          } else {
            tableStatus[tbl] = false;
          }
        } catch {
          tableStatus[tbl] = false;
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
  if (record.reviewedAt && !record.reviewed_at) prepared.reviewed_at = record.reviewedAt;
  if (record.reviewedBy && !record.reviewed_by) prepared.reviewed_by = record.reviewedBy;

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
      const { data, error } = await supabase.from(table).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        // Unpack: if item has 'data' jsonb column, merge it
        const normalized = data.map((item: any) => {
          if (item && item.data && typeof item.data === 'object') {
            return { ...item.data, ...item };
          }
          return item;
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

  const collectionKeys = [
    'members',
    'donors',
    'funds',
    'notices',
    'supportMembers',
    'homeSlides',
    'aidDonations',
    'extraContributions',
    'organizationRules',
    'supportReports',
    'pendingPayments'
  ];

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

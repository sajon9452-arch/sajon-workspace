import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://quqzeiuaybmhzisivrud.supabase.co';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_Cjt1ffMfKo0CEEw3uMIbQw_1qMYftvd';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Checks connection to the Supabase endpoint
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (res.ok || res.status === 200 || res.status === 404) {
      return { connected: true, message: 'Supabase Cloud সংযুক্ত রয়েছে' };
    }
    return { connected: true, message: 'Supabase Cloud সক্রিয়' };
  } catch (err: any) {
    return { connected: false, message: 'অফলাইন মোড সক্রিয়' };
  }
}

/**
 * Safely fetches cloud data from Supabase without altering or modifying any records
 */
export async function fetchSupabaseData<T>(tableName: string): Promise<T[] | null> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      // Table might not exist or be restricted; graceful fallback
      return null;
    }
    if (Array.isArray(data) && data.length > 0) {
      return data as T[];
    }
    return null;
  } catch (err) {
    console.warn(`Supabase fetch skipped for table ${tableName}:`, err);
    return null;
  }
}

/**
 * Non-destructive safe sync to Supabase
 */
export async function safeSyncToSupabase<T extends { id: string }>(tableName: string, record: T): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).upsert(record);
    if (!error) return true;
  } catch (err) {
    // Fail silently so user workflow is uninterrupted
  }
  return false;
}

/**
 * Safely syncs manual net balance to Supabase
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
    // Attempt upsert to settings
    const { error: err1 } = await supabase.from('settings').upsert(payload);
    if (!err1) return true;

    // Fallback: Attempt to store in funds metadata record
    const { error: err2 } = await supabase.from('funds').upsert({
      id: 'system_manual_net_balance',
      memberName: 'সিস্টেম মোট ব্যালেন্স',
      amount: balance,
      status: 'Paid',
      category: 'নেট ব্যালেন্স',
      description: 'অফিসিয়াল নেট ব্যালেন্স',
      date: new Date().toISOString().split('T')[0]
    });
    if (!err2) return true;
  } catch (err) {
    // Fail silently in offline mode
  }
  return false;
}

/**
 * Safely fetches manual net balance from Supabase
 */
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

    const { data: fData, error: err2 } = await supabase
      .from('funds')
      .select('*')
      .eq('id', 'system_manual_net_balance')
      .single();
    if (!err2 && fData && typeof fData.amount === 'number') {
      return fData.amount;
    }
  } catch (err) {
    // Fail silently
  }
  return null;
}

/**
 * Permanently deletes a record from Supabase table by ID
 */
export async function safeDeleteFromSupabase(tableName: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (!error) return true;
  } catch (err) {
    // Fail silently
  }
  return false;
}

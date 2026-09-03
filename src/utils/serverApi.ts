// Server API client for local container storage & Supabase Cloud sync
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  PaymentGatewayConfig,
  SupportReportItem,
  HomeSlide,
  HumanitarianActivity,
  OrganizationRule
} from '../types';

export interface ServerDatabasePayload {
  profile?: OrganizationProfile;
  members?: Member[];
  donors?: BloodDonor[];
  notices?: Notice[];
  funds?: FundRecord[];
  manualTotalBalance?: number | null;
  paymentConfig?: PaymentGatewayConfig;
  supportReports?: SupportReportItem[];
  homeSlides?: HomeSlide[];
  humanitarianActivities?: HumanitarianActivity[];
  organizationRules?: OrganizationRule[];
  adminPin?: string;
  updatedAt?: string;
}

export interface SupabaseStatusResponse {
  isConfigured: boolean;
  url?: string;
  connected: boolean;
  tableExists: boolean;
  count?: number;
  message: string;
}

/**
 * Fetch full persisted database state from Express backend / Supabase Cloud
 */
export async function fetchServerDatabase(): Promise<ServerDatabasePayload | null> {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/data?_t=${timestamp}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result && result.success && result.data) {
      return result.data as ServerDatabasePayload;
    }
    return null;
  } catch (error) {
    console.warn('[ServerApi] Local backend not reachable, using localStorage:', error);
    return null;
  }
}

/**
 * Push specific key update to server and Supabase in background
 */
export async function syncKeyToServer(
  key:
    | 'profile'
    | 'members'
    | 'donors'
    | 'notices'
    | 'funds'
    | 'manualTotalBalance'
    | 'paymentConfig'
    | 'supportReports'
    | 'homeSlides'
    | 'humanitarianActivities'
    | 'organizationRules'
    | 'adminPin',
  value: any
): Promise<boolean> {
  try {
    const response = await fetch(`/api/data/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return Boolean(result && result.success);
  } catch (error) {
    // Non-blocking catch for offline/client-only modes
    return false;
  }
}

/**
 * Fetch Supabase cloud database status and connectivity
 */
export async function fetchSupabaseStatus(): Promise<SupabaseStatusResponse> {
  try {
    const response = await fetch('/api/supabase/status', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      return await response.json();
    }
    return {
      isConfigured: false,
      connected: false,
      tableExists: false,
      message: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।'
    };
  } catch (e: any) {
    return {
      isConfigured: false,
      connected: false,
      tableExists: false,
      message: `সংযোগ ত্রুটি: ${e.message || e}`
    };
  }
}

/**
 * Save Supabase configuration URL & Key
 */
export async function saveSupabaseConfig(url: string, key: string): Promise<{
  success: boolean;
  message: string;
  test?: any;
}> {
  try {
    const response = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key })
    });
    const result = await response.json();
    return {
      success: Boolean(result.success),
      message: result.message || (result.success ? 'সফলভাবে সংরক্ষিত!' : 'সংরক্ষণ ব্যর্থ হয়েছে।'),
      test: result.test
    };
  } catch (e: any) {
    return {
      success: false,
      message: `রিকোয়েস্ট ত্রুটি: ${e.message || e}`
    };
  }
}

/**
 * Manually trigger complete sync from server database to Supabase cloud
 */
export async function syncAllToSupabaseCloud(): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const response = await fetch('/api/supabase/sync-to-cloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    return {
      success: Boolean(result.success),
      message: result.message || '',
      count: result.count
    };
  } catch (e: any) {
    return {
      success: false,
      message: `ক্লাউড সিঙ্ক ত্রুটি: ${e.message || e}`
    };
  }
}

/**
 * Manually trigger complete sync from Supabase cloud into app/server
 */
export async function syncAllFromSupabaseCloud(): Promise<{
  success: boolean;
  message: string;
  data?: ServerDatabasePayload;
}> {
  try {
    const response = await fetch('/api/supabase/sync-from-cloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    return {
      success: Boolean(result.success),
      message: result.message || '',
      data: result.data
    };
  } catch (e: any) {
    return {
      success: false,
      message: `ক্লাউড ফেচ ত্রুটি: ${e.message || e}`
    };
  }
}

/**
 * Reset server database to default
 */
export async function resetServerDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/data-action/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error resetting database:', e);
    return false;
  }
}

/**
 * Clear data collections on server
 */
export async function clearServerDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/data-action/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error clearing database:', e);
    return false;
  }
}

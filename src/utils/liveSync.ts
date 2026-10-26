import { PMS_SYNC_EVENT } from './storage';
import { 
  subscribeToAllSupabaseTables, 
  pullAllDataFromSupabase, 
  pushAllDataToSupabase 
} from './supabaseClient';

/**
 * Cache Bypass & AppCreator24 WebView Optimization
 * Generates URLs with dynamic timestamp and random tokens to defeat aggressive WebView caching.
 */
export function buildNoCacheUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const randomToken = Math.random().toString(36).substring(2, 9);
  return `${url}${separator}_t=${timestamp}&_nocache=${randomToken}`;
}

export const NO_CACHE_HEADERS: HeadersInit = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Safe fetch wrapper that automatically enforces cache bypass headers and query tokens.
 */
export async function fetchNoCache(url: string, options: RequestInit = {}): Promise<Response> {
  const finalUrl = buildNoCacheUrl(url);
  const finalHeaders = {
    ...NO_CACHE_HEADERS,
    ...(options.headers || {})
  };

  return fetch(finalUrl, {
    ...options,
    headers: finalHeaders,
    cache: 'no-store'
  });
}

// Complete Storage Key mapping for all app data
export const LIVE_SYNC_STORAGE_KEYS = {
  PROFILE: 'pms_org_profile',
  MEMBERS: 'pms_members_list',
  DONORS: 'pms_blood_donors',
  NOTICES: 'pms_notices',
  FUNDS: 'pms_fund_records',
  HOME_SLIDES: 'pms_home_slides',
  AID_DONATIONS: 'pms_aid_donations',
  EXTRA_CONTRIBUTIONS: 'pms_extra_contributions',
  ORGANIZATION_RULES: 'pms_organization_rules',
  SUPPORT_MEMBERS: 'pms_support_team_members',
  PAYMENT_SETTINGS: 'pms_payment_settings',
  MANUAL_TOTAL_BALANCE: 'pms_manual_total_balance',
  MONTHLY_EXPENSE: 'pms_monthly_expense',
  EXTRA_MONEY: 'pms_extra_money',
  USER_ACCOUNTS: 'pms_user_accounts_v2',
  REGISTRATION_QUEUE: 'pms_registration_queue',
  PERMANENTLY_DELETED: 'pms_permanently_deleted_records'
} as const;

// Key alias mapping between API payload keys and local storage keys
const KEY_TO_STORAGE_MAP: Record<string, string> = {
  profile: LIVE_SYNC_STORAGE_KEYS.PROFILE,
  members: LIVE_SYNC_STORAGE_KEYS.MEMBERS,
  donors: LIVE_SYNC_STORAGE_KEYS.DONORS,
  notices: LIVE_SYNC_STORAGE_KEYS.NOTICES,
  funds: LIVE_SYNC_STORAGE_KEYS.FUNDS,
  homeSlides: LIVE_SYNC_STORAGE_KEYS.HOME_SLIDES,
  aidDonations: LIVE_SYNC_STORAGE_KEYS.AID_DONATIONS,
  extraContributions: LIVE_SYNC_STORAGE_KEYS.EXTRA_CONTRIBUTIONS,
  organizationRules: LIVE_SYNC_STORAGE_KEYS.ORGANIZATION_RULES,
  supportMembers: LIVE_SYNC_STORAGE_KEYS.SUPPORT_MEMBERS,
  paymentConfig: LIVE_SYNC_STORAGE_KEYS.PAYMENT_SETTINGS,
  manualTotalBalance: LIVE_SYNC_STORAGE_KEYS.MANUAL_TOTAL_BALANCE,
  monthlyExpense: LIVE_SYNC_STORAGE_KEYS.MONTHLY_EXPENSE,
  extraMoney: LIVE_SYNC_STORAGE_KEYS.EXTRA_MONEY,
  userAccounts: LIVE_SYNC_STORAGE_KEYS.USER_ACCOUNTS,
  registrationQueue: LIVE_SYNC_STORAGE_KEYS.REGISTRATION_QUEUE,
  permanentlyDeleted: LIVE_SYNC_STORAGE_KEYS.PERMANENTLY_DELETED
};

const STORAGE_TO_KEY_MAP: Record<string, string> = Object.entries(KEY_TO_STORAGE_MAP).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }),
  {}
);

let currentLocalVersion = 0;
let isApplyingRemoteUpdate = false;
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPushKeys = new Set<string>();

/**
 * Reads permanently deleted IDs registry from storage to prevent reviving deleted items.
 */
function getDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(LIVE_SYNC_STORAGE_KEYS.PERMANENTLY_DELETED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Creates a clean JSON snapshot of all current local data.
 */
export function getLocalSyncSnapshot(): Record<string, any> {
  const snapshot: Record<string, any> = {};
  if (typeof window === 'undefined') return snapshot;

  for (const [apiKey, storageKey] of Object.entries(KEY_TO_STORAGE_MAP)) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        snapshot[apiKey] = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return snapshot;
}

/**
 * Applies remote synchronized data from server or Supabase into local storage and fires PMS_SYNC_EVENT.
 * Guarantees that a blank server or empty payload NEVER wipes populated user data.
 */
export function applyRemoteSyncSnapshot(remoteData: Record<string, any>, remoteVersion?: number) {
  if (!remoteData || typeof remoteData !== 'object' || typeof window === 'undefined') return;

  const deletedIds = new Set(getDeletedIds());
  let changed = false;
  isApplyingRemoteUpdate = true;

  try {
    for (const [apiKey, storageKey] of Object.entries(KEY_TO_STORAGE_MAP)) {
      if (remoteData[apiKey] !== undefined) {
        let valueToSave = remoteData[apiKey];
        const existingRaw = localStorage.getItem(storageKey);

        // Filter out permanently deleted IDs for array collections
        if (Array.isArray(valueToSave)) {
          valueToSave = valueToSave.filter((item: any) => {
            if (item && item.id && deletedIds.has(item.id)) return false;
            return true;
          });

          // Protection: If incoming remote array is empty, but local storage already has valid records,
          // NEVER overwrite populated local data with an empty array unless remote payload explicitly permits it.
          if (valueToSave.length === 0 && existingRaw) {
            try {
              const parsedExisting = JSON.parse(existingRaw);
              if (Array.isArray(parsedExisting)) {
                const nonDeletedExisting = parsedExisting.filter((item: any) => item && item.id && !deletedIds.has(item.id));
                if (nonDeletedExisting.length > 0 && !remoteData._allowEmpty) {
                  valueToSave = nonDeletedExisting;
                }
              }
            } catch {
              // ignore parse error
            }
          }
        }

        const serialized = JSON.stringify(valueToSave);

        if (existingRaw !== serialized) {
          localStorage.setItem(storageKey, serialized);
          changed = true;
        }
      }
    }

    if (typeof remoteVersion === 'number' && remoteVersion > currentLocalVersion) {
      currentLocalVersion = remoteVersion;
    }

    if (changed) {
      window.dispatchEvent(
        new CustomEvent(PMS_SYNC_EVENT, {
          detail: { isRemote: true, version: currentLocalVersion }
        })
      );
    }
  } finally {
    // Small timeout to prevent immediate bounce-back loop
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 120);
  }
}

/**
 * Explicitly notifies the backend server to permanently delete a record.
 * Data is only removed if the admin explicitly performs a manual delete action.
 */
export async function pushRecordDeletion(id: string, collection?: string): Promise<boolean> {
  if (!id || typeof window === 'undefined') return false;
  try {
    const res = await fetchNoCache('/api/sync/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, collection })
    });
    return res.ok;
  } catch (err) {
    console.warn('Record deletion push error:', err);
    return false;
  }
}

/**
 * Pushes live updates to the server to broadcast to all connected member devices.
 */
export function pushLiveUpdate(storageKeyOrApiKey?: string, data?: any) {
  if (typeof window === 'undefined' || isApplyingRemoteUpdate) return;

  let apiKey: string | undefined;
  if (storageKeyOrApiKey) {
    apiKey = STORAGE_TO_KEY_MAP[storageKeyOrApiKey] || storageKeyOrApiKey;
    pendingPushKeys.add(apiKey);
  }

  if (pushDebounceTimer) {
    clearTimeout(pushDebounceTimer);
  }

  pushDebounceTimer = setTimeout(async () => {
    try {
      let payload: Record<string, any> = {};

      if (pendingPushKeys.size === 1 && apiKey && data !== undefined) {
        payload = {
          key: apiKey,
          data: data
        };
      } else {
        payload = {
          data: getLocalSyncSnapshot()
        };
      }

      pendingPushKeys.clear();

      const res = await fetchNoCache('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.version && json.version > currentLocalVersion) {
          currentLocalVersion = json.version;
        }
      }
    } catch (err) {
      console.warn('Live sync push failed (offline or server starting):', err);
    }
  }, 120);
}

/**
 * Triggers a comprehensive full-cloud two-way sync:
 * 1. Pulls all fresh data from Supabase Cloud
 * 2. Merges with local and server data safely
 * 3. Pushes any unsaved local changes to Supabase and Server
 */
export async function triggerFullCloudSync(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Pull from Supabase
    const cloudData = await pullAllDataFromSupabase();
    let hasCloud = false;

    if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
      applyRemoteSyncSnapshot(cloudData);
      hasCloud = true;
    }

    // 2. Fetch from Server
    try {
      const res = await fetchNoCache('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          applyRemoteSyncSnapshot(json.data, json.version);
        }
      }
    } catch {
      // server offline
    }

    // 3. Push complete current snapshot to Supabase & Server
    const snapshot = getLocalSyncSnapshot();
    await pushAllDataToSupabase(snapshot);
    pushLiveUpdate();

    return {
      success: true,
      message: hasCloud ? 'Supabase ক্লাউড থেকে ডাটা সফলভাবে সিঙ্ক হয়েছে' : 'ক্লাউডে ডাটা সফলভাবে ব্যাকআপ হয়েছে'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'সিঙ্ক ব্যর্থ হয়েছে'
    };
  }
}

/**
 * Initializes Real-Time Data Synchronization:
 * 1. Immediate Supabase Cloud fetch
 * 2. Immediate Server fetch with No-Cache bypass
 * 3. Real-Time Push Stream via Server-Sent Events (SSE)
 * 4. High-frequency fallback polling for AppCreator24 WebView
 * 5. Automatic foreground sync on focus / visibility change
 */
export function initRealTimeDataSync(onSyncUpdate?: (data: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let eventSource: EventSource | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let isDestroyed = false;

  // 1. Initial Cloud Data Load from Supabase (Universal Source of Truth)
  const fetchCloudFirst = async () => {
    try {
      const cloudData = await pullAllDataFromSupabase();
      if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
        applyRemoteSyncSnapshot(cloudData);
        if (onSyncUpdate) onSyncUpdate(cloudData);
        // Also push cloud data to server storage so server is kept updated
        pushLiveUpdate();
      }
    } catch {
      // Supabase loading fallback
    }
  };

  // 2. Fetch latest server state immediately
  const fetchLatestState = async () => {
    if (isDestroyed) return;
    try {
      const res = await fetchNoCache('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          // Check if server is completely empty of records
          const hasServerRecords = Object.entries(json.data).some(
            ([k, v]) => k !== 'permanentlyDeleted' && Array.isArray(v) && v.length > 0
          );

          if (hasServerRecords) {
            if (!json.version || json.version > currentLocalVersion) {
              applyRemoteSyncSnapshot(json.data, json.version);
              if (onSyncUpdate) onSyncUpdate(json.data);
            }
          } else {
            // Server has no records, but local storage or Supabase might!
            // Seed server with our local data
            const snapshot = getLocalSyncSnapshot();
            const hasLocalRecords = Object.entries(snapshot).some(
              ([k, v]) => k !== 'permanentlyDeleted' && Array.isArray(v) && v.length > 0
            );
            if (hasLocalRecords) {
              pushLiveUpdate();
            }
          }
        }
      }
    } catch {
      // Offline fallback
    }
  };

  // 3. Connect to Server-Sent Events (SSE) stream for instant live push (<50ms)
  const connectSSE = () => {
    if (isDestroyed) return;
    try {
      if (eventSource) {
        eventSource.close();
      }

      const streamUrl = buildNoCacheUrl('/api/sync/stream');
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('sync', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.data) {
            if (!payload.version || payload.version > currentLocalVersion) {
              applyRemoteSyncSnapshot(payload.data, payload.version);
              if (onSyncUpdate) onSyncUpdate(payload.data);
            }
          }
        } catch {
          // ignore parsing error
        }
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isDestroyed) {
          setTimeout(connectSSE, 3000);
        }
      };
    } catch (err) {
      console.warn('SSE stream initialization skipped:', err);
    }
  };

  // Initial sequence
  fetchCloudFirst().then(() => {
    fetchLatestState();
  });
  connectSSE();

  // 4. Supabase Real-Time Subscriptions (postgres_changes / WebSockets)
  const unsubscribeSupabase = subscribeToAllSupabaseTables(() => {
    fetchCloudFirst();
    fetchLatestState();
  });

  // 5. Fallback polling loop (every 4s) to guarantee updates in WebViews
  pollInterval = setInterval(fetchLatestState, 4000);

  // 6. Foreground listeners: When user returns to AppCreator24 app or brings it from background
  const handleForeground = () => {
    fetchCloudFirst();
    fetchLatestState();
    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
      connectSSE();
    }
  };

  window.addEventListener('focus', handleForeground);
  window.addEventListener('online', handleForeground);
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      handleForeground();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // Return cleanup function
  return () => {
    isDestroyed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    unsubscribeSupabase();
    window.removeEventListener('focus', handleForeground);
    window.removeEventListener('online', handleForeground);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

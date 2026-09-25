import { fetchServerDatabase, syncKeyToServer } from './serverApi';
import { 
  populateLocalStorageFromServer, 
  loadMembers, 
  loadDeletedMemberIds,
  STORAGE_KEYS,
  notifyDataChange
} from './storage';
import { saveOfflineMembers, getOfflineMembers } from './offlineDb';
import { preloadMembersPhotos } from './photoPreloader';
import { sortMembersOldestFirst } from './helpers';

let isSyncing = false;
let syncIntervalTimer: any = null;

/**
 * Triggers a non-intrusive background synchronization with the server/cloud
 */
export async function triggerBackgroundSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return false;
  }
  if (isSyncing) return false;

  isSyncing = true;
  try {
    // 1. Fetch latest state from server
    const serverDb = await fetchServerDatabase();
    if (serverDb) {
      // 2. Additive non-destructive merge into LocalStorage
      populateLocalStorageFromServer(serverDb, true);

      // 3. Persist into IndexedDB for persistent offline availability
      const currentMembers = loadMembers();
      if (currentMembers.length > 0) {
        await saveOfflineMembers(currentMembers);
      }

      // 4. Preload and pre-decode any new member photos asynchronously
      preloadMembersPhotos(currentMembers);

      // 5. Notify in-app UI listeners smoothly
      notifyDataChange(STORAGE_KEYS.MEMBERS, currentMembers);
      return true;
    }
  } catch (err) {
    console.warn('[BackgroundSync] Sync check completed with offline fallback:', err);
  } finally {
    isSyncing = false;
  }
  return false;
}

/**
 * Initializes listeners for online recovery, tab focus, and periodic background sync
 */
export function initBackgroundSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('[BackgroundSync] Network restored. Running background sync...');
    // Slight debounce to ensure connection stability
    setTimeout(() => {
      triggerBackgroundSync().catch(() => {});
    }, 1200);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      triggerBackgroundSync().catch(() => {});
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Periodic heartbeat sync every 60 seconds when online
  syncIntervalTimer = setInterval(() => {
    if (navigator.onLine) {
      triggerBackgroundSync().catch(() => {});
    }
  }, 60000);

  return () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (syncIntervalTimer) {
      clearInterval(syncIntervalTimer);
      syncIntervalTimer = null;
    }
  };
}

// IndexedDB-based local offline persistence engine for সিলেট মানব সেবা সংগঠন
// Provides seamless offline storage, quota-free capacity (>50MB-1GB+), and instant retrieval

import { Member } from '../types';

const DB_NAME = 'pms_offline_db_v2';
const DB_VERSION = 1;

const STORES = {
  MEMBERS: 'members',
  PHOTOS: 'member_photos',
  METADATA: 'offline_metadata'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and opens the IndexedDB database
 */
export function getOfflineDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // 1. Members store: keyPath is id
        if (!db.objectStoreNames.contains(STORES.MEMBERS)) {
          db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
        }
        // 2. Member photos store: key is member ID or photo URL
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          db.createObjectStore(STORES.PHOTOS);
        }
        // 3. Metadata store: key-value store for other app data & timestamps
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        dbPromise = null;
        reject(request.error);
      };
    } catch (err) {
      console.warn('IndexedDB initialization failed:', err);
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Saves all member records permanently to local IndexedDB
 */
export async function saveOfflineMembers(members: Member[]): Promise<void> {
  if (!Array.isArray(members) || members.length === 0) return;
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.MEMBERS, STORES.METADATA], 'readwrite');
      const store = tx.objectStore(STORES.MEMBERS);
      const metaStore = tx.objectStore(STORES.METADATA);

      // Save all members
      for (const member of members) {
        if (member && member.id) {
          store.put(member);
        }
      }

      // Record count and timestamp
      metaStore.put(Date.now(), 'last_members_save_timestamp');
      metaStore.put(members.length, 'members_count');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save members to IndexedDB:', err);
  }
}

/**
 * Loads all member records from local IndexedDB
 */
export async function getOfflineMembers(): Promise<Member[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEMBERS, 'readonly');
      const store = tx.objectStore(STORES.MEMBERS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        resolve(records);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load members from IndexedDB:', err);
    return [];
  }
}

/**
 * Saves a member profile photo blob or data URL locally in IndexedDB
 */
export async function saveOfflinePhoto(key: string, data: Blob | string): Promise<void> {
  if (!key || !data) return;
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      const request = store.put(data, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save photo to IndexedDB:', err);
  }
}

/**
 * Retrieves a member profile photo from local IndexedDB
 */
export async function getOfflinePhoto(key: string): Promise<Blob | string | null> {
  if (!key) return null;
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const store = tx.objectStore(STORES.PHOTOS);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get photo from IndexedDB:', err);
    return null;
  }
}

/**
 * Saves arbitrary key-value metadata to IndexedDB
 */
export async function saveOfflineMetadata(key: string, value: any): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.METADATA, 'readwrite');
      const store = tx.objectStore(STORES.METADATA);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save metadata to IndexedDB:', err);
  }
}

/**
 * Retrieves arbitrary key-value metadata from IndexedDB
 */
export async function getOfflineMetadata<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.METADATA, 'readonly');
      const store = tx.objectStore(STORES.METADATA);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get metadata from IndexedDB:', err);
    return null;
  }
}

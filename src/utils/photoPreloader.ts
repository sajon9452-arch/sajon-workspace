import { Member } from '../types';
import { getMemberPhotoUrl } from './helpers';
import { getOfflinePhoto, saveOfflinePhoto } from './offlineDb';

// Dedicated CacheStorage name for PWA and offline member profile images
const PHOTO_CACHE_NAME = 'pms-member-photos-v2';

// In-Memory instant lookup sets & maps
export const loadedPhotoCache = new Set<string>();
export const failedPhotoCache = new Set<string>();
export const decodedPhotoCache = new Set<string>();
export const preloadedBlobUrlMap = new Map<string, string>();

const preloadPromiseMap = new Map<string, Promise<boolean>>();

/**
 * Synchronously retrieves the best, instant-ready image source for a member.
 * Checks in-memory Blob URL map first for true 0ms synchronous rendering.
 */
export function getInstantPhotoUrl(member?: Partial<Member> | null): string {
  if (!member) return '';
  const standardUrl = getMemberPhotoUrl(member);
  if (!standardUrl) return '';

  // 1. Data URLs are immediately available in memory
  if (standardUrl.startsWith('data:image/') || standardUrl.startsWith('blob:')) {
    return standardUrl;
  }

  // 2. Check if a pre-loaded local object URL exists in memory buffer
  if (preloadedBlobUrlMap.has(standardUrl)) {
    return preloadedBlobUrlMap.get(standardUrl)!;
  }

  if (member.id && preloadedBlobUrlMap.has(member.id)) {
    return preloadedBlobUrlMap.get(member.id)!;
  }

  return standardUrl;
}

/**
 * Checks if a given image URL is already resolved and held in browser/memory cache
 */
export function isPhotoPreloaded(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    loadedPhotoCache.add(trimmed);
    return true;
  }
  return loadedPhotoCache.has(trimmed) || preloadedBlobUrlMap.has(trimmed);
}

/**
 * Pre-fetches, pre-caches (IndexedDB & CacheStorage), and pre-decodes an image
 * off the main UI thread to guarantee zero frame drops and instant display.
 */
export async function preloadPhoto(url: string | null | undefined, memberId?: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // 1. Data URLs or existing Blob URLs are already local in memory
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    loadedPhotoCache.add(trimmed);
    if (!decodedPhotoCache.has(trimmed)) {
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = trimmed;
        if ('decode' in img && typeof img.decode === 'function') {
          await img.decode().catch(() => {});
        }
        decodedPhotoCache.add(trimmed);
      } catch {}
    }
    return true;
  }

  // If already preloaded and decoded in memory
  if (loadedPhotoCache.has(trimmed) && (preloadedBlobUrlMap.has(trimmed) || decodedPhotoCache.has(trimmed))) {
    return true;
  }

  if (failedPhotoCache.has(trimmed)) {
    return false;
  }

  const existingPromise = preloadPromiseMap.get(trimmed);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async (): Promise<boolean> => {
    try {
      // 2. Check IndexedDB for offline cached photo blob/data
      const idKey = memberId || trimmed;
      const offlineStored = await getOfflinePhoto(idKey).catch(() => null);
      if (offlineStored) {
        let objectUrl = '';
        if (typeof offlineStored === 'string') {
          objectUrl = offlineStored;
        } else if (offlineStored instanceof Blob) {
          objectUrl = URL.createObjectURL(offlineStored);
        }

        if (objectUrl) {
          preloadedBlobUrlMap.set(trimmed, objectUrl);
          if (memberId) preloadedBlobUrlMap.set(memberId, objectUrl);
          loadedPhotoCache.add(trimmed);

          // Asynchronous pre-decoding off the main thread
          const img = new Image();
          img.decoding = 'async';
          img.src = objectUrl;
          if ('decode' in img && typeof img.decode === 'function') {
            await img.decode().catch(() => {});
          }
          decodedPhotoCache.add(trimmed);
          return true;
        }
      }

      // 3. Check Web Cache API (CacheStorage)
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open(PHOTO_CACHE_NAME);
          const cachedResponse = await cache.match(trimmed);
          if (cachedResponse && cachedResponse.ok) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            preloadedBlobUrlMap.set(trimmed, objectUrl);
            if (memberId) preloadedBlobUrlMap.set(memberId, objectUrl);
            loadedPhotoCache.add(trimmed);

            // Save to IndexedDB for dual persistence
            saveOfflinePhoto(idKey, blob).catch(() => {});

            // Asynchronous pre-decoding off the main thread
            const img = new Image();
            img.decoding = 'async';
            img.src = objectUrl;
            if ('decode' in img && typeof img.decode === 'function') {
              await img.decode().catch(() => {});
            }
            decodedPhotoCache.add(trimmed);
            return true;
          }
        } catch (e) {
          // CacheStorage match error, continue to network fetch
        }
      }

      // 4. Fetch from network and populate CacheStorage + IndexedDB + Memory
      const response = await fetch(trimmed, { cache: 'force-cache' });
      if (!response.ok) {
        failedPhotoCache.add(trimmed);
        return false;
      }

      // Cache raw response in CacheStorage
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open(PHOTO_CACHE_NAME);
          cache.put(trimmed, response.clone()).catch(() => {});
        } catch {}
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Save to IndexedDB permanently
      saveOfflinePhoto(idKey, blob).catch(() => {});

      preloadedBlobUrlMap.set(trimmed, objectUrl);
      if (memberId) preloadedBlobUrlMap.set(memberId, objectUrl);
      loadedPhotoCache.add(trimmed);

      // Asynchronous pre-decoding off the main thread
      const img = new Image();
      img.decoding = 'async';
      img.src = objectUrl;
      if ('decode' in img && typeof img.decode === 'function') {
        await img.decode().catch(() => {});
      }
      decodedPhotoCache.add(trimmed);

      return true;
    } catch (err) {
      // Network failed or offline
      failedPhotoCache.add(trimmed);
      return false;
    } finally {
      preloadPromiseMap.delete(trimmed);
    }
  })();

  preloadPromiseMap.set(trimmed, promise);
  return promise;
}

/**
 * Preloads all member profile photos simultaneously into memory buffer and local stores.
 * Immediately invokes asynchronous decoding to ensure 0 frame drops and zero-delay scrolling.
 */
export function preloadMembersPhotos(members: Member[]): void {
  if (!Array.isArray(members) || members.length === 0) return;

  // Fire preloads concurrently with high priority
  for (const m of members) {
    if (!m) continue;
    const url = getMemberPhotoUrl(m);
    if (url) {
      preloadPhoto(url, m.id).catch(() => {});
    }
  }
}

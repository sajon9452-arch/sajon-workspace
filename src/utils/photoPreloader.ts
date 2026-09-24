import { Member } from '../types';
import { getMemberPhotoUrl } from './helpers';

// Persistent in-memory cache sets to eliminate image re-fetching and layout flashes
export const loadedPhotoCache = new Set<string>();
export const failedPhotoCache = new Set<string>();
const preloadPromiseMap = new Map<string, Promise<boolean>>();

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
  return loadedPhotoCache.has(trimmed);
}

/**
 * Pre-fetches and pre-decodes an image directly into the browser memory buffer
 */
export function preloadPhoto(url: string | null | undefined): Promise<boolean> {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  const trimmed = url.trim();
  if (!trimmed) return Promise.resolve(false);

  // Data URLs are already local in memory
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    loadedPhotoCache.add(trimmed);
    return Promise.resolve(true);
  }

  if (loadedPhotoCache.has(trimmed)) {
    return Promise.resolve(true);
  }

  if (failedPhotoCache.has(trimmed)) {
    return Promise.resolve(false);
  }

  const existing = preloadPromiseMap.get(trimmed);
  if (existing) {
    return existing;
  }

  const promise = new Promise<boolean>((resolve) => {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';

      img.onload = () => {
        loadedPhotoCache.add(trimmed);
        preloadPromiseMap.delete(trimmed);
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
        resolve(true);
      };

      img.onerror = () => {
        failedPhotoCache.add(trimmed);
        preloadPromiseMap.delete(trimmed);
        resolve(false);
      };

      img.src = trimmed;
    } catch {
      resolve(false);
    }
  });

  preloadPromiseMap.set(trimmed, promise);
  return promise;
}

/**
 * Preloads all member profile photos simultaneously into browser memory
 * Ensures instant 0ms appearance during directory navigation and fast scrolling
 */
export function preloadMembersPhotos(members: Member[]): void {
  if (!Array.isArray(members) || members.length === 0) return;

  for (const m of members) {
    if (!m) continue;
    const url = getMemberPhotoUrl(m);
    if (url) {
      preloadPhoto(url);
    }
  }
}

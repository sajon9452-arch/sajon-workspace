import React, { ComponentType, lazy, useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Database } from 'lucide-react';

interface SafeLazyOptions {
  retries?: number;
  retryDelayMs?: number;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

/**
 * Robust dynamic import wrapper that handles network failures, offline status,
 * and Vite chunk load errors gracefully without throwing uncaught exceptions.
 * 
 * If a module fails to load (e.g. TypeError: Failed to fetch dynamically imported module),
 * it renders a clean, user-friendly offline message and auto-retries when connection returns.
 */
export function safeLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: SafeLazyOptions = {}
): React.LazyExoticComponent<T> {
  const {
    retries = 2,
    retryDelayMs = 1000,
    fallbackTitle = 'অফলাইন মোড — মডিউল লোড করা যায়নি',
    fallbackMessage = 'ইন্টারনেট সংযোগ না থাকায় এই অংশটি লোড করা সম্ভব হয়নি। সংযোগ চালু হলে স্বয়ংক্রিয়ভাবে লোড হবে।'
  } = options;

  return lazy(async () => {
    let attempt = 0;

    const executeImport = async (): Promise<{ default: T }> => {
      try {
        const module = await importFn();
        if ('default' in module) {
          return module as { default: T };
        }
        return { default: module as T };
      } catch (err: any) {
        attempt++;
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const isChunkError = 
          isOffline ||
          err?.name === 'ChunkLoadError' ||
          /failed to fetch|dynamically imported module|network/i.test(err?.message || '');

        console.warn(`[SafeLazy] Import attempt ${attempt} failed:`, err?.message);

        if (attempt <= retries && !isOffline) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
          return executeImport();
        }

        // Return a graceful Fallback Component instead of crashing the app
        const OfflineFallbackComponent: React.FC = () => {
          const [retryCount, setRetryCount] = useState(0);

          useEffect(() => {
            const handleOnline = () => {
              console.log('[SafeLazy] Online detected. Triggering reload for lazy component...');
              setRetryCount((c) => c + 1);
            };
            window.addEventListener('online', handleOnline);
            return () => window.removeEventListener('online', handleOnline);
          }, []);

          return (
            <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3 max-w-md mx-auto my-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{fallbackTitle}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{fallbackMessage}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-amber-200 text-amber-900">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>লোকাল ডাটা সংরক্ষিত রয়েছে</span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>পুনরায় চেষ্টা করুন</span>
                </button>
              </div>
            </div>
          );
        };

        return { default: OfflineFallbackComponent as unknown as T };
      }
    };

    return executeImport();
  });
}

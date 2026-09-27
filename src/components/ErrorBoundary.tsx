import React, { ErrorInfo, ReactNode } from 'react';
import { WifiOff, RefreshCw, Home, Database, ShieldCheck, HeartHandshake } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onResetToHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isNetworkError: boolean;
}

/**
 * Checks whether an error is due to network failure, offline state, or dynamic chunk import failure.
 */
function isNetworkOrChunkError(error: Error | null): boolean {
  if (!error) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  
  const msg = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();
  
  return (
    msg.includes('failed to fetch') ||
    msg.includes('dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('chunkloaderror') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    name.includes('chunkloaderror')
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  private onlineListener: (() => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    const isNetwork = isNetworkOrChunkError(error);
    return {
      hasError: true,
      error,
      errorInfo: null,
      isNetworkError: isNetwork,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isNetwork = isNetworkOrChunkError(error);
    console.warn('[ErrorBoundary] Caught error (handled gracefully):', error.message, isNetwork ? '(Offline/Network)' : '');
    this.setState({ errorInfo, isNetworkError: isNetwork });
  }

  public componentDidMount() {
    // When internet connection is restored, automatically recover and retry
    this.onlineListener = () => {
      if (this.state.hasError && this.state.isNetworkError) {
        console.log('[ErrorBoundary] Internet connectivity restored. Auto-retrying...');
        this.handleRetry();
      }
    };
    window.addEventListener('online', this.onlineListener);
  }

  public componentWillUnmount() {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isNetworkError: false });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isNetworkError: false });
    if (this.props.onResetToHome) {
      this.props.onResetToHome();
    } else {
      try {
        window.location.hash = '';
        window.location.reload();
      } catch {
        window.location.href = '/';
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetwork = this.state.isNetworkError || (typeof navigator !== 'undefined' && !navigator.onLine);

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 selection:bg-emerald-200">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center space-y-5 animate-scaleUp">
            
            {/* Header Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
              isNetwork 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              {isNetwork ? (
                <WifiOff className="w-8 h-8 animate-pulse" />
              ) : (
                <HeartHandshake className="w-8 h-8" />
              )}
            </div>

            {/* Title & User-friendly Explanation in Bengali */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>অফলাইন মোড • লোকাল ডেটা সংরক্ষিত</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {isNetwork 
                  ? 'ইন্টারনেট সংযোগ অফলাইন মোডে রয়েছে' 
                  : 'সাময়িক সমস্যা হয়েছে — লোকাল ডেটা সুরক্ষিত'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isNetwork
                  ? 'ইন্টারনেট সংযোগ না থাকায় কিংবা ডাটা বন্ধ থাকার কারণে নেটওয়ার্ক রিকোয়েস্ট বিঘ্নিত হয়েছে। তবে আপনার ফোনের লোকাল মেমোরি ও ক্যাশে সংরক্ষিত সদস্য তালিকা, রক্তদাতা ও কার্যক্রমের সকল তথ্য সম্পূর্ণ অক্ষুণ্ণ ও নিরাপদ রয়েছে।'
                  : 'অ্যাপটিতে সাময়িক সমস্যা দেখা দিয়েছে, তবে আপনার ফোনের মেমোরিতে থাকা তথ্য সম্পূর্ণ অক্ষুণ্ণ রয়েছে। নিচের বাটনে ক্লিক করে পুনরায় চালু করুন।'}
              </p>
            </div>

            {/* Offline Safeguard Features Pill */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>অফলাইন ডেটা সুরক্ষা নিশ্চয়তা:</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 pl-6 list-disc">
                <li>সদস্য তালিকা ও বিস্তারিত প্রোফাইল অফলাইনে পড়া যাবে।</li>
                <li>ইন্টারনেট সংযোগ চালু হওয়ামাত্র স্বয়ংক্রিয়ভাবে সিঙ্ক সম্পন্ন হবে।</li>
              </ul>
            </div>

            {/* Action Buttons: Clean & Direct */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় লোড করুন</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>হোম পেজে ফিরে যান</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

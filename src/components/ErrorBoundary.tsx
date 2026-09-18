import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by App ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear potentially corrupted local session without deleting core keys
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-['Hind_Siliguri',sans-serif]">
                একটি সাময়িক ত্রুটি দেখা দিয়েছে
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-['Hind_Siliguri',sans-serif]">
                সিলেট মানব সেবা সংগঠন অ্যাপটিতে কাজ চলাকালীন সাময়িক কোনো ডাটা বা সংযোগ ত্রুটি ঘটেছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-rose-800 overflow-x-auto max-h-36">
                <div className="font-bold text-slate-700 mb-1">কারিগরি বিবরণ:</div>
                <div>{this.state.error.toString()}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer font-['Hind_Siliguri',sans-serif]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পেজ রিফ্রেশ করুন</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer font-['Hind_Siliguri',sans-serif]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় শুরু করুন</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

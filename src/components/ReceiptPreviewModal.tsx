import React, { useState } from 'react';
import { X, Download, Share2, Check, AlertCircle, FileCheck, ExternalLink } from 'lucide-react';
import { FundRecord } from '../types';
import { safeDownloadReceipt } from '../utils/receiptGenerator';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
  record: FundRecord | null;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  receiptUrl,
  record,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen || !receiptUrl || !record) return null;

  const memberNameClean = (record.memberName || 'Member').replace(/\s+/g, '_');
  const monthClean = (record.paidMonths || record.month || 'Receipt').replace(/\s+/g, '_');
  const filename = `Receipt_${memberNameClean}_${monthClean}.png`;

  const handleDownload = () => {
    try {
      const success = safeDownloadReceipt(receiptUrl, filename);
      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Receipt download triggered fallback:', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        // Convert data URL to Blob for native Web Share API
        const res = await fetch(receiptUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${record.memberName} - পেমেন্ট রসিদ`,
            text: `${record.memberName}-এর ডিজিটাল চাঁদা পরিশোধের রসিদ`,
            files: [file],
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2500);
          return;
        }
      }

      // Fallback: Copy or download
      handleDownload();
    } catch (err) {
      console.warn('Share not completed or cancelled:', err);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const win = window.open();
      if (win) {
        win.document.write(`<title>${filename}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${receiptUrl}" style="max-height:98vh;max-width:98vw;object-fit:contain;box-shadow:0 10px 30px rgba(0,0,0,0.5);border-radius:12px;" /></body>`);
      }
    } catch {
      // Ignore if blocked by browser
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  ডিজিটাল পেমেন্ট রসিদ
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  অনুমোদিত
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {record.memberName} • {record.paidMonths || record.month || 'চলতি মাস'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/50 flex-1">
          {/* AppCreator24 / Android WebView Safe Instruction Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-emerald-900">মোবাইল ও অ্যাপের জন্য সহজ নিয়ম: </span>
              রসিদটি আপনার ফোনে সরাসরি সেভ করতে নিচের ছবিটির উপর কিছুক্ষণ চেপে ধরে রাখুন (<strong>Long Press</strong>) এবং <strong>"Download image"</strong> বা <strong>"ছবি সংরক্ষণ করুন"</strong> চাপুন। এটি সব অ্যান্ড্রয়েড ফোনে শতভাগ ক্র্যাশ-মুক্তভাবে কাজ করে।
            </div>
          </div>

          {/* Receipt Image Display */}
          <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center p-1 sm:p-2">
            <img
              src={receiptUrl}
              alt={`${record.memberName} পেমেন্ট রসিদ`}
              className="max-h-[58vh] w-auto max-w-full object-contain rounded-xl select-none"
              style={{ WebkitTouchCallout: 'default' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            ডিজিটালভাবে স্বাক্ষরিত ও সংরক্ষিত রশিদ
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Open in new tab fallback */}
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="নতুন ট্যাবে দেখুন"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>বড় আকারে</span>
            </button>

            {/* Share Button (if supported) */}
            {'share' in navigator && (
              <button
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="শেয়ার করুন"
              >
                {shareSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-700" />
                    <span>শেয়ার সম্পন্ন!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>শেয়ার</span>
                  </>
                )}
              </button>
            )}

            {/* Safe Download Button */}
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="ডিভাইসে ডাউনলোড করুন"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>সংরক্ষিত হয়েছে!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ডাউনলোড / সংরক্ষণ</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

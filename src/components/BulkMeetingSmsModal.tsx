import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  X, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Square, 
  Smartphone, 
  Sparkles, 
  Phone, 
  Clock, 
  RotateCcw,
  CheckSquare,
  Square as EmptySquare,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck
} from 'lucide-react';
import { Member } from '../types';
import { toBengaliNumber } from '../utils/helpers';
import { 
  buildMeetingRecipients, 
  buildGroupSmsUrl, 
  sendSmsToRecipient,
  MeetingSmsRecipient 
} from '../utils/meetingSmsHelper';
import { loadMembers, saveMembers } from '../utils/storage';
import { fetchServerDatabase } from '../utils/serverApi';

interface BulkMeetingSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingType: 'কার্যকরী কমিটির মিটিং' | 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' | string;
  noticeText: string;
  noticeTitle?: string;
  members?: Member[];
  onNotifySuccess?: (msg: string) => void;
}

export const BulkMeetingSmsModal: React.FC<BulkMeetingSmsModalProps> = ({
  isOpen,
  onClose,
  meetingType,
  noticeText,
  noticeTitle,
  members,
  onNotifySuccess
}) => {
  const isExecutiveMeeting = !meetingType?.includes('সাধারণ') && !meetingType?.includes('উভয়') && (
    meetingType === 'কার্যকরী কমিটির মিটিং' || meetingType?.includes('কার্যকরী')
  );

  const [message, setMessage] = useState(noticeText);
  const [recipients, setRecipients] = useState<MeetingSmsRecipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    executiveCount: 0,
    generalCount: 0,
    validPhoneCount: 0,
    missingPhoneCount: 0
  });

  // Runner state
  const [isDispatching, setIsDispatching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [completedCount, setCompletedCount] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [allPhonesCopied, setAllPhonesCopied] = useState(false);
  const [delayMs, setDelayMs] = useState(1500);

  const dispatchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDispatchingRef = useRef(false);
  const isPausedRef = useRef(false);
  const recipientsRef = useRef<MeetingSmsRecipient[]>([]);

  // Sync state refs to prevent closure staleness
  isDispatchingRef.current = isDispatching;
  isPausedRef.current = isPaused;
  recipientsRef.current = recipients;

  const loadDynamicRecipients = () => {
    setMessage(noticeText);
    const storedMembers = loadMembers();
    // Dynamically choose whichever list holds all active members without hardcoded limits
    const dynamicMembers = (storedMembers && storedMembers.length >= (members?.length || 0))
      ? storedMembers
      : (members || []);

    const built = buildMeetingRecipients(meetingType, dynamicMembers);
    setRecipients(built.recipients);
    setStats({
      executiveCount: built.executiveCount,
      generalCount: built.generalCount,
      validPhoneCount: built.validPhoneCount,
      missingPhoneCount: built.missingPhoneCount
    });
    setIsDispatching(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    setCompletedCount(0);
  };

  // Initialize or re-populate dynamically when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDynamicRecipients();
    } else {
      if (dispatchTimerRef.current) {
        clearTimeout(dispatchTimerRef.current);
      }
    }
  }, [isOpen, meetingType, noticeText, members]);

  // Real-time Database Refresh
  const handleRefreshRecipients = async () => {
    setIsRefreshing(true);
    try {
      const serverDb = await fetchServerDatabase();
      if (serverDb && Array.isArray(serverDb.members) && serverDb.members.length > 0) {
        saveMembers(serverDb.members);
      }
    } catch {
      // Offline fallback
    }
    const freshMembers = loadMembers();
    const built = buildMeetingRecipients(meetingType, freshMembers);
    setRecipients(built.recipients);
    setStats({
      executiveCount: built.executiveCount,
      generalCount: built.generalCount,
      validPhoneCount: built.validPhoneCount,
      missingPhoneCount: built.missingPhoneCount
    });
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Filtered recipients for quick search
  const displayedRecipients = useMemo(() => {
    if (!searchTerm.trim()) return recipients;
    const q = searchTerm.trim().toLowerCase();
    return recipients.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.phone.includes(q) || 
      r.designation.toLowerCase().includes(q)
    );
  }, [recipients, searchTerm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dispatchTimerRef.current) {
        clearTimeout(dispatchTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const validRecipients = recipients.filter(r => r.isValidPhone);
  const selectedRecipients = recipients.filter(r => r.selected && r.isValidPhone);
  const totalSelected = selectedRecipients.length;
  const isAllValidSelected = validRecipients.length > 0 && validRecipients.every(r => r.selected);

  const handleToggleSelectAll = () => {
    if (isDispatching) return;
    // If search filter is applied, toggle only the filtered members
    if (searchTerm.trim()) {
      const targetIds = new Set(displayedRecipients.filter(r => r.isValidPhone).map(r => r.id));
      const allDisplayedSelected = displayedRecipients.filter(r => r.isValidPhone).every(r => r.selected);
      setRecipients(prev => prev.map(r => {
        if (targetIds.has(r.id)) {
          return { ...r, selected: !allDisplayedSelected };
        }
        return r;
      }));
    } else {
      setRecipients(prev => prev.map(r => ({
        ...r,
        selected: r.isValidPhone ? !isAllValidSelected : false
      })));
    }
  };

  const handleToggleRecipient = (id: string) => {
    if (isDispatching) return;
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(null as any), 2200);
  };

  const handleCopyAllPhones = () => {
    const phones = selectedRecipients.map(r => r.cleanPhone).filter(Boolean);
    if (phones.length === 0) return;
    navigator.clipboard.writeText(phones.join(', '));
    setAllPhonesCopied(true);
    setTimeout(() => setAllPhonesCopied(false), 2200);
  };

  const handleOpenGroupSms = () => {
    const phones = selectedRecipients.map(r => r.cleanPhone).filter(Boolean);
    if (phones.length === 0) return;
    const url = buildGroupSmsUrl(phones, message);
    window.location.href = url;
  };

  const handleSingleSms = (recipient: MeetingSmsRecipient) => {
    sendSmsToRecipient(recipient.cleanPhone, message);
    setRecipients(prev => prev.map(r => r.id === recipient.id ? { ...r, status: 'sent' } : r));
  };

  // Start Sequential Bulk Dispatch Runner
  const handleStartDispatch = () => {
    if (totalSelected === 0) return;

    setIsDispatching(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setCompletedCount(0);

    // Reset statuses of selected to idle
    setRecipients(prev => prev.map(r => r.selected && r.isValidPhone ? { ...r, status: 'idle' } : r));

    processNext(0);
  };

  const processNext = (index: number) => {
    const currentList = recipientsRef.current;
    const validSelected = currentList.filter(r => r.selected && r.isValidPhone);

    if (index >= validSelected.length) {
      // Finished all!
      setIsDispatching(false);
      setIsPaused(false);
      setCurrentIndex(-1);
      if (onNotifySuccess) {
        onNotifySuccess(`সকল ${toBengaliNumber(validSelected.length)} জন সদস্যের কাছে এসএমএস সফলভাবে প্রেরণ করা হয়েছে!`);
      }
      return;
    }

    if (!isDispatchingRef.current || isPausedRef.current) {
      return;
    }

    setCurrentIndex(index);
    const target = validSelected[index];

    // Auto-scroll target item into view smoothly
    try {
      const el = document.getElementById(`sms-recipient-row-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {}

    // Mark active sending
    setRecipients(prev => prev.map(r => r.id === target.id ? { ...r, status: 'sending' } : r));

    // Trigger SMS dispatch for this member
    sendSmsToRecipient(target.cleanPhone, message);

    // Mark as sent after brief dispatch and queue next with delay
    dispatchTimerRef.current = setTimeout(() => {
      setRecipients(prev => prev.map(r => r.id === target.id ? { ...r, status: 'sent' } : r));
      setCompletedCount(c => c + 1);

      // Check if paused or stopped before scheduling next
      if (isDispatchingRef.current && !isPausedRef.current) {
        processNext(index + 1);
      }
    }, delayMs);
  };

  const handlePauseDispatch = () => {
    setIsPaused(true);
    if (dispatchTimerRef.current) {
      clearTimeout(dispatchTimerRef.current);
    }
  };

  const handleResumeDispatch = () => {
    setIsPaused(false);
    // Continue from next item
    const nextIdx = completedCount;
    processNext(nextIdx);
  };

  const handleStopDispatch = () => {
    setIsDispatching(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    if (dispatchTimerRef.current) {
      clearTimeout(dispatchTimerRef.current);
    }
  };

  const progressPercent = totalSelected > 0 ? Math.min(100, Math.round((completedCount / totalSelected) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scaleUp my-4 max-h-[94vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
              isExecutiveMeeting 
                ? 'bg-purple-100 text-purple-700 ring-4 ring-purple-50' 
                : 'bg-indigo-100 text-indigo-700 ring-4 ring-indigo-50'
            }`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  সবার কাছে এসএমএস পাঠান (Bulk SMS Dispatch)
                </h3>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isExecutiveMeeting 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {isExecutiveMeeting ? (
                    <>
                      <ShieldCheck className="w-3 h-3" />
                      <span>কার্যকরী কমিটি মিটিং</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      <span>যৌথ সাধারণ সভা (উভয়)</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                সিলেট মানব সেবা সংগঠন • সম্পূর্ণ ডায়নামিক ও রিয়েল-টাইম এসএমএস সিস্টেম
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStopDispatch();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto space-y-4 py-3.5 pr-1 flex-1">
          
          {/* Target Audience Alert Card */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 ${
            isExecutiveMeeting 
              ? 'bg-purple-50/70 border-purple-200 text-purple-900' 
              : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isExecutiveMeeting ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <h4 className="text-xs sm:text-sm font-bold">
                  {isExecutiveMeeting 
                    ? `টার্গেট অডিয়েন্স: শুধুমাত্র কার্যকরী কমিটির সদস্যবৃন্দ (${toBengaliNumber(recipients.length)} জন)` 
                    : `টার্গেট অডিয়েন্স: কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ই (${toBengaliNumber(recipients.length)} জন)`}
                </h4>
                <span className="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60 text-slate-700">
                  {isExecutiveMeeting ? 'Executive Members Only' : 'Executive & General (All)'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                {isExecutiveMeeting 
                  ? `ডাটাবেজে সংরক্ষিত শুধুমাত্র কার্যকরী কমিটির সদস্যদের ফিল্টার করে মোট ${toBengaliNumber(recipients.length)} জনের তালিকা প্রস্তুত করা হয়েছে (কোনো সদস্য সংখ্যা সীমাবদ্ধতা নেই, নতুন সদস্য যোগ করলে স্বয়ংক্রিয়ভাবে তালিকায় আসবে)।` 
                  : `সংগঠনের কার্যকরী কমিটি (${toBengaliNumber(stats.executiveCount)} জন) ও সাধারণ সদস্য (${toBengaliNumber(stats.generalCount)} জন) মিলিয়ে মোট ${toBengaliNumber(recipients.length)} জন সদস্যের যৌথ তালিকা লোড করা হয়েছে।`}
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-medium text-slate-500">মোট টার্গেট সদস্য</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {toBengaliNumber(recipients.length)} জন
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <div className="text-[11px] font-medium text-emerald-700">বৈধ মোবাইল নম্বর</div>
              <div className="text-base font-bold text-emerald-900 mt-0.5">
                {toBengaliNumber(stats.validPhoneCount)} জন
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80">
              <div className="text-[11px] font-medium text-blue-700">প্রেরণের জন্য নির্বাচিত</div>
              <div className="text-base font-bold text-blue-900 mt-0.5">
                {toBengaliNumber(totalSelected)} জন
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80">
              <div className="text-[11px] font-medium text-amber-700">নম্বর অনুপস্থিত</div>
              <div className="text-base font-bold text-amber-900 mt-0.5">
                {toBengaliNumber(stats.missingPhoneCount)} জন
              </div>
            </div>
          </div>

          {/* Populated SMS Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>প্রেরণযোগ্য চূড়ান্ত এসএমএস বার্তা (Live SMS Text)</span>
              </label>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">কপি সম্পন্ন</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>টেক্সট কপি</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="এসএমএস বার্তা..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-normal text-slate-800 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none leading-relaxed transition"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>অক্ষর সংখ্যা: <strong>{toBengaliNumber(message.length)}</strong> টি</span>
              <span>প্রয়োজনে বার্তাটি পরিবর্তন বা পরিমার্জন করতে পারেন</span>
            </div>
          </div>

          {/* Active Dispatch Progress Bar */}
          {isDispatching && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-xs space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                  ধারাবাহিক এসএমএস পাঠানো হচ্ছে... ({toBengaliNumber(completedCount)}/{toBengaliNumber(totalSelected)})
                </span>
                <span>{toBengaliNumber(progressPercent)}%</span>
              </div>

              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-600 truncate max-w-[280px]">
                  {currentIndex >= 0 && selectedRecipients[currentIndex] && (
                    <span>বর্তমান: <strong>{selectedRecipients[currentIndex].name}</strong> ({selectedRecipients[currentIndex].cleanPhone})</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={handleResumeDispatch}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>চালু রাখুন</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseDispatch}
                      className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-amber-700 transition cursor-pointer"
                    >
                      <Pause className="w-3 h-3" />
                      <span>বিরতি দিন</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStopDispatch}
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition cursor-pointer"
                  >
                    <Square className="w-3 h-3" />
                    <span>থামান</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions & Group SMS Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDispatching || stats.validPhoneCount === 0}
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 transition cursor-pointer disabled:opacity-50"
              >
                {isAllValidSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <EmptySquare className="w-4 h-4 text-slate-400" />
                )}
                <span>সবাইকে নির্বাচন ({toBengaliNumber(totalSelected)}/{toBengaliNumber(stats.validPhoneCount)})</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshRecipients}
                disabled={isRefreshing || isDispatching}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-200/70"
                title="ডাটাবেজ থেকে রিয়েল-টাইম তালিকা রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3 h-3 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAllPhones}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer shadow-2xs"
                title="সকল মোবাইল নম্বর কমা দিয়ে কপি করুন"
              >
                {allPhonesCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>নম্বর কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>সব নম্বর কপি</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenGroupSms}
                className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer shadow-2xs"
                title="একত্রিত গ্রুপ এসএমএস অ্যাপ খুলুন"
              >
                <Smartphone className="w-3 h-3" />
                <span>গ্রুপ মেসেজ ওপেন</span>
              </button>
            </div>
          </div>

          {/* Recipient Member List */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 px-1">
              <span>টার্গেট প্রাপক সদস্যদের তালিকা ({toBengaliNumber(recipients.length)} জন)</span>
              
              {/* Quick Search Input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="সদস্য খুঁজুন (নাম বা ফোন)..."
                  className="w-full pl-8 pr-3 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white">
              {displayedRecipients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {searchTerm.trim() ? (
                    <span>"{searchTerm}" দিয়ে কোনো সদস্য পাওয়া যায়নি</span>
                  ) : isExecutiveMeeting ? (
                    <div className="space-y-1">
                      <div className="font-bold text-slate-700">কার্যকরী কমিটির কোনো সদস্য পাওয়া যায়নি</div>
                      <div className="text-[11px] text-slate-500">
                        এডমিন প্যানেল থেকে কার্যকরী সদস্যদের পদবি বা 'কার্যকরী কমিটি' ক্যাটাগরি যুক্ত করুন।
                      </div>
                    </div>
                  ) : (
                    <span>সংগঠনে কোনো সদস্য তালিকাভুক্ত নেই।</span>
                  )}
                </div>
              ) : (
                displayedRecipients.map((member, idx) => (
                  <div 
                    key={member.id}
                    id={`sms-recipient-row-${member.id}`}
                    className={`p-2.5 flex items-center justify-between gap-2 transition ${
                      member.status === 'sending'
                        ? 'bg-amber-50/80'
                        : member.status === 'sent'
                        ? 'bg-emerald-50/40'
                        : !member.selected
                        ? 'opacity-60 bg-slate-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        disabled={!member.isValidPhone || isDispatching}
                        onClick={() => handleToggleRecipient(member.id)}
                        className="text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                      >
                        {member.selected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <EmptySquare className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <span className="text-[11px] font-bold text-slate-400 w-6 shrink-0">
                        {toBengaliNumber(idx + 1)}.
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {member.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                            member.isExecutive
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {member.designation}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {member.phone ? member.phone : <span className="text-red-500 font-sans text-[10px]">নম্বর নেই</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status indicator */}
                      {member.status === 'sending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>পাঠানো হচ্ছে...</span>
                        </span>
                      )}
                      {member.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>সম্পন্ন</span>
                        </span>
                      )}
                      {member.status === 'idle' && (
                        <span className="text-[11px] text-slate-400">
                          অপেক্ষমাণ
                        </span>
                      )}

                      {/* Direct Single SMS Trigger */}
                      {member.isValidPhone && (
                        <button
                          type="button"
                          onClick={() => handleSingleSms(member)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title={`${member.name} কে সরাসরি এসএমএস পাঠান`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              handleStopDispatch();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            বাতিল
          </button>

          <div className="flex items-center gap-2">
            {!isDispatching ? (
              <button
                type="button"
                onClick={handleStartDispatch}
                disabled={totalSelected === 0}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 transition cursor-pointer ${
                  isExecutiveMeeting 
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
                <span>
                  সবার কাছে এসএমএস পাঠান ({toBengaliNumber(totalSelected)} জন)
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopDispatch}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                <span>প্রেরণ বন্ধ করুন</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

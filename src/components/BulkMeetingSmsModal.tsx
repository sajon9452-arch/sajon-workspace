import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, 
  X, 
  Users, 
  CheckCircle2, 
  Copy, 
  Check, 
  Play, 
  Smartphone, 
  Sparkles, 
  Phone, 
  Clock, 
  RotateCcw,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Member } from '../types';
import { toBengaliNumber } from '../utils/helpers';
import { 
  buildMeetingRecipients, 
  sendSmsToRecipient,
  isExecutiveMeetingType,
  MeetingSmsRecipient 
} from '../utils/meetingSmsHelper';
import { loadMembers, saveMembers } from '../utils/storage';
import { fetchServerDatabase } from '../utils/serverApi';

interface BulkMeetingSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingType: 'কার্যকরী কমিটির মিটিং' | 'যৌথ মিটিং' | 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' | string;
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
  const isExecutiveMeeting = isExecutiveMeetingType(meetingType);

  const [message, setMessage] = useState(noticeText);
  const [recipients, setRecipients] = useState<MeetingSmsRecipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'sent'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [lastSentMemberName, setLastSentMemberName] = useState<string | null>(null);

  // Load dynamically from database without any hardcoded counts
  const loadDynamicRecipients = () => {
    setMessage(noticeText);
    const storedMembers = loadMembers();
    // Prioritize whichever list holds live members
    const dynamicMembers = (storedMembers && storedMembers.length >= (members?.length || 0))
      ? storedMembers
      : (members || []);

    const built = buildMeetingRecipients(meetingType, dynamicMembers);
    setRecipients(built.recipients);
    setLastSentMemberName(null);
  };

  useEffect(() => {
    if (isOpen) {
      loadDynamicRecipients();
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
    
    // Preserve already-sent statuses when refreshing
    setRecipients(prev => {
      const sentIds = new Set(prev.filter(r => r.status === 'sent').map(r => r.id));
      return built.recipients.map(r => ({
        ...r,
        status: sentIds.has(r.id) ? ('sent' as const) : ('idle' as const)
      }));
    });

    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Dynamic Live Counts (No Hardcoded Numbers)
  const totalRecipientsCount = recipients.length;
  const validPhoneRecipients = useMemo(() => recipients.filter(r => r.isValidPhone), [recipients]);
  const validPhoneCount = validPhoneRecipients.length;
  const missingPhoneCount = recipients.length - validPhoneCount;
  
  const sentRecipients = useMemo(() => recipients.filter(r => r.status === 'sent'), [recipients]);
  const sentCount = sentRecipients.length;
  
  const pendingRecipients = useMemo(() => recipients.filter(r => r.status !== 'sent' && r.isValidPhone), [recipients]);
  const pendingCount = pendingRecipients.length;

  // Next Pending Member in Seniority Sequence
  const nextPendingMember = useMemo(() => {
    return recipients.find(r => r.status !== 'sent' && r.isValidPhone);
  }, [recipients]);

  // Individual SMS Dispatch
  const handleSendSingleSms = (recipient: MeetingSmsRecipient) => {
    if (!recipient.isValidPhone) return;

    // Launch strictly through external application intent (LaunchMode.externalApplication)
    sendSmsToRecipient(recipient.cleanPhone, message);

    // Update status to 'sent'
    setRecipients(prev => prev.map(r => r.id === recipient.id ? { ...r, status: 'sent' } : r));
    setLastSentMemberName(recipient.name);

    if (onNotifySuccess) {
      onNotifySuccess(`${recipient.name} এর জন্য এসএমএস অ্যাপ্লিকেশন সফলভাবে ওপেন হয়েছে`);
    }
  };

  // Sequential Next Pending SMS Sender
  const handleSendNextPendingSms = () => {
    if (!nextPendingMember) return;
    
    // Auto scroll row into view
    try {
      const el = document.getElementById(`sms-recipient-row-${nextPendingMember.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch {}

    handleSendSingleSms(nextPendingMember);
  };

  // Reset all statuses back to 'অপেক্ষমাণ'
  const handleResetStatuses = () => {
    setRecipients(prev => prev.map(r => ({ ...r, status: 'idle' })));
    setLastSentMemberName(null);
  };

  const handleCopyMessage = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(message);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2200);
  };

  // Filtered list based on search and tab
  const displayedRecipients = useMemo(() => {
    let list = recipients;
    if (filterTab === 'pending') {
      list = list.filter(r => r.status !== 'sent' && r.isValidPhone);
    } else if (filterTab === 'sent') {
      list = list.filter(r => r.status === 'sent');
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toLowerCase();
    return list.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.phone.includes(q) || 
      r.designation.toLowerCase().includes(q)
    );
  }, [recipients, filterTab, searchTerm]);

  const progressPercent = validPhoneCount > 0 ? Math.round((sentCount / validPhoneCount) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scaleUp my-4 max-h-[92dvh] flex flex-col overflow-hidden">
        
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
                  মিটিং নোটিশ এসএমএস প্রেরণ (Sequential SMS Dispatch)
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
                      <span>যৌথ সাধারণ সভা (সকল সদস্য)</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                সিলেট মানব সেবা সংগঠন • এক-এক করে ধারাবাহিক এসএমএস ও লাইভ স্ট্যাটাস ট্র্যাকিং
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto space-y-4 py-3.5 pr-1 flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          
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
                    ? `টার্গেট প্রাপক: শুধুমাত্র কার্যকরী কমিটির সদস্যবৃন্দ (${toBengaliNumber(totalRecipientsCount)} জন)` 
                    : `টার্গেট প্রাপক: কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ই (${toBengaliNumber(totalRecipientsCount)} জন)`}
                </h4>
                <span className="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60 text-slate-700">
                  {isExecutiveMeeting ? 'Executive Members Only' : 'Executive + General (All)'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                {isExecutiveMeeting 
                  ? `পদবি অনুযায়ী স্বয়ংক্রিয়ভাবে ফিল্টার করে মোট ${toBengaliNumber(totalRecipientsCount)} জন কার্যকরী কমিটির কর্মকর্তাদের প্রস্তুত করা হয়েছে। প্রতিটি সদস্যের পাশের 'এসএমএস পাঠান' বোতামে চাপ দিলে স্বয়ংক্রিয়ভাবে তার নম্বরে নোটিশ চলে যাবে।` 
                  : `সংগঠনের সকল কার্যকরী ও সাধারণ সদস্য মিলিয়ে মোট ${toBengaliNumber(totalRecipientsCount)} জনের তালিকা লোড হয়েছে। কোনো সীমাবদ্ধতা বা হার্ডকোডেড সংখ্যা ছাড়াই ডাটাবেজ থেকে লাইভ তৈরি।`}
              </p>
            </div>
          </div>

          {/* Dynamic Live Stats Tracking Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-medium text-slate-500">মোট টার্গেট সদস্য</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {toBengaliNumber(totalRecipientsCount)} জন
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <div className="text-[11px] font-medium text-emerald-700 flex items-center justify-between">
                <span>পাঠানো হয়েছে</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-emerald-900 mt-0.5">
                {toBengaliNumber(sentCount)} জন
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80">
              <div className="text-[11px] font-medium text-amber-700 flex items-center justify-between">
                <span>অপেক্ষমাণ</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-base font-bold text-amber-900 mt-0.5">
                {toBengaliNumber(pendingCount)} জন
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80">
              <div className="text-[11px] font-medium text-rose-700">নম্বর অনুপস্থিত</div>
              <div className="text-base font-bold text-rose-900 mt-0.5">
                {toBengaliNumber(missingPhoneCount)} জন
              </div>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          {validPhoneCount > 0 && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>এসএমএস প্রেরণের অগ্রগতি: {toBengaliNumber(sentCount)} / {toBengaliNumber(validPhoneCount)} জন</span>
                </span>
                <span className="font-bold text-emerald-700">{toBengaliNumber(progressPercent)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Populated SMS Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>প্রেরণযোগ্য চূড়ান্ত মিটিং নোটিশ (SMS Text)</span>
              </label>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">কপি সম্পন্ন</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>টেক্সট কপি</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="এসএমএস বার্তা..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-normal text-slate-800 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none leading-relaxed transition"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>অক্ষর সংখ্যা: <strong>{toBengaliNumber(message.length)}</strong> টি</span>
              <span>বার্তা পরিবর্তন করলে প্রতিটি সদস্যের কাছে পরিবর্তিত রূপেই যাবে</span>
            </div>
          </div>

          {/* Sequential One-Click Next Pending Banner */}
          {nextPendingMember && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 rounded-2xl border border-indigo-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-indigo-600" />
                  <span>ধারাবাহিক পরবর্তী অপেক্ষমাণ সদস্য</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{nextPendingMember.name}</span>
                  <span className="text-xs font-normal text-slate-600 font-mono">({nextPendingMember.phone})</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-md bg-white border border-slate-200 text-slate-700">
                    #{toBengaliNumber(nextPendingMember.serialNo)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendNextPendingSms}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition whitespace-nowrap"
                title={`${nextPendingMember.name} কে এসএমএস পাঠান`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>পরবর্তী সদস্যকে এসএমএস পাঠান</span>
              </button>
            </div>
          )}

          {/* Control Bar: Filter Tabs, Refresh, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সবাই ({toBengaliNumber(totalRecipientsCount)})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterTab === 'pending'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>অপেক্ষমাণ ({toBengaliNumber(pendingCount)})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('sent')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterTab === 'sent'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>পাঠানো হয়েছে ({toBengaliNumber(sentCount)})</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {sentCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetStatuses}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-700 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-200/70"
                  title="সকল স্ট্যাটাস পুনরায় অপেক্ষমাণ করুন"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>স্ট্যাটাস রিসেট</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRefreshRecipients}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-200/70"
                title="ডাটাবেজ থেকে রিয়েল-টাইম সদস্য সংখ্যা রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3 h-3 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ</span>
              </button>
            </div>
          </div>

          {/* Recipient Member List */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 px-1">
              <span>প্রাপক সদস্যদের তালিকা ({toBengaliNumber(displayedRecipients.length)} জন)</span>
              
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

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
              {displayedRecipients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {searchTerm.trim() ? (
                    <span>"{searchTerm}" দিয়ে কোনো সদস্য পাওয়া যায়নি</span>
                  ) : filterTab === 'pending' ? (
                    <span className="text-emerald-700 font-bold">সকল সদস্যের কাছে এসএমএস পাঠানো সম্পন্ন হয়েছে!</span>
                  ) : filterTab === 'sent' ? (
                    <span>এখনও কোনো সদস্যকে এসএমএস পাঠানো হয়নি।</span>
                  ) : (
                    <span>সংগঠনে কোনো সদস্য পাওয়া যায়নি।</span>
                  )}
                </div>
              ) : (
                displayedRecipients.map((member) => (
                  <div 
                    key={member.id}
                    id={`sms-recipient-row-${member.id}`}
                    className={`p-3 flex items-center justify-between gap-2 transition ${
                      member.status === 'sent'
                        ? 'bg-emerald-50/30'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-7 shrink-0 font-mono">
                        #{toBengaliNumber(member.serialNo)}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {member.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${
                            member.isExecutive
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {member.designation} {member.isExecutive ? '• কার্যকরী' : '• সাধারণ'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {member.phone ? member.phone : (
                            <span className="text-rose-500 font-sans text-[10px] font-semibold flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" />
                              নম্বর নেই
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Status indicator: 'অপেক্ষমাণ' vs 'পাঠানো হয়েছে' */}
                      {member.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>পাঠানো হয়েছে</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>অপেক্ষমাণ</span>
                        </span>
                      )}

                      {/* Direct Individual SMS Trigger Button */}
                      {member.isValidPhone ? (
                        <button
                          type="button"
                          onClick={() => handleSendSingleSms(member)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 ${
                            member.status === 'sent'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                          }`}
                          title={`${member.name} কে সরাসরি এসএমএস পাঠান`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{member.status === 'sent' ? 'পুনরায় পাঠান' : 'এসএমএস পাঠান'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic px-2">
                          অপ্রাপ্য
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generous bottom padding inside scrollable body */}
          <div className="h-6 w-full shrink-0" aria-hidden="true" />
        </div>

        {/* Modal Footer Actions - Strictly Clean, NO Bulk Group Send to All */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            বন্ধ করুন
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {lastSentMemberName && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>সর্বশেষ প্রেরিত: <strong>{lastSentMemberName}</strong></span>
              </span>
            )}
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-slate-700 border border-slate-200">
              মোট প্রেরিত: {toBengaliNumber(sentCount)} / {toBengaliNumber(validPhoneCount)} জন
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
